export type Role = 
  | 'kiosk' | 'reception' | 'nurse' | 'doctor' | 'lab' 
  | 'imaging' | 'pharmacist' | 'director' | 'minister';

export const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: 'kiosk', label: 'Kiosque Patient', icon: 'Monitor' },
  { id: 'reception', label: 'Réception / Caisse', icon: 'Banknote' },
  { id: 'nurse', label: 'Infirmier / Triage', icon: 'Heart' },
  { id: 'doctor', label: 'Médecin', icon: 'Stethoscope' },
  { id: 'lab', label: 'Laboratoire', icon: 'Microscope' },
  { id: 'imaging', label: 'Imagerie Médicale', icon: 'ScanLine' },
  { id: 'pharmacist', label: 'Pharmacien', icon: 'Pill' },
  { id: 'director', label: 'Directeur Hôpital', icon: 'Building2' },
  { id: 'minister', label: 'Ministre de la Santé', icon: 'Crown' },
];

export interface DoctorProfile {
  doctorId: string;
  specialite: string;
  service: string;
  isChefDeService: boolean;
}

export const DOCTOR_PROFILES: Record<string, DoctorProfile> = {
  admin: { doctorId: 'doc1', specialite: 'Médecine Générale', service: 'general', isChefDeService: true },
  drHawa: { doctorId: 'doc2', specialite: 'Gynécologie', service: 'gyneco', isChefDeService: true },
  drAli: { doctorId: 'doc3', specialite: 'Cardiologie', service: 'cardio', isChefDeService: true },
  drAbdelkrim: { doctorId: 'doc4', specialite: 'Neurologie', service: 'neuro', isChefDeService: true },
  drHassan: { doctorId: 'doc5', specialite: 'Chirurgie Générale', service: 'chirurgie', isChefDeService: true },
  drMoussa: { doctorId: 'doc6', specialite: 'Chirurgie Générale', service: 'chirurgie', isChefDeService: false },
  drAbakar: { doctorId: 'doc7', specialite: 'Oncologie', service: 'onco', isChefDeService: true },
  drFadoul: { doctorId: 'doc8', specialite: 'Pédiatrie', service: 'pediatrie', isChefDeService: true },
};

export const USERS: Record<string, { password: string; role: Role; name: string }> = {
  admin: { password: 'admin', role: 'doctor', name: 'Dr. Ibrahim Moussa' },
  drHawa: { password: 'drHawa', role: 'doctor', name: 'Dr. Hawa Brahim' },
  drAli: { password: 'drAli', role: 'doctor', name: 'Dr. Ali Bichara' },
  drAbdelkrim: { password: 'drAbdelkrim', role: 'doctor', name: 'Dr. Abdelkrim Saleh' },
  drHassan: { password: 'drHassan', role: 'doctor', name: 'Pr. Hassan Ali' },
  drMoussa: { password: 'drMoussa', role: 'doctor', name: 'Dr. Moussa Fadil' },
  drAbakar: { password: 'drAbakar', role: 'doctor', name: 'Dr. Abakar Saleh' },
  drFadoul: { password: 'drFadoul', role: 'doctor', name: 'Dr. Fadoul Mahamat' },
  infirmier: { password: 'infirmier', role: 'nurse', name: 'Fatima Ali' },
  reception: { password: 'reception', role: 'reception', name: 'Amina Hassan' },
  labo: { password: 'labo', role: 'lab', name: 'Oumar Djibrine' },
  imagerie: { password: 'imagerie', role: 'imaging', name: 'Youssouf Mahamat' },
  pharmacie: { password: 'pharmacie', role: 'pharmacist', name: 'Halima Abdoulaye' },
  directeur: { password: 'directeur', role: 'director', name: 'Prof. Adoum Saleh' },
  ministre: { password: 'ministre', role: 'minister', name: 'S.E. Dr. Mahamat Nour' },
  kiosque: { password: 'kiosque', role: 'kiosk', name: 'Kiosque' },
};

export const HOSPITALS = [
  'CHU La Renaissance - N\'Djamena',
  'Hôpital National de Référence - N\'Djamena',
  'CHU de Moundou',
  'Hôpital National de Sarh',
  'Hôpital National d\'Abéché',
];

