import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Database,
  FileStack,
  Gauge,
  HardDrive,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  Server,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { getAdminStats, reindexKnowledgeBase } from "@/services/adminApi";
import { getErrorMessage } from "@/services/api";
import { StatusBadge, statusVariant } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { AdminStats } from "@/types/api";

export function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  const isAdmin = isAuthenticated && user?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await getAdminStats());
    } catch (err) {
      toast("error", "Could not load statistics", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) void load();
    else setLoading(false);
  }, [isAdmin, load]);

  const rebuild = useCallback(async () => {
    setReindexing(true);
    try {
      const res = await reindexKnowledgeBase();
      toast(
        "success",
        "RAG index rebuilt",
        `${res.total_indexed} chunks indexed · mode: ${res.mode}`
      );
      await load();
    } catch (err) {
      toast("error", "Reindex failed", getErrorMessage(err));
    } finally {
      setReindexing(false);
    }
  }, [load, toast]);

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md card-shadow-lg">
        <CardHeader className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <LockKeyhole className="h-7 w-7" />
          </span>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            Sign in with an administrator account to view platform statistics and manage the RAG
            index.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Button asChild>
            <Link to="/login">Go to sign in</Link>
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Demo admin · <code className="kbd">admin@bis.ai</code> / <code className="kbd">admin123</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy to-bis-600 p-6 text-white card-shadow-lg">
        <div className="hero-grid absolute inset-0" aria-hidden />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold ring-1 ring-white/20">
          <Gauge className="h-3.5 w-3.5 text-saffron" /> Admin · Platform telemetry
        </span>
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight">Operations console</h1>
        <p className="relative mt-2 max-w-2xl text-sm text-white/85">
          Live counts, AI activity and RAG health for the BIS Assist sandbox.
        </p>
      </section>

      {/* loading skeleton */}
      {loading || !stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* counts */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat icon={Users} tint="bg-primary/10 text-primary" label="Registered users" value={stats.counts.users} />
            <MiniStat icon={FileStack} tint="bg-secondary/10 text-secondary" label="Indian Standards" value={stats.counts.standards} />
            <MiniStat icon={Database} tint="bg-india-green/10 text-india-green" label="Documents · chunks" value={stats.counts.documents} sub={`+${stats.counts.chunks} chunks`} />
            <MiniStat icon={Gauge} tint="bg-saffron/15 text-saffron" label="Applications" value={stats.counts.applications} />
          </div>
_ADMIN_DASHBOARD_
          {/* application status breakdown */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Applications by status
            </span>
            {Object.entries(stats.applications_by_status).length === 0 ? (
              <span className="text-xs text-muted-foreground">none yet</span>
            ) : (
              Object.entries(stats.applications_by_status).map(([status, count]) => (
                <Badge key={status} variant={statusVariant(status)}>
                  {status} · {count}
                </Badge>
              ))
            )}
          </div>

          {/* activity + RAG/system */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" /> AI activity
                </CardTitle>
                <CardDescription>Live counters since server start.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <ActivityCell label="Queries today" value={stats.activity.queries_today} />
                  <ActivityCell label="Queries total" value={stats.activity.queries_total} />
                  <ActivityCell label="Scans today" value={stats.activity.scans_today} />
                  <ActivityCell label="Scans total" value={stats.activity.scans_total} />
                  <ActivityCell label="Applications" value={stats.activity.applications} />
                  <ActivityCell label="Logins" value={stats.activity.logins} />
                </div>
                <Separator />
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" /> Recent queries
                  </p>
                  {stats.activity.recent_queries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No queries logged yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {stats.activity.recent_queries.slice(0, 5).map((q, idx) => (
                        <li key={`${q.ts}-${idx}`} className="flex items-center gap-2 text-xs">
                          <StatusBadge status={q.status} />
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {q.message}
                          </span>
                          <Badge variant="muted">{q.mode}</Badge>
                          <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                            {new Date(q.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ScanLine className="h-3.5 w-3.5" /> Recent scans
                  </p>
                  {stats.activity.recent_scans.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No scans logged yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {stats.activity.recent_scans.slice(0, 5).map((s, idx) => (
                        <li key={`${s.ts}-${idx}`} className="flex items-center gap-2 text-xs">
                          <StatusBadge status={s.status} />
                          <span className="min-w-0 flex-1 truncate text-muted-foreground">
                            {s.filename}
                          </span>
                          <Badge variant="muted">{s.mode}</Badge>
                          <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                            {new Date(s.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* RAG & system health */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-4 w-4 text-primary" /> RAG &amp; system health
                </CardTitle>
                <CardDescription>Knowledge index status and runtime configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Database className="h-4 w-4" /> Knowledge entries
                  </span>
                  <span className="font-semibold tabular-nums">{stats.rag.entries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Bot className="h-4 w-4" /> Embedding mode
                  </span>
                  <Badge variant={stats.rag.uses_gemini ? "success" : "muted"}>
                    {stats.rag.uses_gemini ? "Gemini embeddings" : "Local hash (demo)"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="h-4 w-4" /> Gemini API key
                  </span>
                  <Badge variant={stats.rag.configured ? "success" : "warning"}>
                    {stats.rag.configured ? "Configured" : "Not configured"}
                  </Badge>
                </div>
                <Separator />
                <SysRow icon={Server} label="Environment" value={stats.system.environment} />
                <SysRow icon={HardDrive} label="Database" value={stats.system.database} />
                <SysRow icon={Bot} label="Gemini model" value={stats.system.gemini_model} />
                <Button
                  className="mt-1 w-full"
                  variant="outline"
                  disabled={reindexing}
                  onClick={() => void rebuild()}
                >
                  <RefreshCw className={cn("h-4 w-4", reindexing && "animate-spin")} />
                  {reindexing ? "Rebuilding index…" : "Rebuild RAG index"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  tint,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  tint: string;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card className="card-shadow">
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", tint)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-extrabold leading-none tabular-nums">
            {value.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
            {sub ? `${label} · ${sub}` : label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-lg font-extrabold leading-none tabular-nums">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SysRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Server;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="max-w-[60%] truncate font-medium">{value}</span>
    </div>
  );
}