import { Exclude } from 'class-transformer';
import { IsEmail, IsString, Length, IsOptional } from 'class-validator';
import { Match } from 'src/shared/decorators/custom-validator.decorator';
// import { SuccessResDTO } from 'src/shared/shared.dto';

export class LoginDto {
  @IsEmail()
  email: string;
  @IsString()
  @Length(6, 20, { message: 'Mật khẩu phải từ 6 đến 20 ký tự' })
  password: string;
}

export class LoginResDto {
  accessToken: string;
  refreshToken: string;

  constructor(partial: Partial<LoginResDto>) {
    Object.assign(this, partial);
  }
}

export class RegisterDto extends LoginDto {
  @IsString()
  name: string;

  @IsString()
  @Match('password', { message: 'Mật khẩu không khớp' })
  confirmPassword: string;
}

export class RegisterResDto {
  id: number;
  email: string;
  name: string;
  @Exclude()
  password: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RegisterResDto>) {
    Object.assign(this, partial);
  }
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class RefreshTokenResDto extends LoginResDto {}

export class LogoutDto extends RefreshTokenDto {}

export class LogoutResDto {
  message: string;
  constructor(partial: Partial<LogoutResDto>) {
    Object.assign(this, partial);
  }
}

export class ProfileResDto {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProfileResDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

// export class RegisterData {
//   id: number;
//   email: string;
//   name: string;
//   @Exclude()
//   password: string;
//   createdAt: Date;
//   updatedAt: Date;

//   constructor(partial: Partial<RegisterData>) {
//     Object.assign(this, partial);
//   }
// }

// export class RegisterResDto extends SuccessResDTO {
//   @Type(() => RegisterData)
//   declare data: RegisterData;

//   constructor(partial: Partial<RegisterResDto>) {
//     super(partial);
//     Object.assign(this, partial);
//   }
// }
