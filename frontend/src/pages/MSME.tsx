import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Factory,
  FileCheck2,
  FileSearch,
  FlaskConical,
  FolderKanban,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { createApplication, listApplications, recommendProduct } from "@/services/standardsApi";
import { getErrorMessage } from "@/services/api";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { ApplicationRecord, RecommendResponse } from "@/types/api";

const PROCESS_STEPS = [
  {
    title: "1 · Identify your standard",
    icon: FileSearch,
    desc: "Determine the Indian Standard applicable to your product — the recommender below is a great first step.",
  },
  {
    title: "2 · Apply to BIS",
    icon: FlaskConical,
    desc: "Submit an application with product details, plant information and your quality-control system.",
  },
  {
    title: "3 · Sample testing & inspection",
    icon: FileCheck2,
    desc: "Samples are tested in a BIS-recognised laboratory; a pre-inspection of the plant is also conducted.",
  },
  {
    title: "4 · Licence & surveillance",
    icon: ShieldCheck,
    desc: "On success you can print the Standard Mark. Licensed units stay under regular surveillance testing.",
  },
];

export function MSMEPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState<RecommendResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const loadApps = useCallback(async () => {
    try {
      setApps(await listApplications());
    } catch {
      setApps([]); // anonymous visitors simply see an empty tracker
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    void loadApps();
  }, [loadApps]);

  const findStandards = useCallback(async () => {
    if (productName.trim().length < 2) return;
    setBusy(true);
    try {
      setRecommendation(
        await recommendProduct({ product_name: productName.trim(), description: description.trim() })
      );
    } catch (err) {
      toast("error", "Recommendation failed", getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [productName, description, toast]);

  const applyNow = useCallback(
    async (std: { is_number: string; title: string }) => {
      if (!isAuthenticated) {
        toast("info", "Sign in first", "Use msme@bis.ai / msme123 to apply as an MSME.");
        return;
      }
      try {
        const created = await createApplication({
          product_name: productName.trim() || "My product",
          category: recommendation?.category ?? "",
          is_number: std.is_number,
          standard_title: std.title,
        });
        toast("success", "Application submitted", `Ref no. ${created.application_number}`);
      } catch (err) {
        toast("error", "Could not submit", getErrorMessage(err));
      }
    },
    [isAuthenticated, productName, recommendation, toast]
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-bis-500 to-secondary p-6 text-white card-shadow-lg">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">
          <Factory className="h-3.5 w-3.5 text-saffron" /> MSME · Manufacturer services
        </span>
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight">
          From product idea to <span className="text-gradient">ISI Standard Mark.</span>
        </h1>
        <p className="relative mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
          Identify the right Indian Standard, understand the certification process, submit and
          track licence applications — built for small manufacturers.
        </p>
      </section>

      <Tabs defaultValue="find">
        <TabsList className="w-full grid-cols-4">
          <TabsTrigger value="find" className="flex-1">Find standards</TabsTrigger>
          <TabsTrigger value="process" className="flex-1">Process</TabsTrigger>
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="track" className="flex-1">Track</TabsTrigger>
        </TabsList>
          {/* ---------------- find ---------------- */}
          <TabsContent value="find" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-saffron" /> Standard finder
                </CardTitle>
                <CardDescription>
                  Describe your product — the engine matches it against the Indian Standards catalogue.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="msme-product">Product name *</Label>
                  <Input
                    id="msme-product"
                    placeholder="e.g. Stainless steel water bottle"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void findStandards()}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="msme-desc">Description (optional)</Label>
                  <Input
                    id="msme-desc"
                    placeholder="Material, capacity, intended use…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="w-fit"
                  disabled={busy || productName.trim().length < 2}
                  onClick={() => void findStandards()}
                >
                  <Sparkles className={cn("h-4 w-4", busy && "animate-pulse")} />
                  {busy ? "Matching…" : "Find standards"}
                </Button>
              </CardContent>
            </Card>
            {recommendation && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Suggested category:{" "}
                  <span className="font-semibold text-foreground">
                    {recommendation.category || "—"}
                  </span>
                </p>
                {recommendation.standards.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No direct catalogue match. Try{" "}
                      <Link to="/chat" className="font-medium text-primary hover:underline">
                        Ask AI
                      </Link>{" "}
                      for a deeper document search.
                    </CardContent>
                  </Card>
                ) : (
                  recommendation.standards.map((std) => (
                    <Card key={std.is_number} className="card-shadow">
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default" className="font-mono">
                              {std.is_number}
                            </Badge>
                            <Badge variant={std.relevance === "high" ? "success" : "secondary"}>
                              {std.relevance} relevance
                            </Badge>
                            <StatusBadge status={std.status} />
                          </div>
                          <p className="mt-1.5 truncate text-sm font-semibold">{std.title}</p>
                          {std.scope && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {std.scope}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button size="sm" onClick={() => void applyNow(std)}>
                            <Send className="h-3.5 w-3.5" /> Apply
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/standards?q=${encodeURIComponent(std.is_number)}`}>
                              Details <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
                <p className="text-[11px] text-muted-foreground">{recommendation.disclaimer}</p>
              </div>
            )}
          </TabsContent>
          {/* ---------------- process ---------------- */}
          <TabsContent value="process" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {PROCESS_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="card-shadow">
                    <CardContent className="flex items-start gap-3 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Card className="mt-3 border-saffron/40 bg-saffron/5">
              <CardContent className="flex items-start gap-2.5 p-4 text-xs leading-relaxed">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-saffron" />
                <span>
                  Typical licence grant takes <strong>30–90 days</strong> after successful testing.
                  Ensure in-house quality control (lab + trained staff) before applying — it is
                  audited during the factory inspection.
                </span>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ---------------- overview ---------------- */}
          <TabsContent value="overview" className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpenCheck className="h-4 w-4 text-primary" /> Documents you'll need
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>Factory registration / Udyam (MSME) certificate</li>
                  <li>Manufacturing process flow chart &amp; machinery list</li>
                  <li>In-house test facility details &amp; QC staff credentials</li>
                  <li>Recent independent lab test reports (if available)</li>
                  <li>Trademark registration for the brand name</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Scheme options
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    <strong className="text-foreground">Scheme-1 (ISI Mark):</strong> full product
                    certification with surveillance
                  </li>
                  <li>
                    <strong className="text-foreground">Simplified procedure:</strong> licence on
                    self-test + third-party report for units with good labs
                  </li>
                  <li>
                    <strong className="text-foreground">Eco mark:</strong> additional "ECO" logo for
                    environment-friendly products
                  </li>
                  <li>
                    <strong className="text-foreground">Scheme-II (CRS):</strong> compulsory
                    registration for notified electronics and IT products
                  </li>
                  <li>
                    <strong className="text-foreground">FMCS:</strong> certification route for
                    foreign manufacturers supplying products in India
                  </li>
                  <li>
                    <strong className="text-foreground">Hallmarking:</strong> purity assurance for
                    precious metal articles through registered jewellers
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4 text-primary" /> What is tested?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed text-muted-foreground">
                Sample products are drawn (from the factory and from the market) and tested for
                safety, performance, marking and packaging against every clause of the relevant IS.
                The plant inspection covers raw-material controls, process capability, calibration
                records and the overall quality-management system.
              </CardContent>
            </Card>
          </TabsContent>
          {/* ---------------- track ---------------- */}
          <TabsContent value="track" className="mt-4 space-y-3">
            {loadingApps ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Loading applications…
                </CardContent>
              </Card>
            ) : apps.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <FolderKanban className="h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm font-semibold">No applications yet</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Pick a standard in the <strong>Find standards</strong> tab and press{" "}
                    <strong>Apply</strong> — your licence applications will appear here with live
                    status.
                  </p>
                </CardContent>
              </Card>
            ) : (
              apps.map((app) => (
                <Card key={app.id} className="card-shadow">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{app.product_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{app.application_number}</span> · {app.is_number}{" "}
                        · {app.standard_title}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={app.status} />
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(app.submitted_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            <div className="text-right">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/applications">
                  Open full applications workspace <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}

