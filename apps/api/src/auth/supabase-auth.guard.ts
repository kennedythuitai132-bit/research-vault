import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService, private prisma: PrismaService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    this.supabase = createClient(url, key);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [AuthGuard] Missing or invalid Authorization header');
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ [AuthGuard] Supabase Auth Error:', error?.message);
      throw new UnauthorizedException('Invalid token');
    }

    console.log('✅ [AuthGuard] Token valid for user:', user.email);

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      console.log('❌ [AuthGuard] User not found in DB:', user.id);
      throw new UnauthorizedException('User not found in database');
    }

    console.log('✅ [AuthGuard] DB User found:', dbUser.email, 'Role:', dbUser.role);
    request.user = dbUser;
    return true;
  }
}