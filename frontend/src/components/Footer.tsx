import { Link } from "react-router-dom";
import { Phone, Globe, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="tricolor-bar" />
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4.5 w-4.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-xs font-bold text-foreground">Bureau of Indian Standards</span>
              <span className="block text-[10px] text-muted-foreground">
                
                Ministry of Consumer Affairs, Food & Public Distribution
              </span>
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span>
              Helpline: <span className="font-semibold text-foreground">1800-11-1333</span>
              <span className="block text-[10px]">(Toll Free)</span>
            </span>
          </div>
          <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Website:
              <a href="https://www.bis.gov.in" target="_blank" rel="noreferrer" className="font-medium text-govt-blue hover:underline">
                www.bis.gov.in
              </a>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              🇮🇳 Made in India
            </span>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Smart India Hackathon demo · indicative seed data, not legal advice · verify at the official
          portal. Built with React · FastAPI · Gemini · © 2026
        </p>
        <ul className="mt-2 flex justify-center gap-3 text-[10px] text-muted-foreground">
          {[
            { to: "/chat", label: "Ask the AI assistant" },
            { to: "/scanner", label: "Scan a product" },
            { to: "/standards", label: "Browse standards" },
            { to: "/msme", label: "MSME schemes & tools" },
          ].map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="hover:text-primary">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}