export const SERVICES = [
  { id: 'general', name: 'Médecine Générale', icon: 'Stethoscope' },
  { id: 'cardio', name: 'Cardiologie', icon: 'HeartPulse' },
  { id: 'ortho', name: 'Orthopédie', icon: 'Bone' },
  { id: 'pediatrie', name: 'Pédiatrie', icon: 'Baby' },
  { id: 'gyneco', name: 'Gynécologie-Obstétrique', icon: 'PersonStanding' },
  { id: 'chirurgie', name: 'Chirurgie Générale', icon: 'Scissors' },
  { id: 'neuro', name: 'Neurologie', icon: 'Brain' },
  { id: 'pneumo', name: 'Pneumologie', icon: 'Wind' },
  { id: 'ophtalmo', name: 'Ophtalmologie', icon: 'Eye' },
  { id: 'uro', name: 'Urologie', icon: 'Droplets' },
  { id: 'dermato', name: 'Dermatologie', icon: 'Fingerprint' },
  { id: 'onco', name: 'Oncologie', icon: 'Radiation' },
  { id: 'reanimation', name: 'Réanimation', icon: 'Activity' },
  { id: 'interne', name: 'Médecine Interne', icon: 'Clipboard' },
  { id: 'maternite', name: 'Maternité', icon: 'Baby' },
];

export interface Patient {
  id: string;
  nhid: string;
  nom: string;
  prenom: string;
  age: number;
  sexe: 'M' | 'F';
  telephone: string;
  adresse: string;
  groupeSanguin: string;
  allergies: string[];
  pathologieActuelle: string;
  service: string;
  statut: 'attente' | 'triage' | 'consultation' | 'labo' | 'imagerie' | 'pharmacie' | 'hospitalise' | 'sorti';
  urgence: 1 | 2 | 3 | 4 | 5;
  vitaux?: { tension: string; temperature: string; pouls: string; spo2: string; poids: string };
  consultations: Consultation[];
  labResults: LabResult[];
  imagingResults: ImagingResult[];
  prescriptions: Prescription[];
  hospitalisations: Hospitalisation[];
}

export interface Consultation {
  id: string;
  date: string;
  docteur: string;
  service: string;
  diagnostic: string;
  notes: string;
  ordonnance: string;
  examens: string[];
}

export interface LabResult {
  id: string;
  date: string;
  type: string;
  resultats: { parametre: string; valeur: string; normal: string; statut: 'normal' | 'anormal' }[];
  statut: 'en_attente' | 'en_cours' | 'termine';
  paye: boolean;
}

export interface ImagingResult {
  id: string;
  date: string;
  type: string;
  zone: string;
  interpretation: string;
  statut: 'en_attente' | 'en_cours' | 'termine';
}

export interface Prescription {
  id: string;
  date: string;
  medicaments: { nom: string; dosage: string; frequence: string; duree: string }[];
  statut: 'en_attente' | 'delivre';
}

