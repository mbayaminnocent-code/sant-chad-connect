import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { PatientJourneyProvider } from "@/contexts/PatientJourneyContext";
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
import Planning from "@/pages/modules/Planning";
import Services from "@/pages/modules/Services";
import IAMarate from "@/pages/modules/IAMarate";
import PatientsList from "@/pages/modules/PatientsList";
import MinistryDashboard from "@/pages/modules/MinistryDashboard";
import EspaceMedecin from "@/pages/modules/EspaceMedecin";
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
              <Route path="/" element={
                <Navigate to={
                  role === 'minister' ? '/ministere' :
                  role === 'doctor' ? '/espace-medecin' :
                  '/accueil'
                } replace />
              } />
              {/* Doctor-restricted routes */}
              <Route path="/espace-medecin" element={role === 'doctor' ? <EspaceMedecin /> : <AccessDenied />} />
              <Route path="/dpi" element={role === 'doctor' ? <DPI /> : <AccessDenied />} />
              <Route path="/bloc-operatoire" element={['doctor', 'director'].includes(role) ? <BlocOperatoire /> : <AccessDenied />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/ia" element={<IAMarate />} />
              
              {/* Non-doctor routes (doctors cannot access) */}
              <Route path="/accueil" element={role !== 'doctor' ? <Accueil /> : <Navigate to="/espace-medecin" replace />} />
              <Route path="/triage" element={role !== 'doctor' ? <Triage /> : <AccessDenied msg="Le triage est géré par les infirmiers." />} />
              <Route path="/laboratoire" element={role !== 'doctor' ? <Laboratoire /> : <AccessDenied msg="Le laboratoire est géré par les techniciens de labo." />} />
              <Route path="/imagerie" element={role !== 'doctor' ? <Imagerie /> : <AccessDenied msg="L'imagerie est gérée par les techniciens d'imagerie." />} />
              <Route path="/pharmacie" element={role !== 'doctor' ? <Pharmacie /> : <AccessDenied msg="La pharmacie est gérée par les pharmaciens." />} />
              <Route path="/facturation" element={['reception', 'director'].includes(role) ? <Facturation /> : <AccessDenied />} />
              <Route path="/hospitalisations" element={role !== 'doctor' ? <Hospitalisations /> : <AccessDenied />} />
              <Route path="/services" element={role !== 'doctor' ? <Services /> : <AccessDenied />} />
              <Route path="/dashboard-directeur" element={role === 'director' ? <MinistryDashboard /> : <AccessDenied />} />
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

const AccessDenied = ({ msg }: { msg?: string }) => (
  <div className="flex items-center justify-center h-full p-12">
    <div className="text-center space-y-2">
      <p className="text-4xl">🔒</p>
      <h2 className="text-xl font-bold text-foreground">Accès Restreint</h2>
      <p className="text-sm text-muted-foreground">{msg || "Vous n'avez pas les droits pour accéder à ce module."}</p>
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
          <PatientJourneyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/*" element={<AuthGate />} />
            </Routes>
          </BrowserRouter>
          </PatientJourneyProvider>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
