import { motion } from "motion/react";
import { ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingAnimation({
  label,
  sublabel,
  className,
}: {
  label: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}
    >
      <div className="relative">
        <span className="absolute inset-0 grid place-items-center">
          <ShieldCheck className="h-7 w-7 animate-pulse text-white" strokeWidth={2.2} />
        </span>
        <span className="h-14 w-14 animate-spin rounded-full border-[3px] border-saffron/70 border-t-transparent" />
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      <div className="mt-1 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 w-1.5 rounded-full bg-primary", i === 0 && "animate-bounce")}
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function ScanLineAnimation({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-40 overflow-hidden rounded-lg border-2 border-dashed border-primary/40 bg-muted/60">
        <ScanLine className="absolute inset-x-0 top-0 h-full w-full text-primary animate-shimmer" />
        <Sparkles className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-saffron" />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}