import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SERVICES } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { HeartPulse, ArrowRight, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';

const urgenceColors: Record<number, string> = {
  1: 'bg-destructive text-destructive-foreground',
  2: 'bg-warning text-warning-foreground',
  3: 'bg-primary text-primary-foreground',
  4: 'bg-secondary text-secondary-foreground',
  5: 'bg-muted text-muted-foreground',
};

const Triage = () => {
  const { patients, advancePatient, getPatientsByStep } = usePatientJourney();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [triageData, setTriageData] = useState({
    tension: '', temperature: '', pouls: '', spo2: '', poids: '',
    symptomes: '', urgence: '3', serviceAssigne: 'general',
  });

  // Patients that arrived via paiement or accueil (attente/triage)
  const patientsEnAttente = patients.filter(p => ['attente', 'triage'].includes(p.statut));
  const patientsTriage = getPatientsByStep('triage');
  const patient = patients.find(p => p.id === selectedPatient);

  const handleTransfer = () => {
    if (!selectedPatient) return;
    const service = SERVICES.find(s => s.id === triageData.serviceAssigne);
    advancePatient(selectedPatient, 'consultation', 'Triage', `Orienté vers ${service?.name} – Urgence P${triageData.urgence}`);
    setSelectedPatient(null);
    setTriageData({ tension: '', temperature: '', pouls: '', spo2: '', poids: '', symptomes: '', urgence: '3', serviceAssigne: 'general' });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Triage / Poste Infirmier</h1>
        <p className="text-muted-foreground text-sm">Évaluation, tri et orientation des patients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient list */}
        <Card>
          <CardHeader><CardTitle className="text-base">Patients en attente ({patientsEnAttente.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {patientsEnAttente.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPatient(p.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all space-y-2 ${selectedPatient === p.id ? 'border-primary bg-accent' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.age} ans</p>
                  </div>
                  <Badge className={urgenceColors[p.urgence]}>U{p.urgence}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.pathologieActuelle}</p>
                <PatientJourneyTracker patientId={p.id} compact />
              </div>
            ))}
            {patientsEnAttente.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun patient en attente de triage</p>
            )}
          </CardContent>
        </Card>

        {/* Triage form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4" /> Formulaire de Triage
              {patient && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-primary">{patient.prenom} {patient.nom}</span>
                  {patient.allergies.length > 0 && (
                    <Badge variant="destructive" className="gap-1 ml-2"><AlertTriangle className="w-3 h-3" /> Allergie: {patient.allergies.join(', ')}</Badge>
                  )}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">PARCOURS DU PATIENT</p>
                <PatientJourneyTracker patientId={patient.id} showEvents />
              </div>
            )}

            {/* Vitals */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Tension (mmHg)', key: 'tension', placeholder: '120/80' },
                { label: 'Température (°C)', key: 'temperature', placeholder: '37.0' },
                { label: 'Pouls (bpm)', key: 'pouls', placeholder: '80' },
                { label: 'SpO2 (%)', key: 'spo2', placeholder: '98' },
                { label: 'Poids (kg)', key: 'poids', placeholder: '70' },
              ].map(v => (
                <div key={v.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{v.label}</label>
                  <Input placeholder={v.placeholder} value={(triageData as any)[v.key]} onChange={e => setTriageData(d => ({ ...d, [v.key]: e.target.value }))} className="h-9" />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Symptômes et motif</label>
              <Textarea placeholder="Décrivez les symptômes..." value={triageData.symptomes} onChange={e => setTriageData(d => ({ ...d, symptomes: e.target.value }))} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Niveau d'urgence</label>
                <Select value={triageData.urgence} onValueChange={v => setTriageData(d => ({ ...d, urgence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🔴 Niveau 1 – Urgence vitale</SelectItem>
                    <SelectItem value="2">🟠 Niveau 2 – Très urgent</SelectItem>
                    <SelectItem value="3">🔵 Niveau 3 – Urgent</SelectItem>
                    <SelectItem value="4">🟢 Niveau 4 – Standard</SelectItem>
                    <SelectItem value="5">⚪ Niveau 5 – Non urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Orienter vers le service</label>
                <Select value={triageData.serviceAssigne} onValueChange={v => setTriageData(d => ({ ...d, serviceAssigne: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={handleTransfer} disabled={!selectedPatient}>
              <Send className="w-4 h-4" /> Transférer au Médecin (→ Consultation)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Triage;
