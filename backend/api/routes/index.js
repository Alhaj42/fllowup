"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const router = (0, express_1.Router)();
// Apply middleware to all routes (CORS is handled globally in app.ts)
router.use((0, helmet_1.default)());
router.use(express_1.default.json());
// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API v1 routes
router.get('/', (req, res) => {
    res.json({
        version: 'v1',
        endpoints: {
            health: '/health',
            projects: '/projects',
            phases: '/phases',
            tasks: '/tasks',
            assignments: '/assignments',
            costs: '/costs',
            kpis: '/kpis',
            reports: '/reports',
            configuration: '/configuration',
            users: '/users',
            team: '/team',
        },
    });
});
// Import route handlers
const projectRoutes_1 = __importDefault(require("./projectRoutes"));
const phaseRoutes_1 = __importDefault(require("./phaseRoutes"));
const requirementRoutes_1 = __importDefault(require("./requirementRoutes"));
const configurationRoutes_1 = __importDefault(require("./configurationRoutes"));
const taskRoutes_1 = __importDefault(require("./taskRoutes"));
const assignmentRoutes_1 = __importDefault(require("./assignmentRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const kpiRoutes_1 = __importDefault(require("./kpiRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const teamRoutes_1 = __importDefault(require("./teamRoutes"));
// Mount routes - each only once!
router.use('/projects', projectRoutes_1.default);
router.use('/phases', phaseRoutes_1.default);
router.use('/phases/:phaseId/tasks', taskRoutes_1.default);
router.use('/phases/:phaseId/assignments', assignmentRoutes_1.default);
router.use('/assignments', assignmentRoutes_1.default);
router.use('/kpis', kpiRoutes_1.default);
router.use('/reports', reportRoutes_1.default);
router.use('/configuration', configurationRoutes_1.default);
router.use('/requirements', requirementRoutes_1.default);
router.use('/users', userRoutes_1.default);
router.use('/team', teamRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map