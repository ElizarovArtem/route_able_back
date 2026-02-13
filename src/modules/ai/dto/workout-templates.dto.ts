import { WorkoutStatus } from '../../../config/emuns/ai-workout';

export class WorkoutTemplateListItemDto {
  templateId: string;
  lastSessionId: string;
  lastDate: string;
  lastStatus: WorkoutStatus;
  timesPerformed: number;
  userIntent: string | null;
  exercises: {
    id: string;
    order: number;
    name: string;
    exerciseKey: string | null;
    setsPlanned: number;
    repsPerSet: number;
    restSeconds: number | null;
    targetMuscle: string | null;
    notes: string | null;
  }[];
}
