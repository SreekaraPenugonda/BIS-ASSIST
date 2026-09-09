import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/context/AuthContext";
import { UserModeProvider } from "@/context/UserModeContext";
import { AppLayout } from "@/components/AppLayout";
import { HomePage } from "@/pages/Home";
import { ConsumerPage } from "@/pages/Consumer";
import { MSMEPage } from "@/pages/MSME";
import { ChatPage } from "@/pages/Chat";
import { ScannerPage } from "@/pages/Scanner";
import { StandardsPage } from "@/pages/Standards";
import { ApplicationsPage } from "@/pages/Applications";
import { AdminPage } from "@/pages/Admin";
import { LoginPage } from "@/pages/Login";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { SplashScreen } from "@/components/SplashScreen";

export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider>
        <AuthProvider>
          <UserModeProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
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
            </BrowserRouter>
            <PwaInstallPrompt />
          </UserModeProvider>
        </AuthProvider>
      </ToastProvider>
      <SplashScreen />
    </TooltipProvider>
  );
}