export interface Hospitalisation {
  id: string;
  dateAdmission: string;
  dateSortie?: string;
  service: string;
  lit: string;
  motif: string;
  statut: 'actif' | 'sorti';
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1', nhid: 'TCD-2024-00001', nom: 'Mahamat', prenom: 'Abdoulaye', age: 34, sexe: 'M',
    telephone: '+235 66 00 11 22', adresse: 'Quartier Farcha, N\'Djamena', groupeSanguin: 'O+',
    allergies: ['Pénicilline'], pathologieActuelle: 'Paludisme sévère', service: 'general',
    statut: 'consultation', urgence: 3,
    vitaux: { tension: '120/80', temperature: '39.2', pouls: '98', spo2: '96', poids: '72' },
    consultations: [{
      id: 'c1', date: '2024-03-08', docteur: 'Dr. Ibrahim Moussa', service: 'Médecine Générale',
      diagnostic: 'Paludisme à Plasmodium falciparum – forme sévère',
      notes: 'Patient fébrile depuis 3 jours, céphalées intenses, vomissements. GE positive.',
      ordonnance: 'Artésunate IV 2.4mg/kg à H0, H12, H24 puis toutes les 24h',
      examens: ['Goutte épaisse + Frottis sanguin', 'NFS complète', 'Glycémie']
    }],
    labResults: [{
      id: 'l1', date: '2024-03-08', type: 'Goutte Épaisse', statut: 'termine', paye: true,
      resultats: [
        { parametre: 'Plasmodium falciparum', valeur: '++++ (85 000/µL)', normal: 'Négatif', statut: 'anormal' },
        { parametre: 'Hémoglobine', valeur: '9.2 g/dL', normal: '13-17 g/dL', statut: 'anormal' },
        { parametre: 'Glycémie', valeur: '0.65 g/L', normal: '0.7-1.1 g/L', statut: 'anormal' },
      ]
    }],
    imagingResults: [],
    prescriptions: [{ id: 'p1', date: '2024-03-08', statut: 'en_attente', medicaments: [
      { nom: 'Artésunate', dosage: '120mg IV', frequence: 'Selon protocole', duree: '3 jours' },
      { nom: 'Paracétamol', dosage: '1g', frequence: '3x/jour', duree: '5 jours' },
    ]}],
    hospitalisations: [{ id: 'h1', dateAdmission: '2024-03-08', service: 'Médecine Interne', lit: 'MI-12', motif: 'Paludisme sévère', statut: 'actif' }],
  },
  {
    id: '2', nhid: 'TCD-2024-00002', nom: 'Aïcha', prenom: 'Oumar', age: 28, sexe: 'F',
    telephone: '+235 66 33 44 55', adresse: 'Quartier Moursal, N\'Djamena', groupeSanguin: 'A+',
    allergies: [], pathologieActuelle: 'Grossesse à risque – Pré-éclampsie', service: 'gyneco',
    statut: 'hospitalise', urgence: 2,
    vitaux: { tension: '160/100', temperature: '37.0', pouls: '88', spo2: '98', poids: '68' },
    consultations: [{
      id: 'c2', date: '2024-03-07', docteur: 'Dr. Hawa Brahim', service: 'Gynécologie',
      diagnostic: 'Pré-éclampsie sévère – 34 SA',
      notes: 'HTA sévère avec protéinurie +++. Risque d\'éclampsie. Sulfate de magnésium débuté.',
      ordonnance: 'MgSO4 protocole Zuspan, Nicardipine IVSE', examens: ['Protéinurie des 24h', 'Bilan hépatique', 'Échographie obstétricale']
    }],
    labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [
      { id: 'h2', dateAdmission: '2024-03-07', service: 'Maternité', lit: 'MAT-05', motif: 'Pré-éclampsie sévère', statut: 'actif' }
    ],
  },
  {
    id: '3', nhid: 'TCD-2024-00003', nom: 'Deby', prenom: 'Moussa', age: 5, sexe: 'M',
    telephone: '+235 66 77 88 99', adresse: 'Quartier Diguel, N\'Djamena', groupeSanguin: 'B+',
    allergies: ['Sulfamides'], pathologieActuelle: 'Malnutrition aiguë sévère', service: 'pediatrie',
    statut: 'hospitalise', urgence: 2,
    vitaux: { tension: '80/50', temperature: '36.5', pouls: '110', spo2: '95', poids: '11' },
    consultations: [], labResults: [], imagingResults: [], prescriptions: [],
    hospitalisations: [{ id: 'h3', dateAdmission: '2024-03-06', service: 'Pédiatrie', lit: 'PED-03', motif: 'MAS avec complications', statut: 'actif' }],
  },
  {
    id: '4', nhid: 'TCD-2024-00004', nom: 'Hassan', prenom: 'Idriss', age: 55, sexe: 'M',
    telephone: '+235 66 11 22 33', adresse: 'Quartier Chagoua, N\'Djamena', groupeSanguin: 'AB+',
    allergies: [], pathologieActuelle: 'Infarctus du myocarde', service: 'cardio',
    statut: 'hospitalise', urgence: 1,
    vitaux: { tension: '90/60', temperature: '37.1', pouls: '120', spo2: '91', poids: '85' },
    consultations: [{
      id: 'c4', date: '2024-03-08', docteur: 'Dr. Ali Bichara', service: 'Cardiologie',
      diagnostic: 'IDM antérieur ST+ – Killip III',
      notes: 'Douleur thoracique depuis 4h. ECG: sus-décalage ST V1-V4. Troponine très élevée.',
      ordonnance: 'Aspirine 300mg, Clopidogrel 600mg, Héparine IVSE, Morphine titration',
      examens: ['Troponine HS', 'ECG 12 dérivations', 'Échocardiographie']
    }],
    labResults: [{
      id: 'l4', date: '2024-03-08', type: 'Bilan Cardiaque', statut: 'termine', paye: true,
      resultats: [
        { parametre: 'Troponine HS', valeur: '4580 ng/L', normal: '<14 ng/L', statut: 'anormal' },
        { parametre: 'BNP', valeur: '1250 pg/mL', normal: '<100 pg/mL', statut: 'anormal' },
        { parametre: 'CPK-MB', valeur: '320 U/L', normal: '<25 U/L', statut: 'anormal' },
      ]
    }],
    imagingResults: [{ id: 'i4', date: '2024-03-08', type: 'Échocardiographie', zone: 'Cœur', interpretation: 'Akinésie antéro-septale. FEVG estimée à 35%. Insuffisance mitrale grade II.', statut: 'termine' }],
    prescriptions: [], hospitalisations: [{ id: 'h4', dateAdmission: '2024-03-08', service: 'Réanimation', lit: 'REA-02', motif: 'IDM ST+ Killip III', statut: 'actif' }],
  },
  {
    id: '5', nhid: 'TCD-2024-00005', nom: 'Fatimé', prenom: 'Zara', age: 42, sexe: 'F',
    telephone: '+235 66 44 55 66', adresse: 'Moundou Centre', groupeSanguin: 'O-',
    allergies: ['Iode'], pathologieActuelle: 'Fracture ouverte tibia', service: 'ortho',
    statut: 'consultation', urgence: 2,
    vitaux: { tension: '130/85', temperature: '37.8', pouls: '95', spo2: '97', poids: '65' },
    consultations: [], labResults: [], imagingResults: [
      { id: 'i5', date: '2024-03-08', type: 'Radiographie', zone: 'Jambe droite', interpretation: 'Fracture ouverte diaphysaire du tibia droit, Gustilo II. Déplacement modéré.', statut: 'termine' }
    ],
    prescriptions: [], hospitalisations: [],
  },
  {
    id: '6', nhid: 'TCD-2024-00006', nom: 'Adam', prenom: 'Brahim', age: 19, sexe: 'M',
    telephone: '+235 66 55 66 77', adresse: 'Sarh Ville', groupeSanguin: 'A-',
    allergies: [], pathologieActuelle: 'Méningite bactérienne', service: 'neuro',
    statut: 'hospitalise', urgence: 1,
    vitaux: { tension: '100/70', temperature: '40.1', pouls: '115', spo2: '93', poids: '62' },
    consultations: [{
      id: 'c6', date: '2024-03-08', docteur: 'Dr. Abdelkrim Saleh', service: 'Neurologie',
      diagnostic: 'Méningite à méningocoque – Syndrome méningé franc',
      notes: 'Raideur de nuque, Kernig+, Brudzinski+. LCR trouble, GB > 5000. Ceftriaxone IV débuté.',
      ordonnance: 'Ceftriaxone 2g IV/12h, Dexaméthasone 0.15mg/kg/6h',
      examens: ['Ponction lombaire', 'Hémocultures', 'PCR méningocoque']
    }],
    labResults: [], imagingResults: [], prescriptions: [],
    hospitalisations: [{ id: 'h6', dateAdmission: '2024-03-08', service: 'Neurologie', lit: 'NEU-01', motif: 'Méningite bactérienne', statut: 'actif' }],
  },
  {
    id: '7', nhid: 'TCD-2024-00007', nom: 'Khadija', prenom: 'Abakar', age: 67, sexe: 'F',
    telephone: '+235 66 88 99 00', adresse: 'Abéché Centre', groupeSanguin: 'B-',
    allergies: ['Aspirine'], pathologieActuelle: 'Diabète type 2 décompensé', service: 'interne',
    statut: 'consultation', urgence: 3,
    vitaux: { tension: '145/90', temperature: '37.0', pouls: '78', spo2: '98', poids: '82' },
    consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
  },
  {
    id: '8', nhid: 'TCD-2024-00008', nom: 'Ousmane', prenom: 'Djibril', age: 45, sexe: 'M',
    telephone: '+235 66 12 34 56', adresse: 'Quartier Amriguebe, N\'Djamena', groupeSanguin: 'O+',
    allergies: [], pathologieActuelle: 'Tuberculose pulmonaire', service: 'pneumo',
    statut: 'attente', urgence: 3,
    vitaux: { tension: '110/70', temperature: '38.0', pouls: '88', spo2: '94', poids: '58' },
    consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
  },
  {
    id: '9', nhid: 'TCD-2024-00009', nom: 'Mariam', prenom: 'Saleh', age: 30, sexe: 'F',
    telephone: '+235 66 78 90 12', adresse: 'Quartier Klemat, N\'Djamena', groupeSanguin: 'A+',
    allergies: [], pathologieActuelle: 'Cataracte bilatérale', service: 'ophtalmo',
    statut: 'attente', urgence: 4,
    consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
  },
  {
    id: '10', nhid: 'TCD-2024-00010', nom: 'Youssouf', prenom: 'Haroun', age: 38, sexe: 'M',
    telephone: '+235 66 34 56 78', adresse: 'Moundou Nord', groupeSanguin: 'AB-',
    allergies: ['Codéine'], pathologieActuelle: 'Appendicite aiguë', service: 'chirurgie',
    statut: 'triage', urgence: 2,
    vitaux: { tension: '125/80', temperature: '38.5', pouls: '100', spo2: '97', poids: '75' },
    consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
  },
  {
    id: '11', nhid: 'TCD-2024-00011', nom: 'Halimé', prenom: 'Mahamat', age: 22, sexe: 'F',
    telephone: '+235 66 56 78 90', adresse: 'Sarh Est', groupeSanguin: 'O+',
    allergies: [], pathologieActuelle: 'Eczéma sévère', service: 'dermato',
    statut: 'attente', urgence: 5,
    consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
  },
  {
    id: '12', nhid: 'TCD-2024-00012', nom: 'Tchari', prenom: 'Abba', age: 60, sexe: 'M',
    telephone: '+235 66 90 12 34', adresse: 'Abéché Sud', groupeSanguin: 'B+',
    allergies: [], pathologieActuelle: 'Cancer du foie – Stade III', service: 'onco',
    statut: 'hospitalise', urgence: 2,
    consultations: [], labResults: [], imagingResults: [], prescriptions: [],
    hospitalisations: [{ id: 'h12', dateAdmission: '2024-03-01', service: 'Oncologie', lit: 'ONC-04', motif: 'Chimiothérapie cycle 3', statut: 'actif' }],
  },
  {
    id: '13', nhid: 'TCD-2024-00013', nom: 'Ngarmbatina', prenom: 'Claire', age: 8, sexe: 'F',
    telephone: '+235 66 11 33 55', adresse: 'N\'Djamena Sud', groupeSanguin: 'A+',
    allergies: ['Arachides'], pathologieActuelle: 'Asthme aigu grave', service: 'pediatrie',
    statut: 'consultation', urgence: 2,
    vitaux: { tension: '90/60', temperature: '37.2', pouls: '130', spo2: '88', poids: '22' },
    consultations: [], labResults: [], imagingResults: [], prescriptions: [],
    hospitalisations: [],
  },
  {
    id: '14', nhid: 'TCD-2024-00014', nom: 'Djimé', prenom: 'Koumba', age: 50, sexe: 'M',
    telephone: '+235 66 22 44 66', adresse: 'Moundou Centre', groupeSanguin: 'O+',
    allergies: [], pathologieActuelle: 'Colique néphrétique', service: 'uro',
    statut: 'triage', urgence: 3,
    vitaux: { tension: '140/90', temperature: '37.3', pouls: '92', spo2: '98', poids: '78' },
    consultations: [], labResults: [], imagingResults: [], prescriptions: [], hospitalisations: [],
  },
  {
    id: '15', nhid: 'TCD-2024-00015', nom: 'Achta', prenom: 'Bichara', age: 75, sexe: 'F',
    telephone: '+235 66 77 99 11', adresse: 'N\'Djamena Farcha', groupeSanguin: 'AB+',
    allergies: ['Morphine'], pathologieActuelle: 'AVC ischémique', service: 'neuro',
    statut: 'hospitalise', urgence: 1,
    vitaux: { tension: '180/110', temperature: '37.0', pouls: '68', spo2: '95', poids: '60' },
    consultations: [{
      id: 'c15', date: '2024-03-08', docteur: 'Dr. Abdelkrim Saleh', service: 'Neurologie',
      diagnostic: 'AVC ischémique sylvien gauche',
      notes: 'Hémiplégie droite + Aphasie de Broca. Scanner: hypodensité sylvienne gauche. Thrombolyse non possible (délai > 4h30).',
      ordonnance: 'Aspirine 160mg, Atorvastatine 80mg, HBPM préventive',
      examens: ['Scanner cérébral', 'Angio-IRM', 'Bilan lipidique']
    }],
    labResults: [], imagingResults: [
      { id: 'i15', date: '2024-03-08', type: 'Scanner cérébral', zone: 'Cerveau', interpretation: 'Hypodensité du territoire sylvien gauche étendue. Pas d\'hémorragie.', statut: 'termine' }
    ],
    prescriptions: [],
    hospitalisations: [{ id: 'h15', dateAdmission: '2024-03-08', service: 'Neurologie', lit: 'NEU-03', motif: 'AVC ischémique', statut: 'actif' }],
  },
];

