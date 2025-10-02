import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Vu Duc Tuyen Sun* HELLO';
  }
}
