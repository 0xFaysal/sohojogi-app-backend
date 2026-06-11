import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { ChatThread, ChatThreadDocument, ChatThreadType } from './schemas/chat-thread.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatThread.name) private readonly threadModel: Model<ChatThreadDocument>,
    @InjectModel(ChatMessage.name) private readonly messageModel: Model<ChatMessageDocument>,
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
