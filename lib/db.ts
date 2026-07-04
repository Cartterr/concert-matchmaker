import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const fallbackConnectionString =
  "postgresql://concert_matchmaker:concert_matchmaker@127.0.0.1:5432/concert_matchmaker";
const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "postgresql://missing:missing@127.0.0.1:1/missing"
    : fallbackConnectionString);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
