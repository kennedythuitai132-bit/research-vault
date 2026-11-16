import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('institutions')
  async getInstitutions() {
    try {
      return await this.prisma.institution.findMany({
        select: { id: true, name: true, domain: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      // If DB connection fails, return empty array instead of crashing
      console.error('Failed to fetch institutions:', error);
      return [];
    }
  }
}