import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN || !AUTH0_AUDIENCE) {
  throw new Error('AUTH0_DOMAIN and AUTH0_AUDIENCE must be set in environment variables');
}

const client = jwksClient({
  jwksUri: `${AUTH0_DOMAIN}.well-known/jwks.json`,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      return callback(err || new Error('Unable to retrieve signing key'));
    }
    callback(null, key.getPublicKey());
  });
}

export const auth0Options = {
  audience: AUTH0_AUDIENCE,
  issuer: AUTH0_DOMAIN,
  algorithms: ['RS256'] as jwt.Algorithm[],
};

export const verifyToken = async (token: string): Promise<jwt.JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, auth0Options, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as jwt.JwtPayload);
      }
    });
  });
};

export const extractUserFromToken = (token: string) => {
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded['https://your-tenant.auth0.com/roles']?.[0] || 'TEAM_MEMBER',
    name: decoded.name || decoded['https://your-tenant.auth0.com/name'] || '',
  };
};
