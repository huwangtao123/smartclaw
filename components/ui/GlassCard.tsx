import React from "react";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
    return (
        <div
            className={`
        bg-void-900/60 backdrop-blur-xl border border-glass-stroke
        shadow-2xl relative overflow-hidden transition-all duration-300 ease-out
        hover:border-neon-500/30 hover:-translate-y-1
        before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
        ${className}
      `}
        >
            {children}
        </div>
    );
}
