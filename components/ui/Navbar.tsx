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
                            src="/brand_logo.svg"
                            alt="Smartclaw"
                            fill
                            className="object-contain"
                            sizes="28px"
                            priority
                        />
                    </div>
                    <span className="font-mono text-sm font-medium text-[#00FFA3]">
                        smartclaw solana
                    </span>
                </Link>

                {/* Center — Nav Links */}
                <div className="hidden sm:flex items-center gap-1">
                    <Link
                        href="/"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/60 transition hover:text-[#00FFA3] hover:bg-[#00FFA3]/[0.08]"
                    >
                        Demo
                    </Link>
                    <Link
                        href="/docs"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/60 transition hover:text-[#00FFA3] hover:bg-[#00FFA3]/[0.08]"
                    >
                        {isZh ? "文档" : "Docs"}
                    </Link>
                    <a
                        href="/SKILL.md"
                        target="_blank"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/60 transition hover:text-[#00FFA3] hover:bg-[#00FFA3]/[0.08]"
                    >
                        SKILL
                    </a>
                    <a
                        href="/api/openapi"
                        target="_blank"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/60 transition hover:text-[#00FFA3] hover:bg-[#00FFA3]/[0.08]"
                    >
                        API
                    </a>
                    <a
                        href="#"
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium opacity-50 cursor-not-allowed text-white/40 transition"
                        title="Coming Soon"
                    >
                        X Article
                    </a>
                    <Link
                        href="/fx"
                        className="ml-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-white/30 transition hover:text-white hover:bg-white/[0.04] border border-white/10"
                    >
                        Legacy
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
                                    ? "bg-[#00FFA3] text-black"
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
