interface GlowingStatProps {
  label: string;
  value: string | number;
  className?: string;
}

export function GlowingStat({
  label,
  value,
  className = "",
}: GlowingStatProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="label-subtle mb-1.5">{label}</span>
      <span className="text-2xl font-mono text-slate-50">{value}</span>
    </div>
  );
}
