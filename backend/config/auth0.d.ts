import jwt from 'jsonwebtoken';
export declare const auth0Options: {
    audience: string;
    issuer: string;
    algorithms: jwt.Algorithm[];
};
export declare const verifyToken: (token: string) => Promise<jwt.JwtPayload>;
export declare const extractUserFromToken: (token: string) => {
    id: string;
    email: any;
    role: any;
    name: any;
};
//# sourceMappingURL=auth0.d.ts.map