import { defineConfig } from "prisma/config";

const fallbackConnectionString =
  "postgresql://concert_matchmaker:concert_matchmaker@127.0.0.1:5432/concert_matchmaker";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackConnectionString,
  },
});
