import { Request, Response, NextFunction } from 'express';
import { AuditEntityType } from '@prisma/client';
import AuditLogService from '../services/auditLogService';
import { AuthRequest } from './auth';

export const auditMiddleware = (entityType: AuditEntityType) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: unknown;
    const statusCode = res.statusCode;

    const logAudit = async () => {
      if (!req.user || statusCode >= 400) return;

      const entityId = req.params.id || (res.locals.entityId as string);
      if (!entityId) return;

      try {
        if (req.method === 'POST') {
          await AuditLogService.logCreate(
            entityType,
            entityId,
            req.user.id,
            req.body
          );
        } else if (req.method === 'PUT' || req.method === 'PATCH') {
          const originalData = res.locals.originalData;
          await AuditLogService.logUpdate(
            entityType,
            entityId,
            req.user.id,
            originalData,
            req.body
          );
        } else if (req.method === 'DELETE') {
          await AuditLogService.logDelete(
            entityType,
            entityId,
            req.user.id,
            res.locals.originalData
          );
        }
      } catch (error) {
        console.error('Audit middleware error:', error);
      }
    };

    res.send = function (body: unknown) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function (body: unknown) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    res.on('finish', async () => {
      await logAudit();
    });

    next();
  };
};
