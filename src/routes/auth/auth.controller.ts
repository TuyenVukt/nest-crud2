import {
  Body,
  // ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  // SerializeOptions,
  // UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResDto,
  LogoutDto,
  LogoutResDto,
  ProfileResDto,
  RefreshTokenDto,
  RefreshTokenResDto,
  RegisterDto,
  RegisterResDto,
  UpdateProfileDto,
} from './dto/register.dto';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';

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

  @Post('upload-avatar')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser('userId') userId: number,
  ) {
    if (!file) {
      throw new BadRequestException('Avatar image is required');
    }

    return await this.authService.uploadAvatar(userId, file);
  }

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  async getProfile(
    @ActiveUser('userId') userId: number,
  ): Promise<ProfileResDto> {
    return new ProfileResDto(await this.authService.getProfile(userId));
  }

  @Put('profile')
  @UseGuards(AccessTokenGuard)
  async updateProfile(
    @ActiveUser('userId') userId: number,
    @Body() updateData: UpdateProfileDto,
  ): Promise<ProfileResDto> {
    return new ProfileResDto(
      await this.authService.updateProfile(userId, updateData),
    );
  }
}
