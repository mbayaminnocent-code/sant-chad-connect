import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';

/**
 * Auto-translation DOM walker for Arabic.
 * Walks all visible text nodes and translates French phrases/words to Arabic
 * using a large dictionary. Original French is stored in data-fr-* attributes
 * on the text node's parent so we can restore when switching back.
 *
 * Skips: <input>, <textarea>, <script>, <style>, <code>, <pre>, [contenteditable],
 * and any element marked with data-no-translate.
 */

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'NOSCRIPT']);

// Comprehensive FR → AR dictionary.
// Longer phrases first (handled by sorting).
const DICT: Record<string, string> = {
  // Generic UI
  'Tableau de bord': 'لوحة القيادة',
  'Tableau de Bord': 'لوحة القيادة',
  'Rechercher un patient': 'البحث عن مريض',
  'Rechercher': 'بحث',
  'Recherche': 'بحث',
  'Filtrer': 'تصفية',
  'Tous': 'الكل',
  'Toutes': 'الكل',
  'Aucun': 'لا شيء',
  'Aucune': 'لا شيء',
  'Aucun résultat': 'لا توجد نتائج',
  'Aucun patient': 'لا يوجد مريض',
  'Aucune donnée': 'لا توجد بيانات',
  'Voir': 'عرض',
  'Voir tout': 'عرض الكل',
  'Voir détails': 'عرض التفاصيل',
  'Voir le dossier': 'عرض الملف',
  'Détails': 'التفاصيل',
  'Détail': 'تفصيل',
  'Modifier': 'تعديل',
  'Supprimer': 'حذف',
  'Annuler': 'إلغاء',
  'Valider': 'تأكيد',
  'Confirmer': 'تأكيد',
  'Enregistrer': 'حفظ',
  'Sauvegarder': 'حفظ',
  'Ajouter': 'إضافة',
  'Nouveau': 'جديد',
  'Nouvelle': 'جديدة',
  'Fermer': 'إغلاق',
  'Retour': 'رجوع',
  'Suivant': 'التالي',
  'Précédent': 'السابق',
  'Imprimer': 'طباعة',
  'Exporter': 'تصدير',
  'Télécharger': 'تنزيل',
  'Importer': 'استيراد',
  'Envoyer': 'إرسال',
  'Rafraîchir': 'تحديث',
  'Actualiser': 'تحديث',
  'Charger': 'تحميل',
  'Chargement': 'جار التحميل',
  'Veuillez patienter': 'يرجى الانتظار',
  'En cours': 'قيد التنفيذ',
  'Terminé': 'منتهي',
  'Terminée': 'منتهية',
  'Annulé': 'ملغى',
  'Annulée': 'ملغاة',
  'Actif': 'نشط',
  'Active': 'نشطة',
  'Inactif': 'غير نشط',
  'Inactive': 'غير نشطة',
  'Activé': 'مفعل',
  'Désactivé': 'غير مفعل',
  'Statut': 'الحالة',
  'État': 'الحالة',
  'Date': 'التاريخ',
  'Heure': 'الساعة',
  'Date et heure': 'التاريخ والساعة',
  'Aujourd\'hui': 'اليوم',
  'Hier': 'أمس',
  'Demain': 'غداً',
  'Cette semaine': 'هذا الأسبوع',
  'Ce mois': 'هذا الشهر',
  'Ce trimestre': 'هذا الربع',
  'Cette année': 'هذا العام',
  'Période': 'الفترة',
  'Jour': 'يوم',
  'Jours': 'أيام',
  'Semaine': 'أسبوع',
  'Semaines': 'أسابيع',
  'Mois': 'شهر',
  'Année': 'سنة',
  'Années': 'سنوات',
  'Trimestre': 'ربع',
  'Minute': 'دقيقة',
  'Minutes': 'دقائق',
  'min': 'د',
  'h': 'س',
  'Total': 'المجموع',
  'Sous-total': 'المجموع الفرعي',
  'Montant': 'المبلغ',
  'Prix': 'السعر',
  'Quantité': 'الكمية',
  'Nombre': 'العدد',
  'Type': 'النوع',
  'Catégorie': 'الفئة',
  'Description': 'الوصف',
  'Commentaire': 'تعليق',
  'Commentaires': 'تعليقات',
  'Notes': 'ملاحظات',
  'Note': 'ملاحظة',
  'Action': 'إجراء',
  'Actions': 'إجراءات',
  'Option': 'خيار',
  'Options': 'خيارات',
  'Paramètres': 'الإعدادات',
  'Configuration': 'الإعدادات',
  'Profil': 'الملف الشخصي',
  'Compte': 'الحساب',
  'Utilisateur': 'المستخدم',
  'Utilisateurs': 'المستخدمون',
  'Rôle': 'الدور',
  'Rôles': 'الأدوار',
  'Permission': 'صلاحية',
  'Permissions': 'الصلاحيات',
  'Bienvenue': 'مرحباً',
  'Bonjour': 'صباح الخير',
  'Bonsoir': 'مساء الخير',

  // Medical
  'Patient': 'المريض',
  'Patients': 'المرضى',
  'Nom': 'الاسم',
  'Prénom': 'اللقب',
  'Âge': 'العمر',
  'Sexe': 'الجنس',
  'Masculin': 'ذكر',
  'Féminin': 'أنثى',
  'Téléphone': 'الهاتف',
  'Adresse': 'العنوان',
  'Groupe sanguin': 'فصيلة الدم',
  'Allergies': 'الحساسية',
  'Pathologie': 'المرض',
  'Pathologie actuelle': 'المرض الحالي',
  'Diagnostic': 'التشخيص',
  'Symptômes': 'الأعراض',
  'Traitement': 'العلاج',
  'Médicament': 'دواء',
  'Médicaments': 'الأدوية',
  'Ordonnance': 'وصفة طبية',
  'Ordonnances': 'الوصفات الطبية',
  'Prescription': 'وصفة',
  'Prescriptions': 'الوصفات',
  'Posologie': 'الجرعة',
  'Dosage': 'الجرعة',
  'Consultation': 'استشارة',
  'Consultations': 'الاستشارات',
  'Examen': 'فحص',
  'Examens': 'الفحوصات',
  'Analyse': 'تحليل',
  'Analyses': 'تحاليل',
  'Résultat': 'نتيجة',
  'Résultats': 'النتائج',
  'Rapport': 'تقرير',
  'Rapports': 'التقارير',
  'Dossier': 'ملف',
  'Dossier patient': 'ملف المريض',
  'Dossier médical': 'الملف الطبي',
  'Antécédents': 'السوابق',
  'Antécédent': 'سابقة',
  'Médecin': 'الطبيب',
  'Médecins': 'الأطباء',
  'Docteur': 'الدكتور',
  'Dr.': 'د.',
  'Infirmier': 'الممرض',
  'Infirmière': 'الممرضة',
  'Infirmiers': 'الممرضون',
  'Pharmacien': 'الصيدلي',
  'Caissier': 'أمين الصندوق',
  'Caissière': 'أمينة الصندوق',
  'Réception': 'الاستقبال',
  'Accueil': 'الاستقبال',
  'Triage': 'الفرز',
  'Urgence': 'الطوارئ',
  'Urgences': 'الطوارئ',
  'Urgent': 'عاجل',
  'Critique': 'حرج',
  'Grave': 'خطير',
  'Modéré': 'متوسط',
  'Léger': 'خفيف',
  'Stable': 'مستقر',
  'Hospitalisation': 'الاستشفاء',
  'Hospitalisations': 'الاستشفاءات',
  'Hospitalisé': 'مستشفى',
  'Hospitalisée': 'مستشفاة',
  'Sortie': 'الخروج',
  'Sortie autorisée': 'الخروج المرخص',
  'Service': 'القسم',
  'Services': 'الأقسام',
  'Lit': 'سرير',
  'Lits': 'الأسرة',
  'Chambre': 'الغرفة',
  'Chambres': 'الغرف',
  'Bloc opératoire': 'غرفة العمليات',
  'Bloc Opératoire': 'غرفة العمليات',
  'Intervention': 'تدخل جراحي',
  'Interventions': 'التدخلات الجراحية',
  'Chirurgie': 'جراحة',
  'Anesthésie': 'تخدير',
  'Anesthésiste': 'طبيب التخدير',
  'Chirurgien': 'الجراح',
  'Pharmacie': 'الصيدلية',
  'Stock': 'المخزون',
  'En stock': 'متوفر',
  'Rupture de stock': 'نفاد المخزون',
  'Laboratoire': 'المختبر',
  'Imagerie': 'الأشعة',
  'Imagerie Médicale': 'الأشعة الطبية',
  'Radio': 'أشعة',
  'Radiographie': 'الأشعة السينية',
  'Échographie': 'الموجات فوق الصوتية',
  'Scanner': 'السكانير',
  'IRM': 'الرنين المغناطيسي',
  'Facturation': 'الفوترة',
  'Facture': 'فاتورة',
  'Factures': 'الفواتير',
  'Reçu': 'وصل',
  'Reçus': 'الوصولات',
  'Caisse': 'الصندوق',
  'Paiement': 'الدفع',
  'Paiements': 'المدفوعات',
  'Payé': 'مدفوع',
  'Non payé': 'غير مدفوع',
  'À payer': 'للدفع',
  'En attente de paiement': 'بانتظار الدفع',
  'Mode de paiement': 'طريقة الدفع',
  'Espèces': 'نقداً',
  'Carte bancaire': 'بطاقة بنكية',
  'Mobile Money': 'النقود الإلكترونية',
  'Virement': 'تحويل',
  'Chèque': 'شيك',

  // Workflow / status
  'En attente': 'في الانتظار',
  'En consultation': 'في الاستشارة',
  'En triage': 'في الفرز',
  'Au laboratoire': 'في المختبر',
  'À l\'imagerie': 'في الأشعة',
  'À la pharmacie': 'في الصيدلية',
  'À la caisse': 'في الصندوق',
  'Parcours patient': 'مسار المريض',
  'Parcours': 'المسار',
  'Étape': 'مرحلة',
  'Étapes': 'المراحل',
  'Étape suivante': 'المرحلة التالية',
  'Étape précédente': 'المرحلة السابقة',
  'Historique': 'السجل',
  'Historique du parcours': 'سجل المسار',
  'Transférer': 'تحويل',
  'Transféré': 'محوّل',
  'Transférée': 'محوّلة',
  'Renvoyer': 'إعادة إرسال',
  'Prescrire': 'وصف',
  'Prescrit': 'موصوف',
  'Prescrire un examen': 'وصف فحص',
  'Prescrire une imagerie': 'وصف أشعة',
  'Prescrire un médicament': 'وصف دواء',
  'Démarrer': 'بدء',
  'Démarrer l\'examen': 'بدء الفحص',
  'Lancer': 'إطلاق',
  'Lancer l\'analyse': 'إطلاق التحليل',
  'Arrêter': 'إيقاف',
  'Pause': 'إيقاف مؤقت',
  'Reprendre': 'استئناف',
  'Vérifier': 'التحقق',
  'Vérification': 'التحقق',
  'Reçu vérifié': 'تم التحقق من الوصل',
  'En attente de reçu': 'بانتظار الوصل',
  'Reçu manquant': 'الوصل مفقود',

  // Dashboards / KPIs
  'Statistiques': 'الإحصائيات',
  'Statistique': 'إحصائية',
  'Indicateurs': 'المؤشرات',
  'Indicateur': 'مؤشر',
  'Performance': 'الأداء',
  'Performances': 'الأداء',
  'Recettes': 'الإيرادات',
  'Recette': 'إيراد',
  'Dépenses': 'النفقات',
  'Dépense': 'نفقة',
  'Bénéfice': 'الربح',
  'Revenus': 'العائدات',
  'Revenu': 'العائد',
  'Finances': 'المالية',
  'Financier': 'مالي',
  'Financière': 'مالية',
  'Rapport financier': 'التقرير المالي',
  'Rapport journalier': 'التقرير اليومي',
  'Rapport périodique': 'التقرير الدوري',
  'Rapport hebdomadaire': 'التقرير الأسبوعي',
  'Rapport mensuel': 'التقرير الشهري',
  'Épidémiologie': 'علم الأوبئة',
  'Maladies': 'الأمراض',
  'Maladie': 'مرض',
  'Tranche d\'âge': 'الفئة العمرية',
  'Tranches d\'âge': 'الفئات العمرية',
  'Létalité': 'الفتك',
  'Taux de létalité': 'معدل الفتك',
  'Mortalité': 'الوفيات',
  'Évolution': 'التطور',
  'Tendance': 'الاتجاه',
  'Tendances': 'الاتجاهات',
  'Répartition': 'التوزيع',
  'Distribution': 'التوزيع',
  'Top 10': 'أفضل 10',
  'Top': 'الأفضل',
  'Total patients': 'إجمالي المرضى',
  'Patients en attente': 'المرضى المنتظرون',
  'Patients hospitalisés': 'المرضى المستشفون',
  'Patients traités': 'المرضى المعالجون',
  'Temps moyen': 'الوقت المتوسط',
  'Temps d\'attente': 'وقت الانتظار',
  'Temps de réponse': 'وقت الاستجابة',
  'Capacité': 'الطاقة الاستيعابية',
  'Occupation': 'الإشغال',
  "Taux d'occupation": 'معدل الإشغال',

  // Director / Ministry
  'Directeur': 'المدير',
  'Directeur de l\'hôpital': 'مدير المستشفى',
  'Direction': 'الإدارة',
  'Administration': 'الإدارة',
  'Ministère': 'الوزارة',
  'Ministre': 'الوزير',
  'Ministère de la Santé': 'وزارة الصحة',
  'Hôpital': 'المستشفى',
  'Hôpitaux': 'المستشفيات',
  'CHU': 'المستشفى الجامعي',
  'Région': 'الجهة',
  'Régions': 'الجهات',
  'Province': 'المحافظة',
  'District': 'المقاطعة',
  'National': 'وطني',
  'Nationale': 'وطنية',

  // Misc
  'Notifications': 'الإشعارات',
  'Notification': 'إشعار',
  'Alertes': 'التنبيهات',
  'Alerte': 'تنبيه',
  'Alerte critique': 'تنبيه حرج',
  'Escalade': 'تصعيد',
  'Escalade automatique': 'تصعيد تلقائي',
  'Chef de service': 'رئيس القسم',
  'Connecté': 'متصل',
  'Déconnecté': 'غير متصل',
  'Connexion': 'اتصال',
  'Déconnexion': 'تسجيل خروج',
  'Se connecter': 'تسجيل الدخول',
  'Se déconnecter': 'تسجيل الخروج',
  'Mot de passe': 'كلمة المرور',
  'Identifiant': 'المعرّف',
  'Email': 'البريد الإلكتروني',
  'Langue': 'اللغة',
  'Français': 'الفرنسية',
  'Arabe': 'العربية',
  'Mode hors ligne': 'وضع عدم الاتصال',
  'En ligne': 'متصل',
  'Hors ligne': 'غير متصل',
  'Synchronisation': 'المزامنة',
  'Synchroniser': 'مزامنة',
  'Synchronisé': 'تمت المزامنة',
  'Erreur': 'خطأ',
  'Erreurs': 'أخطاء',
  'Succès': 'نجاح',
  'Avertissement': 'تحذير',
  'Information': 'معلومات',
  'Aide': 'مساعدة',
  'À propos': 'حول',
  'Contact': 'اتصال',
  'Oui': 'نعم',
  'Non': 'لا',
  'OK': 'موافق',
};

