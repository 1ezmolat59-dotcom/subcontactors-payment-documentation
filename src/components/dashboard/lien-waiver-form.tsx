"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface Subcontractor {
  id: string;
  name: string | null;
  company: string | null;
}

export function LienWaiverForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [form, setForm] = useState({
    projectId: "",
    subcontractorId: "",
    type: "",
    amount: "",
    throughDate: "",
  });

  useEffect(() => {
    if (form.projectId) {
      fetch(`/api/projects/${form.projectId}/members`)
        .then((r) => r.json())
        .then(setSubcontractors);
    }
  }, [form.projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/lien-waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: form.amount ? parseFloat(form.amount) : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lien waiver request sent to subcontractor");
      setOpen(false);
      setForm({ projectId: "", subcontractorId: "", type: "", amount: "", throughDate: "" });
      router.refresh();
    } catch {
      toast.error("Failed to create lien waiver");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Request Lien Waiver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Lien Waiver</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v, subcontractorId: "" })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.projectId && (
            <div className="space-y-2">
              <Label>Subcontractor *</Label>
              <Select
                value={form.subcontractorId}
                onValueChange={(v) => setForm({ ...form, subcontractorId: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcontractor" />
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company || s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Waiver Type *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONDITIONAL_PARTIAL">Conditional Partial</SelectItem>
                <SelectItem value="UNCONDITIONAL_PARTIAL">Unconditional Partial</SelectItem>
                <SelectItem value="CONDITIONAL_FINAL">Conditional Final</SelectItem>
                <SelectItem value="UNCONDITIONAL_FINAL">Unconditional Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Through Date</Label>
              <Input
                type="date"
                value={form.throughDate}
                onChange={(e) => setForm({ ...form, throughDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
