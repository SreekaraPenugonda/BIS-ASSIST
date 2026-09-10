import { Link, useLocation } from "react-router-dom";
import {
  BookOpenText,
  Bot,
  Factory,
  FolderKanban,
  Home,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUserMode } from "@/context/UserModeContext";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const PUBLIC_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/chat", label: "Ask AI", icon: Bot },
  { to: "/scanner", label: "Scan Product", icon: ScanLine },
  { to: "/standards", label: "Standards", icon: BookOpenText },
  { to: "/msme", label: "MSME Guidance", icon: Factory },
  { to: "/applications", label: "Applications", icon: FolderKanban },
];

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { setOpen } = useUserMode();

  const isActive = (nav: NavItem) =>
    nav.end ? pathname === nav.to : pathname.startsWith(nav.to);

  const itemClass = (active: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  const iconClass = (active: boolean) =>
    cn("h-[18px] w-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground");

  return (
    <aside className={cn("flex h-full w-full flex-col overflow-y-auto bg-card", mobile && "h-screen")}>
      <div className="border-b p-3">
        <Link to="/" onClick={() => setOpen(false)} aria-label="BIS Assist home">
          <span className="flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-secondary to-navy p-3 text-left text-white">
            <img src="/Bureau_of_Indian_Standards_Logo.svg" alt="Bureau of Indian Standards logo" className="h-10 w-14 shrink-0 rounded bg-white/95 object-contain p-1" />
            <span className="min-w-0 text-left">
              <span className="block text-sm font-bold leading-tight">BIS Assist</span>
              <span className="block text-[10px] opacity-80">भारत सरकार · Government of India</span>
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">BIS AI Assistant</p>
        {PUBLIC_NAV.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={itemClass(active)} onClick={() => setOpen(false)}>
              <Icon className={iconClass(active)} />
              {item.label}
            </Link>
          );
        })}

      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2 text-[11px]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-bis-500" />
          <span className="font-medium text-muted-foreground">
            {systemStatus()} · RAG ready
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Demo · not legal advice · v1.0.0
        </p>
      </div>
    </aside>
  );
}

function systemStatus(): string {
  return localStorage.getItem("bis_mode") === "ai" ? "Gemini AI live" : "Simulation mode";
}