// Build a sorted entries array (longer keys first to avoid partial overlaps).
const SORTED_ENTRIES = Object.entries(DICT).sort((a, b) => b[0].length - a[0].length);

// Pre-compile a single regex of all keys for fast replacement.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BIG_RE = new RegExp(
  '(' + SORTED_ENTRIES.map(([k]) => escapeRe(k)).join('|') + ')',
  'g'
);
const LOOKUP: Map<string, string> = new Map(SORTED_ENTRIES);

const translateString = (s: string): string => {
  if (!s || !s.trim()) return s;
  return s.replace(BIG_RE, (m) => LOOKUP.get(m) || m);
};

const shouldSkipElement = (el: Element | null): boolean => {
  if (!el) return false;
  if (SKIP_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  if (el.getAttribute && el.getAttribute('data-no-translate') !== null) return true;
  return false;
};

const ORIG_KEY = '__frOrig';

const translateTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return;
  // Walk up to verify no skipped ancestor
  let p: Element | null = parent;
  while (p) {
    if (shouldSkipElement(p)) return;
    p = p.parentElement;
  }
  const orig = (node as any)[ORIG_KEY] ?? node.nodeValue ?? '';
  if (!(node as any)[ORIG_KEY]) (node as any)[ORIG_KEY] = orig;
  const translated = translateString(orig);
  if (translated !== node.nodeValue) node.nodeValue = translated;
};

