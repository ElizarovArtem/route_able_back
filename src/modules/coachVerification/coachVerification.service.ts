import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CoachVerificationRequest } from '../../entities/coach-verification.entity';
import { User } from '../../entities/user.entity';
import { CoachVerificationStatus } from '../../config/emuns/coach-verification';
import { Roles } from '../../config/emuns/user';

@Injectable()
export class CoachVerificationService {
  constructor(
    @InjectRepository(CoachVerificationRequest)
    private readonly reqRepo: Repository<CoachVerificationRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, name: string, contactInfo: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if ((user as any).isCoach) throw new BadRequestException('Уже тренер');

    const pending = await this.reqRepo.findOne({
      where: { userId, status: CoachVerificationStatus.PENDING },
    });
    if (pending) throw new ConflictException('Заявка уже отправлена');

    const entity = this.reqRepo.create({ userId, name, contactInfo });
    return this.reqRepo.save(entity);
  }

  async myLatest(userId: string) {
    return this.reqRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' as any },
    });
  }

  async list(status?: CoachVerificationStatus) {
    const qb = this.reqRepo
      .createQueryBuilder('r')
      .orderBy('r.createdAt', 'DESC');
    if (status) qb.where('r.status = :status', { status });
    return qb.getMany();
  }

  async review(
    adminId: string,
    requestId: string,
    decision: 'approve' | 'reject',
  ) {
    return this.dataSource.transaction(async (tx) => {
      const reqRepo = tx.getRepository(CoachVerificationRequest);
      const userRepo = tx.getRepository(User);

      const req = await reqRepo.findOne({ where: { id: requestId } });
      if (!req) throw new NotFoundException('Request not found');
      if (req.status !== CoachVerificationStatus.PENDING) {
        throw new ConflictException('Заявка уже рассмотрена');
      }

      if (decision === 'approve') {
        const user = await userRepo.findOne({
          where: { id: req.userId },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        user.roles = [...user.roles, Roles.Coach];
        user.isCoachAgreed = true;

        if (!user.name) {
          user.name = req.name;
        }

        await userRepo.save(user);

        req.status = CoachVerificationStatus.APPROVED;
      } else {
        req.status = CoachVerificationStatus.REJECTED;
      }

      req.reviewedByAdminId = adminId;
      req.reviewedAt = new Date();

      return reqRepo.save(req);
    });
  }
}
