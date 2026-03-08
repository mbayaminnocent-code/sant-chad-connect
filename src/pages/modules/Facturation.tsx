import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICES } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { Banknote, Receipt, QrCode, CheckCircle, TrendingUp, Search, User, ArrowRight, Printer, X, Clock, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentRecord {
  id: string;
  patientName: string;
  nhid: string;
  montant: number;
  service: string;
  mode: string;
  heure: string;
  date: Date;
}

const TARIFS: Record<string, { label: string; montant: number }> = {
  consultation: { label: 'Consultation générale', montant: 5000 },
  consultation_spe: { label: 'Consultation spécialiste', montant: 15000 },
  labo_base: { label: 'Bilan sanguin de base', montant: 12000 },
  labo_complet: { label: 'Bilan complet', montant: 35000 },
  radio: { label: 'Radiographie', montant: 20000 },
  echo: { label: 'Échographie', montant: 25000 },
  scanner: { label: 'Scanner', montant: 75000 },
  hospitalisation: { label: 'Hospitalisation / jour', montant: 15000 },
  urgence: { label: 'Prise en charge urgence', montant: 10000 },
};

const Facturation = () => {
  const { patients, advancePatient, getPatientsByStep, getPatientStep } = usePatientJourney();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedTarifs, setSelectedTarifs] = useState<string[]>([]);
  const [modePaiement, setModePaiement] = useState('especes');
  const [montantCustom, setMontantCustom] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([
    { id: 'h1', patientName: 'Mahamat Abdoulaye', nhid: 'TCD-2024-00001', montant: 15000, service: 'Consultation', mode: 'Espèces', heure: '08:45', date: new Date() },
    { id: 'h2', patientName: 'Hassan Idriss', nhid: 'TCD-2024-00003', montant: 45000, service: 'Labo + Imagerie', mode: 'Mobile Money', heure: '09:10', date: new Date() },
    { id: 'h3', patientName: 'Aïcha Oumar', nhid: 'TCD-2024-00005', montant: 25000, service: 'Hospitalisation', mode: 'CNAM', heure: '09:30', date: new Date() },
  ]);
  const [showReceipt, setShowReceipt] = useState<PaymentRecord | null>(null);

  const patientsAtAccueil = getPatientsByStep('accueil');
  const patientsAtPaiement = getPatientsByStep('paiement');
  const allPayablePatients = [...patientsAtAccueil, ...patientsAtPaiement];

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return allPayablePatients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.nhid.toLowerCase().includes(q) ||
      `${p.prenom} ${p.nom}`.toLowerCase().includes(q)
    );
  }, [searchQuery, patients, allPayablePatients]);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const totalMontant = useMemo(() => {
    const tarifTotal = selectedTarifs.reduce((sum, key) => sum + (TARIFS[key]?.montant || 0), 0);
    return tarifTotal + (Number(montantCustom) || 0);
  }, [selectedTarifs, montantCustom]);

  const ticketModerateur = modePaiement === 'cnam' ? Math.round(totalMontant * 0.3) : 0;
  const montantAPayer = modePaiement === 'cnam' ? ticketModerateur : totalMontant;

  const toggleTarif = (key: string) => {
    setSelectedTarifs(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleValidatePayment = () => {
    if (!selectedPatient || totalMontant <= 0) {
      toast.error('Veuillez sélectionner un patient et au moins un acte');
      return;
    }

    const now = new Date();
    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      patientName: `${selectedPatient.prenom} ${selectedPatient.nom}`,
      nhid: selectedPatient.nhid,
      montant: montantAPayer,
      service: selectedTarifs.map(k => TARIFS[k]?.label).join(', ') || 'Autre',
      mode: modePaiement === 'especes' ? 'Espèces' : modePaiement === 'mobile' ? 'Mobile Money' : 'CNAM',
      heure: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      date: now,
    };

    setPaymentHistory(prev => [record, ...prev]);
    advancePatient(selectedPatient.id, 'triage', 'Facturation', `Paiement ${montantAPayer.toLocaleString()} FCFA – ${record.mode}`);
    setShowReceipt(record);

    // Reset
    setSelectedPatientId(null);
    setSelectedTarifs([]);
    setMontantCustom('');
    setModePaiement('especes');
    setSearchQuery('');
  };

  const handleQuickPay = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return;
    const record: PaymentRecord = {
      id: `pay-${Date.now()}`,
      patientName: `${p.prenom} ${p.nom}`,
      nhid: p.nhid,
      montant: 5000,
      service: 'Consultation générale',
      mode: 'Espèces',
      heure: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`,
      date: new Date(),
    };
    setPaymentHistory(prev => [record, ...prev]);
    advancePatient(patientId, 'triage', 'Facturation', 'Paiement rapide 5 000 FCFA – Consultation');
  };

  const dailyTotal = paymentHistory.reduce((sum, p) => sum + p.montant, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">💰 Facturation & Caisse</h1>
        <p className="text-muted-foreground text-sm">Encaissement centralisé – Sélectionnez un patient, les actes, et validez le paiement</p>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReceipt(null)}>
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-1 border-b border-dashed border-border pb-4">
              <p className="text-xs text-muted-foreground">═══════════════════════</p>
              <p className="font-bold text-foreground">🏥 CHU N'Djamena</p>
              <p className="text-xs text-muted-foreground">REÇU DE PAIEMENT</p>
              <p className="text-xs text-muted-foreground">N° {showReceipt.id}</p>
              <p className="text-xs text-muted-foreground">{showReceipt.date.toLocaleDateString('fr-FR')} à {showReceipt.heure}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Patient:</span><span className="font-medium text-foreground">{showReceipt.patientName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID:</span><span className="text-foreground">{showReceipt.nhid}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service:</span><span className="text-foreground">{showReceipt.service}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mode:</span><span className="text-foreground">{showReceipt.mode}</span></div>
            </div>
            <div className="border-t border-dashed border-border pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">TOTAL:</span>
                <span className="text-secondary">{showReceipt.montant.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">═══════════════════════</p>
              <p className="text-xs text-muted-foreground">Reçu non-falsifiable – Marate Santé AI</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { toast.success('Reçu imprimé'); setShowReceipt(null); }}>
                  <Printer className="w-3 h-3" /> Imprimer
                </Button>
                <Button size="sm" className="flex-1" onClick={() => setShowReceipt(null)}>Fermer</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients en attente', value: String(allPayablePatients.length), icon: User, color: 'text-warning' },
          { label: 'Recettes du jour', value: `${dailyTotal.toLocaleString()} FCFA`, icon: Banknote, color: 'text-secondary' },
          { label: 'Transactions', value: String(paymentHistory.length), icon: Receipt, color: 'text-primary' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Patient Search & Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4" /> 1. Sélectionner un patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou NHID..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => {
              if (allPayablePatients.length > 0) {
                setSelectedPatientId(allPayablePatients[0].id);
                toast.info('📷 QR scanné – Patient identifié');
              }
            }}>
              <QrCode className="w-3 h-3" /> Scanner QR Code
            </Button>

            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredPatients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun patient trouvé</p>
              )}
              {filteredPatients.map(p => {
                const step = getPatientStep(p.id);
                const isSelected = selectedPatientId === p.id;
                const isPayable = step === 'accueil' || step === 'paiement';
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    }`}
                    onClick={() => setSelectedPatientId(p.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-muted-foreground">{p.nhid}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isPayable && (
                          <Badge variant="outline" className="text-[10px] border-warning/50 text-warning">
                            À payer
                          </Badge>
                        )}
                        {!isPayable && (
                          <Badge variant="outline" className="text-[10px]">
                            {step}
                          </Badge>
                        )}
                        {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{p.age} ans • {p.pathologieActuelle}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick pay buttons for waiting patients */}
            {allPayablePatients.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">⚡ Paiement rapide (5 000 FCFA – Consultation)</p>
                {allPayablePatients.slice(0, 3).map(p => (
                  <Button key={p.id} variant="outline" size="sm" className="w-full mb-1 justify-between text-xs h-8" onClick={() => handleQuickPay(p.id)}>
                    <span>{p.prenom} {p.nom}</span>
                    <span className="flex items-center gap-1 text-secondary"><CheckCircle className="w-3 h-3" /> Payer → Triage</span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 2: Payment Details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4" /> 2. Détails du paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient ? (
              <>
                {/* Selected patient info */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{selectedPatient.prenom} {selectedPatient.nom}</p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedPatientId(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedPatient.nhid} • {selectedPatient.age} ans • {selectedPatient.pathologieActuelle}</p>
                  <PatientJourneyTracker patientId={selectedPatient.id} compact />
                </div>

                {/* Tarifs selection */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Sélectionnez les actes :</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(TARIFS).map(([key, tarif]) => (
                      <div
                        key={key}
                        className={`p-2 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                          selectedTarifs.includes(key)
                            ? 'border-secondary bg-secondary/10 text-foreground'
                            : 'border-border hover:border-secondary/30 text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => toggleTarif(key)}
                      >
                        <span className="flex items-center gap-2">
                          {selectedTarifs.includes(key) && <CheckCircle className="w-3 h-3 text-secondary" />}
                          {tarif.label}
                        </span>
                        <span className="font-bold">{tarif.montant.toLocaleString()} F</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom amount */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">Montant supplémentaire (optionnel) :</p>
                  <Input
                    type="number"
                    placeholder="0 FCFA"
                    value={montantCustom}
                    onChange={e => setMontantCustom(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Payment mode */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">Mode de paiement :</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'especes', label: 'Espèces', icon: Banknote },
                      { key: 'mobile', label: 'Mobile Money', icon: Smartphone },
                      { key: 'cnam', label: 'CNAM', icon: Building2 },
                    ].map(mode => (
                      <div
                        key={mode.key}
                        className={`p-2 rounded-lg border cursor-pointer transition-all text-center ${
                          modePaiement === mode.key
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                        onClick={() => setModePaiement(mode.key)}
                      >
                        <mode.icon className={`w-4 h-4 mx-auto mb-1 ${modePaiement === mode.key ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-[10px] font-medium text-foreground">{mode.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {modePaiement === 'cnam' && totalMontant > 0 && (
                  <div className="p-2 rounded-lg bg-accent border border-accent/50 text-xs space-y-1">
                    <p className="text-accent-foreground">🏥 Couverture CNAM – Ticket modérateur 30%</p>
                    <div className="flex justify-between text-accent-foreground">
                      <span>Total actes:</span><span>{totalMontant.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-accent-foreground">
                      <span>Pris en charge (70%):</span><span>{(totalMontant - ticketModerateur).toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between font-bold text-accent-foreground">
                      <span>À payer (30%):</span><span>{ticketModerateur.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                )}

                {/* Total & Validate */}
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Total à encaisser :</span>
                    <span className="text-2xl font-bold text-secondary">{montantAPayer.toLocaleString()} FCFA</span>
                  </div>
                  <Button
                    className="w-full gap-2 h-12 text-base"
                    onClick={handleValidatePayment}
                    disabled={totalMontant <= 0}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Valider le paiement & Envoyer au Triage
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <User className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">Sélectionnez un patient dans la liste</p>
                <p className="text-xs">ou scannez son QR code</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Column 3: History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Historique des paiements
              <Badge variant="secondary" className="ml-auto text-xs">{paymentHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {paymentHistory.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-border hover:border-primary/20 cursor-pointer transition-all"
                onClick={() => setShowReceipt(p)}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{p.patientName}</p>
                  <span className="text-sm font-bold text-secondary">{p.montant.toLocaleString()} F</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{p.service}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.mode}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{p.heure}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Facturation;
