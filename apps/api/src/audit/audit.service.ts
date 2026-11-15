import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    institutionId: string,
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    tx: Prisma.TransactionClient,
  ) {
    // 1. Get the most recent log for this institution to get the previous hash
    const lastLog = await tx.auditLog.findFirst({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });

    const prevHash = lastLog ? lastLog.rowHash : 'GENESIS';

    // 2. Calculate the new hash
    // The hash is based on the content of this log + the previous hash
    const timestamp = new Date().toISOString();
    const payload = `${action}:${actorId}:${targetType}:${targetId}:${timestamp}:${prevHash}`;
    
    const rowHash = crypto.createHash('sha256').update(payload).digest('hex');

    // 3. Insert the new log
    return tx.auditLog.create({
      data: {
        institutionId,
        actorId,
        action,
        targetType,
        targetId,
        prevHash,
        rowHash,
        metadata: { timestamp },
      },
    });
  }
}