import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import { LienWaiverForm } from "@/components/dashboard/lien-waiver-form";
import { LienWaiverSign } from "@/components/dashboard/lien-waiver-sign";

const typeLabels: Record<string, string> = {
  CONDITIONAL_PARTIAL: "Conditional Partial",
  UNCONDITIONAL_PARTIAL: "Unconditional Partial",
  CONDITIONAL_FINAL: "Conditional Final",
  UNCONDITIONAL_FINAL: "Unconditional Final",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  SIGNED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function LienWaiversPage() {
  const session = await auth();
  if (!session) return null;

  const isContractor = session.user.role === "CONTRACTOR";

  const lienWaivers = await prisma.lienWaiver.findMany({
    where: isContractor
      ? { project: { contractorId: session.user.id } }
      : { subcontractorId: session.user.id },
    include: {
      project: { select: { name: true } },
      subcontractor: { select: { name: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projects = isContractor
    ? await prisma.project.findMany({
        where: { contractorId: session.user.id },
        select: { id: true, name: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lien Waivers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and collect lien waivers to protect your project
          </p>
        </div>
        {isContractor && <LienWaiverForm projects={projects} />}
      </div>

      {/* Summary for contractor */}
      {isContractor && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["PENDING", "SENT", "SIGNED", "REJECTED"].map((status) => {
            const count = lienWaivers.filter((w) => w.status === status).length;
            return (
              <Card key={status}>
                <CardContent className="pt-4">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {status.toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Lien Waivers</CardTitle>
        </CardHeader>
        <CardContent>
          {lienWaivers.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No lien waivers yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lienWaivers.map((w) => (
                <div
                  key={w.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{typeLabels[w.type]}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[w.status] || statusColors.PENDING}`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.project.name}
                      {isContractor ? ` • ${w.subcontractor.company || w.subcontractor.name}` : ""}
                    </p>
                    {w.throughDate && (
                      <p className="text-xs text-muted-foreground">
                        Through: {formatDate(w.throughDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {w.amount && (
                      <p className="text-sm font-bold">{formatCurrency(w.amount)}</p>
                    )}
                    {!isContractor && w.status === "SENT" && !w.signatureData && (
                      <LienWaiverSign lienWaiverId={w.id} type={typeLabels[w.type]} />
                    )}
                    {w.status === "SIGNED" && w.signedAt && (
                      <p className="text-xs text-green-600 font-medium">
                        Signed {formatDate(w.signedAt)}
                      </p>
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
