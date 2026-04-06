import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  UNDER_REVIEW: "default",
  APPROVED: "default",
  REJECTED: "destructive",
  PAID: "default",
  PARTIALLY_PAID: "default",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const isContractor = session.user.role === "CONTRACTOR";

  const [invoices, payments, documents] = await Promise.all([
    prisma.invoice.findMany({
      where: isContractor
        ? { project: { contractorId: session.user.id } }
        : { subcontractorId: session.user.id },
      include: { subcontractor: true, project: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: isContractor
        ? { contractorId: session.user.id }
        : { subcontractorId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.document.findMany({
      where: { userId: session.user.id, expiresAt: { not: null } },
      orderBy: { expiresAt: "asc" },
      take: 5,
    }),
  ]);

  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = invoices
    .filter((i) => ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(i.status))
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const overdueInvoices = invoices.filter(
    (i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "PAID"
  ).length;

  const expiringDocs = documents.filter((d) => {
    if (!d.expiresAt) return false;
    const days = Math.ceil(
      (new Date(d.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 30 && days >= 0;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here&apos;s what&apos;s happening with your payments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isContractor ? "Total Paid Out" : "Total Received"}
                </p>
                <p className="text-lg font-bold">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold">
                  {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${overdueInvoices > 0 ? "bg-red-100" : "bg-slate-100"}`}>
                <AlertTriangle className={`w-5 h-5 ${overdueInvoices > 0 ? "text-red-600" : "text-slate-500"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-lg font-bold">{overdueInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${expiringDocs > 0 ? "bg-amber-100" : "bg-slate-100"}`}>
                <FileText className={`w-5 h-5 ${expiringDocs > 0 ? "text-amber-600" : "text-slate-500"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Docs Expiring</p>
                <p className="text-lg font-bold">{expiringDocs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No invoices yet
              </p>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {isContractor
                          ? inv.subcontractor.name
                          : inv.project.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      <Badge
                        variant={
                          (statusColors[inv.status] as "default" | "secondary" | "destructive") || "default"
                        }
                        className="text-xs"
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Document Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  All documents are up to date
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const days = doc.expiresAt
                    ? Math.ceil(
                        (new Date(doc.expiresAt).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;
                  const isExpired = days !== null && days < 0;
                  const isExpiring = days !== null && days >= 0 && days <= 30;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        {isExpired ? (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        ) : isExpiring ? (
                          <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
                            {days}d left
                          </Badge>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {doc.expiresAt ? formatDate(doc.expiresAt) : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
