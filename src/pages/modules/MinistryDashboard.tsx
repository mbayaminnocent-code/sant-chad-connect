import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Activity, Users, BedDouble, Banknote, AlertTriangle, Shield, TrendingUp,
  Building2, MapPin, Thermometer, Bug, Zap, Globe, FileText, ArrowUpRight,
  ArrowDownRight, HeartPulse, Baby, Droplets, Eye, Brain, Stethoscope,
  BarChart3, PieChart as PieChartIcon, Clock, ShieldAlert, Syringe
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// ─── National Data ───────────────────────────────────────
const HOSPITALS = [
  { id: 1, nom: 'CHU La Renaissance', ville: 'N\'Djamena', region: 'Ouest', recettes: 4250000, lits: 145, litsOccupes: 118, patients: 127, personnel: 285, urgences: 23, deces: 2, satisfaction: 86, alerte: false },
  { id: 2, nom: 'HNR N\'Djamena', ville: 'N\'Djamena', region: 'Ouest', recettes: 3180000, lits: 120, litsOccupes: 98, patients: 98, personnel: 210, urgences: 18, deces: 3, satisfaction: 78, alerte: true },
  { id: 3, nom: 'CHU Moundou', ville: 'Moundou', region: 'Sud', recettes: 1980000, lits: 95, litsOccupes: 62, patients: 74, personnel: 165, urgences: 12, deces: 1, satisfaction: 82, alerte: false },
  { id: 4, nom: 'HN Sarh', ville: 'Sarh', region: 'Sud-Est', recettes: 1450000, lits: 80, litsOccupes: 58, patients: 62, personnel: 130, urgences: 15, deces: 4, satisfaction: 71, alerte: true },
  { id: 5, nom: 'HN Abéché', ville: 'Abéché', region: 'Est', recettes: 1120000, lits: 90, litsOccupes: 70, patients: 55, personnel: 140, urgences: 20, deces: 5, satisfaction: 65, alerte: true },
];

const EPIDEMIC_DATA = [
  { maladie: 'Méningite', cas: 47, deces: 8, regions: ['Abéché', 'Sarh', 'N\'Djamena'], tendance: 'hausse', seuil: 'Dépassé', color: 'hsl(0, 72%, 51%)' },
  { maladie: 'Paludisme', cas: 1250, deces: 23, regions: ['Toutes'], tendance: 'stable', seuil: 'Normal', color: 'hsl(38, 92%, 50%)' },
  { maladie: 'Choléra', cas: 12, deces: 2, regions: ['Sarh', 'Moundou'], tendance: 'baisse', seuil: 'Surveillance', color: 'hsl(199, 100%, 36%)' },
  { maladie: 'Rougeole', cas: 85, deces: 4, regions: ['Abéché', 'N\'Djamena'], tendance: 'hausse', seuil: 'Alerte', color: 'hsl(320, 70%, 50%)' },
  { maladie: 'Tuberculose', cas: 34, deces: 3, regions: ['N\'Djamena', 'Moundou'], tendance: 'stable', seuil: 'Normal', color: 'hsl(152, 100%, 33%)' },
];

const MONTHLY_TREND = [
  { mois: 'Sep', patients: 1850, deces: 42, recettes: 45 },
  { mois: 'Oct', patients: 2100, deces: 38, recettes: 52 },
  { mois: 'Nov', patients: 2350, deces: 45, recettes: 48 },
  { mois: 'Déc', patients: 1980, deces: 35, recettes: 55 },
  { mois: 'Jan', patients: 2500, deces: 50, recettes: 51 },
  { mois: 'Fév', patients: 2200, deces: 40, recettes: 58 },
  { mois: 'Mar', patients: 2416, deces: 15, recettes: 60 },
];

