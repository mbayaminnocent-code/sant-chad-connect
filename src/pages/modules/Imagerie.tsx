import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import {
  ScanLine, Camera, FileImage, Send, Clock, CheckCircle, Search, Eye, Monitor,
  Printer, Play, AlertTriangle, User, Zap, ArrowRight, Activity, ImageIcon,
  FileText, Layers, Settings, ChevronRight, Plus, ListOrdered
} from 'lucide-react';
import PriorityQueue, { QueueItem } from '@/components/PriorityQueue';
import WaitTimeAlerts from '@/components/WaitTimeAlerts';
import ServiceDashboard from '@/components/ServiceDashboard';
import { toast } from 'sonner';

const IMAGING_TYPES = [
  { value: 'radiographie', label: 'Radiographie', icon: '📸', duree: '15 min' },
  { value: 'echographie', label: 'Échographie', icon: '🔊', duree: '30 min' },
  { value: 'scanner', label: 'Scanner (TDM)', icon: '🖥️', duree: '20 min' },
  { value: 'irm', label: 'IRM', icon: '🧲', duree: '45 min' },
  { value: 'mammographie', label: 'Mammographie', icon: '📷', duree: '20 min' },
  { value: 'echocardiographie', label: 'Échocardiographie', icon: '💓', duree: '40 min' },
  { value: 'doppler', label: 'Doppler vasculaire', icon: '🩸', duree: '30 min' },
  { value: 'angiographie', label: 'Angiographie', icon: '🫀', duree: '60 min' },
];

const EQUIPMENT = [
  { id: 'eq1', name: 'Radiographie numérique DR', salle: 'Salle 1', status: 'disponible' as const, types: ['radiographie'], icon: '📸' },
  { id: 'eq2', name: 'Échographe GE Logiq E10', salle: 'Salle 2', status: 'disponible' as const, types: ['echographie', 'echocardiographie', 'doppler'], icon: '🔊' },
  { id: 'eq3', name: 'Scanner 64 coupes', salle: 'Salle 3', status: 'disponible' as const, types: ['scanner'], icon: '🖥️' },
  { id: 'eq4', name: 'IRM 1.5T Siemens', salle: 'Salle 4', status: 'maintenance' as const, types: ['irm'], icon: '🧲' },
  { id: 'eq5', name: 'Mammographe numérique', salle: 'Salle 5', status: 'disponible' as const, types: ['mammographie'], icon: '📷' },
  { id: 'eq6', name: 'Angiographe Philips', salle: 'Salle 6', status: 'disponible' as const, types: ['angiographie'], icon: '🫀' },
];

interface ImagingRequest {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  examen: string;
  type: string;
  zone: string;
  docteur: string;
  service: string;
  date: string;
  urgence: number;
  statut: 'en_attente' | 'en_cours' | 'termine';
  equipmentId?: string;
  interpretation?: string;
  technicien?: string;
}

