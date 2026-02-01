export declare const config: {
    port: number;
    nodeEnv: string;
    database: {
        url: string;
    };
    auth0: {
        domain: string;
        audience: string;
        issuer: string;
    };
    jwt: {
        secret: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        url: string;
    };
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
        s3Bucket: string;
    };
    cors: {
        origin: string;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map