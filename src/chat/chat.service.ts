import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import {
  ChatThread,
  ChatThreadDocument,
  ChatThreadPurpose,
  ChatThreadType,
} from './schemas/chat-thread.schema';
import {
  SupportConversation,
  SupportConversationDocument,
} from './schemas/support-conversation.schema';
import { SupportMessage, SupportMessageDocument } from './schemas/support-message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatThread.name) private readonly threadModel: Model<ChatThreadDocument>,
    @InjectModel(ChatMessage.name) private readonly messageModel: Model<ChatMessageDocument>,
    @InjectModel(SupportConversation.name)
    private readonly supportConversationModel: Model<SupportConversationDocument>,
    @InjectModel(SupportMessage.name)
    private readonly supportMessageModel: Model<SupportMessageDocument>,
    private readonly usersService: UsersService,
  ) {}

  async sendMessage(senderId: string, dto: SendMessageDto) {
    const thread = await this.resolveThread(senderId, dto);

    const message = await this.messageModel.create({
      threadId: thread._id,
      sender: new Types.ObjectId(senderId),
      receiver: dto.receiverId ? new Types.ObjectId(dto.receiverId) : undefined,
      groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : undefined,
      type: dto.type,
      content: dto.content,
      readBy: [new Types.ObjectId(senderId)],
    });

    thread.lastMessageAt = new Date();
    await thread.save();

    return message.populate('sender', 'username email roles');
  }

  async getThreadsForUser(userId: string) {
    return this.threadModel
      .find({ participants: userId })
      .populate('participants', 'username email roles bakiScore')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();
  }

  async getDealerSupportThread(dealerId: string) {
    const dealer = await this.usersService.findById(dealerId);
    if (!dealer.roles.includes(Role.Dealer)) {
      throw new ForbiddenException('Only dealer accounts can open dealer support chat');
    }

    const admin = await this.usersService.findFirstByRole(Role.Admin);
    const participants = [new Types.ObjectId(dealerId), admin._id];
    const existingThread = await this.threadModel
      .findOne({
        type: ChatThreadType.Direct,
        purpose: ChatThreadPurpose.DealerSupport,
        participants: { $all: participants, $size: 2 },
      })
      .populate('participants', 'username email roles')
      .exec();

    if (existingThread) {
      return existingThread;
    }

    return this.threadModel.create({
      type: ChatThreadType.Direct,
      purpose: ChatThreadPurpose.DealerSupport,
      title: 'Dealer Support',
      participants,
    });
  }

  async getDealerSupportThreadsForAdmin(adminId: string) {
    const admin = await this.usersService.findById(adminId);
    if (!admin.roles.includes(Role.Admin)) {
      throw new ForbiddenException('Only admins can view support inbox');
    }

    const threads = await this.threadModel
      .find({ purpose: ChatThreadPurpose.DealerSupport, participants: adminId })
      .populate('participants', 'username email roles')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();

    return Promise.all(threads.map((thread) => this.withLastMessage(thread)));
  }

  async getPublicSupportConversation(input: {
    visitorId: string;
    visitorName?: string;
    visitorEmail?: string;
    visitorPhone?: string;
  }) {
    const existingConversation = await this.supportConversationModel
      .findOne({ visitorId: input.visitorId })
      .exec();

    if (existingConversation) {
      return existingConversation;
    }

    const admin = await this.usersService.findFirstByRole(Role.Admin);
    return this.supportConversationModel.create({
      visitorId: input.visitorId,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail,
      visitorPhone: input.visitorPhone,
      assignedAdmin: admin._id,
      status: 'open',
    });
  }

  async getPublicSupportMessages(conversationId: string, visitorId: string) {
    const conversation = await this.supportConversationModel
      .findOne({ _id: conversationId, visitorId })
      .exec();

    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    return this.supportMessageModel
      .find({ conversation: conversation._id })
      .populate('admin', 'username email roles')
      .sort({ createdAt: 1 })
      .exec();
  }

  async sendPublicSupportMessage(input: {
    visitorId: string;
    content: string;
    visitorName?: string;
    visitorEmail?: string;
    visitorPhone?: string;
  }) {
    const conversation = await this.getPublicSupportConversation(input);
    const message = await this.supportMessageModel.create({
      conversation: conversation._id,
      senderType: 'visitor',
      content: input.content,
      readByVisitor: true,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    return message.populate('admin', 'username email roles');
  }

  async getPublicSupportThreadsForAdmin(adminId: string) {
    const admin = await this.usersService.findById(adminId);
    if (!admin.roles.includes(Role.Admin)) {
      throw new ForbiddenException('Only admins can view support inbox');
    }

    const conversations = await this.supportConversationModel
      .find({})
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .exec();

    return Promise.all(conversations.map((conversation) => this.withSupportLastMessage(conversation)));
  }

  async getPublicSupportMessagesForAdmin(adminId: string, conversationId: string) {
    const admin = await this.usersService.findById(adminId);
    if (!admin.roles.includes(Role.Admin)) {
      throw new ForbiddenException('Only admins can view support messages');
    }

    return this.supportMessageModel
      .find({ conversation: conversationId })
      .populate('admin', 'username email roles')
      .sort({ createdAt: 1 })
      .exec();
  }

  async sendPublicSupportAdminReply(adminId: string, conversationId: string, content: string) {
    const admin = await this.usersService.findById(adminId);
    if (!admin.roles.includes(Role.Admin)) {
      throw new ForbiddenException('Only admins can reply to support messages');
    }

    const conversation = await this.supportConversationModel.findById(conversationId).exec();
    if (!conversation) {
      throw new NotFoundException('Support conversation not found');
    }

    const message = await this.supportMessageModel.create({
      conversation: conversation._id,
      senderType: 'admin',
      admin: admin._id,
      content,
      readByAdmin: true,
    });

    conversation.assignedAdmin = admin._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return message.populate('admin', 'username email roles');
  }

  async sendDealerSupportMessage(senderId: string, content: string, threadId?: string) {
    const sender = await this.usersService.findById(senderId);
    let thread: ChatThreadDocument;

    if (sender.roles.includes(Role.Dealer)) {
      thread = await this.getDealerSupportThread(senderId);
    } else if (sender.roles.includes(Role.Admin)) {
      if (!threadId) {
        throw new BadRequestException('threadId is required for admin support replies');
      }

      thread = await this.ensureParticipant(threadId, senderId);
      if (thread.purpose !== ChatThreadPurpose.DealerSupport) {
        throw new ForbiddenException('This is not a dealer support thread');
      }
    } else {
      throw new ForbiddenException('Only dealers and admins can use dealer support chat');
    }

    const receiver = thread.participants.find((participant) => participant.toString() !== senderId);
    const message = await this.messageModel.create({
      threadId: thread._id,
      sender: new Types.ObjectId(senderId),
      receiver,
      type: ChatThreadType.Direct,
      content,
      readBy: [new Types.ObjectId(senderId)],
    });

    thread.lastMessageAt = new Date();
    await thread.save();

    return message.populate('sender', 'username email roles');
  }

  async getMessages(threadId: string, userId: string) {
    await this.ensureParticipant(threadId, userId);
    return this.messageModel
      .find({ threadId })
      .populate('sender', 'username email roles')
      .populate('receiver', 'username email roles')
      .sort({ createdAt: 1 })
      .exec();
  }

  async markRead(threadId: string, userId: string) {
    await this.ensureParticipant(threadId, userId);
    await this.messageModel.updateMany(
      { threadId, readBy: { $ne: userId } },
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
    );

    return { threadId, readBy: userId };
  }

  async getThread(threadId: string) {
    const thread = await this.threadModel.findById(threadId).exec();
    if (!thread) {
      throw new NotFoundException('Chat thread not found');
    }

    return thread;
  }

  private async withLastMessage(thread: ChatThreadDocument) {
    const lastMessage = await this.messageModel
      .findOne({ threadId: thread._id })
      .populate('sender', 'username email roles')
      .sort({ createdAt: -1 })
      .exec();

    const objectThread = thread.toObject();
    return {
      ...objectThread,
      id: thread.id,
      lastMessage,
    };
  }

  private async withSupportLastMessage(conversation: SupportConversationDocument) {
    const lastMessage = await this.supportMessageModel
      .findOne({ conversation: conversation._id })
      .populate('admin', 'username email roles')
      .sort({ createdAt: -1 })
      .exec();

    const objectConversation = conversation.toObject();
    return {
      ...objectConversation,
      id: conversation.id,
      lastMessage,
    };
  }

  private async resolveThread(senderId: string, dto: SendMessageDto) {
    if (dto.threadId) {
      return this.ensureParticipant(dto.threadId, senderId);
    }

    if (dto.type === ChatThreadType.Direct) {
      if (!dto.receiverId) {
        throw new BadRequestException('receiverId is required for direct messages');
      }

      const participants = [new Types.ObjectId(senderId), new Types.ObjectId(dto.receiverId)];
      const existingThread = await this.threadModel
        .findOne({
          type: ChatThreadType.Direct,
          participants: { $all: participants, $size: 2 },
        })
        .exec();

      if (existingThread) {
        return existingThread;
      }

      return this.threadModel.create({ type: ChatThreadType.Direct, participants });
    }

    if (!dto.groupId) {
      throw new BadRequestException('groupId is required for group messages');
    }

    const existingGroupThread = await this.threadModel
      .findOne({ type: ChatThreadType.Group, groupBuy: dto.groupId })
      .exec();

    if (existingGroupThread) {
      if (!existingGroupThread.participants.some((id) => id.toString() === senderId)) {
        existingGroupThread.participants.push(new Types.ObjectId(senderId));
        await existingGroupThread.save();
      }
      return existingGroupThread;
    }

    return this.threadModel.create({
      type: ChatThreadType.Group,
      groupBuy: new Types.ObjectId(dto.groupId),
      title: dto.title ?? 'Cooperative buying discussion',
      participants: [new Types.ObjectId(senderId)],
    });
  }

  private async ensureParticipant(threadId: string, userId: string) {
    const thread = await this.getThread(threadId);
    if (!thread.participants.some((participant) => participant.toString() === userId)) {
      throw new ForbiddenException('You are not a participant in this chat thread');
    }

    return thread;
  }
}
