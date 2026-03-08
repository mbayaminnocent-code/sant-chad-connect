import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, Zap, Timer, Users, TrendingUp } from 'lucide-react';

export interface QueueItem {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  urgence: number; // 1=critique, 2=urgent, 3=modéré, 4-5=normal
  examName: string;
  status: 'waiting' | 'in_progress' | 'done';
  arrivalTime: Date;
  estimatedDuration: number; // minutes
}

interface PriorityQueueProps {
  items: QueueItem[];
  title: string;
  icon: React.ReactNode;
  inProgressCount: number;
  maxParallel: number; // how many exams can run in parallel
}

const URGENCE_CONFIG: Record<number, { label: string; color: string; bg: string; icon: string; weight: number }> = {
  1: { label: 'Critique', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: '🔴', weight: 0 },
  2: { label: 'Urgent', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30', icon: '🟠', weight: 1 },
  3: { label: 'Modéré', color: 'text-warning', bg: 'bg-warning/10 border-warning/30', icon: '🟡', weight: 2 },
  4: { label: 'Normal', color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: '🟢', weight: 3 },
  5: { label: 'Bas', color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: '⚪', weight: 4 },
};

function estimateWaitTime(
  item: QueueItem,
  queue: QueueItem[],
  inProgressCount: number,
  maxParallel: number
): number {
  // Sort queue by priority
  const sorted = [...queue]
    .filter(q => q.status === 'waiting')
    .sort((a, b) => a.urgence - b.urgence || a.arrivalTime.getTime() - b.arrivalTime.getTime());

  const position = sorted.findIndex(q => q.id === item.id);
  if (position === -1) return 0;

  // Calculate how many items ahead + parallel capacity
  const slotsAvailable = Math.max(1, maxParallel - inProgressCount);
  const batchesAhead = Math.ceil((position) / slotsAvailable);
  
  // Average duration of items ahead
  const itemsAhead = sorted.slice(0, position);
  const avgDuration = itemsAhead.length > 0
    ? itemsAhead.reduce((sum, q) => sum + q.estimatedDuration, 0) / itemsAhead.length
    : item.estimatedDuration;

  return Math.round(batchesAhead * avgDuration);
}

function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return 'Immédiat';
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `~${h}h${m}` : `~${h}h`;
}

export default function PriorityQueue({ items, title, icon, inProgressCount, maxParallel }: PriorityQueueProps) {
  const waitingItems = items
    .filter(i => i.status === 'waiting')
    .sort((a, b) => a.urgence - b.urgence || a.arrivalTime.getTime() - b.arrivalTime.getTime());

  const inProgressItems = items.filter(i => i.status === 'in_progress');

  // Stats
  const avgWait = waitingItems.length > 0
    ? Math.round(waitingItems.reduce((sum, i) => sum + estimateWaitTime(i, items, inProgressCount, maxParallel), 0) / waitingItems.length)
    : 0;

  const urgentCount = waitingItems.filter(i => i.urgence <= 2).length;
  const totalCapacity = maxParallel;
  const utilization = Math.round((inProgressCount / totalCapacity) * 100);

  return (
    <div className="space-y-4">
      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{waitingItems.length}</p>
              <p className="text-[10px] text-muted-foreground">En file</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Timer className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{formatWaitTime(avgWait)}</p>
              <p className="text-[10px] text-muted-foreground">Attente moy.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{urgentCount}</p>
              <p className="text-[10px] text-muted-foreground">Urgents (P1-P2)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{utilization}%</p>
              <p className="text-[10px] text-muted-foreground">Utilisation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity bar */}
      <Card className="border-border/50">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacité de traitement</span>
            <span className="font-medium text-foreground">{inProgressCount}/{maxParallel} postes occupés</span>
          </div>
          <Progress value={utilization} className="h-2" />
        </CardContent>
      </Card>

      {/* In Progress */}
      {inProgressItems.length > 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              En cours ({inProgressItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inProgressItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <Zap className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.patientName}</p>
                  <p className="text-[10px] text-muted-foreground">{item.nhid} · {item.examName}</p>
                </div>
                <Badge variant="outline" className="text-[9px] border-primary/30 text-primary gap-1">
                  <Clock className="w-3 h-3" />{item.estimatedDuration} min
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Priority Queue */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {icon}
            {title} ({waitingItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun patient en file d'attente</p>
          ) : (
            <div className="space-y-1.5">
              {waitingItems.map((item, idx) => {
                const config = URGENCE_CONFIG[item.urgence] || URGENCE_CONFIG[4];
                const wait = estimateWaitTime(item, items, inProgressCount, maxParallel);
                const waitSince = Math.round((Date.now() - item.arrivalTime.getTime()) / 60000);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors hover:bg-muted/30 ${
                      item.urgence <= 2 ? 'border-destructive/20 bg-destructive/[0.02]' : 'border-border/50'
                    }`}
                  >
                    {/* Position */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Priority indicator */}
                    <span className="text-sm flex-shrink-0">{config.icon}</span>

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{item.patientName}</p>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${config.bg} ${config.color}`}>
                          P{item.urgence} {config.label}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.nhid} · {item.examName} · ~{item.estimatedDuration} min
                      </p>
                    </div>

                    {/* Wait time */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-semibold ${wait > 60 ? 'text-destructive' : wait > 30 ? 'text-warning' : 'text-foreground'}`}>
                        {formatWaitTime(wait)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {waitSince > 0 ? `Arrivé il y a ${waitSince} min` : 'Vient d\'arriver'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
