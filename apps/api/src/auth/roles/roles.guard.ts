import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // DELETE requests have no body, so use optional chaining on both body and params
    let projectId = request.body?.projectId || request.params?.projectId;

    // If this is a route with only :id (like DELETE /resources/:id), look up the resource
    // to find its parent project, then check role assignments against that project.
    if (!projectId && request.params?.id) {
      const resource = await this.prisma.withTenant(user.institutionId, async (tx) => {
        return tx.resource.findUnique({ where: { id: request.params.id } });
      });
      if (resource) {
        projectId = resource.projectId;
      }
    }

    if (!projectId) {
      throw new ForbiddenException('Cannot determine project context for this action');
    }

    const assignment = await this.prisma.withTenant(user.institutionId, async (tx) => {
      return tx.roleAssignment.findFirst({
        where: {
          userId: user.id,
          scopeType: 'PROJECT',
          scopeId: projectId,
          role: { in: requiredRoles },
        },
      });
    });

    if (!assignment) {
      throw new ForbiddenException('You do not have permission to perform this action on this project');
    }

    return true;
  }
}