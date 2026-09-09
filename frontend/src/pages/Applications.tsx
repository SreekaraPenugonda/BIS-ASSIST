import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, CircleDashed, Factory, LogIn, Map, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import {
  createApplication,
  getApplication,
  listApplications,
  updateApplicationStatus,
} from "@/services/standardsApi";
import { getErrorMessage } from "@/services/api";
import { cn, formatDate } from "@/lib/utils";
import type { ApplicationRecord } from "@/types/api";

const STATUS_STEPS = ["Submitted", "Under Review", "Testing", "Approved"];

export function ApplicationsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [trackNumber, setTrackNumber] = useState("");
  const [tracked, setTracked] = useState<ApplicationRecord | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = {
    product_name: "",
    category: "Electrical & Electronics",
    is_number: "",
    standard_title: "",
  };

  const reload = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      setApps(await listApplications());
    } catch (err) {
      toast("error", "Could not load applications", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function submitNew(record: typeof form) {
    try {
      const created = await createApplication(record);
      toast("success", "Application submitted", `Ref no. ${created.application_number}`);
      setApps((prev) => [created, ...prev]);
    } catch (err) {
      toast("error", "Submission failed", getErrorMessage(err));
    }
  }

  async function track() {
    const num = trackNumber.trim().toUpperCase();
    if (!num) return;
    setTrackError(null);
    setTracked(null);
    try {
      setTracked(await getApplication(num));
    } catch (err) {
      setTrackError(getErrorMessage(err));
    }
  }

  async function advance(app: ApplicationRecord) {
    const idx = STATUS_STEPS.indexOf(app.status);
    const next = idx >= 0 && idx < STATUS_STEPS.length - 1 ? STATUS_STEPS[idx + 1] : "Rejected";
    if (!isAdmin) {
      toast("info", "Admins advance statuses", "Sign in as admin@bis.ai to test this.");
      return;
    }
    try {
      const updated = await updateApplicationStatus(app.id, next);
      setApps((prev) => prev.map((a) => (a.id === app.id ? updated : a)));
      toast("success", `Status updated to ${next}`, app.application_number);
    } catch (err) {
      toast("error", "Update failed", getErrorMessage(err));
    }
  }

  const isAdmin = user?.role === "admin";

  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Applications</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track a BIS licence application or sign in to manage yours.
          </p>
        </div>

        <Card className="card-shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" /> Track an application
            </CardTitle>
            <CardDescription>
              Enter the application reference (e.g. BIS-2026-100234) to see its current status.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2.5">
            <Input
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void track()}
              placeholder="BIS-2026-XXXXXX"
              className="flex-1"
              aria-label="Application number"
            />
            <Button onClick={() => void track()}>
              <Search className="h-4 w-4" /> Track
            </Button>
          </CardContent>
          {tracked && <ApplicationTimeline app={tracked} />}
          {trackError && <p className="mt-2 rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">{trackError}</p>}
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Sign in for full access</CardTitle>
            <CardDescription>
              MSME accounts can submit new applications; admins can advance statuses. Try{" "}
              <code className="kbd">msme@bis.ai</code> / <code className="kbd">msme123</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">My Applications</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Licence submissions for <b>{user.name}</b> ({user.role}).
            </p>
          </div>
          <Badge variant={isAdmin ? "saffron" : "muted"}>
            {isAdmin ? "Admin — can advance statuses" : "MSME portal"}
          </Badge>
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        ) : apps.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-6 text-center text-xs text-muted-foreground">
            No applications yet — use the form below to submit one.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            {apps.map((app) => (
              <motion.div
                key={app.application_number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2.5 border-b bg-card px-4 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                    <Factory className="h-4 w-4 text-primary" />
                    {app.product_name}
                    <span className="text-[10px] font-medium text-muted-foreground">({app.application_number})</span>
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {app.standard_title || app.category} · submitted {formatDate(app.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => void advance(app)}>
                      Advance →
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
<NewApplicationForm onSubmit={submitNew} />

        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-bold">Track any application number</p>
          <div className="flex items-center gap-2.5">
            <Input
              value={trackNumber}
              onChange={(e) => setTrackNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void track()}
              placeholder="BIS-2026-XXXXXX"
              className="flex-1"
              aria-label="Application number"
            />
            <Button onClick={() => void track()}>
              <Search className="h-4 w-4" /> Track
            </Button>
          </div>
          {tracked && <ApplicationTimeline app={tracked} />}
          {trackError && <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">{trackError}</p>}
        </div>
      </div>
    );
  }

function NewApplicationForm({
  onSubmit,
}: {
  onSubmit: (record: { product_name: string; category: string; is_number: string; standard_title: string }) => void;
}) {
  const [product_name, setProduct] = useState("");
  const [category, setCategory] = useState("Electrical & Electronics");
  const [is_number, setIsNumber] = useState("");
  const [standard_title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const CATEGORIES = [
    "Electrical & Electronics",
    "Consumer Goods & Appliances",
    "Food, Water & Packaging",
    "Construction & Infrastructure",
    "Transportation & Safety",
    "Toys & Child Safety",
    "Medical Equipment",
    "Energy & Lighting",
  ];

  const submit = () => {
    if (product_name.trim().length < 2) return;
    onSubmit({
      product_name: product_name.trim(),
      category,
      is_number: is_number.trim(),
      standard_title: standard_title.trim(),
    });
    setProduct("");
    setIsNumber("");
    setTitle("");
    setNotes("");
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" /> New certification application
        </CardTitle>
        <CardDescription>
          Submit a licence application for an MSME product — a reference number is generated instantly.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="pa-product">Product name *</Label>
          <Input
            id="pa-product"
            value={product_name}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. Electric Kettle 1.75L"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pa-category">Category</Label>
          <Input
            id="pa-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="category-list"
            className="mt-1.5"
          />
          <datalist id="category-list">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="pa-is">Applicable IS (optional)</Label>
          <Input
            id="pa-is"
            value={is_number}
            onChange={(e) => setIsNumber(e.target.value)}
            placeholder="IS 302 (Part 2-15):2018"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pa-title">Standard title (optional)</Label>
          <Input
            id="pa-title"
            value={standard_title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Safety of heating appliances…"
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pa-notes">Notes (optional)</Label>
          <textarea
            id="pa-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1.5 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Sample dispatch details, plant address…"
          />
        </div>
        <Button onClick={submit} disabled={product_name.trim().length < 2} className="sm:col-span-2">
          <Send className="h-4 w-4" /> Submit application
        </Button>
      </CardContent>
    </Card>
  );
}

function ApplicationTimeline({ app }: { app: ApplicationRecord }) {
  const currentIdx = STATUS_STEPS.indexOf(app.status);
  return (
    <div className="mt-3 rounded-xl border border-border bg-background/70 px-4 py-3">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Timeline · {app.application_number}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full border-2 text-[10px] font-bold",
                i <= currentIdx
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {i < currentIdx ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : i === currentIdx ? (
                currentIdx >= STATUS_STEPS.length - 1 ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <CircleDashed className="h-3.5 w-3.5" />
                )
              ) : (
                "•"
              )}
            </span>
            <span className="text-center text-[9.5px] leading-tight text-muted-foreground">
              {step}
            </span>
          </div>
        ))}
      </div>
      {app.status === "Rejected" || app.status === "Recheck Required" ? (
        <p className="mt-2 text-xs font-medium text-destructive">
          {app.status} — {app.notes}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{app.notes || "No notes on file."}</p>
      )}
    </div>
  );
}