import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { S3Service } from './services/s3.service';
import { JwtModule } from '@nestjs/jwt';

const providers = [PrismaService, HashingService, TokenService, S3Service];

@Global()
@Module({
  providers: providers,
  exports: providers,
  imports: [JwtModule],
})
export class SharedModule {}
