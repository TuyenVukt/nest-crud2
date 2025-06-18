import {
  Body,
  // ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  // SerializeOptions,
  // UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResDto,
  LogoutDto,
  LogoutResDto,
  RefreshTokenDto,
  RefreshTokenResDto,
  RegisterDto,
  RegisterResDto,
} from './dto/register.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getAuth() {
    return 'auth';
  }
  // @UseInterceptors(ClassSerializerInterceptor)
  // @SerializeOptions({ type: RegisterResDto })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return new RegisterResDto(await this.authService.register(body));
    // return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return new LoginResDto(await this.authService.login(body));
  }
  @UseGuards(AccessTokenGuard)
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenDto) {
    return new RefreshTokenResDto(
      await this.authService.refreshToken(body.refreshToken),
    );
  }

  @Post('logout')
  async logout(@Body() body: LogoutDto) {
    return new LogoutResDto(await this.authService.logout(body.refreshToken));
  }
}
