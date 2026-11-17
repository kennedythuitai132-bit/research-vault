import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('resources')
@UseGuards(SupabaseAuthGuard)
export class ResourcesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listResources() {
    try {
      return await this.prisma.resource.findMany();
    } catch (e) {
      return [];
    }
  }

  @Get('trash')
  async listTrash() {
    try {
      return await this.prisma.resource.findMany({ where: { deletedAt: { not: null } } });
    } catch (e) {
      return [];
    }
  }
}