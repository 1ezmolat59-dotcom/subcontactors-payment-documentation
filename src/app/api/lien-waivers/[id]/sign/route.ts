import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { signatureData } = await request.json();

  if (!signatureData) return Response.json({ error: "Signature required" }, { status: 400 });

  const waiver = await prisma.lienWaiver.findUnique({ where: { id } });
  if (!waiver) return Response.json({ error: "Not found" }, { status: 404 });

  if (waiver.subcontractorId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.lienWaiver.update({
    where: { id },
    data: { signatureData, signedAt: new Date(), status: "SIGNED" },
  });

  return Response.json(updated);
}
