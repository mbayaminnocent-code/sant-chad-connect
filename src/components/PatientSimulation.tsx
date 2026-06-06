import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { usePatientJourney, JOURNEY_STEPS, JourneyStep } from '@/contexts/PatientJourneyContext';
import { toast } from 'sonner';

interface SimStep {
  key: string;
  label: string;
  module: string;
  step?: JourneyStep;
  details: string;
}

const SIM_STEPS: SimStep[] = [
  { key: 'register', label: '🏥 Enregistrement à l\'accueil', module: 'Accueil', details: 'Patient enregistré, NHID généré' },
  { key: 'paiement-consult', label: '💰 Paiement consultation à la caisse', module: 'Facturation', step: 'paiement', details: 'Reçu N°R-CONS payé (5 000 FCFA)' },
  { key: 'triage', label: '🩺 Prise des constantes (triage)', module: 'Triage', step: 'triage', details: 'TA 130/85 - T° 38.9°C - Urgence 3' },
  { key: 'consultation', label: '👨‍⚕️ Consultation médecin', module: 'DPI', step: 'consultation', details: 'Suspicion paludisme - Examens prescrits' },
  { key: 'paiement-exam', label: '💰 Paiement examens (labo + imagerie)', module: 'Facturation', step: 'paiement', details: 'Reçus labo + imagerie payés (15 000 FCFA)' },
  { key: 'labo', label: '🔬 Analyses laboratoire', module: 'Laboratoire', step: 'labo', details: 'Goutte épaisse positive - Plasmodium falciparum' },
  { key: 'imagerie', label: '📷 Examen imagerie', module: 'Imagerie', step: 'imagerie', details: 'Radio thorax - RAS' },
  { key: 'retour-consult', label: '👨‍⚕️ Retour consultation - Diagnostic', module: 'DPI', step: 'consultation', details: 'Diagnostic confirmé - Ordonnance émise' },
  { key: 'paiement-pharma', label: '💰 Paiement pharmacie', module: 'Facturation', step: 'paiement', details: 'Reçu médicaments payé (8 500 FCFA)' },
  { key: 'pharmacie', label: '💊 Délivrance médicaments', module: 'Pharmacie', step: 'pharmacie', details: 'Artésunate + Paracétamol délivrés' },
  { key: 'hospitalise', label: '🛏️ Hospitalisation', module: 'Hospitalisations', step: 'hospitalise', details: 'Lit MI-08 - Service Médecine Interne' },
  { key: 'sorti', label: '✅ Sortie de l\'hôpital', module: 'Hospitalisations', step: 'sorti', details: 'Guéri - Sortie avec ordonnance de suivi' },
];

