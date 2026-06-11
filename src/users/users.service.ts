import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { User, UserDocument } from './schemas/user.schema';

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  roles?: Role[];
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const existingUser = await this.userModel.exists({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    return this.userModel.create({
      ...input,
      email: input.email.toLowerCase(),
      roles: input.roles?.length ? input.roles : [Role.Consumer],
    });
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password');
    }

    return query.exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.exists({ email: email.toLowerCase() });
    return Boolean(user);
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdWithPassword(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('+password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('+refreshTokenHash').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateBakiScore(userId: string, delta: number): Promise<UserDocument> {
    const user = await this.findById(userId);
    user.bakiScore = Math.max(0, Math.min(1000, user.bakiScore + delta));
    return user.save();
  }

  async markEmailVerified(email: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { emailVerifiedAt: new Date() },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePassword(userId: string, password: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          password,
          passwordChangedAt: new Date(),
          $unset: { refreshTokenHash: '' },
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updatePasswordByEmail(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          password,
          passwordChangedAt: new Date(),
          $unset: { refreshTokenHash: '' },
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: '' } }).exec();
  }
}
