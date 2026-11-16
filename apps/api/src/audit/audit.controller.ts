import { Controller, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('audit')
@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN', 'AUDITOR')
  async getAuditLogs(@CurrentUser() user: { institutionId: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: { select: { fullName: true, email: true } } },
      });
    });
  }
}