const restoreTextNode = (node: Text) => {
  const orig = (node as any)[ORIG_KEY];
  if (orig !== undefined && node.nodeValue !== orig) node.nodeValue = orig;
};

const walkAndApply = (root: Node, apply: (n: Text) => void) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      // quick reject for skip tags up the tree
      let p: Element | null = parent;
      while (p) {
        if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) apply(n as Text);
};

// Also translate certain attributes (placeholder, title, aria-label, alt).
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const translateAttrs = (root: Element | Document, restore: boolean) => {
  const els = (root as Element).querySelectorAll
    ? (root as Element).querySelectorAll('*')
    : document.querySelectorAll('*');
  els.forEach((el) => {
    ATTRS.forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      const key = `data-fr-${attr}`;
      if (restore) {
        const orig = el.getAttribute(key);
        if (orig !== null) {
          el.setAttribute(attr, orig);
        }
        return;
      }
      const cur = el.getAttribute(attr) || '';
      if (!el.hasAttribute(key)) el.setAttribute(key, cur);
      const orig = el.getAttribute(key) || cur;
      const translated = translateString(orig);
      if (el.getAttribute(attr) !== translated) el.setAttribute(attr, translated);
    });
  });
};

export const AutoTranslator: React.FC = () => {
  const { language } = useApp();

  useEffect(() => {
    const root = document.body;
    if (language === 'ar') {
      walkAndApply(root, translateTextNode);
      translateAttrs(document, false);

      const observer = new MutationObserver((muts) => {
        for (const m of muts) {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) translateTextNode(n as Text);
            else if (n.nodeType === Node.ELEMENT_NODE) {
              walkAndApply(n, translateTextNode);
              translateAttrs(n as Element, false);
            }
          });
          if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
            translateTextNode(m.target as Text);
          }
          if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
            const el = m.target as Element;
            if (m.attributeName && ATTRS.includes(m.attributeName)) {
              translateAttrs(el, false);
            }
          }
        }
      });
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS,
      });
      return () => observer.disconnect();
    } else {
      // Restore French
      walkAndApply(root, restoreTextNode);
      translateAttrs(document, true);
    }
  }, [language]);

  return null;
};

export default AutoTranslator;
