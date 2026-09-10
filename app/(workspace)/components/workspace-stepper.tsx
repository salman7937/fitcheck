"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileUp, BarChart3, Edit3, CheckCircle2 } from "lucide-react";

export function WorkspaceStepper() {
  const pathname = usePathname();

  // If on history route, don't display workspace step wizard
  if (pathname.startsWith("/history")) {
    return null;
  }

  const steps = [
    {
      id: "input",
      label: "Input Document",
      path: "/analyze",
      icon: FileUp,
      isExact: pathname === "/analyze",
    },
    {
      id: "report",
      label: "Fit Breakdown",
      path: "/analyze/report",
      icon: BarChart3,
      isExact: pathname === "/analyze/report",
    },
    {
      id: "review",
      label: "Review & Export",
      path: "/analyze/review",
      icon: Edit3,
      isExact: pathname === "/analyze/review",
    },
  ];

  const getCurrentStepIndex = () => {
    if (pathname === "/analyze/review") return 2;
    if (pathname === "/analyze/report") return 1;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="border-b border-rule/60 bg-white/40 backdrop-blur-sm py-3 px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                  isCurrent
                    ? "bg-beam text-white shadow-sm shadow-beam/25"
                    : isCompleted
                    ? "bg-match/10 text-match border border-match/30"
                    : "bg-paper/80 text-muted border border-rule/50"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-match" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span>{step.label}</span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 rounded transition-colors ${
                    idx < currentIndex ? "bg-match" : "bg-rule/60"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
