import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      merchant?: {
        id: string;
        business_name: string;
        subdomain: string;
        api_key: string;
        owner_id: string;
        is_active: boolean;
        [key: string]: unknown;
      };
      merchantId?: string;
    }
  }
}
