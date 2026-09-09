import { motion, AnimatePresence } from "motion/react";
import { BookOpenCheck, Clock3, ScanLine, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { useUserMode, type ActivityItem } from "@/context/UserModeContext";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<ActivityItem["kind"], typeof Clock3> = {
  chat: Clock3,
  scan: ScanLine,
  standard: BookOpenCheck,
  application: ScanLine,
};

const DEMO_ACTIVITY: ActivityItem[] = [
  {
    id: "demo-1",
    title: "Which IS applies to an electric kettle?",
    detail: "Asked the AI assistant",
    kind: "chat",
    status: "Answered",
    ts: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "demo-2",
    title: "electric_kettle_label.png",
    detail: "Product scan · Electric Kettle",
    kind: "scan",
    status: "VERIFICATION_REQUIRED",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "demo-3",
    title: "IS 10500 — Drinking Water",
    detail: "Browsed standards · Food, Water & Packaging",
    kind: "standard",
    status: "CURRENT",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export function RecentActivity() {
  const { recentActivity, clearActivity } = useUserMode();
  const items = recentActivity.length > 0 ? recentActivity : DEMO_ACTIVITY;

  return (
    <div className="rounded-2xl border border-border bg-card card-shadow">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
          <p className="text-[11px] text-muted-foreground">
            {recentActivity.length > 0 ? "Your latest interactions with the assistant" : "Demo entries — they update as you use the app"}
          </p>
        </div>
        {recentActivity.length > 0 && (
          <button
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            onClick={() => clearActivity()}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {items.slice(0, 5).map((item, i) => {
          const Icon = KIND_ICONS[item.kind];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={cn("flex items-center gap-3 border-t px-4 py-3")}
            >
              <span className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {item.detail} · {formatDate(item.ts)}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}