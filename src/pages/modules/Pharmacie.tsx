import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PHARMACY_STOCK } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { Pill, AlertTriangle, TrendingDown, CheckCircle, Package, Send } from 'lucide-react';
import { toast } from 'sonner';

const Pharmacie = () => {
  const { patients, advancePatient, getPatientsByStep } = usePatientJourney();
  const patientsAtPharmacy = getPatientsByStep('pharmacie');
  const pendingPrescriptions = patients.flatMap(p => p.prescriptions.filter(pr => pr.statut === 'en_attente').map(pr => ({ ...pr, patient: `${p.prenom} ${p.nom}`, nhid: p.nhid, patientId: p.id })));
  const lowStock = PHARMACY_STOCK.filter(s => s.stock <= s.seuil);

  const handleDeliver = (patientId: string, patientName: string) => {
    advancePatient(patientId, 'sorti', 'Pharmacie', `Médicaments délivrés – Sortie du patient`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacie</h1>
        <p className="text-muted-foreground text-sm">Gestion des stocks FEFO et dispensation électronique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients à la pharmacie', value: String(patientsAtPharmacy.length), icon: Pill, color: 'text-primary' },
          { label: 'Ordonnances en attente', value: String(pendingPrescriptions.length + 3), icon: Pill, color: 'text-warning' },
          { label: 'Alertes stock', value: String(lowStock.length), icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Références en stock', value: String(PHARMACY_STOCK.length), icon: Package, color: 'text-secondary' },
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

      {/* Patients at pharmacy with journey */}
      {patientsAtPharmacy.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">💊 Patients à la Pharmacie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patientsAtPharmacy.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.pathologieActuelle}</p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 h-7" onClick={() => handleDeliver(p.id, `${p.prenom} ${p.nom}`)}>
                    <Send className="w-3 h-3" /> Délivrer & Sortie
                  </Button>
                </div>
                <PatientJourneyTracker patientId={p.id} showEvents />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Ordonnances à Délivrer</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pendingPrescriptions.map(pr => (
              <div key={pr.id} className="p-3 rounded-lg border border-border">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{pr.patient} ({pr.nhid})</p>
                  <Badge variant="secondary" className="text-xs">En attente</Badge>
                </div>
                {pr.medicaments.map((m, i) => (
                  <p key={i} className="text-xs text-foreground">• {m.nom} – {m.dosage} – {m.frequence} – {m.duree}</p>
                ))}
                <Button size="sm" className="h-7 text-xs mt-2 gap-1" onClick={() => handleDeliver(pr.patientId, pr.patient)}>
                  <CheckCircle className="w-3 h-3" /> Délivrer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4" /> Stock FEFO</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {PHARMACY_STOCK.map(s => {
              const ratio = (s.stock / (s.seuil * 3)) * 100;
              const isLow = s.stock <= s.seuil;
              const isExpiring = new Date(s.peremption) < new Date('2025-06-01');
              return (
                <div key={s.id} className={`p-3 rounded-lg border ${isLow ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{s.nom}</p>
                    <div className="flex gap-1">
                      {isLow && <Badge variant="destructive" className="text-[10px]">Stock bas</Badge>}
                      {isExpiring && <Badge variant="outline" className="text-[10px] text-warning border-warning">Péremption proche</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Progress value={Math.min(ratio, 100)} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{s.stock}/{s.seuil * 3}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.categorie} • Péremption: {s.peremption}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-4 flex items-start gap-3">
          <TrendingDown className="w-6 h-6 text-warning mt-1" />
          <div>
            <p className="text-sm font-bold text-foreground">🤖 Alerte IA Prédictive</p>
            <p className="text-sm text-foreground">Rupture probable dans <strong>67 jours</strong> – ACT (Artéméther-Luméfantrine). Stock: 45 unités. Recommandation: Commander 500 unités.</p>
            <Button size="sm" className="mt-2 h-7 text-xs" variant="outline" onClick={() => toast.info('Bon de commande généré')}>Générer bon de commande</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pharmacie;
