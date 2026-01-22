import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /projects API Contract', () => {
  let authToken: string;
  let testClient: { id: string; name: string };

  beforeAll(async () => {
    const client = await prisma.client.create({
      data: {
        name: 'Test Client',
        contactEmail: 'test@example.com',
        contactPhone: '123-456-7890',
      },
    });
    testClient = client;

    const user = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Test Manager',
        role: 'MANAGER',
      },
    });

    authToken = 'test-token';
  });

  afterAll(async () => {
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.$disconnect();
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 without required fields', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid built-up area', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: 'CONTRACT-001',
        contractSigningDate: '2024-01-01',
        builtUpArea: -1000,
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid date sequence (contract after start)', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: 'CONTRACT-002',
        contractSigningDate: '2024-02-01',
        builtUpArea: 1000,
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid date sequence (start after end)', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: 'CONTRACT-003',
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-03-15',
        estimatedEndDate: '2024-01-15',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 409 for duplicate contract code', async () => {
    const contractCode = `CONTRACT-${Date.now()}`;

    await prisma.project.create({
      data: {
        clientId: testClient.id,
        name: 'Existing Project',
        contractCode,
        contractSigningDate: new Date('2024-01-01'),
        builtUpArea: 1000,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-03-15'),
      },
    });

    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Duplicate Project',
        contractCode,
        contractSigningDate: '2024-01-01',
        builtUpArea: 2000,
        startDate: '2024-02-01',
        estimatedEndDate: '2024-04-01',
      });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  it('should create project with all valid fields', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Valid Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1500,
        licenseType: 'Commercial',
        projectType: 'Studies',
        requirements: 'Test requirements',
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('contractCode');
    expect(response.body).toHaveProperty('clientId');
    expect(response.body).toHaveProperty('currentPhase');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('version');
    expect(response.body.name).toBe('Valid Project');
    expect(response.body.contractCode).toMatch(/^CONTRACT-/);
    expect(response.body.currentPhase).toBe('STUDIES');
    expect(response.body.status).toBe('PLANNED');
  });

  it('should create project with optional fields', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Minimal Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
        modificationAllowedTimes: 5,
        modificationDaysPerTime: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body.modificationAllowedTimes).toBe(5);
    expect(response.body.modificationDaysPerTime).toBe(10);
  });

  it('should validate license type enum', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        licenseType: 'INVALID',
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
      });

    expect(response.status).toBe(400);
  });

  it('should validate built-up area is required', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: testClient.id,
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
      });

    expect(response.status).toBe(400);
  });

  it('should require valid client ID', async () => {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        clientId: 'invalid-client-id',
        name: 'Test Project',
        contractCode: `CONTRACT-${Date.now()}`,
        contractSigningDate: '2024-01-01',
        builtUpArea: 1000,
        startDate: '2024-01-15',
        estimatedEndDate: '2024-03-15',
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
