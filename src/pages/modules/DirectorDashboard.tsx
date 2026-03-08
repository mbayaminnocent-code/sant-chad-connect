import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, BedDouble, Banknote, Activity, TrendingUp, TrendingDown,
  AlertTriangle, Clock, Stethoscope, FlaskConical, ScanLine, Pill,
  HeartPulse, Scissors, Brain, Baby, Eye, Droplets, Fingerprint,
  Zap, FileText, ArrowUpRight, ArrowDownRight, Gauge, Thermometer,
  ShieldAlert, CircleDollarSign, CalendarDays, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { MOCK_PATIENTS, SERVICES, PHARMACY_STOCK } from '@/data/mockData';

// ─── Mock Data ───────────────────────────────────────────
const HOURLY_FLOW = [
  { heure: '06h', entrees: 2, sorties: 0, urgences: 1 },
  { heure: '07h', entrees: 8, sorties: 1, urgences: 3 },
  { heure: '08h', entrees: 15, sorties: 2, urgences: 5 },
  { heure: '09h', entrees: 22, sorties: 4, urgences: 4 },
  { heure: '10h', entrees: 18, sorties: 6, urgences: 6 },
  { heure: '11h', entrees: 14, sorties: 8, urgences: 3 },
  { heure: '12h', entrees: 8, sorties: 5, urgences: 2 },
  { heure: '13h', entrees: 10, sorties: 7, urgences: 4 },
  { heure: '14h', entrees: 16, sorties: 9, urgences: 5 },
  { heure: '15h', entrees: 12, sorties: 10, urgences: 3 },
  { heure: '16h', entrees: 9, sorties: 8, urgences: 2 },
  { heure: '17h', entrees: 6, sorties: 6, urgences: 1 },
];

const WEEKLY_REVENUE = [
  { jour: 'Lun', recettes: 3200000, depenses: 1800000, objectif: 3500000 },
  { jour: 'Mar', recettes: 2800000, depenses: 1600000, objectif: 3500000 },
  { jour: 'Mer', recettes: 4100000, depenses: 2100000, objectif: 3500000 },
  { jour: 'Jeu', recettes: 3600000, depenses: 1900000, objectif: 3500000 },
  { jour: 'Ven', recettes: 3900000, depenses: 2000000, objectif: 3500000 },
  { jour: 'Sam', recettes: 2100000, depenses: 1200000, objectif: 2000000 },
  { jour: 'Dim', recettes: 1400000, depenses: 900000, objectif: 1500000 },
];

const SERVICE_PERF = [
  { service: 'Urgences', patients: 45, capacite: 60, satisfaction: 72, attenteMoy: 35 },
  { service: 'Médecine Gén.', patients: 32, capacite: 40, satisfaction: 85, attenteMoy: 22 },
  { service: 'Chirurgie', patients: 18, capacite: 25, satisfaction: 91, attenteMoy: 15 },
  { service: 'Pédiatrie', patients: 24, capacite: 30, satisfaction: 88, attenteMoy: 18 },
  { service: 'Gynéco-Obst.', patients: 15, capacite: 20, satisfaction: 90, attenteMoy: 12 },
  { service: 'Cardiologie', patients: 12, capacite: 15, satisfaction: 93, attenteMoy: 10 },
  { service: 'Neurologie', patients: 8, capacite: 12, satisfaction: 87, attenteMoy: 20 },
  { service: 'Réanimation', patients: 6, capacite: 8, satisfaction: 78, attenteMoy: 0 },
];

const BED_BY_SERVICE = [
  { name: 'Méd. Interne', total: 40, occupes: 35, color: 'hsl(199, 100%, 36%)' },
  { name: 'Chirurgie', total: 25, occupes: 18, color: 'hsl(152, 100%, 33%)' },
  { name: 'Pédiatrie', total: 20, occupes: 17, color: 'hsl(38, 92%, 50%)' },
  { name: 'Maternité', total: 15, occupes: 14, color: 'hsl(320, 70%, 50%)' },
  { name: 'Réanimation', total: 8, occupes: 6, color: 'hsl(0, 72%, 51%)' },
  { name: 'Neurologie', total: 12, occupes: 8, color: 'hsl(270, 60%, 50%)' },
  { name: 'Cardiologie', total: 15, occupes: 11, color: 'hsl(199, 80%, 55%)' },
  { name: 'Oncologie', total: 10, occupes: 9, color: 'hsl(15, 80%, 50%)' },
];

