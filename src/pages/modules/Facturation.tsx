import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePatientJourney, PaymentReceipt } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import {
  Banknote, Receipt, QrCode, CheckCircle, TrendingUp, Search, User,
  Printer, X, Clock, Smartphone, Building2, FlaskConical, Pill,
  FileText, Eye, ShieldCheck, AlertTriangle, ScanLine
} from 'lucide-react';
import { toast } from 'sonner';

// Exam prices (same as Laboratoire)
const EXAM_PRICES: Record<string, number> = {
  'nfs': 8000, 'ge': 5000, 'glycemie': 3000, 'creat': 10000,
  'bilan_hep': 15000, 'troponine': 20000, 'hba1c': 8000,
  'proteinurie': 6000, 'hemoculture': 12000, 'bk': 10000,
  'ionogramme': 12000, 'pcr_meningo': 25000,
};

const EXAM_CATALOG_NAMES: Record<string, string> = {
  'nfs': 'NFS Complète', 'ge': 'Goutte Épaisse', 'glycemie': 'Glycémie',
  'creat': 'Créatinine + Urée', 'bilan_hep': 'Bilan Hépatique',
  'troponine': 'Troponine HS', 'hba1c': 'HbA1c', 'proteinurie': 'Protéinurie 24h',
  'hemoculture': 'Hémocultures', 'bk': 'BK Crachats', 'ionogramme': 'Ionogramme',
  'pcr_meningo': 'PCR Méningocoque',
};

// Med prices
const MED_PRICES: Record<string, number> = {
  'Artésunate': 3500, 'Paracétamol': 500, 'Ceftriaxone': 4000, 'Amoxicilline': 1500,
  'Métronidazole': 1000, 'Insuline': 8000, 'Aspirine': 300, 'Clopidogrel': 2500,
  'Morphine': 5000, 'Diazépam': 1500, 'Ibuprofène': 800, 'Atorvastatine': 2000,
  'Nicardipine': 3000, 'Sulfate de Magnésium': 2500, 'Héparine': 6000,
};

const getMedPrice = (nom: string): number => {
  const baseName = nom.split(' ')[0];
  return MED_PRICES[baseName] || 1500;
};

const getExamPrice = (examName: string): number => {
  const key = Object.keys(EXAM_CATALOG_NAMES).find(k =>
    examName.toLowerCase().includes(EXAM_CATALOG_NAMES[k].toLowerCase().substring(0, 5))
  );
  return key ? (EXAM_PRICES[key] || 8000) : 8000;
};

const IMAGERIE_PRICES: Record<string, number> = {
  'Radiographie thoracique': 15000, 'Radiographie osseuse': 12000,
  'Échographie abdominale': 20000, 'Échographie obstétricale': 18000,
  'Échocardiographie': 30000, 'Scanner cérébral': 50000,
  'Scanner thoracique': 45000, 'Scanner abdominal': 45000,
  'IRM cérébrale': 80000, 'IRM rachidienne': 75000,
  'Mammographie': 25000, 'Doppler vasculaire': 25000, 'Angiographie': 60000,
};

const getImageriePrice = (examName: string): number => {
  const key = Object.keys(IMAGERIE_PRICES).find(k =>
    examName.toLowerCase().includes(k.toLowerCase().substring(0, 8))
  );
  return key ? IMAGERIE_PRICES[key] : 20000;
};

const CONSULTATION_TARIFS: Record<string, { label: string; montant: number }> = {
  consultation: { label: 'Consultation générale', montant: 5000 },
  consultation_spe: { label: 'Consultation spécialiste', montant: 15000 },
  hospitalisation: { label: 'Hospitalisation / jour', montant: 15000 },
  urgence: { label: 'Prise en charge urgence', montant: 10000 },
};

interface BillableItem {
  id: string;
  label: string;
  montant: number;
  type: 'consultation' | 'labo' | 'pharmacie' | 'imagerie' | 'hospitalisation' | 'autre';
  selected: boolean;
}

