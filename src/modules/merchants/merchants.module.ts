import { Module } from '@nestjs/common';
import { MerchantsService } from './merchants.service';

@Module({
  providers: [MerchantsService],
  exports: [MerchantsService], // Export service so AuthModule can use it
})
export class MerchantsModule { }
