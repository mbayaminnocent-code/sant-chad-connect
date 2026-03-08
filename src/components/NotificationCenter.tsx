import { useAuth } from '@/contexts/AuthContext';
import { usePlanning, MedicalNotification } from '@/contexts/PlanningContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bell, ArrowRightLeft, Calendar, Shield, Info, CheckCheck, Repeat } from 'lucide-react';

const typeConfig: Record<MedicalNotification['type'], { icon: typeof Bell; label: string; color: string }> = {
  transfert: { icon: ArrowRightLeft, label: 'Transfert', color: 'text-primary' },
  rdv: { icon: Calendar, label: 'Rendez-vous', color: 'text-secondary' },
  garde: { icon: Shield, label: 'Garde', color: 'text-destructive' },
  info: { icon: Info, label: 'Info', color: 'text-muted-foreground' },
};

const NotificationCenter = () => {
  const { doctorProfile } = useAuth();
  const { getNotificationsForDoctor, markNotificationRead, markAllNotificationsRead } = usePlanning();

  const myDoctorId = doctorProfile?.doctorId || '';
  const notifications = getNotificationsForDoctor(myDoctorId);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!myDoctorId) return null;

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold text-foreground">Notifications médicales</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 text-muted-foreground"
              onClick={() => markAllNotificationsRead(myDoctorId)}
            >
              <CheckCheck className="w-3 h-3" /> Tout lire
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          notifications.slice(0, 10).map(n => {
            const config = typeConfig[n.type];
            const Icon = config.icon;
            return (
              <DropdownMenuItem
                key={n.id}
                className={`flex items-start gap-3 py-3 px-3 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className={`mt-0.5 ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{n.message}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  {n.detail && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.detail}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[9px] h-4">{config.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatTime(n.timestamp)}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
