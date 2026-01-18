import React from "react";

interface NeonProgressProps {
    value: number; // 0 to 100
    className?: string;
}

export function NeonProgress({ value, className = "" }: NeonProgressProps) {
    return (
        <div className={`h-1 w-full bg-white/5 rounded-full overflow-visible relative ${className}`}>
            <div
                className="h-full bg-neon-500 relative transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            >
                {/* Glowing Head */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-neon-500/50 blur-md rounded-full shadow-[0_0_10px_#00ff9d]" />
            </div>
        </div>
    );
}
