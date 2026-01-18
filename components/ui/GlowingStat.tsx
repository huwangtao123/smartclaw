import React from "react";

interface GlowingStatProps {
    label: string;
    value: string | number;
    className?: string;
}

export function GlowingStat({ label, value, className = "" }: GlowingStatProps) {
    return (
        <div className={`flex flex-col ${className}`}>
            <span className="label-subtle mb-1">{label}</span>
            <span
                className="text-2xl font-mono text-white drop-shadow-[0_0_15px_rgba(74,222,128,0.25)]"
            >
                {value}
            </span>
        </div>
    );
}
