import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      subcontractor: { select: { id: true, name: true, company: true } },
    },
  });

  return Response.json(members.map((m) => m.subcontractor));
}
