import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { S3Service } from 'src/shared/services/s3.service';
import { CreatePostDto, UpdatePostDto } from './post.dto';
import { isNotFoundPrismaError } from 'src/shared/helpers';

@Injectable()
export class PostsService {
  prismaService: any;
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async getPosts() {
    return await this.prisma.post.findMany({
      include: {
        author: {
          omit: {
            password: true,
          },
        },
      },
    });
  }

  getPostsByUser(userId: number) {
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
      },
      include: {
        author: {
          omit: {
            password: true,
          },
        },
      },
    });
  }

  async createPost(
    userId: number,
    body: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    try {
      // 1️⃣ Tạo post trước (imageUrl để null hoặc rỗng)
      const post = await this.prisma.post.create({
        data: {
          title: body.title,
          content: body.content,
          imageUrl: 'default', // Tạm chưa có ảnh
          authorId: userId,
        },
        include: {
          author: {
            omit: {
              password: true,
            },
          },
        },
      });
      // 2️⃣ Nếu có ảnh → upload S3 → update post
      if (file) {
        const key = this.s3Service.generateKey(
          file.originalname,
          userId,
          post.id,
        );
        const imageUrl = await this.s3Service.uploadFile(file, key);
        const updatedImagePost = await this.prisma.post.update({
          where: { id: post.id },
          data: { imageUrl },
          include: {
            author: {
              omit: {
                password: true,
              },
            },
          },
        });
        return updatedImagePost;
      } else {
        throw new BadRequestException('Image is required for post creation');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      // Nếu đã tạo post nhưng upload ảnh lỗi → Xoá post
      // if (post?.id && !post.imageUrl) {
      //   try {
      //     await this.prisma.post.delete({ where: { id: post.id } });
      //   } catch (deleteError) {
      //     console.error('Error cleaning up post after failed image upload:', deleteError);
      //   }
      // }
      throw error;
    }
  }

  async getPost(postId: number) {
    try {
      const post = await this.prisma.post.findUniqueOrThrow({
        where: {
          id: postId,
        },
        include: {
          author: {
            omit: {
              password: true,
            },
          },
        },
      });
      return post;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }

  async updatePost({
    postId,
    userId,
    body,
    file,
  }: {
    postId: number;
    userId: number;
    body: UpdatePostDto;
    file?: Express.Multer.File;
  }) {
    try {
      // Get existing post to check if it has an image
      const existingPost = await this.prisma.post.findUnique({
        where: {
          id: postId,
          authorId: userId,
        },
      });

      if (!existingPost) {
        throw new NotFoundException('Post not found');
      }

      let imageUrl = existingPost.imageUrl;

      // If new image is provided, upload it and delete the old one
      if (file) {
        // Delete old image if it exists
        if (existingPost.imageUrl) {
          try {
            await this.s3Service.deleteFileByUrl(existingPost.imageUrl);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Upload new image
        const key = this.s3Service.generateKey(
          file.originalname,
          userId,
          postId,
        );
        imageUrl = await this.s3Service.uploadFile(file, key);
      }

      const post = await this.prisma.post.update({
        where: {
          id: postId,
          authorId: userId,
        },
        data: {
          title: body.title,
          content: body.content,
          imageUrl,
        },
        include: {
          author: {
            omit: {
              password: true,
            },
          },
        },
      });
      return post;
    } catch (error) {
      console.log('Error update post', error);
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }

  async deletePost({ postId, userId }: { postId: number; userId: number }) {
    try {
      // Get post first (to check imageUrl)
      const post = await this.prisma.post.findUnique({
        where: {
          id: postId,
          authorId: userId,
        },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      // Delete post first (main data)
      await this.prisma.post.delete({
        where: {
          id: postId,
          authorId: userId,
        },
      });
      // Then delete image (if exists)
      if (post.imageUrl) {
        try {
          await this.s3Service.deleteFileByUrl(post.imageUrl);
        } catch (error) {
          console.error('Error deleting image from S3:', error);
          // Optionally: log để retry sau
        }
      }
      return true;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
