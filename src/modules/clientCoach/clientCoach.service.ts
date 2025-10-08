import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClientCoach } from '../../entities/client-coach.entity';
import { User } from '../../entities/user.entity';
import { Roles } from '../../config/emuns/user';
import { Chat } from '../../entities/chat.entity';
import {
  MyRelationsItem,
  RelationView,
} from '../../config/interfaces/relations';

@Injectable()
export class ClientCoachService {
  constructor(
    @InjectRepository(ClientCoach) private links: Repository<ClientCoach>,
    @InjectRepository(Chat) private chats: Repository<Chat>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  // принадлежность по relationId
  async requireMembershipByRelationId(meId: string, relationId: string) {
    const link = await this.links.findOne({ where: { id: relationId } });
    if (!link) throw new NotFoundException('Связь не найдена');
    if (meId !== link.clientId && meId !== link.coachId) {
      // privacy-friendly: не палим существование чужой связи
      throw new NotFoundException('Связь не найдена');
    }
    return link;
  }

  // то же + активность
  async requireActiveByRelationId(meId: string, relationId: string) {
    const link = await this.requireMembershipByRelationId(meId, relationId);
    if (!link.isActive) throw new ForbiddenException('Связь не активна');
    return link;
  }

  // по паре id (когда направление известно и membership уже проверили выше/или это внутренняя логика)
  async requireActiveByPair(clientId: string, coachId: string) {
    const link = await this.links.findOne({ where: { clientId, coachId } });
    if (!link) throw new NotFoundException('Связь не найдена');
    if (!link.isActive) throw new ForbiddenException('Связь не активна');
    return link;
  }

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
      meRole: link.clientId === meId ? Roles.Client : Roles.Coach,
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

  async getMyInteractions(meId: string): Promise<MyRelationsItem[]> {
    const relations = await this.links.find({
      where: [{ clientId: meId }, { coachId: meId }],
    });
    if (!relations.length) return [];

    const linkIds = relations.map((relation) => relation.id);
    const chats = await this.chats.find({
      where: { clientCoachId: In(linkIds) },
    });
    const chatByLinkId = new Map(
      chats.map((chat) => [chat.clientCoachId, chat]),
    );

    const partnerIds = relations.map((relation) =>
      relation.clientId === meId ? relation.coachId : relation.clientId,
    );
    const partners = await this.users.find({ where: { id: In(partnerIds) } });
    const partnerById = new Map(partners.map((user) => [user.id, user]));

    return relations.map((relation) => {
      const amClient = relation.clientId === meId;
      const partnerId = amClient ? relation.coachId : relation.clientId;
      const partner = partnerById.get(partnerId);

      return {
        myRole: amClient ? Roles.Client : Roles.Coach,
        partnerRole: amClient ? Roles.Coach : Roles.Client,
        chatId: chatByLinkId.get(relation.id)?.id,
        clientCoachId: relation.id,
        partner: {
          id: partner.id,
          name: partner.name,
          avatar: partner.avatar ?? null,
        },
        isActive: !!relation.isActive,
      };
    });
  }

  // только тренер может задавать/обновлять цели
  async upsertGoals(
    meId: string,
    relationId: string,
    dto: Partial<ClientCoach>,
  ) {
    const link = await this.requireMembershipByRelationId(meId, relationId);

    if (meId !== link.coachId) {
      throw new ForbiddenException('Только тренер может задавать цели');
    }

    link.goalCalories = dto.goalCalories ?? link.goalCalories ?? null;
    link.goalProtein = dto.goalProtein ?? link.goalProtein ?? null;
    link.goalFat = dto.goalFat ?? link.goalFat ?? null;
    link.goalCarbs = dto.goalCarbs ?? link.goalCarbs ?? null;

    await this.links.save(link);

    return {
      relationId: link.id,
      goals: {
        goalCalories: link.goalCalories,
        goalProtein: link.goalProtein,
        goalFat: link.goalFat,
        goalCarbs: link.goalCarbs,
      },
    };
  }

  // получить цели — доступно обоим участникам
  async getGoals(meId: string, relationId: string) {
    const link = await this.requireMembershipByRelationId(meId, relationId);
    return {
      relationId: link.id,
      goals: {
        goalCalories: link.goalCalories ?? null,
        goalProtein: link.goalProtein ?? null,
        goalFat: link.goalFat ?? null,
        goalCarbs: link.goalCarbs ?? null,
      },
    };
  }
}
