"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, FileSearch, History, ShieldCheck } from "lucide-react";
import { AccountMenu } from "@/features/auth/components/account-menu";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/analyze", label: "Analyze CV", icon: FileSearch },
    { href: "/history", label: "Saved Runs", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-rule/70 transition-all duration-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-beam rounded-lg px-1.5 py-1"
        >
          <div className="w-8 h-8 rounded-lg bg-beam flex items-center justify-center text-white shadow-md shadow-beam/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-graphite flex items-center gap-1.5">
              Fitcheck
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-beam/10 text-beam font-medium">
                <ShieldCheck className="w-3 h-3" /> ATS Scan
              </span>
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1 bg-white/60 p-1 rounded-full border border-rule/50 shadow-sm">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-graphite text-white shadow-sm"
                    : "text-muted hover:text-graphite hover:bg-paper/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Account Menu */}
        <div className="flex items-center gap-2">
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
