import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { getConfigNumber } from '../common/utils/config-number.util';
import { UsersService } from './users.service';

@Injectable()
export class SuperAdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

    if (!email || !password) {
      return;
    }

    const exists = await this.usersService.existsByEmail(email);
    if (exists) {
      return;
    }

    const hashedPassword = await bcrypt.hash(
      password,
      getConfigNumber(this.configService, 'BCRYPT_SALT_ROUNDS', 12),
    );

    await this.usersService.create({
      username: 'Super Admin',
      email,
      password: hashedPassword,
      roles: [Role.Admin],
    });

    this.logger.log('Super admin user created from environment configuration');
  }
}
