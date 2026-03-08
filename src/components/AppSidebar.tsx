import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import {
  Home, Users, FileText, FlaskConical, ScanLine, Pill, Banknote, BedDouble,
  Scissors, Brain, Stethoscope, Activity, BarChart3, Shield, HeartPulse, CalendarDays
} from 'lucide-react';
import type { Role } from '@/data/mockData';
import type { TranslationKey } from '@/i18n/translations';

interface NavItem {
  titleKey: TranslationKey;
  url: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { titleKey: 'nav.accueil', url: '/accueil', icon: Home, roles: ['kiosk', 'reception', 'nurse', 'doctor', 'director'] },
  { titleKey: 'nav.triage', url: '/triage', icon: HeartPulse, roles: ['nurse', 'doctor', 'director'] },
  { titleKey: 'nav.dpi', url: '/dpi', icon: FileText, roles: ['doctor'] },
  { titleKey: 'nav.laboratoire', url: '/laboratoire', icon: FlaskConical, roles: ['lab', 'doctor', 'director'] },
  { titleKey: 'nav.imagerie', url: '/imagerie', icon: ScanLine, roles: ['imaging', 'doctor', 'director'] },
  { titleKey: 'nav.pharmacie', url: '/pharmacie', icon: Pill, roles: ['pharmacist', 'doctor', 'director'] },
  { titleKey: 'nav.facturation', url: '/facturation', icon: Banknote, roles: ['reception', 'director'] },
  { titleKey: 'nav.hospitalisations', url: '/hospitalisations', icon: BedDouble, roles: ['nurse', 'doctor', 'director'] },
  { titleKey: 'nav.bloc', url: '/bloc-operatoire', icon: Scissors, roles: ['doctor', 'director'] },
  { titleKey: 'nav.services', url: '/services', icon: Stethoscope, roles: ['doctor', 'nurse', 'director'] },
  { titleKey: 'nav.ia', url: '/ia', icon: Brain, roles: ['doctor', 'director', 'nurse', 'lab'] },
  { titleKey: 'nav.dashboard', url: '/dashboard-directeur', icon: BarChart3, roles: ['director'] },
  { titleKey: 'nav.patients', url: '/patients', icon: Users, roles: ['reception', 'nurse', 'doctor', 'lab', 'imaging', 'pharmacist', 'director'] },
];

const MINISTER_ITEMS: NavItem[] = [
  { titleKey: 'nav.dashboard_national', url: '/ministere', icon: Activity, roles: ['minister'] },
  { titleKey: 'nav.surveillance', url: '/ministere/epidemie', icon: Shield, roles: ['minister'] },
  { titleKey: 'nav.statistiques', url: '/ministere/statistiques', icon: BarChart3, roles: ['minister'] },
];

export function AppSidebar() {
  const { role } = useAuth();
  const { state } = useSidebar();
  const { t } = useTranslation();
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
              <h2 className="text-sm font-bold text-sidebar-primary">{t('sidebar.title')}</h2>
              <p className="text-[10px] text-sidebar-foreground/60">{t('sidebar.subtitle')}</p>
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
            {role === 'minister' ? t('sidebar.ministry') : t('sidebar.modules')}
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
                      <item.icon className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {!collapsed && <span>{t(item.titleKey)}</span>}
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
