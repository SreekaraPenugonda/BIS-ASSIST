import { useNavigate } from "react-router-dom";
import {
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
import { QuickAccess } from "@/components/QuickAccess";
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
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <Hero />
        <section className="rounded-2xl border border-border bg-card p-4 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Quick Access</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Start with a popular service</p>
            </div>
            <Sparkles className="h-4 w-4 text-saffron" />
          </div>
          <div className="mt-3">
            <QuickAccess />
          </div>
        </section>
      </div>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">Why this platform</h2>
            <p className="text-sm text-muted-foreground">
              An assistant that explains, guides and protects — never misleads.
            </p>
          </div>
          <Sparkles className="hidden h-5 w-5 text-saffron sm:block" />
        </motion.div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

    </div>
  );
}