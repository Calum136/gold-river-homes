"use client";

import { ReactNode } from "react";

interface QuestionCardProps {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function QuestionCard({
  step,
  title,
  subtitle,
  children,
}: QuestionCardProps) {
  return (
    <div className="bg-bg-secondary border border-border p-6 sm:p-8 relative hover:border-border-gold/50 transition-colors duration-300">
      <span className="font-accent text-gold/20 text-5xl sm:text-6xl absolute top-3 right-5 select-none">
        {String(step).padStart(2, "0")}
      </span>
      <h3 className="font-display text-text-white text-xl sm:text-2xl mb-1 relative">
        {title}
      </h3>
      {subtitle && (
        <p className="text-text-muted text-sm mb-5 relative">{subtitle}</p>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
