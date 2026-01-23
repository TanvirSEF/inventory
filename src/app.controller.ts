import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './core/supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/supabase')
  async checkSupabaseConnection() {
    try {
      const client = this.supabaseService.client;
      
      // Check if client is initialized
      if (!client) {
        throw new Error('Supabase client is not initialized');
      }

      // Test connection using auth API (doesn't require any tables)
      // This is a lightweight way to verify the connection works
      const { data: authData, error: authError } = await client.auth.getSession();

      // If we can call the API (even if no session), connection is working
      // authError would only occur if there's a network/connection issue
      if (authError && authError.message.includes('fetch')) {
        throw new Error('Cannot reach Supabase server: ' + authError.message);
      }

      return {
        status: 'success',
        message: 'Supabase connection is working!',
        connected: true,
        hasSession: !!authData?.session,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Supabase connection failed',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
