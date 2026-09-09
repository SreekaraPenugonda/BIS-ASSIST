import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { api, clearAuth, getErrorMessage, loadStoredUser, storeAuth } from "@/services/api";
import type { Role, TokenResponse, User } from "@/types/api";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const STORED = loadStoredUser<User>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(STORED);
  const [token, setToken] = useState<string | null>(localStorage.getItem("bis_token"));

  const applyAuth = useCallback((t: TokenResponse) => {
    storeAuth(t.access_token, t.user);
    setToken(t.access_token);
    setUser(t.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<TokenResponse>("/api/auth/login", { email, password });
      applyAuth(data);
    },
    [applyAuth]
  );

  const signUp = useCallback(
    async (payload: RegisterPayload) => {
      const { data } = await api.post<TokenResponse>("/api/auth/register", payload);
      applyAuth(data);
    },
    [applyAuth]
  );

  const signOut = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get<User>("/api/auth/me");
      setUser(data);
      storeAuth(token, data);
    } catch (error) {
      if (String(getErrorMessage(error)).includes("401") || getErrorMessage(error).includes("Not authenticated")) {
        clearAuth();
        setToken(null);
        setUser(null);
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null && token !== null,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}