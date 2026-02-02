"use strict";
/**
 * TLS/SSL Configuration for Data in Transit (NFR-007)
 * Enforces TLS 1.3+ and strong cipher suites
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTLSConfig = void 0;
exports.getSecureCiphers = getSecureCiphers;
exports.getHSTSHeader = getHSTSHeader;
exports.validateTLSConfig = validateTLSConfig;
exports.getTLSEnvironmentVariables = getTLSEnvironmentVariables;
/**
 * Default TLS 1.3+ Configuration
 * Prioritizes strong cipher suites and modern TLS versions
 */
exports.defaultTLSConfig = {
    enabled: process.env.TLS_ENABLED !== 'false',
    // Require TLS 1.3 or higher
    minVersion: process.env.TLS_MIN_VERSION || 'TLSv1.3',
    // Certificate files (if not using reverse proxy)
    caFile: process.env.TLS_CA_FILE,
    keyFile: process.env.TLS_KEY_FILE,
    certFile: process.env.TLS_CERT_FILE,
    passphrase: process.env.TLS_PASSPHRASE,
    // Strong cipher suites (TLS 1.3+)
    // Prioritize ECDHE and GCM for forward secrecy
    ciphers: process.env.TLS_CIPHERS || [
        // TLS 1.3 cipher suites (recommended by NIST)
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        // AES-256 with SHA-384
        'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
        'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
        // Forward secrecy (ECDHE) ciphers
        'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384',
        'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384',
        // Disable weak ciphers
        '!SSLv3',
        '!TLSv1',
        '!TLSv1.1',
        '!TLSv1.2',
        '!SSLv2',
        '!TLS_ECDH_RSA_WITH_RC4_128_SHA',
        '!TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA',
        '!TLS_ECDH_RSA_WITH_AES_128_CBC_SHA',
        '!TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA',
        '!TLS_DHE_RSA_WITH_AES_128_CBC_SHA',
        '!TLS_DHE_DSS_WITH_AES_128_CBC_SHA',
        '!TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA',
        '!TLS_DHE_DSS_DES_CBC_SHA',
        // Disable static key ciphers (lack forward secrecy)
        '!TLS_RSA_WITH_AES_256_GCM_SHA384',
        '!TLS_RSA_WITH_AES_256_GCM_SHA256',
        '!TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384',
        '!TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA',
    ].join(':'),
    // Honor server cipher order (recommended for security)
    honorCipherOrder: process.env.TLS_HONOR_CIPHER_ORDER !== 'false',
    // Diffie-Hellman parameters (for ECDHE)
    dhparam: process.env.TLS_DHPARAM || 'auto',
    // ECDH curves (prefer x25519)
    ecdhCurve: process.env.TLS_EC_DH_CURVE || 'prime256v1:prime256v2',
    // HSTS (HTTP Strict Transport Security)
    hstsEnabled: process.env.HSTS_ENABLED !== 'false',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 365 days in seconds
    hstsIncludeSubdomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
    hstsPreload: process.env.HSTS_PRELOAD !== 'false',
};
/**
 * Generate secure ciphers string
 * @returns Comma-separated cipher list
 */
function getSecureCiphers() {
    return exports.defaultTLSConfig.ciphers || [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256',
        'DHE-RSA-AES256-GCM-SHA384',
        'DHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-SHA256',
        'ECDHE-ECDSA-AES256-SHA256',
        'ECDHE-RSA-AES256-SHA256',
    ].join(':');
}
/**
 * Generate HSTS header string
 * @param config TLS configuration
 * @returns HSTS header value
 */
function getHSTSHeader(config) {
    if (!config.hstsEnabled) {
        return '';
    }
    let header = `max-age=${config.hstsMaxAge}`;
    if (config.hstsIncludeSubdomains) {
        header += '; includeSubDomains';
    }
    if (config.hstsPreload) {
        header += '; preload';
    }
    return header;
}
/**
 * Validate TLS configuration
 * @param config Configuration to validate
 * @returns Validation result
 */
function validateTLSConfig(config) {
    const errors = [];
    // Validate minimum TLS version
    const validVersions = ['TLSv1.2', 'TLSv1.3'];
    if (config.minVersion && !validVersions.includes(config.minVersion)) {
        errors.push(`Invalid TLS minimum version: ${config.minVersion}. Must be one of: ${validVersions.join(', ')}`);
    }
    // Validate certificate files (if TLS is enabled)
    if (config.enabled) {
        if (config.keyFile && !config.certFile) {
            errors.push('If TLS key file is specified, certificate file must also be specified');
        }
        if (config.certFile && !config.keyFile) {
            errors.push('If TLS certificate file is specified, key file must also be specified');
        }
    }
    // Validate HSTS max age (max 1 year recommended)
    if (config.hstsMaxAge > 31536000) {
        errors.push('HSTS max age cannot exceed 365 days (31536000 seconds)');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
/**
 * Get TLS environment variables for documentation
 * @returns Object of environment variable names and descriptions
 */
function getTLSEnvironmentVariables() {
    return {
        TLS_ENABLED: 'Enable/disable TLS encryption (true/false)',
        TLS_MIN_VERSION: 'Minimum TLS version (e.g., TLSv1.3)',
        TLS_CA_FILE: 'Path to CA certificate file (optional)',
        TLS_KEY_FILE: 'Path to SSL/TLS private key file',
        TLS_CERT_FILE: 'Path to SSL/TLS certificate file',
        TLS_PASSPHRASE: 'Private key passphrase (if encrypted)',
        TLS_CIPHERS: 'Allowed cipher suites (colon-separated)',
        TLS_HONOR_CIPHER_ORDER: 'Honor server cipher order (true/false)',
        TLS_DHPARAM: 'Diffie-Hellman parameters',
        TLS_EC_DH_CURVE: 'ECDH curves (comma-separated)',
        HSTS_ENABLED: 'Enable HSTS header (true/false)',
        HSTS_MAX_AGE: 'HSTS max-age in seconds (max 31536000 = 365 days)',
        HSTS_INCLUDE_SUBDOMAINS: 'Include subdomains in HSTS (true/false)',
        HSTS_PRELOAD: 'Preload HSTS (true/false)',
    };
}
exports.default = exports.defaultTLSConfig;
//# sourceMappingURL=tls.js.map