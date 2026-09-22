import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { TourProvider } from "@/components/tour/TourProvider";
import PublicHome from "./pages/PublicHome";
import Auth from "./pages/Auth";
import OnboardingNome from "./pages/OnboardingNome";
import OnboardingIdioma from "./pages/OnboardingIdioma";
import OnboardingMoeda from "./pages/OnboardingMoeda";
import OnboardingWhatsApp from "./pages/OnboardingWhatsApp";
import OnboardingWhatsAppVerificar from "./pages/OnboardingWhatsAppVerificar";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import AcceptInvitation from "./pages/AcceptInvitation";

import OAuthConsent from "./pages/OAuthConsent";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardLancamentos = lazy(() => import("./pages/DashboardLancamentos"));
const DashboardRelatorios = lazy(() => import("./pages/DashboardRelatorios"));
const DashboardLimiteGastos = lazy(() => import("./pages/DashboardLimiteGastos"));
const DashboardOrcamento = lazy(() => import("./pages/DashboardOrcamento"));
const DashboardPlanos = lazy(() => import("./pages/DashboardPlanos"));
const DashboardObjetivos = lazy(() => import("./pages/DashboardObjetivos"));
const DashboardGrupos = lazy(() => import("./pages/DashboardGrupos"));
const DashboardWhatsApp = lazy(() => import("./pages/DashboardWhatsApp"));
const DashboardDiagnosticoWhatsApp = lazy(() => import("./pages/DashboardDiagnosticoWhatsApp"));
const DashboardAssinatura = lazy(() => import("./pages/DashboardAssinatura"));

const queryClient = new QueryClient();
const PrimitiveShowcase = import.meta.env.DEV
  ? lazy(() => import("@/components/design-system/PrimitiveShowcase"))
  : null;

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
            {import.meta.env.DEV && PrimitiveShowcase && (
              <Route
                path="/__design-system"
                element={
                  <Suspense fallback={null}>
                    <PrimitiveShowcase />
                  </Suspense>
                }
              />
            )}
            <Route path="/" element={<PublicHome />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/auth" element={<Auth key="login" />} />
            <Route path="/signup" element={<Auth key="signup" initialMode="signup" />} />
            <Route path="/convite" element={<AcceptInvitation />} />
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
              <Route path="objetivos" element={<DashboardObjetivos />} />
              <Route path="grupos" element={<DashboardGrupos />} />
              <Route path="whatsapp" element={<DashboardWhatsApp />} />
              <Route path="diagnostico-whatsapp" element={<DashboardDiagnosticoWhatsApp />} />
              <Route path="assinatura" element={<DashboardAssinatura />} />

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
