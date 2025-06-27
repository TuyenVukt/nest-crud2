import { Type } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';
import { PostModel } from 'src/shared/models/post.model';
import { UserModel } from 'src/shared/models/user.model';

export class GetPostItemDto extends PostModel {
  @Type(() => UserModel)
  author: Omit<UserModel, 'password'>;

  constructor(partial: Partial<GetPostItemDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class CreatePostWithImageDto {
  @IsString()
  title: string;

  @IsString()
  content: string;
}

export class UpdatePostWithImageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
