"use client";

import { ReactNode } from "react";

interface CostSectionProps {
  title: string;
  icon: string;
  children: ReactNode;
}

export default function CostSection({ title, icon, children }: CostSectionProps) {
  return (
    <div className="bg-bg-secondary border border-border p-6 space-y-4 hover:border-border-gold/50 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-display text-text-white text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
}
