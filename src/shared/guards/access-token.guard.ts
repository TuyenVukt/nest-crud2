import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../services/token.service';
import { REQUEST_USER_KEY } from '../constants/auth.constant';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('got in AccessTokenGuard');
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.authorization?.split(' ')[1];

    if (!accessToken) throw new UnauthorizedException();

    try {
      const decodedAccesstoken =
        await this.tokenService.verifyAccessToken(accessToken);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      request[REQUEST_USER_KEY] = decodedAccesstoken;
      console.log(request[REQUEST_USER_KEY]);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
