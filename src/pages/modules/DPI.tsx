import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { SERVICES } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import {
  FileText, Clock, FlaskConical, ScanLine, AlertTriangle, Pill, 
  Mic, Sparkles, Search, User, Send, Plus, Printer, Activity,
  Heart, Thermometer, Droplets, Weight, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Eye, Edit, Trash2, Stethoscope, ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

const CIM10_DATABASE = [
  { code: 'B50.9', label: 'Paludisme à P. falciparum, sans précision' },
  { code: 'A39.0', label: 'Méningite à méningocoque' },
  { code: 'I21.0', label: 'Infarctus aigu du myocarde' },
  { code: 'J18.9', label: 'Pneumopathie, sans précision' },
  { code: 'E11.9', label: 'Diabète sucré de type 2' },
  { code: 'O14.1', label: 'Pré-éclampsie sévère' },
  { code: 'K35.9', label: 'Appendicite aiguë, sans précision' },
  { code: 'J45.0', label: 'Asthme à prédominance allergique' },
  { code: 'A15.0', label: 'Tuberculose pulmonaire' },
  { code: 'I63.9', label: 'AVC ischémique, sans précision' },
  { code: 'E44.0', label: 'Malnutrition protéino-calorique modérée' },
  { code: 'N20.0', label: 'Calcul du rein (lithiase rénale)' },
  { code: 'L30.9', label: 'Eczéma, sans précision' },
  { code: 'C22.0', label: 'Carcinome hépatocellulaire' },
  { code: 'H25.9', label: 'Cataracte sénile, sans précision' },
  { code: 'S82.1', label: 'Fracture de l\'extrémité supérieure du tibia' },
];

const MEDICAMENTS_DB = [
  { nom: 'Paracétamol', dosages: ['500mg', '1g'], formes: ['Comprimé', 'IV', 'Sirop'] },
  { nom: 'Amoxicilline', dosages: ['250mg', '500mg', '1g'], formes: ['Gélule', 'Sirop'] },
  { nom: 'Artésunate', dosages: ['60mg', '120mg'], formes: ['Injectable IV'] },
  { nom: 'Ceftriaxone', dosages: ['500mg', '1g', '2g'], formes: ['Injectable IV/IM'] },
  { nom: 'Métronidazole', dosages: ['250mg', '500mg'], formes: ['Comprimé', 'IV'] },
  { nom: 'Ibuprofène', dosages: ['200mg', '400mg'], formes: ['Comprimé'] },
  { nom: 'Oméprazole', dosages: ['20mg', '40mg'], formes: ['Gélule', 'IV'] },
  { nom: 'Insuline Rapide', dosages: ['100UI/mL'], formes: ['Injectable SC'] },
  { nom: 'Salbutamol', dosages: ['100µg/dose', '5mg/mL'], formes: ['Inhalation', 'Nébulisation'] },
  { nom: 'Diazépam', dosages: ['5mg', '10mg'], formes: ['Comprimé', 'Injectable IV'] },
  { nom: 'Morphine', dosages: ['10mg', '20mg'], formes: ['Injectable', 'Comprimé LP'] },
  { nom: 'Aspirine', dosages: ['100mg', '300mg', '500mg'], formes: ['Comprimé'] },
  { nom: 'Atorvastatine', dosages: ['20mg', '40mg', '80mg'], formes: ['Comprimé'] },
  { nom: 'Furosémide', dosages: ['20mg', '40mg'], formes: ['Comprimé', 'Injectable IV'] },
  { nom: 'Nicardipine', dosages: ['20mg', '1mg/mL'], formes: ['Gélule', 'IVSE'] },
];

const EXAMENS_LAB = [
  { cat: 'Hématologie', items: ['NFS complète', 'VS', 'Réticulocytes', 'Frottis sanguin'] },
  { cat: 'Biochimie', items: ['Glycémie', 'Créatinine', 'Urée', 'ASAT/ALAT', 'Bilirubine', 'Ionogramme'] },
  { cat: 'Parasitologie', items: ['Goutte épaisse', 'Frottis mince', 'Selles KOP'] },
  { cat: 'Sérologie', items: ['VIH', 'Hépatite B', 'Hépatite C', 'TPHA/VDRL'] },
  { cat: 'Bactériologie', items: ['ECBU', 'Hémocultures', 'Coproculture', 'Antibiogramme'] },
  { cat: 'Cardiaque', items: ['Troponine HS', 'BNP', 'CPK-MB', 'D-Dimères'] },
];

const EXAMENS_IMAGERIE = [
  'Radiographie thoracique', 'Radiographie osseuse', 'Échographie abdominale',
  'Échographie obstétricale', 'Échocardiographie', 'Scanner cérébral',
  'Scanner thoracique', 'Scanner abdominal', 'IRM cérébrale', 'IRM rachidienne',
];

interface MedicamentPrescrit {
  nom: string;
  dosage: string;
  forme: string;
  frequence: string;
  duree: string;
  voie: string;
}

const DPI = () => {
  const { patients, advancePatient, addLabResult, addPrescription, getPatientEvents } = usePatientJourney();
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '1');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('consultation');

  // Consultation state
  const [consultNote, setConsultNote] = useState('');
  const [motifConsultation, setMotifConsultation] = useState('');
  const [examenClinique, setExamenClinique] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [cim10Search, setCim10Search] = useState('');
  const [selectedService, setSelectedService] = useState('');

  // Prescription builder
  const [medicamentsPrescrits, setMedicamentsPrescrits] = useState<MedicamentPrescrit[]>([]);
  const [showAddMedDialog, setShowAddMedDialog] = useState(false);
  const [newMed, setNewMed] = useState<MedicamentPrescrit>({ nom: '', dosage: '', forme: '', frequence: '', duree: '', voie: 'Orale' });
  const [medSearchTerm, setMedSearchTerm] = useState('');

  // Exams ordering
  const [selectedLabExams, setSelectedLabExams] = useState<string[]>([]);
  const [selectedImagingExams, setSelectedImagingExams] = useState<string[]>([]);
  const [showLabDialog, setShowLabDialog] = useState(false);
  const [showImagingDialog, setShowImagingDialog] = useState(false);

  // AI Summary
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');

  // Print
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const patient = patients.find(p => p.id === selectedPatientId);
  const patientEvents = getPatientEvents(selectedPatientId);

  const filtered = useMemo(() => patients.filter(p =>
    `${p.prenom} ${p.nom} ${p.nhid}`.toLowerCase().includes(searchTerm.toLowerCase())
  ), [patients, searchTerm]);

  const CIM10_SUGGESTIONS = useMemo(() => 
    CIM10_DATABASE.filter(c => cim10Search && (
      c.code.toLowerCase().includes(cim10Search.toLowerCase()) || 
      c.label.toLowerCase().includes(cim10Search.toLowerCase())
    )).slice(0, 6),
  [cim10Search]);

  const filteredMeds = useMemo(() =>
    MEDICAMENTS_DB.filter(m => medSearchTerm && m.nom.toLowerCase().includes(medSearchTerm.toLowerCase())),
  [medSearchTerm]);

  if (!patient) return <div className="p-6 text-center text-muted-foreground">Aucun patient sélectionné</div>;

  // === ACTIONS ===
  const handleSaveConsultation = () => {
    if (!motifConsultation && !consultNote && !diagnostic) {
      toast.error('Veuillez remplir au moins le motif ou le diagnostic');
      return;
    }

    // Add prescription to patient if medications exist
    if (medicamentsPrescrits.length > 0) {
      addPrescription(selectedPatientId, {
        id: `pr-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        statut: 'en_attente',
        medicaments: medicamentsPrescrits.map(m => ({
          nom: `${m.nom} ${m.forme}`,
          dosage: m.dosage,
          frequence: m.frequence,
          duree: m.duree,
        })),
      });
    }

    toast.success('✅ Consultation enregistrée et sauvegardée dans le DPI', {
      description: `${patient.prenom} ${patient.nom} – ${diagnostic || motifConsultation}`
    });

    // Reset form
    setConsultNote('');
    setMotifConsultation('');
    setExamenClinique('');
    setDiagnostic('');
    setCim10Search('');
    setMedicamentsPrescrits([]);
    setSelectedLabExams([]);
    setSelectedImagingExams([]);
  };

  const handleSendToLab = () => {
    if (selectedLabExams.length === 0) {
      toast.error('Sélectionnez au moins un examen de laboratoire');
      return;
    }
    // Create lab requests in patient data
    selectedLabExams.forEach(exam => {
      addLabResult(selectedPatientId, {
        id: `lab-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toISOString().split('T')[0],
        type: exam,
        statut: 'en_attente',
        paye: false,
        resultats: [],
      });
    });
    // Patient must go to cashier first before lab
    advancePatient(selectedPatientId, 'paiement', 'DPI – Consultation', `💰 Payer avant labo: ${selectedLabExams.join(', ')}`);
    setSelectedLabExams([]);
    toast.success(`🔬 ${selectedLabExams.length} examen(s) prescrit(s) – Patient dirigé vers la caisse`, {
      description: '💰 Le patient doit payer à la caisse avant de se rendre au laboratoire',
      duration: 5000,
    });
  };

  const handleSendToImaging = () => {
    if (selectedImagingExams.length === 0) {
      toast.error('Sélectionnez au moins un examen d\'imagerie');
      return;
    }
    // Patient must go to cashier first before imaging
    advancePatient(selectedPatientId, 'paiement', 'DPI – Consultation', `💰 Payer avant imagerie: ${selectedImagingExams.join(', ')}`);
    setSelectedImagingExams([]);
    toast.success(`📷 ${selectedImagingExams.length} examen(s) prescrit(s) – Patient dirigé vers la caisse`, {
      description: '💰 Le patient doit payer à la caisse avant de se rendre en imagerie',
      duration: 5000,
    });
  };

  const handleSendToPharmacy = () => {
    if (medicamentsPrescrits.length === 0) {
      toast.error('Ajoutez au moins un médicament à l\'ordonnance');
      return;
    }
    // Save prescription first
    addPrescription(selectedPatientId, {
      id: `pr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      statut: 'en_attente',
      medicaments: medicamentsPrescrits.map(m => ({
        nom: `${m.nom} ${m.forme}`,
        dosage: m.dosage,
        frequence: m.frequence,
        duree: m.duree,
      })),
    });
    advancePatient(selectedPatientId, 'pharmacie', 'DPI – Consultation', `Ordonnance: ${medicamentsPrescrits.length} médicament(s)`);
    setMedicamentsPrescrits([]);
    toast.success(`💊 Ordonnance envoyée à la pharmacie`);
  };

  const handleVoiceNote = () => {
    toast.info('🎤 Dictée vocale simulée – Transcription en cours...');
    setTimeout(() => {
      const voiceTexts = [
        'Patient présente fièvre depuis 3 jours avec céphalées et myalgies diffuses. ',
        'Examen: abdomen souple, pas de défense. Bruits hydro-aériques présents. ',
        'Toux productive depuis une semaine, expectorations jaunâtres. Crépitants base droite. ',
      ];
      setConsultNote(prev => prev + voiceTexts[Math.floor(Math.random() * voiceTexts.length)]);
      toast.success('🎤 Transcription terminée');
    }, 1500);
  };

  const handleAISummary = () => {
    const summary = `📋 RÉSUMÉ CLINIQUE AUTOMATIQUE (IA)
━━━━━━━━━━━━━━━━━━━━━━
Patient: ${patient.prenom} ${patient.nom} (${patient.age} ans, ${patient.sexe})
NHID: ${patient.nhid}
Groupe sanguin: ${patient.groupeSanguin}
${patient.allergies.length > 0 ? `⚠️ Allergies: ${patient.allergies.join(', ')}` : '✅ Pas d\'allergies connues'}

📊 CONSTANTES VITALES:
${patient.vitaux ? `TA: ${patient.vitaux.tension} | T°: ${patient.vitaux.temperature}°C | FC: ${patient.vitaux.pouls} bpm | SpO2: ${patient.vitaux.spo2}% | Poids: ${patient.vitaux.poids} kg` : 'Non renseignées'}

🏥 PATHOLOGIE ACTUELLE: ${patient.pathologieActuelle}

📝 HISTORIQUE:
• ${patient.consultations.length} consultation(s) antérieure(s)
• ${patient.labResults.length} résultat(s) de laboratoire
• ${patient.imagingResults.length} examen(s) d'imagerie
• ${patient.prescriptions.length} ordonnance(s)
• ${patient.hospitalisations.length} hospitalisation(s)

${patient.labResults.filter(l => l.statut === 'termine').length > 0 ? `🔬 DERNIERS RÉSULTATS ANORMAUX:
${patient.labResults.filter(l => l.statut === 'termine').flatMap(l => l.resultats.filter(r => r.statut === 'anormal')).map(r => `⚠️ ${r.parametre}: ${r.valeur} (N: ${r.normal})`).join('\n')}` : ''}

${patient.consultations.length > 0 ? `👨‍⚕️ DERNIÈRE CONSULTATION:
${patient.consultations[patient.consultations.length - 1].diagnostic}
${patient.consultations[patient.consultations.length - 1].notes}` : ''}

🤖 RECOMMANDATION IA: Poursuivre le traitement en cours. Contrôle biologique recommandé dans 48-72h.`;
    
    setAiSummaryText(summary);
    setShowAISummary(true);
  };

  const handleAddMedicament = () => {
    if (!newMed.nom || !newMed.dosage || !newMed.frequence || !newMed.duree) {
      toast.error('Remplissez tous les champs du médicament');
      return;
    }
    // Check allergy
    if (patient.allergies.some(a => newMed.nom.toLowerCase().includes(a.toLowerCase()))) {
      toast.error(`⚠️ ALERTE ALLERGIE: ${patient.allergies.join(', ')} – Médicament ${newMed.nom} contre-indiqué!`);
      return;
    }
    setMedicamentsPrescrits(prev => [...prev, { ...newMed }]);
    setNewMed({ nom: '', dosage: '', forme: '', frequence: '', duree: '', voie: 'Orale' });
    setMedSearchTerm('');
    setShowAddMedDialog(false);
    toast.success(`💊 ${newMed.nom} ajouté à l'ordonnance`);
  };

  const removeMedicament = (index: number) => {
    setMedicamentsPrescrits(prev => prev.filter((_, i) => i !== index));
  };

  const getVitalStatus = (label: string, value: string) => {
    const num = parseFloat(value?.replace(/[^0-9.]/g, '') || '0');
    if (label === 'T°' && num >= 38) return 'text-destructive';
    if (label === 'SpO2' && num < 95) return 'text-destructive';
    if (label === 'FC' && (num > 100 || num < 60)) return 'text-warning';
    return 'text-foreground';
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Dossier Patient Informatisé
          </h1>
          <p className="text-muted-foreground text-sm">Vue 360° – Consultation, prescription, orientation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowPrintDialog(true)}>
            <Printer className="w-3 h-3" /> Imprimer dossier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Patient list – Sidebar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 space-y-2">
            <CardTitle className="text-sm flex items-center gap-1"><ClipboardList className="w-4 h-4" /> Liste des patients</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Nom, NHID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 pl-7 text-xs" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[65vh] overflow-y-auto p-2">
            {filtered.map(p => {
              const urgencyColors: Record<number, string> = {
                1: 'border-l-destructive bg-destructive/5',
                2: 'border-l-orange-500 bg-orange-500/5',
                3: 'border-l-yellow-500',
                4: 'border-l-primary',
                5: 'border-l-muted',
              };
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelectedPatientId(p.id); setSelectedService(p.service); }}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all border-l-4 ${urgencyColors[p.urgence] || ''} ${
                    selectedPatientId === p.id ? 'bg-accent ring-1 ring-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{p.prenom} {p.nom}</p>
                    <Badge variant={p.urgence <= 2 ? 'destructive' : 'outline'} className="text-[9px] h-4">P{p.urgence}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{p.nhid} • {p.age} ans • {p.sexe}</p>
                  <p className="text-[10px] text-primary font-medium truncate">{p.pathologieActuelle}</p>
                  <div className="flex gap-1 mt-1">
                    {p.labResults.length > 0 && <Badge variant="outline" className="text-[8px] h-3.5 px-1">🔬{p.labResults.length}</Badge>}
                    {p.imagingResults.length > 0 && <Badge variant="outline" className="text-[8px] h-3.5 px-1">📷{p.imagingResults.length}</Badge>}
                    {p.prescriptions.filter(pr => pr.statut === 'en_attente').length > 0 && <Badge variant="secondary" className="text-[8px] h-3.5 px-1">💊{p.prescriptions.filter(pr => pr.statut === 'en_attente').length}</Badge>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Main DPI */}
        <div className="lg:col-span-9 space-y-4">
          {/* Patient header card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{patient.prenom} {patient.nom}</h2>
                    <p className="text-xs text-muted-foreground">{patient.nhid} • {patient.age} ans • {patient.sexe} • {patient.groupeSanguin}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">{SERVICES.find(s => s.id === patient.service)?.name}</Badge>
                      <Badge variant={patient.urgence <= 2 ? 'destructive' : 'secondary'} className="text-[10px]">Priorité {patient.urgence}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.length > 0 ? (
                    <Badge variant="destructive" className="gap-1 text-xs animate-pulse"><AlertTriangle className="w-3 h-3" /> Allergies: {patient.allergies.join(', ')}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Pas d'allergies connues</Badge>
                  )}
                </div>
              </div>

              {/* Vitals with status indicators */}
              {patient.vitaux && (
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'TA', value: patient.vitaux.tension, unit: 'mmHg', icon: Heart },
                    { label: 'T°', value: patient.vitaux.temperature, unit: '°C', icon: Thermometer },
                    { label: 'FC', value: patient.vitaux.pouls, unit: 'bpm', icon: Activity },
                    { label: 'SpO2', value: patient.vitaux.spo2, unit: '%', icon: Droplets },
                    { label: 'Poids', value: patient.vitaux.poids, unit: 'kg', icon: Weight },
                  ].map(v => (
                    <div key={v.label} className="text-center p-2 rounded-lg bg-muted/50 border border-border/50">
                      <v.icon className={`w-3 h-3 mx-auto mb-0.5 ${getVitalStatus(v.label, v.value)}`} />
                      <p className="text-[10px] text-muted-foreground">{v.label}</p>
                      <p className={`text-sm font-bold ${getVitalStatus(v.label, v.value)}`}>{v.value} <span className="text-[9px] font-normal text-muted-foreground">{v.unit}</span></p>
                    </div>
                  ))}
                </div>
              )}

              {/* Journey */}
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">PARCOURS EN TEMPS RÉEL</p>
                <PatientJourneyTracker patientId={selectedPatientId} showEvents />
              </div>
            </CardContent>
          </Card>

          {/* DPI Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
              <TabsTrigger value="consultation" className="gap-1 text-xs"><FileText className="w-3 h-3" />Consultation</TabsTrigger>
              <TabsTrigger value="ordonnance" className="gap-1 text-xs"><Pill className="w-3 h-3" />Ordonnance</TabsTrigger>
              <TabsTrigger value="examens" className="gap-1 text-xs"><FlaskConical className="w-3 h-3" />Examens</TabsTrigger>
              <TabsTrigger value="historique" className="gap-1 text-xs"><Clock className="w-3 h-3" />Historique</TabsTrigger>
              <TabsTrigger value="labo" className="gap-1 text-xs"><FlaskConical className="w-3 h-3" />Résultats Labo</TabsTrigger>
              <TabsTrigger value="imagerie" className="gap-1 text-xs"><ScanLine className="w-3 h-3" />Imagerie</TabsTrigger>
              <TabsTrigger value="parcours" className="gap-1 text-xs"><Activity className="w-3 h-3" />Journal</TabsTrigger>
            </TabsList>

            {/* === CONSULTATION TAB === */}
            <TabsContent value="consultation" className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> Nouvelle Consultation</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Médecin traitant</label>
                      <Input value="Dr. Ibrahim Moussa" readOnly className="bg-muted/50 h-9" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Service</label>
                      <Select value={selectedService || patient.service} onValueChange={setSelectedService}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>{SERVICES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Motif de consultation *</label>
                    <Input placeholder="Ex: Fièvre depuis 3 jours, douleur abdominale..." value={motifConsultation} onChange={e => setMotifConsultation(e.target.value)} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Anamnèse & Examen clinique</label>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleVoiceNote}><Mic className="w-3 h-3" /> Dictée vocale</Button>
                    </div>
                    <Textarea placeholder="Interrogatoire, signes fonctionnels, examen physique..." value={consultNote} onChange={e => setConsultNote(e.target.value)} rows={4} className="text-sm" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Examen clinique complémentaire</label>
                    <Textarea placeholder="Auscultation, palpation, inspection..." value={examenClinique} onChange={e => setExamenClinique(e.target.value)} rows={2} className="text-sm" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Diagnostic (CIM-10) *</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-8" placeholder="Rechercher code ou libellé CIM-10..." value={cim10Search || diagnostic} onChange={e => { setCim10Search(e.target.value); setDiagnostic(e.target.value); }} />
                    </div>
                    {CIM10_SUGGESTIONS.length > 0 && (
                      <div className="border rounded-md mt-1 bg-card shadow-lg z-10 relative max-h-48 overflow-y-auto">
                        {CIM10_SUGGESTIONS.map(c => (
                          <div key={c.code} className="p-2.5 hover:bg-accent cursor-pointer text-sm border-b last:border-0 transition-colors" onClick={() => { setDiagnostic(`${c.code} – ${c.label}`); setCim10Search(''); }}>
                            <span className="font-mono text-primary font-bold mr-2">{c.code}</span>
                            <span className="text-foreground">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick prescriptions summary */}
                  {medicamentsPrescrits.length > 0 && (
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-xs font-medium text-primary mb-2">💊 Ordonnance ({medicamentsPrescrits.length} médicament{medicamentsPrescrits.length > 1 ? 's' : ''}):</p>
                      {medicamentsPrescrits.map((m, i) => (
                        <p key={i} className="text-xs text-foreground">• {m.nom} {m.dosage} {m.forme} – {m.frequence} – {m.duree}</p>
                      ))}
                    </div>
                  )}

                  {/* Quick lab summary */}
                  {selectedLabExams.length > 0 && (
                    <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                      <p className="text-xs font-medium text-blue-600 mb-1">🔬 Examens de laboratoire prescrits:</p>
                      <p className="text-xs text-foreground">{selectedLabExams.join(', ')}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button className="flex-1 gap-1" onClick={handleSaveConsultation}>
                      <CheckCircle className="w-4 h-4" /> Enregistrer consultation
                    </Button>
                    <Button variant="outline" className="gap-1" onClick={handleAISummary}>
                      <Sparkles className="w-4 h-4" /> Résumé IA
                    </Button>
                  </div>

                  {/* Orientation buttons */}
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-bold text-muted-foreground mb-2">ORIENTER LE PATIENT →</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowLabDialog(true)}>🔬 Prescrire examens labo</Button>
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowImagingDialog(true)}>📷 Prescrire imagerie</Button>
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleSendToPharmacy}>💊 Envoyer ordonnance pharmacie</Button>
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => advancePatient(selectedPatientId, 'hospitalise', 'DPI', 'Hospitalisation requise')}>🛏️ Hospitaliser</Button>
                      <Button size="sm" variant="secondary" className="text-xs gap-1" onClick={() => advancePatient(selectedPatientId, 'sorti', 'DPI', 'Sortie avec résumé')}>✅ Sortie du patient</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === ORDONNANCE TAB === */}
            <TabsContent value="ordonnance" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Pill className="w-4 h-4 text-primary" /> Prescription médicamenteuse</CardTitle>
                    <Button size="sm" className="gap-1 h-8 text-xs" onClick={() => setShowAddMedDialog(true)}>
                      <Plus className="w-3 h-3" /> Ajouter médicament
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {patient.allergies.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
                      <p className="text-xs font-bold text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ALLERGIES CONNUES: {patient.allergies.join(', ')}</p>
                      <p className="text-[10px] text-destructive/80 mt-1">Le système bloquera automatiquement toute prescription contenant ces allergènes</p>
                    </div>
                  )}

                  {medicamentsPrescrits.length === 0 ? (
                    <div className="text-center py-8">
                      <Pill className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Aucun médicament prescrit</p>
                      <p className="text-xs text-muted-foreground">Cliquez sur "Ajouter médicament" pour commencer l'ordonnance</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {medicamentsPrescrits.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{m.nom}</p>
                            <p className="text-xs text-muted-foreground">{m.dosage} • {m.forme} • Voie {m.voie}</p>
                            <p className="text-xs text-primary font-medium">{m.frequence} pendant {m.duree}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removeMedicament(i)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button className="flex-1 gap-1" onClick={handleSendToPharmacy}>
                          <Send className="w-4 h-4" /> Envoyer à la pharmacie
                        </Button>
                        <Button variant="outline" className="gap-1" onClick={() => setShowPrintDialog(true)}>
                          <Printer className="w-4 h-4" /> Imprimer ordonnance
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Existing prescriptions */}
                  {patient.prescriptions.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs font-bold text-muted-foreground mb-3">ORDONNANCES PRÉCÉDENTES</p>
                      {patient.prescriptions.map(pr => (
                        <div key={pr.id} className="p-3 rounded-lg border border-border mb-2">
                          <div className="flex justify-between mb-2">
                            <p className="text-sm font-medium text-foreground">📋 Ordonnance du {pr.date}</p>
                            <Badge variant={pr.statut === 'delivre' ? 'default' : 'secondary'} className="text-[10px]">
                              {pr.statut === 'delivre' ? '✅ Délivré' : '⏳ En attente'}
                            </Badge>
                          </div>
                          {pr.medicaments.map((m, i) => (
                            <p key={i} className="text-xs text-foreground">• {m.nom} – {m.dosage} – {m.frequence} – {m.duree}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === EXAMENS TAB === */}
            <TabsContent value="examens" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lab exams */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="w-4 h-4 text-blue-500" /> Examens de Laboratoire</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {EXAMENS_LAB.map(cat => (
                      <div key={cat.cat}>
                        <p className="text-xs font-bold text-muted-foreground mb-1">{cat.cat}</p>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map(item => (
                            <Badge
                              key={item}
                              variant={selectedLabExams.includes(item) ? 'default' : 'outline'}
                              className="text-[10px] cursor-pointer transition-all hover:scale-105"
                              onClick={() => setSelectedLabExams(prev =>
                                prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
                              )}
                            >
                              {selectedLabExams.includes(item) && <CheckCircle className="w-2.5 h-2.5 mr-0.5" />}
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {selectedLabExams.length > 0 && (
                      <Button className="w-full gap-1 mt-3" size="sm" onClick={handleSendToLab}>
                        <Send className="w-3 h-3" /> Envoyer {selectedLabExams.length} examen(s) au labo
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Imaging exams */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><ScanLine className="w-4 h-4 text-purple-500" /> Examens d'Imagerie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {EXAMENS_IMAGERIE.map(item => (
                        <Badge
                          key={item}
                          variant={selectedImagingExams.includes(item) ? 'default' : 'outline'}
                          className="text-[10px] cursor-pointer transition-all hover:scale-105"
                          onClick={() => setSelectedImagingExams(prev =>
                            prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
                          )}
                        >
                          {selectedImagingExams.includes(item) && <CheckCircle className="w-2.5 h-2.5 mr-0.5" />}
                          {item}
                        </Badge>
                      ))}
                    </div>
                    {selectedImagingExams.length > 0 && (
                      <Button className="w-full gap-1 mt-3" size="sm" onClick={handleSendToImaging}>
                        <Send className="w-3 h-3" /> Envoyer {selectedImagingExams.length} examen(s) en imagerie
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* === HISTORIQUE TAB === */}
            <TabsContent value="historique">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.consultations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune consultation précédente</p>
                  ) : patient.consultations.map(c => (
                    <div key={c.id} className="p-4 rounded-lg border border-border hover:border-primary/30 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.docteur}</p>
                          <p className="text-xs text-muted-foreground">{c.date} – {c.service}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{c.service}</Badge>
                      </div>
                      <p className="text-sm font-medium text-primary mb-1">{c.diagnostic}</p>
                      <p className="text-sm text-foreground mb-2">{c.notes}</p>
                      <p className="text-xs text-muted-foreground"><strong>Ordonnance:</strong> {c.ordonnance}</p>
                      {c.examens.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">{c.examens.map(e => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === LABO RESULTS TAB === */}
            <TabsContent value="labo">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.labResults.length === 0 ? (
                    <div className="text-center py-8">
                      <FlaskConical className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Aucun résultat de laboratoire</p>
                    </div>
                  ) : patient.labResults.map(l => (
                    <div key={l.id} className={`p-4 rounded-lg border ${l.statut === 'termine' ? 'border-primary/30' : 'border-border'}`}>
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{l.type}</p>
                          <p className="text-xs text-muted-foreground">{l.date}</p>
                        </div>
                        <Badge variant={l.statut === 'termine' ? 'default' : l.statut === 'en_cours' ? 'secondary' : 'outline'}>
                          {l.statut === 'termine' ? '✅ Terminé' : l.statut === 'en_cours' ? '🔄 En cours' : '⏳ En attente'}
                        </Badge>
                      </div>
                      {l.resultats.length > 0 && (
                        <div className="space-y-1 mt-2">
                          <div className="grid grid-cols-4 gap-2 text-[10px] font-bold text-muted-foreground border-b border-border pb-1">
                            <span>Paramètre</span><span>Valeur</span><span>Référence</span><span>Statut</span>
                          </div>
                          {l.resultats.map((r, i) => (
                            <div key={i} className={`grid grid-cols-4 gap-2 text-xs p-1.5 rounded ${r.statut === 'anormal' ? 'bg-destructive/10' : 'bg-muted/30'}`}>
                              <span className="font-medium text-foreground">{r.parametre}</span>
                              <span className={r.statut === 'anormal' ? 'text-destructive font-bold' : 'text-foreground'}>{r.valeur}</span>
                              <span className="text-muted-foreground">{r.normal}</span>
                              <Badge variant={r.statut === 'anormal' ? 'destructive' : 'outline'} className="text-[9px] w-fit h-4">
                                {r.statut === 'anormal' ? '⚠️ ANORMAL' : '✅ Normal'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === IMAGERIE TAB === */}
            <TabsContent value="imagerie">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.imagingResults.length === 0 ? (
                    <div className="text-center py-8">
                      <ScanLine className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Aucun résultat d'imagerie</p>
                    </div>
                  ) : patient.imagingResults.map(img => (
                    <div key={img.id} className="p-4 rounded-lg border border-border">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{img.type}</p>
                          <p className="text-xs text-muted-foreground">{img.date} – Zone: {img.zone}</p>
                        </div>
                        <Badge variant={img.statut === 'termine' ? 'default' : 'secondary'}>
                          {img.statut === 'termine' ? '✅ Terminé' : '⏳ En cours'}
                        </Badge>
                      </div>
                      {img.interpretation && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-sm text-foreground">
                          <p className="text-xs font-bold text-muted-foreground mb-1">INTERPRÉTATION:</p>
                          {img.interpretation}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === JOURNAL / PARCOURS TAB === */}
            <TabsContent value="parcours">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Journal du parcours patient</CardTitle></CardHeader>
                <CardContent>
                  {patientEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun événement enregistré</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-4">
                        {patientEvents.map((evt, i) => (
                          <div key={evt.id} className="flex gap-3 relative">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center z-10 shrink-0">
                              <span className="text-xs">{i + 1}</span>
                            </div>
                            <div className="flex-1 p-3 rounded-lg border border-border bg-card">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-semibold text-foreground">{evt.from} → {evt.to}</p>
                                <p className="text-[10px] text-muted-foreground">{evt.timestamp.toLocaleString('fr-FR')}</p>
                              </div>
                              <p className="text-xs text-muted-foreground">{evt.module}</p>
                              {evt.details && <p className="text-xs text-primary mt-1">{evt.details}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* === DIALOGS === */}

      {/* Add Medicament Dialog */}
      <Dialog open={showAddMedDialog} onOpenChange={setShowAddMedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Pill className="w-5 h-5 text-primary" /> Ajouter un médicament</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {patient.allergies.length > 0 && (
              <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
                <p className="text-xs font-bold text-destructive">⚠️ ALLERGIES: {patient.allergies.join(', ')}</p>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Médicament *</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-3 h-3 text-muted-foreground" />
                <Input className="pl-7 h-9" placeholder="Rechercher un médicament..." value={medSearchTerm} onChange={e => { setMedSearchTerm(e.target.value); setNewMed(prev => ({ ...prev, nom: e.target.value })); }} />
              </div>
              {filteredMeds.length > 0 && (
                <div className="border rounded bg-card shadow-md max-h-32 overflow-y-auto">
                  {filteredMeds.map(m => (
                    <div key={m.nom} className="p-2 hover:bg-accent cursor-pointer text-sm" onClick={() => { setNewMed(prev => ({ ...prev, nom: m.nom, dosage: m.dosages[0], forme: m.formes[0] })); setMedSearchTerm(''); }}>
                      <span className="font-medium text-foreground">{m.nom}</span>
                      <span className="text-xs text-muted-foreground ml-2">{m.dosages.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Dosage *</label>
                <Input className="h-9" placeholder="Ex: 500mg" value={newMed.dosage} onChange={e => setNewMed(prev => ({ ...prev, dosage: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Forme</label>
                <Input className="h-9" placeholder="Comprimé, IV..." value={newMed.forme} onChange={e => setNewMed(prev => ({ ...prev, forme: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fréquence *</label>
                <Select value={newMed.frequence} onValueChange={v => setNewMed(prev => ({ ...prev, frequence: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {['1x/jour', '2x/jour', '3x/jour', '4x/jour', 'Toutes les 6h', 'Toutes les 8h', 'Toutes les 12h', 'Au besoin', 'Dose unique'].map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Durée *</label>
                <Select value={newMed.duree} onValueChange={v => setNewMed(prev => ({ ...prev, duree: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {['1 jour', '3 jours', '5 jours', '7 jours', '10 jours', '14 jours', '21 jours', '30 jours', 'Continu'].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Voie d'administration</label>
              <Select value={newMed.voie} onValueChange={v => setNewMed(prev => ({ ...prev, voie: v }))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Orale', 'IV', 'IM', 'SC', 'Rectale', 'Inhalation', 'Topique', 'Nébulisation'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMedDialog(false)}>Annuler</Button>
            <Button onClick={handleAddMedicament} className="gap-1"><Plus className="w-4 h-4" /> Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lab Exam Dialog */}
      <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>🔬 Prescrire des examens de laboratoire</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {EXAMENS_LAB.map(cat => (
              <div key={cat.cat}>
                <p className="text-xs font-bold text-muted-foreground mb-2">{cat.cat}</p>
                <div className="space-y-1">
                  {cat.items.map(item => (
                    <div key={item} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedLabExams(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item])}>
                      <Checkbox checked={selectedLabExams.includes(item)} />
                      <span className="text-sm text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabDialog(false)}>Annuler</Button>
            <Button onClick={() => { handleSendToLab(); setShowLabDialog(false); }} disabled={selectedLabExams.length === 0} className="gap-1">
              <Send className="w-4 h-4" /> Envoyer {selectedLabExams.length} examen(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Imaging Exam Dialog */}
      <Dialog open={showImagingDialog} onOpenChange={setShowImagingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>📷 Prescrire des examens d'imagerie</DialogTitle></DialogHeader>
          <div className="space-y-1">
            {EXAMENS_IMAGERIE.map(item => (
              <div key={item} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedImagingExams(prev => prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item])}>
                <Checkbox checked={selectedImagingExams.includes(item)} />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImagingDialog(false)}>Annuler</Button>
            <Button onClick={() => { handleSendToImaging(); setShowImagingDialog(false); }} disabled={selectedImagingExams.length === 0} className="gap-1">
              <Send className="w-4 h-4" /> Envoyer {selectedImagingExams.length} examen(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      <Dialog open={showAISummary} onOpenChange={setShowAISummary}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Résumé Clinique IA</DialogTitle></DialogHeader>
          <div className="bg-muted/30 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{aiSummaryText}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" className="gap-1" onClick={() => { navigator.clipboard.writeText(aiSummaryText); toast.success('Résumé copié'); }}>
              📋 Copier
            </Button>
            <Button variant="outline" className="gap-1" onClick={() => toast.success('Résumé imprimé')}>
              <Printer className="w-4 h-4" /> Imprimer
            </Button>
            <Button onClick={() => setShowAISummary(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>🖨️ Imprimer le dossier</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {['Dossier complet', 'Ordonnance uniquement', 'Résultats de laboratoire', 'Résumé clinique IA', 'Certificat médical'].map(opt => (
              <Button key={opt} variant="outline" className="w-full justify-start text-sm" onClick={() => { toast.success(`${opt} envoyé à l'impression`); setShowPrintDialog(false); }}>
                <Printer className="w-4 h-4 mr-2" /> {opt}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DPI;
