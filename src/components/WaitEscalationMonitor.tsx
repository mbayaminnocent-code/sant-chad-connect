import { useEffect, useCallback, useRef, useState } from 'react';
import { usePatientJourney, JOURNEY_STEPS, JourneyStep } from '@/contexts/PatientJourneyContext';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, ShieldAlert, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';

interface EscalationAlert {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  currentStep: JourneyStep;
  waitMinutes: number;
  urgence: number;
  level: 'warning' | 'critical' | 'escalated';
  escalatedAt?: Date;
  acknowledged: boolean;
  timestamp: Date;
}

// Thresholds per urgency level (minutes)
const ESCALATION_THRESHOLDS = {
  1: { warning: 10, critical: 20, escalate: 30 },
  2: { warning: 30, critical: 60, escalate: 90 },
  3: { warning: 60, critical: 120, escalate: 180 },
  4: { warning: 90, critical: 180, escalate: 240 },
  5: { warning: 120, critical: 240, escalate: 360 },
};

export default function WaitEscalationMonitor() {
  const { patients, journeyEvents, getPatientStep } = usePatientJourney();
  const { addNotification } = useApp();
  const [alerts, setAlerts] = useState<EscalationAlert[]>([]);
  const [expanded, setExpanded] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());

  const checkEscalations = useCallback(() => {
    const now = Date.now();
    const newAlerts: EscalationAlert[] = [];

    patients.forEach(p => {
      const step = getPatientStep(p.id);
      if (step === 'sorti' || step === 'accueil') return;

      // Find the last event for this patient to calculate wait time
      const lastEvent = journeyEvents
        .filter(e => e.patientId === p.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      if (!lastEvent) return;

      const waitMs = now - lastEvent.timestamp.getTime();
      const waitMinutes = Math.round(waitMs / 60000);
      const urgence = p.urgence || 4;
      const thresholds = ESCALATION_THRESHOLDS[urgence as keyof typeof ESCALATION_THRESHOLDS] || ESCALATION_THRESHOLDS[4];

      let level: EscalationAlert['level'] | null = null;
      if (waitMinutes >= thresholds.escalate) {
        level = 'escalated';
      } else if (waitMinutes >= thresholds.critical) {
        level = 'critical';
      } else if (waitMinutes >= thresholds.warning) {
        level = 'warning';
      }

      if (!level) return;

      const alertKey = `${p.id}-${level}`;
      const stepLabel = JOURNEY_STEPS.find(s => s.key === step)?.label || step;

      // Only notify once per level
      if (!notifiedRef.current.has(alertKey)) {
        notifiedRef.current.add(alertKey);

        if (level === 'escalated') {
          toast.error(`🚨 ESCALADE Chef de Service – ${p.prenom} ${p.nom}`, {
            description: `P${urgence} en ${stepLabel} depuis ${waitMinutes} min – Intervention requise`,
            duration: 15000,
          });
          addNotification({
            type: 'error',
            message: `🚨 ESCALADE: ${p.prenom} ${p.nom} (P${urgence}) en ${stepLabel} – ${waitMinutes} min – Chef de service alerté`,
          });
        } else if (level === 'critical') {
          toast.warning(`⚠️ Attente critique – ${p.prenom} ${p.nom}`, {
            description: `P${urgence} en ${stepLabel} depuis ${waitMinutes} min`,
            duration: 10000,
          });
          addNotification({
            type: 'warning',
            message: `⚠️ Attente critique: ${p.prenom} ${p.nom} (P${urgence}) – ${waitMinutes} min en ${stepLabel}`,
          });
        } else {
          toast.info(`⏰ Seuil d'attente atteint – ${p.prenom} ${p.nom}`, {
            description: `P${urgence} en ${stepLabel} depuis ${waitMinutes} min`,
            duration: 8000,
          });
        }
      }

      newAlerts.push({
        id: `esc-${p.id}`,
        patientId: p.id,
        patientName: `${p.prenom} ${p.nom}`,
        nhid: p.nhid,
        currentStep: step,
        waitMinutes,
        urgence,
        level,
        escalatedAt: level === 'escalated' ? new Date() : undefined,
        acknowledged: false,
        timestamp: new Date(),
      });
    });

    setAlerts(newAlerts.sort((a, b) => {
      const levelOrder = { escalated: 0, critical: 1, warning: 2 };
      return (levelOrder[a.level] - levelOrder[b.level]) || (b.waitMinutes - a.waitMinutes);
    }));
  }, [patients, journeyEvents, getPatientStep, addNotification]);

  useEffect(() => {
    checkEscalations();
    const interval = setInterval(checkEscalations, 20000);
    return () => clearInterval(interval);
  }, [checkEscalations]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  };

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const escalatedCount = activeAlerts.filter(a => a.level === 'escalated').length;
  const criticalCount = activeAlerts.filter(a => a.level === 'critical').length;

  if (activeAlerts.length === 0) return null;

  const urgenceIcon = (u: number) => {
    switch (u) {
      case 1: return '🔴';
      case 2: return '🟠';
      case 3: return '🟡';
      case 4: return '🟢';
      default: return '⚪';
    }
  };

  const levelStyle = (level: EscalationAlert['level']) => {
    switch (level) {
      case 'escalated': return 'border-destructive bg-destructive/5 animate-pulse';
      case 'critical': return 'border-destructive/50 bg-destructive/[0.02]';
      case 'warning': return 'border-warning/50 bg-warning/[0.02]';
    }
  };

  const levelBadge = (level: EscalationAlert['level']) => {
    switch (level) {
      case 'escalated': return <Badge variant="destructive" className="text-[9px] gap-1"><ShieldAlert className="w-3 h-3" />ESCALADÉ</Badge>;
      case 'critical': return <Badge variant="destructive" className="text-[9px] gap-1 opacity-80"><AlertTriangle className="w-3 h-3" />CRITIQUE</Badge>;
      case 'warning': return <Badge variant="secondary" className="text-[9px] gap-1"><Clock className="w-3 h-3" />ALERTE</Badge>;
    }
  };

  return (
    <Card className={`border-2 ${escalatedCount > 0 ? 'border-destructive animate-pulse' : criticalCount > 0 ? 'border-destructive/50' : 'border-warning/50'}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className={`w-4 h-4 ${escalatedCount > 0 ? 'text-destructive animate-bounce' : 'text-warning'}`} />
            <span className="text-foreground">
              Alertes temps d'attente
            </span>
            {escalatedCount > 0 && (
              <Badge variant="destructive" className="text-[9px]">{escalatedCount} escaladé(s)</Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="secondary" className="text-[9px]">{criticalCount} critique(s)</Badge>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 pt-0">
          {activeAlerts.slice(0, 10).map(alert => {
            const stepLabel = JOURNEY_STEPS.find(s => s.key === alert.currentStep)?.label || alert.currentStep;
            return (
              <div key={alert.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${levelStyle(alert.level)}`}>
                <span className="text-base">{urgenceIcon(alert.urgence)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">{alert.patientName}</p>
                    {levelBadge(alert.level)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {alert.nhid} · P{alert.urgence} · {stepLabel} · {alert.waitMinutes} min
                  </p>
                  {alert.level === 'escalated' && (
                    <p className="text-[10px] text-destructive font-semibold mt-0.5">
                      🚨 Chef de service notifié – Intervention requise
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={() => acknowledgeAlert(alert.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
