import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`
        bg-card/85 border border-slate-700/45
        rounded-lg relative overflow-hidden transition-colors duration-200 ease-out
        shadow-[0_18px_48px_rgba(0,0,0,0.24)]
        hover:border-slate-500/60
        before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-sky-300/20 before:to-transparent
        ${className}
      `}
    >
      {children}
    </div>
  );
}
