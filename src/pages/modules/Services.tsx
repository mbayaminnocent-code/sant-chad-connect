import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SERVICES, MOCK_PATIENTS } from '@/data/mockData';
import { Users } from 'lucide-react';

const Services = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Services Médicaux</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de tous les services et départements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map(service => {
          const patients = MOCK_PATIENTS.filter(p => p.service === service.id);
          const hospitalized = patients.filter(p => p.hospitalisations.some(h => h.statut === 'actif'));
          return (
            <Card key={service.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{service.name}</span>
                  <Badge variant="outline" className="text-xs">{patients.length} patients</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patients.length > 0 ? patients.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-xs">
                      <div>
                        <p className="font-medium text-foreground">{p.prenom} {p.nom}</p>
                        <p className="text-muted-foreground">{p.pathologieActuelle}</p>
                      </div>
                      <Badge variant={p.statut === 'hospitalise' ? 'default' : 'secondary'} className="text-[10px]">
                        {p.statut === 'hospitalise' ? 'Hospitalisé' : p.statut}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground text-center py-2">Aucun patient actuellement</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {hospitalized.length} hospitalisés</span>
                    <span>{patients.filter(p => p.statut === 'consultation').length} en consultation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
