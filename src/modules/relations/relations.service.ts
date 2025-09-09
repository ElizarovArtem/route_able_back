import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { Roles } from '../../config/emuns/user';
import { RelationView } from './dto/relations-view.dto';
import { Chat } from '../../entities/chat.entity';

@Injectable()
export class RelationsService {
  constructor(
    @InjectRepository(ClientCoach) private links: Repository<ClientCoach>,
    @InjectRepository(Chat) private chats: Repository<Chat>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  /**
   * Инициатор = Trainee, второй пользователь обязан быть Coach.
   * Возвращает существующую или создаёт новую активную связь.
   */
  async ensureLinkWithCoach(initiatorId: string, otherUserId: string) {
    if (initiatorId === otherUserId) {
      throw new BadRequestException('Нельзя создать чат с самим собой');
    }
    const other = await this.users.findOne({ where: { id: otherUserId } });
    if (!other) throw new BadRequestException('Пользователь не найден');
    if (!other.roles.includes(Roles.Coach))
      throw new BadRequestException('Второй пользователь должен быть тренером');

    // ищем/создаём пару
    const existing = await this.links.findOne({
      where: { clientId: initiatorId, coachId: otherUserId },
    });
    if (existing) return existing;

    return this.links.save(
      this.links.create({ clientId: initiatorId, coachId: otherUserId }),
    );
  }

  // ⚡️ «оплата прошла» (пока мок): включаем активность
  async activateLink(linkId: string, byUserId: string) {
    const link = await this.links.findOne({ where: { id: linkId } });
    if (!link) throw new NotFoundException('Связь не найдена');

    // Право кто может активировать: клиент, тренер или биллинг-хук.
    if (byUserId !== link.clientId && byUserId !== link.coachId) {
      throw new ForbiddenException('Нет прав на активацию');
    }
    if (link.isActive) return link;

    link.isActive = true;
    link.activatedAt = new Date();
    link.deactivatedAt = null;
    return this.links.save(link);
  }

  // опционально, выключить (например, окончание подписки)
  async deactivateLink(linkId: string, byUserId: string) {
    const link = await this.links.findOne({ where: { id: linkId } });
    if (!link) throw new NotFoundException();
    if (byUserId !== link.clientId && byUserId !== link.coachId) {
      throw new ForbiddenException();
    }
    if (!link.isActive) return link;
    link.isActive = false;
    link.deactivatedAt = new Date();
    return this.links.save(link);
  }

  // Хелпер: требуем активную связь — пригодится для бронирования/планов
  async requireActive(clientId: string, coachId: string) {
    const link = await this.links.findOne({ where: { clientId, coachId } });
    if (!link || !link.isActive)
      throw new ForbiddenException('Связь не активна');
    return link;
  }

  // Получить "вид" по partnerId (универсально для ClientPage и CoachPage)
  async getViewWithPartner(meId: string, partnerId: string) {
    const partner = await this.users.findOne({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Партнёр не найден');

    // ищем связь в обоих направлениях
    const link = await this.links.findOne({
      where: [
        { clientId: meId, coachId: partnerId },
        { clientId: partnerId, coachId: meId },
      ],
    });

    // чат (если есть)
    let chatBlock: RelationView['chat'] = null;
    if (link) {
      const chat = await this.chats.findOne({
        where: { clientCoachId: link.id },
      });
      if (chat) {
        chatBlock = {
          id: chat.id,
        };
      }
    }

    // задел под биллинг/бронь (пока null/минимум из link.isActive)
    const billing = link
      ? { isActive: !!link.isActive, creditsRemaining: null }
      : null;
    const booking = { next: null } as RelationView['booking'];

    return {
      meRole: link.clientId === meId ? 'CLIENT' : 'COACH',
      partner: {
        id: partner.id,
        name: partner.name,
        about: partner.about,
        avatar: partner.avatar,
      },
      relation: link
        ? {
            id: link.id,
            isActive: !!link.isActive,
            activatedAt: link.activatedAt ?? null,
            deactivatedAt: link.deactivatedAt ?? null,
          }
        : null,
      chat: chatBlock,
      billing,
      booking,
    } as RelationView;
  }
}
