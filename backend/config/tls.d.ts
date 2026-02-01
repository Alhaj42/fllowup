/**
 * TLS/SSL Configuration for Data in Transit (NFR-007)
 * Enforces TLS 1.3+ and strong cipher suites
 */
export interface TLSConfig {
    enabled: boolean;
    minVersion: string;
    caFile?: string;
    keyFile?: string;
    certFile?: string;
    passphrase?: string;
    ciphers?: string;
    honorCipherOrder: boolean;
    dhparam?: string;
    ecdhCurve?: string;
    hstsEnabled: boolean;
    hstsMaxAge: number;
    hstsIncludeSubdomains: boolean;
    hstsPreload: boolean;
}
/**
 * Default TLS 1.3+ Configuration
 * Prioritizes strong cipher suites and modern TLS versions
 */
export declare const defaultTLSConfig: TLSConfig;
/**
 * Generate secure ciphers string
 * @returns Comma-separated cipher list
 */
export declare function getSecureCiphers(): string;
/**
 * Generate HSTS header string
 * @param config TLS configuration
 * @returns HSTS header value
 */
export declare function getHSTSHeader(config: TLSConfig): string;
/**
 * Validate TLS configuration
 * @param config Configuration to validate
 * @returns Validation result
 */
export declare function validateTLSConfig(config: TLSConfig): {
    valid: boolean;
    errors: string[];
};
/**
 * Get TLS environment variables for documentation
 * @returns Object of environment variable names and descriptions
 */
export declare function getTLSEnvironmentVariables(): Record<string, string>;
export default defaultTLSConfig;
//# sourceMappingURL=tls.d.ts.map