const RESOURCE_DIST = [
  { name: 'Personnel médical', value: 40 },
  { name: 'Médicaments', value: 25 },
  { name: 'Équipements', value: 15 },
  { name: 'Infrastructure', value: 12 },
  { name: 'Formation', value: 8 },
];
const PIE_COLORS = ['hsl(199, 100%, 36%)', 'hsl(152, 100%, 33%)', 'hsl(38, 92%, 50%)', 'hsl(320, 70%, 50%)', 'hsl(270, 60%, 50%)'];

const REGION_RADAR = [
  { region: 'N\'Djamena', lits: 85, personnel: 90, equipement: 75, satisfaction: 82 },
  { region: 'Moundou', lits: 65, personnel: 60, equipement: 55, satisfaction: 82 },
  { region: 'Sarh', lits: 72, personnel: 55, equipement: 40, satisfaction: 71 },
  { region: 'Abéché', lits: 78, personnel: 50, equipement: 35, satisfaction: 65 },
  { region: 'Bongor', lits: 45, personnel: 40, equipement: 30, satisfaction: 60 },
];

const VACCINATION_DATA = [
  { vaccin: 'BCG', couverture: 82, objectif: 95 },
  { vaccin: 'Polio', couverture: 78, objectif: 95 },
  { vaccin: 'Rougeole', couverture: 65, objectif: 90 },
  { vaccin: 'DTC-HepB', couverture: 71, objectif: 90 },
  { vaccin: 'Fièvre Jaune', couverture: 58, objectif: 85 },
  { vaccin: 'COVID-19', couverture: 22, objectif: 70 },
];

