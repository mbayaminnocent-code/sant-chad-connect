import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { FlaskConical, CheckCircle, Clock, Search, Send, Play, FileText, AlertTriangle, Plus, Beaker, Banknote, ShieldCheck, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';
import PriorityQueue from '@/components/PriorityQueue';

const EXAM_PRICES: Record<string, number> = {
  'nfs': 8000, 'ge': 5000, 'glycemie': 3000, 'creat': 10000,
  'bilan_hep': 15000, 'troponine': 20000, 'hba1c': 8000,
  'proteinurie': 6000, 'hemoculture': 12000, 'bk': 10000,
  'ionogramme': 12000, 'pcr_meningo': 25000,
};

const EXAM_DURATIONS: Record<string, number> = {
  'nfs': 15, 'ge': 20, 'glycemie': 10, 'creat': 20,
  'bilan_hep': 30, 'troponine': 25, 'hba1c': 15,
  'proteinurie': 45, 'hemoculture': 60, 'bk': 30,
  'ionogramme': 20, 'pcr_meningo': 45,
};

const EXAM_CATALOG = [
  { id: 'nfs', name: 'NFS Complète', category: 'Hématologie', params: ['Hémoglobine', 'Globules blancs', 'Plaquettes', 'Hématocrite'] },
  { id: 'ge', name: 'Goutte Épaisse + Frottis', category: 'Parasitologie', params: ['P. falciparum', 'Densité parasitaire'] },
  { id: 'glycemie', name: 'Glycémie', category: 'Biochimie', params: ['Glycémie à jeun'] },
  { id: 'creat', name: 'Créatinine + Urée', category: 'Biochimie', params: ['Créatinine', 'Urée', 'DFG'] },
  { id: 'bilan_hep', name: 'Bilan Hépatique', category: 'Biochimie', params: ['ALAT', 'ASAT', 'GGT', 'Bilirubine totale'] },
  { id: 'troponine', name: 'Troponine HS', category: 'Cardiologie', params: ['Troponine HS', 'BNP'] },
  { id: 'hba1c', name: 'HbA1c', category: 'Biochimie', params: ['HbA1c'] },
  { id: 'proteinurie', name: 'Protéinurie 24h', category: 'Urines', params: ['Protéinurie', 'Créatininurie'] },
  { id: 'hemoculture', name: 'Hémocultures', category: 'Microbiologie', params: ['Culture aérobie', 'Culture anaérobie'] },
  { id: 'bk', name: 'BK Crachats x3', category: 'Microbiologie', params: ['BAAR J1', 'BAAR J2', 'BAAR J3'] },
  { id: 'ionogramme', name: 'Ionogramme sanguin', category: 'Biochimie', params: ['Na+', 'K+', 'Cl-', 'Ca++'] },
  { id: 'pcr_meningo', name: 'PCR Méningocoque', category: 'Biologie moléculaire', params: ['PCR N. meningitidis'] },
];

const NORMAL_VALUES: Record<string, string> = {
  'Hémoglobine': '13-17 g/dL', 'Globules blancs': '4000-10000/µL', 'Plaquettes': '150000-400000/µL',
  'Hématocrite': '40-54%', 'P. falciparum': 'Négatif', 'Densité parasitaire': '<0',
  'Glycémie à jeun': '0.7-1.1 g/L', 'Créatinine': '7-13 mg/L', 'Urée': '0.15-0.45 g/L', 'DFG': '>90 mL/min',
  'ALAT': '<40 UI/L', 'ASAT': '<40 UI/L', 'GGT': '<50 UI/L', 'Bilirubine totale': '<12 mg/L',
  'Troponine HS': '<14 ng/L', 'BNP': '<100 pg/mL', 'HbA1c': '<6.5%',
  'Protéinurie': '<150 mg/24h', 'Créatininurie': '8-18 mmol/24h',
  'Culture aérobie': 'Négatif', 'Culture anaérobie': 'Négatif',
  'BAAR J1': 'Négatif', 'BAAR J2': 'Négatif', 'BAAR J3': 'Négatif',
  'Na+': '135-145 mmol/L', 'K+': '3.5-5 mmol/L', 'Cl-': '95-105 mmol/L', 'Ca++': '2.2-2.6 mmol/L',
  'PCR N. meningitidis': 'Négatif',
};

interface PendingExam {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  examCatalogId: string;
  examName: string;
  category: string;
  prescriber: string;
  status: 'pending' | 'in_progress' | 'results_entry' | 'validated' | 'sent_to_dpi';
  params: string[];
  results: Record<string, { value: string; status: 'normal' | 'anormal' }>;
  createdAt: Date;
  validatedBy?: string;
  paye: boolean;
  prix: number;
  referencePaiement?: string;
}

const Laboratoire = () => {
  const { patients, advancePatient, getPatientsByStep, addLabResult, hasReceiptForType, getReceiptForType } = usePatientJourney();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('worklist');

  // Exam management state
  const [pendingExams, setPendingExams] = useState<PendingExam[]>(() => {
    // Initialize from existing patient consultations
    const exams: PendingExam[] = [];
    patients.forEach(p => {
      p.consultations.forEach(c => {
        c.examens.forEach((examen, idx) => {
          const catalogMatch = EXAM_CATALOG.find(e => examen.toLowerCase().includes(e.name.toLowerCase().substring(0, 5)));
          const hasResult = p.labResults.some(r => r.type.toLowerCase().includes(examen.toLowerCase().substring(0, 5)) && r.statut === 'termine');
          exams.push({
            id: `init-${p.id}-${idx}`,
            patientId: p.id,
            patientName: `${p.prenom} ${p.nom}`,
            nhid: p.nhid,
            examCatalogId: catalogMatch?.id || 'nfs',
            examName: examen,
            category: catalogMatch?.category || 'Autre',
            prescriber: c.docteur,
            status: hasResult ? 'sent_to_dpi' : 'pending',
            params: catalogMatch?.params || [examen],
            results: {},
            createdAt: new Date(c.date),
            paye: hasResult, // already done = already paid
            prix: EXAM_PRICES[catalogMatch?.id || 'nfs'] || 8000,
          });
        });
      });
    });
    return exams;
  });
  const processedExamIdsRef = useRef<Set<string>>(new Set(pendingExams.map(e => e.id)));

  // Sync: detect new lab requests from DPI or other modules
  useEffect(() => {
    const newExams: PendingExam[] = [];
    patients.forEach(p => {
      // Check labResults that are pending (sent from DPI but not yet in worklist)
      p.labResults.forEach((lr, idx) => {
        const examId = `lr-${p.id}-${lr.id}`;
        if ((lr.statut === 'en_cours' || lr.statut === 'en_attente') && !processedExamIdsRef.current.has(examId)) {
          const catalogMatch = EXAM_CATALOG.find(e => lr.type.toLowerCase().includes(e.name.toLowerCase().substring(0, 5)));
          newExams.push({
            id: examId,
            patientId: p.id,
            patientName: `${p.prenom} ${p.nom}`,
            nhid: p.nhid,
            examCatalogId: catalogMatch?.id || 'nfs',
            examName: lr.type,
            category: catalogMatch?.category || 'Autre',
            prescriber: 'DPI – Médecin',
            status: 'pending',
            params: catalogMatch?.params || [lr.type],
            results: {},
            createdAt: new Date(lr.date),
            paye: lr.paye || false,
            prix: EXAM_PRICES[catalogMatch?.id || 'nfs'] || 8000,
          });
          processedExamIdsRef.current.add(examId);
        }
      });

      // Also check consultations for new exams not yet tracked
      p.consultations.forEach(c => {
        c.examens.forEach((examen, idx) => {
          const examId = `consult-${p.id}-${c.date}-${idx}`;
          if (!processedExamIdsRef.current.has(examId)) {
            const catalogMatch = EXAM_CATALOG.find(e => examen.toLowerCase().includes(e.name.toLowerCase().substring(0, 5)));
            const hasResult = p.labResults.some(r => r.type.toLowerCase().includes(examen.toLowerCase().substring(0, 5)) && r.statut === 'termine');
            if (!hasResult) {
              newExams.push({
                id: examId,
                patientId: p.id,
                patientName: `${p.prenom} ${p.nom}`,
                nhid: p.nhid,
                examCatalogId: catalogMatch?.id || 'nfs',
                examName: examen,
                category: catalogMatch?.category || 'Autre',
                prescriber: c.docteur,
                status: 'pending',
                params: catalogMatch?.params || [examen],
                results: {},
                createdAt: new Date(c.date),
                paye: false,
                prix: EXAM_PRICES[catalogMatch?.id || 'nfs'] || 8000,
              });
            }
            processedExamIdsRef.current.add(examId);
          }
        });
      });
    });

    if (newExams.length > 0) {
      setPendingExams(prev => [...newExams, ...prev]);
      toast.info(`📥 ${newExams.length} nouvel(les) demande(s) d'examen reçue(s)`, {
        description: 'Worklist mise à jour automatiquement'
      });
    }
  }, [patients]);
  const [showNewExamDialog, setShowNewExamDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<PendingExam | null>(null);
  const [newExamPatientId, setNewExamPatientId] = useState('');
  const [newExamCatalogId, setNewExamCatalogId] = useState('');
  const [resultValues, setResultValues] = useState<Record<string, string>>({});
  const [technicianNote, setTechnicianNote] = useState('');

  const patientsAtLab = getPatientsByStep('labo');

  const filteredExams = pendingExams.filter(e => {
    const matchSearch = searchTerm === '' || `${e.patientName} ${e.nhid} ${e.examName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const worklistExams = filteredExams.filter(e => e.status !== 'sent_to_dpi');
  const completedExams = filteredExams.filter(e => e.status === 'sent_to_dpi' || e.status === 'validated');

  // Create a new exam request
  const handleCreateExam = () => {
    const patient = patients.find(p => p.id === newExamPatientId);
    const catalog = EXAM_CATALOG.find(c => c.id === newExamCatalogId);
    if (!patient || !catalog) return;

    const exam: PendingExam = {
      id: `exam-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`,
      nhid: patient.nhid,
      examCatalogId: catalog.id,
      examName: catalog.name,
      category: catalog.category,
      prescriber: 'Prescription directe',
      status: 'pending',
      params: catalog.params,
      results: {},
      createdAt: new Date(),
      paye: false,
      prix: EXAM_PRICES[catalog.id] || 8000,
    };
    setPendingExams(prev => [exam, ...prev]);
    setShowNewExamDialog(false);
    setNewExamPatientId('');
    setNewExamCatalogId('');
    toast.success(`Examen "${catalog.name}" créé pour ${patient.prenom} ${patient.nom}`);
  };

  // Check if patient has a valid receipt from the cashier
  const isPatientLabPaid = (patientId: string): boolean => {
    return hasReceiptForType(patientId, 'labo');
  };

  const getPatientLabReceipt = (patientId: string) => {
    return getReceiptForType(patientId, 'labo');
  };

  // Start processing an exam
  const handleStartExam = (examId: string) => {
    const exam = pendingExams.find(e => e.id === examId);
    if (!exam) return;
    
    if (!isPatientLabPaid(exam.patientId)) {
      toast.error('❌ Reçu de paiement requis', {
        description: `Le patient doit d'abord payer à la caisse (${exam.prix.toLocaleString()} FCFA). Envoyez-le à la Facturation.`
      });
      return;
    }
    setPendingExams(prev => prev.map(e => e.id === examId ? { ...e, paye: true, referencePaiement: getPatientLabReceipt(exam.patientId)?.id } : e));
    setPendingExams(prev => prev.map(e => e.id === examId ? { ...e, status: 'in_progress' } : e));
    toast.info('🧪 Analyse lancée – Reçu vérifié ✓');
  };

  // Open results entry dialog
  const handleOpenResults = (exam: PendingExam) => {
    setSelectedExam(exam);
    setResultValues({});
    setTechnicianNote('');
    setShowResultsDialog(true);
  };

  // Save results for an exam
  const handleSaveResults = () => {
    if (!selectedExam) return;
    const results: Record<string, { value: string; status: 'normal' | 'anormal' }> = {};
    selectedExam.params.forEach(param => {
      const val = resultValues[param] || '';
      results[param] = { value: val, status: val.includes('+++') || val.includes('élevé') || val.includes('anormal') || val.includes('Positif') ? 'anormal' : 'normal' };
    });
    setPendingExams(prev => prev.map(e =>
      e.id === selectedExam.id ? { ...e, status: 'results_entry', results } : e
    ));
    setShowResultsDialog(false);
    toast.success('Résultats saisis – En attente de validation biologique');
  };

  // Validate results (biologiste)
  const handleValidateResults = (examId: string) => {
    setPendingExams(prev => prev.map(e =>
      e.id === examId ? { ...e, status: 'validated', validatedBy: 'Dr. Oumar Djibrine (Biologiste)' } : e
    ));
    toast.success('✅ Résultats validés par le biologiste');
  };

  // Send validated results to DPI
  const handleSendToDPI = (exam: PendingExam) => {
    const labResult = {
      id: `lab-${Date.now()}-${exam.patientId}`,
      date: new Date().toISOString().split('T')[0],
      type: exam.examName,
      statut: 'termine' as const,
      paye: true,
      resultats: exam.params.map(param => ({
        parametre: param,
        valeur: exam.results[param]?.value || 'N/A',
        normal: NORMAL_VALUES[param] || 'N/A',
        statut: exam.results[param]?.status || 'normal' as const,
      })),
    };
    addLabResult(exam.patientId, labResult);
    setPendingExams(prev => prev.map(e => e.id === exam.id ? { ...e, status: 'sent_to_dpi' } : e));
    
    // Check if all exams for this patient are done
    const patientExams = pendingExams.filter(e => e.patientId === exam.patientId && e.id !== exam.id);
    const allDone = patientExams.every(e => e.status === 'sent_to_dpi' || e.status === 'validated');
    
    if (allDone) {
      advancePatient(exam.patientId, 'consultation', 'Laboratoire', `Résultats ${exam.examName} validés et envoyés au DPI`);
    }
    
    toast.success(`📋 Résultats "${exam.examName}" envoyés au DPI de ${exam.patientName}`, {
      description: 'Le médecin peut maintenant consulter les résultats dans le dossier patient'
    });
  };

  const getStatusBadge = (exam: PendingExam) => {
    if (exam.status === 'pending' && !isPatientLabPaid(exam.patientId)) {
      return <Badge variant="destructive" className="text-[10px] gap-1"><Banknote className="w-3 h-3" />Non payé – Caisse</Badge>;
    }
    switch (exam.status) {
      case 'pending': return <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="w-3 h-3" />Payé – En attente</Badge>;
      case 'in_progress': return <Badge className="text-[10px] gap-1 bg-primary animate-pulse"><Beaker className="w-3 h-3" />Analyse en cours</Badge>;
      case 'results_entry': return <Badge variant="outline" className="text-[10px] gap-1 border-warning text-warning"><FileText className="w-3 h-3" />Résultats à valider</Badge>;
      case 'validated': return <Badge variant="outline" className="text-[10px] gap-1 border-secondary text-secondary"><CheckCircle className="w-3 h-3" />Validé – À envoyer</Badge>;
      case 'sent_to_dpi': return <Badge variant="outline" className="text-[10px] gap-1 border-secondary text-secondary"><Send className="w-3 h-3" />Envoyé au DPI</Badge>;
    }
  };

  const getActionButton = (exam: PendingExam) => {
    const hasPaid = isPatientLabPaid(exam.patientId);
    const receipt = getPatientLabReceipt(exam.patientId);
    
    switch (exam.status) {
      case 'pending':
        if (!hasPaid) {
          return (
            <div className="flex flex-col gap-1 items-end">
              <Badge variant="outline" className="text-[9px] justify-center">{exam.prix.toLocaleString()} FCFA</Badge>
              <p className="text-[9px] text-destructive text-right">⚠ Diriger vers la caisse</p>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="text-[9px] justify-center border-green-500/50 text-green-600">
              <ShieldCheck className="w-3 h-3 mr-0.5" />Reçu: {receipt?.id?.substring(0, 15)}...
            </Badge>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleStartExam(exam.id)}><Play className="w-3 h-3" />Lancer l'analyse</Button>
          </div>
        );
      case 'in_progress':
        return <Button size="sm" className="h-7 text-xs gap-1" variant="outline" onClick={() => handleOpenResults(exam)}><FileText className="w-3 h-3" />Saisir résultats</Button>;
      case 'results_entry':
        return <Button size="sm" className="h-7 text-xs gap-1 bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => handleValidateResults(exam.id)}><CheckCircle className="w-3 h-3" />Valider (Biologiste)</Button>;
      case 'validated':
        return <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleSendToDPI(exam)}><Send className="w-3 h-3" />Envoyer au DPI</Button>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laboratoire LIMS</h1>
          <p className="text-muted-foreground text-sm">Workflow complet : Prescription → Prélèvement → Analyse → Validation → DPI</p>
        </div>
        <Button className="gap-1" onClick={() => setShowNewExamDialog(true)}>
          <Plus className="w-4 h-4" /> Nouvel examen
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Patients au labo', value: patientsAtLab.length, icon: FlaskConical, color: 'text-primary' },
          { label: 'En attente', value: pendingExams.filter(e => e.status === 'pending').length, icon: Clock, color: 'text-warning' },
          { label: 'En cours', value: pendingExams.filter(e => e.status === 'in_progress').length, icon: Beaker, color: 'text-primary' },
          { label: 'À valider', value: pendingExams.filter(e => e.status === 'results_entry').length, icon: AlertTriangle, color: 'text-warning' },
          { label: 'Envoyés DPI', value: pendingExams.filter(e => e.status === 'sent_to_dpi').length, icon: Send, color: 'text-secondary' },
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

      {/* Patients at lab */}
      {patientsAtLab.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">🔬 Patients au Laboratoire</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patientsAtLab.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.pathologieActuelle}</p>
                  </div>
                  <div className="flex gap-1">
                    {pendingExams.filter(e => e.patientId === p.id && e.status !== 'sent_to_dpi').length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {pendingExams.filter(e => e.patientId === p.id && e.status !== 'sent_to_dpi').length} examen(s) en cours
                      </Badge>
                    )}
                  </div>
                </div>
                <PatientJourneyTracker patientId={p.id} showEvents />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="worklist">📋 Worklist ({worklistExams.length})</TabsTrigger>
          <TabsTrigger value="priority_queue" className="gap-1.5">
            <ListOrdered className="w-3.5 h-3.5" />File Prioritaire
          </TabsTrigger>
          <TabsTrigger value="completed">✅ Terminés ({completedExams.length})</TabsTrigger>
          <TabsTrigger value="automates">⚙️ Automates</TabsTrigger>
        </TabsList>

        <TabsContent value="worklist" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher par patient, NHID ou examen..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          {worklistExams.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun examen en cours. Les prescriptions des médecins apparaîtront ici.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {worklistExams.map(exam => (
                <Card key={exam.id} className={`transition-all hover:shadow-md ${
                  exam.status === 'results_entry' ? 'border-warning/50 bg-warning/5' :
                  exam.status === 'validated' ? 'border-secondary/50 bg-secondary/5' :
                  exam.status === 'in_progress' ? 'border-primary/30' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">{exam.patientName}</p>
                          <Badge variant="outline" className="text-[9px]">{exam.nhid}</Badge>
                          {getStatusBadge(exam)}
                        </div>
                        <p className="text-xs text-primary font-medium">🧪 {exam.examName}</p>
                        <p className="text-[11px] text-muted-foreground">{exam.category} • Prescrit par {exam.prescriber} • <span className="font-medium">{exam.prix.toLocaleString()} FCFA</span></p>
                        {exam.paye && exam.referencePaiement && (
                          <p className="text-[10px] text-green-600">✅ Payé – Réf: {exam.referencePaiement}</p>
                        )}
                        
                        {/* Show entered results preview */}
                        {(exam.status === 'results_entry' || exam.status === 'validated') && Object.keys(exam.results).length > 0 && (
                          <div className="mt-2 p-2 rounded bg-muted/50 space-y-1">
                            {exam.params.map(param => (
                              <div key={param} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground w-32">{param}:</span>
                                <span className={exam.results[param]?.status === 'anormal' ? 'font-bold text-destructive' : 'text-foreground'}>
                                  {exam.results[param]?.value || '—'}
                                </span>
                                <span className="text-muted-foreground">({NORMAL_VALUES[param] || 'N/A'})</span>
                                {exam.results[param]?.status === 'anormal' && <Badge variant="destructive" className="text-[8px] h-4">⚠</Badge>}
                              </div>
                            ))}
                            {exam.validatedBy && <p className="text-[10px] text-secondary mt-1">✅ Validé par {exam.validatedBy}</p>}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {getActionButton(exam)}
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
            items={worklistExams.map(e => ({
              id: e.id,
              patientId: e.patientId,
              patientName: e.patientName,
              nhid: e.nhid,
              urgence: patients.find(p => p.id === e.patientId)?.urgence || 4,
              examName: e.examName,
              status: e.status === 'pending' ? 'waiting' as const : 
                     (e.status === 'in_progress' || e.status === 'results_entry') ? 'in_progress' as const : 'done' as const,
              arrivalTime: e.createdAt,
              estimatedDuration: EXAM_DURATIONS[e.examCatalogId] || 20,
            }))}
            title="File d'attente Laboratoire"
            icon={<FlaskConical className="w-4 h-4 text-primary" />}
            inProgressCount={pendingExams.filter(e => e.status === 'in_progress' || e.status === 'results_entry').length}
            maxParallel={3}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedExams.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun résultat envoyé au DPI pour le moment.</CardContent></Card>
          ) : completedExams.map(exam => (
            <Card key={exam.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{exam.patientName} ({exam.nhid})</p>
                    <p className="text-xs text-primary">{exam.examName} • {exam.category}</p>
                  </div>
                  {getStatusBadge(exam)}
                </div>
                {Object.keys(exam.results).length > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-4 gap-0 bg-muted/60 text-[10px] font-medium text-muted-foreground p-2">
                      <span>Paramètre</span><span>Valeur</span><span>Normale</span><span>Statut</span>
                    </div>
                    {exam.params.map(param => (
                      <div key={param} className={`grid grid-cols-4 gap-0 text-xs p-2 border-t border-border ${exam.results[param]?.status === 'anormal' ? 'bg-destructive/5' : ''}`}>
                        <span className="font-medium text-foreground">{param}</span>
                        <span className={exam.results[param]?.status === 'anormal' ? 'font-bold text-destructive' : 'text-foreground'}>{exam.results[param]?.value || '—'}</span>
                        <span className="text-muted-foreground">{NORMAL_VALUES[param] || 'N/A'}</span>
                        <Badge variant={exam.results[param]?.status === 'anormal' ? 'destructive' : 'outline'} className="text-[9px] w-fit">
                          {exam.results[param]?.status === 'anormal' ? '⚠ Anormal' : 'Normal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="automates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Roche Cobas 6000', type: 'Biochimie', status: 'En ligne', tests: 156, icon: '🧪' },
              { name: 'Sysmex XN-1000', type: 'Hématologie', status: 'En ligne', tests: 89, icon: '🔬' },
              { name: 'GeneXpert', type: 'TB/Résistances', status: 'En ligne', tests: 12, icon: '🧬' },
            ].map(auto => (
              <Card key={auto.name}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{auto.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{auto.name}</p>
                        <p className="text-[10px] text-muted-foreground">{auto.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-secondary text-secondary">✅ {auto.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{auto.tests} tests aujourd'hui</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Exam Dialog */}
      <Dialog open={showNewExamDialog} onOpenChange={setShowNewExamDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvel examen de laboratoire</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Patient</label>
              <Select value={newExamPatientId} onValueChange={setNewExamPatientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom} – {p.nhid}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type d'examen</label>
              <Select value={newExamCatalogId} onValueChange={setNewExamCatalogId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un examen" /></SelectTrigger>
                <SelectContent>
                  {EXAM_CATALOG.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.category})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newExamCatalogId && (
              <div className="p-3 rounded bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">Paramètres à analyser :</p>
                {EXAM_CATALOG.find(e => e.id === newExamCatalogId)?.params.map(p => (
                  <Badge key={p} variant="outline" className="text-[10px] mr-1 mb-1">{p}</Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewExamDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateExam} disabled={!newExamPatientId || !newExamCatalogId}>Créer l'examen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Entry Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Saisie des résultats – {selectedExam?.examName}</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-muted/50">
                <p className="text-sm font-medium text-foreground">{selectedExam.patientName}</p>
                <p className="text-xs text-muted-foreground">{selectedExam.nhid} • {selectedExam.category}</p>
              </div>
              <div className="space-y-3">
                {selectedExam.params.map(param => (
                  <div key={param} className="grid grid-cols-3 gap-2 items-center">
                    <label className="text-xs font-medium text-foreground">{param}</label>
                    <Input
                      placeholder="Valeur..."
                      className="h-8 text-xs"
                      value={resultValues[param] || ''}
                      onChange={e => setResultValues(prev => ({ ...prev, [param]: e.target.value }))}
                    />
                    <span className="text-[10px] text-muted-foreground">Réf: {NORMAL_VALUES[param] || 'N/A'}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Note du technicien</label>
                <Textarea placeholder="Observations..." rows={2} value={technicianNote} onChange={e => setTechnicianNote(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultsDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveResults}>Enregistrer les résultats</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Laboratoire;
