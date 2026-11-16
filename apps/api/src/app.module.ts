import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CatalogueController } from './catalogue/catalogue.controller';
import { EnterpriseController } from './enterprise/enterprise.controller';
import { AppController } from './app.controller';
import { RegisterController } from './auth/register/register.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ResourcesModule } from './resources/resources.module';
import { ProjectsModule } from './projects/projects.module';
import { AuditModule } from './audit/audit.module';
import { DepartmentsModule } from './departments/departments.module';
import { AdminModule } from './admin/admin.module';
import { ShareModule } from './share/share.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Block IPs that make more than 50 requests per minute (global rate limit)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 50,
    }]),
    HealthModule,
    PrismaModule,
    UsersModule,
    ResourcesModule,
    ProjectsModule,
    AuditModule,
    DepartmentsModule,
    AdminModule,
    ShareModule,
    PublicModule,
  ],
  controllers: [EnterpriseController, CatalogueController, AppController, RegisterController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}