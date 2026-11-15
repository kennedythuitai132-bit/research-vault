import { Controller, Post, Get, Param, Body, UseGuards, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

@ApiTags('share')
@Controller('share')
export class ShareController {
  private supabaseAdmin: any;
  private readonly logger = new Logger(ShareController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      this.logger.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    } else if (key.startsWith('sb_secret_')) {
      this.logger.error('SUPABASE_SERVICE_ROLE_KEY uses new sb_secret_ format. Storage API requires legacy eyJ... JWT.');
    } else {
      this.supabaseAdmin = createClient(url, key);
      this.logger.log('ShareController initialized with admin client');
    }
  }

  @Post(':resourceId')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  async createShareLink(
    @CurrentUser() user: { id: string; institutionId: string },
    @Param('resourceId') resourceId: string,
    @Body('expiresInHours') expiresInHours: number,
  ) {
    if (!user.institutionId) throw new BadRequestException('No institution');

    const resource = await this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.resource.findUnique({ where: { id: resourceId } });
    });

    if (!resource) throw new NotFoundException('Resource not found');

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24));

    const link = await this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.sharedLink.create({
        data: {
          resourceId,
          token,
          expiresAt,
          createdBy: user.id,
        },
      });
    });

    return {
      token: link.token,
      expiresAt: link.expiresAt,
      url: `http://localhost:3000/share/${link.token}`,
    };
  }

  @Get(':token')
  async getSharedResource(@Param('token') token: string) {
    const link = await this.prisma.sharedLink.findUnique({
      where: { token },
      include: { resource: true },
    });

    if (!link) throw new NotFoundException('Share link not found');
    if (new Date() > link.expiresAt) throw new BadRequestException('Share link has expired');

    if (!this.supabaseAdmin) {
      this.logger.error('supabaseAdmin client not initialized. Check .env SUPABASE_SERVICE_ROLE_KEY.');
      throw new BadRequestException('Server misconfigured: admin client unavailable');
    }

    const { data, error } = await this.supabaseAdmin.storage
      .from('research-vault')
      .createSignedUrl(link.resource.filePath, 3600);

    if (error) {
      this.logger.error(`Storage error for path "${link.resource.filePath}": ${error.message}`);
      throw new BadRequestException(`Could not generate download link: ${error.message}`);
    }

    return {
      name: link.resource.name,
      mimeType: link.resource.mimeType,
      sizeBytes: link.resource.sizeBytes.toString(),
      downloadUrl: data.signedUrl,
      expiresAt: link.expiresAt,
    };
  }
}