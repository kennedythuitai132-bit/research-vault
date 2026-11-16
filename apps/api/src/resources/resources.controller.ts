import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

class CreateResourceDto {
  @IsString() @IsNotEmpty() projectId!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() filePath!: string;
  @IsString() @IsNotEmpty() mimeType!: string;
  @IsNumber() sizeBytes!: number;
}

@ApiTags('resources')
@Controller('resources')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('CONTRIBUTOR', 'REVIEWER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'RESEARCHER')
  async createResource(
    @CurrentUser() user: { id: string; institutionId: string },
    @Body() dto: CreateResourceDto,
  ) {
    if (!user.institutionId) throw new BadRequestException('User does not belong to an institution');
    const resource = await this.prisma.withTenant(user.institutionId, async (tx) => {
      const newResource = await tx.resource.create({
        data: {
          institutionId: user.institutionId, // <-- FIXED: Added required field
          projectId: dto.projectId, 
          uploadedBy: user.id, 
          name: dto.name,
          filePath: dto.filePath, 
          mimeType: dto.mimeType, 
          sizeBytes: BigInt(dto.sizeBytes),
        },
      });
      await this.auditService.logAction(user.institutionId, user.id, 'UPLOAD_RESOURCE', 'Resource', newResource.id, tx);
      return newResource;
    });
    return { ...resource, sizeBytes: resource.sizeBytes.toString() };
  }

  @Get()
  async listResources(
    @CurrentUser() user: { id: string; institutionId: string },
    @Query('projectId') projectId?: string,
  ) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const resources = await tx.resource.findMany({
        where: { deletedAt: null, ...(projectId && { projectId }) },
        orderBy: { createdAt: 'desc' },
      });
      return resources.map((r) => ({ ...r, sizeBytes: r.sizeBytes.toString() }));
    });
  }

  @Get('versions')
  async getVersions(
    @CurrentUser() user: { id: string; institutionId: string },
    @Query('projectId') projectId: string,
    @Query('name') name: string,
  ) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const versions = await tx.resource.findMany({
        where: { projectId, name },
        orderBy: { version: 'desc' },
      });
      return versions.map((r) => ({ ...r, sizeBytes: r.sizeBytes.toString() }));
    });
  }

  @Get('trash')
  async listTrash(@CurrentUser() user: { id: string; institutionId: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const resources = await tx.resource.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      });
      return resources.map((r) => ({ ...r, sizeBytes: r.sizeBytes.toString() }));
    });
  }

  @Patch(':id/restore')
  async restoreResource(@CurrentUser() user: { id: string; institutionId: string }, @Param('id') id: string) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      await tx.resource.update({ where: { id }, data: { deletedAt: null } });
      return { success: true };
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('CONTRIBUTOR', 'REVIEWER', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'RESEARCHER')
  async deleteResource(@CurrentUser() user: { id: string; institutionId: string }, @Param('id') id: string) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      await tx.resource.update({ where: { id }, data: { deletedAt: new Date() } });
      await this.auditService.logAction(user.institutionId, user.id, 'DELETE_RESOURCE', 'Resource', id, tx);
      return { success: true };
    });
  }
}