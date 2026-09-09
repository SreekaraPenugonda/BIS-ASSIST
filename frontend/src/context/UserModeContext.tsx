import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "@/types/api";

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  kind: "chat" | "scan" | "standard" | "application";
  status: string;
  ts: string;
}

export type ThemeMode = "light" | "orange" | "dark";

interface UserModeState {
  language: Language;
  setLanguage: (lang: Language) => void;
  recentActivity: ActivityItem[];
  addActivity: (item: Omit<ActivityItem, "id" | "ts">) => void;
  clearActivity: () => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const UserModeContext = createContext<UserModeState | null>(null);

const ACTIVITY_KEY = "bis_recent_activity";
const LANG_KEY = "bis_language";
const THEME_KEY = "bis_theme";

function loadRecent(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    const list = raw ? (JSON.parse(raw) as ActivityItem[]) : [];
    return Array.isArray(list) ? list.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === "hi" || stored === "te" ? stored : "en";
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(loadRecent);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "orange" || stored === "dark" ? stored : "light";
  });

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(LANG_KEY, lang);
    setLanguageState(lang);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    localStorage.setItem(THEME_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setThemeState(nextTheme);
  }, []);

  const addActivity = useCallback((item: Omit<ActivityItem, "id" | "ts">) => {
    const entry: ActivityItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
    };
    const next = [entry, ...loadRecent()].slice(0, 8);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
    setRecentActivity(next);
  }, []);

  const clearActivity = useCallback(() => {
    localStorage.removeItem(ACTIVITY_KEY);
    setRecentActivity([]);
  }, []);

  return (
    <UserModeContext.Provider
      value={{
        language,
        setLanguage,
        recentActivity,
        addActivity,
        clearActivity,
        isOpen,
        setOpen: setIsOpen,
        theme,
        setTheme,
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode(): UserModeState {
  const ctx = useContext(UserModeContext);
  if (!ctx) throw new Error("useUserMode must be used inside UserModeProvider");
  return ctx;
}