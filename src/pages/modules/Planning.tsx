import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import { Calendar, Clock, Users, UserPlus, ArrowRightLeft, Plus, Stethoscope, Scissors, CalendarDays, Send, Coffee, Moon, Shield, Heart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───
interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  service: string;
}

interface ScheduleSlot {
  id: string;
  doctorId: string;
  jour: string; // 'lundi' | 'mardi' ...
  heureDebut: string;
  heureFin: string;
  type: 'consultation' | 'operation' | 'garde';
  salle?: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  doctorId: string;
  date: string;
  heure: string;
  motif: string;
  statut: 'planifie' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  type: 'consultation' | 'operation' | 'suivi';
}

interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  fromDoctorId: string;
  toDoctorId: string;
  motif: string;
  date: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  notes?: string;
}

// ─── Staff (nurses + doctors for breaks/duties) ───
interface StaffMember {
  id: string;
  nom: string;
  role: 'medecin' | 'infirmier';
  service: string;
}

interface BreakRecord {
  id: string;
  staffId: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  type: 'dejeuner' | 'pause_courte' | 'pause_longue';
  statut: 'planifie' | 'en_cours' | 'termine';
}

interface DutyRecord {
  id: string;
  staffId: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  type: 'garde_jour' | 'garde_nuit' | 'permanence' | 'astreinte';
  service: string;
  statut: 'planifie' | 'en_cours' | 'termine';
  notes?: string;
}

// ─── Mock doctors ───
const DOCTORS: Doctor[] = [
  { id: 'doc1', nom: 'Dr. Ibrahim Moussa', specialite: 'Médecine Générale', service: 'general' },
  { id: 'doc2', nom: 'Dr. Hawa Brahim', specialite: 'Gynécologie', service: 'gyneco' },
  { id: 'doc3', nom: 'Dr. Ali Bichara', specialite: 'Cardiologie', service: 'cardio' },
  { id: 'doc4', nom: 'Dr. Abdelkrim Saleh', specialite: 'Neurologie', service: 'neuro' },
  { id: 'doc5', nom: 'Pr. Hassan Ali', specialite: 'Chirurgie Générale', service: 'chirurgie' },
  { id: 'doc6', nom: 'Dr. Moussa Fadil', specialite: 'Chirurgie Générale', service: 'chirurgie' },
  { id: 'doc7', nom: 'Dr. Abakar Saleh', specialite: 'Oncologie', service: 'onco' },
  { id: 'doc8', nom: 'Dr. Fadoul Mahamat', specialite: 'Pédiatrie', service: 'pediatrie' },
];

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ─── Initial mock data ───
const INITIAL_SCHEDULES: ScheduleSlot[] = [
  { id: 'sch1', doctorId: 'doc1', jour: 'Lundi', heureDebut: '08:00', heureFin: '12:00', type: 'consultation', salle: 'Cabinet 1' },
  { id: 'sch2', doctorId: 'doc1', jour: 'Mercredi', heureDebut: '08:00', heureFin: '12:00', type: 'consultation', salle: 'Cabinet 1' },
  { id: 'sch3', doctorId: 'doc1', jour: 'Vendredi', heureDebut: '14:00', heureFin: '17:00', type: 'consultation', salle: 'Cabinet 1' },
  { id: 'sch4', doctorId: 'doc2', jour: 'Mardi', heureDebut: '08:00', heureFin: '13:00', type: 'consultation', salle: 'Cabinet 3' },
  { id: 'sch5', doctorId: 'doc2', jour: 'Jeudi', heureDebut: '08:00', heureFin: '13:00', type: 'consultation', salle: 'Cabinet 3' },
  { id: 'sch6', doctorId: 'doc3', jour: 'Lundi', heureDebut: '09:00', heureFin: '12:00', type: 'consultation', salle: 'Cabinet 5' },
  { id: 'sch7', doctorId: 'doc3', jour: 'Jeudi', heureDebut: '09:00', heureFin: '12:00', type: 'consultation', salle: 'Cabinet 5' },
  { id: 'sch8', doctorId: 'doc5', jour: 'Mardi', heureDebut: '08:00', heureFin: '14:00', type: 'operation', salle: 'Bloc A' },
  { id: 'sch9', doctorId: 'doc5', jour: 'Vendredi', heureDebut: '08:00', heureFin: '14:00', type: 'operation', salle: 'Bloc B' },
  { id: 'sch10', doctorId: 'doc4', jour: 'Lundi', heureDebut: '14:00', heureFin: '17:00', type: 'consultation', salle: 'Cabinet 7' },
  { id: 'sch11', doctorId: 'doc4', jour: 'Mercredi', heureDebut: '08:00', heureFin: '12:00', type: 'consultation', salle: 'Cabinet 7' },
  { id: 'sch12', doctorId: 'doc1', jour: 'Samedi', heureDebut: '08:00', heureFin: '20:00', type: 'garde' },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'rdv1', patientId: '1', patientName: 'Abdoulaye Mahamat', nhid: 'TCD-2024-00001', doctorId: 'doc1', date: '2026-03-09', heure: '09:00', motif: 'Suivi paludisme sévère', statut: 'confirme', type: 'suivi' },
  { id: 'rdv2', patientId: '4', patientName: 'Idriss Hassan', nhid: 'TCD-2024-00004', doctorId: 'doc3', date: '2026-03-09', heure: '10:00', motif: 'Contrôle post-IDM', statut: 'planifie', type: 'suivi' },
  { id: 'rdv3', patientId: '5', patientName: 'Zara Fatimé', nhid: 'TCD-2024-00005', doctorId: 'doc5', date: '2026-03-10', heure: '08:00', motif: 'Ostéosynthèse tibia', statut: 'confirme', type: 'operation' },
  { id: 'rdv4', patientId: '7', patientName: 'Abakar Khadija', nhid: 'TCD-2024-00007', doctorId: 'doc1', date: '2026-03-09', heure: '10:30', motif: 'Diabète décompensé – bilan', statut: 'planifie', type: 'consultation' },
];

