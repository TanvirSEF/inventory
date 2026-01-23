import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Validate API key format (os_live_...)
    if (!apiKey.startsWith('os_live_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    try {
      // Verify API key exists and is active
      const { data: merchant, error } = await this.supabaseService.client
        .from('merchants')
        .select('id, business_name, api_key, is_active')
        .eq('api_key', apiKey)
        .single();

      if (error || !merchant) {
        throw new UnauthorizedException('Invalid API key');
      }

      if (!merchant.is_active) {
        throw new UnauthorizedException('Merchant account is inactive');
      }

      // Attach merchant to request
      request.merchant = merchant;
      request.merchantId = merchant.id;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('API key validation failed');
    }
  }
}
