"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
}

interface Project {
  id: string;
  name: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    projectId: "",
    description: "",
    workPeriodStart: "",
    workPeriodEnd: "",
    dueDate: "",
    tax: "0",
    notes: "",
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unit: "", unitPrice: "" },
  ]);

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
  }, []);

  function addLineItem() {
    setLineItems([
      ...lineItems,
      { description: "", quantity: "1", unit: "", unitPrice: "" },
    ]);
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems(lineItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const taxAmount = subtotal * (parseFloat(form.tax) / 100 || 0);
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    e.preventDefault();
    if (!form.projectId) {
      toast.error("Please select a project");
      return;
    }
    const validItems = lineItems.filter(
      (i) => i.description && parseFloat(i.unitPrice) > 0
    );
    if (validItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: asDraft ? "DRAFT" : "SUBMITTED",
          lineItems: validItems.map((i) => ({
            description: i.description,
            quantity: parseFloat(i.quantity),
            unit: i.unit,
            unitPrice: parseFloat(i.unitPrice),
            total: parseFloat(i.quantity) * parseFloat(i.unitPrice),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      toast.success(asDraft ? "Invoice saved as draft" : "Invoice submitted!");
      router.push("/invoices");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Invoice</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the details below to submit an invoice
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of work performed..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Work Period Start</Label>
                <Input
                  type="date"
                  value={form.workPeriodStart}
                  onChange={(e) => setForm({ ...form, workPeriodStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Work Period End</Label>
                <Input
                  type="date"
                  value={form.workPeriodEnd}
                  onChange={(e) => setForm({ ...form, workPeriodEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={form.tax}
                  onChange={(e) => setForm({ ...form, tax: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 sm:col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    placeholder="Unit"
                    value={item.unit}
                    onChange={(e) => updateLineItem(index, "unit", e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-red-500"
                      onClick={() => removeLineItem(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({form.tax}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or payment instructions..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Invoice"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
