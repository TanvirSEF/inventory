import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class MerchantGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get merchant_id from route params, query params, body, or headers
    const merchantId =
      request.params.merchantId ||
      request.params.merchant_id ||
      request.query.merchant_id ||
      request.body.merchant_id ||
      request.headers['x-merchant-id'];

    if (!merchantId) {
      throw new ForbiddenException('Merchant ID is required');
    }

    // Verify user has access to this merchant
    const { data: merchant, error } = await this.supabaseService.client
      .from('merchants')
      .select('id, owner_id')
      .eq('id', merchantId)
      .single();

    if (error || !merchant) {
      throw new ForbiddenException('Merchant not found');
    }

    // Check if user is the owner or has access (you can extend this logic)
    if (merchant.owner_id !== user.id) {
      throw new ForbiddenException('Access denied to this merchant');
    }

    // Attach merchant to request
    request.merchant = merchant;
    request.merchantId = merchantId;

    return true;
  }
}
