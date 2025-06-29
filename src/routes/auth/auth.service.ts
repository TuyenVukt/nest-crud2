import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';
import { S3Service } from 'src/shared/services/s3.service';
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
    private readonly s3Service: S3Service,
  ) {}

  async register(body: RegisterDto) {
    try {
      const hashedPassword = await this.hashingService.hash(body.password);
      const user = await this.prismaService.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
          avatarUrl: 'default',
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

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Uploaded file must be an image');
      }

      // Get existing user to check if they have an avatar
      const existingUser = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new UnauthorizedException('User not found');
      }

      let avatarUrl = existingUser.avatarUrl;

      // If new avatar is provided, upload it and delete the old one
      if (file) {
        // Delete old avatar if it exists
        if (existingUser.avatarUrl) {
          try {
            await this.s3Service.deleteFileByUrl(existingUser.avatarUrl);
          } catch (deleteError: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            console.error('Error deleting old avatar:', deleteError);
          }
        }

        // Upload new avatar
        const key = this.s3Service.generateAvatarKey(file.originalname, userId);
        avatarUrl = await this.s3Service.uploadFile(file, key);
      }

      // Update user with new avatar URL
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (uploadError: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      console.error('Error uploading avatar:', uploadError);
      if (
        uploadError instanceof BadRequestException ||
        uploadError instanceof UnauthorizedException
      ) {
        throw uploadError;
      }
      throw new InternalServerErrorException('Failed to upload avatar');
    }
  }

  async getProfile(userId: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('User not found');
      }
      throw error;
    }
  }

  async updateProfile(
    userId: number,
    updateData: { name?: string; email?: string },
  ) {
    try {
      // Check if user exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new UnauthorizedException('User not found');
      }

      // Check if email is being updated and if it's already taken by another user
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.prismaService.user.findUnique({
          where: { email: updateData.email },
        });

        if (emailExists) {
          throw new ConflictException('Email already exists');
        }
      }

      // Update user profile
      const updatedUser = await this.prismaService.user.update({
        where: { id: userId },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.email && { email: updateData.email }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new ConflictException('Email already exists');
      }
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('User not found');
      }
      throw error;
    }
  }
}
