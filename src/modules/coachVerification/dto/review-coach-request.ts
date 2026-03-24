import { IsIn } from 'class-validator';

export class ReviewCoachVerificationDto {
  @IsIn(['approve', 'reject'])
  decision: 'approve' | 'reject';
}
