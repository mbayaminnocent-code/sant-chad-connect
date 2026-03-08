import { useMemo, useRef, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { Activity, Clock, Download, Loader2, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';
import type { QueueItem } from '@/components/PriorityQueue';

interface ServiceDashboardProps {
  items: QueueItem[];
  serviceName: string;
  maxParallel: number;
  inProgressCount: number;
}

const COLORS = {
  primary: 'hsl(199, 100%, 36%)',
  secondary: 'hsl(152, 100%, 33%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 72%, 51%)',
  muted: 'hsl(210, 20%, 80%)',
};

const URGENCE_COLORS: Record<number, string> = {
  1: COLORS.destructive,
  2: 'hsl(25, 95%, 53%)',
  3: COLORS.warning,
  4: COLORS.secondary,
  5: COLORS.muted,
};

export default function ServiceDashboard({ items, serviceName, maxParallel, inProgressCount }: ServiceDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFontSize(16);
      pdf.text(`Rapport ${serviceName}`, 14, 15);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 22);

      // Stats summary
      const waiting = items.filter(i => i.status === 'waiting').length;
      const done = items.filter(i => i.status === 'done').length;
      pdf.setFontSize(10);
      pdf.setTextColor(0);
      pdf.text(`En attente: ${waiting}  |  En cours: ${inProgressCount}  |  Traités: ${done}  |  Utilisation: ${maxParallel > 0 ? Math.round((inProgressCount / maxParallel) * 100) : 0}%`, 14, 29);

      // Dashboard image
      const margin = 14;
      const topOffset = 34;
      const availW = pageW - margin * 2;
      const availH = pageH - topOffset - 10;
      const ratio = Math.min(availW / canvas.width, availH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;

      pdf.addImage(imgData, 'PNG', margin, topOffset, imgW, imgH);
      pdf.save(`rapport-${serviceName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setExporting(false);
    }
  }, [items, serviceName, maxParallel, inProgressCount]);
  // Generate simulated hourly data for the day
  const hourlyFlowData = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const data = [];

    // Simulate realistic hospital flow pattern
    const basePatterns: Record<string, number[]> = {
      arrivees: [2, 1, 1, 0, 0, 1, 3, 8, 12, 10, 8, 6, 4, 6, 8, 7, 5, 4, 3, 2, 2, 1, 1, 1],
      traites: [1, 1, 1, 0, 0, 0, 2, 6, 10, 9, 7, 5, 3, 5, 7, 6, 5, 4, 3, 2, 2, 1, 1, 0],
    };

    // Adjust with actual data for current state
    const waitingCount = items.filter(i => i.status === 'waiting').length;
    const doneCount = items.filter(i => i.status === 'done').length;

    for (let h = 7; h <= Math.min(currentHour + 1, 22); h++) {
      const idx = h % 24;
      const variance = (Math.random() - 0.5) * 2;
      const arrivees = Math.max(0, Math.round(basePatterns.arrivees[idx] + variance));
      const traites = Math.max(0, Math.round(basePatterns.traites[idx] + variance));

      data.push({
        heure: `${h}h`,
        arrivees: h === currentHour ? Math.max(arrivees, waitingCount > 0 ? 3 : arrivees) : arrivees,
        traites: h === currentHour ? Math.max(traites, doneCount > 0 ? 2 : traites) : traites,
        enFile: Math.max(0, Math.round(arrivees - traites + (Math.random() * 3))),
      });
    }
    return data;
  }, [items]);

  // Wait time evolution
  const waitTimeData = useMemo(() => {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();

    for (let h = 7; h <= Math.min(currentHour + 1, 22); h++) {
      // Simulate wait times that peak during busy hours
      const baseWait = h >= 9 && h <= 11 ? 45 : h >= 14 && h <= 16 ? 35 : 15;
      const urgentWait = Math.round(baseWait * 0.4 + (Math.random() * 10));
      const normalWait = Math.round(baseWait + (Math.random() * 15));
      
      data.push({
        heure: `${h}h`,
        urgent: urgentWait,
        modere: Math.round((urgentWait + normalWait) / 2),
        normal: normalWait,
      });
    }
    return data;
  }, []);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const waiting = items.filter(i => i.status === 'waiting');
    const dist = [1, 2, 3, 4, 5].map(p => ({
      name: `P${p}`,
      value: waiting.filter(i => i.urgence === p).length,
      color: URGENCE_COLORS[p],
    })).filter(d => d.value > 0);
    return dist;
  }, [items]);

  // Stats
  const stats = useMemo(() => {
    const waiting = items.filter(i => i.status === 'waiting');
    const done = items.filter(i => i.status === 'done');
    const inProgress = items.filter(i => i.status === 'in_progress');

    const avgWait = waiting.length > 0
      ? Math.round(waiting.reduce((sum, i) => sum + (Date.now() - i.arrivalTime.getTime()) / 60000, 0) / waiting.length)
      : 0;

    const maxWait = waiting.length > 0
      ? Math.round(Math.max(...waiting.map(i => (Date.now() - i.arrivalTime.getTime()) / 60000)))
      : 0;

    const utilization = maxParallel > 0 ? Math.round((inProgressCount / maxParallel) * 100) : 0;
    const throughput = done.length;

    return { avgWait, maxWait, waiting: waiting.length, inProgress: inProgress.length, done: done.length, utilization, throughput };
  }, [items, maxParallel, inProgressCount]);

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-[10px] text-muted-foreground">Attente moyenne</span>
            </div>
            <p className={`text-xl font-bold ${stats.avgWait > 60 ? 'text-destructive' : stats.avgWait > 30 ? 'text-warning' : 'text-foreground'}`}>
              {stats.avgWait} min
            </p>
            {stats.avgWait > 45 && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-destructive" />
                <span className="text-[9px] text-destructive">Au-dessus du seuil</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangleIcon className="w-4 h-4 text-destructive" />
              <span className="text-[10px] text-muted-foreground">Attente max</span>
            </div>
            <p className={`text-xl font-bold ${stats.maxWait > 120 ? 'text-destructive' : 'text-foreground'}`}>
              {stats.maxWait > 60 ? `${Math.floor(stats.maxWait / 60)}h${stats.maxWait % 60}` : `${stats.maxWait} min`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">Utilisation</span>
            </div>
            <p className={`text-xl font-bold ${stats.utilization > 90 ? 'text-destructive' : stats.utilization > 70 ? 'text-warning' : 'text-secondary'}`}>
              {stats.utilization}%
            </p>
            <p className="text-[9px] text-muted-foreground">{inProgressCount}/{maxParallel} postes</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-secondary" />
              <span className="text-[10px] text-muted-foreground">Débit journalier</span>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.throughput}</p>
            <p className="text-[9px] text-muted-foreground">patients traités</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient Flow Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Flux patients – Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={hourlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                <XAxis dataKey="heure" tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 45%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 45%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 15%, 89%)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="arrivees" name="Arrivées" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="traites" name="Traités" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="enFile" name="En file" stroke={COLORS.warning} fill={COLORS.warning} fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Wait Time Evolution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              Évolution temps d'attente (min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={waitTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                <XAxis dataKey="heure" tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 45%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 45%)" unit=" min" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 15%, 89%)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="urgent" name="Urgent (P1-P2)" stroke={COLORS.destructive} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="modere" name="Modéré (P3)" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="normal" name="Normal (P4-P5)" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Répartition par priorité</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun patient en file</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={priorityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {priorityDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
              {priorityDistribution.map(d => (
                <Badge key={d.name} variant="outline" className="text-[9px] gap-1" style={{ borderColor: d.color, color: d.color }}>
                  {d.name}: {d.value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Throughput */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Débit horaire – Examens traités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                <XAxis dataKey="heure" tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 45%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(210, 10%, 45%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 100%)',
                    border: '1px solid hsl(210, 15%, 89%)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="traites" name="Traités" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="arrivees" name="Arrivées" fill={COLORS.primary} radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Small helper to avoid importing from lucide twice
function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}
