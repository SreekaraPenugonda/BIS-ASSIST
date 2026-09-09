import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.32 }}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 card-shadow transition-all hover:-translate-y-0.5 hover:border-primary/40",
        className
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}