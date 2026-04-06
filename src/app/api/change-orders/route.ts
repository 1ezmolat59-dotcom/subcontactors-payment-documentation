import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CONTRACTOR") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { projectId, subcontractorId, title, description, amount, reason } = await request.json();

    if (!projectId || !subcontractorId || !title || !amount) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, contractorId: session.user.id },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const changeOrder = await prisma.changeOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        projectId,
        subcontractorId,
        title,
        description,
        amount,
        reason,
        status: "PENDING_SIGNATURE",
      },
    });

    return Response.json(changeOrder, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
