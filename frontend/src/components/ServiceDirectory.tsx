import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accessibility,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Building2,
  Calculator,
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  FlaskConical,
  FolderKanban,
  Globe2,
  GraduationCap,
  HandCoins,
  Headphones,
  Landmark,
  Languages,
  Library,
  MessageCircleQuestion,
  PackageCheck,
  ReceiptIndianRupee,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Siren,
  Sparkles,
  Store,
  Tags,
  TrainFront,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const SERVICES = [
  ["Ask BIS AI", "Get plain-language answers with source context.", "/chat", MessageCircleQuestion, "Assist"],
  ["Scan a Product", "Read labels and surface possible BIS clues.", "/scanner", SearchCheck, "Assist"],
  ["Search Standards", "Find Indian Standards by product or number.", "/standards", BookOpenCheck, "Discover"],
  ["Track Application", "Review your certification application status.", "/applications", FolderKanban, "Business"],
  ["Find Applicable IS", "Match a product description to standards.", "/msme", BadgeCheck, "Business"],
  ["Scheme-I Guidance", "Understand the ISI product certification path.", "/chat", ShieldCheck, "Certification"],
  ["CRS Registration", "Explore electronics and IT registration guidance.", "/chat", PackageCheck, "Certification"],
  ["Eco Mark Support", "Learn about environment-friendly product marking.", "/chat", Sparkles, "Certification"],
  ["Hallmarking Help", "Understand precious-metal purity assurance.", "/chat", Tags, "Certification"],
  ["Foreign Manufacturer", "Start a route for overseas product certification.", "/chat", Globe2, "Certification"],
  ["MSME Readiness", "Prepare documents and quality controls.", "/msme", ClipboardCheck, "Business"],
  ["Certification Calculator", "Estimate stages, documents and timelines.", "/chat", Calculator, "Business"],
  ["Document Checklist", "Get a tailored application checklist.", "/chat", FileCheck2, "Business"],
  ["Laboratory Guidance", "Understand testing and calibration expectations.", "/chat", FlaskConical, "Business"],
  ["Factory Inspection", "Prepare for an inspection with confidence.", "/chat", Building2, "Business"],
  ["Marking Requirements", "Review product label and marking basics.", "/chat", Tags, "Compliance"],
  ["Renewal Support", "Plan renewal and surveillance activities.", "/chat", RefreshCw, "Compliance"],
  ["Complaint Guidance", "Learn how to report a quality concern.", "/chat", Siren, "Consumer"],
  ["Consumer Safety Tips", "Make informed choices before you buy.", "/consumer", UserRoundCheck, "Consumer"],
  ["Product Recall Help", "Understand what to do with a recalled product.", "/chat", BellRing, "Consumer"],
  ["Warranty Questions", "Ask about standards and product safety.", "/chat", ShieldCheck, "Consumer"],
  ["Local Language Help", "Ask in English, Hindi or Telugu.", "/chat", Languages, "Assist"],
  ["Accessibility Support", "Use a simpler, more comfortable experience.", "/chat", Accessibility, "Assist"],
  ["Expert Contact Prep", "Prepare questions before contacting BIS.", "/chat", Headphones, "Assist"],
  ["Standards Library", "Browse curated knowledge-base documents.", "/standards", Library, "Discover"],
  ["Training Resources", "Build standards and quality awareness.", "/chat", GraduationCap, "Learn"],
  ["Quality Audit Prep", "Create an audit-ready action list.", "/chat", FileSearch, "Compliance"],
  ["Supply Chain Check", "Review supplier and incoming material controls.", "/chat", TrainFront, "Business"],
  ["Retailer Guidance", "Help customers identify compliant products.", "/chat", Store, "Consumer"],
  ["Fee & Process Guide", "Ask about indicative process stages and fees.", "/chat", ReceiptIndianRupee, "Business"],
] as const;

const FILTERS = ["All", "Assist", "Discover", "Certification", "Business", "Compliance", "Consumer", "Learn"] as const;

export function ServiceDirectory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => SERVICES.filter((service) => {
    const matchesFilter = filter === "All" || service[4] === filter;
    const haystack = `${service[0]} ${service[1]}`.toLowerCase();
    return matchesFilter && haystack.includes(query.toLowerCase().trim());
  }), [filter, query]);

  const openService = (path: string, title: string) => {
    if (path === "/chat") {
      navigate(`/chat?q=${encodeURIComponent(`Help me with ${title}`)}`);
      return;
    }
    navigate(path);
  };

  return (
    <section aria-labelledby="service-directory-title" className="rounded-2xl border border-border bg-card p-4 card-shadow sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-saffron">One place for BIS services</p>
          <h2 id="service-directory-title" className="mt-1 text-xl font-bold tracking-tight text-foreground">Explore 30 services</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Find the right next step for your product, business or safety question.</p>
        </div>
        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search services</span>
          <Wrench className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
          />
        </label>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Service categories">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {filtered.map(([title, description, path, Icon, category], index) => (
          <motion.button
            key={title}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.18) }}
            onClick={() => openService(path, title)}
            className="group min-h-36 rounded-xl border border-border bg-background/60 p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="mt-3 block text-xs font-bold text-foreground">{title}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{description}</span>
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No services match that search.</p>}
    </section>
  );
}
