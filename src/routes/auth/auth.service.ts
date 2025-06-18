import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import { TokenService } from 'src/shared/services/token.service';
import {
  isNotFoundPrismaError,
  isUniqueConstraintPrismaError,
} from 'src/shared/helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(body: RegisterDto) {
    try {
      const hashedPassword = await this.hashingService.hash(body.password);
      const user = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
        },
        // select: {
        //   id: true,
        //   email: true,
        //   name: true,
        //   createdAt: true,
        //   updatedAt: true,
        // },
      });
      return user;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async login(body: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Account is not exist!');
    }

    const isPasswordMatch = await this.hashingService.compare(
      body.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException([
        {
          field: 'password',
          error: 'Password is incorrect!',
        },
      ]);
    }

    const tokens = await this.generateTokens({ userId: user.id });
    return tokens;
  }

  async generateTokens(payload: { userId: number }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload),
    ]);
    const decodedRefreshToken =
      await this.tokenService.verifyRefreshToken(refreshToken);

    await this.prismaService.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ hay không?
      const { userId } =
        await this.tokenService.verifyRefreshToken(refreshToken);
      // 2. Kiểm tra refreshToken có tồn tại trong DB không?
      await this.prismaService.refreshToken.findFirstOrThrow({
        where: {
          token: refreshToken,
        },
      });
      // 3. xoas refreshToken cũ

      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      return await this.generateTokens({ userId });
    } catch (error) {
      // Trường hợp đã refreshToken rồi, hãy thông báo cho user biết.
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh Token has been revolked');
      }
      throw new UnauthorizedException();
    }
  }
  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ hay không?
      await this.tokenService.verifyRefreshToken(refreshToken);

      // 2. xoas refreshToken Trong database
      await this.prismaService.refreshToken.delete({
        where: {
          token: refreshToken,
        },
      });

      return { message: 'Logout successfully' };
    } catch (error) {
      // Trường hợp đã refreshToken rồi, hãy thông báo cho user biết.
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh Token has been revolked');
      }
      throw new UnauthorizedException();
    }
  }
}
