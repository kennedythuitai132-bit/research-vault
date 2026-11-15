import { Controller, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@Controller('audit')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLogs(@CurrentUser() user: { id: string; institutionId: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to the 50 most recent logs
      });
    });
  }
}