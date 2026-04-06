import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "SUBCONTRACTOR") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, description, workPeriodStart, workPeriodEnd, dueDate, tax, notes, status, lineItems } = body;

    if (!projectId || !lineItems?.length) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify subcontractor is on project
    const member = await prisma.projectMember.findUnique({
      where: { projectId_subcontractorId: { projectId, subcontractorId: session.user.id } },
    });
    if (!member) return Response.json({ error: "Not a member of this project" }, { status: 403 });

    const subtotal = lineItems.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);
    const taxRate = parseFloat(tax) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        projectId,
        subcontractorId: session.user.id,
        status: status || "DRAFT",
        amount: subtotal,
        tax: taxAmount,
        totalAmount,
        description,
        workPeriodStart: workPeriodStart ? new Date(workPeriodStart) : undefined,
        workPeriodEnd: workPeriodEnd ? new Date(workPeriodEnd) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        submittedAt: status === "SUBMITTED" ? new Date() : undefined,
        lineItems: {
          create: lineItems.map((i: { description: string; quantity: number; unit?: string; unitPrice: number; total: number }) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unitPrice: i.unitPrice,
            total: i.total,
          })),
        },
      },
    });

    return Response.json(invoice, { status: 201 });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
