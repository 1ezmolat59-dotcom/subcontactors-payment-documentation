import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use Node's URL parser to correctly extract components — pg's own URL
  // parser truncates usernames containing dots (e.g. postgres.{ref}).
  const dbUrl = new URL(process.env.DATABASE_URL!);

  const adapter = new PrismaPg({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || "5432"),
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    // Supabase requires SSL; skip cert verification (self-signed chain).
    ssl: { rejectUnauthorized: false },
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
