"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementVersion = exports.checkVersionConflict = void 0;
const errorHandler_1 = require("./errorHandler");
const checkVersionConflict = () => {
    return async (req, res, next) => {
        try {
            if (req.method !== 'PUT' &&
                req.method !== 'PATCH' &&
                req.method !== 'DELETE') {
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
            const { prisma } = req;
            if (!prisma) {
                return next();
            }
            const pathParts = req.path.split('/');
            const entityName = pathParts[3]; // Get entity name from /api/v1/{entity}/{id}
            const modelName = entityName?.slice(0, -1); // Remove 's' from plural (projects -> project)
            if (!modelName) {
                return next();
            }
            const model = prisma[modelName];
            if (!model || typeof model.findUnique !== 'function') {
                return next();
            }
            const existingEntity = await model.findUnique({
                where: { id: entityId },
            });
            if (!existingEntity) {
                return next();
            }
            if (existingEntity.version !== currentVersion) {
                throw new errorHandler_1.AppError('Version conflict: The record was modified by another user. Please refresh and try again.', 409);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkVersionConflict = checkVersionConflict;
const incrementVersion = (data) => {
    return {
        ...data,
        version: {
            increment: 1,
        },
    };
};
exports.incrementVersion = incrementVersion;
//# sourceMappingURL=optimisticLock.js.map