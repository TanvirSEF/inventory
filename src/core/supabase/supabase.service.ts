import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_ANON_KEY is not set');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize admin client if service role key is provided
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    if (serviceRoleKey) {
      this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  get client() {
    return this.supabase;
  }

  /**
   * Get admin client with service role key for operations that bypass RLS
   * Use with caution - only for server-side admin operations
   */
  get adminClient() {
    if (!this.supabaseAdmin) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is not set. Admin client is not available.',
      );
    }
    return this.supabaseAdmin;
  }
}