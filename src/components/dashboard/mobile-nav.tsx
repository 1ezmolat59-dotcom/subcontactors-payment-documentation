"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  CreditCard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const contractorItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/subcontractors", label: "Subs", icon: Users },
  { href: "/documents", label: "Docs", icon: FolderOpen },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

const subcontractorItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/documents", label: "Docs", icon: FolderOpen },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

export function MobileNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = role === "CONTRACTOR" ? contractorItems : subcontractorItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
                active ? "text-blue-600" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
