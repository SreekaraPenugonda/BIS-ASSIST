import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserMode } from "@/context/UserModeContext";

const SUGGESTIONS = [
  "Which IS applies to my electric kettle?",
  "How do I get a BIS licence?",
  "Drinking water standard IS 10500",
  "Is my LED bulb compliant?",
];

export function SearchBar() {
  const navigate = useNavigate();
  const { language } = useUserMode();
  const [query, setQuery] = useState("");

  const ask = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    if (language === "hi" && !/[अ-ह]/.test(q)) {
      const translated = translateHint(q);
      navigate(`/chat?q=${encodeURIComponent(translated)}&lang=${language}`);
    } else {
      navigate(`/chat?q=${encodeURIComponent(q)}&lang=${language}`);
    }
  }, [query, language, navigate]);

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask about any standard, product or certification…"
          className="h-10 rounded-lg border-primary/30 bg-white/95 pl-9 pr-3 text-sm shadow-sm"
          aria-label="Ask the BIS AI assistant"
        />
      </div>
      <Button onClick={ask} size="lg" className="h-10 px-5">
        <ArrowRight className="h-4 w-4" />
        Ask AI
      </Button>

      <div className="mt-1 flex flex-wrap gap-1.5">
        {SUGGESTIONS.slice(0, 3).map((s) => (
          <button
            key={s}
            className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[10px] text-white/90 transition-colors hover:bg-white/20"
            onClick={() => {
              setQuery(s);
              navigate(`/chat?q=${encodeURIComponent(s)}&lang=${language}`);
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function translateHint(q: string): string {
  // Lightweight local translation of a handful of demo phrases (offline-safe).
  const map: Record<string, string> = {
    "electric kettle": "electric kettle",
    "how do i get a bis licence": "how do i get a bis licence",
  };
  return map[q.toLowerCase()] || q;
}