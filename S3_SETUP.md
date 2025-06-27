# S3 Image Upload Setup Guide

## Overview

This implementation adds image upload functionality to posts using AWS S3. Images are required for post creation and can be updated or deleted along with posts.

## Features

- **Create Post**: Requires an image file (multipart form data)
- **Get Posts**: Returns posts with image URLs
- **Update Post**: Allows updating image (deletes old image from S3)
- **Delete Post**: Deletes both post and associated image from S3

## Environment Variables Required

Add these to your `.env` or `.env.production` file:

```env
# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_S3_BUCKET_NAME="your-s3-bucket-name"
```

## AWS S3 Setup

1. Create an S3 bucket in your AWS account
2. Configure bucket permissions for public read access
3. Create an IAM user with S3 permissions
4. Get the access key and secret key

## Database Migration

Run the following command to add the imageUrl field to the Post table:

```bash
npx prisma migrate dev --name add-image-url-to-post
```

## API Usage

### Create Post (POST /posts)

```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=My Post Title" \
  -F "content=My post content" \
  -F "image=@/path/to/image.jpg"
```

### Update Post (PUT /posts/:id)

```bash
curl -X PUT http://localhost:3000/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Updated Title" \
  -F "content=Updated content" \
  -F "image=@/path/to/new-image.jpg"
```

### Get Posts (GET /posts)

Returns posts with image URLs included in the response.

### Delete Post (DELETE /posts/:id)

Deletes the post and its associated image from S3.

## File Structure

- Images are stored in S3 with the path: `posts/{userId}/{postId}/{timestamp}.{extension}`
- For new posts: `posts/{userId}/{timestamp}.{extension}`

## Error Handling

- Returns 400 if no image is provided for post creation
- Returns 400 if uploaded file is not an image
- Returns 404 if post is not found
- Handles S3 upload/delete errors gracefully
