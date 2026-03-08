import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scissors, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const surgeries = [
  { id: 1, patient: 'Fatimé Zara', type: 'Ostéosynthèse tibia', salle: 'Bloc A', heure: '08:00', statut: 'en_cours', chirurgien: 'Pr. Hassan Ali', risque: 'moyen' },
  { id: 2, patient: 'Youssouf Haroun', type: 'Appendicectomie', salle: 'Bloc B', heure: '10:30', statut: 'planifie', chirurgien: 'Dr. Moussa Fadil', risque: 'faible' },
  { id: 3, patient: 'Tchari Abba', type: 'Biopsie hépatique', salle: 'Bloc A', heure: '14:00', statut: 'planifie', chirurgien: 'Dr. Abakar Saleh', risque: 'élevé' },
];

const BlocOperatoire = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bloc Opératoire</h1>
        <p className="text-muted-foreground text-sm">Planification et suivi des interventions chirurgicales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Interventions aujourd\'hui', value: '3', icon: Scissors, color: 'text-primary' },
          { label: 'En cours', value: '1', icon: Clock, color: 'text-warning' },
          { label: 'Terminées', value: '0', icon: CheckCircle, color: 'text-secondary' },
          { label: 'Salles disponibles', value: '1/2', icon: Calendar, color: 'text-muted-foreground' },
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

      <div className="space-y-4">
        {surgeries.map(s => (
          <Card key={s.id} className={s.statut === 'en_cours' ? 'border-l-4 border-l-warning' : ''}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-foreground">{s.type}</p>
                  <p className="text-sm text-foreground">Patient: {s.patient}</p>
                  <p className="text-sm text-muted-foreground">Chirurgien: {s.chirurgien} • {s.salle} • {s.heure}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={s.statut === 'en_cours' ? 'default' : 'outline'}>
                    {s.statut === 'en_cours' ? '🔴 En cours' : '📅 Planifié'}
                  </Badge>
                  <Badge variant={s.risque === 'élevé' ? 'destructive' : s.risque === 'moyen' ? 'secondary' : 'outline'}>
                    Risque {s.risque}
                  </Badge>
                </div>
              </div>
              {s.risque === 'élevé' && (
                <div className="mt-2 p-2 rounded bg-destructive/10 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-destructive">⚠️ Alerte IA: Risque hémorragique élevé – Prévoir sang compatible</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info('Rapport pré-opératoire ouvert')}>Pré-op</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info('Check-list OMS vérifiée')}>Check-list OMS</Button>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.success('Rapport post-op enregistré dans le DPI')}>Post-op → DPI</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlocOperatoire;
