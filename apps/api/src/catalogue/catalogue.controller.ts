import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('catalogue')
@UseGuards(SupabaseAuthGuard)
export class CatalogueController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getCatalogue() {
    try {
      return await this.prisma.researchDataset.findMany();
    } catch (e) {
      return [];
    }
  }
}