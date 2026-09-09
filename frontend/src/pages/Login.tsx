import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Factory, KeyRound, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/services/api";
import type { Role } from "@/types/api";

const DEMO_ACCOUNTS: { label: string; email: string; password: string; role: Role }[] = [
  { label: "Consumer", email: "consumer@bis.ai", password: "consumer123", role: "consumer" },
  { label: "MSME", email: "msme@bis.ai", password: "msme123", role: "msme" },
  { label: "Admin", email: "admin@bis.ai", password: "admin123", role: "admin" },
];

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("consumer");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        if (name.trim().length < 2) {
          setError("Please enter your full name.");
          setBusy(false);
          return;
        }
        await signUp({ name: name.trim(), email, password, role });
      }
      toast.toast("success", mode === "login" ? "Welcome back!" : "Account created", "Redirecting…");
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [mode, email, password, name, role, signIn, signUp, navigate, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-bis-100 p-6"
    >
      <Card className="w-full max-w-md card-shadow-lg">
        <CardHeader className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <CardTitle className="text-xl">BIS AI Standards Assistant</CardTitle>
          <CardDescription>भारत सरकार · Government of India — demo sandbox sign-in</CardDescription>
        </CardHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v === "register" ? "register" : "login");
            setError(null);
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Sign in</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Create account</TabsTrigger>
          </TabsList>
<TabsContent value="login" className="px-4">
            <CardContent className="grid gap-3">
              <Label htmlFor="li-email">Email</Label>
              <Input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" autoComplete="email" />

              <Label htmlFor="li-pass">Password</Label>
              <Input id="li-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" autoComplete="current-password" />

              {error && <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">{error}</p>}

              <Button onClick={submit} disabled={busy} className="w-full">
                <LogIn className="h-4 w-4" /> {busy ? "Signing in…" : "Sign in"}
              </Button>

              <div className="mt-1 rounded-lg bg-muted/50 p-3 text-[11px]">
                <p className="font-bold uppercase text-muted-foreground">Demo accounts — one click</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      className="rounded-full border border-border bg-card px-2.5 py-1 font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.password);
                      }}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="register" className="px-4">
            <CardContent className="grid gap-3">
              <Label htmlFor="rg-name">Full name</Label>
              <Input id="rg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" className="mt-1" />

              <Label htmlFor="rg-email">Email</Label>
              <Input id="rg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1" />

              <Label htmlFor="rg-pass">Password (min 6 chars)</Label>
              <Input id="rg-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" autoComplete="new-password" />

              <Label>I am a</Label>
              <div className="flex gap-2">
                {[
                  { value: "consumer", label: "Consumer", icon: UserRound },
                  { value: "msme", label: "MSME / Manufacturer", icon: Factory },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors",
                        role === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      )}
                      onClick={() => setRole(opt.value as Role)}
                    >
                      <Icon className="h-5 w-5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {error && <p className="rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">{error}</p>}

              <Button onClick={submit} disabled={busy} className="w-full">
                <KeyRound className="h-4 w-4" /> {busy ? "Creating…" : "Create account"}
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          This is a hackathon sandbox. Demo data only — see README for the run guide.
        </p>
      </Card>
    </motion.div>
  );
}