// ─── Component ───────────────────────────────────────────
const MinistryDashboard = () => {
  const [tab, setTab] = useState('national');

  const totalPatients = HOSPITALS.reduce((s, h) => s + h.patients, 0);
  const totalRevenue = HOSPITALS.reduce((s, h) => s + h.recettes, 0);
  const totalBeds = HOSPITALS.reduce((s, h) => s + h.lits, 0);
  const totalOccupied = HOSPITALS.reduce((s, h) => s + h.litsOccupes, 0);
  const totalDeaths = HOSPITALS.reduce((s, h) => s + h.deces, 0);
  const totalStaff = HOSPITALS.reduce((s, h) => s + h.personnel, 0);
  const avgSatisfaction = Math.round(HOSPITALS.reduce((s, h) => s + h.satisfaction, 0) / HOSPITALS.length);
  const bedRate = Math.round((totalOccupied / totalBeds) * 100);
  const activeAlerts = HOSPITALS.filter(h => h.alerte).length;
  const epidemicAlerts = EPIDEMIC_DATA.filter(e => e.seuil === 'Dépassé' || e.seuil === 'Alerte').length;

  const KpiCard = ({ icon: Icon, label, value, sub, trend, trendUp, color }: any) => (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-0.5">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-extrabold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-secondary' : 'text-destructive'}`}>
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
            🇹🇩 Dashboard National — Ministère de la Santé Publique
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue consolidée de {HOSPITALS.length} hôpitaux nationaux • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-secondary text-secondary-foreground gap-1 px-3 py-1">
            <Globe className="w-3 h-3" /> Réseau national
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1">
            <Clock className="w-3 h-3" /> Sync: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </div>

      {/* Epidemic Alert */}
      {epidemicAlerts > 0 && (
        <Card className="border-destructive/60 border-2 bg-gradient-to-r from-destructive/10 to-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-base font-bold text-destructive">🚨 ALERTES ÉPIDÉMIQUES NATIONALES</p>
                <p className="text-xs text-muted-foreground">{epidemicAlerts} maladies en alerte — Action immédiate requise</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {EPIDEMIC_DATA.filter(e => e.seuil === 'Dépassé' || e.seuil === 'Alerte').map(e => (
                <div key={e.maladie} className="flex items-center gap-3 p-2 rounded-lg bg-card/50">
                  <Bug className="w-4 h-4 text-destructive" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">{e.maladie}</span>
                    <span className="text-xs text-muted-foreground ml-2">{e.cas} cas • {e.deces} décès • {e.regions.join(', ')}</span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">{e.seuil}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Patients totaux" value={totalPatients} sub={`${HOSPITALS.reduce((s,h)=>s+h.urgences,0)} urgences`} trend="+6% vs mois dernier" trendUp color="bg-primary" />
        <KpiCard icon={Banknote} label="Recettes nationales" value={`${(totalRevenue/1e6).toFixed(1)}M`} sub="FCFA / jour" trend="+12% vs M-1" trendUp color="bg-secondary" />
        <KpiCard icon={BedDouble} label="Occupation lits" value={`${bedRate}%`} sub={`${totalOccupied}/${totalBeds}`} trend={bedRate > 80 ? '⚠ Capacité tendue' : 'Normal'} trendUp={bedRate <= 80} color="bg-warning" />
        <KpiCard icon={ShieldAlert} label="Alertes actives" value={activeAlerts + epidemicAlerts} sub={`${activeAlerts} hôpitaux + ${epidemicAlerts} épidémies`} trend="Intervention requise" trendUp={false} color="bg-destructive" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="national" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Vue nationale</TabsTrigger>
          <TabsTrigger value="hospitals" className="gap-1.5"><Building2 className="w-3.5 h-3.5" />Hôpitaux</TabsTrigger>
          <TabsTrigger value="epidemics" className="gap-1.5"><Bug className="w-3.5 h-3.5" />Épidémies</TabsTrigger>
          <TabsTrigger value="vaccination" className="gap-1.5"><Syringe className="w-3.5 h-3.5" />Vaccination</TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5"><PieChartIcon className="w-3.5 h-3.5" />Ressources</TabsTrigger>
        </TabsList>

        {/* National Overview */}
        <TabsContent value="national" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Tendance Nationale – 7 Mois</CardTitle>
                <CardDescription>Patients, décès et recettes consolidées</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={MONTHLY_TREND}>
                    <defs>
                      <linearGradient id="gPat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(199, 100%, 36%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(199, 100%, 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="patients" stroke="hsl(199, 100%, 36%)" fill="url(#gPat)" strokeWidth={2} name="Patients" />
                    <Line type="monotone" dataKey="deces" stroke="hsl(0, 72%, 51%)" strokeWidth={2} name="Décès" dot={{ r: 3 }} />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Capacité Régionale</CardTitle>
                <CardDescription>Comparaison multi-critères par région</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={REGION_RADAR}>
                    <PolarGrid stroke="hsl(210, 15%, 89%)" />
                    <PolarAngleAxis dataKey="region" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Lits" dataKey="lits" stroke="hsl(199, 100%, 36%)" fill="hsl(199, 100%, 36%)" fillOpacity={0.15} />
                    <Radar name="Personnel" dataKey="personnel" stroke="hsl(152, 100%, 33%)" fill="hsl(152, 100%, 33%)" fillOpacity={0.15} />
                    <Radar name="Équipement" dataKey="equipement" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.15} />
                    <Legend />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Carte épidémique améliorée */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Carte Sanitaire Nationale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {HOSPITALS.map(h => {
                  const occ = Math.round((h.litsOccupes / h.lits) * 100);
                  return (
                    <div key={h.id} className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                      h.alerte ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'
                    }`}>
                      {h.alerte && (
                        <div className="absolute -top-1.5 -right-1.5">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
                          </span>
                        </div>
                      )}
                      <div className="text-center space-y-2">
                        <Building2 className={`w-8 h-8 mx-auto ${h.alerte ? 'text-destructive' : 'text-primary'}`} />
                        <p className="text-xs font-bold text-foreground leading-tight">{h.nom}</p>
                        <p className="text-[10px] text-muted-foreground">{h.ville}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Lits</span>
                            <span className="font-medium text-foreground">{occ}%</span>
                          </div>
                          <Progress value={occ} className="h-1.5" />
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Patients</span>
                          <span className="font-bold text-foreground">{h.patients}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Satisfaction</span>
                          <span className={`font-bold ${h.satisfaction >= 80 ? 'text-secondary' : h.satisfaction >= 70 ? 'text-warning' : 'text-destructive'}`}>
                            {h.satisfaction}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* KPIs additionnels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Stethoscope} label="Personnel total" value={totalStaff} sub="Tous hôpitaux" color="bg-primary" />
            <KpiCard icon={HeartPulse} label="Satisfaction moy." value={`${avgSatisfaction}%`} sub="Score national" trend={avgSatisfaction >= 80 ? 'Acceptable' : 'À améliorer'} trendUp={avgSatisfaction >= 80} color="bg-secondary" />
            <KpiCard icon={Thermometer} label="Décès semaine" value={totalDeaths} sub="Tous hôpitaux" trend="Taux: 1.8%" trendUp={false} color="bg-destructive" />
            <KpiCard icon={Building2} label="Hôpitaux connectés" value={`${HOSPITALS.length}/5`} sub="100% en ligne" trend="Starlink actif" trendUp color="bg-primary" />
          </div>
        </TabsContent>

        {/* Hospitals Detail */}
        <TabsContent value="hospitals" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Comparaison des Hôpitaux</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={HOSPITALS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis dataKey="nom" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="patients" fill="hsl(199, 100%, 36%)" name="Patients" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="urgences" fill="hsl(0, 72%, 51%)" name="Urgences" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="personnel" fill="hsl(152, 100%, 33%)" name="Personnel" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Détail par Hôpital</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hôpital</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead className="text-center">Patients</TableHead>
                    <TableHead className="text-center">Lits</TableHead>
                    <TableHead className="text-center">Personnel</TableHead>
                    <TableHead className="text-center">Satisfaction</TableHead>
                    <TableHead className="text-right">Recettes</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HOSPITALS.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium text-foreground">{h.nom}</TableCell>
                      <TableCell className="text-muted-foreground">{h.region}</TableCell>
                      <TableCell className="text-center text-foreground">{h.patients}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-foreground">{h.litsOccupes}/{h.lits}</span>
                        <span className="text-muted-foreground text-xs ml-1">({Math.round(h.litsOccupes/h.lits*100)}%)</span>
                      </TableCell>
                      <TableCell className="text-center text-foreground">{h.personnel}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={h.satisfaction >= 80 ? 'secondary' : h.satisfaction >= 70 ? 'outline' : 'destructive'} className="text-[10px]">
                          {h.satisfaction}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-secondary">{(h.recettes/1e6).toFixed(1)}M</TableCell>
                      <TableCell className="text-center">
                        {h.alerte ? (
                          <Badge variant="destructive" className="text-[10px] gap-1"><AlertTriangle className="w-3 h-3" />Alerte</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Epidemics */}
        <TabsContent value="epidemics" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EPIDEMIC_DATA.map(e => (
              <Card key={e.maladie} className={`${e.seuil === 'Dépassé' ? 'border-destructive/50 border-2' : e.seuil === 'Alerte' ? 'border-warning/50 border-2' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bug className="w-5 h-5" style={{ color: e.color }} />
                      <h4 className="text-base font-bold text-foreground">{e.maladie}</h4>
                    </div>
                    <Badge variant={e.seuil === 'Dépassé' ? 'destructive' : e.seuil === 'Alerte' ? 'outline' : 'secondary'} className="text-[10px]">
                      {e.seuil}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-2xl font-extrabold text-foreground">{e.cas}</p>
                      <p className="text-[10px] text-muted-foreground">Cas actifs</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-destructive/10">
                      <p className="text-2xl font-extrabold text-destructive">{e.deces}</p>
                      <p className="text-[10px] text-muted-foreground">Décès</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tendance</span>
                      <Badge variant={e.tendance === 'hausse' ? 'destructive' : e.tendance === 'baisse' ? 'secondary' : 'outline'} className="text-[10px]">
                        {e.tendance === 'hausse' ? '📈 Hausse' : e.tendance === 'baisse' ? '📉 Baisse' : '➡️ Stable'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Régions</span>
                      <span className="text-foreground text-[10px]">{e.regions.join(', ')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Létalité</span>
                      <span className="text-foreground font-medium">{e.cas > 0 ? ((e.deces / e.cas) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-destructive" />Évolution Épidémique Nationale</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[
                  { sem: 'S-6', meningite: 5, paludisme: 180, cholera: 25, rougeole: 10 },
                  { sem: 'S-5', meningite: 8, paludisme: 195, cholera: 20, rougeole: 18 },
                  { sem: 'S-4', meningite: 12, paludisme: 175, cholera: 18, rougeole: 30 },
                  { sem: 'S-3', meningite: 20, paludisme: 185, cholera: 15, rougeole: 45 },
                  { sem: 'S-2', meningite: 35, paludisme: 190, cholera: 14, rougeole: 60 },
                  { sem: 'S-1', meningite: 42, paludisme: 188, cholera: 13, rougeole: 75 },
                  { sem: 'Actuel', meningite: 47, paludisme: 180, cholera: 12, rougeole: 85 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="meningite" stroke="hsl(0, 72%, 51%)" strokeWidth={2} name="Méningite" />
                  <Line type="monotone" dataKey="rougeole" stroke="hsl(320, 70%, 50%)" strokeWidth={2} name="Rougeole" />
                  <Line type="monotone" dataKey="cholera" stroke="hsl(199, 100%, 36%)" strokeWidth={2} name="Choléra" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vaccination */}
        <TabsContent value="vaccination" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Syringe className="w-4 h-4 text-primary" />Couverture Vaccinale Nationale</CardTitle>
              <CardDescription>Taux de couverture vs objectifs OMS</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={VACCINATION_DATA} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="vaccin" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="couverture" name="Couverture actuelle" radius={[0, 4, 4, 0]}>
                    {VACCINATION_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.couverture >= entry.objectif ? 'hsl(152, 100%, 33%)' : entry.couverture >= entry.objectif * 0.8 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)'} />
                    ))}
                  </Bar>
                  <Bar dataKey="objectif" fill="hsl(210, 15%, 89%)" name="Objectif OMS" radius={[0, 4, 4, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {VACCINATION_DATA.map(v => {
              const met = v.couverture >= v.objectif;
              return (
                <Card key={v.vaccin} className={`${met ? '' : 'border-warning/50'}`}>
                  <CardContent className="p-4 text-center">
                    <Syringe className={`w-6 h-6 mx-auto mb-2 ${met ? 'text-secondary' : 'text-warning'}`} />
                    <p className="text-xs font-bold text-foreground">{v.vaccin}</p>
                    <p className={`text-2xl font-extrabold ${met ? 'text-secondary' : v.couverture >= v.objectif * 0.8 ? 'text-warning' : 'text-destructive'}`}>
                      {v.couverture}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Objectif: {v.objectif}%</p>
                    <Progress value={v.couverture} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-primary" />Allocation Budgétaire</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={RESOURCE_DIST} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {RESOURCE_DIST.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Répartition Personnel par Hôpital</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={HOSPITALS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 89%)" />
                    <XAxis dataKey="ville" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="personnel" fill="hsl(199, 100%, 36%)" name="Personnel" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recettes par Hôpital – Comparaison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {HOSPITALS.sort((a, b) => b.recettes - a.recettes).map(h => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className="text-sm text-foreground w-40 truncate">{h.nom}</span>
                    <div className="flex-1"><Progress value={(h.recettes / HOSPITALS[0].recettes) * 100} className="h-2.5" /></div>
                    <span className="text-sm font-bold text-secondary w-20 text-right">{(h.recettes / 1e6).toFixed(1)}M</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinistryDashboard;
