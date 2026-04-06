import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.quickBooksConnection.deleteMany({
    where: { userId: session.user.id },
  });

  return Response.redirect(new URL("/quickbooks", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
}
