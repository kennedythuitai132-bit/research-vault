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
   * Executes a callback within a transaction that has the RLS tenant context set.
   * This is the ONLY safe way to query tenant-specific data.
   */
  async withTenant<T>(institutionId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // Set the Postgres session variable for this transaction
      // The 'true' flag makes it local to the transaction
      await tx.$executeRaw`SELECT set_config('app.current_institution_id', ${institutionId}, true)`;
      return fn(tx);
    });
  }
}