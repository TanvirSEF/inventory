import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async signUp(email: string, password: string, fullName: string) {
    // 1. Create user in Supabase Auth
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // This will be read by your SQL trigger
      },
    });

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Registration successful! Please verify your email.',
      userId: data.user?.id,
    };
  }
}