import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Users, BedDouble, Banknote, AlertTriangle, Shield, TrendingUp } from 'lucide-react';

const HOSPITAL_STATS = [
  { nom: 'CHU La Renaissance', recettes: 2450000, lits: 85, patients: 127, alerte: false },
  { nom: 'HNR N\'Djamena', recettes: 1870000, lits: 72, patients: 98, alerte: true },
  { nom: 'CHU Moundou', recettes: 980000, lits: 65, patients: 74, alerte: false },
  { nom: 'HN Sarh', recettes: 750000, lits: 58, patients: 62, alerte: true },
  { nom: 'HN Abéché', recettes: 620000, lits: 70, patients: 55, alerte: true },
];

const MinistryDashboard = () => {
  const totalRevenue = HOSPITAL_STATS.reduce((s, h) => s + h.recettes, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🇹🇩 Dashboard National – Ministère de la Santé</h1>
          <p className="text-muted-foreground text-sm">Vue consolidée des 5 hôpitaux nationaux • Données synchronisées à 08:45</p>
        </div>
        <Badge variant="outline" className="gap-1"><Activity className="w-3 h-3" /> Temps réel</Badge>
      </div>

      {/* Epidemic alert */}
      <Card className="border-destructive border-2 bg-destructive/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <div>
            <p className="text-lg font-bold text-destructive">🚨 ALERTE ÉPIDÉMIQUE – Méningite (Ceinture de la Méningite)</p>
            <p className="text-sm text-foreground">12 cas détectés en 72h – Seuil OMS dépassé. Zones: Abéché, Sarh, N'Djamena.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Recettes totales (jour)', value: `${(totalRevenue/1000000).toFixed(1)}M FCFA`, icon: Banknote, color: 'text-secondary' },
          { label: 'Patients totaux', value: String(HOSPITAL_STATS.reduce((s,h)=>s+h.patients,0)), icon: Users, color: 'text-primary' },
          { label: 'Taux occupation lits', value: '72%', icon: BedDouble, color: 'text-warning' },
          { label: 'Alertes actives', value: '3', icon: Shield, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
            <s.icon className={`w-6 h-6 ${s.color}`} />
            <div><p className="text-xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Hospital breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Performance des Hôpitaux</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {HOSPITAL_STATS.map(h => (
            <div key={h.nom} className="p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{h.nom}</p>
                  {h.alerte && <Badge variant="destructive" className="text-[10px]">Alerte</Badge>}
                </div>
                <span className="text-sm font-bold text-secondary">{h.recettes.toLocaleString()} FCFA</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-muted-foreground">Occupation lits</p><Progress value={h.lits} className="h-2" /></div>
                <div><p className="text-xs text-muted-foreground">Patients: {h.patients}</p><Progress value={(h.patients/150)*100} className="h-2" /></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Heatmap placeholder */}
      <Card>
        <CardHeader><CardTitle className="text-base">Carte Épidémique Nationale</CardTitle></CardHeader>
        <CardContent className="p-4">
          <div className="h-48 rounded-lg bg-muted flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">🗺️ Carte thermique du Tchad</p>
              <div className="flex gap-4 mt-3 justify-center">
                {['N\'Djamena 🟡', 'Abéché 🔴', 'Sarh 🟠', 'Moundou 🟢', 'Bongor 🟢'].map(r => (
                  <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinistryDashboard;
