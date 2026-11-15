import { Controller, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@Controller('users')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe(@CurrentUser() user: { id: string; institutionId: string }) {
    if (!user.institutionId) {
      throw new UnauthorizedException('User does not belong to an institution');
    }

    // Use withTenant to enforce RLS
    const dbUser = await this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.user.findUnique({
        where: { id: user.id },
      });
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found in database');
    }

    return dbUser;
  }
}