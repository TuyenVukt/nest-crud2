import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { APIKeyGuard } from 'src/shared/guards/api-key.guard';
import { Request } from 'express';
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';
import { CreatePostDto, GetPostItemDto, UpdatePostDto } from './post.dto';
import { isNotFoundPrismaError } from 'src/shared/helpers';
// import { TokenPayLoad } from 'src/shared/types/jwt.type';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // @UseGuards(AccessTokenGuard)
  // @UseGuards(APIKeyGuard)
  @Get()
  async getPosts() {
    const posts = await this.postsService.getPosts();
    return posts.map((post) => new GetPostItemDto(post));
  }

  @Get('get-posts-by-user')
  @UseGuards(AccessTokenGuard)
  getPostsByUser(@ActiveUser('userId') userId: number) {
    return this.postsService
      .getPostsByUser(userId)
      .then((post) => post.map((post) => new GetPostItemDto(post)));
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return new GetPostItemDto(await this.postsService.getPost(Number(id)));
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  async createPost(
    @Body() body: CreatePostDto,
    @ActiveUser('userId') userId: number,
  ) {
    return new GetPostItemDto(await this.postsService.createPost(userId, body));
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostDto,
    @ActiveUser('userId') userId: number,
  ) {
    return new GetPostItemDto(
      await this.postsService.updatePost({
        postId: Number(id),
        userId,
        body,
      }),
    );
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  deletePost(
    @Param('id') id: string,
    @ActiveUser('userId') userId: number,
  ): Promise<boolean> {
    return this.postsService.deletePost({ postId: Number(id), userId });
  }
}
