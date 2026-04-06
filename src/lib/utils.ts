import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
}

export function generateOrderNumber(): string {
  const prefix = "CO";
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

export function getDaysUntilExpiry(expiresAt: Date | string): number {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(
  expiresAt: Date | string | null
): "valid" | "expiring" | "expired" | "none" {
  if (!expiresAt) return "none";
  const days = getDaysUntilExpiry(expiresAt);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}
