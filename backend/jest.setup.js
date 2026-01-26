// Jest setup file - configure test database before running tests
require('dotenv').config({ path: '.env' });

// Override DATABASE_URL with TEST_DATABASE_URL for tests
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

console.log('Jest test environment configured');
console.log('Database URL:', process.env.DATABASE_URL ? 'configured' : 'missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
