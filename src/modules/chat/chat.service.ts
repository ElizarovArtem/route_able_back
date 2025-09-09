import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../../entities/chat.entity';
import { ChatParticipant } from '../../entities/chat-participant.entity';
import { Message } from '../../entities/message.entity';
import { RelationsService } from '../relations/relations.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    @InjectRepository(ChatParticipant)
    private chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    private readonly relations: RelationsService,
  ) {}

  async startChat(initiatorId: string, otherUserId: string) {
    const link = await this.relations.ensureLinkWithCoach(
      initiatorId,
      otherUserId,
    );

    let chat = await this.chatRepository.findOne({
      where: { clientCoachId: link.id },
    });
    if (!chat) {
      chat = await this.chatRepository.save(
        this.chatRepository.create({ clientCoachId: link.id }),
      );
      await this.chatParticipantRepository.save([
        this.chatParticipantRepository.create({
          chatId: chat.id,
          userId: link.clientId,
        }),
        this.chatParticipantRepository.create({
          chatId: chat.id,
          userId: link.coachId,
        }),
      ]);
    }
    return chat;
  }

  async getMyChats(userId: string) {
    const qb = this.chatRepository
      .createQueryBuilder('c')
      .innerJoin(
        'chat_participants',
        'me',
        'me.chatId = c.id AND me.userId = :userId',
        { userId },
      )
      .innerJoin(
        'chat_participants',
        'other',
        'other.chatId = c.id AND other.userId <> :userId',
        { userId },
      )
      .innerJoin('users', 'u', 'u.id = other.userId')
      .leftJoin('client_coach', 'tc', 'tc.id = c.clientCoachId')
      .select([
        'c.id AS id',
        'c.clientCoachId AS "clientCoachId"',
        'u.id AS "partnerId"',
        'u.name AS "partnerName"',
        'u.avatar AS "partnerAvatar"',
      ])
      .orderBy('c.id', 'DESC');

    const rows = await qb.getRawMany();
    return rows.map((row) => ({
      id: row.id,
      clientCoachId: row.clientCoachId,
      partner: {
        id: row.partnerId,
        name: row.partnerName,
        avatarUrl: row.partnerAvatar,
      },
    }));
  }

  async getMessages(
    userId: string,
    chatId: string,
    limit = 50,
    cursor?: string,
  ) {
    const isParticipant = await this.chatParticipantRepository.findOne({
      where: { chatId, userId },
    });
    if (!isParticipant) throw new ForbiddenException('Не участник чата');

    const qb = this.messageRepository
      .createQueryBuilder('m')
      .where('m.chatId = :chatId', { chatId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit);

    if (cursor) qb.andWhere('m.createdAt < :cursor::timestamptz', { cursor });

    const list = await qb.getMany();
    return list.reverse();
  }

  async sendMessage(userId: string, chatId: string, text: string) {
    const isParticipant = await this.chatParticipantRepository.findOne({
      where: { chatId, userId },
    });
    if (!isParticipant) throw new ForbiddenException('Не участник чата');
    return this.messageRepository.save(
      this.messageRepository.create({ chatId, authorId: userId, text }),
    );
  }
}
