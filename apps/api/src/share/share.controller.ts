import { Controller, Post, Get, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsNumber } from 'class-validator';
import * as crypto from 'crypto';

class CreateShareDto {
  @IsNumber() expiresInHours!: number;
}

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(':resourceId')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  async createShare(
    @CurrentUser() user: { institutionId: string },
    @Param('resourceId') resourceId: string,
    @Body() dto: CreateShareDto,
  ) {
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + dto.expiresInHours);

      const link = await tx.sharedLink.create({
        data: { resourceId, token, expiresAt },
      });

      return { ...link, url: `http://localhost:3000/share/${token}` };
    });
  }

  @Get(':token')
  async getSharedResource(@Param('token') token: string) {
    const link = await this.prisma.sharedLink.findUnique({
      where: { token },
      include: { resource: true },
    });

    if (!link) throw new NotFoundException('Link not found');
    if (new Date() > link.expiresAt) throw new NotFoundException('Link expired');

    return link.resource;
  }
}