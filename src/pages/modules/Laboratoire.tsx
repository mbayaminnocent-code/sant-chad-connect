import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { FlaskConical, Barcode, CheckCircle, Clock, Ban, Search, Send, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Laboratoire = () => {
  const { patients, advancePatient, getPatientsByStep } = usePatientJourney();
  const [searchTerm, setSearchTerm] = useState('');
  const [scanResult, setScanResult] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const patientsAtLab = getPatientsByStep('labo');

  // Build lab requests from consultations
  const allLabRequests = patients.flatMap(p =>
    p.consultations.flatMap(c =>
      c.examens.map((examen, idx) => ({
        id: `${p.id}-${c.id}-${idx}`,
        patient: `${p.prenom} ${p.nom}`,
        patientId: p.id,
        nhid: p.nhid,
        examen,
        docteur: c.docteur,
        service: c.service,
        date: c.date,
        paye: true,
        statut: p.labResults.some(r => r.type.toLowerCase().includes(examen.toLowerCase().substring(0, 5)) && r.statut === 'termine') ? 'termine' as const :
               p.labResults.some(r => r.statut === 'en_cours') ? 'en_cours' as const : 'en_attente' as const,
        urgence: p.urgence,
      }))
    )
  );

  const extraRequests = [
    { id: 'extra-1', patient: 'Ousmane Djibril', patientId: '8', nhid: 'TCD-2024-00008', examen: 'BK Crachats x3', docteur: 'Dr. Moussa Ali', service: 'Pneumologie', date: '2024-03-08', paye: false, statut: 'en_attente' as const, urgence: 3 as const },
    { id: 'extra-2', patient: 'Khadija Abakar', patientId: '7', nhid: 'TCD-2024-00007', examen: 'HbA1c + Créatinine', docteur: 'Dr. Ibrahim Moussa', service: 'Médecine Interne', date: '2024-03-08', paye: true, statut: 'en_attente' as const, urgence: 3 as const },
  ];

  const allRequests = [...allLabRequests, ...extraRequests];
  const filteredRequests = allRequests.filter(r => {
    const matchSearch = searchTerm === '' || `${r.patient} ${r.nhid} ${r.examen}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const completedResults = patients.flatMap(p =>
    p.labResults.filter(r => r.statut === 'termine').map(r => ({
      ...r, patient: `${p.prenom} ${p.nom}`, nhid: p.nhid, patientId: p.id,
      docteur: p.consultations[0]?.docteur || 'Dr. inconnu',
      service: p.consultations[0]?.service || 'N/A',
    }))
  );

  const handleValidateAndSendBack = (patientId: string, patientName: string) => {
    advancePatient(patientId, 'consultation', 'Laboratoire', 'Résultats validés – Renvoyé au médecin');
  };

  const sampleSteps = ['Prescription', 'Prélèvement', 'Étiquetage', 'Analyse', 'Validation', 'Envoi DPI'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laboratoire LIMS</h1>
        <p className="text-muted-foreground text-sm">Gestion complète des analyses et résultats</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Patients au labo', value: String(patientsAtLab.length), icon: FlaskConical, color: 'text-primary' },
          { label: 'En attente', value: String(allRequests.filter(r => r.statut === 'en_attente').length), icon: Clock, color: 'text-warning' },
          { label: 'Terminées', value: String(completedResults.length), icon: CheckCircle, color: 'text-secondary' },
          { label: 'Bloquées (impayées)', value: String(allRequests.filter(r => !r.paye).length), icon: Ban, color: 'text-destructive' },
          { label: 'Envoyées au DPI', value: String(completedResults.length), icon: Send, color: 'text-muted-foreground' },
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

      {/* Patients currently at lab with journey */}
      {patientsAtLab.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader><CardTitle className="text-base">🔬 Patients actuellement au Laboratoire</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {patientsAtLab.map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.pathologieActuelle}</p>
                  </div>
                  <Button size="sm" className="text-xs gap-1 h-7" onClick={() => handleValidateAndSendBack(p.id, `${p.prenom} ${p.nom}`)}>
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
          <TabsTrigger value="suivi">🔬 Suivi échantillons</TabsTrigger>
          <TabsTrigger value="resultats">📊 Résultats</TabsTrigger>
          <TabsTrigger value="automates">⚙️ Automates</TabsTrigger>
        </TabsList>

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
              <Card key={req.id} className={`transition-all ${!req.paye ? 'border-destructive/40 bg-destructive/5' : 'hover:border-primary/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-2 h-8 rounded-full ${req.statut === 'termine' ? 'bg-secondary' : req.statut === 'en_cours' ? 'bg-primary animate-pulse' : 'bg-warning'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{req.patient}</p>
                          {req.urgence <= 2 && <Badge variant="destructive" className="text-[9px]">URGENT P{req.urgence}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{req.nhid} • {req.service}</p>
                        <p className="text-xs text-primary font-medium mt-0.5">{req.examen}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.paye ? (
                        <Badge variant="outline" className="text-[10px] border-secondary/50 text-secondary gap-1"><CheckCircle className="w-3 h-3" /> Payé</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] gap-1"><Ban className="w-3 h-3" /> Non payé</Badge>
                      )}
                      {req.statut === 'en_attente' && req.paye && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`Analyse "${req.examen}" lancée`)}>Lancer</Button>
                      )}
                      {req.statut === 'en_cours' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleValidateAndSendBack(req.patientId, req.patient)}>
                          <Send className="w-3 h-3" /> Valider → DPI
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suivi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Barcode className="w-4 h-4 text-primary" /> Scanner d'échantillon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Scannez le code-barres" value={scanResult} onChange={e => setScanResult(e.target.value)} />
                <Button onClick={() => { setScanResult('TCD-2024-00001-L001'); toast.info('🔍 Code-barres scanné'); }} variant="outline" className="gap-1"><Barcode className="w-4 h-4" /> Scanner</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parcours des échantillons</CardTitle>
              <CardDescription>Traçabilité complète</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {allRequests.filter(r => r.paye).slice(0, 5).map(req => {
                const currentStep = req.statut === 'termine' ? 5 : req.statut === 'en_cours' ? 3 : 1;
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
                      {sampleSteps.map((step, sIdx) => {
                        const isPast = sIdx < currentStep;
                        const isCurrent = sIdx === currentStep;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
                                isCurrent ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md' :
                                isPast ? 'bg-secondary border-secondary text-secondary-foreground' :
                                'bg-muted border-border text-muted-foreground'
                              }`}>{isPast ? '✓' : sIdx + 1}</div>
                              <span className={`text-[8px] mt-0.5 text-center leading-tight ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{step}</span>
                            </div>
                            {sIdx < sampleSteps.length - 1 && <div className={`h-0.5 w-full ${isPast ? 'bg-secondary' : 'bg-border'}`} />}
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

        <TabsContent value="resultats" className="space-y-4">
          {completedResults.map(result => (
            <Card key={result.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{result.patient}</p>
                    <p className="text-xs text-muted-foreground">{result.nhid} • {result.type} • {result.date}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary text-primary gap-1"><Send className="w-3 h-3" />Envoyé au DPI</Badge>
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-4 gap-0 bg-muted/60 text-[10px] font-medium text-muted-foreground p-2">
                    <span>Paramètre</span><span>Valeur</span><span>Normale</span><span>Statut</span>
                  </div>
                  {result.resultats.map((r, i) => (
                    <div key={i} className={`grid grid-cols-4 gap-0 text-xs p-2 border-t border-border ${r.statut === 'anormal' ? 'bg-destructive/5' : ''}`}>
                      <span className="text-foreground font-medium">{r.parametre}</span>
                      <span className={r.statut === 'anormal' ? 'font-bold text-destructive' : 'text-foreground'}>{r.valeur}</span>
                      <span className="text-muted-foreground">{r.normal}</span>
                      <Badge variant={r.statut === 'anormal' ? 'destructive' : 'outline'} className="text-[9px] w-fit">{r.statut === 'anormal' ? '⚠ Anormal' : 'Normal'}</Badge>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info('Résultats ouverts dans le DPI')}><Eye className="w-3 h-3" /> Voir dans DPI</Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success('Résultats imprimés')}><FileText className="w-3 h-3" /> Imprimer</Button>
                </div>
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
    </div>
  );
};

export default Laboratoire;
