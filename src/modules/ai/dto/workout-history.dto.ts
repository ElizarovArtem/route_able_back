import { WorkoutStatus } from '../../../config/emuns/ai-workout';

export class WorkoutHistoryItemDto {
  id: string;
  date: string; // YYYY-MM-DD
  status: WorkoutStatus;

  /** templateId = sourceSessionId ?? id */
  templateId: string;

  sourceSessionId: string | null;

  userIntent: string | null;
  createdAt: Date;
}
