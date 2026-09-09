import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpenCheck, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { searchStandards } from "@/services/standardsApi";
import { cn } from "@/lib/utils";
import type { StandardListItem, StandardListResponse } from "@/types/api";

export function StandardsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [data, setData] = useState<StandardListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StandardListItem | null>(null);

  const fetchPage = useCallback(async (q: string, cat: string, pageNo: number) => {
    setLoading(true);
    try {
      const res = await searchStandards(q, cat, pageNo);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(query, category, page);
  }, [query, category, page, fetchPage]);

  const chips = ["all", ...(data?.categories ?? [])];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Indian Standards Explorer</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Search and browse curated records for 29+ important Indian Standards across 9 categories.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (page !== 1) setPage(1);
            }}
            placeholder="Search by IS number, keyword, product…"
            className="h-9 rounded-lg pl-9 text-sm"
            aria-label="Search standards"
          />
        </div>
        {data && <Badge variant="muted">{(data.total ?? 0).toLocaleString("en-IN")} results</Badge>}
      </div>

      <div className="no-scrollbar flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === c
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
            onClick={() => {
              setCategory(c);
              setPage(1);
            }}
          >
            {c === "all" ? "All categories" : c}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!loading && data && data.items.length === 0 && (
        <EmptyState
          title="No standards match"
          description={`Nothing in the knowledge base matched "${query}". Try a different keyword or category.`}
        />
      )}
{!loading && data && data.items.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {data.items.map((std) => (
            <Dialog key={std.is_number}>
              <DialogTrigger
                className="group flex w-full flex-col gap-2 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                onClick={() => setSelected(std)}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <BookOpenCheck className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-foreground">{std.is_number}</span>
                  <span className="block truncate text-xs text-muted-foreground">{std.title}</span>
                </span>
                <span className="hidden items-center gap-1 text-[10px] font-medium text-muted-foreground sm:flex">
                  {std.product_category}
                </span>
                {std.is_mandatory && <Badge variant="saffron">Mandatory</Badge>}
                <StatusBadge status={std.status} />
                <span className="text-primary transition-transform group-hover:translate-x-0.5">→</span>
              </DialogTrigger>

              <DialogContent size="lg" onInteractOutside={() => setSelected(null)}>
                <DialogCloseButton />
                <DialogTitle className="text-base">
                  <span className="text-primary">{selected?.is_number ?? std.is_number}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">{selected?.title ?? std.title}</DialogDescription>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <Badge variant="muted">{selected?.product_category ?? std.product_category}</Badge>
                  <Badge variant={selected?.is_mandatory ? "saffron" : "outline"}>
                    {selected?.is_mandatory ? "Mandatory certification" : "Voluntary"}
                  </Badge>
                  {selected && <StatusBadge status={selected.status} />}
                  <Badge variant="outline">Rev. {selected?.published_date ?? std.published_date}</Badge>
                </div>

                <div className="max-h-[260px] space-y-2.5 overflow-y-auto text-sm">
                  <p className="font-semibold">Description</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{selected?.description ?? std.description}</p>
                  <p className="font-semibold">Scope</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{selected?.scope ?? std.scope}</p>
                  {selected && selected.requirements.length > 0 && (
                    <>
                      <p className="font-semibold">Key requirements</p>
                      <ul className="list-disc pl-4 text-xs leading-relaxed text-muted-foreground">
                        {selected.requirements.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate(`/chat?q=${encodeURIComponent(`Tell me about standard ${std.is_number}`)}`)}
                  >
                    <Sparkles className="h-4 w-4" /> Ask AI about this
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}

      {!loading && data && page * data.size < data.total && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setPage(page + 1)}>
            Load more ({Math.min(data.size, data.total - page * data.size)} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}