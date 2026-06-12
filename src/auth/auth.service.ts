import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { getConfigNumber } from '../common/utils/config-number.util';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/schemas/otp.schema';
import { EmailDto } from './dto/email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      getConfigNumber(this.configService, 'BCRYPT_SALT_ROUNDS', 12),
    );
    const user = await this.usersService.create({
      ...registerDto,
      roles: this.getSelfRegistrationRoles(registerDto.roles),
      password: hashedPassword,
    });

    await this.otpService.requestOtp({
      email: user.email,
      purpose: OtpPurpose.EmailVerification,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.recordLogin(user.id, loginDto.loginLocation);

    return this.buildAuthResponse(user);
  }

  async profile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.sanitizeUser(user);
  }

  async resendVerificationOtp(dto: EmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the email exists, a verification code has been sent' };
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    await this.otpService.requestOtp({
      email: user.email,
      purpose: OtpPurpose.EmailVerification,
    });

    return { message: 'Verification code sent successfully' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    await this.otpService.consumeOtp({
      email: dto.email,
      code: dto.code,
      purpose: OtpPurpose.EmailVerification,
    });

    const user = await this.usersService.markEmailVerified(dto.email);
    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(user),
    };
  }

  async forgotPassword(dto: EmailDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (user) {
      await this.otpService.requestOtp({
        email: user.email,
        purpose: OtpPurpose.PasswordReset,
      });
    }

    return { message: 'If the email exists, a password reset code has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.otpService.consumeOtp({
      email: dto.email,
      code: dto.code,
      purpose: OtpPurpose.PasswordReset,
    });

    const hashedPassword = await this.hashSecret(dto.newPassword);
    await this.usersService.updatePasswordByEmail(dto.email, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValidRefreshToken = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isValidRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user);
  }

  async logout(userId: string) {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.usersService.findByIdWithPassword(userId);
    const currentPasswordMatches = await bcrypt.compare(dto.currentPassword, user.password);
    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await this.hashSecret(dto.newPassword);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  private async buildAuthResponse(user: UserDocument) {
    const payload = this.getJwtPayload(user);
    const tokens = await this.signTokens(payload);
    await this.usersService.setRefreshTokenHash(user.id, await this.hashSecret(tokens.refreshToken));

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  private getJwtPayload(user: UserDocument): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
  }

  private async signTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '1h') as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d') as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private hashSecret(secret: string) {
    return bcrypt.hash(secret, getConfigNumber(this.configService, 'BCRYPT_SALT_ROUNDS', 12));
  }

  private getSelfRegistrationRoles(roles?: Role[]) {
    const allowedRoles = new Set([Role.Consumer, Role.Merchant, Role.Dealer]);
    const requestedRoles = roles?.filter((role) => allowedRoles.has(role)) ?? [];

    return requestedRoles.length ? requestedRoles : [Role.Consumer];
  }

  private sanitizeUser(user: UserDocument) {
    const { password, refreshTokenHash, ...safeUser } = user.toObject();
    return {
      ...safeUser,
      merchantApplicationStatus: safeUser.merchantProfile?.applicationStatus,
      merchantApplicationRejection: safeUser.merchantProfile?.rejection,
    };
  }
}
