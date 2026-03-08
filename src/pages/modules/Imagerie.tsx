import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_PATIENTS } from '@/data/mockData';
import { ScanLine, Camera, FileImage, Send, Clock, CheckCircle, Search, Eye, AlertTriangle, Monitor, Printer, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const IMAGING_TYPES = [
  'Radiographie', 'Échographie', 'Scanner (TDM)', 'IRM', 'Mammographie', 'Échocardiographie', 'Doppler vasculaire', 'Panoramique dentaire'
];

const EQUIPMENT = [
  { name: 'Radiographie numérique DR', salle: 'Salle 1', status: 'disponible', icon: '📸' },
  { name: 'Échographe GE Logiq E10', salle: 'Salle 2', status: 'disponible', icon: '🔊' },
  { name: 'Scanner 64 coupes', salle: 'Salle 3', status: 'en_cours', icon: '🖥️', patient: 'Hassan Idriss' },
  { name: 'IRM 1.5T Siemens', salle: 'Salle 4', status: 'maintenance', icon: '🧲' },
  { name: 'Mammographe numérique', salle: 'Salle 5', status: 'disponible', icon: '📷' },
];

const Imagerie = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Build imaging requests from consultations
  const allImagingRequests = MOCK_PATIENTS.flatMap(p =>
    p.consultations.flatMap(c =>
      c.examens
        .filter(e => e.toLowerCase().includes('écho') || e.toLowerCase().includes('scanner') || e.toLowerCase().includes('radio') || e.toLowerCase().includes('irm') || e.toLowerCase().includes('angio'))
        .map((examen, idx) => ({
          id: `img-${p.id}-${c.id}-${idx}`,
          patient: `${p.prenom} ${p.nom}`,
          patientId: p.id,
          nhid: p.nhid,
          examen,
          docteur: c.docteur,
          service: c.service,
          date: c.date,
          urgence: p.urgence,
          statut: p.imagingResults.some(r => r.zone.toLowerCase().includes(examen.toLowerCase().substring(0, 5)) && r.statut === 'termine') ? 'termine' as const :
                 p.imagingResults.some(r => r.statut === 'en_cours') ? 'en_cours' as const : 'en_attente' as const,
        }))
    )
  );

  // Extra mock requests
  const extraRequests = [
    { id: 'img-extra-1', patient: 'Ousmane Djibril', patientId: '8', nhid: 'TCD-2024-00008', examen: 'Radiographie thoracique', docteur: 'Dr. Moussa Ali', service: 'Pneumologie', date: '2024-03-08', urgence: 3 as const, statut: 'en_attente' as const },
    { id: 'img-extra-2', patient: 'Mariam Saleh', patientId: '9', nhid: 'TCD-2024-00009', examen: 'Échographie oculaire', docteur: 'Dr. Youssouf Haroun', service: 'Ophtalmologie', date: '2024-03-08', urgence: 4 as const, statut: 'en_attente' as const },
  ];

  const allRequests = [...allImagingRequests, ...extraRequests];
  const filteredRequests = allRequests.filter(r => {
    const matchSearch = searchTerm === '' || `${r.patient} ${r.nhid} ${r.examen}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const completedResults = MOCK_PATIENTS.flatMap(p =>
    p.imagingResults.filter(r => r.statut === 'termine').map(r => ({
      ...r, patient: `${p.prenom} ${p.nom}`, nhid: p.nhid, patientId: p.id,
      docteur: p.consultations[0]?.docteur || 'Dr. inconnu',
      service: p.consultations[0]?.service || 'N/A',
      urgence: p.urgence,
    }))
  );

  const imagingSteps = ['Demande', 'Rendez-vous', 'Préparation', 'Acquisition', 'Interprétation', 'Envoi DPI'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Imagerie Médicale</h1>
        <p className="text-muted-foreground text-sm">Radiologie, échographie, scanner, IRM – Demandes, acquisitions et résultats</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Demandes en attente', value: String(allRequests.filter(r => r.statut === 'en_attente').length), icon: Clock, color: 'text-warning' },
          { label: 'En acquisition', value: '1', icon: Camera, color: 'text-primary' },
          { label: 'Terminés aujourd\'hui', value: String(completedResults.length + 12), icon: CheckCircle, color: 'text-secondary' },
          { label: 'Envoyés au DPI', value: String(completedResults.length + 10), icon: Send, color: 'text-muted-foreground' },
          { label: 'Équipements actifs', value: `${EQUIPMENT.filter(e => e.status !== 'maintenance').length}/${EQUIPMENT.length}`, icon: Monitor, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted/60">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="demandes" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="demandes">📋 Demandes</TabsTrigger>
          <TabsTrigger value="suivi">🔄 Suivi parcours</TabsTrigger>
          <TabsTrigger value="resultats">📊 Résultats</TabsTrigger>
          <TabsTrigger value="equipements">🏥 Équipements</TabsTrigger>
          <TabsTrigger value="saisie">✍️ Nouvelle interprétation</TabsTrigger>
        </TabsList>

        {/* Tab: Requests */}
        <TabsContent value="demandes" className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher par patient, NHID ou examen..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
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
                      <div className={`w-2 h-8 rounded-full ${
                        req.statut === 'termine' ? 'bg-secondary' :
                        req.statut === 'en_cours' ? 'bg-primary animate-pulse' :
                        'bg-warning'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{req.patient}</p>
                          {req.urgence <= 2 && <Badge variant="destructive" className="text-[9px]">URGENT P{req.urgence}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{req.nhid} • {req.service}</p>
                        <p className="text-xs text-primary font-medium mt-0.5">📷 {req.examen}</p>
                        <p className="text-[10px] text-muted-foreground">Prescrit par {req.docteur} – {req.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${
                        req.statut === 'termine' ? 'border-secondary text-secondary' :
                        req.statut === 'en_cours' ? 'border-primary text-primary' :
                        'border-warning text-warning'
                      }`}>
                        {req.statut === 'termine' ? '✅ Terminé' : req.statut === 'en_cours' ? '🔄 En cours' : '⏳ En attente'}
                      </Badge>
                      {req.statut === 'en_attente' && (
                        <Button size="sm" className="h-7 text-xs"
                          onClick={() => toast.success(`Examen "${req.examen}" planifié pour ${req.patient}`)}>
                          Planifier
                        </Button>
                      )}
                      {req.statut === 'en_cours' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                          onClick={() => toast.success(`Images acquises – En attente d'interprétation`)}>
                          <Camera className="w-3 h-3" /> Acquérir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Journey tracking */}
        <TabsContent value="suivi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parcours des examens d'imagerie</CardTitle>
              <CardDescription>Traçabilité de la demande jusqu'à l'envoi au DPI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allRequests.slice(0, 5).map(req => {
                const currentStep = req.statut === 'termine' ? 5 : req.statut === 'en_cours' ? 3 : 0;
                return (
                  <div key={req.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{req.patient}</p>
                        <p className="text-xs text-primary">{req.examen}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{req.nhid}</Badge>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {imagingSteps.map((step, sIdx) => {
                        const isPast = sIdx < currentStep;
                        const isCurrent = sIdx === currentStep;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                                isCurrent ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md' :
                                isPast ? 'bg-secondary border-secondary text-secondary-foreground' :
                                'bg-muted border-border text-muted-foreground'
                              }`}>
                                {isPast ? '✓' : sIdx + 1}
                              </div>
                              <span className={`text-[8px] mt-0.5 text-center leading-tight ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{step}</span>
                            </div>
                            {sIdx < imagingSteps.length - 1 && (
                              <div className={`h-0.5 w-full ${isPast ? 'bg-secondary' : 'bg-border'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Results */}
        <TabsContent value="resultats" className="space-y-4">
          {completedResults.map(result => (
            <Card key={result.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{result.patient}</p>
                    <p className="text-xs text-muted-foreground">{result.nhid} • {result.date}</p>
                    <p className="text-[10px] text-muted-foreground">Prescrit par {result.docteur} – {result.service}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] border-secondary text-secondary">✅ Terminé</Badge>
                    <Badge variant="outline" className="text-[10px] border-primary text-primary gap-1"><Send className="w-3 h-3" />Envoyé au DPI</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileImage className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{result.type} – {result.zone}</span>
                  </div>
                  <p className="text-sm text-foreground">{result.interpretation}</p>
                </div>

                {/* Simulated image placeholder */}
                <div className="h-32 rounded-lg bg-gradient-to-br from-muted to-muted/50 border border-border flex items-center justify-center">
                  <div className="text-center">
                    <FileImage className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">Image DICOM – {result.type}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Image ouverte dans le visualiseur DICOM')}>
                    <Eye className="w-3 h-3" /> Visualiser
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success('Image imprimée')}>
                    <Printer className="w-3 h-3" /> Imprimer
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Résultat ouvert dans le DPI')}>
                    <Send className="w-3 h-3" /> Voir dans DPI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab: Equipment */}
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
                      eq.status === 'en_cours' ? 'border-primary text-primary' :
                      'border-warning text-warning'
                    }`}>
                      {eq.status === 'disponible' ? '✅ Disponible' : eq.status === 'en_cours' ? '🔄 En cours' : '⚠️ Maintenance'}
                    </Badge>
                  </div>
                  {eq.status === 'en_cours' && eq.patient && (
                    <div className="p-2 rounded bg-primary/10 border border-primary/20 text-xs">
                      <span className="text-muted-foreground">Patient en cours: </span>
                      <span className="font-medium text-foreground">{eq.patient}</span>
                    </div>
                  )}
                  {eq.status === 'maintenance' && (
                    <div className="p-2 rounded bg-warning/10 border border-warning/20 text-xs">
                      <span className="text-warning font-medium">⚠️ Maintenance préventive programmée – Retour estimé: demain 14h</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: New Interpretation */}
        <TabsContent value="saisie" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><ScanLine className="w-4 h-4 text-primary" />Saisie d'interprétation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="Type d'examen" /></SelectTrigger>
                <SelectContent>
                  {IMAGING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Interprétation du radiologue</label>
                <Textarea placeholder="Résultat et interprétation de l'examen..." value={interpretation} onChange={e => setInterpretation(e.target.value)} rows={5} />
              </div>
              <Button className="w-full gap-2" onClick={() => { toast.success('✅ Résultat envoyé au DPI du patient', { description: 'Le médecin traitant a été notifié' }); setInterpretation(''); }}>
                <Send className="w-4 h-4" /> Envoyer au Dossier Patient
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Imagerie;