const PATHOLOGY_DIST = [
  { name: 'Paludisme', value: 35, color: 'hsl(38, 92%, 50%)' },
  { name: 'Traumato.', value: 18, color: 'hsl(0, 72%, 51%)' },
  { name: 'Infections resp.', value: 15, color: 'hsl(199, 100%, 36%)' },
  { name: 'Grossesses', value: 12, color: 'hsl(320, 70%, 50%)' },
  { name: 'Cardio.', value: 10, color: 'hsl(152, 100%, 33%)' },
  { name: 'Autres', value: 10, color: 'hsl(210, 10%, 60%)' },
];

const STAFF_STATUS = [
  { nom: 'Dr. Ibrahim Moussa', role: 'Médecin', service: 'Méd. Générale', statut: 'En service', patients: 8 },
  { nom: 'Dr. Hawa Brahim', role: 'Médecin', service: 'Gynécologie', statut: 'En service', patients: 5 },
  { nom: 'Dr. Ali Bichara', role: 'Médecin', service: 'Cardiologie', statut: 'En bloc', patients: 3 },
  { nom: 'Dr. Abdelkrim Saleh', role: 'Médecin', service: 'Neurologie', statut: 'En service', patients: 4 },
  { nom: 'Pr. Hassan Ali', role: 'Chirurgien', service: 'Chirurgie', statut: 'En bloc', patients: 2 },
  { nom: 'Fatima Ali', role: 'Infirmière', service: 'Urgences', statut: 'En service', patients: 12 },
  { nom: 'Oumar Djibrine', role: 'Technicien Labo', service: 'Laboratoire', statut: 'En service', patients: 15 },
  { nom: 'Youssouf Mahamat', role: 'Tech. Imagerie', service: 'Imagerie', statut: 'En service', patients: 6 },
];

const ALERTS = [
  { id: 1, type: 'critical' as const, message: 'Stock ACT critique – 45 unités (seuil: 200)', time: '08:30', icon: Pill },
  { id: 2, type: 'warning' as const, message: 'Réanimation: 6/8 lits occupés (75%)', time: '08:15', icon: BedDouble },
  { id: 3, type: 'critical' as const, message: 'Cas suspect méningite – Protocole isolement activé', time: '07:45', icon: ShieldAlert },
  { id: 4, type: 'info' as const, message: 'Scanner en maintenance préventive jusqu\'à 10h00', time: '07:30', icon: ScanLine },
  { id: 5, type: 'warning' as const, message: 'Attente urgences > 30min (moy: 35min)', time: '08:45', icon: Clock },
  { id: 6, type: 'info' as const, message: 'Bloc 2: Intervention programmée à 09h00 – Pr. Hassan', time: '08:00', icon: Scissors },
];

const MORTALITY_WEEKLY = [
  { jour: 'Lun', deces: 1, infections: 2 }, { jour: 'Mar', deces: 0, infections: 1 },
  { jour: 'Mer', deces: 2, infections: 3 }, { jour: 'Jeu', deces: 0, infections: 1 },
  { jour: 'Ven', deces: 1, infections: 2 }, { jour: 'Sam', deces: 0, infections: 0 },
  { jour: 'Dim', deces: 0, infections: 1 },
];

