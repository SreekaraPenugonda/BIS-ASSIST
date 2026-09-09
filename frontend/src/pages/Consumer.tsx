import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeInfo,
  BookOpenText,
  CheckCircle2,
  ScanLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    to: "/chat",
    icon: BadgeInfo,
    accent: "bg-secondary/10 text-secondary",
    title: "Ask about a product",
    desc: "“Is my pressure cooker safe to use?” — get standards-based guidance in your language.",
  },
  {
    to: "/scanner",
    icon: ScanLine,
    accent: "bg-saffron/15 text-saffron",
    title: "Scan a product label",
    desc: "Upload a label photo and let AI surface the likely applicable standards and BIS mark clues.",
  },
  {
    to: "/standards",
    icon: BookOpenText,
    accent: "bg-success/10 text-success",
    title: "Find an Indian Standard",
    desc: "Search 29+ curated standards across electrical, food, construction, safety and more.",
  },
  {
    to: "/chat?q=How do I check if a product is ISI certified?",
    icon: ShieldCheck,
    accent: "bg-primary/10 text-primary",
    title: "Check a BIS / ISI mark",
    desc: "Learn how to read the Standard Mark, licence numbers and where to verify them officially.",
  },
] as const;

export function ConsumerPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-bis-700 p-6 text-white card-shadow-lg">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">
          <UserRound className="h-3.5 w-3.5 text-saffron" /> Consumer services
        </span>
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight">
          Know your product, <span className="text-gradient">before you buy.</span>
        </h1>
        <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
          Indian Standards are your safety net. Ask plain-language questions, scan labels,
          and understand the ISI mark — all in one assistant.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Link
                to={card.to}
                className="group flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 card-shadow transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl", card.accent)}>
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h2 className="text-base font-bold text-foreground">{card.title}</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 card-shadow">
        <h2 className="text-sm font-bold text-foreground">Quick safety checklist</h2>
        <ul className="mt-3 space-y-2">
          {[
            "Look for the Standard Mark (ISI) and the 7–8 character licence number on the pack.",
            "Verify the licence number on the official BIS portal before trusting a mark.",
            "A valid mark is only printed by licensed factories — suspicious prints are a red flag.",
            "Report fakes to the BIS or the consumer helpline; certification misuse is an offence.",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-xs leading-relaxed text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}