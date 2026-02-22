import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

interface MerchantRecord {
  id: string;
  business_name: string;
  subdomain: string;
  category_id?: string | null;
  logo_url?: string | null;
  logo?: string | null;
}

@Injectable()
export class PublicService {
  constructor(private readonly supabase: SupabaseService) {}

  private get db() {
    try {
      return this.supabase.adminClient;
    } catch {
      return this.supabase.client;
    }
  }

  async getStoreBySubdomain(subdomain: string) {
    const { data: merchant, error } = await this.db
      .from('merchants')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();

    if (error || !merchant) {
      throw new NotFoundException('Store not found');
    }

    const merchantData = merchant as MerchantRecord;
    const category = await this.getCategoryDetails(merchantData.category_id);

    return {
      id: merchantData.id,
      businessName: merchantData.business_name,
      subdomain: merchantData.subdomain,
      logo: merchantData.logo_url ?? merchantData.logo ?? null,
      category,
    };
  }

  async getStoreProducts(subdomain: string) {
    const { data: merchant, error: merchantError } = await this.db
      .from('merchants')
      .select('*')
      .eq('subdomain', subdomain)
      .eq('is_active', true)
      .single();

    if (merchantError || !merchant) {
      throw new NotFoundException('Store not found');
    }

    const merchantData = merchant as MerchantRecord;
    const { data: products, error: productsError } = await this.db
      .from('products')
      .select('*')
      .eq('merchant_id', merchantData.id)
      .order('created_at', { ascending: false });

    if (productsError) {
      throw new NotFoundException('Failed to fetch store products');
    }

    return {
      store: {
        id: merchantData.id,
        businessName: merchantData.business_name,
        subdomain: merchantData.subdomain,
        logo: merchantData.logo_url ?? merchantData.logo ?? null,
      },
      products: products || [],
    };
  }

  private async getCategoryDetails(categoryId?: string | null) {
    if (!categoryId) {
      return null;
    }

    const { data: category, error } = await this.db
      .from('global_categories')
      .select('id, name, slug, description, image_url, parent_id')
      .eq('id', categoryId)
      .eq('is_active', true)
      .single();

    if (error || !category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      parentId: category.parent_id,
    };
  }
}