// ─── Component ───────────────────────────────────────────
const DirectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const totalPatients = MOCK_PATIENTS.length;
  const hospitalises = MOCK_PATIENTS.filter(p => p.statut === 'hospitalise').length;
  const urgences = MOCK_PATIENTS.filter(p => p.urgence <= 2).length;
  const totalBeds = BED_BY_SERVICE.reduce((s, b) => s + b.total, 0);
  const occupiedBeds = BED_BY_SERVICE.reduce((s, b) => s + b.occupes, 0);
  const bedRate = Math.round((occupiedBeds / totalBeds) * 100);
  const criticalStock = PHARMACY_STOCK.filter(s => s.stock < s.seuil).length;
  const todayRevenue = 4250000;
  const yesterdayRevenue = 3800000;
  const revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1);

  const KpiCard = ({ icon: Icon, label, value, sub, trend, trendUp, color }: any) => (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${color}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-extrabold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trendUp ? 'text-secondary' : 'text-destructive'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Tableau de Bord — Directeur
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            CHU La Renaissance – N'Djamena • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-secondary text-secondary-foreground gap-1 px-3 py-1">
            <Activity className="w-3 h-3" /> Temps réel
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1">
            <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {ALERTS.filter(a => a.type === 'critical').length > 0 && (
        <Card className="border-destructive/50 border-2 bg-destructive/5 animate-pulse-slow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-bold text-destructive">ALERTES CRITIQUES ({ALERTS.filter(a => a.type === 'critical').length})</span>
            </div>
            <div className="space-y-1">
              {ALERTS.filter(a => a.type === 'critical').map(a => (
                <p key={a.id} className="text-sm text-foreground flex items-center gap-2">
                  <a.icon className="w-3.5 h-3.5 text-destructive" />
                  {a.message}
                  <span className="text-muted-foreground text-xs ml-auto">{a.time}</span>
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Patients aujourd'hui" value={totalPatients} sub={`${urgences} urgences P1/P2`} trend="+12% vs hier" trendUp color="bg-primary" />
        <KpiCard icon={BedDouble} label="Occupation lits" value={`${bedRate}%`} sub={`${occupiedBeds}/${totalBeds} lits`} trend={bedRate > 80 ? '⚠ Capacité élevée' : 'Capacité normale'} trendUp={bedRate <= 80} color="bg-warning" />
        <KpiCard icon={CircleDollarSign} label="Recettes du jour" value={`${(todayRevenue/1e6).toFixed(1)}M`} sub="FCFA" trend={`${revenueChange}% vs hier`} trendUp={Number(revenueChange) > 0} color="bg-secondary" />
        <KpiCard icon={Pill} label="Alertes stock" value={criticalStock} sub="médicaments sous seuil" trend={criticalStock > 2 ? 'Réapprovisionnement urgent' : 'Stock surveillé'} trendUp={criticalStock <= 2} color="bg-destructive" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Vue générale</TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5"><Stethoscope className="w-3.5 h-3.5" />Services</TabsTrigger>
          <TabsTrigger value="finance" className="gap-1.5"><Banknote className="w-3.5 h-3.5" />Finances</TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5"><Users className="w-3.5 h-3.5" />Personnel</TabsTrigger>
          <TabsTrigger value="quality" className="gap-1.5"><ShieldAlert className="w-3.5 h-3.5" />Qualité</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Alertes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Flow */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Flux Patients – Aujourd'hui</CardTitle>
                <CardDescription>Entrées, sorties et urgences par heure</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={HOURLY_FLOW}>
                    <defs>
                      <linearGradient id="gradEntrees" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(199, 100%, 36%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(199, 100%, 36%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradSorties" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152, 100%, 33%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(152, 100%, 33%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                    <XAxis dataKey="heure" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(210,15%,89%)', fontSize: 12 }} />
                    <Area type="monotone" dataKey="entrees" stroke="hsl(199, 100%, 36%)" fill="url(#gradEntrees)" strokeWidth={2} name="Entrées" />
                    <Area type="monotone" dataKey="sorties" stroke="hsl(152, 100%, 33%)" fill="url(#gradSorties)" strokeWidth={2} name="Sorties" />
                    <Line type="monotone" dataKey="urgences" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name="Urgences" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pathology Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" />Pathologies Dominantes</CardTitle>
                <CardDescription>Répartition des motifs d'admission</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={PATHOLOGY_DIST} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {PATHOLOGY_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} patients`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bed Occupancy by Service */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BedDouble className="w-4 h-4 text-primary" />Occupation des Lits par Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {BED_BY_SERVICE.map(s => {
                  const rate = Math.round((s.occupes / s.total) * 100);
                  return (
                    <div key={s.name} className="p-3 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        <Badge variant={rate > 85 ? 'destructive' : rate > 70 ? 'outline' : 'secondary'} className="text-[10px]">
                          {rate}%
                        </Badge>
                      </div>
                      <Progress value={rate} className="h-2 mb-1" />
                      <p className="text-[10px] text-muted-foreground">{s.occupes}/{s.total} lits occupés</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Pharmacy Critical Stock */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Pill className="w-4 h-4 text-destructive" />Stock Critique – Pharmacie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PHARMACY_STOCK.filter(s => s.stock < s.seuil).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.nom}</p>
                      <p className="text-xs text-muted-foreground">{item.categorie} • Péremption: {item.peremption}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">{item.stock}</p>
                      <p className="text-[10px] text-muted-foreground">Seuil: {item.seuil}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance des Services</CardTitle>
              <CardDescription>Charge, satisfaction et temps d'attente</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={SERVICE_PERF} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="service" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="patients" fill="hsl(199, 100%, 36%)" name="Patients" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="capacite" fill="hsl(210, 15%, 89%)" name="Capacité" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICE_PERF.map(s => {
              const load = Math.round((s.patients / s.capacite) * 100);
              return (
                <Card key={s.service} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">{s.service}</h4>
                      <Badge variant={load > 85 ? 'destructive' : 'secondary'} className="text-[10px]">{load}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Satisfaction</span>
                        <span className="font-medium text-foreground">{s.satisfaction}%</span>
                      </div>
                      <Progress value={s.satisfaction} className="h-1.5" />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Attente moy.</span>
                        <span className="font-medium text-foreground">{s.attenteMoy} min</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Patients</span>
                        <span className="font-medium text-foreground">{s.patients}/{s.capacite}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Banknote} label="Recettes semaine" value="21.1M" sub="FCFA" trend="+8.2% vs S-1" trendUp color="bg-secondary" />
            <KpiCard icon={TrendingDown} label="Dépenses semaine" value="11.5M" sub="FCFA" trend="+3.1% vs S-1" trendUp={false} color="bg-destructive" />
            <KpiCard icon={TrendingUp} label="Marge nette" value="9.6M" sub="FCFA (45.5%)" trend="+15% vs S-1" trendUp color="bg-primary" />
            <KpiCard icon={FileText} label="Factures impayées" value="127" sub="2.3M FCFA en retard" trend="18 > 30 jours" trendUp={false} color="bg-warning" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Banknote className="w-4 h-4 text-secondary" />Recettes vs Dépenses – Semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={WEEKLY_REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${(v / 1e6).toFixed(2)}M FCFA`} />
                  <Bar dataKey="recettes" fill="hsl(152, 100%, 33%)" name="Recettes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="depenses" fill="hsl(0, 72%, 51%)" name="Dépenses" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="objectif" stroke="hsl(38, 92%, 50%)" strokeWidth={2} strokeDasharray="5 5" name="Objectif" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by source */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sources de Recettes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { source: 'Consultations', montant: 1250000, pct: 29 },
                  { source: 'Hospitalisation', montant: 1050000, pct: 25 },
                  { source: 'Chirurgie / Bloc', montant: 850000, pct: 20 },
                  { source: 'Laboratoire', montant: 520000, pct: 12 },
                  { source: 'Imagerie', montant: 380000, pct: 9 },
                  { source: 'Pharmacie', montant: 200000, pct: 5 },
                ].map(r => (
                  <div key={r.source} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-32">{r.source}</span>
                    <div className="flex-1"><Progress value={r.pct} className="h-2" /></div>
                    <span className="text-sm font-semibold text-foreground w-28 text-right">{(r.montant / 1e6).toFixed(2)}M</span>
                    <span className="text-xs text-muted-foreground w-10">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff */}
        <TabsContent value="staff" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Stethoscope} label="Médecins en service" value="8" sub="/ 12 total" color="bg-primary" />
            <KpiCard icon={HeartPulse} label="Infirmiers en poste" value="14" sub="/ 18 total" color="bg-secondary" />
            <KpiCard icon={FlaskConical} label="Techniciens labo" value="4" sub="/ 5 total" color="bg-warning" />
            <KpiCard icon={Scissors} label="Blocs actifs" value="2" sub="/ 3 disponibles" color="bg-primary" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Personnel en Service</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Patients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STAFF_STATUS.map(s => (
                    <TableRow key={s.nom}>
                      <TableCell className="font-medium text-foreground">{s.nom}</TableCell>
                      <TableCell className="text-muted-foreground">{s.role}</TableCell>
                      <TableCell className="text-muted-foreground">{s.service}</TableCell>
                      <TableCell>
                        <Badge variant={s.statut === 'En bloc' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {s.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">{s.patients}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality */}
        <TabsContent value="quality" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Thermometer} label="Taux de mortalité" value="2.1%" sub="Semaine en cours" trend="-0.3% vs S-1" trendUp color="bg-secondary" />
            <KpiCard icon={ShieldAlert} label="Infections nosocomiales" value="10" sub="Cette semaine" trend="+2 vs S-1" trendUp={false} color="bg-destructive" />
            <KpiCard icon={Clock} label="DMS" value="4.2j" sub="Durée Moy. Séjour" trend="-0.5j vs S-1" trendUp color="bg-primary" />
            <KpiCard icon={Gauge} label="Satisfaction" value="86%" sub="Score global patients" trend="+2% vs S-1" trendUp color="bg-warning" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-destructive" />Mortalité & Infections – Semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={MORTALITY_WEEKLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis dataKey="jour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="deces" stroke="hsl(0, 72%, 51%)" strokeWidth={2} name="Décès" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="infections" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Infections nosoc." dot={{ r: 4 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Centre d'Alertes</CardTitle>
              <CardDescription>{ALERTS.length} alertes actives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ALERTS.map(a => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  a.type === 'critical' ? 'border-destructive/50 bg-destructive/5' :
                  a.type === 'warning' ? 'border-warning/50 bg-warning/5' :
                  'border-border bg-muted/30'
                }`}>
                  <a.icon className={`w-5 h-5 shrink-0 ${
                    a.type === 'critical' ? 'text-destructive' : a.type === 'warning' ? 'text-warning' : 'text-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.message}</p>
                  </div>
                  <Badge variant={a.type === 'critical' ? 'destructive' : 'outline'} className="text-[10px] shrink-0">
                    {a.time}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs shrink-0">Acquitter</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DirectorDashboard;
