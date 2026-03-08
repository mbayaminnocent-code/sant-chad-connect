import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import {
  Home, Users, FileText, FlaskConical, ScanLine, Pill, Banknote, BedDouble,
  Scissors, Brain, Stethoscope, Activity, BarChart3, Shield, HeartPulse
} from 'lucide-react';
import type { Role } from '@/data/mockData';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Accueil & Kiosque', url: '/accueil', icon: Home, roles: ['kiosk', 'reception', 'nurse', 'doctor', 'director'] },
  { title: 'Triage / Infirmier', url: '/triage', icon: HeartPulse, roles: ['nurse', 'doctor', 'director'] },
  { title: 'Dossier Patient (DPI)', url: '/dpi', icon: FileText, roles: ['doctor'] },
  { title: 'Laboratoire LIMS', url: '/laboratoire', icon: FlaskConical, roles: ['lab', 'doctor', 'director'] },
  { title: 'Imagerie Médicale', url: '/imagerie', icon: ScanLine, roles: ['imaging', 'doctor', 'director'] },
  { title: 'Pharmacie', url: '/pharmacie', icon: Pill, roles: ['pharmacist', 'doctor', 'director'] },
  { title: 'Facturation & Caisse', url: '/facturation', icon: Banknote, roles: ['reception', 'director'] },
  { title: 'Hospitalisations', url: '/hospitalisations', icon: BedDouble, roles: ['nurse', 'doctor', 'director'] },
  { title: 'Bloc Opératoire', url: '/bloc-operatoire', icon: Scissors, roles: ['doctor', 'director'] },
  { title: 'Services Médicaux', url: '/services', icon: Stethoscope, roles: ['doctor', 'nurse', 'director'] },
  { title: 'IA Marate', url: '/ia', icon: Brain, roles: ['doctor', 'director', 'nurse', 'lab'] },
  { title: 'Tableau de Bord', url: '/dashboard-directeur', icon: BarChart3, roles: ['director'] },
  { title: 'Liste des Patients', url: '/patients', icon: Users, roles: ['reception', 'nurse', 'doctor', 'lab', 'imaging', 'pharmacist', 'director'] },
];

const MINISTER_ITEMS: NavItem[] = [
  { title: 'Dashboard National', url: '/ministere', icon: Activity, roles: ['minister'] },
  { title: 'Surveillance Épidémique', url: '/ministere/epidemie', icon: Shield, roles: ['minister'] },
  { title: 'Statistiques SNIS', url: '/ministere/statistiques', icon: BarChart3, roles: ['minister'] },
];

export function AppSidebar() {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const items = role === 'minister' ? MINISTER_ITEMS : NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-ring flex items-center justify-center">
              <Shield className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-primary">Marate Santé AI</h2>
              <p className="text-[10px] text-sidebar-foreground/60">SIH Souverain du Tchad</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-sidebar-ring flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-sidebar-primary" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            {role === 'minister' ? 'Ministère de la Santé' : 'Modules'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/accueil'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
