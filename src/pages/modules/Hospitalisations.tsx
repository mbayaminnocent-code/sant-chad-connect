import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MOCK_PATIENTS, SERVICES } from '@/data/mockData';
import { BedDouble, Users, Clock, AlertTriangle } from 'lucide-react';

const Hospitalisations = () => {
  const hospitalises = MOCK_PATIENTS.filter(p => p.hospitalisations.some(h => h.statut === 'actif'));

  const bedsByService: Record<string, { total: number; occupied: number }> = {
    'Réanimation': { total: 8, occupied: 3 },
    'Pédiatrie': { total: 20, occupied: 14 },
    'Maternité': { total: 15, occupied: 11 },
    'Médecine Interne': { total: 30, occupied: 22 },
    'Chirurgie': { total: 25, occupied: 18 },
    'Neurologie': { total: 12, occupied: 8 },
    'Cardiologie': { total: 10, occupied: 7 },
    'Oncologie': { total: 8, occupied: 5 },
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hospitalisations</h1>
        <p className="text-muted-foreground text-sm">Gestion des admissions et occupation des lits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients hospitalisés', value: String(hospitalises.length + 18), icon: Users, color: 'text-primary' },
          { label: 'Lits occupés', value: '88/128', icon: BedDouble, color: 'text-warning' },
          { label: 'Admissions aujourd\'hui', value: '5', icon: Clock, color: 'text-secondary' },
          { label: 'Sorties prévues', value: '3', icon: AlertTriangle, color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-6 h-6 ${s.color}`} />
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bed occupancy */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BedDouble className="w-4 h-4" /> Occupation des Lits par Service</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(bedsByService).map(([service, data]) => {
              const ratio = (data.occupied / data.total) * 100;
              return (
                <div key={service} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-medium">{service}</span>
                    <span className={`text-xs ${ratio > 85 ? 'text-destructive' : ratio > 70 ? 'text-warning' : 'text-secondary'}`}>
                      {data.occupied}/{data.total} ({Math.round(ratio)}%)
                    </span>
                  </div>
                  <Progress value={ratio} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Hospitalized patients */}
        <Card>
          <CardHeader><CardTitle className="text-base">Patients Hospitalisés</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {hospitalises.map(p => {
              const h = p.hospitalisations.find(h => h.statut === 'actif');
              return h ? (
                <div key={p.id} className="p-3 rounded-lg border border-border">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <Badge variant="default" className="text-xs">Lit {h.lit}</Badge>
                  </div>
                  <p className="text-xs text-primary">{h.motif}</p>
                  <p className="text-xs text-muted-foreground">{h.service} • Depuis le {h.dateAdmission}</p>
                </div>
              ) : null;
            })}
          </CardContent>
        </Card>
      </div>

      {/* IA prediction */}
      <Card className="border-primary/30 bg-accent/30">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground">🤖 Prédiction IA – Flux d'hospitalisations</p>
          <p className="text-sm text-foreground mt-1">Pic d'admissions prévu en Réanimation dans les 48h (saison méningite). Recommandation: préparer 3 lits supplémentaires et alerter l'équipe de garde.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Hospitalisations;
