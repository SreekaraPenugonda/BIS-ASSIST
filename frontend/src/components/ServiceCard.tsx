import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  Factory,
  ScanLine,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ServiceCard({
  mode,
}: {
  mode: "consumer" | "msme";
}) {
  const isConsumer = mode === "consumer";
  const Icon = isConsumer ? UserRound : Factory;
  const gradient = isConsumer
    ? "from-primary to-bis-700"
    : "from-bis-500 to-secondary";
  const links = isConsumer
    ? [
        { to: "/chat", label: "Ask about a product", icon: BookOpenCheck },
        { to: "/scanner", label: "Scan a product label", icon: ScanLine },
        { to: "/standards", label: "Check a standard", icon: BadgeCheck },
      ]
    : [
        { to: "/chat", label: "Find applicable standards", icon: BookOpenCheck },
        { to: "/msme", label: "Certification process", icon: CheckCircle2 },
        { to: "/applications", label: "Apply & track licence", icon: ScanLine },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card card-shadow-lg">
        <div className={cn("bg-gradient-to-r px-4 py-3", gradient)}>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
              <Icon className="h-5 w-5 text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold text-white">
                {isConsumer ? "Consumer Services" : "MSME / Manufacturer Services"}
              </p>
              <p className="text-[11px] text-white/85">
                {isConsumer
                  ? "Know your product before you buy"
                  : "Certification tools for your business"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 px-4 py-4">
          {links.map((l) => {
            const LIcon = l.icon;
            return (
              <Link
                key={l.to + l.label}
                to={l.to}
                className="group flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <LIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1 text-left">{l.label}</span>
                <span className="text-primary transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            );
          })}
          <Link
            to={isConsumer ? "/consumer" : "/msme"}
            className="mt-1 inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {isConsumer ? "Explore Consumer Services →" : "Explore MSME Services →"}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}