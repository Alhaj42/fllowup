"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const app_2 = require("./app");
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
const PORT = config_1.default.port || 3000;
(0, app_2.setupRoutes)();
const server = app_1.default.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT}`);
    logger_1.default.info(`Environment: ${config_1.default.nodeEnv || 'development'}`);
    logger_1.default.info(`API available at http://localhost:${PORT}/api/v1`);
});
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger_1.default.info('HTTP server closed');
        process.exit(0);
    });
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', { promise, reason });
});
process.on('uncaughtException', error => {
    logger_1.default.error('Uncaught Exception:', error);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map