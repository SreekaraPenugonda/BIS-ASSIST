import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  if (!visible || !installEvent) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-primary/20 bg-card p-3 shadow-2xl" role="status">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Download className="h-4 w-4" /></span>
      <p className="min-w-0 flex-1 text-xs font-medium text-foreground">Install BIS Assist for faster access and limited offline support.</p>
      <button
        type="button"
        className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
        onClick={async () => {
          await installEvent.prompt();
          setVisible(false);
          setInstallEvent(null);
        }}
      >
        Install
      </button>
      <button type="button" aria-label="Dismiss install prompt" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" onClick={() => setVisible(false)}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}