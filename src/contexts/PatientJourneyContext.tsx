import React, { createContext, useContext, useState, useCallback } from 'react';
import { MOCK_PATIENTS, Patient, LabResult, ImagingResult } from '@/data/mockData';
import { toast } from 'sonner';

export type JourneyStep = 'accueil' | 'paiement' | 'triage' | 'consultation' | 'labo' | 'imagerie' | 'pharmacie' | 'hospitalise' | 'sorti';

export const JOURNEY_STEPS: { key: JourneyStep; label: string; icon: string }[] = [
  { key: 'accueil', label: 'Accueil', icon: '🏥' },
  { key: 'paiement', label: 'Paiement', icon: '💰' },
  { key: 'triage', label: 'Triage', icon: '🩺' },
  { key: 'consultation', label: 'Consultation', icon: '👨‍⚕️' },
  { key: 'labo', label: 'Laboratoire', icon: '🔬' },
  { key: 'imagerie', label: 'Imagerie', icon: '📷' },
  { key: 'pharmacie', label: 'Pharmacie', icon: '💊' },
  { key: 'hospitalise', label: 'Hospitalisation', icon: '🛏️' },
  { key: 'sorti', label: 'Sortie', icon: '✅' },
];

export interface JourneyEvent {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  from: JourneyStep;
  to: JourneyStep;
  timestamp: Date;
  module: string;
  details?: string;
}

export interface PaymentReceipt {
  id: string;
  patientId: string;
  patientName: string;
  nhid: string;
  type: 'consultation' | 'labo' | 'pharmacie' | 'imagerie' | 'hospitalisation' | 'autre';
  items: { label: string; montant: number }[];
  totalMontant: number;
  montantPaye: number;
  modePaiement: string;
  timestamp: Date;
  caissier: string;
}

interface PatientJourneyContextType {
  patients: Patient[];
  getPatientStep: (patientId: string) => JourneyStep;
  advancePatient: (patientId: string, to: JourneyStep, module: string, details?: string) => void;
  journeyEvents: JourneyEvent[];
  getPatientEvents: (patientId: string) => JourneyEvent[];
  registerNewPatient: (data: { nom: string; prenom: string; age: number; telephone: string }) => Patient;
  getPatientsByStep: (step: JourneyStep) => Patient[];
  recentEvents: JourneyEvent[];
  addLabResult: (patientId: string, result: LabResult) => void;
  updateLabResult: (patientId: string, labId: string, updates: Partial<LabResult>) => void;
  addImagingResult: (patientId: string, result: ImagingResult) => void;
  updateImagingResult: (patientId: string, imgId: string, updates: Partial<ImagingResult>) => void;
  updatePrescriptionStatus: (patientId: string, prescriptionId: string, statut: 'en_attente' | 'delivre') => void;
  addPrescription: (patientId: string, prescription: Patient['prescriptions'][0]) => void;
  // Payment receipts
  paymentReceipts: PaymentReceipt[];
  addPaymentReceipt: (receipt: PaymentReceipt) => void;
  getPatientReceipts: (patientId: string) => PaymentReceipt[];
  hasReceiptForType: (patientId: string, type: PaymentReceipt['type']) => boolean;
  getReceiptForType: (patientId: string, type: PaymentReceipt['type']) => PaymentReceipt | undefined;
}

const PatientJourneyContext = createContext<PatientJourneyContextType | null>(null);

export const usePatientJourney = () => {
  const ctx = useContext(PatientJourneyContext);
  if (!ctx) throw new Error('usePatientJourney must be used within PatientJourneyProvider');
  return ctx;
};

const mapStatutToStep = (statut: Patient['statut']): JourneyStep => {
  const map: Record<string, JourneyStep> = {
    attente: 'accueil', triage: 'triage', consultation: 'consultation',
    labo: 'labo', imagerie: 'imagerie', pharmacie: 'pharmacie',
    hospitalise: 'hospitalise', sorti: 'sorti',
  };
  return map[statut] || 'accueil';
};

const mapStepToStatut = (step: JourneyStep): Patient['statut'] => {
  const map: Record<JourneyStep, Patient['statut']> = {
    accueil: 'attente', paiement: 'attente', triage: 'triage',
    consultation: 'consultation', labo: 'labo', imagerie: 'imagerie',
    pharmacie: 'pharmacie', hospitalise: 'hospitalise', sorti: 'sorti',
  };
  return map[step];
};

