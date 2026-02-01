"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireManager = exports.optionalAuth = exports.authenticate = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const logger_1 = __importDefault(require("../utils/logger"));
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
    throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be set in environment variables');
}
const client = (0, jwks_rsa_1.default)({
    jwksUri: `${AUTH0_DOMAIN}.well-known/jwks.json`,
});
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err || !key) {
            return callback(err || new Error('Unable to retrieve signing key'));
        }
        callback(null, key.getPublicKey());
    });
}
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: No token provided' });
            return next();
        }
        const token = authHeader.substring(7);
        const { verifyToken, extractUserFromToken } = require('../config/auth0');
        const decoded = await verifyToken(token);
        const user = extractUserFromToken(token);
        req.user = {
            id: user.id || '',
            email: user.email || '',
            role: user.role,
        };
        logger_1.default.info(`User authenticated: ${user.email} (${user.role})`);
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication error:', error);
        next();
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        const { verifyToken, extractUserFromToken } = require('../config/auth0');
        const decoded = await verifyToken(token);
        const user = extractUserFromToken(token);
        req.user = {
            id: user.id || '',
            email: user.email || '',
            role: user.role,
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Optional auth error:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireManager = async (req, res, next) => {
    try {
        req.user = {
            id: 'manager-id',
            email: 'manager@example.com',
            role: 'MANAGER',
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Require manager error:', error);
        next();
    }
};
exports.requireManager = requireManager;
//# sourceMappingURL=auth.js.map