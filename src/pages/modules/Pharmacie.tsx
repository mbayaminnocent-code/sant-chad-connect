import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { PHARMACY_STOCK } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import {
  Pill, AlertTriangle, TrendingDown, CheckCircle, Package, Send, Search,
  ShoppingCart, Printer, User, Clock, XCircle, Shield, FileText, BarChart3,
  RefreshCw, Eye, Plus, Minus, Activity, Thermometer, Droplets, Banknote, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

// Interaction database
const INTERACTIONS_DB: Record<string, string[]> = {
  'Aspirine': ['Ibuprofène', 'Warfarine', 'Clopidogrel'],
  'Warfarine': ['Aspirine', 'Ibuprofène', 'Métronidazole', 'Amoxicilline'],
  'Métronidazole': ['Warfarine', 'Alcool'],
  'Insuline': ['Bêtabloquants'],
  'Morphine': ['Diazépam', 'Benzodiazépines'],
  'Diazépam': ['Morphine', 'Opioïdes'],
};

interface DispensationRecord {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  prescriptionId: string;
  medicaments: { nom: string; dosage: string; frequence: string; duree: string; dispensed: boolean; lotNumber?: string; prix?: number }[];
  status: 'pending' | 'in_progress' | 'dispensed' | 'rejected';
  timestamp: Date;
  pharmacist?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  paye: boolean;
  totalPrix: number;
  referencePaiement?: string;
}

interface StockMovement {
  id: string;
  type: 'entree' | 'sortie' | 'retour';
  medicament: string;
  quantite: number;
  date: Date;
  motif: string;
  pharmacist: string;
}

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

const Pharmacie = () => {
  const { patients, advancePatient, getPatientsByStep, updatePrescriptionStatus } = usePatientJourney();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dispensation');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'expiring'>('all');

  const patientsAtPharmacy = getPatientsByStep('pharmacie');

  // Dispensation queue
  const [dispensations, setDispensations] = useState<DispensationRecord[]>(() => {
    const records: DispensationRecord[] = [];
    patients.forEach(p => {
      p.prescriptions.filter(pr => pr.statut === 'en_attente').forEach(pr => {
        const meds = pr.medicaments.map(m => ({ ...m, dispensed: false, lotNumber: `LOT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, prix: getMedPrice(m.nom) }));
        const totalPrix = meds.reduce((sum, m) => sum + (m.prix || 0), 0);
        records.push({
          id: `disp-${pr.id}`,
          patientId: p.id,
          patientName: `${p.prenom} ${p.nom}`,
          nhid: p.nhid,
          prescriptionId: pr.id,
          medicaments: meds,
          status: 'pending',
          timestamp: new Date(pr.date),
          paye: false,
          totalPrix,
        });
      });
    });
    return records;
  });

  // Stock movements
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    { id: 'sm1', type: 'entree', medicament: 'Paracétamol 1g', quantite: 500, date: new Date(Date.now() - 86400000), motif: 'Livraison fournisseur', pharmacist: 'Halima Abdoulaye' },
    { id: 'sm2', type: 'sortie', medicament: 'Artésunate 60mg', quantite: 20, date: new Date(Date.now() - 43200000), motif: 'Dispensation patients', pharmacist: 'Halima Abdoulaye' },
  ]);

  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [selectedDispensation, setSelectedDispensation] = useState<DispensationRecord | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<DispensationRecord | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showStockEntryDialog, setShowStockEntryDialog] = useState(false);
  const [showPatientInfoDialog, setShowPatientInfoDialog] = useState(false);
  const [selectedPatientForInfo, setSelectedPatientForInfo] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showInteractionAlert, setShowInteractionAlert] = useState(false);
  const [interactionDetails, setInteractionDetails] = useState<string[]>([]);

  const lowStock = PHARMACY_STOCK.filter(s => s.stock <= s.seuil);
  const expiringStock = PHARMACY_STOCK.filter(s => new Date(s.peremption) < new Date(Date.now() + 90 * 86400000));

  const filteredDispensations = useMemo(() => dispensations.filter(d =>
    searchTerm === '' || `${d.patientName} ${d.nhid}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [dispensations, searchTerm]);

  const filteredStock = useMemo(() => {
    if (stockFilter === 'low') return PHARMACY_STOCK.filter(s => s.stock <= s.seuil);
    if (stockFilter === 'expiring') return PHARMACY_STOCK.filter(s => new Date(s.peremption) < new Date(Date.now() + 90 * 86400000));
    return PHARMACY_STOCK;
  }, [stockFilter]);

  // Check drug interactions
  const checkInteractions = (meds: { nom: string }[]) => {
    const alerts: string[] = [];
    meds.forEach(m1 => {
      const baseName = m1.nom.split(' ')[0];
      const interactions = INTERACTIONS_DB[baseName];
      if (interactions) {
        meds.forEach(m2 => {
          if (m1.nom !== m2.nom) {
            const base2 = m2.nom.split(' ')[0];
            if (interactions.some(i => base2.includes(i))) {
              alerts.push(`⚠️ ${m1.nom} ↔ ${m2.nom}: Interaction médicamenteuse potentielle`);
            }
          }
        });
      }
    });
    return alerts;
  };

  const handleOpenDispense = (disp: DispensationRecord) => {
    const updated = { ...disp, medicaments: disp.medicaments.map(m => ({ ...m, dispensed: false })) };
    setSelectedDispensation(updated);
    setVerificationNotes('');
    
    // Check interactions
    const interactions = checkInteractions(disp.medicaments);
    if (interactions.length > 0) {
      setInteractionDetails(interactions);
      setShowInteractionAlert(true);
    }
    
    setShowDispenseDialog(true);
  };

  const toggleMedicament = (index: number) => {
    if (!selectedDispensation) return;
    const updated = { ...selectedDispensation };
    updated.medicaments = [...updated.medicaments];
    updated.medicaments[index] = { ...updated.medicaments[index], dispensed: !updated.medicaments[index].dispensed };
    setSelectedDispensation(updated);
  };

  const handleConfirmDispense = () => {
    if (!selectedDispensation) return;
    const allDispensed = selectedDispensation.medicaments.every(m => m.dispensed);
    if (!allDispensed) {
      toast.error('Cochez tous les médicaments après vérification');
      return;
    }

    setDispensations(prev => prev.map(d =>
      d.id === selectedDispensation.id ? { ...d, status: 'dispensed' as const, pharmacist: 'Halima Abdoulaye', verificationNotes } : d
    ));

    updatePrescriptionStatus(selectedDispensation.patientId, selectedDispensation.prescriptionId, 'delivre');
    advancePatient(selectedDispensation.patientId, 'sorti', 'Pharmacie', 'Médicaments délivrés – Sortie');

    // Add stock movement
    selectedDispensation.medicaments.forEach(m => {
      setStockMovements(prev => [...prev, {
        id: `sm-${Date.now()}-${Math.random()}`,
        type: 'sortie',
        medicament: m.nom,
        quantite: 1,
        date: new Date(),
        motif: `Dispensation – ${selectedDispensation.patientName}`,
        pharmacist: 'Halima Abdoulaye',
      }]);
    });

    setLastReceipt({ ...selectedDispensation, verificationNotes });
    setShowDispenseDialog(false);
    setShowReceiptDialog(true);

    toast.success(`💊 Ordonnance délivrée pour ${selectedDispensation.patientName}`, {
      description: `${selectedDispensation.medicaments.length} médicament(s) • Vérifié par pharmacien`
    });
  };

  const handleRejectPrescription = () => {
    if (!selectedDispensation || !rejectionReason) {
      toast.error('Veuillez indiquer le motif du refus');
      return;
    }

    setDispensations(prev => prev.map(d =>
      d.id === selectedDispensation.id ? { ...d, status: 'rejected' as const, rejectionReason, pharmacist: 'Halima Abdoulaye' } : d
    ));

    // Send back to consultation
    advancePatient(selectedDispensation.patientId, 'consultation', 'Pharmacie', `Ordonnance refusée: ${rejectionReason}`);

    toast.error(`❌ Ordonnance refusée pour ${selectedDispensation.patientName}`, {
      description: `Motif: ${rejectionReason} – Renvoyé en consultation`
    });

    setShowRejectDialog(false);
    setShowDispenseDialog(false);
    setRejectionReason('');
  };

  const handleViewPatientInfo = (patientId: string) => {
    setSelectedPatientForInfo(patientId);
    setShowPatientInfoDialog(true);
  };

  const handleQuickDispense = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    advancePatient(patientId, 'sorti', 'Pharmacie', 'Dispensation directe – Sortie');
    toast.success(`${patient.prenom} ${patient.nom} – Sortie confirmée`);
  };

  const patientForInfo = selectedPatientForInfo ? patients.find(p => p.id === selectedPatientForInfo) : null;

  const stats = {
    pending: dispensations.filter(d => d.status === 'pending').length,
    dispensed: dispensations.filter(d => d.status === 'dispensed').length,
    rejected: dispensations.filter(d => d.status === 'rejected').length,
    totalMeds: dispensations.filter(d => d.status === 'dispensed').reduce((sum, d) => sum + d.medicaments.length, 0),
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Pill className="w-6 h-6 text-primary" /> Pharmacie Hospitalière
          </h1>
          <p className="text-muted-foreground text-sm">Dispensation, contrôle interactions, gestion FEFO, traçabilité</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowStockEntryDialog(true)}>
            <Plus className="w-3 h-3" /> Entrée stock
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Patients à servir', value: patientsAtPharmacy.length, icon: User, color: 'text-primary' },
          { label: 'Ordonnances en attente', value: stats.pending, icon: Clock, color: 'text-orange-500' },
          { label: 'Délivrées', value: stats.dispensed, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Refusées', value: stats.rejected, icon: XCircle, color: 'text-destructive' },
          { label: 'Alertes stock', value: lowStock.length, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Péremption proche', value: expiringStock.length, icon: Clock, color: 'text-orange-500' },
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

      {/* Patients at pharmacy – Priority queue */}
      {patientsAtPharmacy.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" /> File d'attente pharmacie ({patientsAtPharmacy.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patientsAtPharmacy.map(p => {
              const patientDisp = dispensations.find(d => d.patientId === p.id && d.status === 'pending');
              return (
                <div key={p.id} className="p-3 rounded-lg border border-border hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{p.prenom} {p.nom}</p>
                        <Badge variant="outline" className="text-[9px]">{p.nhid}</Badge>
                        {p.urgence <= 2 && <Badge variant="destructive" className="text-[9px]">URGENT P{p.urgence}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.pathologieActuelle}</p>
                      {p.allergies.length > 0 && (
                        <Badge variant="destructive" className="text-[9px] mt-1 gap-1 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" /> Allergies: {p.allergies.join(', ')}
                        </Badge>
                      )}
                      {/* Show prescriptions inline */}
                      {p.prescriptions.filter(pr => pr.statut === 'en_attente').length > 0 && (
                        <div className="mt-2 p-2 rounded bg-muted/50 space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground">ORDONNANCE :</p>
                          {p.prescriptions.filter(pr => pr.statut === 'en_attente').flatMap(pr => pr.medicaments).map((m, i) => (
                            <p key={i} className="text-xs text-foreground">💊 {m.nom} – {m.dosage} – {m.frequence} – {m.duree}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => handleViewPatientInfo(p.id)}>
                        <Eye className="w-3 h-3" /> Dossier
                      </Button>
                      {patientDisp ? (
                        <Button size="sm" className="text-xs gap-1 h-7" onClick={() => handleOpenDispense(patientDisp)}>
                          <ShoppingCart className="w-3 h-3" /> Dispenser
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" className="text-xs gap-1 h-7" onClick={() => handleQuickDispense(p.id)}>
                          <Send className="w-3 h-3" /> Sortie
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1">
          <TabsTrigger value="dispensation" className="text-xs gap-1"><FileText className="w-3 h-3" /> Ordonnances</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs gap-1"><Package className="w-3 h-3" /> Stock FEFO</TabsTrigger>
          <TabsTrigger value="mouvements" className="text-xs gap-1"><RefreshCw className="w-3 h-3" /> Mouvements</TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1"><BarChart3 className="w-3 h-3" /> Historique</TabsTrigger>
        </TabsList>

        {/* Dispensation Queue */}
        <TabsContent value="dispensation" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher patient par nom ou NHID..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          {filteredDispensations.filter(d => d.status === 'pending').length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Pill className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-sm">Aucune ordonnance en attente</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredDispensations.filter(d => d.status === 'pending').map(disp => {
                const pt = patients.find(p => p.id === disp.patientId);
                const hasAllergy = pt && pt.allergies.length > 0;
                return (
                  <Card key={disp.id} className={`transition-all hover:border-primary/30 ${hasAllergy ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-foreground">{disp.patientName}</p>
                            <Badge variant="outline" className="text-[9px]">{disp.nhid}</Badge>
                            {hasAllergy && (
                              <Badge variant="destructive" className="text-[9px] gap-1 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" /> {pt!.allergies.join(', ')}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2 space-y-1">
                            {disp.medicaments.map((m, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <Pill className="w-3 h-3 text-primary shrink-0" />
                                <span className="text-foreground font-medium">{m.nom}</span>
                                <span className="text-muted-foreground">– {m.dosage} – {m.frequence} – {m.duree}</span>
                                {m.lotNumber && <Badge variant="outline" className="text-[8px]">Lot: {m.lotNumber}</Badge>}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => handleOpenDispense(disp)}>
                            <ShoppingCart className="w-3 h-3" /> Dispenser
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleViewPatientInfo(disp.patientId)}>
                            <Eye className="w-3 h-3" /> Dossier
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Stock FEFO */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all' as const, label: `Tous (${PHARMACY_STOCK.length})` },
              { key: 'low' as const, label: `Stock bas (${lowStock.length})` },
              { key: 'expiring' as const, label: `Péremption proche (${expiringStock.length})` },
            ].map(f => (
              <Button key={f.key} variant={stockFilter === f.key ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setStockFilter(f.key)}>
                {f.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredStock.map(s => {
              const ratio = (s.stock / (s.seuil * 3)) * 100;
              const isLow = s.stock <= s.seuil;
              const isCritical = s.stock <= s.seuil * 0.5;
              const isExpiring = new Date(s.peremption) < new Date(Date.now() + 90 * 86400000);
              const isExpired = new Date(s.peremption) < new Date();
              return (
                <Card key={s.id} className={isCritical ? 'border-destructive bg-destructive/5' : isLow ? 'border-orange-500/50 bg-orange-500/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.nom}</p>
                        <p className="text-[10px] text-muted-foreground">{s.categorie}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {isExpired && <Badge variant="destructive" className="text-[9px]">EXPIRÉ</Badge>}
                        {!isExpired && isExpiring && <Badge variant="outline" className="text-[9px] border-orange-500 text-orange-600">Péremption proche</Badge>}
                        {isCritical && <Badge variant="destructive" className="text-[9px]">CRITIQUE</Badge>}
                        {isLow && !isCritical && <Badge variant="outline" className="text-[9px] border-orange-500 text-orange-600">Stock bas</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Progress value={Math.min(ratio, 100)} className={`h-2 flex-1 ${isCritical ? '[&>div]:bg-destructive' : isLow ? '[&>div]:bg-orange-500' : ''}`} />
                      <span className="text-xs font-mono text-muted-foreground">{s.stock}/{s.seuil * 3}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">Exp: {s.peremption} • Seuil: {s.seuil}</p>
                      {(isLow || isExpiring) && (
                        <Button variant="ghost" size="sm" className="text-[10px] h-6 text-primary" onClick={() => toast.info(`Bon de commande généré pour ${s.nom}`)}>
                          Commander →
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Stock Movements */}
        <TabsContent value="mouvements" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> Mouvements de stock</CardTitle>
            </CardHeader>
            <CardContent>
              {stockMovements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun mouvement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {stockMovements.sort((a, b) => b.date.getTime() - a.date.getTime()).map(mv => (
                    <div key={mv.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <div className={`p-1.5 rounded-full ${mv.type === 'entree' ? 'bg-green-500/10' : mv.type === 'retour' ? 'bg-blue-500/10' : 'bg-destructive/10'}`}>
                        {mv.type === 'entree' ? <Plus className="w-3.5 h-3.5 text-green-600" /> : mv.type === 'retour' ? <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> : <Minus className="w-3.5 h-3.5 text-destructive" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{mv.medicament}</p>
                        <p className="text-xs text-muted-foreground">{mv.motif} • {mv.pharmacist}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${mv.type === 'entree' ? 'text-green-600' : 'text-destructive'}`}>
                          {mv.type === 'entree' || mv.type === 'retour' ? '+' : '-'}{mv.quantite}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{mv.date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-3">
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <p className="text-xl font-bold text-foreground">{stats.dispensed}</p>
                <p className="text-xs text-muted-foreground">Dispensées</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 text-center">
                <XCircle className="w-5 h-5 mx-auto text-destructive mb-1" />
                <p className="text-xl font-bold text-foreground">{stats.rejected}</p>
                <p className="text-xs text-muted-foreground">Refusées</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <Pill className="w-5 h-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold text-foreground">{stats.totalMeds}</p>
                <p className="text-xs text-muted-foreground">Médicaments délivrés</p>
              </CardContent>
            </Card>
          </div>

          {dispensations.filter(d => d.status !== 'pending').length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">Aucune dispensation terminée</CardContent></Card>
          ) : dispensations.filter(d => d.status !== 'pending').map(disp => (
            <Card key={disp.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{disp.patientName} ({disp.nhid})</p>
                    <p className="text-xs text-muted-foreground">{disp.medicaments.length} médicament(s) • {disp.pharmacist || 'N/A'}</p>
                    {disp.rejectionReason && <p className="text-xs text-destructive mt-1">Motif: {disp.rejectionReason}</p>}
                    {disp.verificationNotes && <p className="text-xs text-primary mt-1">Notes: {disp.verificationNotes}</p>}
                  </div>
                  <Badge
                    variant={disp.status === 'dispensed' ? 'default' : 'destructive'}
                    className="text-[10px] gap-1"
                  >
                    {disp.status === 'dispensed' ? <><CheckCircle className="w-3 h-3" />Délivré</> : <><XCircle className="w-3 h-3" />Refusé</>}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Predictive Alert */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <TrendingDown className="w-6 h-6 text-orange-500 mt-1 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">🤖 Alerte IA Prédictive – Rupture de stock</p>
            <p className="text-sm text-foreground mt-1">
              <strong>ACT (Artéméther-Luméfantrine)</strong>: Stock actuel 45 unités. Consommation moyenne: 12/jour en saison des pluies.
              Rupture estimée dans <strong>3-4 jours</strong>. Commander 1000 unités immédiatement.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Métronidazole 500mg</strong>: 35 unités restantes (seuil: 100). Péremption: 15/03/2025. Risque de perte.
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="h-7 text-xs" variant="outline" onClick={() => toast.info('Bon de commande ACT généré – 1000 unités')}>Commande ACT</Button>
              <Button size="sm" className="h-7 text-xs" variant="outline" onClick={() => toast.info('Alerte transfert Métronidazole envoyée')}>Transférer Métronidazole</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === DIALOGS === */}

      {/* Dispensation Dialog */}
      <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Vérification & Dispensation</DialogTitle></DialogHeader>
          {selectedDispensation && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Patient info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-bold text-foreground">{selectedDispensation.patientName}</p>
                <p className="text-xs text-muted-foreground">{selectedDispensation.nhid}</p>
                {patients.find(p => p.id === selectedDispensation.patientId)?.allergies.length! > 0 && (
                  <Badge variant="destructive" className="text-[9px] mt-1 gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    ALLERGIES: {patients.find(p => p.id === selectedDispensation.patientId)?.allergies.join(', ')}
                  </Badge>
                )}
              </div>

              {/* Interaction alerts */}
              {interactionDetails.length > 0 && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <p className="text-xs font-bold text-orange-600 mb-1">⚠️ INTERACTIONS MÉDICAMENTEUSES DÉTECTÉES:</p>
                  {interactionDetails.map((d, i) => (
                    <p key={i} className="text-xs text-foreground">{d}</p>
                  ))}
                </div>
              )}

              {/* Verification checklist */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">LISTE DE VÉRIFICATION PHARMACEUTIQUE:</p>
                {[
                  'Identité patient vérifiée (nom, NHID)',
                  'Allergies vérifiées',
                  'Posologie conforme aux recommandations',
                  'Pas de contre-indication majeure',
                  'Stock et péremption vérifiés',
                ].map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <Checkbox />
                    <span>{check}</span>
                  </div>
                ))}
              </div>

              {/* Medications */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground">MÉDICAMENTS À DISPENSER:</p>
                {selectedDispensation.medicaments.map((m, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${m.dispensed ? 'border-green-500/50 bg-green-500/5' : 'border-border'}`}>
                    <Checkbox checked={m.dispensed} onCheckedChange={() => toggleMedicament(i)} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{m.nom}</p>
                      <p className="text-xs text-muted-foreground">{m.dosage} • {m.frequence} • {m.duree}</p>
                      {m.lotNumber && <p className="text-[10px] text-primary mt-0.5">Lot: {m.lotNumber}</p>}
                    </div>
                    {m.dispensed ? <CheckCircle className="w-4 h-4 text-green-600 mt-1" /> : <Pill className="w-4 h-4 text-muted-foreground mt-1" />}
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes de vérification (optionnel)</label>
                <Textarea placeholder="Observations du pharmacien..." value={verificationNotes} onChange={e => setVerificationNotes(e.target.value)} rows={2} className="text-sm" />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => { setShowRejectDialog(true); }}>
              <XCircle className="w-4 h-4" /> Refuser ordonnance
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setShowDispenseDialog(false)}>Annuler</Button>
            <Button onClick={handleConfirmDispense} className="gap-1">
              <CheckCircle className="w-4 h-4" /> Confirmer dispensation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-destructive">❌ Refuser l'ordonnance</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Le patient sera renvoyé en consultation. Veuillez indiquer le motif:</p>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger><SelectValue placeholder="Sélectionner le motif" /></SelectTrigger>
              <SelectContent>
                {[
                  'Interaction médicamenteuse dangereuse',
                  'Allergie détectée',
                  'Posologie non conforme',
                  'Médicament en rupture de stock',
                  'Médicament périmé',
                  'Ordonnance illisible / incomplète',
                  'Contre-indication chez ce patient',
                  'Autre (préciser en notes)',
                ].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleRejectPrescription} className="gap-1">
              <XCircle className="w-4 h-4" /> Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>🧾 Reçu de dispensation</DialogTitle></DialogHeader>
          {lastReceipt && (
            <div className="space-y-3 font-mono text-xs">
              <div className="text-center border-b border-dashed border-border pb-2">
                <p className="font-bold text-sm text-foreground">CHU LA RENAISSANCE</p>
                <p className="text-muted-foreground">N'Djamena, Tchad</p>
                <p className="text-muted-foreground">{new Date().toLocaleString('fr-FR')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-foreground"><strong>Patient:</strong> {lastReceipt.patientName}</p>
                <p className="text-foreground"><strong>NHID:</strong> {lastReceipt.nhid}</p>
                <p className="text-foreground"><strong>Pharmacien:</strong> Halima Abdoulaye</p>
              </div>
              <div className="border-t border-dashed border-border pt-2 space-y-1">
                <p className="font-bold text-foreground">MÉDICAMENTS :</p>
                {lastReceipt.medicaments.map((m, i) => (
                  <div key={i}>
                    <p className="text-foreground">✓ {m.nom}</p>
                    <p className="text-muted-foreground ml-2">{m.dosage} – {m.frequence} – {m.duree}</p>
                    {m.lotNumber && <p className="text-muted-foreground ml-2">Lot: {m.lotNumber}</p>}
                  </div>
                ))}
              </div>
              {lastReceipt.verificationNotes && (
                <div className="border-t border-dashed border-border pt-2">
                  <p className="text-muted-foreground"><strong>Notes:</strong> {lastReceipt.verificationNotes}</p>
                </div>
              )}
              <div className="border-t border-dashed border-border pt-2 text-center">
                <p className="font-bold text-foreground mt-1">BON RÉTABLISSEMENT 🙏</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="gap-1" onClick={() => { toast.success('Reçu imprimé'); setShowReceiptDialog(false); }}>
              <Printer className="w-4 h-4" /> Imprimer
            </Button>
            <Button onClick={() => setShowReceiptDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Info Dialog */}
      <Dialog open={showPatientInfoDialog} onOpenChange={setShowPatientInfoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>📋 Dossier patient – Vue pharmacien</DialogTitle></DialogHeader>
          {patientForInfo && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-bold text-foreground">{patientForInfo.prenom} {patientForInfo.nom}</p>
                <p className="text-xs text-muted-foreground">{patientForInfo.nhid} • {patientForInfo.age} ans • {patientForInfo.sexe} • {patientForInfo.groupeSanguin}</p>
              </div>

              {patientForInfo.allergies.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-bold text-destructive">⚠️ ALLERGIES: {patientForInfo.allergies.join(', ')}</p>
                </div>
              )}

              {patientForInfo.vitaux && (
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: 'TA', value: patientForInfo.vitaux.tension },
                    { label: 'T°', value: `${patientForInfo.vitaux.temperature}°C` },
                    { label: 'FC', value: `${patientForInfo.vitaux.pouls} bpm` },
                    { label: 'SpO2', value: `${patientForInfo.vitaux.spo2}%` },
                    { label: 'Poids', value: `${patientForInfo.vitaux.poids} kg` },
                  ].map(v => (
                    <div key={v.label} className="text-center p-1.5 rounded bg-muted/50">
                      <p className="text-[9px] text-muted-foreground">{v.label}</p>
                      <p className="text-xs font-bold text-foreground">{v.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">PATHOLOGIE</p>
                <p className="text-sm text-foreground">{patientForInfo.pathologieActuelle}</p>
              </div>

              {patientForInfo.labResults.filter(l => l.statut === 'termine').length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">RÉSULTATS LABO PERTINENTS</p>
                  {patientForInfo.labResults.filter(l => l.statut === 'termine').flatMap(l => l.resultats.filter(r => r.statut === 'anormal')).map((r, i) => (
                    <p key={i} className="text-xs text-destructive">⚠️ {r.parametre}: {r.valeur} (N: {r.normal})</p>
                  ))}
                </div>
              )}

              {patientForInfo.prescriptions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">HISTORIQUE PRESCRIPTIONS</p>
                  {patientForInfo.prescriptions.map(pr => (
                    <div key={pr.id} className="p-2 rounded bg-muted/30 mb-1">
                      <div className="flex justify-between">
                        <p className="text-xs text-foreground">{pr.date}</p>
                        <Badge variant={pr.statut === 'delivre' ? 'default' : 'secondary'} className="text-[9px]">{pr.statut === 'delivre' ? 'Délivré' : 'En attente'}</Badge>
                      </div>
                      {pr.medicaments.map((m, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground">• {m.nom} {m.dosage}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPatientInfoDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Entry Dialog */}
      <Dialog open={showStockEntryDialog} onOpenChange={setShowStockEntryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>📦 Entrée de stock</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Médicament</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {PHARMACY_STOCK.map(s => <SelectItem key={s.id} value={s.nom}>{s.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Quantité</label>
              <Input type="number" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">N° de lot</label>
              <Input placeholder="LOT-..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date de péremption</label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockEntryDialog(false)}>Annuler</Button>
            <Button onClick={() => { toast.success('Stock mis à jour'); setShowStockEntryDialog(false); }} className="gap-1">
              <Plus className="w-4 h-4" /> Valider l'entrée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pharmacie;
