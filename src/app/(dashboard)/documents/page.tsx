import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, getExpiryStatus, getDaysUntilExpiry } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { DocumentUpload } from "@/components/dashboard/document-upload";

const docTypeLabels: Record<string, string> = {
  W9: "W-9",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  LICENSE: "License",
  CONTRACT: "Contract",
  OTHER: "Other",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session) return null;

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const expired = documents.filter((d) => getExpiryStatus(d.expiresAt) === "expired").length;
  const expiring = documents.filter((d) => getExpiryStatus(d.expiresAt) === "expiring").length;
  const valid = documents.filter((d) => getExpiryStatus(d.expiresAt) === "valid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your compliance documents
          </p>
        </div>
        <DocumentUpload />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{valid}</p>
              <p className="text-xs text-muted-foreground">Valid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{expiring}</p>
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{expired}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No documents uploaded</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload W-9s, insurance certificates, and licenses to stay compliant
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {documents.map((doc) => {
                const status = getExpiryStatus(doc.expiresAt);
                const days = doc.expiresAt ? getDaysUntilExpiry(doc.expiresAt) : null;
                return (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between p-3 border border-slate-200 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {docTypeLabels[doc.type] || doc.type}
                      </p>
                      {doc.expiresAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expires: {formatDate(doc.expiresAt)}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 shrink-0">
                      {status === "expired" && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                      {status === "expiring" && (
                        <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
                          {days}d left
                        </Badge>
                      )}
                      {status === "valid" && (
                        <Badge className="text-xs bg-green-500 hover:bg-green-600">Valid</Badge>
                      )}
                      {status === "none" && (
                        <Badge variant="secondary" className="text-xs">No Expiry</Badge>
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
  );
}
