import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayLoad } from '../types/jwt.type';
import { REQUEST_USER_KEY } from '../constants/auth.constant';

export const ActiveUser = createParamDecorator(
  (field: keyof TokenPayLoad | undefined, context: ExecutionContext) => {
    //eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user: TokenPayLoad | undefined = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
