import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_PATIENTS } from '@/data/mockData';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

const PatientsList = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { role } = useAuth();

  const filtered = MOCK_PATIENTS.filter(p =>
    `${p.prenom} ${p.nom} ${p.nhid} ${p.pathologieActuelle}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('patients.title')}</h1>
          <p className="text-muted-foreground text-sm">{MOCK_PATIENTS.length} {t('patients.registered')}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('patients.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-3">
        {filtered.map(p => (
          <Card key={p.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                  <p className="text-xs text-muted-foreground">{p.nhid} • {p.age} {t('common.years')} • {p.sexe} • {p.groupeSanguin}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{p.pathologieActuelle}</Badge>
                <Badge variant={p.statut === 'hospitalise' ? 'default' : p.statut === 'consultation' ? 'secondary' : 'outline'} className="text-xs capitalize">{p.statut}</Badge>
                {p.allergies.length > 0 && <Badge variant="destructive" className="text-xs">{t('patients.allergies')}</Badge>}
                {p.urgence <= 2 && <Badge variant="destructive" className="text-xs">U{p.urgence}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PatientsList;
