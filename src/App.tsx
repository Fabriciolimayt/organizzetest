import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TourProvider } from "@/components/tour/TourProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OnboardingNome from "./pages/OnboardingNome";
import OnboardingIdioma from "./pages/OnboardingIdioma";
import OnboardingMoeda from "./pages/OnboardingMoeda";
import OnboardingWhatsApp from "./pages/OnboardingWhatsApp";
import OnboardingWhatsAppVerificar from "./pages/OnboardingWhatsAppVerificar";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import DashboardLancamentos from "./pages/DashboardLancamentos";
import DashboardRelatorios from "./pages/DashboardRelatorios";
import DashboardLimiteGastos from "./pages/DashboardLimiteGastos";
import DashboardOrcamento from "./pages/DashboardOrcamento";
import DashboardPlanos from "./pages/DashboardPlanos";
import DashboardGrupos from "./pages/DashboardGrupos";
import DashboardWhatsApp from "./pages/DashboardWhatsApp";
import DashboardDiagnosticoWhatsApp from "./pages/DashboardDiagnosticoWhatsApp";

import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: JSX.Element }) => <ProtectedRoute>{children}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TourProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<Navigate to="/auth" replace />} />
            <Route path="/onboarding/nome" element={<Protected><OnboardingNome /></Protected>} />
            <Route path="/onboarding/idioma" element={<Protected><OnboardingIdioma /></Protected>} />
            <Route path="/onboarding/moeda" element={<Protected><OnboardingMoeda /></Protected>} />
            <Route path="/onboarding/whatsapp" element={<Protected><OnboardingWhatsApp /></Protected>} />
            <Route path="/onboarding/whatsapp/verificar" element={<Protected><OnboardingWhatsAppVerificar /></Protected>} />
            <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
              <Route index element={<Dashboard />} />
              <Route path="lancamentos" element={<DashboardLancamentos />} />
              <Route path="relatorios" element={<DashboardRelatorios />} />
              <Route path="limite-de-gastos" element={<DashboardLimiteGastos />} />
              <Route path="orcamento" element={<DashboardOrcamento />} />
              <Route path="planos" element={<DashboardPlanos />} />
              <Route path="grupos" element={<DashboardGrupos />} />
              <Route path="whatsapp" element={<DashboardWhatsApp />} />
              <Route path="diagnostico-whatsapp" element={<DashboardDiagnosticoWhatsApp />} />

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </TourProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
