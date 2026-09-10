import { motion } from "motion/react";
import { Bot, FileSearch, Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "78+", label: "Standards seeded" },
  { value: "15", label: "Source docs indexed" },
  { value: "3", label: "Languages" },
  { value: "100%", label: "Risk-safe replies" },
];

export function Hero() {
  return (
    <section className="home-hero relative min-w-0 overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-[#eaf7ff] via-white to-[#fff7e8] p-4 text-foreground card-shadow-lg sm:p-10">
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div className="absolute -right-24 -top-16 h-[480px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 -left-16 h-[360px] w-[380px] rounded-full bg-orange-100/60 blur-3xl" aria-hidden />

      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="min-w-0"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/10">
            <Landmark className="h-3.5 w-3.5 text-saffron" />
            भारत सरकार · GOVERNMENT OF INDIA
          </span>

          <h1 className="mt-4 text-[clamp(2rem,10vw,3rem)] font-extrabold leading-[1.05] tracking-tight">
            <span className="text-primary">YOUR SAFETY,</span>
            <br />
            <span className="text-primary">OUR PRIORITY.</span>
          </h1>

          <p className="hero-description mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Ask anything about Indian Standards, scan a product label for BIS
            compliance clues, or get certification guidance for your MSME — powered
            by RAG + Gemini, in English, हिंदी and తెలుగు.
          </p>

          <div className="mt-5 w-full max-w-xl">
            <SearchBar />
          </div>

          <div className="mt-5 sm:mt-6 flex flex-wrap gap-2.5">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-lg bg-white/75 px-3 py-2 text-center ring-1 ring-primary/10 backdrop-blur-sm">
                <p className="text-base font-bold tabular-nums">{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="relative hidden sm:block"
        >
          <div className="rounded-2xl bg-white/95 p-5 shadow-2xl ring-1 ring-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">BIS Safety Assistant</p>
                <p className="text-[11px] text-muted-foreground">RAG · Gemini · Structured answers</p>
              </div>
              <span className="ml-auto inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-success" />
            </div>
            <div className="mt-3 rounded-xl bg-muted/70 p-3.5">
              <p className="text-[11px] font-bold text-muted-foreground">Try asking</p>
              <p className="mt-1.5 text-xs text-foreground">"Which IS applies to my electric kettle?"</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-success">
                <Sparkles className="h-3 w-3" /> Retrieving from knowledge base…
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-current" style={{ backgroundColor: "currentColor" }} />
                IS 302 (Part 2-15):2018
              </span>
              <Link
                to="/chat"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                Ask Now →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}