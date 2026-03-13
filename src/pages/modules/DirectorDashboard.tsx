import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, BedDouble, Banknote, Activity, TrendingUp, TrendingDown,
  AlertTriangle, Clock, Stethoscope, FlaskConical, ScanLine, Pill,
  HeartPulse, Scissors, Brain, Baby, Eye, Droplets, Fingerprint,
  Zap, FileText, ArrowUpRight, ArrowDownRight, Gauge, Thermometer,
  ShieldAlert, CircleDollarSign, CalendarDays, BarChart3, PieChart as PieChartIcon,
  Calendar, Download, Printer, TrendingDown as TrendDown
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar
} from 'recharts';
import { MOCK_PATIENTS, SERVICES, PHARMACY_STOCK } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';

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

// ─── Financial Report Data ──────────────────────────────
const MONTHLY_REVENUE = [
  { mois: 'Jan', consultations: 12500000, labo: 5200000, imagerie: 3800000, pharmacie: 2000000, hospitalisation: 10500000, chirurgie: 8500000 },
  { mois: 'Fév', consultations: 11800000, labo: 4900000, imagerie: 3500000, pharmacie: 1800000, hospitalisation: 9800000, chirurgie: 7200000 },
  { mois: 'Mar', consultations: 13200000, labo: 5600000, imagerie: 4100000, pharmacie: 2200000, hospitalisation: 11200000, chirurgie: 9100000 },
  { mois: 'Avr', consultations: 12100000, labo: 5100000, imagerie: 3600000, pharmacie: 1900000, hospitalisation: 10100000, chirurgie: 8000000 },
  { mois: 'Mai', consultations: 14000000, labo: 5900000, imagerie: 4300000, pharmacie: 2400000, hospitalisation: 11800000, chirurgie: 9500000 },
  { mois: 'Jun', consultations: 13500000, labo: 5500000, imagerie: 4000000, pharmacie: 2100000, hospitalisation: 11000000, chirurgie: 8800000 },
];

const DAILY_RECEIPTS = [
  { heure: '07h', montant: 185000, nbTransactions: 3 },
  { heure: '08h', montant: 520000, nbTransactions: 8 },
  { heure: '09h', montant: 890000, nbTransactions: 14 },
  { heure: '10h', montant: 750000, nbTransactions: 11 },
  { heure: '11h', montant: 620000, nbTransactions: 9 },
  { heure: '12h', montant: 340000, nbTransactions: 5 },
  { heure: '13h', montant: 480000, nbTransactions: 7 },
  { heure: '14h', montant: 710000, nbTransactions: 10 },
  { heure: '15h', montant: 560000, nbTransactions: 8 },
  { heure: '16h', montant: 390000, nbTransactions: 6 },
  { heure: '17h', montant: 220000, nbTransactions: 3 },
];

const DISEASE_MONTHLY_TREND = [
  { mois: 'Jan', paludisme: 120, ira: 45, traumato: 30, diabete: 22, hypertension: 35, grossesses: 28 },
  { mois: 'Fév', paludisme: 95, ira: 52, traumato: 28, diabete: 25, hypertension: 38, grossesses: 31 },
  { mois: 'Mar', paludisme: 140, ira: 38, traumato: 35, diabete: 20, hypertension: 32, grossesses: 26 },
  { mois: 'Avr', paludisme: 165, ira: 30, traumato: 32, diabete: 28, hypertension: 40, grossesses: 33 },
  { mois: 'Mai', paludisme: 180, ira: 25, traumato: 38, diabete: 24, hypertension: 36, grossesses: 29 },
  { mois: 'Jun', paludisme: 155, ira: 35, traumato: 34, diabete: 26, hypertension: 42, grossesses: 35 },
];

const DISEASE_AGE_DIST = [
  { tranche: '0-5 ans', paludisme: 45, ira: 28, malnutrition: 15, diarrhee: 20 },
  { tranche: '6-14 ans', paludisme: 30, ira: 12, malnutrition: 5, diarrhee: 8 },
  { tranche: '15-30 ans', paludisme: 35, ira: 8, traumato: 22, grossesses: 28 },
  { tranche: '31-50 ans', paludisme: 25, diabete: 18, hypertension: 25, traumato: 15 },
  { tranche: '51-70 ans', paludisme: 15, diabete: 22, hypertension: 35, cardio: 18 },
  { tranche: '70+ ans', paludisme: 8, diabete: 12, hypertension: 20, cardio: 15 },
];

