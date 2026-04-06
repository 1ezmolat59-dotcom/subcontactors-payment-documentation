import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";
import { InvoiceActions } from "@/components/dashboard/invoice-actions";

const statusBadge: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-100 text-blue-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
  PAID: { label: "Paid", className: "bg-emerald-100 text-emerald-700" },
  PARTIALLY_PAID: { label: "Partial", className: "bg-teal-100 text-teal-700" },
};

export default async function InvoicesPage() {
  const session = await auth();
  if (!session) return null;

  const isContractor = session.user.role === "CONTRACTOR";

  const invoices = await prisma.invoice.findMany({
    where: isContractor
      ? { project: { contractorId: session.user.id } }
      : { subcontractorId: session.user.id },
    include: {
      subcontractor: { select: { name: true, company: true } },
      project: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isContractor ? "Invoices" : "My Invoices"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {!isContractor && (
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No invoices yet</p>
              {!isContractor && (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/invoices/new">Submit your first invoice</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>{isContractor ? "Subcontractor" : "Project"}</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const badge = statusBadge[inv.status] || statusBadge.DRAFT;
                    const isOverdue =
                      inv.dueDate &&
                      new Date(inv.dueDate) < new Date() &&
                      inv.status !== "PAID";
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-sm">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-sm">
                          {isContractor
                            ? inv.subcontractor.company || inv.subcontractor.name
                            : inv.project.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {inv.dueDate ? (
                            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                              {formatDate(inv.dueDate)}
                              {isOverdue && " (Overdue)"}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {formatCurrency(inv.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <InvoiceActions
                            invoice={{
                              id: inv.id,
                              status: inv.status,
                              invoiceNumber: inv.invoiceNumber,
                            }}
                            isContractor={isContractor}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
