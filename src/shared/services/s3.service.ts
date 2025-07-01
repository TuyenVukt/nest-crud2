import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import envConfig from '../config';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: envConfig.AWS_REGION,
      credentials: {
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = envConfig.AWS_S3_BUCKET_NAME;
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.${envConfig.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown S3 error';
      throw new Error(`Failed to upload file to S3: ${errorMessage}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async deleteFileByUrl(url: string): Promise<void> {
    // Extract key from S3 URL
    const key = url.replace(
      `https://${this.bucketName}.s3.${envConfig.AWS_REGION}.amazonaws.com/`,
      '',
    );
    await this.deleteFile(key);
  }

  generateKey(filename: string, userId: number, postId: number): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    return `posts/${userId}/${postId}/${timestamp}.${extension}`;
  }

  generateAvatarKey(filename: string, userId: number): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop();
    return `avatars/${userId}/${timestamp}.${extension}`;
  }

  extractKeyFromUrl(url: string): string {
    return url.replace(
      `https://${this.bucketName}.s3.${envConfig.AWS_REGION}.amazonaws.com/`,
      '',
    );
  }
}
