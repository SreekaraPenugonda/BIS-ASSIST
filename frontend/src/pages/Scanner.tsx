import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Camera,
  FileImage,
  FileUp,
  IdCard,
  ImageUp,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SourceCard } from "@/components/SourceCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingAnimation, ScanLineAnimation } from "@/components/LoadingAnimation";
import { EmptyState } from "@/components/EmptyState";
import { useScanner } from "@/hooks/useScanner";
import { useUserMode } from "@/context/UserModeContext";
import { cn, pct } from "@/lib/utils";

const SAMPLES = [
  { file: "electric_kettle_label.png", label: "Electric Kettle" },
  { file: "led_bulb_label.png", label: "LED Bulb" },
  { file: "helmet_label.png", label: "Safety Helmet" },
];

const STAGE_LABELS: Record<string, { title: string; sub: string }> = {
  uploading: { title: "Uploading image…", sub: "Sending label photo securely" },
  scanning: { title: "Scanning label…", sub: "Detecting BIS Standard Mark & text" },
  analyzing: { title: "Analysing…", sub: "Matching against the standards knowledge base" },
};

export function ScannerPage() {
  const { stage, result, error, imagePreview, lastFilename, run, reset } = useScanner();
  const { addActivity } = useUserMode();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [hint, setHint] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const location = useLocation();
  const fromQuery = new URLSearchParams(location.search).get("sample");
  const ranRef = useRef(false);

  useEffect(() => {
    if (fromQuery && !ranRef.current) {
      ranRef.current = true;
      void runSample(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromQuery]);

  const startFile = useCallback(
    (file: File) => void run(file, hint),
    [run, hint]
  );

  async function runSample(file: string) {
    const url = `${window.location.origin}/samples/${file}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Sample not found");
      const blob = await res.blob();
      const image = new File([blob], file, { type: blob.type || "image/png" });
      void run(image, hint);
    } catch {
      addActivity({
        title: "Sample label failed to load",
        detail: "Are you running the frontend dev server?",
        kind: "scan",
        status: "Not Found",
      });
    }
  }

  const busy = stage === "uploading" || stage === "scanning" || stage === "analyzing";
  const stageBlock = STAGE_LABELS[stage];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Product Label Scanner</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Upload a clear photo of the product label — we detect the BIS Standard Mark, Licence
            number and likely applicable standards.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          <TriangleAlert className="h-4 w-4" />
          Never certifies a product from an image
        </div>
      </div>
{/* dropzone */}
      {!busy && stage !== "done" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-dashed border-primary/40 bg-card p-8 text-center"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) startFile(file);
          }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <ImageUp className={cn("h-8 w-8 transition-transform text-primary", dragOver && "-translate-y-0.5")} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-foreground">Drop a label photo here</h2>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · up to 10 MB</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => fileRef.current?.click()}>
              <FileImage className="h-4 w-4" /> Choose photo
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Camera className="h-4 w-4" /> Take photo
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground">or try a sample:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.file}
                className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                onClick={() => void runSample(s.file)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <Input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional: what is this product? (e.g. electric kettle)"
            className="mt-2.5 h-8 w-full max-w-md text-xs"
            aria-label="Product hint"
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) startFile(file);
            }}
          />
        </motion.div>
      )}

      {/* progress */}
      {busy && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8">
          <ScanLineAnimation label={stageBlock.sub} />
          <LoadingAnimation label={stageBlock.title} sublabel="Est. 1–3 seconds in simulation mode" />
        </div>
      )}

      {/* error */}
      {stage === "error" && (
        <EmptyState
          title="Scan failed"
          description={error || "Could not analyse the image. Please try again or use a sample label."}
          actionLabel="Try again"
          onAction={reset}
        />
      )}
{/* result */}
      {stage === "done" && result && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground">
              Scanned image
            </div>
            {imagePreview && <img src={imagePreview} alt={lastFilename} className="max-h-[340px] w-full object-contain" />}
            <p className="mt-1 truncate px-3 pb-2 text-[11px] text-muted-foreground">{lastFilename}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Scan result</h2>
              <StatusBadge status={result.status} />
              <Badge variant={result.mode === "ai" ? "success" : "outline"} className="border-dashed">
                {result.mode === "ai" ? "Vision AI" : "Simulation"}
              </Badge>
            </div>

            <div className="mt-3.5 space-y-2.5 text-sm">
              <ResultRow label="Product" value={result.product?.name} />
              <ResultRow label="Category" value={result.product?.category} />
              {result.product?.brand && <ResultRow label="Brand" value={result.product.brand} />}
              {result.product?.model && <ResultRow label="Model" value={result.product.model} />}
              <ResultRow
                label="BIS Standard Mark"
                value={
                  result.is_mark?.detected
                    ? `Detected${result.is_mark.text ? ` · ${result.is_mark.text}` : ""}`
                    : "Not detected"
                }
                tone={result.is_mark?.detected ? "success" : "muted"}
              />
              <ResultRow
                label="Licence number"
                value={result.license_number || "—"}
                tone={result.license_number ? "success" : "muted"}
              />
            </div>

            {result.standard && (
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Identified standard</span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-foreground">
                  <IdCard className="h-3.5 w-3.5 text-primary" />
                  {result.standard.is_number}
                </span>
              </div>
            )}

            <div className="mt-3.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confidence / match strength</span>
              <span className="font-semibold tabular-nums">{pct(result.confidence)}</span>
            </div>
            <Progress value={result.confidence * 100} className="mt-1" />

            {result.sources.length > 0 && (
              <div className="mt-3.5">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Sources</p>
                <div className="space-y-1.5">
                  {result.sources.map((s) => (
                    <SourceCard key={s.document} source={s} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-foreground">
              <span className="font-semibold text-warning">Why "{result.status}":</span> {result.message}
            </div>
            {result.disclaimer && (
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">⚠ {result.disclaimer}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={reset}>
                <FileUp className="h-4 w-4" /> New scan
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ResultRow({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value?: string | null;
  tone?: "success" | "muted";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("truncate text-xs font-semibold", tone === "success" ? "text-success" : "text-foreground")}>
        {value || "—"}
      </span>
    </div>
  );
}