export const PHARMACY_STOCK = [
  { id: 's1', nom: 'Artésunate Injectable 60mg', stock: 450, seuil: 100, peremption: '2025-06-15', categorie: 'Antipaludéens' },
  { id: 's2', nom: 'Ceftriaxone 1g Injectable', stock: 280, seuil: 50, peremption: '2025-09-20', categorie: 'Antibiotiques' },
  { id: 's3', nom: 'Paracétamol 1g Comprimés', stock: 2500, seuil: 500, peremption: '2026-01-10', categorie: 'Antalgiques' },
  { id: 's4', nom: 'Amoxicilline 500mg Gélules', stock: 1200, seuil: 200, peremption: '2025-04-30', categorie: 'Antibiotiques' },
  { id: 's5', nom: 'Métronidazole 500mg', stock: 35, seuil: 100, peremption: '2025-03-15', categorie: 'Antiparasitaires' },
  { id: 's6', nom: 'Insuline Rapide 100UI/mL', stock: 85, seuil: 30, peremption: '2025-05-01', categorie: 'Antidiabétiques' },
  { id: 's7', nom: 'Sulfate de Magnésium 50%', stock: 120, seuil: 40, peremption: '2025-12-31', categorie: 'Électrolytes' },
  { id: 's8', nom: 'ACT (Artéméther-Luméfantrine)', stock: 45, seuil: 200, peremption: '2025-08-20', categorie: 'Antipaludéens' },
  { id: 's9', nom: 'Diazépam 10mg Injectable', stock: 150, seuil: 30, peremption: '2026-03-15', categorie: 'Antiépileptiques' },
  { id: 's10', nom: 'Sérum Glucosé 5% 500mL', stock: 300, seuil: 100, peremption: '2026-06-01', categorie: 'Solutés' },
];

export const QUEUE_DATA = [
  { position: 1, patient: 'Mahamat Abdoulaye', nhid: 'TCD-2024-00001', service: 'Médecine Générale', heureArrivee: '07:30', statut: 'En consultation' },
  { position: 2, patient: 'Ousmane Djibril', nhid: 'TCD-2024-00008', service: 'Pneumologie', heureArrivee: '07:45', statut: 'En attente' },
  { position: 3, patient: 'Mariam Saleh', nhid: 'TCD-2024-00009', service: 'Ophtalmologie', heureArrivee: '08:00', statut: 'En attente' },
  { position: 4, patient: 'Youssouf Haroun', nhid: 'TCD-2024-00010', service: 'Chirurgie', heureArrivee: '08:15', statut: 'Triage' },
  { position: 5, patient: 'Halimé Mahamat', nhid: 'TCD-2024-00011', service: 'Dermatologie', heureArrivee: '08:30', statut: 'En attente' },
];
