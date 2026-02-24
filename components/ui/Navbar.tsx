"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Language = "en" | "zh";

const LANGUAGE_ORDER: Language[] = ["en", "zh"];

export function Navbar({
    language,
    onLanguageChange,
    isZh,
}: {
    language: Language;
    onLanguageChange: (language: Language) => void;
    isZh: boolean;
}) {
    return (
        <nav className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                {/* Left — Logo + Brand */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative h-7 w-7 transition-transform group-hover:scale-110 duration-300">
                        <Image
                            src="/fx-protocol-icon.svg"
                            alt="f(x) Protocol"
                            fill
                            sizes="28px"
                            priority
                        />
                    </div>
                    <span className="font-mono text-sm font-medium text-neon-400">
                        smartflow
                    </span>
                </Link>

                {/* Center — Nav Links */}
                <div className="hidden sm:flex items-center gap-1">
                    <Link
                        href="/"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/60 transition hover:text-white hover:bg-white/[0.04]"
                    >
                        {isZh ? "f(x) 协议" : "f(x) Protocol"}
                    </Link>
                    <Link
                        href="/fxmint"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/60 transition hover:text-white hover:bg-white/[0.04]"
                    >
                        {isZh ? "利率" : "Rates"}
                    </Link>
                    <Link
                        href="/premium"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-neon-400/80 transition hover:text-neon-300 hover:bg-neon-500/[0.06]"
                    >
                        Premium
                    </Link>
                </div>

                {/* Right — Language Toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                    {LANGUAGE_ORDER.map((code) => {
                        const isActive = language === code;
                        const label = code === "en" ? "EN" : "中";
                        return (
                            <button
                                key={code}
                                type="button"
                                onClick={() => onLanguageChange(code)}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${isActive
                                    ? "bg-neon-500 text-black"
                                    : "text-white/40 hover:text-white/70"
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}

/**
 * Server-friendly Navbar wrapper: renders the navbar with a built-in client-side
 * language state. Use this in server components (like the premium page) that don't
 * manage language state themselves.
 */
export function NavbarWithState() {
    const [language, setLanguage] = useState<Language>("en");
    return (
        <Navbar
            language={language}
            onLanguageChange={setLanguage}
            isZh={language === "zh"}
        />
    );
}
