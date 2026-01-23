import { Module } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';

@Module({
  providers: [MerchantsService],
  controllers: [MerchantsController],
  exports: [MerchantsService], // Export service so AuthModule can use it
})
export class MerchantsModule {}
