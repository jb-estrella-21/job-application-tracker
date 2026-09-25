import { afterEach, describe, expect, it } from 'vitest';
import { assertSafeTestDatabaseEnvironment } from './test-database-safety.js';

const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
};

function restoreEnvironment() {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('test database safety guard', () => {
  afterEach(restoreEnvironment);

  it('fails closed without explicit test database configuration', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/job_tracker';
    delete process.env.TEST_DATABASE_URL;

    expect(assertSafeTestDatabaseEnvironment).toThrow('TEST_DATABASE_URL');
  });

  it('rejects a database whose name is not clearly a test database', () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/job_tracker';
    process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;

    expect(assertSafeTestDatabaseEnvironment).toThrow('clearly identifies');
  });

  it('accepts only explicit matching test database URLs', () => {
    const testDatabaseUrl =
      'postgresql://user:password@localhost:5432/job_tracker_test';
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.TEST_DATABASE_URL = testDatabaseUrl;

    expect(assertSafeTestDatabaseEnvironment).not.toThrow();
  });
});
