import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { Scissors, Clock, CheckCircle, AlertTriangle, Calendar, Play, FileText, Send, Plus, User, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface Surgery {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  type: string;
  salle: string;
  heure: string;
  statut: 'planifie' | 'pre_op' | 'en_cours' | 'post_op' | 'termine';
  chirurgien: string;
  anesthesiste: string;
  risque: 'faible' | 'moyen' | 'élevé';
  checklist: { item: string; checked: boolean }[];
  notes: string;
  dureeEstimee: string;
}

const OMS_CHECKLIST = [
  'Identité du patient vérifiée',
  'Site opératoire marqué',
  'Consentement éclairé signé',
  'Allergies vérifiées',
  'Voies aériennes évaluées',
  'Risque hémorragique évalué',
  'Antibioprophylaxie administrée',
  'Imagerie affichée au bloc',
  'Matériel vérifié et stérilisé',
  'Équipe présentée (Time-Out)',
];

const Salles = ['Bloc A', 'Bloc B', 'Bloc C – Urgences'];

const BlocOperatoire = () => {
  const { patients, advancePatient } = usePatientJourney();

  const [surgeries, setSurgeries] = useState<Surgery[]>([
    {
      id: 'surg-1', patientId: '5', patientName: 'Fatimé Zara', nhid: 'TCD-2024-00005',
      type: 'Ostéosynthèse tibia droit', salle: 'Bloc A', heure: '08:00',
      statut: 'planifie', chirurgien: 'Pr. Hassan Ali', anesthesiste: 'Dr. Fadil Moussa',
      risque: 'moyen', dureeEstimee: '2h30',
      checklist: OMS_CHECKLIST.map(item => ({ item, checked: false })),
      notes: 'Fracture ouverte Gustilo II. Prévoir fixateur externe.',
    },
    {
      id: 'surg-2', patientId: '10', patientName: 'Youssouf Haroun', nhid: 'TCD-2024-00010',
      type: 'Appendicectomie', salle: 'Bloc B', heure: '10:30',
      statut: 'planifie', chirurgien: 'Dr. Moussa Fadil', anesthesiste: 'Dr. Amina Saleh',
      risque: 'faible', dureeEstimee: '1h00',
      checklist: OMS_CHECKLIST.map(item => ({ item, checked: false })),
      notes: 'Appendicite aiguë confirmée à l\'échographie.',
    },
    {
      id: 'surg-3', patientId: '12', patientName: 'Tchari Abba', nhid: 'TCD-2024-00012',
      type: 'Biopsie hépatique', salle: 'Bloc A', heure: '14:00',
      statut: 'planifie', chirurgien: 'Dr. Abakar Saleh', anesthesiste: 'Dr. Fadil Moussa',
      risque: 'élevé', dureeEstimee: '1h30',
      checklist: OMS_CHECKLIST.map(item => ({ item, checked: false })),
      notes: 'Cancer du foie stade III. Prévoir sang compatible O-.',
    },
  ]);

  const [showNewSurgeryDialog, setShowNewSurgeryDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [showPostOpDialog, setShowPostOpDialog] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);

  // New surgery form state
  const [newPatientId, setNewPatientId] = useState('');
  const [newType, setNewType] = useState('');
  const [newSalle, setNewSalle] = useState('');
  const [newHeure, setNewHeure] = useState('');
  const [newChirurgien, setNewChirurgien] = useState('');
  const [newAnesthesiste, setNewAnesthesiste] = useState('');
  const [newRisque, setNewRisque] = useState<'faible' | 'moyen' | 'élevé'>('moyen');
  const [newDuree, setNewDuree] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [postOpNotes, setPostOpNotes] = useState('');

  const handleCreateSurgery = () => {
    const patient = patients.find(p => p.id === newPatientId);
    if (!patient || !newType || !newSalle) return;

    const surgery: Surgery = {
      id: `surg-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`,
      nhid: patient.nhid,
      type: newType, salle: newSalle, heure: newHeure,
      statut: 'planifie', chirurgien: newChirurgien, anesthesiste: newAnesthesiste,
      risque: newRisque, dureeEstimee: newDuree,
      checklist: OMS_CHECKLIST.map(item => ({ item, checked: false })),
      notes: newNotes,
    };
    setSurgeries(prev => [...prev, surgery]);
    setShowNewSurgeryDialog(false);
    toast.success(`Intervention planifiée : ${newType} pour ${patient.prenom} ${patient.nom}`);
    // Reset
    setNewPatientId(''); setNewType(''); setNewSalle(''); setNewHeure('');
    setNewChirurgien(''); setNewAnesthesiste(''); setNewRisque('moyen'); setNewDuree(''); setNewNotes('');
  };

  // Open checklist
  const handleOpenChecklist = (surgery: Surgery) => {
    setSelectedSurgery(surgery);
    setShowChecklistDialog(true);
  };

  const toggleChecklistItem = (index: number) => {
    if (!selectedSurgery) return;
    const updated = { ...selectedSurgery };
    updated.checklist[index].checked = !updated.checklist[index].checked;
    setSelectedSurgery(updated);
  };

  const handleValidateChecklist = () => {
    if (!selectedSurgery) return;
    const allChecked = selectedSurgery.checklist.every(c => c.checked);
    if (!allChecked) {
      toast.error('Tous les items de la check-list doivent être vérifiés');
      return;
    }
    setSurgeries(prev => prev.map(s =>
      s.id === selectedSurgery.id ? { ...s, statut: 'pre_op', checklist: selectedSurgery.checklist } : s
    ));
    setShowChecklistDialog(false);
    toast.success('✅ Check-list OMS validée – Patient prêt pour le bloc');
  };

  // Start surgery
  const handleStartSurgery = (surgeryId: string) => {
    setSurgeries(prev => prev.map(s => s.id === surgeryId ? { ...s, statut: 'en_cours' } : s));
    toast.info('🔴 Intervention en cours');
  };

  // End surgery → post-op
  const handleEndSurgery = (surgery: Surgery) => {
    setSelectedSurgery(surgery);
    setPostOpNotes('');
    setShowPostOpDialog(true);
  };

  // Save post-op and send to DPI
  const handleSavePostOp = () => {
    if (!selectedSurgery) return;
    setSurgeries(prev => prev.map(s =>
      s.id === selectedSurgery.id ? { ...s, statut: 'termine', notes: s.notes + '\n\nPost-op: ' + postOpNotes } : s
    ));
    
    // Advance patient to hospitalisation or consultation
    advancePatient(selectedSurgery.patientId, 'hospitalise', 'Bloc Opératoire',
      `Post-op ${selectedSurgery.type} – ${postOpNotes.substring(0, 60)}`
    );
    
    setShowPostOpDialog(false);
    toast.success(`Rapport post-opératoire enregistré → DPI de ${selectedSurgery.patientName}`, {
      description: 'Patient transféré en hospitalisation pour surveillance'
    });
  };

  const getStatusColor = (statut: Surgery['statut']) => {
    switch (statut) {
      case 'planifie': return 'bg-muted text-muted-foreground';
      case 'pre_op': return 'bg-primary/10 text-primary';
      case 'en_cours': return 'bg-destructive/10 text-destructive animate-pulse';
      case 'post_op': return 'bg-warning/10 text-warning';
      case 'termine': return 'bg-secondary/10 text-secondary';
    }
  };

  const getStatusLabel = (statut: Surgery['statut']) => {
    switch (statut) {
      case 'planifie': return '📅 Planifié';
      case 'pre_op': return '✅ Pré-op validé';
      case 'en_cours': return '🔴 En cours';
      case 'post_op': return '🔶 Post-op';
      case 'termine': return '✅ Terminé';
    }
  };

  const activeSurgeries = surgeries.filter(s => s.statut !== 'termine');
  const completedSurgeries = surgeries.filter(s => s.statut === 'termine');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bloc Opératoire</h1>
          <p className="text-muted-foreground text-sm">Planning, check-list OMS, suivi per-opératoire et rapport post-op → DPI</p>
        </div>
        <Button className="gap-1" onClick={() => setShowNewSurgeryDialog(true)}>
          <Plus className="w-4 h-4" /> Planifier une intervention
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Interventions aujourd'hui", value: surgeries.length, icon: Scissors, color: 'text-primary' },
          { label: 'En cours', value: surgeries.filter(s => s.statut === 'en_cours').length, icon: Activity, color: 'text-destructive' },
          { label: 'Terminées', value: completedSurgeries.length, icon: CheckCircle, color: 'text-secondary' },
          { label: 'Salles occupées', value: `${new Set(surgeries.filter(s => s.statut === 'en_cours').map(s => s.salle)).size}/${Salles.length}`, icon: Calendar, color: 'text-muted-foreground' },
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

      <Tabs defaultValue="active">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="active">🏥 Programme ({activeSurgeries.length})</TabsTrigger>
          <TabsTrigger value="completed">✅ Terminées ({completedSurgeries.length})</TabsTrigger>
          <TabsTrigger value="salles">🚪 Salles</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeSurgeries.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune intervention planifiée.</CardContent></Card>
          ) : activeSurgeries.map(s => (
            <Card key={s.id} className={`border-l-4 ${
              s.statut === 'en_cours' ? 'border-l-destructive' :
              s.statut === 'pre_op' ? 'border-l-primary' : 'border-l-muted'
            }`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-foreground">{s.type}</p>
                    <p className="text-sm text-foreground">Patient: {s.patientName} ({s.nhid})</p>
                    <p className="text-sm text-muted-foreground">
                      Chirurgien: {s.chirurgien} • Anesthésiste: {s.anesthesiste}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.salle} • {s.heure} • Durée estimée: {s.dureeEstimee}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={`text-xs ${getStatusColor(s.statut)}`}>{getStatusLabel(s.statut)}</Badge>
                    <Badge variant={s.risque === 'élevé' ? 'destructive' : s.risque === 'moyen' ? 'secondary' : 'outline'}>
                      Risque {s.risque}
                    </Badge>
                  </div>
                </div>

                {s.risque === 'élevé' && (
                  <div className="p-2 rounded bg-destructive/10 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <p className="text-xs text-destructive">⚠️ Alerte IA: Risque hémorragique élevé – Prévoir sang compatible</p>
                  </div>
                )}

                {s.notes && (
                  <p className="text-xs text-muted-foreground italic">📝 {s.notes}</p>
                )}

                {/* Patient journey */}
                <PatientJourneyTracker patientId={s.patientId} />

                {/* Action buttons based on status */}
                <div className="flex gap-2 flex-wrap">
                  {s.statut === 'planifie' && (
                    <Button size="sm" className="text-xs gap-1" onClick={() => handleOpenChecklist(s)}>
                      <CheckCircle className="w-3 h-3" /> Check-list OMS
                    </Button>
                  )}
                  {s.statut === 'pre_op' && (
                    <Button size="sm" className="text-xs gap-1 bg-destructive hover:bg-destructive/90" onClick={() => handleStartSurgery(s.id)}>
                      <Play className="w-3 h-3" /> Démarrer l'intervention
                    </Button>
                  )}
                  {s.statut === 'en_cours' && (
                    <Button size="sm" className="text-xs gap-1" onClick={() => handleEndSurgery(s)}>
                      <FileText className="w-3 h-3" /> Fin d'intervention → Post-op
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedSurgeries.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune intervention terminée aujourd'hui.</CardContent></Card>
          ) : completedSurgeries.map(s => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{s.type} – {s.patientName}</p>
                    <p className="text-xs text-muted-foreground">{s.chirurgien} • {s.salle} • {s.heure}</p>
                    {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">{s.notes}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] border-secondary text-secondary gap-1">
                    <Send className="w-3 h-3" /> Rapport → DPI
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="salles" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Salles.map(salle => {
              const currentSurgery = surgeries.find(s => s.salle === salle && s.statut === 'en_cours');
              const nextSurgery = surgeries.find(s => s.salle === salle && s.statut === 'planifie');
              return (
                <Card key={salle} className={currentSurgery ? 'border-destructive/50' : 'border-secondary/30'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      🚪 {salle}
                      {currentSurgery ? (
                        <Badge variant="destructive" className="text-[10px]">OCCUPÉE</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-secondary text-secondary">LIBRE</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {currentSurgery ? (
                      <div className="p-2 rounded bg-destructive/5 space-y-1">
                        <p className="text-sm font-medium text-foreground">🔴 {currentSurgery.type}</p>
                        <p className="text-xs text-muted-foreground">{currentSurgery.patientName} • {currentSurgery.chirurgien}</p>
                      </div>
                    ) : nextSurgery ? (
                      <div className="p-2 rounded bg-muted/50 space-y-1">
                        <p className="text-sm font-medium text-foreground">📅 Prochaine: {nextSurgery.type}</p>
                        <p className="text-xs text-muted-foreground">{nextSurgery.patientName} • {nextSurgery.heure}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucune intervention programmée</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Surgery Dialog */}
      <Dialog open={showNewSurgeryDialog} onOpenChange={setShowNewSurgeryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Planifier une intervention</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Patient</label>
              <Select value={newPatientId} onValueChange={setNewPatientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom} – {p.nhid}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type d'intervention</label>
              <Input value={newType} onChange={e => setNewType(e.target.value)} placeholder="Ex: Appendicectomie" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Salle</label>
                <Select value={newSalle} onValueChange={setNewSalle}>
                  <SelectTrigger><SelectValue placeholder="Salle" /></SelectTrigger>
                  <SelectContent>{Salles.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Heure</label>
                <Input type="time" value={newHeure} onChange={e => setNewHeure(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Chirurgien</label>
                <Input value={newChirurgien} onChange={e => setNewChirurgien(e.target.value)} placeholder="Pr. ..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Anesthésiste</label>
                <Input value={newAnesthesiste} onChange={e => setNewAnesthesiste(e.target.value)} placeholder="Dr. ..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Risque</label>
                <Select value={newRisque} onValueChange={(v: any) => setNewRisque(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="élevé">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Durée estimée</label>
                <Input value={newDuree} onChange={e => setNewDuree(e.target.value)} placeholder="Ex: 2h00" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes pré-opératoires</label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Instructions..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSurgeryDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateSurgery} disabled={!newPatientId || !newType || !newSalle}>Planifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check-list OMS – Sécurité chirurgicale</DialogTitle>
          </DialogHeader>
          {selectedSurgery && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-muted/50">
                <p className="text-sm font-bold text-foreground">{selectedSurgery.patientName}</p>
                <p className="text-xs text-muted-foreground">{selectedSurgery.type} • {selectedSurgery.salle} • {selectedSurgery.heure}</p>
              </div>
              <div className="space-y-2">
                {selectedSurgery.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded border border-border">
                    <Checkbox checked={item.checked} onCheckedChange={() => toggleChecklistItem(i)} />
                    <span className={`text-sm ${item.checked ? 'text-secondary line-through' : 'text-foreground'}`}>{item.item}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                ✅ {selectedSurgery.checklist.filter(c => c.checked).length}/{selectedSurgery.checklist.length} items vérifiés
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChecklistDialog(false)}>Annuler</Button>
            <Button onClick={handleValidateChecklist} className="gap-1">
              <CheckCircle className="w-4 h-4" /> Valider la check-list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-Op Dialog */}
      <Dialog open={showPostOpDialog} onOpenChange={setShowPostOpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rapport post-opératoire</DialogTitle></DialogHeader>
          {selectedSurgery && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-muted/50">
                <p className="text-sm font-bold text-foreground">{selectedSurgery.type}</p>
                <p className="text-xs text-muted-foreground">{selectedSurgery.patientName} • {selectedSurgery.chirurgien}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Compte-rendu opératoire</label>
                <Textarea
                  value={postOpNotes}
                  onChange={e => setPostOpNotes(e.target.value)}
                  placeholder="Déroulement de l'intervention, geste réalisé, complications éventuelles, consignes post-op..."
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostOpDialog(false)}>Annuler</Button>
            <Button onClick={handleSavePostOp} className="gap-1">
              <Send className="w-4 h-4" /> Enregistrer → DPI + Hospitalisation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlocOperatoire;
