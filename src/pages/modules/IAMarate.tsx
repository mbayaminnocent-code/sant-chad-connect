import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

const IAMarate = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-7 h-7 text-primary" /> {t('ia.title')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('ia.subtitle')}</p>
      </div>

      <Card className="border-destructive border-2 bg-destructive/5 animate-pulse">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive mt-1" />
          <div>
            <p className="text-lg font-bold text-destructive">🚨 {t('ia.epidemic_alert')}</p>
            <p className="text-sm text-foreground mt-1">
              {t('ia.concerned_hospitals')}: Abéché (8), Sarh (3), N'Djamena (1)
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="destructive" className="text-xs" onClick={() => toast.warning(t('ia.notify_ministry'))}>{t('ia.notify_ministry')}</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => toast.info(t('ia.response_plan'))}>{t('ia.response_plan')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> {t('ia.syndromic_surveillance')}</CardTitle></CardHeader>
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
                    <span className={`text-sm font-bold ${s.alerte ? 'text-destructive' : 'text-foreground'}`}>{s.cas} {t('ia.cases')}</span>
                    <span className="text-xs text-muted-foreground">/ {t('ia.threshold')} {s.seuil}</span>
                    {s.alerte && <Badge variant="destructive" className="text-[10px]">{t('ia.alert')}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t('ia.ai_features')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.success(t('ia.discharge_summary'))}>
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">{t('ia.discharge_summary')}</p>
                <p className="text-xs text-muted-foreground">{t('ia.discharge_summary_desc')}</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.info(t('ia.stock_prediction'))}>
              <TrendingUp className="w-4 h-4 text-secondary" />
              <div className="text-left">
                <p className="text-sm font-medium">{t('ia.stock_prediction')}</p>
                <p className="text-xs text-muted-foreground">{t('ia.stock_prediction_desc')}</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.warning(t('ia.interaction_detection'))}>
              <AlertTriangle className="w-4 h-4 text-warning" />
              <div className="text-left">
                <p className="text-sm font-medium">{t('ia.interaction_detection')}</p>
                <p className="text-xs text-muted-foreground">{t('ia.interaction_detection_desc')}</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => toast.info(t('ia.diagnostic_aid'))}>
              <Brain className="w-4 h-4 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">{t('ia.diagnostic_aid')}</p>
                <p className="text-xs text-muted-foreground">{t('ia.diagnostic_aid_desc')}</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IAMarate;
