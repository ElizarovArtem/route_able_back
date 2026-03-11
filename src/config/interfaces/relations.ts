import { Roles } from '../emuns/user';

export type MyRelationsItem = {
  myRole: Roles;
  partnerRole: Roles;
  chatId: string;
  clientCoachId: string;
  partner: { id: string; name: string; avatarUrl?: string | null };
  isActive?: boolean;
};

export type NutritionBlock = {
  date: string;
  summary: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  goals: {
    personal: {
      calories: number | null;
      protein: number | null;
      fat: number | null;
      carbs: number | null;
    } | null;
    coaches: {
      clientCoachId: string;
      coachId: string;
      coachName: string | null;
      calories: number | null;
      protein: number | null;
      fat: number | null;
      carbs: number | null;
    }[];
  };
  // meals?: Meal[]; // опционально, если захочешь
};

export type RelationView = {
  meRole: Roles; // кем я являюсь в паре (или пока не в паре)
  partner: {
    id: string;
    name: string;
    avatar?: string;
    about?: string;
    rating: {
      avg: number;
      count: number;
    } | null;
  };
  relation: {
    id: string;
    isActive: boolean;
    activatedAt?: Date | null;
    deactivatedAt?: Date | null;
  } | null;
  chat: {
    id: string;
  } | null;
  // заделы, могут быть null до внедрения:
  billing: { isActive: boolean; creditsRemaining?: number | null } | null;
  nutrition: NutritionBlock | null;
};
