import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Wifi, Sun, Lock } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (!login(username, password)) {
        setError('Identifiant ou mot de passe incorrect');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Marate Santé AI</h1>
          <p className="text-muted-foreground text-sm">
            Système d'Information Hospitalier Souverain du Tchad
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-warning" /> Solaire</span>
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-secondary" /> Starlink</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-primary" /> Souverain</span>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-card">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-center text-card-foreground">Connexion Sécurisée</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Identifiant</label>
                <Input
                  value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Entrez votre identifiant"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mot de passe</label>
                <Input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="h-11"
                />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? 'Connexion en cours...' : 'Se Connecter'}
              </Button>
            </form>
            <div className="mt-6 p-3 rounded-lg bg-muted">
              <p className="text-xs font-medium text-muted-foreground mb-2">Comptes de démonstration :</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>admin / admin</span><span className="text-primary">→ Médecin</span>
                <span>infirmier / infirmier</span><span className="text-primary">→ Infirmier</span>
                <span>reception / reception</span><span className="text-primary">→ Réception</span>
                <span>labo / labo</span><span className="text-primary">→ Laboratoire</span>
                <span>imagerie / imagerie</span><span className="text-primary">→ Imagerie</span>
                <span>pharmacie / pharmacie</span><span className="text-primary">→ Pharmacie</span>
                <span>directeur / directeur</span><span className="text-primary">→ Directeur</span>
                <span>ministre / ministre</span><span className="text-primary">→ Ministre</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          🇹🇩 République du Tchad – Données souveraines sur sol national
        </p>
      </div>
    </div>
  );
};

export default Login;
