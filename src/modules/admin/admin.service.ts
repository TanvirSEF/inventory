import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) { }


  // ==================== MERCHANTS MANAGEMENT ====================

  async getAllMerchants(page = 1, limit = 50, search?: string) {
    let query = this.supabase.adminClient
      .from('merchants')
      .select('*, owner:profiles!merchants_owner_id_fkey(id, full_name, email)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,subdomain.ilike.%${search}%`,
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getMerchantById(merchantId: string) {
    const { data, error } = await this.supabase.adminClient
      .from('merchants')
      .select('*, owner:profiles!merchants_owner_id_fkey(*)')
      .eq('id', merchantId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Merchant not found');
    }

    return data;
  }

  async updateMerchantStatus(merchantId: string, isActive: boolean) {
    const { data, error } = await this.supabase.adminClient
      .from('merchants')
      .update({ is_active: isActive })
      .eq('id', merchantId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async deleteMerchant(merchantId: string) {
    const { error } = await this.supabase.adminClient
      .from('merchants')
      .delete()
      .eq('id', merchantId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Merchant deleted successfully' };
  }


  // ==================== SYSTEM STATISTICS ====================

  async getSystemStats() {
    const [
      { count: totalUsers },
      { count: totalMerchants },
      { count: activeMerchants },
      { count: totalCategories },
    ] = await Promise.all([
      this.supabase.adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
      this.supabase.adminClient
        .from('merchants')
        .select('*', { count: 'exact', head: true }),
      this.supabase.adminClient
        .from('merchants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      this.supabase.adminClient
        .from('global_categories')
        .select('*', { count: 'exact', head: true }),
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentUsers } = await this.supabase.adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());

    const { count: recentMerchants } = await this.supabase.adminClient
      .from('merchants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    return {
      users: {
        total: totalUsers || 0,
        recent: recentUsers || 0,
      },
      merchants: {
        total: totalMerchants || 0,
        active: activeMerchants || 0,
        inactive: (totalMerchants || 0) - (activeMerchants || 0),
        recent: recentMerchants || 0,
      },
      categories: {
        total: totalCategories || 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ==================== GLOBAL CATEGORIES MANAGEMENT ====================

  async createGlobalCategory(
    createCategoryDto: {
      name: string;
      description?: string;
      slug?: string;
      parentId?: string;
      imageUrl?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
    createdBy: string,
  ) {
    // Generate slug if not provided
    const slug =
      createCategoryDto.slug ||
      createCategoryDto.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    // Check slug uniqueness
    const { data: existing } = await this.supabase.adminClient
      .from('global_categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new BadRequestException(
        `Category with slug "${slug}" already exists`,
      );
    }

    const { data, error } = await this.supabase.adminClient
      .from('global_categories')
      .insert({
        name: createCategoryDto.name,
        description: createCategoryDto.description || null,
        slug,
        parent_id: createCategoryDto.parentId || null,
        image_url: createCategoryDto.imageUrl || null,
        is_active: createCategoryDto.isActive ?? true,
        sort_order: createCategoryDto.sortOrder ?? 0,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async getAllGlobalCategories(includeInactive = false) {
    let query = this.supabase.adminClient
      .from('global_categories')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const from = 0;
    const to = 1000; // Get all categories

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      data: data || [],
      total: count || 0,
    };
  }

  async getGlobalCategoryById(id: string) {
    const { data, error } = await this.supabase.adminClient
      .from('global_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Category not found');
    }

    return data;
  }

  async updateGlobalCategory(
    id: string,
    updateCategoryDto: {
      name?: string;
      description?: string;
      slug?: string;
      parentId?: string;
      imageUrl?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const updateData: Record<string, unknown> = {};
    if (updateCategoryDto.name) updateData.name = updateCategoryDto.name;
    if (updateCategoryDto.description !== undefined)
      updateData.description = updateCategoryDto.description;
    if (updateCategoryDto.slug) updateData.slug = updateCategoryDto.slug;
    if (updateCategoryDto.parentId !== undefined)
      updateData.parent_id = updateCategoryDto.parentId || null;
    if (updateCategoryDto.imageUrl !== undefined)
      updateData.image_url = updateCategoryDto.imageUrl || null;
    if (updateCategoryDto.isActive !== undefined)
      updateData.is_active = updateCategoryDto.isActive;
    if (updateCategoryDto.sortOrder !== undefined)
      updateData.sort_order = updateCategoryDto.sortOrder;

    const { data, error } = await this.supabase.adminClient
      .from('global_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async deleteGlobalCategory(id: string) {
    // Check if category is used by any merchant
    const { data: merchants } = await this.supabase.adminClient
      .from('merchants')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (merchants && merchants.length > 0) {
      throw new BadRequestException(
        'Cannot delete category: it is assigned to one or more merchants',
      );
    }

    const { error } = await this.supabase.adminClient
      .from('global_categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Category deleted successfully' };
  }

  // ==================== SYSTEM CONFIGURATION ====================

  async getSystemHealth() {
    try {
      // Test database connection
      const { error: dbError } = await this.supabase.adminClient
        .from('profiles')
        .select('id')
        .limit(1);

      // Test auth connection
      const { error: authError } =
        await this.supabase.adminClient.auth.admin.listUsers();

      return {
        status: 'healthy',
        database: dbError ? 'unhealthy' : 'healthy',
        auth: authError ? 'unhealthy' : 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
