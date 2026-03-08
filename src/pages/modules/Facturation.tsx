import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICES } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { Banknote, Receipt, QrCode, CreditCard, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Facturation = () => {
  const { patients, advancePatient, getPatientsByStep } = usePatientJourney();
  const [paymentData, setPaymentData] = useState({ patientId: '', montant: '', modePaiement: 'especes', service: 'general' });
  const [step, setStep] = useState(1);

  const patientsAtPaiement = getPatientsByStep('paiement');

  const handlePayment = () => {
    // Find the patient and advance them
    const p = patients.find(pt => pt.nhid === paymentData.patientId || pt.id === paymentData.patientId);
    if (p) {
      advancePatient(p.id, 'triage', 'Facturation', `Paiement ${Number(paymentData.montant).toLocaleString()} FCFA – ${paymentData.modePaiement}`);
    } else {
      toast.success('Paiement enregistré', { description: `${Number(paymentData.montant).toLocaleString()} FCFA – Reçu imprimé` });
    }
    setStep(1);
    setPaymentData({ patientId: '', montant: '', modePaiement: 'especes', service: 'general' });
  };

  const handleQuickPay = (patientId: string) => {
    advancePatient(patientId, 'triage', 'Facturation', 'Paiement rapide effectué – Dirigé vers le triage');
  };

  const recentPayments = [
    { id: 1, patient: 'Mahamat Abdoulaye', montant: 15000, service: 'Consultation', mode: 'Espèces', heure: '08:45' },
    { id: 2, patient: 'Hassan Idriss', montant: 45000, service: 'Labo + Imagerie', mode: 'Mobile Money', heure: '09:10' },
    { id: 3, patient: 'Aïcha Oumar', montant: 25000, service: 'Hospitalisation', mode: 'CNAM', heure: '09:30' },
    { id: 4, patient: 'Deby Moussa', montant: 8000, service: 'Pédiatrie', mode: 'Espèces', heure: '10:00' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Facturation & Caisse</h1>
        <p className="text-muted-foreground text-sm">Encaissement centralisé et reçus non-falsifiables</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients à payer', value: String(patientsAtPaiement.length), icon: Banknote, color: 'text-warning' },
          { label: 'Recettes du jour', value: '847 500 FCFA', icon: Banknote, color: 'text-secondary' },
          { label: 'Transactions', value: '47', icon: Receipt, color: 'text-primary' },
          { label: 'Progression', value: '+35%', icon: TrendingUp, color: 'text-secondary' },
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

      {/* Patients waiting for payment */}
      {patientsAtPaiement.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader><CardTitle className="text-base">💰 Patients en attente de paiement</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patientsAtPaiement.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.pathologieActuelle}</p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 h-7" onClick={() => handleQuickPay(p.id)}>
                    <CheckCircle className="w-3 h-3" /> Paiement rapide → Triage
                  </Button>
                </div>
                <PatientJourneyTracker patientId={p.id} compact />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4" /> Nouveau Paiement
              <div className="flex gap-1 ml-auto">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s}</div>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Étape 1: Identification</p>
                <div className="flex gap-2">
                  <Input placeholder="ID National ou nom" value={paymentData.patientId} onChange={e => setPaymentData(d => ({ ...d, patientId: e.target.value }))} />
                  <Button variant="outline" onClick={() => { setPaymentData(d => ({ ...d, patientId: 'TCD-2024-00001' })); toast.info('QR scanné'); }}><QrCode className="w-4 h-4" /></Button>
                </div>
                <Button className="w-full" onClick={() => setStep(2)} disabled={!paymentData.patientId}>Suivant</Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Étape 2: Détails</p>
                <Input placeholder="Montant (FCFA)" type="number" value={paymentData.montant} onChange={e => setPaymentData(d => ({ ...d, montant: e.target.value }))} />
                <Select value={paymentData.service} onValueChange={v => setPaymentData(d => ({ ...d, service: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={paymentData.modePaiement} onValueChange={v => setPaymentData(d => ({ ...d, modePaiement: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">💵 Espèces</SelectItem>
                    <SelectItem value="mobile">📱 Mobile Money</SelectItem>
                    <SelectItem value="cnam">🏥 CNAM</SelectItem>
                  </SelectContent>
                </Select>
                {paymentData.modePaiement === 'cnam' && (
                  <div className="p-2 rounded bg-accent text-xs text-accent-foreground">Ticket modérateur: 30% = {(Number(paymentData.montant) * 0.3).toLocaleString()} FCFA</div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
                  <Button className="flex-1" onClick={() => setStep(3)} disabled={!paymentData.montant}>Suivant</Button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Étape 3: Confirmation</p>
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm text-foreground">Patient: <strong>{paymentData.patientId}</strong></p>
                  <p className="text-sm text-foreground">Montant: <strong>{Number(paymentData.montant).toLocaleString()} FCFA</strong></p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                  <Button className="flex-1 gap-1" onClick={handlePayment}><CheckCircle className="w-4 h-4" /> Payer & Envoyer au Triage</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="w-4 h-4" /> Historique</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.patient}</p>
                  <p className="text-xs text-muted-foreground">{p.service} • {p.mode} • {p.heure}</p>
                </div>
                <span className="text-sm font-bold text-secondary">{p.montant.toLocaleString()} FCFA</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Facturation;
