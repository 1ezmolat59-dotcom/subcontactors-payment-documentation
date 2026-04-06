import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CONTRACTOR") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, subcontractorId, type, amount, throughDate } = await request.json();

    if (!projectId || !subcontractorId || !type) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lienWaiver = await prisma.lienWaiver.create({
      data: {
        projectId,
        subcontractorId,
        type,
        amount: amount ? parseFloat(amount) : undefined,
        throughDate: throughDate ? new Date(throughDate) : undefined,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return Response.json(lienWaiver, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
