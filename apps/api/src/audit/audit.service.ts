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
    resourceType: string,
    resourceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx || this.prisma;
    
    // We need to calculate a hash for the audit trail
    const lastLog = await db.auditLog.findFirst({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
    });

    const prevHash = lastLog ? lastLog.rowHash : 'GENESIS';
    const dataToHash = `${prevHash}${actorId}${action}${resourceType}${resourceId}${Date.now()}`;
    const rowHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    return db.auditLog.create({
      data: {
        institutionId,
        actorId, // <-- FIXED: Maps to the new field
        action,
        resourceType,
        resourceId,
        rowHash,
      },
    });
  }
}