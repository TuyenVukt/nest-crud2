import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
const saltRounds = 10;

@Injectable()
export class HashingService {
  hash(value: string) {
    return bcrypt.hash(value, saltRounds);
  }

  compare(value: string, hash: string) {
    return bcrypt.compare(value, hash);
  }
}
