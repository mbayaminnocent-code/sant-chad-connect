import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PHARMACY_STOCK } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { Pill, AlertTriangle, TrendingDown, CheckCircle, Package, Send, Search, ShoppingCart, Printer, User, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DispensationRecord {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  prescriptionId: string;
  medicaments: { nom: string; dosage: string; frequence: string; duree: string; dispensed: boolean }[];
  status: 'pending' | 'in_progress' | 'dispensed';
  timestamp: Date;
  pharmacist?: string;
}

const Pharmacie = () => {
  const { patients, advancePatient, getPatientsByStep, updatePrescriptionStatus } = usePatientJourney();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dispensation');

  const patientsAtPharmacy = getPatientsByStep('pharmacie');

  // Build dispensation queue from all pending prescriptions
  const [dispensations, setDispensations] = useState<DispensationRecord[]>(() => {
    const records: DispensationRecord[] = [];
    patients.forEach(p => {
      p.prescriptions.filter(pr => pr.statut === 'en_attente').forEach(pr => {
        records.push({
          id: `disp-${pr.id}`,
          patientId: p.id,
          patientName: `${p.prenom} ${p.nom}`,
          nhid: p.nhid,
          prescriptionId: pr.id,
          medicaments: pr.medicaments.map(m => ({ ...m, dispensed: false })),
          status: 'pending',
          timestamp: new Date(pr.date),
        });
      });
    });
    return records;
  });

  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [selectedDispensation, setSelectedDispensation] = useState<DispensationRecord | null>(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<DispensationRecord | null>(null);

  const lowStock = PHARMACY_STOCK.filter(s => s.stock <= s.seuil);

  const filteredDispensations = dispensations.filter(d => {
    return searchTerm === '' || `${d.patientName} ${d.nhid}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Open dispensation dialog
  const handleOpenDispense = (disp: DispensationRecord) => {
    setSelectedDispensation({ ...disp, medicaments: disp.medicaments.map(m => ({ ...m, dispensed: false })) });
    setShowDispenseDialog(true);
  };

  // Toggle medication dispensed status
  const toggleMedicament = (index: number) => {
    if (!selectedDispensation) return;
    const updated = { ...selectedDispensation };
    updated.medicaments[index].dispensed = !updated.medicaments[index].dispensed;
    setSelectedDispensation(updated);
  };

  // Confirm dispensation
  const handleConfirmDispense = () => {
    if (!selectedDispensation) return;
    const allDispensed = selectedDispensation.medicaments.every(m => m.dispensed);
    if (!allDispensed) {
      toast.error('Veuillez cocher tous les médicaments avant de confirmer');
      return;
    }

    // Update dispensation status
    setDispensations(prev => prev.map(d =>
      d.id === selectedDispensation.id ? { ...d, status: 'dispensed' as const, pharmacist: 'Halima Abdoulaye' } : d
    ));

    // Update prescription status in patient data
    updatePrescriptionStatus(selectedDispensation.patientId, selectedDispensation.prescriptionId, 'delivre');

    // Move patient to sorted
    advancePatient(selectedDispensation.patientId, 'sorti', 'Pharmacie', 'Médicaments délivrés – Patient peut sortir');

    setLastReceipt(selectedDispensation);
    setShowDispenseDialog(false);
    setShowReceiptDialog(true);

    toast.success(`💊 Ordonnance délivrée pour ${selectedDispensation.patientName}`, {
      description: `${selectedDispensation.medicaments.length} médicament(s) dispensé(s)`
    });
  };

  // Quick dispense for patients at pharmacy without existing prescriptions
  const handleQuickDispense = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    advancePatient(patientId, 'sorti', 'Pharmacie', 'Dispensation directe – Sortie du patient');
    toast.success(`${patient.prenom} ${patient.nom} – Sortie confirmée`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacie Hospitalière</h1>
        <p className="text-muted-foreground text-sm">Dispensation nominative, contrôle FEFO, traçabilité complète</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Patients à servir', value: patientsAtPharmacy.length, icon: User, color: 'text-primary' },
          { label: 'Ordonnances en attente', value: dispensations.filter(d => d.status === 'pending').length, icon: Clock, color: 'text-warning' },
          { label: 'Délivrées aujourd\'hui', value: dispensations.filter(d => d.status === 'dispensed').length, icon: CheckCircle, color: 'text-secondary' },
          { label: 'Alertes stock', value: lowStock.length, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Références en stock', value: PHARMACY_STOCK.length, icon: Package, color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted/60"><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patients at pharmacy */}
      {patientsAtPharmacy.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">💊 Patients à la Pharmacie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patientsAtPharmacy.map(p => {
              const patientDisp = dispensations.find(d => d.patientId === p.id && d.status === 'pending');
              return (
                <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-muted-foreground">{p.nhid} • {p.pathologieActuelle}</p>
                      {p.allergies.length > 0 && (
                        <Badge variant="destructive" className="text-[9px] mt-1 gap-1"><AlertTriangle className="w-3 h-3" />{p.allergies.join(', ')}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {patientDisp ? (
                        <Button size="sm" className="text-xs gap-1 h-7" onClick={() => handleOpenDispense(patientDisp)}>
                          <ShoppingCart className="w-3 h-3" /> Dispenser ordonnance
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs gap-1 h-7" onClick={() => handleQuickDispense(p.id)}>
                          <Send className="w-3 h-3" /> Sortie rapide
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Show prescriptions */}
                  {p.prescriptions.filter(pr => pr.statut === 'en_attente').length > 0 && (
                    <div className="p-2 rounded bg-muted/50 space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground">ORDONNANCE :</p>
                      {p.prescriptions.filter(pr => pr.statut === 'en_attente').flatMap(pr => pr.medicaments).map((m, i) => (
                        <p key={i} className="text-xs text-foreground">• {m.nom} – {m.dosage} – {m.frequence} – {m.duree}</p>
                      ))}
                    </div>
                  )}
                  <PatientJourneyTracker patientId={p.id} showEvents />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60">
          <TabsTrigger value="dispensation">📋 File d'attente</TabsTrigger>
          <TabsTrigger value="stock">📦 Stock FEFO</TabsTrigger>
          <TabsTrigger value="history">📊 Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="dispensation" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher un patient..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          {filteredDispensations.filter(d => d.status === 'pending').length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune ordonnance en attente de dispensation.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredDispensations.filter(d => d.status === 'pending').map(disp => (
                <Card key={disp.id} className="hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{disp.patientName}</p>
                          <Badge variant="outline" className="text-[9px]">{disp.nhid}</Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          {disp.medicaments.map((m, i) => (
                            <p key={i} className="text-xs text-foreground">💊 {m.nom} – {m.dosage} – {m.frequence} – {m.duree}</p>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" className="h-8 text-xs gap-1" onClick={() => handleOpenDispense(disp)}>
                        <ShoppingCart className="w-3 h-3" /> Dispenser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stock" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PHARMACY_STOCK.map(s => {
              const ratio = (s.stock / (s.seuil * 3)) * 100;
              const isLow = s.stock <= s.seuil;
              const isExpiring = new Date(s.peremption) < new Date('2025-06-01');
              return (
                <Card key={s.id} className={isLow ? 'border-destructive/50 bg-destructive/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between mb-2">
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
                    <p className="text-[10px] text-muted-foreground">{s.categorie} • Exp: {s.peremption}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {dispensations.filter(d => d.status === 'dispensed').length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune dispensation aujourd'hui.</CardContent></Card>
          ) : dispensations.filter(d => d.status === 'dispensed').map(disp => (
            <Card key={disp.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{disp.patientName} ({disp.nhid})</p>
                    <p className="text-xs text-muted-foreground">{disp.medicaments.length} médicament(s) • Par {disp.pharmacist}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-secondary text-secondary gap-1"><CheckCircle className="w-3 h-3" />Délivré</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Predictive alert */}
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

      {/* Dispensation Dialog */}
      <Dialog open={showDispenseDialog} onOpenChange={setShowDispenseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Dispensation – Vérification</DialogTitle></DialogHeader>
          {selectedDispensation && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-muted/50">
                <p className="text-sm font-bold text-foreground">{selectedDispensation.patientName}</p>
                <p className="text-xs text-muted-foreground">{selectedDispensation.nhid}</p>
                {/* Check allergies */}
                {patients.find(p => p.id === selectedDispensation.patientId)?.allergies.length! > 0 && (
                  <Badge variant="destructive" className="text-[9px] mt-1 gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Allergies: {patients.find(p => p.id === selectedDispensation.patientId)?.allergies.join(', ')}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Cochez chaque médicament après vérification :</p>
                {selectedDispensation.medicaments.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded border border-border">
                    <Checkbox
                      checked={m.dispensed}
                      onCheckedChange={() => toggleMedicament(i)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.nom}</p>
                      <p className="text-xs text-muted-foreground">{m.dosage} • {m.frequence} • {m.duree}</p>
                    </div>
                    <Pill className="w-4 h-4 text-primary mt-1" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispenseDialog(false)}>Annuler</Button>
            <Button onClick={handleConfirmDispense} className="gap-1">
              <CheckCircle className="w-4 h-4" /> Confirmer la dispensation
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
              </div>
              <div className="border-t border-dashed border-border pt-2 space-y-1">
                <p className="font-bold text-foreground">MÉDICAMENTS DÉLIVRÉS :</p>
                {lastReceipt.medicaments.map((m, i) => (
                  <p key={i} className="text-foreground">✓ {m.nom} – {m.dosage} – {m.frequence} ({m.duree})</p>
                ))}
              </div>
              <div className="border-t border-dashed border-border pt-2 text-center">
                <p className="text-muted-foreground">Pharmacien: Halima Abdoulaye</p>
                <p className="font-bold text-foreground mt-1">BON RÉTABLISSEMENT</p>
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
    </div>
  );
};

export default Pharmacie;
