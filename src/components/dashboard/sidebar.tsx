"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  GitBranch,
  Shield,
  CreditCard,
  Users,
  Link2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const contractorNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/subcontractors", label: "Subcontractors", icon: Users },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/change-orders", label: "Change Orders", icon: GitBranch },
  { href: "/lien-waivers", label: "Lien Waivers", icon: Shield },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/quickbooks", label: "QuickBooks", icon: Link2 },
];

const subcontractorNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "My Invoices", icon: FileText },
  { href: "/documents", label: "My Documents", icon: FolderOpen },
  { href: "/change-orders", label: "Change Orders", icon: GitBranch },
  { href: "/lien-waivers", label: "Lien Waivers", icon: Shield },
  { href: "/payments", label: "Payment History", icon: CreditCard },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role: string; company?: string | null };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const nav =
    user.role === "CONTRACTOR" ? contractorNav : subcontractorNav;

  return (
    <aside className="hidden md:flex w-60 flex-col bg-slate-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight">SubPay</p>
          <p className="text-slate-400 text-xs truncate">{user.role === "CONTRACTOR" ? "General Contractor" : "Subcontractor"}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-slate-400 truncate">{user.email}</p>
      </div>
    </aside>
  );
}
