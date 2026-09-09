import { Link } from "react-router-dom";
import { Bot, CheckCircle2, LogIn, Menu, ShieldCheck } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUserMode } from "@/context/UserModeContext";
import type { Language } from "@/types/api";
import { GovtBrand } from "@/components/GovtBrand";

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हि" },
  { code: "te", label: "తె" },
];

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const { language, setLanguage, setOpen, isOpen } = useUserMode();

  const languageControls = (
    <div className="flex overflow-hidden rounded-lg border bg-muted/50">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          className={cn(
            "px-2.5 py-1.5 text-xs font-semibold transition-colors",
            language === lang.code
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setLanguage(lang.code)}
          aria-pressed={language === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="tricolor-bar" />
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <button
          className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open menu"
          onClick={() => setOpen(!isOpen)}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Home">
          <GovtBrand />
        </Link>

        <div className="flex-1" />

        <Link
          to="/chat"
          className="hidden items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary transition-colors hover:bg-secondary/20 sm:inline-flex"
        >
          <Bot className="h-3.5 w-3.5" />
          Ask AI
        </Link>

        <div className="hidden md:flex">{languageControls}</div>

        {isAuthenticated && user ? (
          <Link
            to="/applications"
            className="flex items-center gap-2 rounded-full border border-border py-1 pl-2 pr-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="grid h-6.5 w-6.5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {initials(user.name)}
            </span>
            <span className="max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </Link>
        )}
      </div>
      <div className="flex h-2 items-center px-4 sm:px-6">
        <div className="flex gap-3 md:hidden">{languageControls}</div>
      </div>
      <div className="hidden items-center justify-center gap-2 border-t bg-success/[0.04] px-4 py-1.5 text-[10px] font-medium text-success sm:flex">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        BIS Assist is ready · secure guidance · sources included · verify final certification on bis.gov.in
      </div>
    </header>
  );
}