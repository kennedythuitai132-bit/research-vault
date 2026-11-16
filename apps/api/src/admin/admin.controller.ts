import { Controller, Get, Patch, Post, Param, Body, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@prisma/client';
import { IsEnum, IsEmail, IsString, IsNotEmpty } from 'class-validator';

class UpdateRoleDto { @IsEnum(UserRole) role!: UserRole; }
class InviteUserDto { @IsEmail() email!: string; @IsString() @IsNotEmpty() fullName!: string; @IsEnum(UserRole) role!: UserRole; }

@ApiTags('admin')
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AdminController {
  private supabaseAdmin: any;

  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService, private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) this.supabaseAdmin = createClient(url, key);
  }

  private async verifyAdmin(user: { id: string; institutionId: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    const dbUser = await this.prisma.withTenant(user.institutionId, async (tx) => tx.user.findUnique({ where: { id: user.id } }));
    if (!dbUser || (dbUser.role !== 'INSTITUTION_ADMIN' && dbUser.role !== 'SUPER_ADMIN')) throw new ForbiddenException('Only admins');
    return dbUser;
  }

  @Get('users')
  async listUsers(@CurrentUser() user: { id: string; institutionId: string }) {
    await this.verifyAdmin(user);
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.user.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, email: true, fullName: true, role: true, isApproved: true, createdAt: true } });
    });
  }

  @Patch('users/:id/approve')
  async approveUser(@CurrentUser() user: { id: string; institutionId: string }, @Param('id') id: string) {
    await this.verifyAdmin(user);
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const updated = await tx.user.update({ where: { id }, data: { isApproved: true } });
      await this.auditService.logAction(user.institutionId, user.id, 'APPROVE_USER', 'User', id, tx);
      return updated;
    });
  }

  @Patch('users/:id/role')
  async updateUserRole(@CurrentUser() user: { id: string; institutionId: string }, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    await this.verifyAdmin(user);
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const result = await tx.user.update({ where: { id }, data: { role: dto.role } });
      await this.auditService.logAction(user.institutionId, user.id, 'CHANGE_USER_ROLE', 'User', id, tx);
      return result;
    });
  }
}