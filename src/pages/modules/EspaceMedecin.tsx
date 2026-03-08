import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import { SERVICES, MOCK_PATIENTS } from '@/data/mockData';
import {
  UserCircle, Users, Calendar, Stethoscope, Clock, AlertTriangle,
  BedDouble, HeartPulse, Activity, ClipboardList, Scissors, FileText, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Service-specific protocols and info based on real hospital operations
const SERVICE_PROTOCOLS: Record<string, {
  description: string;
  protocols: string[];
  urgencyTypes: string[];
  commonPathologies: string[];
  equipment: string[];
}> = {
  general: {
    description: 'Premier contact médical. Diagnostic et orientation des pathologies courantes.',
    protocols: ['Protocole paludisme OMS', 'Prise en charge fièvre typhoïde', 'Protocole diarrhée aiguë', 'Gestion des infections respiratoires'],
    urgencyTypes: ['Fièvre > 39°C', 'Déshydratation sévère', 'Détresse respiratoire'],
    commonPathologies: ['Paludisme', 'Fièvre typhoïde', 'Infections respiratoires', 'Diarrhées', 'Diabète', 'HTA'],
    equipment: ['Stéthoscope', 'Tensiomètre', 'Oxymètre', 'Otoscope'],
  },
  cardio: {
    description: 'Diagnostic et traitement des maladies cardiovasculaires. Urgences coronariennes.',
    protocols: ['STEMI – Protocole de reperfusion', 'Insuffisance cardiaque aiguë', 'Fibrillation auriculaire', 'HTA maligne'],
    urgencyTypes: ['Syndrome coronarien aigu', 'OAP', 'Tamponnade', 'Dissection aortique'],
    commonPathologies: ['HTA', 'Insuffisance cardiaque', 'Cardiopathie rhumatismale', 'IDM', 'Troubles du rythme'],
    equipment: ['ECG 12 dérivations', 'Échocardiographe', 'Moniteur cardiaque', 'Défibrillateur'],
  },
  chirurgie: {
    description: 'Chirurgie générale et digestive. Urgences chirurgicales abdominales.',
    protocols: ['Abdomen aigu', 'Appendicectomie', 'Hernie étranglée', 'Occlusion intestinale', 'Cholécystectomie'],
    urgencyTypes: ['Péritonite', 'Hémorragie digestive', 'Hernie étranglée', 'Appendicite compliquée'],
    commonPathologies: ['Appendicite', 'Hernies', 'Cholécystite', 'Occlusions', 'Traumatismes abdominaux'],
    equipment: ['Bloc opératoire', 'Instruments de chirurgie', 'Aspirateur chirurgical', 'Bistouri électrique'],
  },
  gyneco: {
    description: 'Suivi gynécologique et obstétrical. Accouchements et urgences obstétricales.',
    protocols: ['Pré-éclampsie/Éclampsie', 'Hémorragie du post-partum', 'Césarienne d\'urgence', 'Grossesse extra-utérine'],
    urgencyTypes: ['Éclampsie', 'HRP', 'Procidence du cordon', 'Hémorragie de la délivrance'],
    commonPathologies: ['Grossesse à risque', 'Pré-éclampsie', 'Placenta praevia', 'Infections génitales'],
    equipment: ['Échographe obstétrical', 'Monitoring fœtal', 'Table d\'accouchement', 'Kit césarienne'],
  },
  pediatrie: {
    description: 'Soins aux enfants de 0 à 15 ans. PCIME et nutrition.',
    protocols: ['PCIME (Prise en Charge Intégrée)', 'Protocole MAS/MAM', 'Paludisme grave pédiatrique', 'Déshydratation pédiatrique'],
    urgencyTypes: ['Convulsions fébriles', 'Détresse respiratoire', 'Déshydratation sévère', 'Paludisme cérébral'],
    commonPathologies: ['Malnutrition', 'Paludisme', 'Diarrhées', 'Pneumonie', 'Rougeole', 'Méningite'],
    equipment: ['Balance pédiatrique', 'Brassard PB', 'Nébuliseur', 'Couveuse'],
  },
  neuro: {
    description: 'Pathologies du système nerveux. Urgences neurovasculaires.',
    protocols: ['AVC ischémique – Thrombolyse', 'État de mal épileptique', 'Méningite bactérienne', 'Coma – Échelle de Glasgow'],
    urgencyTypes: ['AVC aigu', 'État de mal épileptique', 'Coma', 'Hypertension intracrânienne'],
    commonPathologies: ['AVC', 'Épilepsie', 'Méningite', 'Neuropathies', 'Céphalées'],
    equipment: ['Scanner cérébral', 'EEG', 'Échelle de Glasgow', 'Kit ponction lombaire'],
  },
  ortho: {
    description: 'Traumatologie et orthopédie. Fractures et pathologies ostéo-articulaires.',
    protocols: ['Fracture ouverte – Gustilo', 'Réduction de luxation', 'Ostéosynthèse', 'Plâtre et immobilisation'],
    urgencyTypes: ['Fracture ouverte', 'Syndrome de loge', 'Luxation irréductible', 'Polytraumatisme'],
    commonPathologies: ['Fractures', 'Luxations', 'Arthrose', 'Infections osseuses', 'Traumatismes sportifs'],
    equipment: ['Radiographie', 'Matériel d\'ostéosynthèse', 'Plâtre', 'Attelles'],
  },
  pneumo: {
    description: 'Pathologies respiratoires. Tuberculose et infections pulmonaires.',
    protocols: ['Tuberculose – Protocole DOTS', 'Asthme aigu grave', 'Pneumothorax', 'Pneumonie communautaire'],
    urgencyTypes: ['Détresse respiratoire aiguë', 'Pneumothorax suffocant', 'Asthme aigu grave', 'Hémoptysie massive'],
    commonPathologies: ['Tuberculose', 'Pneumonie', 'Asthme', 'BPCO', 'Pleurésie'],
    equipment: ['Spiromètre', 'Nébuliseur', 'Kit drainage thoracique', 'GDS'],
  },
  onco: {
    description: 'Diagnostic et traitement des cancers. Chimiothérapie et soins palliatifs.',
    protocols: ['Protocoles de chimiothérapie', 'Soins palliatifs', 'Neutropénie fébrile', 'Gestion de la douleur cancéreuse'],
    urgencyTypes: ['Neutropénie fébrile', 'Compression médullaire', 'Syndrome cave supérieur', 'Hypercalcémie maligne'],
    commonPathologies: ['Cancer du foie', 'Lymphomes', 'Cancer du sein', 'Cancer du col utérin', 'Leucémies'],
    equipment: ['Chambre implantable', 'Pompe à chimiothérapie', 'Morphine PCA'],
  },
  reanimation: {
    description: 'Soins intensifs et réanimation. Défaillances d\'organes multiples.',
    protocols: ['Choc septique – Surviving Sepsis', 'SDRA – Ventilation protectrice', 'Arrêt cardiaque – ALS', 'Intoxications aiguës'],
    urgencyTypes: ['Arrêt cardiaque', 'Choc septique', 'SDRA', 'Défaillance multiviscérale'],
    commonPathologies: ['Sepsis', 'SDRA', 'Insuffisance rénale aiguë', 'Polytraumatismes', 'Comas'],
    equipment: ['Ventilateur', 'Moniteur multiparamétrique', 'Pousse-seringues', 'Défibrillateur', 'EER'],
  },
  interne: {
    description: 'Médecine interne et maladies systémiques. Diagnostics complexes.',
    protocols: ['Diabète décompensé – Acidocétose', 'Insuffisance rénale chronique', 'Anémie sévère', 'Maladies auto-immunes'],
    urgencyTypes: ['Acidocétose diabétique', 'Crise thyréotoxique', 'Anémie sévère', 'Insuffisance surrénalienne aiguë'],
    commonPathologies: ['Diabète', 'IRC', 'Anémie', 'Lupus', 'VIH/SIDA'],
    equipment: ['Glucomètre', 'Kit perfusion', 'ECG'],
  },
  ophtalmo: {
    description: 'Maladies des yeux. Chirurgie ophtalmologique.',
    protocols: ['Cataracte – Phacoémulsification', 'Glaucome aigu', 'Traumatisme oculaire', 'Décollement de rétine'],
    urgencyTypes: ['Glaucome aigu par fermeture', 'Traumatisme perforant', 'OACR', 'Décollement de rétine'],
    commonPathologies: ['Cataracte', 'Glaucome', 'Trachome', 'Conjonctivite', 'Vices de réfraction'],
    equipment: ['Lampe à fente', 'Tonomètre', 'Ophtalmoscope', 'Microscope opératoire'],
  },
  uro: {
    description: 'Pathologies urinaires et génitales masculines.',
    protocols: ['Colique néphrétique', 'Rétention aiguë d\'urines', 'Torsion testiculaire', 'Infections urinaires compliquées'],
    urgencyTypes: ['Rétention aiguë', 'Torsion testiculaire', 'Pyélonéphrite obstructive', 'Hématurie massive'],
    commonPathologies: ['Lithiase urinaire', 'HBP', 'Infections urinaires', 'Torsion testiculaire'],
    equipment: ['Échographe', 'Cystoscope', 'Sonde urinaire', 'Lithotripteur'],
  },
  dermato: {
    description: 'Maladies de la peau et muqueuses.',
    protocols: ['Eczéma sévère', 'Dermatoses infectieuses', 'Lèpre', 'Dermatoses VIH'],
    urgencyTypes: ['Syndrome de Lyell', 'Érythrodermie', 'Fasciite nécrosante'],
    commonPathologies: ['Eczéma', 'Dermatoses fongiques', 'Lèpre', 'Gale', 'Dermatoses allergiques'],
    equipment: ['Dermatoscope', 'Lampe de Wood', 'Cryothérapie', 'Kit biopsie cutanée'],
  },
  maternite: {
    description: 'Salle d\'accouchement et suites de couches.',
    protocols: ['Accouchement normal', 'GATPA', 'Réanimation néonatale', 'Soins kangourou'],
    urgencyTypes: ['Hémorragie de la délivrance', 'Éclampsie', 'Souffrance fœtale aiguë'],
    commonPathologies: ['Accouchement', 'Hémorragie post-partum', 'Infection puerpérale', 'Prématurité'],
    equipment: ['Table d\'accouchement', 'Monitoring fœtal', 'Aspirateur néonatal', 'Table de réanimation néonatale'],
  },
};

const urgenceColor = (u: number) => {
  if (u === 1) return 'bg-destructive text-destructive-foreground';
  if (u === 2) return 'bg-warning text-warning-foreground';
  if (u === 3) return 'bg-primary text-primary-foreground';
  return 'bg-muted text-muted-foreground';
};

const statusLabel: Record<string, { label: string; style: string }> = {
  attente: { label: 'En attente', style: 'bg-warning/15 text-warning' },
  triage: { label: 'Triage', style: 'bg-primary/15 text-primary' },
  consultation: { label: 'Consultation', style: 'bg-secondary/15 text-secondary' },
  hospitalise: { label: 'Hospitalisé', style: 'bg-destructive/15 text-destructive' },
  labo: { label: 'Laboratoire', style: 'bg-accent text-accent-foreground' },
  imagerie: { label: 'Imagerie', style: 'bg-primary/15 text-primary' },
  pharmacie: { label: 'Pharmacie', style: 'bg-secondary/15 text-secondary' },
  sorti: { label: 'Sorti', style: 'bg-muted text-muted-foreground' },
};

const EspaceMedecin = () => {
  const { name, doctorProfile } = useAuth();
  const { patients } = usePatientJourney();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const service = doctorProfile?.service || 'general';
  const serviceInfo = SERVICES.find(s => s.id === service);
  const protocols = SERVICE_PROTOCOLS[service] || SERVICE_PROTOCOLS.general;

  // Patients in my service
  const myPatients = useMemo(() =>
    patients.filter(p => p.service === service),
    [patients, service]
  );

  const patientsAttente = myPatients.filter(p => p.statut === 'attente' || p.statut === 'triage');
  const patientsConsultation = myPatients.filter(p => p.statut === 'consultation');
  const patientsHospitalises = myPatients.filter(p => p.statut === 'hospitalise');
  const patientsUrgents = myPatients.filter(p => p.urgence <= 2);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{name}</h1>
            <p className="text-sm text-muted-foreground">{doctorProfile?.specialite} – {serviceInfo?.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {doctorProfile?.isChefDeService && (
                <Badge className="bg-primary/10 text-primary text-[10px]">👑 Chef de Service</Badge>
              )}
              <Badge variant="outline" className="text-[10px]">Service: {serviceInfo?.name}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/patients')}>
            <Users className="w-4 h-4 mr-1" /> Mes patients
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/dpi')}>
            <FileText className="w-4 h-4 mr-1" /> DPI
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/planning')}>
            <Calendar className="w-4 h-4 mr-1" /> Planning
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'En attente', value: patientsAttente.length, icon: Clock, color: 'text-warning' },
          { label: 'En consultation', value: patientsConsultation.length, icon: Stethoscope, color: 'text-primary' },
          { label: 'Hospitalisés', value: patientsHospitalises.length, icon: BedDouble, color: 'text-secondary' },
          { label: 'Urgents (P1-P2)', value: patientsUrgents.length, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Total service', value: myPatients.length, icon: Users, color: 'text-foreground' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`w-8 h-8 ${k.color}`} />
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="patients">Patients du service</TabsTrigger>
          <TabsTrigger value="protocols">Protocoles & Guides</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Service description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-5 h-5 text-primary" /> À propos du service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{protocols.description}</p>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Pathologies fréquentes :</p>
                  <div className="flex flex-wrap gap-1">
                    {protocols.commonPathologies.map(p => (
                      <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Équipements :</p>
                  <div className="flex flex-wrap gap-1">
                    {protocols.equipment.map(e => (
                      <Badge key={e} className="text-[10px] bg-muted text-muted-foreground">{e}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Urgency alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-5 h-5 text-destructive" /> Patients urgents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientsUrgents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun patient urgent actuellement</p>
                ) : (
                  <div className="space-y-2">
                    {patientsUrgents.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div>
                          <p className="text-sm font-medium">{p.prenom} {p.nom}</p>
                          <p className="text-xs text-muted-foreground">{p.pathologieActuelle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${urgenceColor(p.urgence)}`}>P{p.urgence}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => navigate('/dpi')}>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Patients en attente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-warning" /> Patients en attente ({patientsAttente.length})
              </CardTitle>
              <CardDescription>Patients en attente de consultation dans votre service</CardDescription>
            </CardHeader>
            <CardContent>
              {patientsAttente.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun patient en attente</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NHID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Âge/Sexe</TableHead>
                      <TableHead>Pathologie</TableHead>
                      <TableHead>Urgence</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsAttente.map(p => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/dpi')}>
                        <TableCell className="font-mono text-xs">{p.nhid}</TableCell>
                        <TableCell className="font-medium">{p.prenom} {p.nom}</TableCell>
                        <TableCell>{p.age}ans / {p.sexe}</TableCell>
                        <TableCell className="text-sm">{p.pathologieActuelle}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${urgenceColor(p.urgence)}`}>P{p.urgence}</Badge></TableCell>
                        <TableCell><Badge className={`text-[10px] ${statusLabel[p.statut]?.style}`}>{statusLabel[p.statut]?.label}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All patients in service */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-primary" /> Tous les patients – {serviceInfo?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun patient dans ce service actuellement</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NHID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Âge/Sexe</TableHead>
                      <TableHead>Pathologie</TableHead>
                      <TableHead>Urgence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Vitaux</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myPatients.map(p => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate('/dpi')}>
                        <TableCell className="font-mono text-xs">{p.nhid}</TableCell>
                        <TableCell className="font-medium">{p.prenom} {p.nom}</TableCell>
                        <TableCell>{p.age}ans / {p.sexe}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{p.pathologieActuelle}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${urgenceColor(p.urgence)}`}>P{p.urgence}</Badge></TableCell>
                        <TableCell><Badge className={`text-[10px] ${statusLabel[p.statut]?.style}`}>{statusLabel[p.statut]?.label}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.vitaux ? `${p.vitaux.tension} | ${p.vitaux.temperature}°C` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protocols */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardList className="w-5 h-5 text-primary" /> Protocoles de prise en charge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {protocols.protocols.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="text-sm">{p}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HeartPulse className="w-5 h-5 text-destructive" /> Situations d'urgence
                </CardTitle>
                <CardDescription>Situations nécessitant une intervention immédiate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {protocols.urgencyTypes.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      <span className="text-sm">{u}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EspaceMedecin;
