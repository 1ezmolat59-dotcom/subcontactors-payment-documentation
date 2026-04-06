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

  const changeOrder = await prisma.changeOrder.findUnique({ where: { id } });
  if (!changeOrder) return Response.json({ error: "Not found" }, { status: 404 });

  const isSub = changeOrder.subcontractorId === session.user.id;
  const isContractor = session.user.role === "CONTRACTOR";

  if (!isSub && !isContractor) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = isSub
    ? { signatureData, signedAt: new Date(), status: "SIGNED" as const }
    : { contractorSignature: signatureData, contractorSignedAt: new Date() };

  const updated = await prisma.changeOrder.update({
    where: { id },
    data: update,
  });

  return Response.json(updated);
}
