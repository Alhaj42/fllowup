import request from 'supertest';
import app, { setupRoutes } from '../../src/app';
import { prisma } from '../../src/services/prismaClient';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'admin-user-id',
  email: 'admin@test.com',
  name: 'Admin User',
  role: Role.MANAGER,
};

let teamLeaderUser: { id: string; email: string; name: string; role: Role };

jest.mock('../../src/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    const token = req.headers.authorization as string;
    if (token && token.includes('team-leader')) {
      req.user = teamLeaderUser;
    } else {
      req.user = mockUser;
    }
    next();
  }),
}));

describe('POST /configuration', () => {
  const mockToken = 'mock-admin-token';

  beforeAll(async () => {
    setupRoutes();
    await prisma.user.create({
      data: mockUser,
    });

    const tlUser = await prisma.user.create({
      data: {
        id: 'team-leader-user-id',
        email: 'teamleader@test.com',
        name: 'Team Leader User',
        role: Role.TEAM_LEADER,
      },
    });
    teamLeaderUser = tlUser;
  });

  afterAll(async () => {
    await prisma.configurationItem.deleteMany({});
    await prisma.user.deleteMany({
      where: { id: mockUser.id },
    });
  });

  it('should create a configuration item', async () => {
    const newConfig = {
      category: 'PROJECT_TYPES',
      key: 'type_1',
      value: 'Residential',
      sortOrder: 1,
    };

    const response = await request(app)
      .post('/api/v1/configuration')
      .set('Authorization', `Bearer ${mockToken}`)
      .send(newConfig)
      .expect(201);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.category).toBe(newConfig.category);
    expect(response.body.data.key).toBe(newConfig.key);
    expect(response.body.data.value).toBe(newConfig.value);
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/v1/configuration')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ category: 'PROJECT_TYPES' })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.error).toContain('required');
  });

  it('should return 403 for non-MANAGER users', async () => {
    const teamLeaderToken = `Bearer mock-team-leader-${teamLeaderUser.id}`;

    const response = await request(app)
      .post('/api/v1/configuration')
      .set('Authorization', teamLeaderToken)
      .send({
        category: 'PROJECT_TYPES',
        key: 'type_1',
        value: 'Residential',
      })
      .expect(403);

    expect(response.body.error).toContain('Insufficient permissions');
  });
});
