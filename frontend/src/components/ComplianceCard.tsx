import { BadgeCheck, BookOpenCheck, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { SourceCard } from "@/components/SourceCard";
import { cn, pct } from "@/lib/utils";
import type { AnalysisMeta, StandardRef } from "@/types/api";

export function ComplianceCard({
  meta,
  onOpenStandard,
  className,
}: {
  meta: AnalysisMeta;
  onOpenStandard?: (isNumber: string) => void;
  className?: string;
}) {
  const modeSimulation = meta.mode === "simulation";
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 card-shadow", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-4.5 w-4.5 text-primary" />
        <span className="text-sm font-semibold">Structured Analysis</span>
        <StatusBadge status={meta.status} />
        {modeSimulation && (
          <Badge variant="outline" className="border-dashed text-[10px]">
            Simulation
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-semibold tabular-nums">{pct(meta.confidence)}</span>
      </div>
      <Progress value={meta.confidence * 100} indicatorClassName={confidenceColor(meta.confidence)} className="mt-1" />
      {meta.standards.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
            Presently Identified Standard{meta.standards.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {meta.standards.map((std: StandardRef) => (
              <button
                key={std.is_number}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border bg-muted/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10",
                  std.relevance === "high" && "border-primary/30"
                )}
                onClick={() => onOpenStandard?.(std.is_number)}
              >
                {std.relevance === "high" ? (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <BookOpenCheck className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {std.is_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {meta.sources.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
            Sources · {meta.sources.length}
          </p>
          <div className="space-y-1.5">
            {meta.sources.map((s) => (
              <SourceCard key={s.document + (s.page ? `-p${s.page}` : "")} source={s} />
            ))}
          </div>
        </div>
      )}
      {meta.disclaimer && (
        <p className="mt-3 rounded-lg bg-saffron/10 px-3 py-2 text-[11px] leading-snug text-foreground">
          ⚠ {meta.disclaimer}
        </p>
      )}
    </div>
  );
}

function confidenceColor(value: number): string {
  if (value >= 0.8) return "bg-bis-600";
  if (value >= 0.55) return "bg-bis-700";
  return "bg-bis-800";
}