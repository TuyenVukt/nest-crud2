import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! UPDATE 4 from Tuyen - Van ANH';
  }
}
