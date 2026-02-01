"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserFromToken = exports.verifyToken = exports.auth0Options = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
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
exports.auth0Options = {
    audience: AUTH0_AUDIENCE,
    issuer: AUTH0_DOMAIN,
    algorithms: ['RS256'],
};
const verifyToken = async (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, getKey, exports.auth0Options, (err, decoded) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(decoded);
            }
        });
    });
};
exports.verifyToken = verifyToken;
const extractUserFromToken = (token) => {
    const decoded = jsonwebtoken_1.default.decode(token);
    return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded['https://your-tenant.auth0.com/roles']?.[0] || 'TEAM_MEMBER',
        name: decoded.name || decoded['https://your-tenant.auth0.com/name'] || '',
    };
};
exports.extractUserFromToken = extractUserFromToken;
//# sourceMappingURL=auth0.js.map