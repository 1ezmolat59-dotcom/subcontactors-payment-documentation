"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Eye, CheckCircle, XCircle, Send, CreditCard } from "lucide-react";

interface InvoiceActionsProps {
  invoice: { id: string; status: string; invoiceNumber: string };
  isContractor: boolean;
}

export function InvoiceActions({ invoice, isContractor }: InvoiceActionsProps) {
  const router = useRouter();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string, reason?: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Invoice ${status.toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Failed to update invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/invoices/${invoice.id}`} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View
            </a>
          </DropdownMenuItem>

          {!isContractor && invoice.status === "DRAFT" && (
            <DropdownMenuItem
              onClick={() => updateStatus("SUBMITTED")}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit
            </DropdownMenuItem>
          )}

          {isContractor && invoice.status === "SUBMITTED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => updateStatus("APPROVED")}
                className="flex items-center gap-2 text-green-600"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRejectDialog(true)}
                className="flex items-center gap-2 text-red-600"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </DropdownMenuItem>
            </>
          )}

          {isContractor && invoice.status === "APPROVED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="flex items-center gap-2">
                <a href={`/invoices/${invoice.id}/pay`}>
                  <CreditCard className="w-4 h-4" />
                  Process Payment
                </a>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Invoice {invoice.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for rejection</Label>
            <Textarea
              placeholder="Explain why this invoice is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || loading}
              onClick={() => {
                updateStatus("REJECTED", rejectReason);
                setRejectDialog(false);
              }}
            >
              Reject Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