// ─── Component ───────────────────────────────────────────
const DirectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reportPeriod, setReportPeriod] = useState('jour');
  const { paymentReceipts, patients } = usePatientJourney();

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

  // Real receipts from payment system
  const todayReceipts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return paymentReceipts.filter(r => r.timestamp.toISOString().split('T')[0] === today);
  }, [paymentReceipts]);

  const realRevenue = useMemo(() => {
    return todayReceipts.reduce((sum, r) => sum + r.montantPaye, 0);
  }, [todayReceipts]);

  const revenueByType = useMemo(() => {
    const byType: Record<string, number> = {};
    todayReceipts.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + r.montantPaye;
    });
    return byType;
  }, [todayReceipts]);

  // Disease stats from patients
  const diseaseStats = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => {
      const pathologie = p.pathologieActuelle || 'Autre';
      counts[pathologie] = (counts[pathologie] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [patients]);

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
          <TabsTrigger value="rapports" className="gap-1.5"><FileText className="w-3.5 h-3.5" />📊 Rapports</TabsTrigger>
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

        {/* ═══════════ RAPPORTS ═══════════ */}
        <TabsContent value="rapports" className="space-y-6 mt-4">
          {/* Period selector */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">📊 Rapports Financiers & Épidémiologiques</h2>
              <p className="text-sm text-muted-foreground">Analyse journalière et périodique des recettes et pathologies</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">📅 Aujourd'hui</SelectItem>
                  <SelectItem value="semaine">📆 Cette semaine</SelectItem>
                  <SelectItem value="mois">🗓️ Ce mois</SelectItem>
                  <SelectItem value="trimestre">📊 Ce trimestre</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Printer className="w-3 h-3" /> Imprimer
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Download className="w-3 h-3" /> Exporter
              </Button>
            </div>
          </div>

          {/* Financial KPIs for period */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              icon={Banknote} 
              label={reportPeriod === 'jour' ? "Recettes du jour" : reportPeriod === 'semaine' ? "Recettes semaine" : reportPeriod === 'mois' ? "Recettes mois" : "Recettes trimestre"}
              value={reportPeriod === 'jour' ? '4.25M' : reportPeriod === 'semaine' ? '21.1M' : reportPeriod === 'mois' ? '89.2M' : '256.8M'}
              sub="FCFA"
              trend={reportPeriod === 'jour' ? '+11.8% vs hier' : '+8.2% vs période précédente'}
              trendUp
              color="bg-secondary"
            />
            <KpiCard 
              icon={TrendDown} 
              label="Dépenses"
              value={reportPeriod === 'jour' ? '2.1M' : reportPeriod === 'semaine' ? '11.5M' : reportPeriod === 'mois' ? '48.6M' : '142.3M'}
              sub="FCFA"
              trend="+3.1%"
              trendUp={false}
              color="bg-destructive"
            />
            <KpiCard 
              icon={TrendingUp} 
              label="Marge nette"
              value={reportPeriod === 'jour' ? '2.15M' : reportPeriod === 'semaine' ? '9.6M' : reportPeriod === 'mois' ? '40.6M' : '114.5M'}
              sub={`FCFA (${reportPeriod === 'jour' ? '50.6' : '45.5'}%)`}
              trend="+15%"
              trendUp
              color="bg-primary"
            />
            <KpiCard 
              icon={Users} 
              label="Patients traités"
              value={reportPeriod === 'jour' ? totalPatients.toString() : reportPeriod === 'semaine' ? '187' : reportPeriod === 'mois' ? '812' : '2,438'}
              sub={`${urgences} urgences P1/P2`}
              trend="+12%"
              trendUp
              color="bg-warning"
            />
          </div>

          {/* Daily Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-secondary" />
                  Recettes par heure – Aujourd'hui
                </CardTitle>
                <CardDescription>Évolution des encaissements en temps réel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={DAILY_RECEIPTS}>
                    <defs>
                      <linearGradient id="gradRecettes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152, 100%, 33%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(152, 100%, 33%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                    <XAxis dataKey="heure" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e3).toFixed(0)}K`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 8, fontSize: 12 }} 
                      formatter={(v: number, name: string) => [
                        name === 'montant' ? `${(v / 1e3).toFixed(0)}K FCFA` : v,
                        name === 'montant' ? 'Recettes' : 'Transactions'
                      ]} 
                    />
                    <Area type="monotone" dataKey="montant" stroke="hsl(152, 100%, 33%)" fill="url(#gradRecettes)" strokeWidth={2} name="montant" />
                    <Bar dataKey="nbTransactions" fill="hsl(199, 100%, 36%)" opacity={0.3} name="nbTransactions" />
                    <Legend formatter={(value) => value === 'montant' ? 'Recettes' : 'Nb transactions'} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Source - Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                  Répartition des recettes par source
                </CardTitle>
                <CardDescription>Ventilation {reportPeriod === 'jour' ? "journalière" : reportPeriod === 'semaine' ? "hebdomadaire" : "mensuelle"}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Consultations', value: 1250000, color: 'hsl(199, 100%, 36%)' },
                        { name: 'Hospitalisation', value: 1050000, color: 'hsl(152, 100%, 33%)' },
                        { name: 'Chirurgie', value: 850000, color: 'hsl(0, 72%, 51%)' },
                        { name: 'Laboratoire', value: 520000, color: 'hsl(38, 92%, 50%)' },
                        { name: 'Imagerie', value: 380000, color: 'hsl(270, 60%, 50%)' },
                        { name: 'Pharmacie', value: 200000, color: 'hsl(320, 70%, 50%)' },
                      ]}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { color: 'hsl(199, 100%, 36%)' },
                        { color: 'hsl(152, 100%, 33%)' },
                        { color: 'hsl(0, 72%, 51%)' },
                        { color: 'hsl(38, 92%, 50%)' },
                        { color: 'hsl(270, 60%, 50%)' },
                        { color: 'hsl(320, 70%, 50%)' },
                      ].map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${(v / 1e6).toFixed(2)}M FCFA`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-secondary" />
                Évolution des recettes mensuelles par source
              </CardTitle>
              <CardDescription>6 derniers mois – Toutes sources confondues</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={MONTHLY_REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${(v / 1e6).toFixed(2)}M FCFA`} />
                  <Bar dataKey="consultations" stackId="a" fill="hsl(199, 100%, 36%)" name="Consultations" />
                  <Bar dataKey="hospitalisation" stackId="a" fill="hsl(152, 100%, 33%)" name="Hospitalisation" />
                  <Bar dataKey="chirurgie" stackId="a" fill="hsl(0, 72%, 51%)" name="Chirurgie" />
                  <Bar dataKey="labo" stackId="a" fill="hsl(38, 92%, 50%)" name="Laboratoire" />
                  <Bar dataKey="imagerie" stackId="a" fill="hsl(270, 60%, 50%)" name="Imagerie" />
                  <Bar dataKey="pharmacie" stackId="a" fill="hsl(320, 70%, 50%)" name="Pharmacie" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receipts Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Détail des recettes – Aujourd'hui
              </CardTitle>
              <CardDescription>
                {todayReceipts.length > 0 
                  ? `${todayReceipts.length} reçu(s) émis · Total: ${(realRevenue / 1e3).toFixed(0)}K FCFA` 
                  : 'Recettes simulées + reçus réels du système'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Nb transactions</TableHead>
                    <TableHead className="text-right">Montant (FCFA)</TableHead>
                    <TableHead className="text-right">% du total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { source: 'Consultations', nb: 42, montant: 1250000 },
                    { source: 'Hospitalisation', nb: 8, montant: 1050000 },
                    { source: 'Chirurgie / Bloc', nb: 3, montant: 850000 },
                    { source: 'Laboratoire', nb: 28, montant: 520000 },
                    { source: 'Imagerie', nb: 12, montant: 380000 },
                    { source: 'Pharmacie', nb: 35, montant: 200000 },
                  ].map(r => (
                    <TableRow key={r.source}>
                      <TableCell className="font-medium text-foreground">{r.source}</TableCell>
                      <TableCell className="text-muted-foreground">{r.nb}</TableCell>
                      <TableCell className="text-right font-semibold text-foreground">{(r.montant / 1e3).toFixed(0)}K</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-[10px]">
                          {Math.round((r.montant / 4250000) * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell className="text-foreground font-bold">TOTAL</TableCell>
                    <TableCell className="text-foreground font-bold">128</TableCell>
                    <TableCell className="text-right text-foreground font-bold">4,250K</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-secondary text-secondary-foreground text-[10px]">100%</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ─── Disease Statistics ─── */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              🦠 Statistiques Épidémiologiques
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disease Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-destructive" />
                  Tendance des pathologies – 6 mois
                </CardTitle>
                <CardDescription>Évolution du nombre de cas par pathologie</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={DISEASE_MONTHLY_TREND}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="paludisme" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Paludisme" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ira" stroke="hsl(199, 100%, 36%)" strokeWidth={2} name="Infect. Resp." dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="traumato" stroke="hsl(0, 72%, 51%)" strokeWidth={2} name="Traumatologie" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="diabete" stroke="hsl(270, 60%, 50%)" strokeWidth={2} name="Diabète" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="hypertension" stroke="hsl(152, 100%, 33%)" strokeWidth={2} name="Hypertension" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="grossesses" stroke="hsl(320, 70%, 50%)" strokeWidth={2} name="Grossesses" dot={{ r: 3 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Disease by Age */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Pathologies par tranche d'âge
                </CardTitle>
                <CardDescription>Distribution des cas par groupe démographique</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={DISEASE_AGE_DIST}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                    <XAxis dataKey="tranche" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="paludisme" fill="hsl(38, 92%, 50%)" name="Paludisme" />
                    <Bar dataKey="ira" fill="hsl(199, 100%, 36%)" name="IRA" />
                    <Bar dataKey="diabete" fill="hsl(270, 60%, 50%)" name="Diabète" />
                    <Bar dataKey="hypertension" fill="hsl(152, 100%, 33%)" name="HTA" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Current Patients Pathology Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Répartition actuelle des pathologies
              </CardTitle>
              <CardDescription>Patients actuellement pris en charge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {diseaseStats.slice(0, 9).map((d, i) => {
                  const colors = [
                    'bg-warning/10 text-warning border-warning/30',
                    'bg-destructive/10 text-destructive border-destructive/30',
                    'bg-primary/10 text-primary border-primary/30',
                    'bg-secondary/10 text-secondary border-secondary/30',
                  ];
                  return (
                    <div key={d.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${colors[i % colors.length]}`}>
                          {d.value}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">{Math.round((d.value / patients.length) * 100)}% des patients</p>
                        </div>
                      </div>
                      <Progress value={(d.value / patients.length) * 100} className="w-20 h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Diseases Summary Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-warning" />
                Top 10 des maladies – Résumé périodique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Pathologie</TableHead>
                    <TableHead className="text-center">Cas ce mois</TableHead>
                    <TableHead className="text-center">Mois précédent</TableHead>
                    <TableHead className="text-center">Tendance</TableHead>
                    <TableHead className="text-center">Létalité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { pathologie: 'Paludisme', casMois: 155, moisPrec: 180, letalite: '0.8%' },
                    { pathologie: 'Infections respiratoires', casMois: 35, moisPrec: 25, letalite: '1.2%' },
                    { pathologie: 'Hypertension artérielle', casMois: 42, moisPrec: 36, letalite: '0.5%' },
                    { pathologie: 'Traumatologie', casMois: 34, moisPrec: 38, letalite: '2.1%' },
                    { pathologie: 'Grossesses à risque', casMois: 35, moisPrec: 29, letalite: '0.3%' },
                    { pathologie: 'Diabète', casMois: 26, moisPrec: 24, letalite: '0.4%' },
                    { pathologie: 'Diarrhées aiguës', casMois: 22, moisPrec: 28, letalite: '1.5%' },
                    { pathologie: 'Malnutrition', casMois: 18, moisPrec: 20, letalite: '3.2%' },
                    { pathologie: 'Méningite', casMois: 8, moisPrec: 12, letalite: '8.5%' },
                    { pathologie: 'Tuberculose', casMois: 6, moisPrec: 7, letalite: '4.1%' },
                  ].map((row, i) => {
                    const trend = row.casMois - row.moisPrec;
                    return (
                      <TableRow key={row.pathologie}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium text-foreground">{row.pathologie}</TableCell>
                        <TableCell className="text-center font-semibold text-foreground">{row.casMois}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{row.moisPrec}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] gap-0.5 ${
                            trend > 0 ? 'border-destructive/50 text-destructive' : trend < 0 ? 'border-secondary/50 text-secondary' : 'border-border text-muted-foreground'
                          }`}>
                            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                            {trend > 0 ? '+' : ''}{trend}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={parseFloat(row.letalite) > 3 ? 'destructive' : 'outline'} className="text-[10px]">
                            {row.letalite}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
