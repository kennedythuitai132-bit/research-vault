import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('enterprise')
@Controller('enterprise')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class EnterpriseController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('catalogue')
  async getCatalogue(@CurrentUser() user: { institutionId: string }) {
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.researchDataset.findMany();
    });
  }

  @Post('catalogue')
  @UseGuards(RolesGuard)
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async createDataset(@CurrentUser() user: any, @Body() body: any) {
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.researchDataset.create({
        data: { institutionId: user.institutionId, name: body.name, description: body.description, classification: body.classification, ownerId: user.id }
      });
    });
  }

  @Get('grants')
  async getGrants(@CurrentUser() user: any) {
    return this.prisma.withTenant(user.institutionId, async (tx) => tx.grant.findMany());
  }

  @Post('grants')
  @UseGuards(RolesGuard)
  @Roles('INSTITUTION_ADMIN', 'SUPER_ADMIN')
  async createGrant(@CurrentUser() user: any, @Body() body: any) {
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.grant.create({
        data: { institutionId: user.institutionId, name: body.name, funder: body.funder, amount: body.amount, endDate: new Date(body.endDate) }
      });
    });
  }

  @Get('equipment')
  async getEquipment(@CurrentUser() user: any) {
    return this.prisma.withTenant(user.institutionId, async (tx) => tx.equipment.findMany());
  }
}