import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Model } from 'mongoose';
import { getConfigNumber } from '../common/utils/config-number.util';
import { EmailService } from '../email/email.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Otp, OtpDocument } from './schemas/otp.schema';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const email = dto.email.toLowerCase();
    const expiryMinutes = getConfigNumber(this.configService, 'OTP_EXPIRY_MINUTES', 10);
    const saltRounds = getConfigNumber(this.configService, 'BCRYPT_SALT_ROUNDS', 12);
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, saltRounds);

    await this.otpModel.updateMany(
      { email, purpose: dto.purpose, consumedAt: null },
      { consumedAt: new Date() },
    );

    await this.otpModel.create({
      email,
      purpose: dto.purpose,
      codeHash,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    });

    await this.emailService.sendOtp(email, code, expiryMinutes);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    await this.consumeOtp(dto);

    return { verified: true, email: dto.email.toLowerCase(), purpose: dto.purpose };
  }

  async consumeOtp(dto: VerifyOtpDto): Promise<void> {
    const email = dto.email.toLowerCase();
    const maxAttempts = getConfigNumber(this.configService, 'OTP_MAX_ATTEMPTS', 5);
    const otpRecord = await this.otpModel
      .findOne({
        email,
        purpose: dto.purpose,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .select('+codeHash')
      .sort({ createdAt: -1 })
      .exec();

    if (!otpRecord) {
      throw new BadRequestException('OTP is invalid or expired');
    }

    if (otpRecord.attempts >= maxAttempts) {
      throw new HttpException('Maximum OTP attempts exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    otpRecord.attempts += 1;
    const isValid = await bcrypt.compare(dto.code, otpRecord.codeHash);

    if (!isValid) {
      await otpRecord.save();
      throw new BadRequestException('OTP is invalid or expired');
    }

    otpRecord.consumedAt = new Date();
    await otpRecord.save();
  }
}
