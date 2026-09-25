import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI commands run against the direct connection. Runtime queries
    // continue to use DATABASE_URL through PrismaService and @prisma/adapter-pg.
    url: env("DIRECT_URL"),
  },
});