const PatientSimulation = () => {
  const [running, setRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const { registerNewPatient, advancePatient, addPaymentReceipt, addLabResult, addImagingResult, addPrescription } = usePatientJourney();

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const run = async () => {
    setRunning(true);
    setCurrentIdx(-1);

    const firstNames = ['Adam', 'Khadidja', 'Mahamat', 'Fatimé', 'Issa', 'Zara'];
    const lastNames = ['Hassan', 'Idriss', 'Brahim', 'Saleh', 'Oumar'];
    const prenom = firstNames[Math.floor(Math.random() * firstNames.length)];
    const nom = lastNames[Math.floor(Math.random() * lastNames.length)];
    setPatientName(`${prenom} ${nom}`);

    // Step 0: register
    setCurrentIdx(0);
    const patient = registerNewPatient({ nom, prenom, age: 28 + Math.floor(Math.random() * 30), telephone: '+235 66 00 00 00' });
    setPatientId(patient.id);
    await sleep(1500);

    // 1: Paiement consultation
    setCurrentIdx(1);
    advancePatient(patient.id, 'paiement', 'Accueil', 'Envoi à la caisse');
    await sleep(800);
    addPaymentReceipt({
      id: `rcpt-c-${Date.now()}`, patientId: patient.id, patientName: `${prenom} ${nom}`, nhid: patient.nhid,
      type: 'consultation', items: [{ label: 'Consultation générale', montant: 5000 }],
      totalMontant: 5000, montantPaye: 5000, modePaiement: 'Espèces', timestamp: new Date(), caissier: 'Amina Hassan',
    });
    await sleep(1000);

    // 2: Triage
    setCurrentIdx(2);
    advancePatient(patient.id, 'triage', 'Facturation', 'Paiement validé → Triage');
    await sleep(1500);

    // 3: Consultation
    setCurrentIdx(3);
    advancePatient(patient.id, 'consultation', 'Triage', 'Constantes prises - Urgence 3');
    await sleep(1500);

    // 4: Paiement examens
    setCurrentIdx(4);
    advancePatient(patient.id, 'paiement', 'DPI', 'Examens prescrits: Goutte épaisse, Radio thorax');
    await sleep(800);
    addPaymentReceipt({
      id: `rcpt-l-${Date.now()}`, patientId: patient.id, patientName: `${prenom} ${nom}`, nhid: patient.nhid,
      type: 'labo', items: [{ label: 'Goutte épaisse + NFS', montant: 8000 }],
      totalMontant: 8000, montantPaye: 8000, modePaiement: 'Espèces', timestamp: new Date(), caissier: 'Amina Hassan',
    });
    addPaymentReceipt({
      id: `rcpt-i-${Date.now()}`, patientId: patient.id, patientName: `${prenom} ${nom}`, nhid: patient.nhid,
      type: 'imagerie', items: [{ label: 'Radio thorax', montant: 7000 }],
      totalMontant: 7000, montantPaye: 7000, modePaiement: 'Espèces', timestamp: new Date(), caissier: 'Amina Hassan',
    });
    await sleep(1000);

    // 5: Labo
    setCurrentIdx(5);
    advancePatient(patient.id, 'labo', 'Facturation', 'Reçu labo validé');
    await sleep(800);
    addLabResult(patient.id, {
      id: `lab-${Date.now()}`, date: new Date().toISOString().slice(0, 10), type: 'Goutte Épaisse',
      statut: 'termine', paye: true,
      resultats: [
        { parametre: 'Plasmodium falciparum', valeur: '+++ (62 000/µL)', normal: 'Négatif', statut: 'anormal' },
        { parametre: 'Hémoglobine', valeur: '11.4 g/dL', normal: '13-17 g/dL', statut: 'anormal' },
      ],
    });
    await sleep(1200);

    // 6: Imagerie
    setCurrentIdx(6);
    advancePatient(patient.id, 'imagerie', 'Laboratoire', 'Résultats labo disponibles');
    await sleep(800);
    addImagingResult(patient.id, {
      id: `img-${Date.now()}`, date: new Date().toISOString().slice(0, 10),
      type: 'Radiographie', zone: 'Thorax', interpretation: 'Champs pulmonaires clairs - RAS', statut: 'termine',
    });
    await sleep(1200);

    // 7: Retour consult
    setCurrentIdx(7);
    advancePatient(patient.id, 'consultation', 'Imagerie', 'Examens complets - Retour médecin');
    await sleep(800);
    addPrescription(patient.id, {
      id: `presc-${Date.now()}`, date: new Date().toISOString().slice(0, 10), statut: 'en_attente',
      medicaments: [
        { nom: 'Artésunate', dosage: '120mg IV', frequence: 'Protocole', duree: '3 jours' },
        { nom: 'Paracétamol', dosage: '1g', frequence: '3x/j', duree: '5 jours' },
      ],
    });
    await sleep(1000);

    // 8: Paiement pharmacie
    setCurrentIdx(8);
    advancePatient(patient.id, 'paiement', 'DPI', 'Ordonnance émise → Caisse');
    await sleep(800);
    addPaymentReceipt({
      id: `rcpt-p-${Date.now()}`, patientId: patient.id, patientName: `${prenom} ${nom}`, nhid: patient.nhid,
      type: 'pharmacie', items: [{ label: 'Artésunate + Paracétamol', montant: 8500 }],
      totalMontant: 8500, montantPaye: 8500, modePaiement: 'Espèces', timestamp: new Date(), caissier: 'Amina Hassan',
    });
    await sleep(1000);

    // 9: Pharmacie
    setCurrentIdx(9);
    advancePatient(patient.id, 'pharmacie', 'Facturation', 'Reçu pharmacie validé');
    await sleep(1500);

    // 10: Hospitalisation
    setCurrentIdx(10);
    advancePatient(patient.id, 'hospitalise', 'Pharmacie', 'Médicaments délivrés - Admission MI-08');
    await sleep(1800);

    // 11: Sortie
    setCurrentIdx(11);
    advancePatient(patient.id, 'sorti', 'Hospitalisations', 'Guéri - Sortie avec suivi');
    await sleep(800);

    toast.success(`Simulation terminée pour ${prenom} ${nom}`, {
      description: 'Parcours complet: Accueil → Sortie',
    });
    setRunning(false);
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Simulation parcours patient complet
          </span>
          <Button size="sm" onClick={run} disabled={running} className="gap-2">
            {running ? <><Loader2 className="w-4 h-4 animate-spin" />En cours...</> : <><PlayCircle className="w-4 h-4" />Lancer simulation</>}
          </Button>
        </CardTitle>
        {patientName && (
          <p className="text-xs text-muted-foreground">
            Patient simulé: <span className="font-semibold text-foreground">{patientName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto">
          {SIM_STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s.key} className={`flex items-start gap-2 p-2 rounded text-xs transition-all ${
                active ? 'bg-primary/10 border border-primary/40' :
                done ? 'bg-secondary/10' : 'bg-muted/20 opacity-60'
              }`}>
                <div className="w-5 mt-0.5">
                  {done ? <CheckCircle2 className="w-4 h-4 text-secondary" /> :
                   active ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> :
                   <span className="text-muted-foreground">{i + 1}.</span>}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.details}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">{s.module}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientSimulation;
