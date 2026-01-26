import request from 'supertest';
import express from 'express';
import taskRoutes from '../../../src/api/routes/taskRoutes';
import { authenticate } from '../../../src/middleware/auth';

// Mock dependencies
jest.mock('../../../src/middleware/auth', () => ({
    authenticate: (req: any, res: any, next: any) => {
        req.user = { id: 'user-1', role: 'MANAGER' };
        next();
    },
}));

jest.mock('../../../src/services/taskService');

const app = express();
app.use(express.json());
app.use('/tasks', taskRoutes);

describe('Task API Contracts', () => {
    it('POST /tasks should return 201 created', async () => {
        const mockTask = {
            phaseId: 'phase-1',
            code: 'T001',
            description: 'New Task',
            duration: 3,
        };

        // Mock implementation handled by __mocks__ or automatic mock, 
        // strictly we should mock the service method return here if we want to test the route logic:
        const TaskService = require('../../../src/services/taskService').default;
        TaskService.prototype.createTask.mockResolvedValue({ ...mockTask, id: 'task-1', status: 'PLANNED' });

        const response = await request(app)
            .post('/tasks')
            .send(mockTask);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.code).toBe(mockTask.code);
    });

    // Add more endpoint tests...
});
