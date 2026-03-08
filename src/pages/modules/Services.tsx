import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SERVICES, MOCK_PATIENTS } from '@/data/mockData';
import { Users, BedDouble, Clock, ArrowRight, Activity, Stethoscope, TrendingUp, UserCheck, AlertTriangle, ChevronRight, Eye } from 'lucide-react';
import { toast } from 'sonner';

const statusLabel: Record<string, { label: string; color: string }> = {
  attente: { label: 'En attente', color: 'bg-warning/15 text-warning border-warning/30' },
  triage: { label: 'Triage', color: 'bg-primary/15 text-primary border-primary/30' },
  consultation: { label: 'Consultation', color: 'bg-secondary/15 text-secondary border-secondary/30' },
  labo: { label: 'Laboratoire', color: 'bg-accent-foreground/15 text-accent-foreground border-accent-foreground/30' },
  imagerie: { label: 'Imagerie', color: 'bg-primary/15 text-primary border-primary/30' },
  pharmacie: { label: 'Pharmacie', color: 'bg-secondary/15 text-secondary border-secondary/30' },
  hospitalise: { label: 'Hospitalisé', color: 'bg-destructive/15 text-destructive border-destructive/30' },
  sorti: { label: 'Sorti', color: 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30' },
};

const urgenceColor = (u: number) => {
  if (u === 1) return 'bg-destructive text-destructive-foreground';
  if (u === 2) return 'bg-warning text-warning-foreground';
  if (u === 3) return 'bg-primary text-primary-foreground';
  return 'bg-muted text-muted-foreground';
};

const Services = () => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');

  const getServicePatients = (serviceId: string) => MOCK_PATIENTS.filter(p => p.service === serviceId);

  const getServiceStats = (serviceId: string) => {
    const patients = getServicePatients(serviceId);
    return {
      total: patients.length,
      attente: patients.filter(p => p.statut === 'attente').length,
      consultation: patients.filter(p => p.statut === 'consultation').length,
      hospitalise: patients.filter(p => p.statut === 'hospitalise').length,
      urgents: patients.filter(p => p.urgence <= 2).length,
      triage: patients.filter(p => p.statut === 'triage').length,
    };
  };

  const totalPatients = MOCK_PATIENTS.length;
  const totalHospitalises = MOCK_PATIENTS.filter(p => p.statut === 'hospitalise').length;
  const totalConsultations = MOCK_PATIENTS.filter(p => p.statut === 'consultation').length;
  const totalUrgents = MOCK_PATIENTS.filter(p => p.urgence <= 2).length;

  const selectedServiceData = selectedService ? SERVICES.find(s => s.id === selectedService) : null;
  const selectedPatients = selectedService ? getServicePatients(selectedService) : [];

  const patientJourneySteps = ['attente', 'triage', 'consultation', 'labo', 'imagerie', 'pharmacie', 'hospitalise', 'sorti'];
  const journeyLabels: Record<string, string> = {
    attente: 'Arrivée', triage: 'Triage', consultation: 'Consultation',
    labo: 'Laboratoire', imagerie: 'Imagerie', pharmacie: 'Pharmacie',
    hospitalise: 'Hospitalisé', sorti: 'Sortie'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services Médicaux</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble et parcours des patients par département</p>
        </div>
        {selectedService && (
          <Button variant="outline" onClick={() => { setSelectedService(null); setViewMode('grid'); }}>
            ← Retour à la vue générale
          </Button>
        )}
      </div>

      {/* Global KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total patients', value: totalPatients, icon: Users, color: 'text-primary' },
          { label: 'Hospitalisés', value: totalHospitalises, icon: BedDouble, color: 'text-destructive' },
          { label: 'En consultation', value: totalConsultations, icon: Stethoscope, color: 'text-secondary' },
          { label: 'Cas urgents (P1-P2)', value: totalUrgents, icon: AlertTriangle, color: 'text-warning' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-muted/60`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!selectedService ? (
        /* ===== GRID VIEW: All Services ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SERVICES.map(service => {
            const stats = getServiceStats(service.id);
            const occupancyRate = stats.total > 0 ? Math.min((stats.hospitalise / Math.max(stats.total, 1)) * 100, 100) : 0;
            return (
              <Card
                key={service.id}
                className="hover:border-primary/50 transition-all cursor-pointer hover:shadow-md group"
                onClick={() => { setSelectedService(service.id); setViewMode('detail'); }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Mini stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-muted/40">
                      <p className="text-lg font-bold text-foreground">{stats.total}</p>
                      <p className="text-[10px] text-muted-foreground">Patients</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/10">
                      <p className="text-lg font-bold text-secondary">{stats.consultation}</p>
                      <p className="text-[10px] text-muted-foreground">Consult.</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-destructive/10">
                      <p className="text-lg font-bold text-destructive">{stats.hospitalise}</p>
                      <p className="text-[10px] text-muted-foreground">Hosp.</p>
                    </div>
                  </div>

                  {/* Patient flow mini-bar */}
                  {stats.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Charge du service</span>
                        <span>{stats.total} patient{stats.total > 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        {stats.attente > 0 && <div className="bg-warning h-full" style={{ width: `${(stats.attente / stats.total) * 100}%` }} />}
                        {stats.triage > 0 && <div className="bg-primary/60 h-full" style={{ width: `${(stats.triage / stats.total) * 100}%` }} />}
                        {stats.consultation > 0 && <div className="bg-secondary h-full" style={{ width: `${(stats.consultation / stats.total) * 100}%` }} />}
                        {stats.hospitalise > 0 && <div className="bg-destructive h-full" style={{ width: `${(stats.hospitalise / stats.total) * 100}%` }} />}
                      </div>
                      <div className="flex gap-2 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Attente</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Consult.</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Hosp.</span>
                      </div>
                    </div>
                  )}

                  {/* Urgent cases alert */}
                  {stats.urgents > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                      <span className="text-xs font-medium text-destructive">{stats.urgents} cas urgent{stats.urgents > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Last 2 patients preview */}
                  {stats.total > 0 && getServicePatients(service.id).slice(0, 2).map(p => (
                    <div key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/30 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.urgence <= 2 ? 'bg-destructive animate-pulse' : 'bg-secondary'}`} />
                        <span className="font-medium text-foreground">{p.prenom} {p.nom}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] border ${statusLabel[p.statut]?.color || ''}`}>
                        {statusLabel[p.statut]?.label || p.statut}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ===== DETAIL VIEW: Single Service ===== */
        <div className="space-y-6">
          {/* Service header */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedServiceData?.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedPatients.length} patients enregistrés dans ce service</p>
                </div>
                <div className="flex gap-3">
                  <div className="text-center px-4 py-2 rounded-lg bg-card border border-border">
                    <p className="text-2xl font-bold text-primary">{selectedPatients.filter(p => p.statut === 'consultation').length}</p>
                    <p className="text-[10px] text-muted-foreground">Consultations</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-card border border-border">
                    <p className="text-2xl font-bold text-destructive">{selectedPatients.filter(p => p.statut === 'hospitalise').length}</p>
                    <p className="text-[10px] text-muted-foreground">Hospitalisés</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-card border border-border">
                    <p className="text-2xl font-bold text-warning">{selectedPatients.filter(p => p.urgence <= 2).length}</p>
                    <p className="text-[10px] text-muted-foreground">Urgents</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="patients" className="space-y-4">
            <TabsList className="bg-muted/60">
              <TabsTrigger value="patients">📋 Patients enregistrés</TabsTrigger>
              <TabsTrigger value="parcours">🔄 Parcours patient</TabsTrigger>
              <TabsTrigger value="activite">📊 Activité du service</TabsTrigger>
            </TabsList>

            {/* Tab: Patients List */}
            <TabsContent value="patients" className="space-y-3">
              {selectedPatients.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun patient dans ce service actuellement</CardContent></Card>
              ) : selectedPatients.map(patient => (
                <Card key={patient.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        {/* Patient header */}
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${urgenceColor(patient.urgence)}`}>
                            P{patient.urgence}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{patient.prenom} {patient.nom}</p>
                            <p className="text-xs text-muted-foreground">{patient.nhid} • {patient.age} ans • {patient.sexe === 'M' ? 'Homme' : 'Femme'} • {patient.groupeSanguin}</p>
                          </div>
                          <Badge variant="outline" className={`ml-auto border ${statusLabel[patient.statut]?.color || ''}`}>
                            {statusLabel[patient.statut]?.label || patient.statut}
                          </Badge>
                        </div>

                        {/* Pathology */}
                        <div className="pl-11">
                          <p className="text-sm text-primary font-medium">{patient.pathologieActuelle}</p>
                          {patient.allergies.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 text-destructive" />
                              <span className="text-xs text-destructive font-medium">Allergies: {patient.allergies.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Vitals */}
                        {patient.vitaux && (
                          <div className="pl-11 flex gap-3 flex-wrap">
                            {[
                              { label: 'TA', value: patient.vitaux.tension, unit: 'mmHg' },
                              { label: 'T°', value: patient.vitaux.temperature, unit: '°C' },
                              { label: 'FC', value: patient.vitaux.pouls, unit: 'bpm' },
                              { label: 'SpO2', value: patient.vitaux.spo2, unit: '%' },
                              { label: 'Poids', value: patient.vitaux.poids, unit: 'kg' },
                            ].map(v => (
                              <span key={v.label} className="text-[11px] px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                                <span className="font-medium text-foreground">{v.label}:</span> {v.value}{v.unit}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Journey tracker */}
                        <div className="pl-11 pt-2">
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">PARCOURS DU PATIENT</p>
                          <div className="flex items-center gap-0.5">
                            {patientJourneySteps.map((step, idx) => {
                              const currentIdx = patientJourneySteps.indexOf(patient.statut);
                              const isPast = idx < currentIdx;
                              const isCurrent = idx === currentIdx;
                              const isFuture = idx > currentIdx;
                              return (
                                <div key={step} className="flex items-center">
                                  <div className={`flex flex-col items-center`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-2 transition-all
                                      ${isCurrent ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-md' : ''}
                                      ${isPast ? 'bg-secondary border-secondary text-secondary-foreground' : ''}
                                      ${isFuture ? 'bg-muted border-border text-muted-foreground' : ''}`}>
                                      {isPast ? '✓' : idx + 1}
                                    </div>
                                    <span className={`text-[8px] mt-0.5 whitespace-nowrap ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                      {journeyLabels[step]}
                                    </span>
                                  </div>
                                  {idx < patientJourneySteps.length - 1 && (
                                    <div className={`w-4 h-0.5 mx-0.5 mt-[-10px] ${isPast ? 'bg-secondary' : 'bg-border'}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Recent consultation */}
                        {patient.consultations.length > 0 && (
                          <div className="pl-11 mt-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                            <p className="text-[10px] font-medium text-muted-foreground mb-1">DERNIÈRE CONSULTATION</p>
                            <p className="text-xs font-medium text-foreground">{patient.consultations[0].diagnostic}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{patient.consultations[0].docteur} – {patient.consultations[0].date}</p>
                          </div>
                        )}

                        {/* Hospitalisation info */}
                        {patient.hospitalisations.filter(h => h.statut === 'actif').map(h => (
                          <div key={h.id} className="pl-11 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                            <div className="flex items-center gap-2">
                              <BedDouble className="w-3.5 h-3.5 text-destructive" />
                              <span className="text-xs font-medium text-destructive">Hospitalisé – Lit {h.lit}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{h.service} • Depuis le {h.dateAdmission} • {h.motif}</p>
                          </div>
                        ))}

                        {/* Actions */}
                        <div className="pl-11 flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => toast.info(`Dossier médical de ${patient.prenom} ${patient.nom} ouvert`)}>
                            <Eye className="w-3 h-3" /> Voir DPI
                          </Button>
                          {patient.statut !== 'sorti' && patient.statut !== 'hospitalise' && (
                            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => toast.success(`${patient.prenom} transféré à l'étape suivante`)}>
                              <ArrowRight className="w-3 h-3" /> Étape suivante
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Tab: Patient Journey */}
            <TabsContent value="parcours" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flux des patients dans le service</CardTitle>
                  <CardDescription>Visualisation en temps réel du parcours de chaque patient</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {patientJourneySteps.map(step => {
                      const patientsAtStep = selectedPatients.filter(p => p.statut === step);
                      return (
                        <div key={step} className="space-y-2">
                          <div className="text-center">
                            <div className={`text-xs font-bold px-2 py-1.5 rounded-lg ${
                              step === 'attente' ? 'bg-warning/15 text-warning' :
                              step === 'consultation' ? 'bg-secondary/15 text-secondary' :
                              step === 'hospitalise' ? 'bg-destructive/15 text-destructive' :
                              step === 'sorti' ? 'bg-muted text-muted-foreground' :
                              'bg-primary/15 text-primary'
                            }`}>
                              {journeyLabels[step]}
                            </div>
                            <p className="text-lg font-bold text-foreground mt-1">{patientsAtStep.length}</p>
                          </div>
                          <div className="space-y-1">
                            {patientsAtStep.map(p => (
                              <div key={p.id} className="p-1.5 rounded bg-card border border-border text-[10px] text-center">
                                <p className="font-medium text-foreground truncate">{p.prenom} {p.nom.charAt(0)}.</p>
                                <Badge className={`text-[8px] mt-0.5 ${urgenceColor(p.urgence)}`}>P{p.urgence}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Journey timeline for each patient */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline des enregistrements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPatients.map(patient => (
                    <div key={patient.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${urgenceColor(patient.urgence)} shrink-0`}>
                        P{patient.urgence}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-foreground">{patient.prenom} {patient.nom}</p>
                          <span className="text-[10px] text-muted-foreground">{patient.nhid}</span>
                        </div>
                        <p className="text-xs text-primary mt-0.5">{patient.pathologieActuelle}</p>
                        {/* Mini journey bar */}
                        <div className="flex items-center gap-1 mt-2">
                          {patientJourneySteps.map((step, idx) => {
                            const currentIdx = patientJourneySteps.indexOf(patient.statut);
                            const isPast = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                              <div key={step} className="flex items-center">
                                <div className={`w-3 h-3 rounded-full text-[6px] flex items-center justify-center
                                  ${isCurrent ? 'bg-primary ring-2 ring-primary/30' : isPast ? 'bg-secondary' : 'bg-muted'}`} />
                                {idx < patientJourneySteps.length - 1 && (
                                  <div className={`w-3 h-0.5 ${isPast ? 'bg-secondary' : 'bg-muted'}`} />
                                )}
                              </div>
                            );
                          })}
                          <span className="text-[10px] ml-2 text-muted-foreground font-medium">{statusLabel[patient.statut]?.label}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedPatients.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">Aucun patient dans ce service</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Service Activity */}
            <TabsContent value="activite" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Répartition par statut</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(statusLabel).map(([key, val]) => {
                      const count = selectedPatients.filter(p => p.statut === key).length;
                      if (count === 0) return null;
                      const pct = (count / Math.max(selectedPatients.length, 1)) * 100;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{val.label}</span>
                            <span className="font-bold text-foreground">{count}</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-secondary" /> Indicateurs clés</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Temps moyen d\'attente', value: '45 min', trend: '↓ 12%' },
                      { label: 'Durée moy. consultation', value: '22 min', trend: '→ stable' },
                      { label: 'Taux d\'hospitalisation', value: `${Math.round((selectedPatients.filter(p => p.statut === 'hospitalise').length / Math.max(selectedPatients.length, 1)) * 100)}%`, trend: '' },
                      { label: 'Patients vus aujourd\'hui', value: String(selectedPatients.length), trend: '↑ 8%' },
                      { label: 'Examens demandés', value: String(selectedPatients.reduce((sum, p) => sum + p.consultations.reduce((s, c) => s + c.examens.length, 0), 0)), trend: '' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{item.value}</span>
                          {item.trend && <span className="text-[10px] text-secondary">{item.trend}</span>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* IA Insight */}
              <Card className="border-primary/30 bg-accent/20">
                <CardContent className="p-4">
                  <p className="text-sm font-bold text-foreground">🤖 Analyse IA – {selectedServiceData?.name}</p>
                  <p className="text-sm text-foreground mt-1">
                    Tendance: augmentation de {Math.floor(Math.random() * 15) + 5}% des consultations cette semaine.
                    {selectedPatients.filter(p => p.urgence <= 2).length > 0
                      ? ` ${selectedPatients.filter(p => p.urgence <= 2).length} patient(s) nécessitent une attention prioritaire immédiate.`
                      : ' Aucun cas critique en attente.'
                    }
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Services;
