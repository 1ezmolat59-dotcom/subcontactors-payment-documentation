"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

export function QuickBooksSync() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/quickbooks/sync", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("QuickBooks sync complete");
    } catch {
      toast.error("Sync failed — check your connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSync} disabled={loading} variant="outline">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Now
        </>
      )}
    </Button>
  );
}
