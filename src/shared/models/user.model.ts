import { Exclude } from 'class-transformer';

export class UserModel {
  id: number;
  email: string;
  name: string;
  @Exclude() password: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserModel>) {
    Object.assign(this, partial);
  }
}