const Imagerie = () => {
  const {
    patients, advancePatient, getPatientsByStep, getPatientEvents,
    addImagingResult, updateImagingResult, hasReceiptForType, getReceiptForType
  } = usePatientJourney();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('file_attente');

  // Dialog states
  const [examDialog, setExamDialog] = useState<{ open: boolean; patientId: string; patientName: string; nhid: string } | null>(null);
  const [interpretDialog, setInterpretDialog] = useState<{ open: boolean; request: ImagingRequest } | null>(null);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [conclusion, setConclusion] = useState('');

  // Local imaging workflow state
  const [localRequests, setLocalRequests] = useState<ImagingRequest[]>([]);

  const patientsAtImaging = getPatientsByStep('imagerie');

  // Build requests: combine consultation-based + patients at imagerie step without requests
  const consultationBasedRequests = useMemo(() => {
    return patients.flatMap(p =>
      p.consultations.flatMap(c =>
        c.examens
          .filter(e => {
            const lower = e.toLowerCase();
            return lower.includes('écho') || lower.includes('scanner') || lower.includes('radio') ||
              lower.includes('irm') || lower.includes('angio') || lower.includes('mammo') || lower.includes('doppler');
          })
          .map((examen, idx) => ({
            id: `img-${p.id}-${c.id}-${idx}`,
            patientId: p.id,
            patientName: `${p.prenom} ${p.nom}`,
            nhid: p.nhid,
            examen,
            type: detectExamType(examen),
            zone: examen,
            docteur: c.docteur,
            service: c.service,
            date: c.date,
            urgence: p.urgence,
            statut: (p.imagingResults.some(r => r.statut === 'termine') ? 'termine' :
              p.imagingResults.some(r => r.statut === 'en_cours') ? 'en_cours' : 'en_attente') as ImagingRequest['statut'],
          }))
      )
    );
  }, [patients]);

  // Patients at imagerie step who DON'T have any consultation-based requests or local requests
  const stepBasedRequests = useMemo(() => {
    const existingPatientIds = new Set([
      ...consultationBasedRequests.map(r => r.patientId),
      ...localRequests.map(r => r.patientId),
    ]);
    return patientsAtImaging
      .filter(p => !existingPatientIds.has(p.id))
      .map(p => {
        const lastEvent = getPatientEvents(p.id).find(e => e.to === 'imagerie');
        return {
          id: `img-step-${p.id}`,
          patientId: p.id,
          patientName: `${p.prenom} ${p.nom}`,
          nhid: p.nhid,
          examen: lastEvent?.details || 'Examen à déterminer',
          type: '',
          zone: '',
          docteur: lastEvent?.module || 'Médecin référent',
          service: p.service,
          date: new Date().toISOString().split('T')[0],
          urgence: p.urgence,
          statut: 'en_attente' as const,
        };
      });
  }, [patientsAtImaging, consultationBasedRequests, localRequests, getPatientEvents]);

  const allRequests = useMemo(() => {
    return [...stepBasedRequests, ...localRequests, ...consultationBasedRequests];
  }, [stepBasedRequests, localRequests, consultationBasedRequests]);

  const filteredRequests = useMemo(() => {
    return allRequests.filter(r => {
      const matchSearch = !searchTerm || `${r.patientName} ${r.nhid} ${r.examen}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.statut === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [allRequests, searchTerm, filterStatus]);

  const completedResults = useMemo(() => {
    return patients.flatMap(p =>
      p.imagingResults.filter(r => r.statut === 'termine').map(r => ({
        ...r, patientName: `${p.prenom} ${p.nom}`, nhid: p.nhid, patientId: p.id,
        docteur: p.consultations[0]?.docteur || 'Dr. inconnu',
      }))
    );
  }, [patients]);

  const stats = useMemo(() => ({
    enAttente: allRequests.filter(r => r.statut === 'en_attente').length,
    enCours: allRequests.filter(r => r.statut === 'en_cours').length,
    termines: completedResults.length,
    patientsPresents: patientsAtImaging.length,
    equipementsActifs: EQUIPMENT.filter(e => e.status !== 'maintenance').length,
  }), [allRequests, completedResults, patientsAtImaging]);

  function detectExamType(examen: string): string {
    const lower = examen.toLowerCase();
    if (lower.includes('radio')) return 'radiographie';
    if (lower.includes('écho') && lower.includes('cardi')) return 'echocardiographie';
    if (lower.includes('écho')) return 'echographie';
    if (lower.includes('scanner') || lower.includes('tdm')) return 'scanner';
    if (lower.includes('irm')) return 'irm';
    if (lower.includes('mammo')) return 'mammographie';
    if (lower.includes('doppler')) return 'doppler';
    if (lower.includes('angio')) return 'angiographie';
    return '';
  }

  const handleStartExam = (req: ImagingRequest) => {
    // Check for payment receipt before starting
    if (!hasReceiptForType(req.patientId, 'imagerie')) {
      toast.error(`⚠️ Reçu de paiement requis pour ${req.patientName}`, {
        description: '💰 Le patient doit d\'abord payer à la caisse et présenter son reçu avant de procéder à l\'examen.',
        duration: 6000,
      });
      return;
    }
    setLocalRequests(prev => {
      const exists = prev.find(r => r.id === req.id);
      if (exists) {
        return prev.map(r => r.id === req.id ? { ...r, statut: 'en_cours' as const } : r);
      }
      return [...prev, { ...req, statut: 'en_cours' as const }];
    });
    addImagingResult(req.patientId, {
      id: `imgr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: IMAGING_TYPES.find(t => t.value === req.type)?.label || req.examen,
      zone: req.zone || req.examen,
      interpretation: '',
      statut: 'en_cours',
    });
    const receipt = getReceiptForType(req.patientId, 'imagerie');
    toast.success(`Examen démarré pour ${req.patientName}`, {
      description: `✅ Reçu vérifié: ${receipt?.id}`,
    });
  };

  const handleOpenInterpretation = (req: ImagingRequest) => {
    setInterpretDialog({ open: true, request: req });
    setInterpretation('');
    setConclusion('');
  };

  const handleSaveInterpretation = () => {
    if (!interpretDialog) return;
    const req = interpretDialog.request;
    const imgResult = patients.find(p => p.id === req.patientId)?.imagingResults.find(r => r.statut === 'en_cours');
    if (imgResult) {
      updateImagingResult(req.patientId, imgResult.id, {
        interpretation: `${interpretation}\n\nConclusion: ${conclusion}`,
        statut: 'termine',
      });
    }
    setLocalRequests(prev => prev.map(r => r.id === req.id ? { ...r, statut: 'termine' as const, interpretation } : r));
    toast.success('Interprétation enregistrée et résultats disponibles');
    setInterpretDialog(null);
  };

  const handleSendBackToDoctor = (patientId: string, patientName: string) => {
    advancePatient(patientId, 'consultation', 'Imagerie', 'Résultats d\'imagerie disponibles');
    toast.success(`${patientName} renvoyé au médecin avec les résultats`);
  };

  const handleCreateExam = () => {
    if (!examDialog || !selectedExamType) return;
    const typeInfo = IMAGING_TYPES.find(t => t.value === selectedExamType);
    const newReq: ImagingRequest = {
      id: `img-new-${Date.now()}`,
      patientId: examDialog.patientId,
      patientName: examDialog.patientName,
      nhid: examDialog.nhid,
      examen: `${typeInfo?.label || selectedExamType} – ${selectedZone}`,
      type: selectedExamType,
      zone: selectedZone,
      docteur: 'Technicien imagerie',
      service: 'Imagerie',
      date: new Date().toISOString().split('T')[0],
      urgence: 3,
      statut: 'en_attente',
      equipmentId: selectedEquipment,
    };
    setLocalRequests(prev => [...prev, newReq]);
    toast.success(`Examen ${typeInfo?.label} programmé pour ${examDialog.patientName}`);
    setExamDialog(null);
    setSelectedExamType('');
    setSelectedZone('');
    setSelectedEquipment('');
  };

  const urgenceColor = (u: number) => {
    if (u <= 2) return 'bg-destructive/10 text-destructive border-destructive/30';
    if (u === 3) return 'bg-warning/10 text-warning border-warning/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  const statutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente': return <Badge variant="outline" className="text-[10px] border-warning/50 text-warning bg-warning/5 gap-1"><Clock className="w-3 h-3" />En attente</Badge>;
      case 'en_cours': return <Badge variant="outline" className="text-[10px] border-primary/50 text-primary bg-primary/5 gap-1"><Activity className="w-3 h-3 animate-pulse" />En cours</Badge>;
      case 'termine': return <Badge variant="outline" className="text-[10px] border-secondary/50 text-secondary bg-secondary/5 gap-1"><CheckCircle className="w-3 h-3" />Terminé</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10"><ScanLine className="w-6 h-6 text-primary" /></div>
            Imagerie Médicale
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Radiologie · Échographie · Scanner · IRM</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
            <Monitor className="w-3 h-3" />{stats.equipementsActifs}/{EQUIPMENT.length} équipements
          </Badge>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Patients présents', value: stats.patientsPresents, icon: User, color: 'text-primary', bg: 'bg-primary/10', pulse: stats.patientsPresents > 0 },
          { label: 'En attente', value: stats.enAttente, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', pulse: false },
          { label: 'En cours', value: stats.enCours, icon: Activity, color: 'text-primary', bg: 'bg-primary/10', pulse: stats.enCours > 0 },
          { label: 'Terminés aujourd\'hui', value: stats.termines, icon: CheckCircle, color: 'text-secondary', bg: 'bg-secondary/10', pulse: false },
        ].map(s => (
          <Card key={s.label} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color} ${s.pulse ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Patients présents - Section prioritaire */}
      {patientsAtImaging.length > 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Patients en salle d'imagerie ({patientsAtImaging.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patientsAtImaging.map(p => {
              const patientRequests = allRequests.filter(r => r.patientId === p.id);
              const hasActiveExam = patientRequests.some(r => r.statut === 'en_cours');
              const allDone = patientRequests.length > 0 && patientRequests.every(r => r.statut === 'termine');
              const hasPaid = hasReceiptForType(p.id, 'imagerie');
              const receipt = getReceiptForType(p.id, 'imagerie');

              return (
                <div key={p.id} className="p-4 rounded-xl border border-border bg-card space-y-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        p.urgence <= 2 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                      }`}>
                        {p.prenom[0]}{p.nom[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{p.prenom} {p.nom}</p>
                        <p className="text-xs text-muted-foreground">{p.nhid} · {p.age} ans · {p.pathologieActuelle}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${urgenceColor(p.urgence)}`}>
                            {p.urgence <= 2 ? '⚡ Urgent' : p.urgence === 3 ? '🔶 Modéré' : '🟢 Normal'}
                          </Badge>
                          {patientRequests.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              · {patientRequests.length} examen{patientRequests.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1"
                        onClick={() => setExamDialog({
                          open: true,
                          patientId: p.id,
                          patientName: `${p.prenom} ${p.nom}`,
                          nhid: p.nhid,
                        })}
                      >
                        <Plus className="w-3 h-3" /> Examen
                      </Button>
                      {allDone && (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1 bg-secondary hover:bg-secondary/90"
                          onClick={() => handleSendBackToDoctor(p.id, `${p.prenom} ${p.nom}`)}
                        >
                          <Send className="w-3 h-3" /> Résultats → Médecin
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Patient's exam pipeline */}
                  {patientRequests.length > 0 && (
                    <div className="space-y-2">
                      {patientRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <div className={`w-1.5 h-8 rounded-full ${
                            req.statut === 'termine' ? 'bg-secondary' : req.statut === 'en_cours' ? 'bg-primary animate-pulse' : 'bg-warning'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{req.examen}</p>
                            <p className="text-[10px] text-muted-foreground">{req.docteur}</p>
                          </div>
                          {statutBadge(req.statut)}
                          <div className="flex items-center gap-1">
                            {req.statut === 'en_attente' && (
                              <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => handleStartExam(req)}>
                                <Play className="w-3 h-3" /> Démarrer
                              </Button>
                            )}
                            {req.statut === 'en_cours' && (
                              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleOpenInterpretation(req)}>
                                <FileText className="w-3 h-3" /> Interpréter
                              </Button>
                            )}
                            {req.statut === 'termine' && (
                              <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1">
                                <Eye className="w-3 h-3" /> Voir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {patientRequests.length === 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-warning/40 bg-warning/5">
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-warning">Aucun examen programmé</p>
                        <p className="text-[10px] text-muted-foreground">Ce patient a été transféré en imagerie. Programmez un examen.</p>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => setExamDialog({
                          open: true,
                          patientId: p.id,
                          patientName: `${p.prenom} ${p.nom}`,
                          nhid: p.nhid,
                        })}
                      >
                        <Plus className="w-3 h-3" /> Programmer
                      </Button>
                    </div>
                  )}

                  <PatientJourneyTracker patientId={p.id} showEvents />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="file_attente" className="gap-1.5 text-xs">
            <Layers className="w-3.5 h-3.5" />Demandes ({stats.enAttente})
          </TabsTrigger>
          <TabsTrigger value="priority_queue" className="gap-1.5 text-xs">
            <ListOrdered className="w-3.5 h-3.5" />File Prioritaire
          </TabsTrigger>
          <TabsTrigger value="resultats" className="gap-1.5 text-xs">
            <FileImage className="w-3.5 h-3.5" />Résultats ({stats.termines})
          </TabsTrigger>
          <TabsTrigger value="alertes" className="gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />Alertes
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5" />Dashboard
          </TabsTrigger>
          <TabsTrigger value="equipements" className="gap-1.5 text-xs">
            <Settings className="w-3.5 h-3.5" />Équipements
          </TabsTrigger>
        </TabsList>

        {/* Demandes */}
        <TabsContent value="file_attente" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher patient, NHID, examen..." className="pl-9 h-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune demande d'imagerie</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Les demandes apparaîtront ici quand un médecin transfère un patient</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredRequests
                .sort((a, b) => a.urgence - b.urgence)
                .map(req => (
                  <Card key={req.id} className="hover:border-primary/20 transition-all group">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 self-stretch rounded-full ${
                          req.statut === 'termine' ? 'bg-secondary' : req.statut === 'en_cours' ? 'bg-primary animate-pulse' : 'bg-warning'
                        }`} />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${urgenceColor(req.urgence)}`}>
                          P{req.urgence}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground">{req.patientName}</p>
                            <span className="text-[10px] text-muted-foreground">{req.nhid}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                              <Camera className="w-3 h-3" />{req.examen}
                            </span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                            <span className="text-[10px] text-muted-foreground">{req.docteur} · {req.service}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statutBadge(req.statut)}
                          {req.statut === 'en_attente' && (
                            <Button size="sm" className="h-7 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleStartExam(req)}>
                              <Play className="w-3 h-3" /> Démarrer
                            </Button>
                          )}
                          {req.statut === 'en_cours' && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleOpenInterpretation(req)}>
                              <FileText className="w-3 h-3" /> Interpréter
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Priority Queue */}
        <TabsContent value="priority_queue">
          <PriorityQueue
            items={allRequests.map(r => ({
              id: r.id,
              patientId: r.patientId,
              patientName: r.patientName,
              nhid: r.nhid,
              urgence: r.urgence,
              examName: r.examen,
              status: r.statut === 'en_attente' ? 'waiting' as const : r.statut === 'en_cours' ? 'in_progress' as const : 'done' as const,
              arrivalTime: new Date(r.date),
              estimatedDuration: IMAGING_TYPES.find(t => t.value === r.type)?.duree
                ? parseInt(IMAGING_TYPES.find(t => t.value === r.type)!.duree)
                : 20,
            }))}
            title="File d'attente Imagerie"
            icon={<ScanLine className="w-4 h-4 text-primary" />}
            inProgressCount={stats.enCours}
            maxParallel={EQUIPMENT.filter(e => e.status === 'disponible').length}
          />
        </TabsContent>

        {/* Alertes */}
        <TabsContent value="alertes">
          <WaitTimeAlerts
            items={allRequests.map(r => ({
              id: r.id, patientId: r.patientId, patientName: r.patientName, nhid: r.nhid,
              urgence: r.urgence, examName: r.examen,
              status: r.statut === 'en_attente' ? 'waiting' as const : r.statut === 'en_cours' ? 'in_progress' as const : 'done' as const,
              arrivalTime: new Date(r.date),
              estimatedDuration: IMAGING_TYPES.find(t => t.value === r.type)?.duree ? parseInt(IMAGING_TYPES.find(t => t.value === r.type)!.duree) : 20,
            }))}
            serviceName="Imagerie"
          />
        </TabsContent>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <ServiceDashboard
            items={allRequests.map(r => ({
              id: r.id, patientId: r.patientId, patientName: r.patientName, nhid: r.nhid,
              urgence: r.urgence, examName: r.examen,
              status: r.statut === 'en_attente' ? 'waiting' as const : r.statut === 'en_cours' ? 'in_progress' as const : 'done' as const,
              arrivalTime: new Date(r.date),
              estimatedDuration: IMAGING_TYPES.find(t => t.value === r.type)?.duree ? parseInt(IMAGING_TYPES.find(t => t.value === r.type)!.duree) : 20,
            }))}
            serviceName="Imagerie"
            maxParallel={EQUIPMENT.filter(e => e.status === 'disponible').length}
            inProgressCount={stats.enCours}
          />
        </TabsContent>

        {/* Résultats */}
        <TabsContent value="resultats" className="space-y-3">
          {completedResults.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <FileImage className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun résultat disponible</p>
              </CardContent>
            </Card>
          ) : (
            completedResults.map(result => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{result.patientName}</p>
                      <p className="text-xs text-muted-foreground">{result.nhid} · {result.type} – {result.zone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-secondary/50 text-secondary gap-1">
                        <CheckCircle className="w-3 h-3" />Résultat disponible
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileImage className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{result.type} – {result.zone}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line">{result.interpretation}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs gap-1"><Eye className="w-3 h-3" /> Visualiser DICOM</Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1"><Printer className="w-3 h-3" /> Imprimer</Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1 ml-auto bg-secondary hover:bg-secondary/90"
                      onClick={() => handleSendBackToDoctor(result.patientId, result.patientName)}
                    >
                      <Send className="w-3 h-3" /> Renvoyer au médecin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Équipements */}
        <TabsContent value="equipements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {EQUIPMENT.map(eq => (
              <Card key={eq.id} className={`transition-all hover:shadow-md ${eq.status === 'maintenance' ? 'border-warning/30 bg-warning/[0.02]' : 'border-border/50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{eq.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{eq.name}</p>
                        <p className="text-[10px] text-muted-foreground">{eq.salle}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {eq.types.map(t => {
                            const typeInfo = IMAGING_TYPES.find(it => it.value === t);
                            return (
                              <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0 border-border">
                                {typeInfo?.label || t}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] whitespace-nowrap ${
                      eq.status === 'disponible' ? 'border-secondary/50 text-secondary' : 'border-warning/50 text-warning'
                    }`}>
                      {eq.status === 'disponible' ? '✅ Disponible' : '⚠️ Maintenance'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Programmer un examen */}
      <Dialog open={!!examDialog?.open} onOpenChange={(open) => !open && setExamDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Programmer un examen
            </DialogTitle>
          </DialogHeader>
          {examDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium text-foreground">{examDialog.patientName}</p>
                <p className="text-xs text-muted-foreground">{examDialog.nhid}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Type d'examen</label>
                  <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                    <SelectContent>
                      {IMAGING_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">{t.icon} {t.label} <span className="text-muted-foreground text-[10px]">({t.duree})</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Zone / Région anatomique</label>
                  <Input placeholder="ex: Thorax, Abdomen, Genou droit..." value={selectedZone} onChange={e => setSelectedZone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Équipement</label>
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <SelectTrigger><SelectValue placeholder="Auto (disponible)" /></SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT
                        .filter(eq => eq.status === 'disponible' && (!selectedExamType || eq.types.includes(selectedExamType)))
                        .map(eq => (
                          <SelectItem key={eq.id} value={eq.id}>{eq.icon} {eq.name} – {eq.salle}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamDialog(null)}>Annuler</Button>
            <Button onClick={handleCreateExam} disabled={!selectedExamType || !selectedZone}>
              <Plus className="w-4 h-4 mr-1" /> Programmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Interprétation */}
      <Dialog open={!!interpretDialog?.open} onOpenChange={(open) => !open && setInterpretDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Interprétation radiologique
            </DialogTitle>
          </DialogHeader>
          {interpretDialog && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium text-foreground">{interpretDialog.request.patientName}</p>
                <p className="text-xs text-muted-foreground">{interpretDialog.request.nhid} · {interpretDialog.request.examen}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Description des images</label>
                <Textarea
                  placeholder="Décrire les observations radiologiques..."
                  value={interpretation}
                  onChange={e => setInterpretation(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Conclusion</label>
                <Textarea
                  placeholder="Conclusion et recommandations..."
                  value={conclusion}
                  onChange={e => setConclusion(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterpretDialog(null)}>Annuler</Button>
            <Button onClick={handleSaveInterpretation} disabled={!interpretation || !conclusion}>
              <CheckCircle className="w-4 h-4 mr-1" /> Valider & Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Imagerie;
