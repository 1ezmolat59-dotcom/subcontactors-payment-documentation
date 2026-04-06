import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CONTRACTOR") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, projectId, trade, contractAmount } = await request.json();

    if (!email || !projectId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, contractorId: session.user.id },
    });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    const subcontractor = await prisma.user.findUnique({
      where: { email, role: "SUBCONTRACTOR" },
    });
    if (!subcontractor) {
      return Response.json(
        { error: "No subcontractor account found with that email" },
        { status: 404 }
      );
    }

    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_subcontractorId: { projectId, subcontractorId: subcontractor.id },
      },
    });
    if (existing) {
      return Response.json({ error: "Already a member of this project" }, { status: 409 });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        subcontractorId: subcontractor.id,
        contractorId: session.user.id,
        trade,
        contractAmount,
      },
    });

    return Response.json(member, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
