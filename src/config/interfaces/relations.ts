import { Roles } from '../emuns/user';

export type MyRelationsItem = {
  myRole: Roles;
  partnerRole: Roles;
  chatId: string;
  clientCoachId: string;
  partner: { id: string; name: string; avatarUrl?: string | null };
  isActive?: boolean;
};

export type RelationView = {
  meRole: Roles; // кем я являюсь в паре (или пока не в паре)
  partner: { id: string; name: string; avatarUrl?: string | null };
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
  booking: {
    next?: {
      id: string;
      startsAt: string;
      endsAt: string;
      status: string;
    } | null;
  } | null;
};
