import { SetMetadata } from '@nestjs/common';
import { Roles } from '../emuns/user';

// ключ, по которому RolesGuard будет забирать метадату
export const ROLES_KEY = 'roles';

// используем как: @RolesDecorator(Roles.COACH, Roles.CLIENT)
export const RolesDecorator = (...roles: Roles[]) =>
  SetMetadata(ROLES_KEY, roles);
