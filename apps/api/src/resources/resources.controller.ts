import { Controller, Post, Get, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsNumber()
  sizeBytes!: number;
}

@ApiTags('resources')
@Controller('resources')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ResourcesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async createResource(
    @CurrentUser() user: { id: string; institutionId: string },
    @Body() dto: CreateResourceDto,
  ) {
    if (!user.institutionId) {
      throw new BadRequestException('User does not belong to an institution');
    }

    const resource = await this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.resource.create({
        data: {
          projectId: dto.projectId,
          uploadedBy: user.id,
          name: dto.name,
          filePath: dto.filePath,
          mimeType: dto.mimeType,
          sizeBytes: BigInt(dto.sizeBytes),
        },
      });
    });

    return {
      ...resource,
      sizeBytes: resource.sizeBytes.toString(),
    };
  }

  @Get()
  async listResources(@CurrentUser() user: { id: string; institutionId: string }) {
    if (!user.institutionId) {
      throw new BadRequestException('User does not belong to an institution');
    }

    const resources = await this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.resource.findMany({
        orderBy: { createdAt: 'desc' },
      });
    });

    // Map over results to convert BigInt to string
    return resources.map((r) => ({
      ...r,
      sizeBytes: r.sizeBytes.toString(),
    }));
  }
}