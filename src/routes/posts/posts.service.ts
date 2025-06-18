import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { CreatePostDto, UpdatePostDto } from './post.dto';
import { isNotFoundPrismaError } from 'src/shared/helpers';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

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

  createPost(userId: number, body: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
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
  }: {
    postId: number;
    userId: number;
    body: UpdatePostDto;
  }) {
    try {
      console.log('Goto update post', postId);
      const post = await this.prisma.post.update({
        where: {
          id: postId,
          authorId: userId,
        },
        data: {
          title: body.title,
          content: body.content,
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
      console.log('Goto delete post', postId, userId);
      await this.prisma.post.delete({
        where: {
          id: postId,
          authorId: userId,
        },
      });
      return true;
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
