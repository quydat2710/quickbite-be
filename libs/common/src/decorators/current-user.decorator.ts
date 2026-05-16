import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IRequestUser } from '../interfaces/user.interface';

/**
 * Extract the current user from the request.
 * At the API Gateway level, this is populated by the JWT middleware.
 * At the service level, this comes from the TCP payload forwarded by Gateway.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof IRequestUser | undefined, ctx: ExecutionContext): IRequestUser | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user: IRequestUser | undefined = request.user;
    return data ? user?.[data] : user;
  },
);
