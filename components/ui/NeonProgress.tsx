import React from "react";

interface NeonProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export function NeonProgress({ value, className = "" }: NeonProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-neon-500 rounded-full transition-all duration-500 ease-out shadow-[0_2px_8px_rgba(0,255,157,0.3)]"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
