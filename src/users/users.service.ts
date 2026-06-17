import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { MerchantApplicationStatus, User, UserDocument } from './schemas/user.schema';

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  roles?: Role[];
  phone?: string;
  consumerProfile?: object;
  merchantProfile?: object;
  registrationLocation?: { lat: number; lng: number };
}

interface MerchantApplicationReviewInput {
  status: MerchantApplicationStatus.Approved | MerchantApplicationStatus.Rejected;
  reviewedBy: string;
  rejection?: {
    reason: string;
    tip?: string;
    rejectedSections?: string[];
    rejectedFields?: string[];
    acceptedSections?: string[];
  };
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
      registrationLocation: input.registrationLocation
        ? { ...input.registrationLocation, capturedAt: new Date() }
        : undefined,
      merchantProfile: input.merchantProfile
        ? {
            ...input.merchantProfile,
            applicationStatus: MerchantApplicationStatus.Draft,
          }
        : undefined,
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

  async findFirstByRole(role: Role): Promise<UserDocument> {
    const user = await this.userModel.findOne({ roles: role }).sort({ createdAt: 1 }).exec();
    if (!user) {
      throw new NotFoundException(`${role} user not found`);
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

  async recordLogin(userId: string, loginLocation?: { lat: number; lng: number }): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        lastLoginAt: new Date(),
        ...(loginLocation
          ? { lastLoginLocation: { ...loginLocation, capturedAt: new Date() } }
          : {}),
      })
      .exec();
  }

  async updateMerchantProfile(
    merchantId: string,
    merchantProfile: Record<string, unknown>,
    applicationStatus?: MerchantApplicationStatus,
    submitted = false,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        merchantId,
        {
          $set: {
            'merchantProfile.shopType': merchantProfile.shopType,
            'merchantProfile.shopPhone': merchantProfile.shopPhone,
            'merchantProfile.shopDescription': merchantProfile.shopDescription,
            'merchantProfile.operatingHours': merchantProfile.operatingHours,
            'merchantProfile.location': merchantProfile.location,
            'merchantProfile.documents': merchantProfile.documents,
            'merchantProfile.bank': merchantProfile.bank,
            ...(applicationStatus
              ? { 'merchantProfile.applicationStatus': applicationStatus }
              : {}),
            ...(submitted ? { 'merchantProfile.submittedAt': new Date() } : {}),
          },
          ...(submitted
            ? {
                $unset: {
                  'merchantProfile.rejection': '',
                  'merchantProfile.reviewedAt': '',
                  'merchantProfile.reviewedBy': '',
                  'merchantProfile.approvedAt': '',
                  'merchantProfile.rejectedAt': '',
                },
              }
            : {}),
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getMerchantSetupDraft(merchantId: string): Promise<Record<string, unknown> | null> {
    const user = await this.findById(merchantId);

    if (!user.merchantProfile) {
      return null;
    }

    const merchantProfile = user.merchantProfile as unknown as Record<string, unknown>;

    return {
      merchantDraftId: user.id,
      shopType: merchantProfile.shopType,
      shopPhone: merchantProfile.shopPhone,
      shopDescription: merchantProfile.shopDescription,
      operatingHours: merchantProfile.operatingHours,
      location: merchantProfile.location,
      documents: merchantProfile.documents,
      bank: merchantProfile.bank,
    };
  }

  async getMerchantApplicationStatus(merchantId: string): Promise<{
    status: MerchantApplicationStatus;
    rejection?: object;
  }> {
    const user = await this.findById(merchantId);
    const merchantProfile = user.merchantProfile as
      | (Record<string, unknown> & { applicationStatus?: MerchantApplicationStatus })
      | undefined;
    const status =
      merchantProfile?.applicationStatus === MerchantApplicationStatus.SetupRequired &&
      merchantProfile.submittedAt
        ? MerchantApplicationStatus.UnderReview
        : merchantProfile?.applicationStatus ?? MerchantApplicationStatus.Draft;

    return {
      status,
      rejection: user.merchantProfile?.rejection,
    };
  }

  async listMerchantApplications(status?: MerchantApplicationStatus) {
    const query: Record<string, unknown> = {
      roles: Role.Merchant,
      merchantProfile: { $exists: true },
    };

    if (status === MerchantApplicationStatus.UnderReview) {
      query.$or = [
        { 'merchantProfile.applicationStatus': MerchantApplicationStatus.UnderReview },
        {
          'merchantProfile.applicationStatus': MerchantApplicationStatus.SetupRequired,
          'merchantProfile.submittedAt': { $exists: true },
        },
      ];
    } else if (status) {
      query['merchantProfile.applicationStatus'] = status;
    } else {
      query.$or = [
        {
          'merchantProfile.applicationStatus': {
            $in: [
              MerchantApplicationStatus.UnderReview,
              MerchantApplicationStatus.Rejected,
              MerchantApplicationStatus.Approved,
            ],
          },
        },
        {
          'merchantProfile.applicationStatus': MerchantApplicationStatus.SetupRequired,
          'merchantProfile.submittedAt': { $exists: true },
        },
      ];
    }

    const users = await this.userModel
      .find(query)
      .sort({ 'merchantProfile.submittedAt': -1, updatedAt: -1 })
      .exec();

    return users.map((user) => this.toAdminMerchantApplication(user));
  }

  async getMerchantApplicationForAdmin(merchantId: string) {
    const user = await this.userModel
      .findOne({ _id: merchantId, roles: Role.Merchant, merchantProfile: { $exists: true } })
      .exec();

    if (!user) {
      throw new NotFoundException('Merchant application not found');
    }

    return this.toAdminMerchantApplication(user);
  }

  async updateMerchantApplicationReview(
    merchantId: string,
    input: MerchantApplicationReviewInput,
  ): Promise<void> {
    const now = new Date();
    const set: Record<string, unknown> = {
      'merchantProfile.applicationStatus': input.status,
      'merchantProfile.reviewedAt': now,
      'merchantProfile.reviewedBy': input.reviewedBy,
    };
    const unset: Record<string, string> = {};

    if (input.status === MerchantApplicationStatus.Approved) {
      set['merchantProfile.approvedAt'] = now;
      unset['merchantProfile.rejection'] = '';
      unset['merchantProfile.rejectedAt'] = '';
    }

    if (input.status === MerchantApplicationStatus.Rejected) {
      set['merchantProfile.rejectedAt'] = now;
      set['merchantProfile.rejection'] = {
        reason: input.rejection?.reason,
        tip: input.rejection?.tip,
        rejectedSections: input.rejection?.rejectedSections ?? [],
        rejectedFields: input.rejection?.rejectedFields ?? [],
        acceptedSections: input.rejection?.acceptedSections ?? [],
      };
      unset['merchantProfile.approvedAt'] = '';
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        merchantId,
        {
          $set: set,
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { new: true },
      )
      .exec();

    if (!user) {
      throw new NotFoundException('Merchant application not found');
    }
  }

  private toAdminMerchantApplication(user: UserDocument) {
    const merchantProfile = (user.merchantProfile ?? {}) as Record<string, unknown>;
    const objectUser = user.toObject() as unknown as Record<string, unknown>;
    const applicationStatus =
      merchantProfile.applicationStatus === MerchantApplicationStatus.SetupRequired &&
      merchantProfile.submittedAt
        ? MerchantApplicationStatus.UnderReview
        : merchantProfile.applicationStatus ?? MerchantApplicationStatus.Draft;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      emailVerifiedAt: user.emailVerifiedAt,
      registrationLocation: objectUser.registrationLocation,
      lastLoginAt: user.lastLoginAt,
      lastLoginLocation: objectUser.lastLoginLocation,
      createdAt: objectUser.createdAt,
      updatedAt: objectUser.updatedAt,
      merchantProfile: {
        shopName: merchantProfile.shopName,
        ownerName: merchantProfile.ownerName,
        phone: merchantProfile.phone,
        shopType: merchantProfile.shopType,
        shopPhone: merchantProfile.shopPhone,
        shopDescription: merchantProfile.shopDescription,
        operatingHours: merchantProfile.operatingHours,
        location: merchantProfile.location,
        documents: merchantProfile.documents,
        bank: merchantProfile.bank,
        applicationStatus,
        rejection: merchantProfile.rejection,
        submittedAt: merchantProfile.submittedAt,
        reviewedAt: merchantProfile.reviewedAt,
        reviewedBy: merchantProfile.reviewedBy,
        approvedAt: merchantProfile.approvedAt,
        rejectedAt: merchantProfile.rejectedAt,
      },
    };
  }
}
