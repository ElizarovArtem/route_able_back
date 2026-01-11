export enum Roles {
  Admin = 'Admin',
  Coach = 'Coach',
  Client = 'Client',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary', // минимум активности
  LIGHT = 'light', // 1–3 тренировки в неделю
  MODERATE = 'moderate', // 3–5
  ACTIVE = 'active', // 6–7
  VERY_ACTIVE = 'very_active', // 2-разовые тренировки, тяжёлый физ. труд
}

export enum WeightGoal {
  LOSE = 'LOSE',
  MAINTAIN = 'MAINTAIN',
  GAIN = 'GAIN',
}
