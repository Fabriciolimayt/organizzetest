import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import OnboardingNome from "./pages/OnboardingNome";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding/nome" element={<OnboardingNome />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="lancamentos" element={<DashboardLancamentos />} />
            <Route path="relatorios" element={<DashboardRelatorios />} />
            <Route path="limite-de-gastos" element={<DashboardLimiteGastos />} />
            <Route path="orcamento" element={<DashboardOrcamento />} />
            <Route path="planos" element={<DashboardPlanos />} />
            <Route path="grupos" element={<DashboardGrupos />} />
            <Route path="whatsapp" element={<DashboardWhatsApp />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
