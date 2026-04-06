import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await params;
  const { status, rejectionReason } = await request.json();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { project: true },
  });

  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });

  const isContractor = session.user.role === "CONTRACTOR";
  const isSub = invoice.subcontractorId === session.user.id;

  // Authorization checks
  if (status === "SUBMITTED" && !isSub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (["APPROVED", "REJECTED", "UNDER_REVIEW"].includes(status) && !isContractor) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = { status };
  if (status === "SUBMITTED") update.submittedAt = new Date();
  if (status === "APPROVED") update.approvedAt = new Date();
  if (status === "REJECTED") update.rejectionReason = rejectionReason;
  if (status === "APPROVED" || status === "REJECTED" || status === "UNDER_REVIEW") {
    update.reviewedById = session.user.id;
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: update,
  });

  return Response.json(updated);
}
