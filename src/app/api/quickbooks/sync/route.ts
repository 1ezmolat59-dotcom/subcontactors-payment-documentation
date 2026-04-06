import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await prisma.quickBooksConnection.findUnique({
    where: { userId: session.user.id },
  });

  if (!connection || new Date(connection.expiresAt) < new Date()) {
    return Response.json({ error: "QuickBooks not connected or token expired" }, { status: 400 });
  }

  // Sync approved invoices as Bills in QuickBooks
  const approvedInvoices = await prisma.invoice.findMany({
    where: {
      project: { contractorId: session.user.id },
      status: { in: ["APPROVED", "PAID"] },
    },
    include: {
      subcontractor: { select: { name: true, company: true, email: true } },
      lineItems: true,
    },
    take: 50,
  });

  const baseUrl = connection.realmId
    ? `https://quickbooks.api.intuit.com/v3/company/${connection.realmId}`
    : null;

  if (!baseUrl) return Response.json({ error: "No realm ID" }, { status: 400 });

  let synced = 0;
  for (const invoice of approvedInvoices) {
    try {
      await fetch(`${baseUrl}/bill`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          VendorRef: { name: invoice.subcontractor.company || invoice.subcontractor.name },
          TxnDate: invoice.submittedAt?.toISOString().split("T")[0],
          DueDate: invoice.dueDate?.toISOString().split("T")[0],
          Line: invoice.lineItems.map((li) => ({
            Amount: li.total,
            DetailType: "AccountBasedExpenseLineDetail",
            Description: li.description,
            AccountBasedExpenseLineDetail: {
              AccountRef: { name: "Construction Costs" },
              UnitPrice: li.unitPrice,
              Qty: li.quantity,
            },
          })),
          PrivateNote: `SubPay Invoice ${invoice.invoiceNumber}`,
        }),
      });
      synced++;
    } catch {
      // Continue syncing other invoices even if one fails
    }
  }

  return Response.json({ synced, total: approvedInvoices.length });
}
