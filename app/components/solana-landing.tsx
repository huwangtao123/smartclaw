"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";

type Language = "en" | "zh";

// Simplified icons
function ChevronRight(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 18 15 12 9 6" /></svg>;
}

function CodeTerminal(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>;
}

export default function SolanaLanding() {
  const [language, setLanguage] = useState<Language>("en");
  const isZh = language === "zh";
  const [activeTab, setActiveTab] = useState(0);

  const [apiResponses, setApiResponses] = useState<Record<string, any>>({
    "smart-wallets": null,
    "token-flow": null,
    "explain": null
  });

  const tabs = [
    {
      id: "smart-wallets",
      label: isZh ? "发现聪明钱包" : "Find smart wallets",
      query: "GET /api/solana/smart-money?limit=2",
      endpoint: "/api/solana/smart-money?limit=2"
    },
    {
      id: "token-flow",
      label: isZh ? "洞察资金流向" : "Inspect token flow",
      query: "GET /api/solana/token-flow?symbolOrMint=SOL",
      endpoint: "/api/solana/token-flow?symbolOrMint=SOL"
    },
    {
      id: "explain",
      label: isZh ? "解析异动信号" : "Explain a signal",
      query: "GET /api/solana/explain?subject=token&id=SOL",
      // Keep explain static for now as it fundamentally requires an LLM call which we mock for hackathon
      response: {
        subject: "token",
        id: "SOL",
        explanation: "Recent volume shifts indicate high-conviction accumulation on DEXs.",
        agentActionable: true
      }
    }
  ];

  // Fetch real data on tab change
  const handleTabChange = async (idx: number) => {
    setActiveTab(idx);
    const tab = tabs[idx];
    
    // Serve from cache if already fetched
    if (apiResponses[tab.id] || tab.response) return;

    try {
      const res = await fetch(tab.endpoint!);
      const data = await res.json();
      setApiResponses(prev => ({ ...prev, [tab.id]: data }));
    } catch (e) {
      console.error(e);
      setApiResponses(prev => ({ ...prev, [tab.id]: { error: "Failed to fetch Live Data" } }));
    }
  };

  // Run on first mount for default tab
  useEffect(() => {
    handleTabChange(0);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white/80 selection:bg-[#00FFA3]/30 selection:text-white font-sans">
      <Navbar language={language} onLanguageChange={setLanguage} isZh={isZh} />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-32">
        
        {/* 1. HERO SECTION */}
        <section className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00FFA3]/20 bg-[#00FFA3]/5">
              <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wider text-[#00FFA3] uppercase">Solana Agent Economy</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              {isZh ? "Smartclaw 不交易。" : "Smartclaw does not trade."} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#9945FF]">
                {isZh ? "它是为 Agent 打造的信息层" : "It's an intelligence layer for agents and builders."}
              </span>
            </h1>
            
            <p className="text-lg text-white/50 max-w-xl leading-relaxed">
              {isZh 
                ? "我们把 Solana 上分散、噪声大的链上行为压缩成高信号输入。不提供执行端，只提供智能排序、资金流向监控与逻辑解析。" 
                : "We compress noisy on-chain Solana behaviors into high-signal inputs. No automated execution—just smart tracking, conviction ranking, and agent-ready explanation."}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <a href="#demo" className="inline-flex items-center gap-2 bg-[#00FFA3] text-black px-6 py-3 rounded-lg font-bold transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(0,255,163,0.3)]">
                {isZh ? "查看 Demo" : "View Demo"} <ChevronRight className="w-4 h-4" />
              </a>
              <a href="/SKILL.md" target="_blank" className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-medium transition-colors hover:bg-white/10 hover:text-[#00FFA3]">
                <CodeTerminal className="w-4 h-4" /> {isZh ? "阅读 SKILL.md" : "Read SKILL.md"}
              </a>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3] to-[#9945FF] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <span className="ml-2 text-xs font-mono text-white/40">agent-query.ts</span>
              </div>
              <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto">
                <div className="text-[#00FFA3] mb-2">$ curl -X GET https://smartclaw.xyz/api/solana/overview</div>
                <div className="text-white/70 whitespace-pre">
                  {`{\n  "network": "solana",\n  "trackedWallets": 12450,\n  "activeCoverageTokens": 840,\n  "latestRotationShift": "AI Agents -> DeFi",\n  "lastUpdated": "2026-03-12T16:00:00Z"\n}`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PROBLEM SECTION */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              {isZh ? "Solana 数据满载噪声" : "Solana data is drowning in noise"}
            </h2>
            <p className="text-white/50">{isZh ? "大语言模型无法直接消化原始 RPC 数据。它们需要经过提炼的信号。" : "LLMs cannot efficiently digest raw RPC streams. They need distilled signal."}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#00FFA3]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4"><span className="text-xl">📊</span></div>
              <h3 className="font-semibold text-white mb-2">{isZh ? "钱包过多" : "Too many wallets"}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{isZh ? "数以万计的活跃地址每秒产生交易。绝大多数不具备追踪价值。" : "Hundreds of thousands of active addresses trading per second. 99% are noise."}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#00FFA3]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4"><span className="text-xl">🔄</span></div>
              <h3 className="font-semibold text-white mb-2">{isZh ? "板块轮动过快" : "Rapid token rotations"}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{isZh ? "资金快速在叙事间切换。当趋势在社交媒体爆发时，早期资金已经撤出。" : "Capital shifts between narratives instantly. By the time it hits Twitter, the smart money has exited."}</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#00FFA3]/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4"><span className="text-xl">🤖</span></div>
              <h3 className="font-semibold text-white mb-2">{isZh ? "缺乏 Agent 就绪的数据" : "No agent-ready explanation"}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{isZh ? "现有的 Analytics Dashboard 是给人类看的，Agent 需要结构化的因果推理。" : "Existing analytics dashboards are built for human eyes. Agents need structured causal reasoning."}</p>
            </div>
          </div>
        </section>

        {/* 3. WHAT IT DOES SECTION */}
        <section className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#00FFA3]/5 to-transparent border border-[#00FFA3]/10">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">{isZh ? "Smartclaw 在做什么？" : "How Smartclaw Solana Works"}</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00FFA3]/10 flex items-center justify-center text-[#00FFA3] font-mono text-xl font-bold">1</div>
              <h4 className="font-semibold text-white">Observe</h4>
              <p className="text-sm text-white/50">{isZh ? "监控整个网络的异动行为。" : "Monitor anomalous volume and flow across the network."}</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00FFA3]/10 flex items-center justify-center text-[#00FFA3] font-mono text-xl font-bold">2</div>
              <h4 className="font-semibold text-white">Rank</h4>
              <p className="text-sm text-white/50">{isZh ? "按 Conviction 从高到低筛选聪明钱包。" : "Filter and rank smart wallets by actual conviction score."}</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00FFA3]/10 flex items-center justify-center text-[#00FFA3] font-mono text-xl font-bold">3</div>
              <h4 className="font-semibold text-white">Explain</h4>
              <p className="text-sm text-white/50">{isZh ? "将异动行为解读为可转述的原因。" : "Translate behavioral shifts into structured rationales."}</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#00FFA3]/10 flex items-center justify-center text-[#00FFA3] font-mono text-xl font-bold">4</div>
              <h4 className="font-semibold text-white">Watch</h4>
              <p className="text-sm text-white/50">{isZh ? "输出随时可用的监控列表。" : "Output watchlist-ready signals to your agent layer."}</p>
            </div>
          </div>
        </section>

        {/* 4. DEMO QUERY SECTION */}
        <section id="demo" className="scroll-mt-24 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{isZh ? "API 调用演示" : "Demo Query"}</h2>
            <p className="text-white/50">{isZh ? "这是 Agent 如何直接请求情报数据的展示。" : "How an agent consumes intelligence natively."}</p>
          </div>
          
          <div className="grid lg:grid-cols-[250px_1fr] gap-6">
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
              {tabs.map((tab, idx) => (
                <button 
                  key={tab.id}
                  onClick={() => handleTabChange(idx)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-all whitespace-nowrap ${activeTab === idx ? "bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/30" : "bg-white/[0.02] text-white/50 border border-transparent hover:bg-white/5"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden min-h-[300px] flex flex-col shadow-2xl">
              <div className="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center gap-3">
                <span className="text-[#00FFA3] font-mono text-sm font-semibold">GET</span>
                <span className="font-mono text-sm tracking-tight text-white/80">{tabs[activeTab].query}</span>
              </div>
              <div className="p-6 overflow-x-auto bg-[#050505]">
                <pre className="font-mono text-[13px] leading-relaxed text-[#00FFA3]/80">
                  {apiResponses[tabs[activeTab].id] 
                    ? JSON.stringify(apiResponses[tabs[activeTab].id], null, 2)
                    : tabs[activeTab].response 
                      ? JSON.stringify(tabs[activeTab].response, null, 2)
                      : "Fetching live Solana Intelligence from DexScreener..."}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHY IT WINS SECTION */}
        <section className="space-y-12 py-12 border-y border-white/5">
          <h2 className="text-3xl font-bold text-center text-white">{isZh ? "为什么 Smartclaw 是更好的输入" : "Why It Wins"}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#00FFA3]/10 text-[#00FFA3]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <h3 className="text-lg font-semibold">Agent-ready, not dashboard-only</h3>
              <p className="text-sm text-white/50">Optimized for JSON parsing and LLM context windows, not complex visual graphs.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#00FFA3]/10 text-[#00FFA3]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3 className="text-lg font-semibold">Explanation-first</h3>
              <p className="text-sm text-white/50">Don't just provide raw transaction hashes. Provide causality, reasoning, and logic.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#00FFA3]/10 text-[#00FFA3]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              </div>
              <h3 className="text-lg font-semibold">Signal ranking</h3>
              <p className="text-sm text-white/50">Agents shouldn't have to paginate endless data tables. They get top 10 actionable targets.</p>
            </div>
          </div>
        </section>

        {/* 6. DEVELOPER SURFACE */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center text-white">{isZh ? "快速集成" : "Developer Surface"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/SKILL.md" target="_blank" className="p-5 rounded-xl border border-white/10 hover:border-[#00FFA3]/50 hover:bg-[#00FFA3]/5 transition-all group">
              <h3 className="font-mono text-[#00FFA3] font-bold mb-2 flex items-center justify-between">SKILL.md <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
              <p className="text-sm text-white/60">Drop this file into your agent's character prompt for instant context.</p>
            </a>
            <a href="/api/openapi" target="_blank" className="p-5 rounded-xl border border-white/10 hover:border-[#00FFA3]/50 hover:bg-[#00FFA3]/5 transition-all group">
              <h3 className="font-mono text-[#00FFA3] font-bold mb-2 flex items-center justify-between">OpenAPI spec <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
              <p className="text-sm text-white/60">Full Swagger 3.1 definitions for robust typed integrations.</p>
            </a>
            <a href="/agents.json" target="_blank" className="p-5 rounded-xl border border-white/10 hover:border-[#00FFA3]/50 hover:bg-[#00FFA3]/5 transition-all group">
              <h3 className="font-mono text-[#00FFA3] font-bold mb-2 flex items-center justify-between">agents.json <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
              <p className="text-sm text-white/60">Capabilities manifest for automated system discovery.</p>
            </a>
            <a href="/docs" className="p-5 rounded-xl border border-white/10 hover:border-[#00FFA3]/50 hover:bg-[#00FFA3]/5 transition-all group">
              <h3 className="font-mono text-[#00FFA3] font-bold mb-2 flex items-center justify-between">API Docs <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
              <p className="text-sm text-white/60">Human-readable documentation and legacy endpoint guides.</p>
            </a>
          </div>
        </section>

        {/* 7. ROADMAP */}
        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12 text-center space-y-8">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Roadmap (Post-Hackathon)</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white/70 border border-white/10">1. Optional Execution Layer integrations</span>
            <span className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white/70 border border-white/10">2. Twitter Signal Publishing</span>
            <span className="px-4 py-2 rounded-lg bg-white/5 text-sm text-white/70 border border-white/10">3. Cross-Chain Intels</span>
          </div>
        </section>

        {/* 8. SUBMISSION FOOTER */}
        <footer className="pt-12 pb-6 flex flex-col items-center justify-center space-y-8 text-center border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="flex-1 min-w-[150px] px-6 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/10 transition-colors">Read X Article</a>
            <a href="/api/openapi" className="flex-1 min-w-[150px] px-6 py-3 rounded-lg border border-[#00FFA3]/50 text-[#00FFA3] bg-[#00FFA3]/5 font-medium hover:bg-[#00FFA3]/20 transition-colors">Try API</a>
            <a href="/docs" className="flex-1 min-w-[150px] px-6 py-3 rounded-lg border border-white/20 text-white font-medium hover:bg-white/10 transition-colors">Open Docs</a>
          </div>
          
          <div className="text-xs text-white/40 font-mono tracking-widest uppercase flex items-center gap-2">
            <span>Building in public for</span>
            <span className="text-white/80">Solana Agent Economy</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
