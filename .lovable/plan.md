

# Plan : Notifications temps réel, Bloc-Planning connecté, Calendrier mensuel

## 1. Système de notifications en temps réel

**Approche** : Étendre `AppContext` avec un système de notifications ciblées par médecin/staff.

- Ajouter une interface `MedicalNotification` avec champs : `targetDoctorId`, `type` (transfert, rdv, garde), `read`, `timestamp`
- Dans `Planning.tsx` : lors de la création d'un RDV, d'un transfert ou d'une garde, appeler `addNotification` avec le médecin ciblé
- Créer un composant `NotificationCenter` dans la TopBar qui filtre les notifications par le médecin connecté (`doctorProfile.doctorId`)
- Ajouter un badge animé (pulse) pour les notifications non lues
- Support du marquage "lu" et liste déroulante avec icônes par type

## 2. Connexion Bloc Opératoire ↔ Planning

**Approche** : Le Bloc Opératoire vérifie si le médecin connecté a des opérations programmées dans le planning.

- Dans `App.tsx` : modifier la route `/bloc-operatoire` pour vérifier dynamiquement si le médecin a des créneaux de type `operation` dans les schedules ou des RDV de type `operation`
- Créer un contexte partagé ou exporter les données de planning (schedules/appointments) vers un nouveau `PlanningContext` accessible par le Bloc
- Alternative plus simple : stocker les schedules et appointments dans `PatientJourneyContext` (déjà partagé) plutôt que dans l'état local de `Planning.tsx`
- Dans `BlocOperatoire.tsx` : afficher un message si le médecin n'est pas programmé, sinon filtrer les chirurgies visibles

**Choix retenu** : Créer un `PlanningContext` dédié pour partager schedules, appointments, referrals, duties et breaks entre Planning et BlocOperatoire. Cela évite de surcharger `PatientJourneyContext`.

## 3. Vue calendrier mensuelle des gardes

**Approche** : Ajouter un onglet "Calendrier" dans Planning.tsx.

- Construire une grille calendrier mensuelle (7 colonnes × ~5 lignes) avec navigation mois précédent/suivant
- Chaque cellule affiche les gardes/permanences du jour avec des badges colorés par type
- Utiliser les données `duties` existantes, groupées par date
- Cliquer sur un jour affiche le détail des gardes dans un popover

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `src/contexts/PlanningContext.tsx` | **Créer** — Contexte partagé pour schedules, appointments, referrals, breaks, duties + notifications médicales |
| `src/pages/modules/Planning.tsx` | **Modifier** — Consommer le PlanningContext au lieu de l'état local, ajouter onglet Calendrier mensuel |
| `src/pages/modules/BlocOperatoire.tsx` | **Modifier** — Consommer PlanningContext, filtrer l'accès par médecin programmé |
| `src/App.tsx` | **Modifier** — Wrapper avec PlanningProvider, logique d'accès bloc dynamique |
| `src/components/TopBar.tsx` | **Modifier** — Intégrer les notifications médicales ciblées |
| `src/components/NotificationCenter.tsx` | **Créer** — Composant de notifications médicales avec badge, liste, marquage lu |

## Détails d'implémentation

### PlanningContext
- Déplace tout l'état de Planning.tsx (schedules, appointments, referrals, breaks, duties) dans un contexte partagé
- Ajoute `medicalNotifications[]` avec `addMedicalNotification(targetId, type, message)`
- Expose les handlers (createAppointment, createReferral, etc.) qui émettent automatiquement des notifications

### Calendrier mensuel
- État : `currentMonth` (Date), navigation ←/→
- Grille : calcul des jours du mois avec `date-fns` (startOfMonth, endOfMonth, eachDayOfInterval)
- Chaque cellule : filtre `duties` par date, affiche badges colorés
- Popover au clic pour détails

### Accès Bloc conditionnel
- Route `/bloc-operatoire` : si `role === 'doctor'`, vérifier dans PlanningContext si le docteur a des schedules type `operation` ou des appointments type `operation`
- Si non programmé : afficher `AccessDenied` avec message "Vous n'êtes pas programmé au bloc opératoire"

