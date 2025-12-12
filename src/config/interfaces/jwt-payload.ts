import { Roles } from '../emuns/user';

export interface JwtPayload {
  sub: string; // id пользователя
  email?: string;
  roles?: Roles[];
  name?: string;
}

export interface JwtUser {
  id: string;
  email?: string;
  roles: Roles[];
  name?: string;
}
