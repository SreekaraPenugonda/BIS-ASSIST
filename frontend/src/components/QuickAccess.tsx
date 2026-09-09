import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BookOpenText, Bot, FolderKanban, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/chat", label: "Ask AI", hint: "Chat with the assistant", icon: Bot, accent: "bg-secondary/10 text-secondary" },
  { to: "/scanner", label: "Scan Product", hint: "Upload a label photo", icon: ScanLine, accent: "bg-saffron/15 text-saffron" },
  { to: "/standards", label: "Search Standards", hint: "Browse by category", icon: BookOpenText, accent: "bg-success/10 text-success" },
  { to: "/applications", label: "Track Application", hint: "MSME licence tracker", icon: FolderKanban, accent: "bg-primary/10 text-primary" },
];

export function QuickAccess() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ITEMS.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link
              to={item.to}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center card-shadow transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <span className={cn("grid h-10 w-10 place-items-center rounded-xl", item.accent)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
              <span className="text-[10px] text-muted-foreground">{item.hint}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}