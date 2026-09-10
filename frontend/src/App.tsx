import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/context/AuthContext";
import { UserModeProvider } from "@/context/UserModeContext";
import { AppLayout } from "@/components/AppLayout";
const HomePage = lazy(() => import("@/pages/Home").then((m) => ({ default: m.HomePage })));
const ConsumerPage = lazy(() => import("@/pages/Consumer").then((m) => ({ default: m.ConsumerPage })));
const MSMEPage = lazy(() => import("@/pages/MSME").then((m) => ({ default: m.MSMEPage })));
const ChatPage = lazy(() => import("@/pages/Chat").then((m) => ({ default: m.ChatPage })));
const ScannerPage = lazy(() => import("@/pages/Scanner").then((m) => ({ default: m.ScannerPage })));
const StandardsPage = lazy(() => import("@/pages/Standards").then((m) => ({ default: m.StandardsPage })));
const ApplicationsPage = lazy(() => import("@/pages/Applications").then((m) => ({ default: m.ApplicationsPage })));
const AdminPage = lazy(() => import("@/pages/Admin").then((m) => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import("@/pages/Login").then((m) => ({ default: m.LoginPage })));
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { SplashScreen } from "@/components/SplashScreen";

export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
        <AuthProvider>
          <UserModeProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="route-loading" role="status">Loading BIS Assist…</div>}>
              <Routes>
                <Route path="/admin/login" element={<LoginPage adminOnly />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route element={<AppLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="consumer" element={<ConsumerPage />} />
                  <Route path="msme" element={<MSMEPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="scanner" element={<ScannerPage />} />
                  <Route path="standards" element={<StandardsPage />} />
                  <Route path="applications" element={<ApplicationsPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
              </Suspense>
            </BrowserRouter>
            <PwaInstallPrompt />
          </UserModeProvider>
        </AuthProvider>
      </ToastProvider>
      <SplashScreen />
    </TooltipProvider>
  );
}
