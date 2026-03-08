import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, Bell, BellOff, Clock, Settings, X, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import type { QueueItem } from '@/components/PriorityQueue';

interface AlertThreshold {
  urgenceLevel: number;
  maxWaitMinutes: number;
  enabled: boolean;
  label: string;
}

interface WaitTimeAlert {
  id: string;
  patientName: string;
  nhid: string;
  examName: string;
  urgence: number;
  waitMinutes: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface WaitTimeAlertsProps {
  items: QueueItem[];
  serviceName: string;
}

const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { urgenceLevel: 1, maxWaitMinutes: 15, enabled: true, label: 'P1 Critique' },
  { urgenceLevel: 2, maxWaitMinutes: 45, enabled: true, label: 'P2 Urgent' },
  { urgenceLevel: 3, maxWaitMinutes: 90, enabled: true, label: 'P3 Modéré' },
  { urgenceLevel: 4, maxWaitMinutes: 120, enabled: true, label: 'P4 Normal' },
  { urgenceLevel: 5, maxWaitMinutes: 180, enabled: true, label: 'P5 Bas' },
];

export default function WaitTimeAlerts({ items, serviceName }: WaitTimeAlertsProps) {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>(DEFAULT_THRESHOLDS);
  const [alerts, setAlerts] = useState<WaitTimeAlert[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const checkAlerts = useCallback(() => {
    if (!alertsEnabled) return;

    const waitingItems = items.filter(i => i.status === 'waiting');
    const newAlerts: WaitTimeAlert[] = [];

    waitingItems.forEach(item => {
      const waitMinutes = Math.round((Date.now() - item.arrivalTime.getTime()) / 60000);
      const threshold = thresholds.find(t => t.urgenceLevel === item.urgence && t.enabled);

      if (threshold && waitMinutes >= threshold.maxWaitMinutes) {
        const existingAlert = alerts.find(a => a.id === item.id && !a.acknowledged);
        if (!existingAlert) {
          newAlerts.push({
            id: item.id,
            patientName: item.patientName,
            nhid: item.nhid,
            examName: item.examName,
            urgence: item.urgence,
            waitMinutes,
            threshold: threshold.maxWaitMinutes,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
      newAlerts.forEach(alert => {
        toast.warning(
          `⏰ Dépassement seuil P${alert.urgence} – ${alert.patientName}`,
          {
            description: `Attente: ${alert.waitMinutes} min (seuil: ${alert.threshold} min) – ${alert.examName}`,
            duration: 10000,
          }
        );
      });
    }
  }, [items, thresholds, alertsEnabled, alerts]);

  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkAlerts]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  const clearAlerts = () => setAlerts([]);

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  const updateThreshold = (urgence: number, value: number) => {
    setThresholds(prev => prev.map(t => t.urgenceLevel === urgence ? { ...t, maxWaitMinutes: value } : t));
  };

  const toggleThreshold = (urgence: number) => {
    setThresholds(prev => prev.map(t => t.urgenceLevel === urgence ? { ...t, enabled: !t.enabled } : t));
  };

  const urgenceIcon = (u: number) => {
    switch (u) {
      case 1: return '🔴';
      case 2: return '🟠';
      case 3: return '🟡';
      case 4: return '🟢';
      case 5: return '⚪';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${activeAlerts.length > 0 ? 'bg-destructive/10 animate-pulse' : 'bg-muted'}`}>
            {activeAlerts.length > 0
              ? <Bell className="w-5 h-5 text-destructive" />
              : <BellOff className="w-5 h-5 text-muted-foreground" />
            }
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Alertes temps d'attente – {serviceName}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {activeAlerts.length > 0
                ? `${activeAlerts.length} alerte(s) active(s)`
                : 'Aucune alerte active'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            <span className="text-[10px] text-muted-foreground">{alertsEnabled ? 'Actif' : 'Désactivé'}</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-3 h-3" /> Seuils
          </Button>
          {alerts.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAlerts}>Effacer tout</Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" /> Configuration des seuils
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Alertes sonores</span>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            {thresholds.map(t => (
              <div key={t.urgenceLevel} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <Switch checked={t.enabled} onCheckedChange={() => toggleThreshold(t.urgenceLevel)} />
                <span className="text-sm">{urgenceIcon(t.urgenceLevel)}</span>
                <span className="text-xs font-medium text-foreground w-20">{t.label}</span>
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    type="number"
                    className="h-7 w-20 text-xs"
                    value={t.maxWaitMinutes}
                    onChange={e => updateThreshold(t.urgenceLevel, parseInt(e.target.value) || 0)}
                    disabled={!t.enabled}
                    min={1}
                  />
                  <span className="text-[10px] text-muted-foreground">min max</span>
                </div>
                <Badge variant="outline" className={`text-[9px] ${t.enabled ? 'border-primary/30 text-primary' : 'border-border text-muted-foreground'}`}>
                  {t.enabled ? `Alerte à ${t.maxWaitMinutes} min` : 'Désactivé'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              Alertes actives ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={`${alert.id}-${alert.timestamp.getTime()}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 animate-in fade-in"
              >
                <span className="text-lg">{urgenceIcon(alert.urgence)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{alert.patientName}</p>
                    <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">
                      P{alert.urgence}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {alert.nhid} · {alert.examName}
                  </p>
                  <p className="text-[10px] text-destructive font-medium mt-0.5">
                    ⏰ {alert.waitMinutes} min d'attente (seuil: {alert.threshold} min)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="destructive" className="text-[9px] gap-1">
                    <Clock className="w-3 h-3" /> +{alert.waitMinutes - alert.threshold} min
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => acknowledgeAlert(alert.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Acknowledged (collapsed) */}
      {acknowledgedAlerts.length > 0 && (
        <div className="text-[10px] text-muted-foreground text-center py-1">
          {acknowledgedAlerts.length} alerte(s) acquittée(s)
        </div>
      )}

      {/* Summary of thresholds */}
      {!showSettings && (
        <div className="flex flex-wrap gap-2">
          {thresholds.filter(t => t.enabled).map(t => (
            <Badge key={t.urgenceLevel} variant="outline" className="text-[9px] gap-1 border-border">
              {urgenceIcon(t.urgenceLevel)} {t.label}: {t.maxWaitMinutes} min
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
