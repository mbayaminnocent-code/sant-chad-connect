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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanning, DOCTORS, JOURS, SERVICES_MAP, ALL_STAFF, type Appointment, type BreakRecord, type DutyRecord, type ScheduleSlot, type DutyExchange } from '@/contexts/PlanningContext';
import { Calendar, Clock, Users, UserPlus, ArrowRightLeft, Plus, Stethoscope, Scissors, CalendarDays, Send, Coffee, Moon, Shield, Heart, Trash2, Lock, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, getDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const Planning = () => {
  const { patients } = usePatientJourney();
  const { role, doctorProfile } = useAuth();
  const {
    schedules, setSchedules,
    appointments, setAppointments,
    referrals, setReferrals,
    breaks, setBreaks,
    duties, setDuties,
    dutyExchanges, requestDutyExchange, respondToExchange, validateExchange,
    addMedicalNotification,
  } = usePlanning();

  const isDoctor = role === 'doctor';
  const isChefDeService = doctorProfile?.isChefDeService || false;
  const canEditPlanning = !isDoctor || isChefDeService;
  const myDoctorId = doctorProfile?.doctorId || '';
  const myService = doctorProfile?.service || '';

  const [selectedDoctor, setSelectedDoctor] = useState<string>(isDoctor && !isChefDeService ? myDoctorId : 'all');
  const [search, setSearch] = useState('');

  // Dialogs
  const [showNewApptDialog, setShowNewApptDialog] = useState(false);
  const [showNewScheduleDialog, setShowNewScheduleDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const [showDutyDialog, setShowDutyDialog] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)); // March 2026

  // Break form
  const [brkStaffId, setBrkStaffId] = useState('');
  const [brkJour, setBrkJour] = useState('');
  const [brkDebut, setBrkDebut] = useState('');
  const [brkFin, setBrkFin] = useState('');
  const [brkType, setBrkType] = useState<BreakRecord['type']>('dejeuner');

  // Duty form
  const [dutyStaffId, setDutyStaffId] = useState('');
  const [dutyDate, setDutyDate] = useState('');
  const [dutyDebut, setDutyDebut] = useState('');
  const [dutyFin, setDutyFin] = useState('');
  const [dutyType, setDutyType] = useState<DutyRecord['type']>('garde_jour');
  const [dutyService, setDutyService] = useState('');
  const [dutyNotes, setDutyNotes] = useState('');

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
    // Send notification to the doctor
    addMedicalNotification({
      targetDoctorId: apptDoctorId,
      type: 'rdv',
      message: `Nouveau rendez-vous ${apptType}`,
      detail: `${patient.prenom} ${patient.nom} – ${apptMotif} le ${apptDate} à ${apptHeure}`,
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
    const ref = {
      id: `ref-${Date.now()}`,
      patientId: patient.id,
      patientName: `${patient.prenom} ${patient.nom}`,
      nhid: patient.nhid,
      fromDoctorId: refFromId,
      toDoctorId: refToId,
      motif: refMotif,
      date: new Date().toISOString().split('T')[0],
      statut: 'en_attente' as const,
      notes: refNotes || undefined,
    };
    setReferrals(prev => [ref, ...prev]);
    setShowReferralDialog(false);
    const fromDoc = DOCTORS.find(d => d.id === refFromId);
    const toDoc = DOCTORS.find(d => d.id === refToId);
    toast.success(`Transfert demandé`, {
      description: `${patient.prenom} ${patient.nom}: ${fromDoc?.nom} → ${toDoc?.nom}`,
    });
    // Send notification to the target doctor
    addMedicalNotification({
      targetDoctorId: refToId,
      type: 'transfert',
      message: `Nouveau transfert de patient`,
      detail: `${patient.prenom} ${patient.nom} référé par ${fromDoc?.nom} – ${refMotif}`,
    });
    setRefPatientId(''); setRefFromId(''); setRefToId(''); setRefMotif(''); setRefNotes('');
  };

  const handleReferralAction = (refId: string, action: 'accepte' | 'refuse') => {
    setReferrals(prev => prev.map(r => r.id === refId ? { ...r, statut: action } : r));
    const ref = referrals.find(r => r.id === refId);
    if (action === 'accepte' && ref) {
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
      // Notify the referring doctor
      addMedicalNotification({
        targetDoctorId: ref.fromDoctorId,
        type: 'info',
        message: `Transfert accepté`,
        detail: `${ref.patientName} accepté par ${DOCTORS.find(d => d.id === ref.toDoctorId)?.nom}`,
      });
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

  const handleCreateBreak = () => {
    if (!brkStaffId || !brkJour || !brkDebut || !brkFin) {
      toast.error('Veuillez remplir tous les champs'); return;
    }
    const newBrk: BreakRecord = {
      id: `brk-${Date.now()}`, staffId: brkStaffId, jour: brkJour,
      heureDebut: brkDebut, heureFin: brkFin, type: brkType, statut: 'planifie',
    };
    setBreaks(prev => [...prev, newBrk]);
    setShowBreakDialog(false);
    const staff = ALL_STAFF.find(s => s.id === brkStaffId);
    toast.success(`Pause ajoutée pour ${staff?.nom}`, { description: `${brkJour} ${brkDebut}-${brkFin}` });
    setBrkStaffId(''); setBrkJour(''); setBrkDebut(''); setBrkFin(''); setBrkType('dejeuner');
  };

  const handleCreateDuty = () => {
    if (!dutyStaffId || !dutyDate || !dutyDebut || !dutyFin || !dutyService) {
      toast.error('Veuillez remplir tous les champs obligatoires'); return;
    }
    const newDuty: DutyRecord = {
      id: `grd-${Date.now()}`, staffId: dutyStaffId, date: dutyDate,
      heureDebut: dutyDebut, heureFin: dutyFin, type: dutyType,
      service: dutyService, statut: 'planifie', notes: dutyNotes || undefined,
    };
    setDuties(prev => [...prev, newDuty]);
    setShowDutyDialog(false);
    const staff = ALL_STAFF.find(s => s.id === dutyStaffId);
    toast.success(`Garde/permanence ajoutée pour ${staff?.nom}`, { description: `${dutyDate} ${dutyDebut}-${dutyFin}` });
    // Notify if it's a doctor
    if (dutyStaffId.startsWith('doc')) {
      addMedicalNotification({
        targetDoctorId: dutyStaffId,
        type: 'garde',
        message: `Nouvelle garde programmée`,
        detail: `${dutyType === 'garde_jour' ? 'Garde jour' : dutyType === 'garde_nuit' ? 'Garde nuit' : dutyType === 'permanence' ? 'Permanence' : 'Astreinte'} – ${dutyService} le ${dutyDate}`,
      });
    }
    setDutyStaffId(''); setDutyDate(''); setDutyDebut(''); setDutyFin(''); setDutyType('garde_jour'); setDutyService(''); setDutyNotes('');
  };

  const handleDeleteBreak = (id: string) => {
    setBreaks(prev => prev.filter(b => b.id !== id));
    toast.success('Pause supprimée');
  };

  const handleDeleteDuty = (id: string) => {
    setDuties(prev => prev.filter(d => d.id !== id));
    toast.success('Garde supprimée');
  };

  const handleDutyStatusChange = (id: string, statut: DutyRecord['statut']) => {
    setDuties(prev => prev.map(d => d.id === id ? { ...d, statut } : d));
    const labels: Record<string, string> = { planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé' };
    toast.success(`Garde ${labels[statut]}`);
  };

  const getBreakTypeLabel = (type: BreakRecord['type']) => {
    const m: Record<string, { label: string; icon: string; style: string }> = {
      dejeuner: { label: 'Déjeuner', icon: '🍽️', style: 'bg-accent text-accent-foreground' },
      pause_courte: { label: 'Pause courte', icon: '☕', style: 'bg-muted text-muted-foreground' },
      pause_longue: { label: 'Pause longue', icon: '🛋️', style: 'bg-primary/10 text-primary' },
    };
    const t = m[type];
    return <Badge className={`text-[10px] ${t.style}`}>{t.icon} {t.label}</Badge>;
  };

  const getDutyTypeLabel = (type: DutyRecord['type']) => {
    const m: Record<string, { label: string; icon: string; style: string }> = {
      garde_jour: { label: 'Garde jour', icon: '☀️', style: 'bg-primary/10 text-primary' },
      garde_nuit: { label: 'Garde nuit', icon: '🌙', style: 'bg-secondary/80 text-secondary-foreground' },
      permanence: { label: 'Permanence', icon: '🏥', style: 'bg-accent text-accent-foreground' },
      astreinte: { label: 'Astreinte', icon: '📱', style: 'bg-muted text-muted-foreground' },
    };
    const t = m[type];
    return <Badge className={`text-[10px] ${t.style}`}>{t.icon} {t.label}</Badge>;
  };

  const filteredAppointments = useMemo(() => {
    let result = appointments;
    if (isDoctor && !isChefDeService) {
      result = result.filter(a => a.doctorId === myDoctorId);
    } else if (isDoctor && isChefDeService) {
      const serviceDoctorIds = DOCTORS.filter(d => d.service === myService).map(d => d.id);
      if (selectedDoctor !== 'all') result = result.filter(a => a.doctorId === selectedDoctor);
      else result = result.filter(a => serviceDoctorIds.includes(a.doctorId));
    } else {
      if (selectedDoctor !== 'all') result = result.filter(a => a.doctorId === selectedDoctor);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a => a.patientName.toLowerCase().includes(q) || a.nhid.toLowerCase().includes(q) || a.motif.toLowerCase().includes(q));
    }
    return result.sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
  }, [appointments, selectedDoctor, search, isDoctor, isChefDeService, myDoctorId, myService]);

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

  // ─── Calendar helpers ───
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDutiesForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return duties.filter(d => d.date === dateStr);
  };

  const getDutyColor = (type: DutyRecord['type']) => {
    switch (type) {
      case 'garde_jour': return 'bg-primary/20 text-primary border-primary/30';
      case 'garde_nuit': return 'bg-secondary/20 text-secondary-foreground border-secondary/30';
      case 'permanence': return 'bg-accent text-accent-foreground border-accent';
      case 'astreinte': return 'bg-muted text-muted-foreground border-muted-foreground/30';
    }
  };

  // KPIs
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr && a.statut !== 'annule');
  const pendingReferrals = referrals.filter(r => r.statut === 'en_attente');

  // First day offset for calendar grid
  const firstDayOffset = (getDay(startOfMonth(currentMonth)) + 6) % 7; // Monday = 0

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
        <div className="flex gap-2 flex-wrap items-center">
          {isDoctor && !isChefDeService && (
            <Badge variant="outline" className="gap-1 text-xs"><Lock className="w-3 h-3" /> Lecture seule</Badge>
          )}
          {isDoctor && isChefDeService && (
            <Badge className="bg-primary/10 text-primary text-xs gap-1">👑 Chef de Service – {SERVICES_MAP[myService] || myService}</Badge>
          )}
          {canEditPlanning && (
            <>
              <Button size="sm" className="gap-1" onClick={() => setShowNewApptDialog(true)}>
                <Plus className="w-4 h-4" /> Rendez-vous
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowNewScheduleDialog(true)}>
                <Clock className="w-4 h-4" /> Créneau
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowBreakDialog(true)}>
                <Coffee className="w-4 h-4" /> Pause
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowDutyDialog(true)}>
                <Moon className="w-4 h-4" /> Garde
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" className="gap-1" onClick={() => setShowReferralDialog(true)}>
            <ArrowRightLeft className="w-4 h-4" /> Transférer
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowExchangeDialog(true)}>
            <Repeat className="w-4 h-4" /> Échanger garde
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "RDV aujourd'hui", value: todayAppts.length, icon: Calendar, color: 'text-primary' },
          { label: 'Personnel total', value: ALL_STAFF.length, icon: Users, color: 'text-secondary' },
          { label: 'Gardes actives', value: duties.filter(d => d.statut === 'planifie' || d.statut === 'en_cours').length, icon: Shield, color: 'text-destructive' },
          { label: 'Transferts en attente', value: pendingReferrals.length, icon: ArrowRightLeft, color: 'text-accent-foreground' },
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
        <TabsList className="bg-muted/60 flex-wrap h-auto">
          <TabsTrigger value="rdv">📅 Rendez-vous ({appointments.filter(a => a.statut !== 'annule').length})</TabsTrigger>
          <TabsTrigger value="planning">🕐 Planning</TabsTrigger>
          <TabsTrigger value="calendrier">📆 Calendrier</TabsTrigger>
          <TabsTrigger value="pauses">☕ Pauses ({breaks.length})</TabsTrigger>
          <TabsTrigger value="gardes">🛡️ Gardes ({duties.length})</TabsTrigger>
          <TabsTrigger value="echanges">🔄 Échanges ({dutyExchanges.filter(e => e.statut !== 'valide' && e.statut !== 'refuse').length})</TabsTrigger>
          <TabsTrigger value="patients">👥 Patients</TabsTrigger>
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

        {/* ─── Calendrier mensuel Tab ─── */}
        <TabsContent value="calendrier" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-lg capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                  <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] rounded bg-muted/20" />
                ))}
                {calendarDays.map(day => {
                  const dayDuties = getDutiesForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <Popover key={day.toISOString()}>
                      <PopoverTrigger asChild>
                        <button className={`min-h-[80px] rounded border p-1 text-left transition-colors hover:bg-accent/50 ${
                          isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'
                        } ${dayDuties.length > 0 ? 'cursor-pointer' : ''}`}>
                          <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {format(day, 'd')}
                          </p>
                          <div className="space-y-0.5">
                            {dayDuties.slice(0, 3).map(d => {
                              const staff = ALL_STAFF.find(s => s.id === d.staffId);
                              return (
                                <div key={d.id} className={`text-[9px] px-1 py-0.5 rounded border ${getDutyColor(d.type)} truncate`}>
                                  {d.type === 'garde_jour' ? '☀️' : d.type === 'garde_nuit' ? '🌙' : d.type === 'permanence' ? '🏥' : '📱'}
                                  {' '}{staff?.nom?.split(' ').pop()}
                                </div>
                              );
                            })}
                            {dayDuties.length > 3 && (
                              <p className="text-[9px] text-muted-foreground text-center">+{dayDuties.length - 3} autres</p>
                            )}
                          </div>
                        </button>
                      </PopoverTrigger>
                      {dayDuties.length > 0 && (
                        <PopoverContent className="w-72" align="start">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">{format(day, 'EEEE d MMMM', { locale: fr })}</p>
                            {dayDuties.map(d => {
                              const staff = ALL_STAFF.find(s => s.id === d.staffId);
                              return (
                                <div key={d.id} className="p-2 rounded bg-muted/50 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-foreground">{staff?.nom}</span>
                                    {getDutyTypeLabel(d.type)}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">
                                    {d.heureDebut} – {d.heureFin} • {d.service}
                                  </p>
                                  <Badge className={`text-[9px] ${
                                    d.statut === 'planifie' ? 'bg-muted text-muted-foreground' :
                                    d.statut === 'en_cours' ? 'bg-primary/10 text-primary' :
                                    'bg-secondary/10 text-secondary'
                                  }`}>
                                    {d.statut === 'planifie' ? '📅 Planifié' : d.statut === 'en_cours' ? '🔵 En cours' : '✔️ Terminé'}
                                  </Badge>
                                  {d.notes && <p className="text-[10px] text-muted-foreground italic">📝 {d.notes}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      )}
                    </Popover>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                {[
                  { icon: '☀️', label: 'Garde jour', style: 'bg-primary/20' },
                  { icon: '🌙', label: 'Garde nuit', style: 'bg-secondary/20' },
                  { icon: '🏥', label: 'Permanence', style: 'bg-accent' },
                  { icon: '📱', label: 'Astreinte', style: 'bg-muted' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded ${l.style}`} />
                    <span className="text-[10px] text-muted-foreground">{l.icon} {l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

        {/* ─── Pauses Tab ─── */}
        <TabsContent value="pauses" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gestion des heures de pause pour médecins et infirmiers</p>
            <Button size="sm" className="gap-1" onClick={() => setShowBreakDialog(true)}>
              <Plus className="w-4 h-4" /> Ajouter une pause
            </Button>
          </div>

          {JOURS.map(jour => {
            const jourBreaks = breaks.filter(b => b.jour === jour);
            if (jourBreaks.length === 0) return null;
            return (
              <Card key={jour}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-primary" /> {jour}
                    <Badge variant="outline" className="text-[10px]">{jourBreaks.length} pauses</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personnel</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Horaire</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jourBreaks.map(brk => {
                        const staff = ALL_STAFF.find(s => s.id === brk.staffId);
                        return (
                          <TableRow key={brk.id}>
                            <TableCell className="text-sm font-medium">{staff?.nom || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {staff?.role === 'medecin' ? '🩺 Médecin' : '💉 Infirmier'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{brk.heureDebut} – {brk.heureFin}</TableCell>
                            <TableCell>{getBreakTypeLabel(brk.type)}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteBreak(brk.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
          {breaks.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune pause programmée</CardContent></Card>
          )}
        </TabsContent>

        {/* ─── Gardes & Permanences Tab ─── */}
        <TabsContent value="gardes" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Gardes de jour/nuit, permanences et astreintes</p>
            <Button size="sm" className="gap-1" onClick={() => setShowDutyDialog(true)}>
              <Plus className="w-4 h-4" /> Ajouter une garde
            </Button>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Personnel</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Horaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duties.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune garde programmée</TableCell></TableRow>
                ) : [...duties].sort((a, b) => a.date.localeCompare(b.date)).map(duty => {
                  const staff = ALL_STAFF.find(s => s.id === duty.staffId);
                  return (
                    <TableRow key={duty.id} className={duty.statut === 'termine' ? 'opacity-50' : ''}>
                      <TableCell className="text-sm font-medium">{duty.date}</TableCell>
                      <TableCell className="text-sm font-medium">{staff?.nom || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {staff?.role === 'medecin' ? '🩺 Médecin' : '💉 Infirmier'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{duty.heureDebut} – {duty.heureFin}</TableCell>
                      <TableCell>{getDutyTypeLabel(duty.type)}</TableCell>
                      <TableCell className="text-sm">{duty.service}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${
                          duty.statut === 'planifie' ? 'bg-muted text-muted-foreground' :
                          duty.statut === 'en_cours' ? 'bg-primary/10 text-primary' :
                          'bg-secondary/10 text-secondary'
                        }`}>
                          {duty.statut === 'planifie' ? '📅 Planifié' : duty.statut === 'en_cours' ? '🔵 En cours' : '✔️ Terminé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {duty.statut === 'planifie' && (
                            <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleDutyStatusChange(duty.id, 'en_cours')}>Démarrer</Button>
                          )}
                          {duty.statut === 'en_cours' && (
                            <Button size="sm" variant="secondary" className="text-[10px] h-7" onClick={() => handleDutyStatusChange(duty.id, 'termine')}>Terminer</Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteDuty(duty.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {duties.some(d => d.notes) && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">📝 Notes sur les gardes</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {duties.filter(d => d.notes).map(d => {
                  const staff = ALL_STAFF.find(s => s.id === d.staffId);
                  return (
                    <p key={d.id} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{staff?.nom}</span> ({d.date}): {d.notes}
                    </p>
                  );
                })}
              </CardContent>
            </Card>
          )}
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

      {/* ─── Break Dialog ─── */}
      <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter une pause</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Personnel *</label>
              <Select value={brkStaffId} onValueChange={setBrkStaffId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {ALL_STAFF.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.role === 'medecin' ? '🩺' : '💉'} {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Jour *</label>
              <Select value={brkJour} onValueChange={setBrkJour}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {JOURS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Début *</label>
                <Input type="time" value={brkDebut} onChange={e => setBrkDebut(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fin *</label>
                <Input type="time" value={brkFin} onChange={e => setBrkFin(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type de pause</label>
              <Select value={brkType} onValueChange={v => setBrkType(v as BreakRecord['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dejeuner">🍽️ Déjeuner</SelectItem>
                  <SelectItem value="pause_courte">☕ Pause courte (15 min)</SelectItem>
                  <SelectItem value="pause_longue">🛋️ Pause longue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBreakDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateBreak}>Ajouter la pause</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Duty Dialog ─── */}
      <Dialog open={showDutyDialog} onOpenChange={setShowDutyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter une garde / permanence</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Personnel *</label>
              <Select value={dutyStaffId} onValueChange={setDutyStaffId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {ALL_STAFF.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.role === 'medecin' ? '🩺' : '💉'} {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date *</label>
              <Input type="date" value={dutyDate} onChange={e => setDutyDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Début *</label>
                <Input type="time" value={dutyDebut} onChange={e => setDutyDebut(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Fin *</label>
                <Input type="time" value={dutyFin} onChange={e => setDutyFin(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type *</label>
              <Select value={dutyType} onValueChange={v => setDutyType(v as DutyRecord['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="garde_jour">☀️ Garde de jour</SelectItem>
                  <SelectItem value="garde_nuit">🌙 Garde de nuit</SelectItem>
                  <SelectItem value="permanence">🏥 Permanence</SelectItem>
                  <SelectItem value="astreinte">📱 Astreinte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Service *</label>
              <Input value={dutyService} onChange={e => setDutyService(e.target.value)} placeholder="Ex: Cardiologie, Urgences..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea value={dutyNotes} onChange={e => setDutyNotes(e.target.value)} placeholder="Instructions particulières..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDutyDialog(false)}>Annuler</Button>
            <Button onClick={handleCreateDuty}>Ajouter la garde</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planning;
