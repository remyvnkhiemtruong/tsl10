import "dotenv/config";
import { defineConfig } from "prisma/config";

const defaultLocalDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/vvk_admission?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? defaultLocalDatabaseUrl
  }
});
