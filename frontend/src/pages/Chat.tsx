import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUp, Bot, CircleStop, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ComplianceCard } from "@/components/ComplianceCard";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { renderMarkdown } from "@/lib/markdown";
import { useChat } from "@/hooks/useChat";
import { useUserMode } from "@/context/UserModeContext";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/api";

const SUGGESTIONS = {
  en: ["Which IS applies to my electric kettle?", "How does BIS certification work?", "What are the main requirements of IS 10500 drinking water?", "What standards cover LED bulbs?"],
  hi: ["मेरी इलेक्ट्रिक केतली पर कौन सा IS लागू होता है?", "BIS प्रमाणन कैसे काम करता है?", "IS 10500 में पीने के पानी की मुख्य आवश्यकताएँ क्या हैं?", "LED बल्ब के लिए कौन से मानक हैं?"],
  te: ["నా ఎలక్ట్రిక్ కెటిల్‌కు ఏ IS వర్తిస్తుంది?", "BIS ధృవీకరణ ఎలా పనిచేస్తుంది?", "IS 10500లో తాగునీటి ప్రధాన అవసరాలు ఏమిటి?", "LED బల్బులకు ఏ ప్రమాణాలు వర్తిస్తాయి?"],
} as const;

const CHAT_COPY = {
  en: { title: "Ask AI — BIS Standards Assistant", idle: "RAG retrieval + Gemini · citations included", thinking: "Thinking…", newChat: "New chat", heading: "Ask anything about Indian Standards", intro: "Product compliance, certification process, standard requirements, safety guidance — answered with source-grounded citations in English, हिंदी or తెలుగు.", assistant: "Assistant", loading: "Retrieving knowledge base…", searching: "Searching standards & documents", stop: "Stop", send: "Send", disclaimer: "Answers are indicative and cite their sources. Certification claims must always be verified on bis.gov.in." },
  hi: { title: "पूछें AI — BIS मानक सहायक", idle: "RAG खोज + Gemini · स्रोत सहित उत्तर", thinking: "सोच रहा है…", newChat: "नई बातचीत", heading: "भारतीय मानकों के बारे में पूछें", intro: "उत्पाद अनुपालन, प्रमाणन प्रक्रिया, मानक आवश्यकताएँ और सुरक्षा मार्गदर्शन — स्रोतों के साथ हिंदी में उत्तर।", assistant: "सहायक", loading: "ज्ञान आधार खोजा जा रहा है…", searching: "मानक और दस्तावेज़ खोजे जा रहे हैं", stop: "रोकें", send: "भेजें", disclaimer: "उत्तर संकेतात्मक हैं और स्रोत देते हैं। प्रमाणन दावों को bis.gov.in पर अवश्य सत्यापित करें।" },
  te: { title: "AIని అడగండి — BIS ప్రమాణాల సహాయకుడు", idle: "RAG శోధన + Gemini · మూలాలతో సమాధానాలు", thinking: "ఆలోచిస్తోంది…", newChat: "కొత్త చాట్", heading: "భారతీయ ప్రమాణాల గురించి అడగండి", intro: "ఉత్పత్తి అనుగుణత, ధృవీకరణ ప్రక్రియ, ప్రమాణ అవసరాలు మరియు భద్రత మార్గదర్శకం — మూలాలతో తెలుగులో సమాధానాలు.", assistant: "సహాయకుడు", loading: "జ్ఞాన ఆధారాన్ని శోధిస్తోంది…", searching: "ప్రమాణాలు మరియు పత్రాలను శోధిస్తోంది", stop: "ఆపండి", send: "పంపండి", disclaimer: "సమాధానాలు సూచనాత్మకమైనవి మరియు మూలాలను చూపిస్తాయి. ధృవీకరణ వివరాలను bis.gov.inలో తప్పనిసరిగా తనిఖీ చేయండి." },
} as const;

const LANG_LABELS: Record<Language, string> = { en: "EN", hi: "हि", te: "తె" };

export function ChatPage() {
  const { messages, streaming, error, send, reset } = useChat();
  const { language, setLanguage } = useUserMode();
  const copy = CHAT_COPY[language];
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const lang = params.get("lang");
    if (lang === "hi" || lang === "te") setLanguage(lang);
    if (q && !sentRef.current) {
      sentRef.current = true;
      void send(q);
    }
  }, [location.search, send, setLanguage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    void send(text);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[540px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-foreground">{copy.title}</h1>
          <p className="text-[11px] text-muted-foreground">
            {streaming ? copy.thinking : copy.idle}
          </p>
        </div>
        <Badge variant={localStorage.getItem("bis_mode") === "ai" ? "success" : "warning"} className="ml-auto">
          {localStorage.getItem("bis_mode") === "ai" ? "Gemini live" : "Simulation mode"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RefreshCw className="h-3.5 w-3.5" /> {copy.newChat}
        </Button>
      </div>
<div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-lg rounded-xl border border-dashed border-primary/30 bg-background/70 p-4 text-center"
            >
              <Sparkles className="mx-auto h-6 w-6 text-saffron" />
              <h2 className="mt-1.5 text-sm font-bold text-foreground">{copy.heading}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.intro}</p>
            </motion.div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS[language].map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  onClick={() => void send(s)}
                  disabled={streaming}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "self-end rounded-tr-none bg-secondary/10 text-foreground"
                : "self-start rounded-tl-none border bg-background/80 text-foreground"
            )}
          >
            {msg.role === "assistant" && (
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{copy.assistant}</span>
              </div>
            )}
            {msg.content ? (
              <div>{renderMarkdown(msg.content)}</div>
            ) : (
              <LoadingAnimation
                label={copy.loading}
                sublabel={copy.searching}
                className="!py-3"
              />
            )}
            {msg.streaming && msg.content && (
              <span className="mt-1 inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn("h-1.5 w-1.5 animate-bounce rounded-full bg-primary")}
                    style={{ animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </span>
            )}
            {msg.meta && <ComplianceCard meta={msg.meta} className="mt-2.5" />}
          </motion.div>
        ))}

        {error && (
          <div className="self-center rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs font-medium text-destructive">
            {error} — check that the backend is running on http://localhost:8000
          </div>
        )}
      </div>
<div className="flex flex-col gap-2 border-t px-4 py-3 md:px-6">
        <div className="flex overflow-hidden rounded-lg border bg-muted/50">
          {(["en", "hi", "te"] as Language[]).map((code) => (
            <button
              key={code}
              className={cn(
                "flex-1 px-2.5 py-1.5 text-xs font-semibold transition-colors",
                language === code ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setLanguage(code)}
            >
              {LANG_LABELS[code]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              language === "hi"
                ? "अपना प्रश्न हिंदी में पूछें…"
                : language === "te"
                  ? "మీ ప్రశ్న తెలుగులో అడగండి…"
                  : "Type your question…"
            }
            className="h-10 flex-1 rounded-lg border-primary/25 bg-background/80 text-sm"
            disabled={streaming}
            aria-label="Message"
          />
          {streaming ? (
            <Button variant="destructive" size="icon" onClick={reset} aria-label={copy.stop}>
              <CircleStop className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={submit} disabled={!draft.trim()} aria-label={copy.send}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {copy.disclaimer}
        </p>
      </div>
    </div>
  );
}