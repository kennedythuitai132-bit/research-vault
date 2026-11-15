import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit() {
    // Try to connect, but DO NOT crash the app if it fails.
    // Prisma will lazy-connect on the first actual query.
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Prisma connected to database');
    } catch (err: any) {
      this.logger.warn(`Initial Prisma connection failed: ${err.message}`);
      this.logger.warn('Server will start anyway. First query will retry connection.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Executes a callback within a transaction that enforces RLS.
   * Retries once on P1001/P2028 if the pooler is slow to warm up.
   */
  async withTenant<T>(
    institutionId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    retries = 2,
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.$transaction(
          async (tx) => {
            await tx.$executeRaw`SET LOCAL ROLE authenticated`;
            await tx.$executeRaw`SELECT set_config('app.current_institution_id', ${institutionId}, true)`;
            return fn(tx);
          },
          {
            maxWait: 15000,
            timeout: 30000,
          },
        );
      } catch (err: any) {
        lastError = err;
        const code = err?.code || '';
        // Retry only on connection/cold-start errors
        if ((code === 'P1001' || code === 'P2028' || code === 'P2024') && attempt < retries) {
          this.logger.warn(`DB connection retry ${attempt + 1}/${retries} (${code})`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }
}