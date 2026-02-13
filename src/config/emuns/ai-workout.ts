export enum WorkoutStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum WorkoutExerciseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum ExerciseKey {
  BARBELL_BENCH_PRESS = 'barbell_bench_press',
  DUMBBELL_BENCH_PRESS = 'dumbbell_bench_press',
  INCLINE_BENCH_PRESS = 'incline_bench_press',

  PUSHUP = 'pushup',
  DIP = 'dip',

  PULL_UP = 'pull_up',
  LAT_PULLDOWN = 'lat_pulldown',

  BENT_OVER_ROW = 'bent_over_row',
  DUMBBELL_ROW = 'dumbbell_row',

  DEADLIFT = 'deadlift',
  SQUAT = 'squat',
  GOBLET_SQUAT = 'goblet_squat',
  LEG_PRESS = 'leg_press',
  LUNGE = 'lunge',

  DUMBBELL_SHOULDER_PRESS = 'dumbbell_shoulder_press',
  DUMBBELL_LATERAL_RAISE = 'dumbbell_lateral_raise',
}
