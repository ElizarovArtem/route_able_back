export interface CoachListItem {
  id: string;
  name: string | null;
  about: string | null;
  avatar: string | null;
  rating: {
    avg: number;
    count: number;
  };
}
