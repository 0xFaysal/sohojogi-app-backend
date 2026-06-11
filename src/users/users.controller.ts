import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/request-user.type';
import { UserDocument } from './schemas/user.schema';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: { user: RequestUser }) {
    const user = await this.usersService.findById(request.user.userId);
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: UserDocument) {
    const { password, refreshTokenHash, ...safeUser } = user.toObject();
    return safeUser;
  }
}
