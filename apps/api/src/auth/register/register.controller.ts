import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() password!: string;
  @IsString() @IsNotEmpty() fullName!: string;
}

// Allowed public domains (Gmail, Outlook, etc.)
const PUBLIC_DOMAINS = ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com'];

@ApiTags('auth')
@Controller('auth')
export class RegisterController {
  private supabaseAdmin: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) this.supabaseAdmin = createClient(url, key);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    if (!this.supabaseAdmin) throw new BadRequestException('Server misconfigured');

    const emailDomain = dto.email.split('@')[1]?.toLowerCase().trim();
    if (!emailDomain) throw new BadRequestException('Invalid email address');

    // 1. Try to find an institution matching the email domain exactly
    let institution = await this.prisma.institution.findUnique({
      where: { domain: emailDomain },
    });

    // 2. If no institution found, check if it's a public email domain
    if (!institution) {
      const isPublic = PUBLIC_DOMAINS.includes(emailDomain) || emailDomain.endsWith('.onmicrosoft.com');
      
      if (isPublic) {
        // Find a "General" or "Public" institution to attach them to, or create a fallback one
        let fallback = await this.prisma.institution.findUnique({ where: { domain: 'public.users' } });
        if (!fallback) {
          fallback = await this.prisma.institution.create({
            data: { name: 'Public Users (Pending Assignment)', domain: 'public.users' }
          });
        }
        institution = fallback;
      } else {
        throw new BadRequestException(`The domain @${emailDomain} is not registered as a university. Please contact admin.`);
      }
    }

    // 3. Create the user in Supabase Auth
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { institution_id: institution.id, full_name: dto.fullName },
    });

    if (authError) throw new BadRequestException(authError.message);

    // 4. Create user in our DB
    await this.prisma.user.create({
      data: {
        id: authData.user.id,
        institutionId: institution.id,
        email: dto.email,
        fullName: dto.fullName,
        role: 'RESEARCHER',
        isApproved: false,
      },
    });

    return { success: true, message: 'Account created. Waiting for admin approval.' };
  }
}