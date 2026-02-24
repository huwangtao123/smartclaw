import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`
        bg-[#111]/80 border border-white/[0.06]
        rounded-2xl relative overflow-hidden transition-colors duration-200 ease-out
        hover:border-white/[0.12]
        before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent
        ${className}
      `}
    >
      {children}
    </div>
  );
}
