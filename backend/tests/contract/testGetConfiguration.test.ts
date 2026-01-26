import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { prisma } from '../../src/services/prismaClient';

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'MANAGER',
};

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = mockUser;
    next();
  }),
}));

describe('GET /configuration/:category', () => {
  beforeAll(async () => {
    setupRoutes();
    await prisma.configurationItem.createMany({
      data: [
        {
          category: 'PHASE_NAMES',
          key: 'phase_1',
          value: 'Studies',
          isActive: true,
          sortOrder: 1,
        },
        {
          category: 'PHASE_NAMES',
          key: 'phase_2',
          value: 'Design',
          isActive: true,
          sortOrder: 2,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.configurationItem.deleteMany({
      where: { category: 'PHASE_NAMES' },
    });
  });

  it('should return configuration items for a category', async () => {
    const response = await request(app)
      .get('/api/v1/configuration/PHASE_NAMES')
      .set('Authorization', `Bearer mock-token-${mockUser.id}`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0]).toHaveProperty('category', 'PHASE_NAMES');
    expect(response.body.data[0]).toHaveProperty('key');
    expect(response.body.data[0]).toHaveProperty('value');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const response = await request(app)
      .get('/api/v1/configuration/PHASE_NAMES')
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  it('should return empty array for non-existent category', async () => {
    const response = await request(app)
      .get('/api/v1/configuration/NONEXISTENT')
      .set('Authorization', `Bearer mock-token-${mockUser.id}`)
      .expect(200);

    expect(response.body.data).toEqual([]);
  });
});
