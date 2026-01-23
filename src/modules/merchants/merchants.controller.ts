import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { MerchantGuard } from '../../common/guards/merchant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User } from '@supabase/supabase-js';

@Controller('merchants')
@UseGuards(SupabaseAuthGuard)
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  create(@Body() createMerchantDto: CreateMerchantDto, @CurrentUser() user: User) {
    return this.merchantsService.create(user.id, createMerchantDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.merchantsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.merchantsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(MerchantGuard)
  update(
    @Param('id') id: string,
    @Body() updateMerchantDto: UpdateMerchantDto,
    @CurrentUser() user: User,
  ) {
    return this.merchantsService.update(id, updateMerchantDto, user.id);
  }

  @Delete(':id')
  @UseGuards(MerchantGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.merchantsService.remove(id, user.id);
  }

  @Post(':id/regenerate-api-key')
  @UseGuards(MerchantGuard)
  regenerateApiKey(@Param('id') id: string, @CurrentUser() user: User) {
    return this.merchantsService.regenerateApiKey(id, user.id);
  }
}
