import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Executes a callback within a transaction that enforces RLS.
   * We MUST switch to the 'authenticated' role, otherwise Postgres
   * bypasses RLS because we are connected as the superuser.
   */
  async withTenant<T>(institutionId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // 1. Switch to the role that RLS applies to
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
      // 2. Set the tenant context
      await tx.$executeRaw`SELECT set_config('app.current_institution_id', ${institutionId}, true)`;
      
      return fn(tx);
    }, {
      maxWait: 10000, // Wait up to 10 seconds to start the transaction
      timeout: 20000, // Allow the transaction to run for up to 20 seconds
    });
  }
}