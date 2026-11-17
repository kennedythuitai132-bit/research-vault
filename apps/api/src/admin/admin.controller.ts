import { Controller, Get, Patch, Param, Body, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('admin')
@UseGuards(SupabaseAuthGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async listUsers() {
    try {
      return await this.prisma.user.findMany({
        include: { institution: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new InternalServerErrorException("Failed to fetch users");
    }
  }

  @Patch('users/:id/approve')
  async approveUser(@Param('id') id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  @Patch('users/:id/role')
  async updateRole(@Param('id') id: string, @Body() body: { role: any }) {
    return this.prisma.user.update({
      where: { id },
      data: { role: body.role },
    });
  }
}