import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('enterprise')
@UseGuards(SupabaseAuthGuard)
export class EnterpriseController {
  constructor(private prisma: PrismaService) {}

  @Get('catalogue')
  async getCatalogue() {
    try { return await this.prisma.researchDataset.findMany(); } catch (e) { return []; }
  }

  @Get('grants')
  async getGrants() {
    try { return await this.prisma.grant.findMany(); } catch (e) { return []; }
  }

  @Get('equipment')
  async getEquipment() {
    try { return await this.prisma.equipment.findMany(); } catch (e) { return []; }
  }
}