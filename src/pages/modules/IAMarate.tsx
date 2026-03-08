import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { toast } from 'sonner';

const IAMarate = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-7 h-7 text-primary" /> Intelligence Artificielle Marate AI
        </h1>
        <p className="text-muted-foreground text-sm">Surveillance syndromique, prédictions et aide à la décision</p>
      </div>

      {/* Epidemic Alert */}
      <Card className="border-destructive border-2 bg-destructive/5 animate-pulse">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive mt-1" />
          <div>
            <p className="text-lg font-bold text-destructive">🚨 ALERTE ÉPIDÉMIQUE ROUGE – Méningite</p>
            <p className="text-sm text-foreground mt-1">
              Détection de 12 cas de syndrome méningé en 72h dans la zone d'Abéché. 
              Corrélation avec la saison sèche et les données historiques. 
              Seuil épidémique OMS dépassé (15 cas/100 000/semaine).
            </p>
            <p className="text-xs text-muted-foreground mt-1">Hôpitaux concernés: Abéché (8), Sarh (3), N'Djamena (1)</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="destructive" className="text-xs" onClick={() => toast.warning('Alerte transmise au Ministère de la Santé')}>Notifier le Ministère</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info('Plan de riposte OMS activé')}>Plan de Riposte</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Syndromic surveillance */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Surveillance Syndromique Temps Réel</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { syndrome: 'Syndrome méningé', cas: 12, seuil: 10, alerte: true },
              { syndrome: 'Syndrome fébrile (Paludisme)', cas: 145, seuil: 200, alerte: false },
              { syndrome: 'Diarrhée aqueuse (Choléra)', cas: 3, seuil: 5, alerte: false },
              { syndrome: 'Syndrome respiratoire', cas: 28, seuil: 50, alerte: false },
              { syndrome: 'Rougeole', cas: 7, seuil: 10, alerte: false },
            ].map(s => (
              <div key={s.syndrome} className={`p-3 rounded-lg border ${s.alerte ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{s.syndrome}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${s.alerte ? 'text-destructive' : 'text-foreground'}`}>{s.cas} cas</span>
                    <span className="text-xs text-muted-foreground">/ seuil {s.seuil}</span>
                    {s.alerte && <Badge variant="destructive" className="text-[10px]">ALERTE</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Fonctionnalités IA</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.success('Résumé de sortie généré par IA', { description: 'Diagnostic: Paludisme sévère. Traitement: Artésunate IV. Évolution: Favorable.' })}>
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">Résumé de Sortie IA</p>
                <p className="text-xs text-muted-foreground">Génère automatiquement le résumé de sortie du patient</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.info('Analyse prédictive des stocks en cours...')}>
              <TrendingUp className="w-4 h-4 text-secondary" />
              <div className="text-left">
                <p className="text-sm font-medium">Prédiction de Stock</p>
                <p className="text-xs text-muted-foreground">Anticipe les ruptures de stock médicamenteux</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.warning('3 interactions médicamenteuses détectées!')}>
              <AlertTriangle className="w-4 h-4 text-warning" />
              <div className="text-left">
                <p className="text-sm font-medium">Détection d'Interactions</p>
                <p className="text-xs text-muted-foreground">Vérifie les interactions entre prescriptions</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.info('Suggestion diagnostique basée sur les symptômes et le contexte épidémiologique local')}>
              <Brain className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">Aide au Diagnostic</p>
                <p className="text-xs text-muted-foreground">Suggestions basées sur symptômes et épidémiologie locale</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IAMarate;
