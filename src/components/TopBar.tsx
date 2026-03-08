import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/hooks/useTranslation';
import { ROLES, HOSPITALS } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Sun, Wifi, WifiOff, BatteryMedium, RefreshCw, Bell, LogOut, Globe, CloudOff
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import NotificationCenter from '@/components/NotificationCenter';

const TopBar = () => {
  const { role, name, logout, switchRole } = useAuth();
  const { isOffline, setIsOffline, solarLevel, starlinkSignal, currentHospital, setCurrentHospital, language, setLanguage, notifications, isSyncing, startSync } = useApp();
  const { t } = useTranslation();

  const currentRole = ROLES.find(r => r.id === role);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-3 gap-2 shrink-0">
      <SidebarTrigger className="ltr:mr-1 rtl:ml-1" />

      {/* Offline Banner */}
      {isOffline && (
        <Badge variant="destructive" className="animate-pulse gap-1 ltr:mr-2 rtl:ml-2">
          <CloudOff className="w-3 h-3" /> {t('topbar.offline')}
        </Badge>
      )}

      {/* Hospital selector */}
      {role !== 'minister' && (
        <Select value={currentHospital} onValueChange={setCurrentHospital}>
          <SelectTrigger className="w-[260px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOSPITALS.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <div className="flex-1" />

      {/* Status indicators */}
      <div className="hidden md:flex items-center gap-3 ltr:mr-3 rtl:ml-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`Solaire: ${solarLevel}%`}>
          <Sun className="w-4 h-4 text-warning" />
          <BatteryMedium className="w-4 h-4" />
          <span>{solarLevel}%</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`Starlink: ${starlinkSignal}%`}>
          {isOffline ? <WifiOff className="w-4 h-4 text-destructive" /> : <Wifi className="w-4 h-4 text-secondary" />}
          <span>{isOffline ? t('topbar.offline_label') : `${starlinkSignal}%`}</span>
        </div>
      </div>

      {/* Sync button */}
      <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={startSync} disabled={isSyncing}>
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? t('topbar.syncing') : t('topbar.sync')}
      </Button>

      {/* Offline toggle */}
      <Button variant={isOffline ? "destructive" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setIsOffline(!isOffline)}>
        {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
      </Button>

      {/* Medical Notifications (for doctors) */}
      {role === 'doctor' && <NotificationCenter />}

      {/* System Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 relative">
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          {notifications.slice(0, 5).map(n => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start py-2">
              <span className="text-xs font-medium">{n.message}</span>
              <span className="text-[10px] text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Language */}
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}>
        <Globe className="w-3 h-3" />
        {language === 'fr' ? 'عربي' : 'FR'}
      </Button>

      {/* Role switcher */}
      <Select value={role} onValueChange={(v) => switchRole(v as any)}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue>{currentRole?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-xs">{r.label}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Sync progress */}
      {isSyncing && (
        <div className="absolute top-14 left-0 right-0 h-1 z-50">
          <Progress value={66} className="h-1 rounded-none" />
          <p className="text-[10px] text-center text-primary bg-accent py-0.5">{t('topbar.syncing_message')}</p>
        </div>
      )}

      {/* User & Logout */}
      <span className="text-xs text-muted-foreground hidden lg:block ltr:ml-1 rtl:mr-1">{name}</span>
      <Button variant="ghost" size="sm" className="h-8" onClick={logout} title={t('topbar.logout')}>
        <LogOut className="w-4 h-4" />
      </Button>
    </header>
  );
};

export default TopBar;
