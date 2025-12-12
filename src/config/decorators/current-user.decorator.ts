import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../interfaces/jwt-payload';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtUser | undefined;

    // @CurrentUser() -> вернуть весь объект JwtUser
    if (!data) {
      return user;
    }

    // @CurrentUser('id') -> вернуть user.id
    return user?.[data];
  },
);
