import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { ScanLine, Camera, FileImage, Send, Clock, CheckCircle, Search, Eye, Monitor, Printer } from 'lucide-react';
import { toast } from 'sonner';

const IMAGING_TYPES = ['Radiographie', 'Échographie', 'Scanner (TDM)', 'IRM', 'Mammographie', 'Échocardiographie', 'Doppler vasculaire'];

const EQUIPMENT = [
  { name: 'Radiographie numérique DR', salle: 'Salle 1', status: 'disponible', icon: '📸' },
  { name: 'Échographe GE Logiq E10', salle: 'Salle 2', status: 'disponible', icon: '🔊' },
  { name: 'Scanner 64 coupes', salle: 'Salle 3', status: 'en_cours', icon: '🖥️', patient: 'Hassan Idriss' },
  { name: 'IRM 1.5T Siemens', salle: 'Salle 4', status: 'maintenance', icon: '🧲' },
  { name: 'Mammographe numérique', salle: 'Salle 5', status: 'disponible', icon: '📷' },
];

const Imagerie = () => {
  const { patients, advancePatient, getPatientsByStep } = usePatientJourney();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const patientsAtImaging = getPatientsByStep('imagerie');

  const allImagingRequests = patients.flatMap(p =>
    p.consultations.flatMap(c =>
      c.examens
        .filter(e => e.toLowerCase().includes('écho') || e.toLowerCase().includes('scanner') || e.toLowerCase().includes('radio') || e.toLowerCase().includes('irm') || e.toLowerCase().includes('angio'))
        .map((examen, idx) => ({
          id: `img-${p.id}-${c.id}-${idx}`,
          patient: `${p.prenom} ${p.nom}`, patientId: p.id, nhid: p.nhid, examen,
          docteur: c.docteur, service: c.service, date: c.date, urgence: p.urgence,
          statut: p.imagingResults.some(r => r.statut === 'termine') ? 'termine' as const :
                 p.imagingResults.some(r => r.statut === 'en_cours') ? 'en_cours' as const : 'en_attente' as const,
        }))
    )
  );

  const extraRequests = [
    { id: 'img-extra-1', patient: 'Ousmane Djibril', patientId: '8', nhid: 'TCD-2024-00008', examen: 'Radiographie thoracique', docteur: 'Dr. Moussa Ali', service: 'Pneumologie', date: '2024-03-08', urgence: 3 as const, statut: 'en_attente' as const },
  ];

  const allRequests = [...allImagingRequests, ...extraRequests];
  const filteredRequests = allRequests.filter(r => {
    const matchSearch = searchTerm === '' || `${r.patient} ${r.nhid} ${r.examen}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const completedResults = patients.flatMap(p =>
    p.imagingResults.filter(r => r.statut === 'termine').map(r => ({
      ...r, patient: `${p.prenom} ${p.nom}`, nhid: p.nhid, patientId: p.id,
      docteur: p.consultations[0]?.docteur || 'Dr. inconnu',
    }))
  );

  const handleSendBackToDoctor = (patientId: string) => {
    advancePatient(patientId, 'consultation', 'Imagerie', 'Résultats d\'imagerie disponibles');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Imagerie Médicale</h1>
        <p className="text-muted-foreground text-sm">Radiologie, échographie, scanner, IRM</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Patients en imagerie', value: String(patientsAtImaging.length), icon: ScanLine, color: 'text-primary' },
          { label: 'Demandes en attente', value: String(allRequests.filter(r => r.statut === 'en_attente').length), icon: Clock, color: 'text-warning' },
          { label: 'Terminés', value: String(completedResults.length + 12), icon: CheckCircle, color: 'text-secondary' },
          { label: 'Envoyés au DPI', value: String(completedResults.length + 10), icon: Send, color: 'text-muted-foreground' },
          { label: 'Équipements actifs', value: `${EQUIPMENT.filter(e => e.status !== 'maintenance').length}/${EQUIPMENT.length}`, icon: Monitor, color: 'text-primary' },
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

      {/* Patients currently at imaging */}
      {patientsAtImaging.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">📷 Patients en Imagerie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patientsAtImaging.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.pathologieActuelle}</p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 h-7" onClick={() => handleSendBackToDoctor(p.id)}>
                    <Send className="w-3 h-3" /> Résultats → DPI
                  </Button>
                </div>
                <PatientJourneyTracker patientId={p.id} showEvents />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="demandes" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="demandes">📋 Demandes</TabsTrigger>
          <TabsTrigger value="resultats">📊 Résultats</TabsTrigger>
          <TabsTrigger value="equipements">🏥 Équipements</TabsTrigger>
          <TabsTrigger value="saisie">✍️ Interprétation</TabsTrigger>
        </TabsList>

        <TabsContent value="demandes" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {filteredRequests.map(req => (
              <Card key={req.id} className="hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-8 rounded-full ${req.statut === 'termine' ? 'bg-secondary' : req.statut === 'en_cours' ? 'bg-primary animate-pulse' : 'bg-warning'}`} />
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{req.patient}</p>
                        <p className="text-xs text-muted-foreground">{req.nhid} • {req.service}</p>
                        <p className="text-xs text-primary font-medium">📷 {req.examen}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.statut === 'en_attente' && <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`Examen planifié`)}>Planifier</Button>}
                      {req.statut === 'en_cours' && <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSendBackToDoctor(req.patientId)}><Camera className="w-3 h-3" /> Terminer</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resultats" className="space-y-4">
          {completedResults.map(result => (
            <Card key={result.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{result.patient}</p>
                    <p className="text-xs text-muted-foreground">{result.nhid} • {result.type} – {result.zone}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary text-primary gap-1"><Send className="w-3 h-3" />Envoyé au DPI</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileImage className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{result.type} – {result.zone}</span>
                  </div>
                  <p className="text-sm text-foreground">{result.interpretation}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Image DICOM ouverte')}><Eye className="w-3 h-3" /> Visualiser</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success('Imprimé')}><Printer className="w-3 h-3" /> Imprimer</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="equipements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {EQUIPMENT.map(eq => (
              <Card key={eq.name} className={eq.status === 'maintenance' ? 'border-warning/50' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{eq.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{eq.name}</p>
                        <p className="text-[10px] text-muted-foreground">{eq.salle}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${
                      eq.status === 'disponible' ? 'border-secondary text-secondary' :
                      eq.status === 'en_cours' ? 'border-primary text-primary' : 'border-warning text-warning'
                    }`}>
                      {eq.status === 'disponible' ? '✅ Disponible' : eq.status === 'en_cours' ? '🔄 En cours' : '⚠️ Maintenance'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saisie" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScanLine className="w-4 h-4 text-primary" />Saisie d'interprétation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="Type d'examen" /></SelectTrigger>
                <SelectContent>{IMAGING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="Interprétation radiologique..." value={interpretation} onChange={e => setInterpretation(e.target.value)} rows={4} />
              <Button className="w-full" onClick={() => { toast.success('Interprétation enregistrée et envoyée au DPI'); setInterpretation(''); }}>
                <Send className="w-4 h-4 mr-2" /> Enregistrer & Envoyer au DPI
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Imagerie;
