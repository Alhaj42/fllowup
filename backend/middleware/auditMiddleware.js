"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditMiddleware = void 0;
const auditLogService_1 = require("../services/auditLogService");
const auditMiddleware = (entityType) => {
    return async (req, res, next) => {
        const originalSend = res.send;
        const originalJson = res.json;
        let responseBody;
        const statusCode = res.statusCode;
        const logAudit = async () => {
            if (!req.user || statusCode >= 400)
                return;
            const entityId = req.params.id || res.locals.entityId;
            if (!entityId)
                return;
            try {
                if (req.method === 'POST') {
                    await auditLogService_1.AuditLogService.logCreate(entityType, entityId, req.user.id, req.user.role, req.body);
                }
                else if (req.method === 'PUT' || req.method === 'PATCH') {
                    const originalData = res.locals.originalData;
                    await auditLogService_1.AuditLogService.logUpdate(entityType, entityId, req.user.id, req.user.role, originalData, req.body);
                }
                else if (req.method === 'DELETE') {
                    await auditLogService_1.AuditLogService.logDelete(entityType, entityId, req.user.id, req.user.role, res.locals.originalData);
                }
            }
            catch (error) {
                console.error('Audit middleware error:', error);
            }
        };
        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };
        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };
        res.on('finish', async () => {
            await logAudit();
        });
        next();
    };
};
exports.auditMiddleware = auditMiddleware;
//# sourceMappingURL=auditMiddleware.js.map