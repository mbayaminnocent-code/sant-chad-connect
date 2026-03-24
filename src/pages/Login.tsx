import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Wifi, Sun, Lock } from 'lucide-react';

const translations = {
  fr: {
    title: 'Marate Santé AI',
    subtitle: 'Système d\'Information Hospitalier Souverain du Tchad',
    solar: 'Solaire',
    sovereign: 'Souverain',
    secure: 'Connexion Sécurisée',
    username: 'Identifiant',
    password: 'Mot de passe',
    userPlaceholder: 'Entrez votre identifiant',
    passPlaceholder: 'Entrez votre mot de passe',
    error: 'Identifiant ou mot de passe incorrect',
    submit: 'Se Connecter',
    submitting: 'Connexion en cours...',
    demo: 'Comptes de démonstration :',
    doctors: '— Médecins —',
    others: '— Autres rôles —',
    chief: 'Chef de service (peut modifier le planning)',
    footer: '🇹🇩 République du Tchad – Données souveraines sur sol national',
    nurse: 'Infirmier',
    reception: 'Réception / Caisse',
    lab: 'Laboratoire',
    imaging: 'Imagerie',
    pharmacy: 'Pharmacie',
    director: 'Directeur',
    minister: 'Ministre',
  },
  ar: {
    title: 'مراتي صحة AI',
    subtitle: 'نظام المعلومات الصحي السيادي لتشاد',
    solar: 'طاقة شمسية',
    sovereign: 'سيادي',
    secure: 'تسجيل دخول آمن',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    userPlaceholder: 'أدخل اسم المستخدم',
    passPlaceholder: 'أدخل كلمة المرور',
    error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    submit: 'تسجيل الدخول',
    submitting: 'جارٍ تسجيل الدخول...',
    demo: 'حسابات تجريبية:',
    doctors: '— الأطباء —',
    others: '— أدوار أخرى —',
    chief: 'رئيس القسم (يمكنه تعديل الجدول)',
    footer: '🇹🇩 جمهورية تشاد – بيانات سيادية على التراب الوطني',
    nurse: 'ممرض',
    reception: 'الاستقبال / الصندوق',
    lab: 'المختبر',
    imaging: 'التصوير',
    pharmacy: 'الصيدلية',
    director: 'المدير',
    minister: 'الوزير',
  },
};

const Login = () => {
  const { login } = useAuth();
  const { language } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (!login(username, password)) {
        setError(t.error);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-warning" /> {t.solar}</span>
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-secondary" /> Starlink</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> {t.sovereign}</span>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center text-card-foreground">{t.secure}</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.username}</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder={t.userPlaceholder} className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t.password}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.passPlaceholder} className="h-11" />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? t.submitting : t.submit}
              </Button>
            </form>
            <div className="mt-6 p-3 rounded-lg bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t.demo}</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span className="font-semibold col-span-2 text-foreground mt-1">{t.doctors}</span>
                <span>admin / admin</span><span className="text-primary">→ Dr. Moussa (Méd. Gén.) 👑</span>
                <span>drHawa / drHawa</span><span className="text-primary">→ Dr. Hawa (Gynéco) 👑</span>
                <span>drAli / drAli</span><span className="text-primary">→ Dr. Ali (Cardio) 👑</span>
                <span>drMoussa / drMoussa</span><span className="text-primary">→ Dr. Fadil (Chirurgie)</span>
                <span>drFadoul / drFadoul</span><span className="text-primary">→ Dr. Fadoul (Pédiatrie) 👑</span>
                <span className="font-semibold col-span-2 text-foreground mt-1">{t.others}</span>
                <span>infirmier / infirmier</span><span className="text-primary">→ {t.nurse}</span>
                <span>reception / reception</span><span className="text-primary">→ {t.reception}</span>
                <span>labo / labo</span><span className="text-primary">→ {t.lab}</span>
                <span>imagerie / imagerie</span><span className="text-primary">→ {t.imaging}</span>
                <span>pharmacie / pharmacie</span><span className="text-primary">→ {t.pharmacy}</span>
                <span>directeur / directeur</span><span className="text-primary">→ {t.director}</span>
                <span>ministre / ministre</span><span className="text-primary">→ {t.minister}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">👑 = {t.chief}</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">{t.footer}</p>
      </div>
    </div>
  );
};

export default Login;
