import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.user.count();
    return Response.json({ ok: true, userCount: count, dbUrl: process.env.DATABASE_URL?.slice(0, 40) + "..." });
  } catch (err: unknown) {
    const e = err as Error;
    return Response.json({
      ok: false,
      name: e?.constructor?.name,
      message: e?.message?.substring(0, 300),
      code: (e as Record<string, unknown>)?.code,
    });
  }
}
