import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from './errorHandler';
import { AuthRequest } from './auth';

interface VersionedRequest extends AuthRequest {
  body: {
    version?: number;
    [key: string]: unknown;
  };
}

export const checkVersionConflict = () => {
  return async (
    req: VersionedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (
        req.method !== 'PUT' &&
        req.method !== 'PATCH' &&
        req.method !== 'DELETE'
      ) {
        return next();
      }

      const currentVersion = req.body.version;
      const entityId = req.params.id;

      if (!currentVersion && req.method !== 'DELETE') {
        return next();
      }

      if (!entityId) {
        return next();
      }

      const { prisma } = req as typeof req & { prisma?: PrismaClient };

      if (!prisma) {
        return next();
      }

      const entityName = req.path.split('/')[2];
      const modelName = entityName?.slice(0, -1);

      if (!modelName) {
        return next();
      }

      const model: Record<string, unknown> = prisma[modelName as keyof PrismaClient];

      if (!model || typeof (model.findUnique as () => unknown) !== 'function') {
        return next();
      }

      const existingEntity = await (model.findUnique as (args: { where: { id: string } }) => Promise<{ version: number } | null>)({
        where: { id: entityId },
      });

      if (!existingEntity) {
        return next();
      }

      if (existingEntity.version !== currentVersion) {
        throw new AppError(
          'Version conflict: The record was modified by another user. Please refresh and try again.',
          409
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const incrementVersion = (data: Record<string, unknown>): Record<string, unknown> => {
  return {
    ...data,
    version: {
      increment: 1,
    },
  };
};
