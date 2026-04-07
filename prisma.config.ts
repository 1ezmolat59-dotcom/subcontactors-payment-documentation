import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // datasource.url is only needed for CLI operations (migrate, db push).
  // Setting it to undefined when DATABASE_URL is absent lets `prisma generate`
  // succeed even when the env var is not set at install time (e.g. on Vercel
  // build containers). The runtime connection uses PrismaPg adapter in
  // src/lib/prisma.ts which reads DATABASE_URL at request time.
  datasource: process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : undefined,
});
