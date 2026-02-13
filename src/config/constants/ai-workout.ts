import { ExerciseKey } from '../emuns/ai-workout';

export const EXERCISE_KEYS = Object.values(ExerciseKey);

const KEY_SYNONYMS: Record<string, ExerciseKey> = {
  // bench
  'barbell bench press': ExerciseKey.BARBELL_BENCH_PRESS,
  'bench press': ExerciseKey.BARBELL_BENCH_PRESS,
  'dumbbell bench press': ExerciseKey.DUMBBELL_BENCH_PRESS,
  'incline bench press': ExerciseKey.INCLINE_BENCH_PRESS,

  // push
  'push up': ExerciseKey.PUSHUP,
  'push-up': ExerciseKey.PUSHUP,
  pushups: ExerciseKey.PUSHUP,
  'push-ups': ExerciseKey.PUSHUP,
  dip: ExerciseKey.DIP,
  dips: ExerciseKey.DIP,

  // pull
  'pull up': ExerciseKey.PULL_UP,
  'pull-up': ExerciseKey.PULL_UP,
  pullups: ExerciseKey.PULL_UP,
  'lat pulldown': ExerciseKey.LAT_PULLDOWN,
  'lat pull-down': ExerciseKey.LAT_PULLDOWN,
  'lat pull down': ExerciseKey.LAT_PULLDOWN,

  // rows
  'bent over row': ExerciseKey.BENT_OVER_ROW,
  'bent-over row': ExerciseKey.BENT_OVER_ROW,
  'barbell row': ExerciseKey.BENT_OVER_ROW,
  'dumbbell row': ExerciseKey.DUMBBELL_ROW,
  'one arm dumbbell row': ExerciseKey.DUMBBELL_ROW,

  // legs
  deadlift: ExerciseKey.DEADLIFT,
  squat: ExerciseKey.SQUAT,
  'goblet squat': ExerciseKey.GOBLET_SQUAT,
  'leg press': ExerciseKey.LEG_PRESS,
  lunge: ExerciseKey.LUNGE,
  lunges: ExerciseKey.LUNGE,

  // shoulders
  'dumbbell shoulder press': ExerciseKey.DUMBBELL_SHOULDER_PRESS,
  'shoulder press': ExerciseKey.DUMBBELL_SHOULDER_PRESS,
  'dumbbell lateral raise': ExerciseKey.DUMBBELL_LATERAL_RAISE,
  'lateral raise': ExerciseKey.DUMBBELL_LATERAL_RAISE,

  // RU примеры (если гигчат пишет по-русски)
  'жим штанги лёжа': ExerciseKey.BARBELL_BENCH_PRESS,
  'жим гантелей лёжа': ExerciseKey.DUMBBELL_BENCH_PRESS,
  'жим на наклонной скамье': ExerciseKey.INCLINE_BENCH_PRESS,
  отжимания: ExerciseKey.PUSHUP,
  'отжимания на брусьях': ExerciseKey.DIP,
  подтягивания: ExerciseKey.PULL_UP,
  'тяга верхнего блока': ExerciseKey.LAT_PULLDOWN,
  'тяга в наклоне': ExerciseKey.BENT_OVER_ROW,
  'тяга гантели': ExerciseKey.DUMBBELL_ROW,
  'становая тяга': ExerciseKey.DEADLIFT,
  присед: ExerciseKey.SQUAT,
  'гоблет присед': ExerciseKey.GOBLET_SQUAT,
  'жим ногами': ExerciseKey.LEG_PRESS,
  выпады: ExerciseKey.LUNGE,
  'жим гантелей над головой': ExerciseKey.DUMBBELL_SHOULDER_PRESS,
  'разведения гантелей в стороны': ExerciseKey.DUMBBELL_LATERAL_RAISE,
};

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function normalizeExerciseKeyFromAi(
  rawKey: any,
  rawName?: any,
): ExerciseKey | null {
  // 1) пробуем key как есть
  if (typeof rawKey === 'string') {
    const k = norm(rawKey).replace(/\s/g, '_'); // если пришло "lat pull-down"
    // прямое совпадение enum
    if (Object.values(ExerciseKey).includes(k as ExerciseKey))
      return k as ExerciseKey;
    // синонимы
    const mapped = KEY_SYNONYMS[norm(rawKey)];
    if (mapped) return mapped;
  }

  // 2) если key null/битый — пробуем по name
  if (typeof rawName === 'string') {
    const mapped = KEY_SYNONYMS[norm(rawName)];
    if (mapped) return mapped;

    // мягкие эвристики (чтобы ещё меньше null)
    const n = norm(rawName);
    if (n.includes('pull') && n.includes('down'))
      return ExerciseKey.LAT_PULLDOWN;
    if (n.includes('bench') && n.includes('incline'))
      return ExerciseKey.INCLINE_BENCH_PRESS;
    if (n.includes('bench')) return ExerciseKey.BARBELL_BENCH_PRESS;
    if (n.includes('lateral') && n.includes('raise'))
      return ExerciseKey.DUMBBELL_LATERAL_RAISE;
  }

  return null;
}
