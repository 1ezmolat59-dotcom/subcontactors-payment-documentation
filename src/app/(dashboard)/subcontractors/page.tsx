import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, FileText, DollarSign } from "lucide-react";
import { AddSubcontractorForm } from "@/components/dashboard/add-subcontractor-form";

export default async function SubcontractorsPage() {
  const session = await auth();
  if (!session) return null;
  if (session.user.role !== "CONTRACTOR") redirect("/dashboard");

  const projects = await prisma.project.findMany({
    where: { contractorId: session.user.id },
    select: { id: true, name: true },
  });

  const subcontractors = await prisma.projectMember.findMany({
    where: { contractorId: session.user.id },
    include: {
      subcontractor: {
        include: {
          invoicesSubmitted: {
            select: { status: true, totalAmount: true },
          },
        },
      },
      project: { select: { name: true } },
    },
    distinct: ["subcontractorId"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subcontractors</h1>
          <p className="text-sm text-slate-500 mt-1">
            {subcontractors.length} subcontractor{subcontractors.length !== 1 ? "s" : ""} on your projects
          </p>
        </div>
        <AddSubcontractorForm projects={projects} />
      </div>

      {subcontractors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No subcontractors yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add subcontractors to your projects to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subcontractors.map(({ subcontractor, project, contractAmount }) => {
            const paidAmount = subcontractor.invoicesSubmitted
              .filter((i) => i.status === "PAID")
              .reduce((sum, i) => sum + i.totalAmount, 0);
            const pendingCount = subcontractor.invoicesSubmitted.filter(
              (i) => ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(i.status)
            ).length;
            const initials = subcontractor.name
              ?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

            return (
              <Card key={subcontractor.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">
                        {subcontractor.company || subcontractor.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground truncate">
                        {subcontractor.email}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{project.name}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {contractAmount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Contract
                      </span>
                      <span className="font-medium">{formatCurrency(contractAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Paid
                    </span>
                    <span className="font-medium text-green-600">{formatCurrency(paidAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Pending invoices
                    </span>
                    <Badge variant={pendingCount > 0 ? "default" : "secondary"} className="text-xs">
                      {pendingCount}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