const INITIAL_REFERRALS: Referral[] = [
  { id: 'ref1', patientId: '1', patientName: 'Abdoulaye Mahamat', nhid: 'TCD-2024-00001', fromDoctorId: 'doc1', toDoctorId: 'doc3', motif: 'Bilan cardiaque suite paludisme sévère', date: '2026-03-08', statut: 'en_attente' },
];

const Planning = () => {
  const { patients } = usePatientJourney();

  const [schedules, setSchedules] = useState<ScheduleSlot[]>(INITIAL_SCHEDULES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Dialogs
  const [showNewApptDialog, setShowNewApptDialog] = useState(false);
  const [showNewScheduleDialog, setShowNewScheduleDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);

  // New appointment form
  const [apptPatientId, setApptPatientId] = useState('');
  const [apptDoctorId, setApptDoctorId] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptHeure, setApptHeure] = useState('');
  const [apptMotif, setApptMotif] = useState('');
  const [apptType, setApptType] = useState<'consultation' | 'operation' | 'suivi'>('consultation');

  // New schedule form
  const [schDoctorId, setSchDoctorId] = useState('');
  const [schJour, setSchJour] = useState('');
  const [schDebut, setSchDebut] = useState('');
  const [schFin, setSchFin] = useState('');
  const [schType, setSchType] = useState<'consultation' | 'operation' | 'garde'>('consultation');
  const [schSalle, setSchSalle] = useState('');

  // Referral form
  const [refPatientId, setRefPatientId] = useState('');
  const [refFromId, setRefFromId] = useState('');
  const [refToId, setRefToId] = useState('');
  const [refMotif, setRefMotif] = useState('');
  const [refNotes, setRefNotes] = useState('');

  // ─── Handlers ───
  const handleCreateAppointment = () => {
    const patient = patients.find(p => p.id === apptPatientId);
    if (!patient || !apptDoctorId || !apptDate || !apptHeure) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const newAppt: Appointment = {
      id: `rdv-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`,
      nhid: patient.nhid,
      doctorId: apptDoctorId,
      date: apptDate,
      heure: apptHeure,
      motif: apptMotif,
      statut: 'planifie',
      type: apptType,
    };
    setAppointments(prev => [...prev, newAppt]);
    setShowNewApptDialog(false);
    const doc = DOCTORS.find(d => d.id === apptDoctorId);
    toast.success(`Rendez-vous créé pour ${patient.prenom} ${patient.nom}`, {
      description: `${doc?.nom} – ${apptDate} à ${apptHeure}`,
    });
    setApptPatientId(''); setApptDoctorId(''); setApptDate(''); setApptHeure(''); setApptMotif(''); setApptType('consultation');
  };

  const handleCreateSchedule = () => {
    if (!schDoctorId || !schJour || !schDebut || !schFin) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    const slot: ScheduleSlot = {
      id: `sch-${Date.now()}`,
      doctorId: schDoctorId,
      jour: schJour,
      heureDebut: schDebut,
      heureFin: schFin,
      type: schType,
      salle: schSalle || undefined,
    };
    setSchedules(prev => [...prev, slot]);
    setShowNewScheduleDialog(false);
    const doc = DOCTORS.find(d => d.id === schDoctorId);
    toast.success(`Créneau ajouté pour ${doc?.nom}`, { description: `${schJour} ${schDebut}-${schFin}` });
    setSchDoctorId(''); setSchJour(''); setSchDebut(''); setSchFin(''); setSchType('consultation'); setSchSalle('');
  };

  const handleCreateReferral = () => {
    const patient = patients.find(p => p.id === refPatientId);
    if (!patient || !refFromId || !refToId || !refMotif) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (refFromId === refToId) {
      toast.error('Le médecin référent et le destinataire doivent être différents');
      return;
    }
    const ref: Referral = {
      id: `ref-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`,
      nhid: patient.nhid,
      fromDoctorId: refFromId,
      toDoctorId: refToId,
      motif: refMotif,
      date: new Date().toISOString().split('T')[0],
      statut: 'en_attente',
      notes: refNotes || undefined,
    };
    setReferrals(prev => [ref, ...prev]);
    setShowReferralDialog(false);
    const fromDoc = DOCTORS.find(d => d.id === refFromId);
    const toDoc = DOCTORS.find(d => d.id === refToId);
    toast.success(`Transfert demandé`, {
      description: `${patient.prenom} ${patient.nom}: ${fromDoc?.nom} → ${toDoc?.nom}`,
    });
    setRefPatientId(''); setRefFromId(''); setRefToId(''); setRefMotif(''); setRefNotes('');
  };

  const handleReferralAction = (refId: string, action: 'accepte' | 'refuse') => {
    setReferrals(prev => prev.map(r => r.id === refId ? { ...r, statut: action } : r));
    const ref = referrals.find(r => r.id === refId);
    if (action === 'accepte' && ref) {
      // Auto-create an appointment for the accepting doctor
      const newAppt: Appointment = {
        id: `rdv-ref-${Date.now()}`,
        patientId: ref.patientId,
        patientName: ref.patientName,
        nhid: ref.nhid,
        doctorId: ref.toDoctorId,
        date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        heure: '09:00',
        motif: `Référé: ${ref.motif}`,
        statut: 'planifie',
        type: 'consultation',
      };
      setAppointments(prev => [...prev, newAppt]);
      toast.success('Transfert accepté – Rendez-vous créé automatiquement');
    } else {
      toast.info('Transfert refusé');
    }
  };

  const handleApptStatusChange = (id: string, statut: Appointment['statut']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
    const labels: Record<string, string> = { confirme: 'Confirmé', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' };
    toast.success(`Rendez-vous ${labels[statut]}`);
  };

  // ─── Computed ───
  const filteredAppointments = useMemo(() => {
    let result = appointments;
    if (selectedDoctor !== 'all') result = result.filter(a => a.doctorId === selectedDoctor);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.patientName.toLowerCase().includes(q) || a.nhid.toLowerCase().includes(q) || a.motif.toLowerCase().includes(q));
    }
    return result.sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
  }, [appointments, selectedDoctor, search]);

  const doctorPatients = useMemo(() => {
    const map: Record<string, { patientId: string; patientName: string; nhid: string }[]> = {};
    appointments.forEach(a => {
      if (a.statut !== 'annule') {
        if (!map[a.doctorId]) map[a.doctorId] = [];
        if (!map[a.doctorId].find(p => p.patientId === a.patientId)) {
          map[a.doctorId].push({ patientId: a.patientId, patientName: a.patientName, nhid: a.nhid });
        }
      }
    });
    return map;
  }, [appointments]);

  const getApptStatusBadge = (statut: Appointment['statut']) => {
    const styles: Record<string, string> = {
      planifie: 'bg-muted text-muted-foreground',
      confirme: 'bg-primary/10 text-primary',
      en_cours: 'bg-destructive/10 text-destructive',
      termine: 'bg-secondary/10 text-secondary',
      annule: 'bg-muted text-muted-foreground line-through',
    };
    const labels: Record<string, string> = {
      planifie: '📅 Planifié', confirme: '✅ Confirmé', en_cours: '🔵 En cours', termine: '✔️ Terminé', annule: '❌ Annulé',
    };
    return <Badge className={`text-[10px] ${styles[statut]}`}>{labels[statut]}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return '🩺';
      case 'operation': return '🔪';
      case 'suivi': return '📋';
      case 'garde': return '🌙';
      default: return '📌';
    }
  };

  const getSlotTypeBadge = (type: ScheduleSlot['type']) => {
    const styles: Record<string, string> = {
      consultation: 'bg-primary/10 text-primary',
      operation: 'bg-destructive/10 text-destructive',
      garde: 'bg-accent text-accent-foreground',
    };
    return <Badge className={`text-[10px] ${styles[type]}`}>{getTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  // KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr && a.statut !== 'annule');
  const pendingReferrals = referrals.filter(r => r.statut === 'en_attente');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" /> Planning Médical
          </h1>
          <p className="text-muted-foreground text-sm">Gestion des rendez-vous, programmation des médecins et transferts de patients</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-1" onClick={() => setShowNewApptDialog(true)}>
            <Plus className="w-4 h-4" /> Rendez-vous
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowNewScheduleDialog(true)}>
            <Clock className="w-4 h-4" /> Créneau
          </Button>
          <Button size="sm" variant="secondary" className="gap-1" onClick={() => setShowReferralDialog(true)}>
            <ArrowRightLeft className="w-4 h-4" /> Transférer patient
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "RDV aujourd'hui", value: todayAppts.length, icon: Calendar, color: 'text-primary' },
          { label: 'Médecins actifs', value: DOCTORS.length, icon: Stethoscope, color: 'text-secondary' },
          { label: 'Transferts en attente', value: pendingReferrals.length, icon: ArrowRightLeft, color: 'text-destructive' },
          { label: 'Opérations programmées', value: appointments.filter(a => a.type === 'operation' && a.statut !== 'annule' && a.statut !== 'termine').length, icon: Scissors, color: 'text-accent-foreground' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={`w-6 h-6 ${k.color}`} />
              <div>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="rdv">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="rdv">📅 Rendez-vous ({appointments.filter(a => a.statut !== 'annule').length})</TabsTrigger>
          <TabsTrigger value="planning">🕐 Planning médecins</TabsTrigger>
          <TabsTrigger value="patients">👥 Patients assignés</TabsTrigger>
          <TabsTrigger value="transferts">🔄 Transferts ({pendingReferrals.length})</TabsTrigger>
        </TabsList>

        {/* ─── Rendez-vous Tab ─── */}
        <TabsContent value="rdv" className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="Rechercher patient, NHID, motif..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrer par médecin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les médecins</SelectItem>
                {DOCTORS.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Médecin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun rendez-vous trouvé</TableCell></TableRow>
                ) : filteredAppointments.map(a => {
                  const doc = DOCTORS.find(d => d.id === a.doctorId);
                  return (
                    <TableRow key={a.id} className={a.statut === 'annule' ? 'opacity-50' : ''}>
                      <TableCell className="text-sm font-medium">{a.date}</TableCell>
                      <TableCell className="text-sm">{a.heure}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                          <p className="text-[10px] text-muted-foreground">{a.nhid}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{doc?.nom}</TableCell>
                      <TableCell>{getTypeIcon(a.type)} <span className="text-xs">{a.type}</span></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{a.motif}</TableCell>
                      <TableCell>{getApptStatusBadge(a.statut)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {a.statut === 'planifie' && (
                            <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleApptStatusChange(a.id, 'confirme')}>Confirmer</Button>
                          )}
                          {a.statut === 'confirme' && (
                            <Button size="sm" className="text-[10px] h-7" onClick={() => handleApptStatusChange(a.id, 'en_cours')}>Démarrer</Button>
                          )}
                          {a.statut === 'en_cours' && (
                            <Button size="sm" variant="secondary" className="text-[10px] h-7" onClick={() => handleApptStatusChange(a.id, 'termine')}>Terminer</Button>
                          )}
                          {(a.statut === 'planifie' || a.statut === 'confirme') && (
                            <Button size="sm" variant="ghost" className="text-[10px] h-7 text-destructive" onClick={() => handleApptStatusChange(a.id, 'annule')}>Annuler</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── Planning médecins Tab ─── */}
        <TabsContent value="planning" className="space-y-4">
          {DOCTORS.map(doc => {
            const docSlots = schedules.filter(s => s.doctorId === doc.id);
            if (docSlots.length === 0) return null;
            return (
              <Card key={doc.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    {doc.nom}
                    <Badge variant="outline" className="text-[10px]">{doc.specialite}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {JOURS.map(jour => {
                      const slots = docSlots.filter(s => s.jour === jour);
                      return (
                        <div key={jour} className="text-center">
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">{jour.substring(0, 3)}</p>
                          {slots.length > 0 ? slots.map(s => (
                            <div key={s.id} className="mb-1 p-1.5 rounded bg-primary/5 border border-primary/10">
                              <p className="text-[10px] font-medium text-foreground">{s.heureDebut}-{s.heureFin}</p>
                              {getSlotTypeBadge(s.type)}
                              {s.salle && <p className="text-[9px] text-muted-foreground mt-0.5">{s.salle}</p>}
                            </div>
                          )) : (
                            <div className="p-1.5 rounded bg-muted/30 text-[10px] text-muted-foreground">—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── Patients assignés Tab ─── */}
        <TabsContent value="patients" className="space-y-4">
          {DOCTORS.map(doc => {
            const pts = doctorPatients[doc.id] || [];
            return (
              <Card key={doc.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    {doc.nom}
                    <Badge variant="outline" className="text-[10px]">{doc.specialite}</Badge>
                    <Badge className="text-[10px] bg-primary/10 text-primary">{pts.length} patients</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun patient assigné</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {pts.map(p => (
                        <Badge key={p.patientId} variant="outline" className="text-xs gap-1 py-1 px-2">
                          <UserPlus className="w-3 h-3" /> {p.patientName}
                          <span className="text-muted-foreground">({p.nhid})</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── Transferts Tab ─── */}
        <TabsContent value="transferts" className="space-y-4">
          {referrals.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun transfert enregistré</CardContent></Card>
          ) : referrals.map(ref => {
            const fromDoc = DOCTORS.find(d => d.id === ref.fromDoctorId);
            const toDoc = DOCTORS.find(d => d.id === ref.toDoctorId);
            return (
              <Card key={ref.id} className={`border-l-4 ${
                ref.statut === 'en_attente' ? 'border-l-primary' :
                ref.statut === 'accepte' ? 'border-l-secondary' : 'border-l-destructive'
              }`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-foreground">{ref.patientName} <span className="text-muted-foreground font-normal">({ref.nhid})</span></p>
                      <p className="text-sm text-foreground flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" /> {fromDoc?.nom}
                        <ArrowRightLeft className="w-3 h-3 text-primary mx-1" />
                        <Stethoscope className="w-3 h-3" /> {toDoc?.nom}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">📋 {ref.motif}</p>
                      {ref.notes && <p className="text-xs text-muted-foreground italic">💬 {ref.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">📅 {ref.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`text-[10px] ${
                        ref.statut === 'en_attente' ? 'bg-primary/10 text-primary' :
                        ref.statut === 'accepte' ? 'bg-secondary/10 text-secondary' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {ref.statut === 'en_attente' ? '⏳ En attente' : ref.statut === 'accepte' ? '✅ Accepté' : '❌ Refusé'}
                      </Badge>
                      {ref.statut === 'en_attente' && (
                        <div className="flex gap-1">
                          <Button size="sm" className="text-[10px] h-7 gap-1" onClick={() => handleReferralAction(ref.id, 'accepte')}>
                            ✅ Accepter
                          </Button>
                          <Button size="sm" variant="ghost" className="text-[10px] h-7 text-destructive" onClick={() => handleReferralAction(ref.id, 'refuse')}>
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* ─── New Appointment Dialog ─── */}
      <Dialog open={showNewApptDialog} onOpenChange={setShowNewApptDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouveau rendez-vous</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Patient *</label>
              <Select value={apptPatientId} onValueChange={setApptPatientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom} – {p.nhid}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Médecin *</label>
              <Select value={apptDoctorId} onValueChange={setApptDoctorId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un médecin" /></SelectTrigger>
                <SelectContent>
                  {DOCTORS.map(d => <SelectItem key={d.id} value={d.id}>{d.nom} – {d.specialite}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date *</label>
                <Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Heure *</label>
                <Input type="time" value={apptHeure} onChange={e => setApptHeure(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={apptType} onValueChange={v => setApptType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">🩺 Consultation</SelectItem>
                  <SelectItem value="operation">🔪 Opération</SelectItem>
                  <SelectItem value="suivi">📋 Suivi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Motif</label>
              <Textarea value={apptMotif} onChange={e => setApptMotif(e.target.value)} placeholder="Motif du rendez-vous..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewApptDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateAppointment}>Créer le rendez-vous</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── New Schedule Dialog ─── */}
      <Dialog open={showNewScheduleDialog} onOpenChange={setShowNewScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter un créneau</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Médecin *</label>
              <Select value={schDoctorId} onValueChange={setSchDoctorId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {DOCTORS.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Jour *</label>
              <Select value={schJour} onValueChange={setSchJour}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {JOURS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Début *</label>
                <Input type="time" value={schDebut} onChange={e => setSchDebut(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fin *</label>
                <Input type="time" value={schFin} onChange={e => setSchFin(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={schType} onValueChange={v => setSchType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">🩺 Consultation</SelectItem>
                  <SelectItem value="operation">🔪 Opération</SelectItem>
                  <SelectItem value="garde">🌙 Garde</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Salle / Cabinet</label>
              <Input value={schSalle} onChange={e => setSchSalle(e.target.value)} placeholder="Ex: Cabinet 1, Bloc A..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewScheduleDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateSchedule}>Ajouter le créneau</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Referral Dialog ─── */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Transférer / Recommander un patient</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Patient *</label>
              <Select value={refPatientId} onValueChange={setRefPatientId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.prenom} {p.nom} – {p.nhid}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Médecin référent *</label>
              <Select value={refFromId} onValueChange={setRefFromId}>
                <SelectTrigger><SelectValue placeholder="Qui réfère ?" /></SelectTrigger>
                <SelectContent>
                  {DOCTORS.map(d => <SelectItem key={d.id} value={d.id}>{d.nom} – {d.specialite}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Médecin destinataire *</label>
              <Select value={refToId} onValueChange={setRefToId}>
                <SelectTrigger><SelectValue placeholder="Vers quel médecin ?" /></SelectTrigger>
                <SelectContent>
                  {DOCTORS.filter(d => d.id !== refFromId).map(d => <SelectItem key={d.id} value={d.id}>{d.nom} – {d.specialite}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Motif du transfert *</label>
              <Textarea value={refMotif} onChange={e => setRefMotif(e.target.value)} placeholder="Pourquoi ce transfert ?" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes supplémentaires</label>
              <Textarea value={refNotes} onChange={e => setRefNotes(e.target.value)} placeholder="Instructions, résultats à transmettre..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReferralDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateReferral} className="gap-1">
              <Send className="w-4 h-4" /> Envoyer le transfert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planning;
