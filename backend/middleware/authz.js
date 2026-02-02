"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTeamLeader = exports.requireManager = exports.authorizeRole = exports.authorize = void 0;
const roleHierarchy = {
    MANAGER: 3,
    TEAM_LEADER: 2,
    TEAM_MEMBER: 1,
};
const authorize = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized: No user context' });
                return;
            }
            const userRole = req.user.role;
            if (!allowedRoles.includes(userRole)) {
                res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
exports.authorize = authorize;
const authorizeRole = (minimumRole) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized: No user context' });
                return;
            }
            const userRole = req.user.role;
            const userLevel = roleHierarchy[userRole] ?? 0;
            const requiredLevel = roleHierarchy[minimumRole] ?? 0;
            if (userLevel < requiredLevel) {
                res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
exports.authorizeRole = authorizeRole;
exports.requireManager = (0, exports.authorizeRole)('MANAGER');
exports.requireTeamLeader = (0, exports.authorizeRole)('TEAM_LEADER');
//# sourceMappingURL=authz.js.map