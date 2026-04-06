import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { QuickBooksSync } from "@/components/dashboard/quickbooks-sync";

export default async function QuickBooksPage() {
  const session = await auth();
  if (!session) return null;

  const connection = await prisma.quickBooksConnection.findUnique({
    where: { userId: session.user.id },
  });

  const isConnected = connection && new Date(connection.expiresAt) > new Date();

  const qbAuthUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${process.env.QUICKBOOKS_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.QUICKBOOKS_REDIRECT_URI ?? "")}&response_type=code&scope=com.intuit.quickbooks.accounting&state=${session.user.id}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QuickBooks Integration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sync invoices and payments with QuickBooks Online
        </p>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Connected to QuickBooks Online
                  </p>
                  <p className="text-xs text-green-600">
                    Token expires: {formatDate(connection.expiresAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <QuickBooksSync />
                <Button variant="outline" asChild>
                  <a href="/api/quickbooks/disconnect" className="text-red-600">
                    Disconnect
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  Not connected to QuickBooks
                </p>
              </div>
              <Button asChild>
                <a href={qbAuthUrl}>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect QuickBooks
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What gets synced</CardTitle>
          <CardDescription>
            SubPay automatically syncs the following with QuickBooks Online
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              "Approved invoices → QuickBooks Bills",
              "Completed payments → QuickBooks Bill Payments",
              "Subcontractors → QuickBooks Vendors",
              "Projects → QuickBooks Customers / Jobs",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
