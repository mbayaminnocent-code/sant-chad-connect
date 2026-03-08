import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

// ─── Types ───
export interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  service: string;
}

export interface ScheduleSlot {
  id: string;
  doctorId: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  type: 'consultation' | 'operation' | 'garde';
  salle?: string;
}

export interface Appointment {
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

export interface Referral {
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

export interface StaffMember {
  id: string;
  nom: string;
  role: 'medecin' | 'infirmier';
  service: string;
}

export interface BreakRecord {
  id: string;
  staffId: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  type: 'dejeuner' | 'pause_courte' | 'pause_longue';
  statut: 'planifie' | 'en_cours' | 'termine';
}

export interface DutyRecord {
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

export interface MedicalNotification {
  id: string;
  targetDoctorId: string;
  type: 'transfert' | 'rdv' | 'garde' | 'echange' | 'info';
  message: string;
  detail?: string;
  timestamp: Date;
  read: boolean;
}

export interface DutyExchange {
  id: string;
  requesterId: string;       // staff who wants to swap
  requesterDutyId: string;   // their duty
  targetId: string;          // staff they want to swap with
  targetDutyId: string;      // the other person's duty
  motif: string;
  date: string;
  statut: 'en_attente_cible' | 'accepte_cible' | 'en_attente_chef' | 'valide' | 'refuse';
  notes?: string;
}

// ─── Constants ───
export const DOCTORS: Doctor[] = [
  { id: 'doc1', nom: 'Dr. Ibrahim Moussa', specialite: 'Médecine Générale', service: 'general' },
  { id: 'doc2', nom: 'Dr. Hawa Brahim', specialite: 'Gynécologie', service: 'gyneco' },
  { id: 'doc3', nom: 'Dr. Ali Bichara', specialite: 'Cardiologie', service: 'cardio' },
  { id: 'doc4', nom: 'Dr. Abdelkrim Saleh', specialite: 'Neurologie', service: 'neuro' },
  { id: 'doc5', nom: 'Pr. Hassan Ali', specialite: 'Chirurgie Générale', service: 'chirurgie' },
  { id: 'doc6', nom: 'Dr. Moussa Fadil', specialite: 'Chirurgie Générale', service: 'chirurgie' },
  { id: 'doc7', nom: 'Dr. Abakar Saleh', specialite: 'Oncologie', service: 'onco' },
  { id: 'doc8', nom: 'Dr. Fadoul Mahamat', specialite: 'Pédiatrie', service: 'pediatrie' },
];

export const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const SERVICES_MAP: Record<string, string> = {
  general: 'Médecine Générale', cardio: 'Cardiologie', chirurgie: 'Chirurgie', gyneco: 'Gynécologie',
  pediatrie: 'Pédiatrie', neuro: 'Neurologie', ortho: 'Orthopédie', pneumo: 'Pneumologie',
  onco: 'Oncologie', reanimation: 'Réanimation', interne: 'Médecine Interne',
  ophtalmo: 'Ophtalmologie', uro: 'Urologie', dermato: 'Dermatologie', maternite: 'Maternité',
};

export const NURSES: StaffMember[] = [
  { id: 'inf1', nom: 'Fatima Ali', role: 'infirmier', service: 'general' },
  { id: 'inf2', nom: 'Amina Moussa', role: 'infirmier', service: 'cardio' },
  { id: 'inf3', nom: 'Haoua Brahim', role: 'infirmier', service: 'pediatrie' },
  { id: 'inf4', nom: 'Zara Idriss', role: 'infirmier', service: 'chirurgie' },
  { id: 'inf5', nom: 'Khadija Oumar', role: 'infirmier', service: 'gyneco' },
  { id: 'inf6', nom: 'Moussa Adam', role: 'infirmier', service: 'reanimation' },
];

export const ALL_STAFF: StaffMember[] = [
  ...DOCTORS.map(d => ({ id: d.id, nom: d.nom, role: 'medecin' as const, service: d.service })),
  ...NURSES,
];

// ─── Initial data ───
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

const INITIAL_BREAKS: BreakRecord[] = [
  { id: 'brk1', staffId: 'doc1', jour: 'Lundi', heureDebut: '12:00', heureFin: '13:00', type: 'dejeuner', statut: 'planifie' },
  { id: 'brk2', staffId: 'doc3', jour: 'Lundi', heureDebut: '12:00', heureFin: '13:00', type: 'dejeuner', statut: 'planifie' },
  { id: 'brk3', staffId: 'inf1', jour: 'Lundi', heureDebut: '12:30', heureFin: '13:30', type: 'dejeuner', statut: 'planifie' },
  { id: 'brk4', staffId: 'inf2', jour: 'Mardi', heureDebut: '10:00', heureFin: '10:15', type: 'pause_courte', statut: 'planifie' },
  { id: 'brk5', staffId: 'inf3', jour: 'Mercredi', heureDebut: '12:00', heureFin: '13:00', type: 'dejeuner', statut: 'planifie' },
  { id: 'brk6', staffId: 'doc5', jour: 'Mardi', heureDebut: '14:00', heureFin: '14:30', type: 'pause_longue', statut: 'planifie' },
];

const INITIAL_DUTIES: DutyRecord[] = [
  { id: 'grd1', staffId: 'doc1', date: '2026-03-08', heureDebut: '08:00', heureFin: '20:00', type: 'garde_jour', service: 'Médecine Générale', statut: 'termine' },
  { id: 'grd2', staffId: 'doc3', date: '2026-03-08', heureDebut: '20:00', heureFin: '08:00', type: 'garde_nuit', service: 'Cardiologie', statut: 'termine' },
  { id: 'grd3', staffId: 'inf1', date: '2026-03-09', heureDebut: '08:00', heureFin: '20:00', type: 'permanence', service: 'Médecine Générale', statut: 'planifie' },
  { id: 'grd4', staffId: 'inf2', date: '2026-03-09', heureDebut: '20:00', heureFin: '08:00', type: 'garde_nuit', service: 'Cardiologie', statut: 'planifie' },
  { id: 'grd5', staffId: 'doc4', date: '2026-03-10', heureDebut: '20:00', heureFin: '08:00', type: 'astreinte', service: 'Neurologie', statut: 'planifie', notes: 'Joignable par téléphone' },
  { id: 'grd6', staffId: 'inf4', date: '2026-03-10', heureDebut: '08:00', heureFin: '20:00', type: 'garde_jour', service: 'Chirurgie', statut: 'planifie' },
  { id: 'grd7', staffId: 'doc5', date: '2026-03-11', heureDebut: '08:00', heureFin: '20:00', type: 'garde_jour', service: 'Chirurgie', statut: 'planifie' },
  { id: 'grd8', staffId: 'inf6', date: '2026-03-09', heureDebut: '20:00', heureFin: '08:00', type: 'garde_nuit', service: 'Réanimation', statut: 'planifie' },
];

// ─── Context ───
interface PlanningContextType {
  schedules: ScheduleSlot[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleSlot[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  referrals: Referral[];
  setReferrals: React.Dispatch<React.SetStateAction<Referral[]>>;
  breaks: BreakRecord[];
  setBreaks: React.Dispatch<React.SetStateAction<BreakRecord[]>>;
  duties: DutyRecord[];
  setDuties: React.Dispatch<React.SetStateAction<DutyRecord[]>>;
  dutyExchanges: DutyExchange[];
  requestDutyExchange: (exchange: Omit<DutyExchange, 'id' | 'date' | 'statut'>) => void;
  respondToExchange: (exchangeId: string, accept: boolean) => void;
  validateExchange: (exchangeId: string, approve: boolean) => void;
  medicalNotifications: MedicalNotification[];
  addMedicalNotification: (n: Omit<MedicalNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (doctorId: string) => void;
  getNotificationsForDoctor: (doctorId: string) => MedicalNotification[];
  isDoctorScheduledForBloc: (doctorId: string) => boolean;
}

const PlanningContext = createContext<PlanningContextType | null>(null);

export const usePlanning = () => {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanning must be used within PlanningProvider');
  return ctx;
};

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(INITIAL_SCHEDULES);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [breaks, setBreaks] = useState<BreakRecord[]>(INITIAL_BREAKS);
  const [duties, setDuties] = useState<DutyRecord[]>(INITIAL_DUTIES);
  const [medicalNotifications, setMedicalNotifications] = useState<MedicalNotification[]>([
    {
      id: 'notif-init-1',
      targetDoctorId: 'doc3',
      type: 'transfert',
      message: 'Nouveau transfert de patient',
      detail: 'Abdoulaye Mahamat référé par Dr. Ibrahim Moussa pour bilan cardiaque',
      timestamp: new Date('2026-03-08T08:30:00'),
      read: false,
    },
    {
      id: 'notif-init-2',
      targetDoctorId: 'doc5',
      type: 'rdv',
      message: 'Nouveau rendez-vous opération',
      detail: 'Zara Fatimé – Ostéosynthèse tibia le 2026-03-10 à 08:00',
      timestamp: new Date('2026-03-08T07:00:00'),
      read: false,
    },
  ]);

  const addMedicalNotification = useCallback((n: Omit<MedicalNotification, 'id' | 'timestamp' | 'read'>) => {
    const notif: MedicalNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
      read: false,
    };
    setMedicalNotifications(prev => [notif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setMedicalNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback((doctorId: string) => {
    setMedicalNotifications(prev => prev.map(n =>
      n.targetDoctorId === doctorId ? { ...n, read: true } : n
    ));
  }, []);

  const getNotificationsForDoctor = useCallback((doctorId: string) => {
    return medicalNotifications.filter(n => n.targetDoctorId === doctorId);
  }, [medicalNotifications]);

  const isDoctorScheduledForBloc = useCallback((doctorId: string) => {
    const hasOperationSchedule = schedules.some(s => s.doctorId === doctorId && s.type === 'operation');
    const hasOperationAppointment = appointments.some(a => a.doctorId === doctorId && a.type === 'operation' && a.statut !== 'annule' && a.statut !== 'termine');
    const hasBlocDuty = duties.some(d => d.staffId === doctorId && d.service.toLowerCase().includes('chirurgie') && d.statut !== 'termine');
    return hasOperationSchedule || hasOperationAppointment || hasBlocDuty;
  }, [schedules, appointments, duties]);

  // ─── Duty Exchange ───
  const [dutyExchanges, setDutyExchanges] = useState<DutyExchange[]>([
    {
      id: 'exch-init-1',
      requesterId: 'doc1',
      requesterDutyId: 'grd1',
      targetId: 'doc4',
      targetDutyId: 'grd5',
      motif: 'Obligation familiale le 08/03',
      date: '2026-03-08',
      statut: 'en_attente_cible',
    },
  ]);

  const requestDutyExchange = useCallback((exchange: Omit<DutyExchange, 'id' | 'date' | 'statut'>) => {
    const newExchange: DutyExchange = {
      ...exchange,
      id: `exch-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      statut: 'en_attente_cible',
    };
    setDutyExchanges(prev => [newExchange, ...prev]);
    const requester = ALL_STAFF.find(s => s.id === exchange.requesterId);
    const requesterDuty = duties.find(d => d.id === exchange.requesterDutyId);
    addMedicalNotification({
      targetDoctorId: exchange.targetId,
      type: 'echange',
      message: 'Demande d\'échange de garde',
      detail: `${requester?.nom} souhaite échanger sa garde du ${requesterDuty?.date} avec vous. Motif: ${exchange.motif}`,
    });
  }, [duties, addMedicalNotification]);

  const respondToExchange = useCallback((exchangeId: string, accept: boolean) => {
    setDutyExchanges(prev => prev.map(e => {
      if (e.id !== exchangeId) return e;
      if (accept) {
        // Find chef de service for this service
        const duty = duties.find(d => d.id === e.requesterDutyId);
        const service = duty?.service || '';
        // Notify all chefs de service (doctors who are chefs)
        DOCTORS.forEach(doc => {
          addMedicalNotification({
            targetDoctorId: doc.id,
            type: 'echange',
            message: 'Échange de garde à valider',
            detail: `${ALL_STAFF.find(s => s.id === e.requesterId)?.nom} ↔ ${ALL_STAFF.find(s => s.id === e.targetId)?.nom} – ${service}`,
          });
        });
        return { ...e, statut: 'en_attente_chef' as const };
      }
      // Notify requester of refusal
      addMedicalNotification({
        targetDoctorId: e.requesterId,
        type: 'echange',
        message: 'Échange de garde refusé',
        detail: `${ALL_STAFF.find(s => s.id === e.targetId)?.nom} a refusé votre demande d'échange`,
      });
      return { ...e, statut: 'refuse' as const };
    }));
  }, [duties, addMedicalNotification]);

  const validateExchange = useCallback((exchangeId: string, approve: boolean) => {
    setDutyExchanges(prev => prev.map(e => {
      if (e.id !== exchangeId) return e;
      if (approve) {
        // Actually swap the duties
        setDuties(prevDuties => prevDuties.map(d => {
          if (d.id === e.requesterDutyId) return { ...d, staffId: e.targetId };
          if (d.id === e.targetDutyId) return { ...d, staffId: e.requesterId };
          return d;
        }));
        // Notify both parties
        [e.requesterId, e.targetId].forEach(id => {
          addMedicalNotification({
            targetDoctorId: id,
            type: 'echange',
            message: 'Échange de garde validé ✅',
            detail: 'Le chef de service a approuvé l\'échange. Vos gardes ont été mises à jour.',
          });
        });
        toast.success('Échange de garde validé – Gardes mises à jour');
        return { ...e, statut: 'valide' as const };
      }
      // Notify both parties of rejection
      [e.requesterId, e.targetId].forEach(id => {
        addMedicalNotification({
          targetDoctorId: id,
          type: 'echange',
          message: 'Échange de garde refusé par le chef',
          detail: 'Le chef de service n\'a pas approuvé cet échange.',
        });
      });
      return { ...e, statut: 'refuse' as const };
    }));
  }, [addMedicalNotification]);

  return (
    <PlanningContext.Provider value={{
      schedules, setSchedules,
      appointments, setAppointments,
      referrals, setReferrals,
      breaks, setBreaks,
      duties, setDuties,
      dutyExchanges, requestDutyExchange, respondToExchange, validateExchange,
      medicalNotifications, addMedicalNotification,
      markNotificationRead, markAllNotificationsRead,
      getNotificationsForDoctor, isDoctorScheduledForBloc,
    }}>
      {children}
    </PlanningContext.Provider>
  );
};
