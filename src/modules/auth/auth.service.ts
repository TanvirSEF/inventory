import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { MerchantsService } from '../merchants/merchants.service';
import { CreateMerchantDto } from '../merchants/dto/create-merchant.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly merchantsService: MerchantsService,
  ) {}

  async signUp(
    email: string,
    password: string,
    fullName: string,
    businessName: string,
    subdomain: string,
    categoryId: string,
  ) {
    // 1. Create user in Supabase Auth
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // This will be read by your SQL trigger
      },
    });

    if (error) throw new BadRequestException(error.message);

    if (!data.user?.id) {
      throw new BadRequestException('Failed to create user');
    }

    // 2. Create merchant account automatically with selected category
    const createMerchantDto: CreateMerchantDto = {
      businessName,
      subdomain,
    };

    const merchant = await this.merchantsService.create(
      data.user.id,
      createMerchantDto,
      categoryId,
    );

    return {
      message: 'Registration successful! Please verify your email.',
      userId: data.user.id,
      email: data.user.email,
      merchant: {
        id: merchant.id,
        businessName: merchant.business_name,
        subdomain: merchant.subdomain,
        apiKey: merchant.api_key,
        categoryId: merchant.category_id,
      },
    };
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!data.session) {
      throw new UnauthorizedException('Failed to create session');
    }

    return {
      message: 'Login successful',
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name,
      },
    };
  }
}