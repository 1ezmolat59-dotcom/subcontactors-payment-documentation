import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch } from "lucide-react";
import { ChangeOrderForm } from "@/components/dashboard/change-order-form";
import { SignatureModal } from "@/components/dashboard/signature-modal";

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PENDING_SIGNATURE: "bg-yellow-100 text-yellow-700",
  SIGNED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default async function ChangeOrdersPage() {
  const session = await auth();
  if (!session) return null;

  const isContractor = session.user.role === "CONTRACTOR";

  const changeOrders = await prisma.changeOrder.findMany({
    where: isContractor
      ? { project: { contractorId: session.user.id } }
      : { subcontractorId: session.user.id },
    include: {
      project: { select: { name: true } },
      subcontractor: { select: { name: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projects = await prisma.project.findMany({
    where: isContractor
      ? { contractorId: session.user.id }
      : { members: { some: { subcontractorId: session.user.id } } },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Change Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage scope changes with digital signatures
          </p>
        </div>
        {isContractor && <ChangeOrderForm projects={projects} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Change Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {changeOrders.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No change orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeOrders.map((co) => (
                <div
                  key={co.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{co.orderNumber}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[co.status] || statusColors.DRAFT}`}
                      >
                        {co.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5">{co.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {co.project.name} •{" "}
                      {isContractor
                        ? co.subcontractor.company || co.subcontractor.name
                        : formatDate(co.createdAt)}
                    </p>
                    {co.reason && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {co.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-bold">
                      {formatCurrency(co.amount)}
                    </p>
                    {!isContractor && co.status === "PENDING_SIGNATURE" && !co.signatureData && (
                      <SignatureModal changeOrderId={co.id} orderNumber={co.orderNumber} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
