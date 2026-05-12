"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: isZh ? "f(x) 协议" : "f(x) Protocol" },
    { href: "/fxmint", label: isZh ? "利率" : "Rates" },
    { href: "/docs", label: isZh ? "文档" : "Docs" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-700/50 bg-[#05070b]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative h-7 w-7 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/brand_logo.svg"
              alt="Smartclaw"
              fill
              className="object-contain"
              sizes="28px"
              priority
            />
          </div>
          <span className="font-mono text-sm font-semibold text-slate-50">
            smart<span className="text-neon-500">claw</span>
          </span>
        </Link>

        <div className="hidden items-center rounded-lg border border-slate-700/60 bg-slate-950/55 p-1 sm:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "bg-sky-400/12 text-sky-100"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-neon-500" />
            <span>Live API</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-950/55 p-0.5">
            {LANGUAGE_ORDER.map((code) => {
              const isActive = language === code;
              const label = code === "en" ? "EN" : "中";
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onLanguageChange(code)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    isActive
                      ? "bg-neon-500 text-slate-950"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Server-friendly Navbar wrapper: renders the navbar with a built-in
 * client-side language state.
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
