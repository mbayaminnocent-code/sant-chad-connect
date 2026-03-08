import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SERVICES } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { BedDouble, Users, Clock, AlertTriangle, Search, UserCheck, ArrowUpDown, Activity, CalendarDays, FileText, TrendingUp, Eye, ChevronDown, Thermometer } from 'lucide-react';
import { toast } from 'sonner';

const Hospitalisations = () => {
  const { patients } = usePatientJourney();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const hospitalises = patients.filter(p => p.hospitalisations.some(h => h.statut === 'actif'));

  const filteredPatients = hospitalises.filter(p => {
    const matchSearch = searchTerm === '' || `${p.prenom} ${p.nom} ${p.nhid}`.toLowerCase().includes(searchTerm.toLowerCase());
    const activeHosp = p.hospitalisations.find(h => h.statut === 'actif');
    const matchService = filterService === 'all' || activeHosp?.service?.toLowerCase().includes(filterService.toLowerCase());
    return matchSearch && matchService;
  });

  const bedsByService: Record<string, { total: number; occupied: number; critical: number }> = {
    'Réanimation': { total: 8, occupied: 3, critical: 2 },
    'Pédiatrie': { total: 20, occupied: 14, critical: 1 },
    'Maternité': { total: 15, occupied: 11, critical: 0 },
    'Médecine Interne': { total: 30, occupied: 22, critical: 3 },
    'Chirurgie': { total: 25, occupied: 18, critical: 1 },
    'Neurologie': { total: 12, occupied: 8, critical: 2 },
    'Cardiologie': { total: 10, occupied: 7, critical: 1 },
    'Oncologie': { total: 8, occupied: 5, critical: 0 },
  };

  const totalBeds = Object.values(bedsByService).reduce((s, d) => s + d.total, 0);
  const totalOccupied = Object.values(bedsByService).reduce((s, d) => s + d.occupied, 0);
  const totalCritical = Object.values(bedsByService).reduce((s, d) => s + d.critical, 0);
  const occupancyRate = Math.round((totalOccupied / totalBeds) * 100);

  const visitingSchedule = [
    { time: '08:00', service: 'Réanimation', docteur: 'Dr. Ali Bichara', type: 'Visite matinale' },
    { time: '09:00', service: 'Médecine Interne', docteur: 'Dr. Ibrahim Moussa', type: 'Tour de salle' },
    { time: '10:30', service: 'Pédiatrie', docteur: 'Dr. Fatima Oumar', type: 'Visite spécialisée' },
    { time: '11:00', service: 'Neurologie', docteur: 'Dr. Abdelkrim Saleh', type: 'Visite matinale' },
    { time: '14:00', service: 'Oncologie', docteur: 'Dr. Mariam Youssouf', type: 'Visite après-midi' },
    { time: '16:00', service: 'Chirurgie', docteur: 'Dr. Hassan Idriss', type: 'Visite pré-opératoire' },
  ];

  const urgenceColor = (u: number) => {
    if (u === 1) return 'bg-destructive text-destructive-foreground';
    if (u === 2) return 'bg-warning text-warning-foreground';
    return 'bg-primary text-primary-foreground';
  };

  const patientSteps = ['Admission', 'Installation', 'Soins', 'Visite médicale', 'Suivi', 'Sortie'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hospitalisations</h1>
        <p className="text-muted-foreground text-sm">Gestion des admissions, occupation des lits et parcours des patients hospitalisés</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Patients hospitalisés', value: String(totalOccupied), icon: Users, color: 'text-primary', sub: `sur ${totalBeds} lits` },
          { label: 'Taux d\'occupation', value: `${occupancyRate}%`, icon: BedDouble, color: occupancyRate > 80 ? 'text-destructive' : 'text-warning', sub: occupancyRate > 80 ? 'Élevé' : 'Normal' },
          { label: 'Cas critiques', value: String(totalCritical), icon: AlertTriangle, color: 'text-destructive', sub: 'Surveillance renforcée' },
          { label: 'Admissions aujourd\'hui', value: '5', icon: UserCheck, color: 'text-secondary', sub: '+2 vs hier' },
          { label: 'Sorties prévues', value: '3', icon: Clock, color: 'text-muted-foreground', sub: 'Ce jour' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted/60">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-[9px] text-muted-foreground">{s.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="lits" className="space-y-4">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="lits">🛏️ Occupation des Lits</TabsTrigger>
          <TabsTrigger value="patients">👥 Patients Hospitalisés</TabsTrigger>
          <TabsTrigger value="parcours">🔄 Parcours Patient</TabsTrigger>
          <TabsTrigger value="visites">📅 Planning Visites</TabsTrigger>
        </TabsList>

        {/* Tab: Bed Occupancy */}
        <TabsContent value="lits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.entries(bedsByService).map(([service, data]) => {
              const ratio = (data.occupied / data.total) * 100;
              const available = data.total - data.occupied;
              return (
                <Card key={service} className={`transition-all ${ratio > 90 ? 'border-destructive/50' : ratio > 75 ? 'border-warning/50' : 'border-border'}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{service}</h3>
                      {data.critical > 0 && (
                        <Badge variant="destructive" className="text-[10px]">{data.critical} critique{data.critical > 1 ? 's' : ''}</Badge>
                      )}
                    </div>

                    {/* Visual bed grid */}
                    <div className="grid grid-cols-5 gap-1">
                      {Array.from({ length: data.total }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-6 rounded flex items-center justify-center text-[8px] font-bold transition-all ${
                            i < data.critical ? 'bg-destructive/80 text-destructive-foreground' :
                            i < data.occupied ? 'bg-primary/70 text-primary-foreground' :
                            'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <Progress value={ratio} className="h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{data.occupied}/{data.total} occupés ({Math.round(ratio)}%)</span>
                        <span className={available <= 2 ? 'text-destructive font-bold' : 'text-secondary'}>{available} disponible{available > 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive/80" />Critique</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary/70" />Occupé</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-muted border border-border" />Libre</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Global occupancy bar */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Occupation globale de l'hôpital</span>
                <span className={`text-sm font-bold ${occupancyRate > 80 ? 'text-destructive' : 'text-secondary'}`}>{occupancyRate}%</span>
              </div>
              <Progress value={occupancyRate} className="h-3" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{totalOccupied} lits occupés</span>
                <span>{totalBeds - totalOccupied} lits disponibles</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Hospitalized Patients */}
        <TabsContent value="patients" className="space-y-4">
          {/* Search / Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher un patient (nom, NHID)..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrer par service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les services</SelectItem>
                {Object.keys(bedsByService).map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Patient cards */}
          <div className="space-y-3">
            {filteredPatients.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun patient trouvé</CardContent></Card>
            ) : filteredPatients.map(patient => {
              const activeHosp = patient.hospitalisations.find(h => h.statut === 'actif')!;
              const isExpanded = selectedPatient === patient.id;
              const daysIn = Math.floor((Date.now() - new Date(activeHosp.dateAdmission).getTime()) / 86400000) || 1;

              return (
                <Card key={patient.id} className={`transition-all ${isExpanded ? 'border-primary/50 shadow-md' : 'hover:border-primary/30'}`}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedPatient(isExpanded ? null : patient.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${urgenceColor(patient.urgence)}`}>
                          P{patient.urgence}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{patient.prenom} {patient.nom}</p>
                          <p className="text-xs text-muted-foreground">{patient.nhid} • {patient.age} ans • {patient.sexe === 'M' ? 'Homme' : 'Femme'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs border-primary/30 text-primary">Lit {activeHosp.lit}</Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{activeHosp.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">J{daysIn}</p>
                          <p className="text-[10px] text-muted-foreground">{daysIn > 7 ? '⚠️ Long séjour' : 'Normal'}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 pt-4 border-t border-border">
                        {/* Pathology & vitals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">MOTIF D'HOSPITALISATION</p>
                            <p className="text-sm font-semibold text-primary">{activeHosp.motif}</p>
                            <p className="text-sm text-foreground">{patient.pathologieActuelle}</p>
                            {patient.allergies.length > 0 && (
                              <div className="flex items-center gap-1.5 p-2 rounded bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                                <span className="text-xs text-destructive font-medium">Allergies: {patient.allergies.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          {patient.vitaux && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">CONSTANTES VITALES</p>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: 'TA', value: patient.vitaux.tension, unit: 'mmHg', icon: Activity },
                                  { label: 'T°', value: patient.vitaux.temperature, unit: '°C', icon: Thermometer },
                                  { label: 'FC', value: patient.vitaux.pouls, unit: 'bpm', icon: Activity },
                                  { label: 'SpO2', value: patient.vitaux.spo2, unit: '%', icon: Activity },
                                  { label: 'Poids', value: patient.vitaux.poids, unit: 'kg', icon: Users },
                                ].map(v => (
                                  <div key={v.label} className="p-2 rounded bg-muted/40 text-center">
                                    <p className="text-[10px] text-muted-foreground">{v.label}</p>
                                    <p className="text-sm font-bold text-foreground">{v.value}<span className="text-[10px] font-normal text-muted-foreground">{v.unit}</span></p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Patient journey */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">PARCOURS COMPLET DU PATIENT</p>
                          <PatientJourneyTracker patientId={patient.id} showEvents />
                        </div>

                        {/* Consultations & lab results */}
                        {patient.consultations.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-[10px] font-medium text-muted-foreground mb-2">DERNIÈRE CONSULTATION</p>
                            <p className="text-sm font-medium text-foreground">{patient.consultations[0].diagnostic}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{patient.consultations[0].docteur} – {patient.consultations[0].date}</p>
                            <p className="text-xs text-foreground mt-1">{patient.consultations[0].notes}</p>
                          </div>
                        )}

                        {patient.labResults.length > 0 && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-[10px] font-medium text-muted-foreground mb-2">RÉSULTATS LABO</p>
                            {patient.labResults[0].resultats.map((r, i) => (
                              <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0 text-xs">
                                <span className="text-foreground">{r.parametre}</span>
                                <span className={r.statut === 'anormal' ? 'font-bold text-destructive' : 'text-secondary'}>{r.valeur}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.info(`DPI de ${patient.prenom} ${patient.nom} ouvert`)}>
                            <Eye className="w-3 h-3" /> Voir DPI complet
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success('Fiche de soins mise à jour')}>
                            <FileText className="w-3 h-3" /> Fiche de soins
                          </Button>
                          <Button size="sm" className="text-xs gap-1" onClick={() => toast.success(`Sortie préparée pour ${patient.prenom} ${patient.nom}`)}>
                            Préparer sortie
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Patient Journey */}
        <TabsContent value="parcours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flux d'hospitalisation en temps réel</CardTitle>
              <CardDescription>Suivi du parcours de chaque patient depuis l'admission jusqu'à la sortie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {patientSteps.map((step, idx) => (
                  <div key={step} className="space-y-2">
                    <div className={`text-center py-2 rounded-lg ${
                      idx === 0 ? 'bg-secondary/15 text-secondary' :
                      idx === patientSteps.length - 1 ? 'bg-muted text-muted-foreground' :
                      'bg-primary/15 text-primary'
                    }`}>
                      <p className="text-xs font-bold">{step}</p>
                    </div>
                    <div className="space-y-1.5 min-h-[60px]">
                      {filteredPatients.filter(p => {
                        const activeHosp = p.hospitalisations.find(h => h.statut === 'actif')!;
                        const daysIn = Math.floor((Date.now() - new Date(activeHosp.dateAdmission).getTime()) / 86400000) || 1;
                        const currentStep = Math.min(Math.floor(daysIn / 1.5) + 1, patientSteps.length - 1);
                        return currentStep === idx;
                      }).map(p => (
                        <div key={p.id} className="p-2 rounded border border-border bg-card text-[10px]">
                          <p className="font-medium text-foreground">{p.prenom} {p.nom.charAt(0)}.</p>
                          <p className="text-muted-foreground">{p.hospitalisations.find(h => h.statut === 'actif')?.lit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admissions timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historique des admissions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                {filteredPatients.sort((a, b) => {
                  const dateA = a.hospitalisations.find(h => h.statut === 'actif')?.dateAdmission || '';
                  const dateB = b.hospitalisations.find(h => h.statut === 'actif')?.dateAdmission || '';
                  return dateB.localeCompare(dateA);
                }).map(p => {
                  const h = p.hospitalisations.find(h => h.statut === 'actif')!;
                  return (
                    <div key={p.id} className="relative flex items-start gap-3">
                      <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 ${p.urgence <= 2 ? 'bg-destructive border-destructive' : 'bg-primary border-primary'}`} />
                      <div className="flex-1 p-3 rounded-lg border border-border bg-card">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">{p.prenom} {p.nom}</p>
                          <span className="text-[10px] text-muted-foreground">{h.dateAdmission}</span>
                        </div>
                        <p className="text-xs text-primary mt-0.5">{h.motif}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{h.service}</Badge>
                          <Badge variant="outline" className="text-[10px]">Lit {h.lit}</Badge>
                          <Badge className={`text-[10px] ${urgenceColor(p.urgence)}`}>P{p.urgence}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Visit Schedule */}
        <TabsContent value="visites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Planning des visites médicales – Aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {visitingSchedule.map((v, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="text-center min-w-[50px]">
                    <p className="text-sm font-bold text-primary">{v.time}</p>
                  </div>
                  <div className="h-8 w-0.5 bg-border" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{v.type}</p>
                    <p className="text-xs text-muted-foreground">{v.service} – {v.docteur}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {new Date().getHours() >= parseInt(v.time) ? '✅ Terminé' : '⏳ À venir'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* IA Prediction */}
      <Card className="border-primary/30 bg-accent/20">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground">🤖 Prédiction IA – Flux d'hospitalisations</p>
          <p className="text-sm text-foreground mt-1">
            Pic d'admissions prévu en Réanimation dans les 48h (saison méningite). Recommandation: préparer 3 lits supplémentaires.
            Le taux d'occupation global ({occupancyRate}%) {occupancyRate > 80 ? 'est critique – déclencher le protocole de gestion de crise' : 'reste gérable'}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Hospitalisations;
