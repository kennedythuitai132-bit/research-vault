import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

class CreateResourceDto {
  @IsString() @IsNotEmpty() projectId!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() filePath!: string;
  @IsString() @IsNotEmpty() mimeType!: string;
  @IsNumber() sizeBytes!: number;
  @IsOptional() @IsArray() tags?: string[];
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
  @Roles('CONTRIBUTOR', 'REVIEWER')
  async createResource(
    @CurrentUser() user: { id: string; institutionId: string },
    @Body() dto: CreateResourceDto,
  ) {
    if (!user.institutionId) throw new BadRequestException('User does not belong to an institution');
    
    const resource = await this.prisma.withTenant(user.institutionId, async (tx) => {
      // Check if a file with the same name already exists in this project
      const existing = await tx.resource.findFirst({
        where: { projectId: dto.projectId, name: dto.name, isLatest: true, deletedAt: null },
      });

      let version = 1;

      if (existing) {
        // Mark the old version as not latest
        await tx.resource.update({
          where: { id: existing.id },
          data: { isLatest: false },
        });
        version = existing.version + 1;
      }

      const newResource = await tx.resource.create({
        data: {
          projectId: dto.projectId,
          uploadedBy: user.id,
          name: dto.name,
          filePath: dto.filePath,
          mimeType: dto.mimeType,
          sizeBytes: BigInt(dto.sizeBytes),
          version,
          tags: dto.tags || [],
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
    if (!user.institutionId) throw new BadRequestException('User does not belong to an institution');
    
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const resources = await tx.resource.findMany({
        where: { 
          deletedAt: null,
          isLatest: true, // Only show the newest versions
          ...(projectId && { projectId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return resources.map((r) => ({ ...r, sizeBytes: r.sizeBytes.toString() }));
    });
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('CONTRIBUTOR', 'REVIEWER')
  async deleteResource(
    @CurrentUser() user: { id: string; institutionId: string },
    @Param('id') id: string,
  ) {
    if (!user.institutionId) throw new BadRequestException('User does not belong to an institution');
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      await tx.resource.update({ where: { id }, data: { deletedAt: new Date(), isLatest: false } });
      await this.auditService.logAction(user.institutionId, user.id, 'DELETE_RESOURCE', 'Resource', id, tx);
      return { success: true };
    });
  }
}