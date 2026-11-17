import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('audit')
@UseGuards(SupabaseAuthGuard)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAuditLogs() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' } });
  }
}