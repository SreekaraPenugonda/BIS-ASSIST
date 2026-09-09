import { ExternalLink, FileText } from "lucide-react";
import type { Source } from "@/types/api";
import { cn } from "@/lib/utils";

export function SourceCard({ source, className }: { source: Source; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border bg-muted/50 p-2.5", className)}>
      <FileText className="h-4 w-4 shrink-0 text-govt-blue" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{source.document}</p>
        <p className="text-[11px] text-muted-foreground">
          {[source.section, source.page ? `Page ${source.page}` : null]
            .filter(Boolean)
            .join(" · ") || "Knowledge base entry"}
        </p>
      </div>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Open source"
          title={source.url}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}