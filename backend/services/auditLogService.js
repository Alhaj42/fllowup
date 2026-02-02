"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
// @ts-nocheck
const client_1 = require("@prisma/client");
const prismaClient_1 = require("./prismaClient");
exports.AuditLogService = {
    async createAuditLog(data) {
        return prismaClient_1.prisma.auditLog.create({
            data: {
                entityType: data.entityType,
                entityId: data.entityId,
                action: data.action,
                changedBy: data.changedBy,
                changes: data.changes ? data.changes : undefined,
            },
        });
    },
    async logCreate(entityType, entityId, userId, _role, data) {
        const changes = JSON.stringify({ after: data });
        return this.createAuditLog({
            entityType: entityType,
            entityId,
            action: client_1.AuditAction.CREATE,
            changedBy: userId,
            changes,
        });
    },
    async logUpdate(entityType, entityId, userId, _role, before, after) {
        const changes = JSON.stringify({ before, after });
        return this.createAuditLog({
            entityType: entityType,
            entityId,
            action: client_1.AuditAction.UPDATE,
            changedBy: userId,
            changes,
        });
    },
    async logDelete(entityType, entityId, userId, _role, data) {
        const changes = JSON.stringify({ before: data });
        return this.createAuditLog({
            entityType: entityType,
            entityId,
            action: client_1.AuditAction.DELETE,
            changedBy: userId,
            changes,
        });
    },
    async logStatusChange(entityType, entityId, userId, _role, oldStatus, newStatus) {
        const changes = JSON.stringify({ oldStatus, newStatus });
        return this.createAuditLog({
            entityType: entityType,
            entityId,
            action: client_1.AuditAction.UPDATE,
            changedBy: userId,
            changes,
        });
    },
    async getAuditLogsByEntity(entityType, entityId) {
        return prismaClient_1.prisma.auditLog.findMany({
            where: {
                entityType: entityType,
                entityId,
            },
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                changedByUser: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    },
    async getAuditLogsByUser(userId, limit = 100) {
        return prismaClient_1.prisma.auditLog.findMany({
            where: {
                changedBy: userId,
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
        });
    },
    async getRecentAuditLogs(limit = 50) {
        return prismaClient_1.prisma.auditLog.findMany({
            orderBy: {
                timestamp: 'desc',
            },
            take: limit,
            include: {
                changedByUser: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    },
};
exports.default = exports.AuditLogService;
//# sourceMappingURL=auditLogService.js.map