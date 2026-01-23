import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Get all active global categories (for merchant selection)
   */
  async getActiveGlobalCategories() {
    const { data, error } = await this.supabase.client
      .from('global_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new NotFoundException('Failed to fetch categories');
    }

    return data || [];
  }

  /**
   * Get global category by ID
   */
  async getGlobalCategoryById(id: string) {
    const { data, error } = await this.supabase.client
      .from('global_categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundException('Category not found');
    }

    return data;
  }
}
