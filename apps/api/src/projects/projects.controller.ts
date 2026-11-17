import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('projects')
@UseGuards(SupabaseAuthGuard)
export class ProjectsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async listProjects() {
    return this.prisma.project.findMany({
      include: { department: true },
    });
  }

  @Post()
  async createProject(@Body() body: { name: string; departmentId: string }, @Req() req: any) {
    return this.prisma.project.create({
      data: {
        name: body.name,
        departmentId: body.departmentId,
        institutionId: req.user.institutionId,
      },
    });
  }
}