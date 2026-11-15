import { Controller, Get, Patch, Param, Body, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Get('stats')
  async getInstitutionStats(@CurrentUser() user: { id: string; institutionId: string; role: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can view institution stats');
    }

    return this.prisma.withTenant(user.institutionId, async (tx) => {
      const [users, projects, resources] = await Promise.all([
        tx.user.count(),
        tx.project.count(),
        tx.resource.count({ where: { deletedAt: null } }),
      ]);

      const storage = await tx.resource.aggregate({
        where: { deletedAt: null },
        _sum: { sizeBytes: true },
      });

      return {
        totalUsers: users,
        totalProjects: projects,
        totalFiles: resources,
        totalStorageBytes: storage._sum.sizeBytes?.toString() || "0",
      };
    });
  }

  @Get('users')
  async listUsers(@CurrentUser() user: { id: string; institutionId: string; role: string }) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Only admins can list users');
    
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      });
    });
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @CurrentUser() user: { id: string; institutionId: string; role: string },
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (!user.institutionId) throw new BadRequestException('No institution');
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Only admins can change roles');

    const updated = await this.prisma.withTenant(user.institutionId, async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target) throw new ForbiddenException('User not found in your institution');
      
      const result = await tx.user.update({ where: { id }, data: { role: dto.role } });
      await this.auditService.logAction(user.institutionId, user.id, 'CHANGE_USER_ROLE', 'User', id, tx);
      return result;
    });

    return { id: updated.id, role: updated.role, fullName: updated.fullName };
  }
}