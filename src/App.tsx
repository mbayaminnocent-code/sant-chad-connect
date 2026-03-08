import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import Login from "@/pages/Login";
import Accueil from "@/pages/modules/Accueil";
import Triage from "@/pages/modules/Triage";
import DPI from "@/pages/modules/DPI";
import Laboratoire from "@/pages/modules/Laboratoire";
import Imagerie from "@/pages/modules/Imagerie";
import Pharmacie from "@/pages/modules/Pharmacie";
import Facturation from "@/pages/modules/Facturation";
import Hospitalisations from "@/pages/modules/Hospitalisations";
import BlocOperatoire from "@/pages/modules/BlocOperatoire";
import Services from "@/pages/modules/Services";
import IAMarate from "@/pages/modules/IAMarate";
import PatientsList from "@/pages/modules/PatientsList";
import MinistryDashboard from "@/pages/modules/MinistryDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const { role } = useAuth();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Navigate to={role === 'minister' ? '/ministere' : '/accueil'} replace />} />
              <Route path="/accueil" element={<Accueil />} />
              <Route path="/triage" element={<Triage />} />
              <Route path="/dpi" element={role === 'doctor' ? <DPI /> : <AccessDenied />} />
              <Route path="/laboratoire" element={<Laboratoire />} />
              <Route path="/imagerie" element={<Imagerie />} />
              <Route path="/pharmacie" element={<Pharmacie />} />
              <Route path="/facturation" element={<Facturation />} />
              <Route path="/hospitalisations" element={<Hospitalisations />} />
              <Route path="/bloc-operatoire" element={<BlocOperatoire />} />
              <Route path="/services" element={<Services />} />
              <Route path="/ia" element={<IAMarate />} />
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/dashboard-directeur" element={<MinistryDashboard />} />
              <Route path="/ministere" element={<MinistryDashboard />} />
              <Route path="/ministere/*" element={<MinistryDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const AccessDenied = () => (
  <div className="flex items-center justify-center h-full p-12">
    <div className="text-center space-y-2">
      <p className="text-4xl">🔒</p>
      <h2 className="text-xl font-bold text-foreground">Accès Restreint aux Médecins</h2>
      <p className="text-sm text-muted-foreground">Le Dossier Patient Informatisé est accessible uniquement avec une authentification médicale.</p>
    </div>
  </div>
);

const AuthGate = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout /> : <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<AuthGate />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