const Facturation = () => {
  const {
    patients, advancePatient, getPatientsByStep, getPatientStep,
    addPaymentReceipt, paymentReceipts, hasReceiptForType, getPatientEvents
  } = usePatientJourney();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [modePaiement, setModePaiement] = useState('especes');
  const [montantCustom, setMontantCustom] = useState('');
  const [activeTab, setActiveTab] = useState('caisse');
  const [showReceipt, setShowReceipt] = useState<PaymentReceipt | null>(null);
  const [billableItems, setBillableItems] = useState<BillableItem[]>([]);
  const [additionalTarifs, setAdditionalTarifs] = useState<string[]>([]);

  const patientsAtAccueil = getPatientsByStep('accueil');
  const patientsAtPaiement = getPatientsByStep('paiement');
  const allWaitingPatients = [...patientsAtAccueil, ...patientsAtPaiement];

  // Get ALL patients that have pending items to pay (exams, prescriptions)
  const patientsWithPendingBills = useMemo(() => {
    return patients.filter(p => {
      const step = getPatientStep(p.id);
      // Patients at accueil/paiement (initial visit or waiting to pay for imaging)
      if (step === 'accueil' || step === 'paiement') return true;
      // Patients with unpaid lab exams
      const hasUnpaidExams = p.consultations.some(c => c.examens.length > 0) && !hasReceiptForType(p.id, 'labo');
      // Patients with unpaid prescriptions
      const hasUnpaidMeds = p.prescriptions.some(pr => pr.statut === 'en_attente') && !hasReceiptForType(p.id, 'pharmacie');
      // Patients with unpaid imaging
      const hasUnpaidImaging = p.imagingResults.some(r => r.statut === 'en_attente') && !hasReceiptForType(p.id, 'imagerie');
      return hasUnpaidExams || hasUnpaidMeds || hasUnpaidImaging;
    });
  }, [patients, getPatientStep, hasReceiptForType]);

  // Detect patients sent to paiement for imaging (from journey events)
  const patientsWaitingForImagingPayment = useMemo(() => {
    return patients.filter(p => {
      const step = getPatientStep(p.id);
      if (step !== 'paiement') return false;
      const events = getPatientEvents(p.id);
      return events.some(e => e.to === 'paiement' && e.details?.includes('imagerie'));
    });
  }, [patients, getPatientStep, getPatientEvents]);

  const filteredPatients = useMemo(() => {
    const source = searchQuery.trim() ? patients : patientsWithPendingBills;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.nhid.toLowerCase().includes(q) ||
      `${p.prenom} ${p.nom}`.toLowerCase().includes(q)
    );
  }, [searchQuery, patients, patientsWithPendingBills]);

  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  // When patient is selected, compute billable items
  const selectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setAdditionalTarifs([]);
    setMontantCustom('');
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return;

    const items: BillableItem[] = [];
    const step = getPatientStep(patientId);
    const events = getPatientEvents(patientId);
    const isWaitingForImagingPayment = step === 'paiement' && events.some(e => e.to === 'paiement' && e.details?.toLowerCase().includes('imagerie'));

    // Consultation items for initial visit (not imaging payment)
    if ((step === 'accueil' || step === 'paiement') && !isWaitingForImagingPayment) {
      items.push({
        id: 'consult-base',
        label: 'Consultation générale',
        montant: 5000,
        type: 'consultation',
        selected: true,
      });
    }

    // Imaging exams from journey events (patient sent to paiement for imaging)
    if (!hasReceiptForType(patientId, 'imagerie')) {
      const imagingEvent = events.find(e => e.to === 'paiement' && e.details?.toLowerCase().includes('imagerie'));
      if (imagingEvent && imagingEvent.details) {
        // Extract exam names from details like "💰 Payer avant imagerie: Scanner cérébral, IRM cérébrale"
        const detailStr = imagingEvent.details.replace(/.*imagerie:\s*/i, '').replace(/.*Imagerie:\s*/i, '');
        const examNames = detailStr.split(',').map(s => s.trim()).filter(Boolean);
        examNames.forEach((examName, idx) => {
          items.push({
            id: `img-${patientId}-${idx}`,
            label: `📷 ${examName}`,
            montant: getImageriePrice(examName),
            type: 'imagerie',
            selected: true,
          });
        });
      }
    }

    // Lab exams from consultations
    if (!hasReceiptForType(patientId, 'labo')) {
      p.consultations.forEach(c => {
        c.examens.forEach((examen, idx) => {
          items.push({
            id: `exam-${c.id}-${idx}`,
            label: `🔬 ${examen}`,
            montant: getExamPrice(examen),
            type: 'labo',
            selected: true,
          });
        });
      });
      // Also pending labResults
      p.labResults.filter(lr => !lr.paye && (lr.statut === 'en_attente' || lr.statut === 'en_cours')).forEach(lr => {
        if (!items.some(it => it.label.includes(lr.type.substring(0, 10)))) {
          items.push({
            id: `lr-${lr.id}`,
            label: `🔬 ${lr.type}`,
            montant: getExamPrice(lr.type),
            type: 'labo',
            selected: true,
          });
        }
      });
    }

    // Prescriptions
    if (!hasReceiptForType(patientId, 'pharmacie')) {
      p.prescriptions.filter(pr => pr.statut === 'en_attente').forEach(pr => {
        pr.medicaments.forEach((m, idx) => {
          items.push({
            id: `med-${pr.id}-${idx}`,
            label: `💊 ${m.nom} – ${m.dosage}`,
            montant: getMedPrice(m.nom),
            type: 'pharmacie',
            selected: true,
          });
        });
      });
    }

    setBillableItems(items);
  };

  const toggleItem = (itemId: string) => {
    setBillableItems(prev => prev.map(i => i.id === itemId ? { ...i, selected: !i.selected } : i));
  };

  const toggleTarif = (key: string) => {
    setAdditionalTarifs(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const selectedItems = billableItems.filter(i => i.selected);
  const itemsTotal = selectedItems.reduce((sum, i) => sum + i.montant, 0);
  const tarifsTotal = additionalTarifs.reduce((sum, k) => sum + (CONSULTATION_TARIFS[k]?.montant || 0), 0);
  const customAmount = Number(montantCustom) || 0;
  const totalMontant = itemsTotal + tarifsTotal + customAmount;
  const ticketModerateur = modePaiement === 'cnam' ? Math.round(totalMontant * 0.3) : 0;
  const montantAPayer = modePaiement === 'cnam' ? ticketModerateur : totalMontant;

  const hasLabItems = selectedItems.some(i => i.type === 'labo');
  const hasPharmaItems = selectedItems.some(i => i.type === 'pharmacie');
  const hasImagingItems = selectedItems.some(i => i.type === 'imagerie');

  const handleValidatePayment = () => {
    if (!selectedPatient || totalMontant <= 0) {
      toast.error('Veuillez sélectionner un patient et au moins un acte');
      return;
    }

    const now = new Date();
    const modeLabel = modePaiement === 'especes' ? 'Espèces' : modePaiement === 'mobile' ? 'Mobile Money' : 'CNAM';
    const step = getPatientStep(selectedPatient.id);

    // Generate receipts per type
    const types = new Set(selectedItems.map(i => i.type));
    // Also add tarif-based types
    if (additionalTarifs.length > 0) types.add('consultation');

    types.forEach(type => {
      const typeItems = selectedItems.filter(i => i.type === type);
      if (type === 'consultation') {
        additionalTarifs.forEach(k => {
          const t = CONSULTATION_TARIFS[k];
          if (t) typeItems.push({ id: k, label: t.label, montant: t.montant, type: 'consultation', selected: true });
        });
      }
      const typeTotal = typeItems.reduce((sum, i) => sum + i.montant, 0);
      const receipt: PaymentReceipt = {
        id: `REC-${Date.now()}-${type}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.prenom} ${selectedPatient.nom}`,
        nhid: selectedPatient.nhid,
        type: type as PaymentReceipt['type'],
        items: typeItems.map(i => ({ label: i.label, montant: i.montant })),
        totalMontant: typeTotal,
        montantPaye: modePaiement === 'cnam' ? Math.round(typeTotal * 0.3) : typeTotal,
        modePaiement: modeLabel,
        timestamp: now,
        caissier: 'Amina Hassan',
      };
      addPaymentReceipt(receipt);
    });

    // Generate a combined receipt for display
    const combinedReceipt: PaymentReceipt = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.prenom} ${selectedPatient.nom}`,
      nhid: selectedPatient.nhid,
      type: 'autre',
      items: [
        ...selectedItems.map(i => ({ label: i.label, montant: i.montant })),
        ...additionalTarifs.map(k => ({ label: CONSULTATION_TARIFS[k]?.label || k, montant: CONSULTATION_TARIFS[k]?.montant || 0 })),
        ...(customAmount > 0 ? [{ label: 'Supplément', montant: customAmount }] : []),
      ],
      totalMontant,
      montantPaye: montantAPayer,
      modePaiement: modeLabel,
      timestamp: now,
      caissier: 'Amina Hassan',
    };

    setShowReceipt(combinedReceipt);

    // Advance patient based on payment context
    const hasImagingItems = selectedItems.some(i => i.type === 'imagerie');
    if (hasImagingItems && (step === 'paiement')) {
      // Patient paid for imaging → send to imagerie
      advancePatient(selectedPatient.id, 'imagerie', 'Facturation', `✅ Paiement imagerie ${montantAPayer.toLocaleString()} FCFA – ${modeLabel}`);
    } else if (step === 'accueil' || step === 'paiement') {
      advancePatient(selectedPatient.id, 'triage', 'Facturation', `Paiement ${montantAPayer.toLocaleString()} FCFA – ${modeLabel}`);
    } else {
      toast.success(`💰 Paiement enregistré pour ${selectedPatient.prenom} ${selectedPatient.nom}`, {
        description: `${montantAPayer.toLocaleString()} FCFA – Reçu généré`
      });
    }

    // Reset
    setSelectedPatientId(null);
    setBillableItems([]);
    setAdditionalTarifs([]);
    setMontantCustom('');
    setModePaiement('especes');
    setSearchQuery('');
  };

  const handleQuickPay = (patientId: string) => {
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return;
    const now = new Date();
    const receipt: PaymentReceipt = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      patientId: p.id,
      patientName: `${p.prenom} ${p.nom}`,
      nhid: p.nhid,
      type: 'consultation',
      items: [{ label: 'Consultation générale', montant: 5000 }],
      totalMontant: 5000,
      montantPaye: 5000,
      modePaiement: 'Espèces',
      timestamp: now,
      caissier: 'Amina Hassan',
    };
    addPaymentReceipt(receipt);
    advancePatient(patientId, 'triage', 'Facturation', 'Paiement rapide 5 000 FCFA – Consultation');
  };

  const dailyTotal = paymentReceipts.reduce((sum, r) => sum + r.montantPaye, 0);
  const patientReceipts = paymentReceipts;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">💰 Facturation & Caisse Centralisée</h1>
        <p className="text-muted-foreground text-sm">Encaissement centralisé – Examens, médicaments, consultations – Reçu unique avec référence</p>
      </div>

      {/* Receipt Modal */}
      <Dialog open={!!showReceipt} onOpenChange={() => setShowReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>🧾 Reçu de Paiement</DialogTitle></DialogHeader>
          {showReceipt && (
            <div className="space-y-3 font-mono text-xs">
              <div className="text-center border-b border-dashed border-border pb-3">
                <p className="text-xs text-muted-foreground">═══════════════════════════</p>
                <p className="font-bold text-sm text-foreground">🏥 CHU LA RENAISSANCE</p>
                <p className="text-muted-foreground">N'Djamena, Tchad</p>
                <p className="text-muted-foreground">REÇU DE PAIEMENT</p>
                <p className="font-bold text-primary text-sm mt-1">N° {showReceipt.id}</p>
                <p className="text-muted-foreground">{showReceipt.timestamp.toLocaleDateString('fr-FR')} à {showReceipt.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-muted-foreground">Patient:</span><span className="font-medium text-foreground">{showReceipt.patientName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">NHID:</span><span className="text-foreground">{showReceipt.nhid}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mode:</span><span className="text-foreground">{showReceipt.modePaiement}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Caissier:</span><span className="text-foreground">{showReceipt.caissier}</span></div>
              </div>
              <div className="border-t border-dashed border-border pt-2 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground">DÉTAIL DES ACTES :</p>
                {showReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-foreground">
                    <span className="flex-1 truncate">{item.label}</span>
                    <span className="font-medium ml-2">{item.montant.toLocaleString()} F</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Total actes:</span><span className="text-foreground">{showReceipt.totalMontant.toLocaleString()} FCFA</span></div>
                <div className="flex justify-between text-lg font-bold mt-1">
                  <span className="text-foreground">PAYÉ:</span>
                  <span className="text-primary">{showReceipt.montantPaye.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div className="text-center border-t border-dashed border-border pt-2">
                <p className="text-[10px] text-muted-foreground">═══════════════════════════</p>
                <p className="text-[10px] text-primary font-bold">📋 Présentez ce reçu au Laboratoire / Imagerie / Pharmacie</p>
                <p className="text-[10px] text-muted-foreground">Référence: {showReceipt.id}</p>
                <p className="text-[10px] text-muted-foreground">Reçu non-falsifiable – Marate Santé AI</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => { toast.success('Reçu imprimé'); setShowReceipt(null); }}>
              <Printer className="w-3 h-3" /> Imprimer
            </Button>
            <Button size="sm" onClick={() => setShowReceipt(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'En attente (accueil)', value: allWaitingPatients.length, icon: User, color: 'text-warning' },
          { label: 'Factures en attente', value: patientsWithPendingBills.length, icon: FileText, color: 'text-primary' },
          { label: 'Recettes du jour', value: `${dailyTotal.toLocaleString()} F`, icon: Banknote, color: 'text-primary' },
          { label: 'Reçus émis', value: paymentReceipts.length, icon: Receipt, color: 'text-primary' },
          { label: 'Labo payés', value: paymentReceipts.filter(r => r.type === 'labo').length, icon: FlaskConical, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted/60"><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="caisse" className="text-xs gap-1"><Banknote className="w-3 h-3" /> Caisse</TabsTrigger>
          <TabsTrigger value="recus" className="text-xs gap-1"><Receipt className="w-3 h-3" /> Reçus émis ({paymentReceipts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="caisse" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Patient list */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" /> 1. Sélectionner un patient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Rechercher par nom ou NHID..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={() => {
                  if (patientsWithPendingBills.length > 0) {
                    selectPatient(patientsWithPendingBills[0].id);
                    toast.info('📷 QR scanné – Patient identifié');
                  }
                }}>
                  <QrCode className="w-3 h-3" /> Scanner QR Code
                </Button>

                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {filteredPatients.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun patient avec facture en attente</p>
                  )}
                  {filteredPatients.map(p => {
                    const step = getPatientStep(p.id);
                    const isSelected = selectedPatientId === p.id;
                    const isAtAccueil = step === 'accueil' || step === 'paiement';
                    const hasUnpaidExams = p.consultations.some(c => c.examens.length > 0) && !hasReceiptForType(p.id, 'labo');
                    const hasUnpaidMeds = p.prescriptions.some(pr => pr.statut === 'en_attente') && !hasReceiptForType(p.id, 'pharmacie');
                    const evts = getPatientEvents(p.id);
                    const isWaitingImagingPay = step === 'paiement' && evts.some(e => e.to === 'paiement' && e.details?.toLowerCase().includes('imagerie'));

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : isWaitingImagingPay ? 'border-warning bg-warning/5 hover:border-warning/50'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                        }`}
                        onClick={() => selectPatient(p.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{p.prenom} {p.nom}</p>
                            <p className="text-xs text-muted-foreground">{p.nhid}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                            {isWaitingImagingPay && <Badge variant="outline" className="text-[9px] border-warning/50 text-warning gap-0.5"><ScanLine className="w-2.5 h-2.5" />Imagerie 💰</Badge>}
                            {isAtAccueil && !isWaitingImagingPay && <Badge variant="outline" className="text-[9px] border-warning/50 text-warning">Consultation</Badge>}
                            {hasUnpaidExams && <Badge variant="outline" className="text-[9px] border-primary/50 text-primary gap-0.5"><FlaskConical className="w-2.5 h-2.5" />Labo</Badge>}
                            {hasUnpaidMeds && <Badge variant="outline" className="text-[9px] border-primary/50 text-primary gap-0.5"><Pill className="w-2.5 h-2.5" />Pharma</Badge>}
                            {isSelected && <CheckCircle className="w-4 h-4 text-primary" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{p.age} ans • {p.pathologieActuelle} • <span className="font-medium">{step}</span></p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick pay */}
                {allWaitingPatients.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">⚡ Paiement rapide (5 000 FCFA – Consultation)</p>
                    {allWaitingPatients.slice(0, 3).map(p => (
                      <Button key={p.id} variant="outline" size="sm" className="w-full mb-1 justify-between text-xs h-8" onClick={() => handleQuickPay(p.id)}>
                        <span>{p.prenom} {p.nom}</span>
                        <span className="flex items-center gap-1 text-primary"><CheckCircle className="w-3 h-3" /> Payer → Triage</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column 2: Billing details */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 2. Facture détaillée
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedPatient ? (
                  <>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">{selectedPatient.prenom} {selectedPatient.nom}</p>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedPatientId(null); setBillableItems([]); }}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{selectedPatient.nhid} • {selectedPatient.age} ans</p>
                      <PatientJourneyTracker patientId={selectedPatient.id} compact />
                    </div>

                    {/* Existing receipts */}
                    {paymentReceipts.filter(r => r.patientId === selectedPatient.id).length > 0 && (
                      <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-[10px] font-bold text-green-700 mb-1">✅ REÇUS EXISTANTS :</p>
                        {paymentReceipts.filter(r => r.patientId === selectedPatient.id).map(r => (
                          <div key={r.id} className="text-[10px] text-green-700 flex justify-between">
                            <span>{r.type.toUpperCase()} – {r.id}</span>
                            <span>{r.montantPaye.toLocaleString()} F</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Auto-detected items */}
                    {billableItems.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-2">📋 Actes prescrits par le médecin :</p>
                        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                          {billableItems.map(item => (
                            <div
                              key={item.id}
                              className={`p-2 rounded-lg border cursor-pointer transition-all text-xs flex items-center gap-2 ${
                                item.selected ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
                              }`}
                              onClick={() => toggleItem(item.id)}
                            >
                              <Checkbox checked={item.selected} />
                              <span className="flex-1">{item.label}</span>
                              <Badge variant="outline" className="text-[9px]">{item.type}</Badge>
                              <span className="font-bold">{item.montant.toLocaleString()} F</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional tarifs */}
                    <div>
                      <p className="text-xs font-medium text-foreground mb-2">Actes supplémentaires :</p>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(CONSULTATION_TARIFS).map(([key, tarif]) => (
                          <div
                            key={key}
                            className={`p-2 rounded-lg border cursor-pointer transition-all text-xs flex items-center justify-between ${
                              additionalTarifs.includes(key) ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => toggleTarif(key)}
                          >
                            <span className="flex items-center gap-2">
                              {additionalTarifs.includes(key) && <CheckCircle className="w-3 h-3 text-primary" />}
                              {tarif.label}
                            </span>
                            <span className="font-bold">{tarif.montant.toLocaleString()} F</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Custom amount */}
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Montant supplémentaire :</p>
                      <Input type="number" placeholder="0 FCFA" value={montantCustom} onChange={e => setMontantCustom(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <User className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-sm">Sélectionnez un patient</p>
                    <p className="text-xs">Les examens et ordonnances prescrits s'afficheront automatiquement</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Column 3: Payment & Summary */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Banknote className="w-4 h-4" /> 3. Encaissement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPatient ? (
                  <>
                    {/* Summary */}
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1.5 text-xs">
                      <p className="font-bold text-foreground text-sm">Récapitulatif</p>
                      {hasLabItems && (
                        <div className="flex justify-between text-foreground">
                          <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3 text-primary" /> Examens labo</span>
                          <span className="font-medium">{selectedItems.filter(i => i.type === 'labo').reduce((s, i) => s + i.montant, 0).toLocaleString()} F</span>
                        </div>
                      )}
                      {hasImagingItems && (
                        <div className="flex justify-between text-foreground">
                          <span className="flex items-center gap-1"><ScanLine className="w-3 h-3 text-primary" /> Imagerie médicale</span>
                          <span className="font-medium">{selectedItems.filter(i => i.type === 'imagerie').reduce((s, i) => s + i.montant, 0).toLocaleString()} F</span>
                        </div>
                      {hasPharmaItems && (
                        <div className="flex justify-between text-foreground">
                          <span className="flex items-center gap-1"><Pill className="w-3 h-3 text-primary" /> Médicaments</span>
                          <span className="font-medium">{selectedItems.filter(i => i.type === 'pharmacie').reduce((s, i) => s + i.montant, 0).toLocaleString()} F</span>
                        </div>
                      )}
                      {selectedItems.filter(i => i.type === 'consultation').length > 0 && (
                        <div className="flex justify-between text-foreground">
                          <span>Consultation</span>
                          <span className="font-medium">{selectedItems.filter(i => i.type === 'consultation').reduce((s, i) => s + i.montant, 0).toLocaleString()} F</span>
                        </div>
                      )}
                      {tarifsTotal > 0 && (
                        <div className="flex justify-between text-foreground">
                          <span>Actes supplémentaires</span>
                          <span className="font-medium">{tarifsTotal.toLocaleString()} F</span>
                        </div>
                      )}
                      {customAmount > 0 && (
                        <div className="flex justify-between text-foreground">
                          <span>Supplément</span>
                          <span className="font-medium">{customAmount.toLocaleString()} F</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-1 flex justify-between font-bold text-foreground">
                        <span>Total</span>
                        <span>{totalMontant.toLocaleString()} FCFA</span>
                      </div>
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
                              modePaiement === mode.key ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
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
                        <p className="text-accent-foreground">🏥 CNAM – Ticket modérateur 30%</p>
                        <div className="flex justify-between text-accent-foreground"><span>Total:</span><span>{totalMontant.toLocaleString()} F</span></div>
                        <div className="flex justify-between text-accent-foreground"><span>Pris en charge (70%):</span><span>{(totalMontant - ticketModerateur).toLocaleString()} F</span></div>
                        <div className="flex justify-between font-bold text-accent-foreground"><span>À payer (30%):</span><span>{ticketModerateur.toLocaleString()} F</span></div>
                      </div>
                    )}

                    {/* Info about what this receipt unlocks */}
                    {(hasLabItems || hasPharmaItems) && (
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
                        <p className="font-bold text-blue-700 mb-1">📋 Ce reçu permettra :</p>
                        {hasLabItems && <p className="text-blue-600">🔬 Au Laboratoire de lancer les analyses</p>}
                        {hasPharmaItems && <p className="text-blue-600">💊 À la Pharmacie de délivrer les médicaments</p>}
                      </div>
                    )}

                    {/* Total & Validate */}
                    <div className="border-t border-border pt-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-foreground">À encaisser :</span>
                        <span className="text-2xl font-bold text-primary">{montantAPayer.toLocaleString()} FCFA</span>
                      </div>
                      <Button className="w-full gap-2 h-12 text-base" onClick={handleValidatePayment} disabled={totalMontant <= 0}>
                        <CheckCircle className="w-5 h-5" />
                        Valider & Générer le reçu
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Receipt className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-sm">Aucun patient sélectionné</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Receipts history */}
        <TabsContent value="recus" className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-foreground">{dailyTotal.toLocaleString()} F</p>
                <p className="text-[10px] text-muted-foreground">Recettes totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-foreground">{paymentReceipts.filter(r => r.type === 'labo').length}</p>
                <p className="text-[10px] text-muted-foreground">Reçus Labo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-foreground">{paymentReceipts.filter(r => r.type === 'pharmacie').length}</p>
                <p className="text-[10px] text-muted-foreground">Reçus Pharmacie</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-foreground">{paymentReceipts.filter(r => r.type === 'consultation').length}</p>
                <p className="text-[10px] text-muted-foreground">Consultations</p>
              </CardContent>
            </Card>
          </div>

          {patientReceipts.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Aucun reçu émis</CardContent></Card>
          ) : patientReceipts.map(r => (
            <Card key={r.id} className="cursor-pointer hover:border-primary/30 transition-all" onClick={() => setShowReceipt(r)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{r.patientName}</p>
                    <Badge variant="outline" className="text-[9px]">{r.nhid}</Badge>
                    <Badge variant="secondary" className="text-[9px]">{r.type.toUpperCase()}</Badge>
                  </div>
                  <span className="text-sm font-bold text-primary">{r.montantPaye.toLocaleString()} F</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Réf: {r.id}</span>
                  <span>{r.modePaiement} • {r.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Facturation;
