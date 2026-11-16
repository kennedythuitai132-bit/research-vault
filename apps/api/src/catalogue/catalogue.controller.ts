import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('catalogue')
@Controller('catalogue')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class CatalogueController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getCatalogue(
    @CurrentUser() user: { id: string; institutionId: string; role: string },
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.prisma.withTenant(user.institutionId, async (tx) => {
      // 1. Fetch projects as datasets
      const projects = await tx.project.findMany({
        where: {
          ...(search && { name: { contains: search, mode: 'insensitive' } }),
          ...(departmentId && { departmentId }),
        },
        include: { 
          _count: { select: { resources: true } },
          department: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
      });

      // 2. Security Filter: Hide confidential data from Researchers
      const isAdminOrDirector = ['SUPER_ADMIN', 'INSTITUTION_ADMIN'].includes(user.role);

      return projects.map(p => ({
        id: p.id,
        name: p.name,
        department: p.department.name,
        filesCount: p._count.resources,
        createdAt: p.createdAt,
        // If they aren't admin, we mask the classification and owner
        classification: isAdminOrDirector ? 'RESTRICTED' : 'PUBLIC',
        accessLevel: isAdminOrDirector ? 'Full Access' : 'Request Access Required',
      }));
    });
  }
}