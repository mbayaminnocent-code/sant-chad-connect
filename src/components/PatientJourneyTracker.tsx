import { JOURNEY_STEPS, JourneyStep, usePatientJourney } from '@/contexts/PatientJourneyContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  patientId: string;
  compact?: boolean;
  showEvents?: boolean;
}

const PatientJourneyTracker = ({ patientId, compact = false, showEvents = false }: Props) => {
  const { getPatientStep, getPatientEvents } = usePatientJourney();
  const currentStep = getPatientStep(patientId);
  const currentIdx = JOURNEY_STEPS.findIndex(s => s.key === currentStep);
  const events = showEvents ? getPatientEvents(patientId).slice(0, 5) : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-0.5">
        {JOURNEY_STEPS.map((step, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={cn(
                  'rounded-full flex items-center justify-center font-bold border-2 transition-all',
                  compact ? 'w-5 h-5 text-[7px]' : 'w-7 h-7 text-[10px]',
                  isCurrent && 'bg-primary border-primary text-primary-foreground scale-110 shadow-md',
                  isPast && 'bg-secondary border-secondary text-secondary-foreground',
                  !isPast && !isCurrent && 'bg-muted border-border text-muted-foreground',
                )}>
                  {isPast ? '✓' : step.icon}
                </div>
                {!compact && (
                  <span className={cn(
                    'text-[8px] mt-0.5 text-center leading-tight whitespace-nowrap',
                    isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </span>
                )}
              </div>
              {idx < JOURNEY_STEPS.length - 1 && (
                <div className={cn(
                  'w-full mt-[-10px]',
                  compact ? 'h-px' : 'h-0.5',
                  isPast ? 'bg-secondary' : 'bg-border'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {showEvents && events.length > 0 && (
        <div className="space-y-1 mt-2">
          <p className="text-[10px] font-medium text-muted-foreground">HISTORIQUE DU PARCOURS</p>
          {events.map(evt => {
            const toStep = JOURNEY_STEPS.find(s => s.key === evt.to);
            return (
              <div key={evt.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="text-foreground font-mono">
                  {evt.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>{toStep?.icon}</span>
                <span className="text-foreground font-medium">{toStep?.label}</span>
                <span>via {evt.module}</span>
                {evt.details && <span className="text-primary">– {evt.details}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientJourneyTracker;
