import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard';
import { ActiveUser } from 'src/shared/decorators/active-user.decorator';
import { CreatePostDto, GetPostItemDto, UpdatePostDto } from './post.dto';

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
  @UseInterceptors(FileInterceptor('image'))
  async createPost(
    @Body() body: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser('userId') userId: number,
  ) {
    if (!file) {
      throw new BadRequestException('Image is required for post creation');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Uploaded file must be an image');
    }

    return new GetPostItemDto(
      await this.postsService.createPost(userId, body, file),
    );
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updatePost(
    @Param('id') id: string,
    @Body() body: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
    @ActiveUser('userId') userId: number,
  ) {
    // Validate file type if provided
    if (file && !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Uploaded file must be an image');
    }

    return new GetPostItemDto(
      await this.postsService.updatePost({
        postId: Number(id),
        userId,
        body,
        file,
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