export const PatientJourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([...MOCK_PATIENTS]);
  const [journeyEvents, setJourneyEvents] = useState<JourneyEvent[]>(() => {
    return MOCK_PATIENTS.filter(p => p.statut !== 'attente').map(p => ({
      id: `init-${p.id}`,
      patientId: p.id,
      patientName: `${p.prenom} ${p.nom}`,
      nhid: p.nhid,
      from: 'accueil' as JourneyStep,
      to: mapStatutToStep(p.statut),
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      module: 'Système',
      details: `Statut initial: ${p.pathologieActuelle}`,
    }));
  });
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([]);

  const getPatientStep = useCallback((patientId: string): JourneyStep => {
    const p = patients.find(pt => pt.id === patientId);
    if (!p) return 'accueil';
    return mapStatutToStep(p.statut);
  }, [patients]);

  const advancePatient = useCallback((patientId: string, to: JourneyStep, module: string, details?: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      const from = mapStatutToStep(p.statut);
      const event: JourneyEvent = {
        id: `evt-${Date.now()}-${patientId}`,
        patientId,
        patientName: `${p.prenom} ${p.nom}`,
        nhid: p.nhid,
        from, to,
        timestamp: new Date(),
        module, details,
      };
      setJourneyEvents(prev => [event, ...prev]);
      const stepLabel = JOURNEY_STEPS.find(s => s.key === to);
      toast.success(`${p.prenom} ${p.nom} → ${stepLabel?.label}`, {
        description: `${stepLabel?.icon} Transféré depuis ${module}${details ? ` – ${details}` : ''}`,
      });
      return { ...p, statut: mapStepToStatut(to) };
    }));
  }, []);

  const registerNewPatient = useCallback((data: { nom: string; prenom: string; age: number; telephone: string }): Patient => {
    const id = String(patients.length + 1);
    const nhid = `TCD-2024-${id.padStart(5, '0')}`;
    const newPatient: Patient = {
      id, nhid, nom: data.nom, prenom: data.prenom, age: data.age, sexe: 'M',
      telephone: data.telephone, adresse: 'N\'Djamena', groupeSanguin: 'O+',
      allergies: [], pathologieActuelle: 'À déterminer', service: 'general',
      statut: 'attente', urgence: 4,
      consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
    };
    setPatients(prev => [...prev, newPatient]);
    const event: JourneyEvent = {
      id: `evt-reg-${id}`, patientId: id,
      patientName: `${data.prenom} ${data.nom}`, nhid,
      from: 'accueil', to: 'accueil', timestamp: new Date(),
      module: 'Accueil', details: 'Nouveau patient enregistré',
    };
    setJourneyEvents(prev => [event, ...prev]);
    toast.success('Patient enregistré!', { description: `ID: ${nhid}` });
    return newPatient;
  }, [patients.length]);

  const addLabResult = useCallback((patientId: string, result: LabResult) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, labResults: [...p.labResults, result] } : p
    ));
  }, []);

  const updateLabResult = useCallback((patientId: string, labId: string, updates: Partial<LabResult>) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? {
        ...p,
        labResults: p.labResults.map(l => l.id === labId ? { ...l, ...updates } : l)
      } : p
    ));
  }, []);

  const addImagingResult = useCallback((patientId: string, result: ImagingResult) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, imagingResults: [...p.imagingResults, result] } : p
    ));
  }, []);

  const updateImagingResult = useCallback((patientId: string, imgId: string, updates: Partial<ImagingResult>) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? {
        ...p,
        imagingResults: p.imagingResults.map(i => i.id === imgId ? { ...i, ...updates } : i)
      } : p
    ));
  }, []);

  const updatePrescriptionStatus = useCallback((patientId: string, prescriptionId: string, statut: 'en_attente' | 'delivre') => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? {
        ...p,
        prescriptions: p.prescriptions.map(pr => pr.id === prescriptionId ? { ...pr, statut } : pr)
      } : p
    ));
  }, []);

  const addPrescription = useCallback((patientId: string, prescription: Patient['prescriptions'][0]) => {
    setPatients(prev => prev.map(p =>
      p.id === patientId ? { ...p, prescriptions: [...p.prescriptions, prescription] } : p
    ));
  }, []);

  const getPatientEvents = useCallback((patientId: string) => {
    return journeyEvents.filter(e => e.patientId === patientId);
  }, [journeyEvents]);

  const getPatientsByStep = useCallback((step: JourneyStep) => {
    return patients.filter(p => mapStatutToStep(p.statut) === step);
  }, [patients]);

  const addPaymentReceipt = useCallback((receipt: PaymentReceipt) => {
    setPaymentReceipts(prev => [receipt, ...prev]);
  }, []);

  const getPatientReceipts = useCallback((patientId: string) => {
    return paymentReceipts.filter(r => r.patientId === patientId);
  }, [paymentReceipts]);

  const hasReceiptForType = useCallback((patientId: string, type: PaymentReceipt['type']) => {
    return paymentReceipts.some(r => r.patientId === patientId && r.type === type);
  }, [paymentReceipts]);

  const getReceiptForType = useCallback((patientId: string, type: PaymentReceipt['type']) => {
    return paymentReceipts.find(r => r.patientId === patientId && r.type === type);
  }, [paymentReceipts]);

  const recentEvents = journeyEvents.slice(0, 20);

  return (
    <PatientJourneyContext.Provider value={{
      patients, getPatientStep, advancePatient, journeyEvents,
      getPatientEvents, registerNewPatient, getPatientsByStep, recentEvents,
      addLabResult, updateLabResult, addImagingResult, updateImagingResult,
      updatePrescriptionStatus, addPrescription,
      paymentReceipts, addPaymentReceipt, getPatientReceipts, hasReceiptForType, getReceiptForType,
    }}>
      {children}
    </PatientJourneyContext.Provider>
  );
};
