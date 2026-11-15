import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNotEmpty } from 'class-validator';

class CreateDepartmentDto {
  @IsString() @IsNotEmpty() name!: string;
}

@ApiTags('departments')
@Controller('departments')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listDepartments(@CurrentUser() user: { id: string; institutionId: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.department.findMany({ orderBy: { createdAt: 'desc' } });
    });
  }

  @Post()
  async createDepartment(
    @CurrentUser() user: { id: string; institutionId: string },
    @Body() dto: CreateDepartmentDto,
  ) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.department.create({
        data: {
          name: dto.name,
          institutionId: user.institutionId,
        },
      });
    });
  }
}