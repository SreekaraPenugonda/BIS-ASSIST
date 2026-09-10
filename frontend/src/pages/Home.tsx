import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  Building2,
  Languages,
  Landmark,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { Hero } from "@/components/Hero";
import { FeatureCard } from "@/components/FeatureCard";

const FEATURES = [
  {
    icon: Bot,
    title: "RAG-grounded answers",
    description:
      "Every reply is retrieved from the BIS knowledge base and returned with source citations, not just generated text.",
  },
  {
    icon: ScanLine,
    title: "Product label scanner",
    description:
      "Upload a label photo to detect the BIS Standard Mark and surface the likely applicable IS — verification always required.",
  },
  {
    icon: Languages,
    title: "English · हिंदी · తెలుగు",
    description:
      "Ask questions in English, Hindi or Telugu. Multilingual answers are enabled when a Gemini API key is configured.",
  },
  {
    icon: UserRoundCheck,
    title: "Safety-first design",
    description:
      "The assistant never claims a product is certified from a scan or an image — it always flags VERIFICATION_REQUIRED.",
  },
  {
    icon: BookOpenCheck,
    title: "Standards explorer",
    description:
      "Browse 29+ curated Indian Standards across 9 categories with scope, requirements and status at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "MSME certification tools",
    description:
      "Find applicable standards, walk through the licence process, and apply & track your certification applications.",
  },
] as const;

const SCHEMES = [
  {
    title: "BIS Scheme-I (ISI Mark)",
    description: "Product certification for manufacturers producing goods covered by Indian Standards.",
    tag: "Product safety",
    icon: ShieldCheck,
  },
  {
    title: "BIS Scheme-II (CRS)",
    description: "Compulsory registration for notified electronics and information technology products.",
    tag: "Electronics",
    icon: ScanLine,
  },
  {
    title: "Eco Mark Scheme",
    description: "An additional mark for products that meet environmental and quality requirements.",
    tag: "Sustainability",
    icon: Sparkles,
  },
  {
    title: "Foreign Manufacturers Certification",
    description: "Guidance for overseas manufacturers supplying products to the Indian market.",
    tag: "Exporters",
    icon: Landmark,
  },
  {
    title: "MSME Facilitation",
    description: "Find standards, prepare documents and track your certification application journey.",
    tag: "Small business",
    icon: Building2,
  },
] as const;

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-7">
      <Hero />
      <section aria-label="Popular services">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex flex-wrap items-end justify-between gap-2"
        >
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">Popular services</h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Jump straight into chat, scanning, standards or MSME help.
            </p>
          </div>
        </motion.div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {[
            { to: "/chat", icon: Bot, title: "Ask AI", hint: "RAG answers + sources" },
            { to: "/scanner", icon: ScanLine, title: "Scan product", hint: "Check a label photo" },
            { to: "/standards", icon: BookOpenCheck, title: "Standards", hint: "Browse by category" },
            { to: "/msme", icon: Building2, title: "MSME help", hint: "Licence guidance" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.to}
                type="button"
                onClick={() => navigate(s.to)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.28, delay: i * 0.04 }}
                className="group flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-left card-shadow transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.04] sm:p-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">{s.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{s.hint}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </motion.button>
            );
          })}
        </div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">Why this platform</h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              An assistant that explains, guides and protects — never misleads.
            </p>
          </div>
          <Sparkles className="hidden h-5 w-5 shrink-0 text-saffron sm:block" />
        </motion.div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="min-w-0"
        >
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">Certification schemes</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            The main BIS routes, explained in one glance.
          </p>
        </motion.div>
        <div className="mt-3 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {SCHEMES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.2) }}
                className="rounded-xl border border-border bg-card p-3.5 card-shadow transition-all hover:-translate-y-0.5 hover:border-primary/40 sm:p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-saffron/15 text-saffron">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-semibold text-foreground">{s.title}</h3>
                    <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {s.tag}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

    </div>
  );
}