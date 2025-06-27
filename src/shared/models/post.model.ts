export class PostModel {
  id: number;
  title: string;
  authorId: number;
  content: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PostModel>) {
    Object.assign(this, partial);
  }
}
