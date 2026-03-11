import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UpsertCoachReviewDto } from './dto/upsert-coach-review.dto';
import { CoachReview } from 'src/entities/coach-review.entity';
import { CoachProfile } from '../../entities/coach-profile.entity';
import { Purchase } from '../../entities/purchase.entity';
import { User } from '../../entities/user.entity';
import { Roles } from '../../config/emuns/user';

@Injectable()
export class CoachReviewsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(CoachReview)
    private readonly reviewRepo: Repository<CoachReview>,

    @InjectRepository(CoachProfile)
    private readonly coachProfileRepo: Repository<CoachProfile>,

    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async upsertReview(params: {
    coachUserId: string;
    authorId: string;
    dto: UpsertCoachReviewDto;
  }) {
    const { coachUserId, authorId, dto } = params;

    return this.dataSource.transaction(async (m) => {
      const userRepo = m.getRepository(User);
      const purchaseRepo = m.getRepository(Purchase);
      const reviewRepo = m.getRepository(CoachReview);
      const coachProfileRepo = m.getRepository(CoachProfile);

      const coachUser = await userRepo.findOne({
        where: { id: coachUserId },
      });

      if (!coachUser) {
        throw new NotFoundException('Coach user not found');
      }

      if (!coachUser.roles?.includes(Roles.Coach)) {
        throw new BadRequestException('User is not a coach');
      }

      if (coachUserId === authorId) {
        throw new ForbiddenException('Нельзя оставить отзыв самому себе');
      }

      // const hasAnyPaidPurchase = await purchaseRepo.exists({
      //   where: {
      //     buyerId: authorId,
      //     coachUserId,
      //     paidAt: Not(IsNull()),
      //   },
      // });
      //
      // if (!hasAnyPaidPurchase) {
      //   throw new ForbiddenException(
      //     'Можно оставить отзыв только после оплаченной покупки у тренера',
      //   );
      // }

      const existing = await reviewRepo.findOne({
        where: { authorId, coachUserId },
      });

      if (!existing) {
        const review = reviewRepo.create({
          coachUserId,
          authorId,
          rating: dto.rating,
          text: dto.review ?? null,
          isVerified: true,
        });

        await reviewRepo.save(review);

        await coachProfileRepo
          .createQueryBuilder()
          .update(CoachProfile)
          .set({
            ratingSum: () => `"ratingSum" + ${dto.rating}`,
            ratingCount: () => `"ratingCount" + 1`,
            ratingAvg: () =>
              `ROUND((("ratingSum" + ${dto.rating})::numeric / ("ratingCount" + 1)), 2)`,
          })
          .where(`"userId" = :coachUserId`, { coachUserId })
          .execute();
      } else {
        const delta = dto.rating - existing.rating;

        existing.rating = dto.rating;
        existing.text = dto.review ?? null;
        existing.isVerified = true;

        await reviewRepo.save(existing);

        if (delta !== 0) {
          await coachProfileRepo
            .createQueryBuilder()
            .update(CoachProfile)
            .set({
              ratingSum: () => `"ratingSum" + (${delta})`,
              ratingAvg: () =>
                `CASE WHEN "ratingCount" = 0 THEN 0 ELSE ROUND((("ratingSum" + (${delta}))::numeric / "ratingCount"), 2) END`,
            })
            .where(`"userId" = :coachUserId`, { coachUserId })
            .execute();
        }
      }

      const updatedCoachProfile = await coachProfileRepo.findOneOrFail({
        where: { userId: coachUserId },
        select: {
          id: true,
          userId: true,
          ratingAvg: true,
          ratingCount: true,
          ratingSum: true,
        },
      });

      return {
        coachUserId: updatedCoachProfile.userId,
        ratingAvg: updatedCoachProfile.ratingAvg,
        ratingCount: updatedCoachProfile.ratingCount,
      };
    });
  }

  async listCoachReviews(coachUserId: string, limit = 20, offset = 0) {
    return this.reviewRepo.find({
      where: { coachUserId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: { author: true },
    });
  }

  async getMyReview(coachUserId: string, authorId: string) {
    return this.reviewRepo.findOne({
      where: { coachUserId, authorId },
    });
  }
}
