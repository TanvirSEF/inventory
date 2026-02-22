import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MerchantsService {
  constructor(private readonly supabase: SupabaseService) { }

  async create(ownerId: string, createMerchantDto: CreateMerchantDto, categoryId?: string) {
    // Check if subdomain is already taken
    const { data: existing } = await this.supabase.client
      .from('merchants')
      .select('id')
      .eq('subdomain', createMerchantDto.subdomain)
      .single();

    if (existing) {
      throw new BadRequestException('Subdomain is already taken');
    }

    if (categoryId) {
      const { data: category, error: categoryError } = await this.supabase.client
        .from('global_categories')
        .select('id, is_active')
        .eq('id', categoryId)
        .single();

      if (categoryError || !category) throw new BadRequestException('Invalid category selected');
      if (!category.is_active) throw new BadRequestException('Selected category is not active');
    }

    const apiKey = `os_live_${uuidv4().replace(/-/g, '')}`;

    const { data, error } = await this.supabase.client
      .from('merchants')
      .insert({
        owner_id: ownerId,
        business_name: createMerchantDto.businessName,
        subdomain: createMerchantDto.subdomain,
        api_key: apiKey,
        category_id: categoryId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }


  async findAll(ownerId?: string) {
    let query = this.supabase.client.from('merchants').select('*');

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async findOne(id: string, ownerId?: string) {
    let query = this.supabase.client
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error || !data) {
      throw new NotFoundException('Merchant not found');
    }

    // Check ownership if ownerId is provided
    if (ownerId && data.owner_id !== ownerId) {
      throw new ForbiddenException('Access denied to this merchant');
    }

    return data;
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto, ownerId: string) {
    // Verify ownership
    await this.findOne(id, ownerId);

    // Check subdomain uniqueness if updating subdomain
    if (updateMerchantDto.subdomain) {
      const { data: existing } = await this.supabase.client
        .from('merchants')
        .select('id')
        .eq('subdomain', updateMerchantDto.subdomain)
        .neq('id', id)
        .single();

      if (existing) {
        throw new BadRequestException('Subdomain is already taken');
      }
    }

    const { data, error } = await this.supabase.client
      .from('merchants')
      .update({
        ...(updateMerchantDto.businessName && {
          business_name: updateMerchantDto.businessName,
        }),
        ...(updateMerchantDto.subdomain && {
          subdomain: updateMerchantDto.subdomain,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async remove(id: string, ownerId: string) {
    // Verify ownership
    await this.findOne(id, ownerId);

    const { error } = await this.supabase.client
      .from('merchants')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Merchant deleted successfully' };
  }

  async regenerateApiKey(id: string, ownerId: string) {
    // Verify ownership
    await this.findOne(id, ownerId);

    const newApiKey = `os_live_${uuidv4().replace(/-/g, '')}`;

    const { data, error } = await this.supabase.client
      .from('merchants')
      .update({
        api_key: newApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { apiKey: data.api_key };
  }
}
