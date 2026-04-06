import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: session.user.role === "CONTRACTOR"
      ? { contractorId: session.user.id }
      : { members: { some: { subcontractorId: session.user.id } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return Response.json(projects);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CONTRACTOR") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, address, startDate, endDate, budget } = await request.json();

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name,
      description,
      address,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      contractorId: session.user.id,
    },
  });

  return Response.json(project, { status: 201 });
}
