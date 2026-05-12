interface NeonProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export function NeonProgress({ value, className = "" }: NeonProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-gradient-to-r from-sky-500 via-neon-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
