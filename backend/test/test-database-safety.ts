export function assertSafeTestDatabaseEnvironment() {
  const databaseUrl = process.env.DATABASE_URL;
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (
    process.env.NODE_ENV !== 'test'
    || !databaseUrl
    || !testDatabaseUrl
    || databaseUrl !== testDatabaseUrl
  ) {
    throw new Error(
      'Database-backed tests require NODE_ENV=test and matching DATABASE_URL and TEST_DATABASE_URL.',
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid database URL.');
  }

  if (!/(^|[_-])test([_-]|$)/i.test(parsedUrl.pathname)) {
    throw new Error(
      'TEST_DATABASE_URL must target a database whose name clearly identifies it as a test database.',
    );
  }
}
