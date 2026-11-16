import { Controller, Post, Get, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNotEmpty } from 'class-validator';

class CreateProjectDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() departmentId!: string;
}

@ApiTags('projects')
@Controller('projects')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listProjects(@CurrentUser() user: { id: string; institutionId: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { resources: true } } },
      });
    });
  }

  @Post()
  async createProject(@CurrentUser() user: { id: string; institutionId: string }, @Body() dto: CreateProjectDto) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.project.create({
        data: { name: dto.name, institutionId: user.institutionId, departmentId: dto.departmentId },
      });
    });
  }

  @Delete(':id')
  async deleteProject(@CurrentUser() user: { id: string; institutionId: string }, @Param('id') id: string) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      await tx.project.delete({ where: { id } });
      return { success: true };
    });
  }
}