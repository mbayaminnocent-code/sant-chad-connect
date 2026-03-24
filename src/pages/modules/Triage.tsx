import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SERVICES } from '@/data/mockData';
import { usePatientJourney } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { HeartPulse, ArrowRight, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

const urgenceColors: Record<number, string> = {
  1: 'bg-destructive text-destructive-foreground',
  2: 'bg-warning text-warning-foreground',
  3: 'bg-primary text-primary-foreground',
  4: 'bg-secondary text-secondary-foreground',
  5: 'bg-muted text-muted-foreground',
};

const Triage = () => {
  const { t } = useTranslation();
  const { patients, advancePatient, getPatientsByStep } = usePatientJourney();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [triageData, setTriageData] = useState({
    tension: '', temperature: '', pouls: '', spo2: '', poids: '',
    symptomes: '', urgence: '3', serviceAssigne: 'general',
  });

  const patientsEnAttente = patients.filter(p => ['attente', 'triage'].includes(p.statut));
  const patientsTriage = getPatientsByStep('triage');
  const patient = patients.find(p => p.id === selectedPatient);

  const handleTransfer = () => {
    if (!selectedPatient) return;
    const service = SERVICES.find(s => s.id === triageData.serviceAssigne);
    advancePatient(selectedPatient, 'consultation', t('triage.title'), `${service?.name} – P${triageData.urgence}`);
    setSelectedPatient(null);
    setTriageData({ tension: '', temperature: '', pouls: '', spo2: '', poids: '', symptomes: '', urgence: '3', serviceAssigne: 'general' });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('triage.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('triage.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t('triage.waiting_patients')} ({patientsEnAttente.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {patientsEnAttente.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPatient(p.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all space-y-2 ${selectedPatient === p.id ? 'border-primary bg-accent' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                    <p className="text-xs text-muted-foreground">{p.nhid} • {p.age} {t('common.years')}</p>
                  </div>
                  <Badge className={urgenceColors[p.urgence]}>U{p.urgence}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.pathologieActuelle}</p>
                <PatientJourneyTracker patientId={p.id} compact />
              </div>
            ))}
            {patientsEnAttente.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">{t('triage.no_waiting')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HeartPulse className="w-4 h-4" /> {t('triage.form_title')}
              {patient && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-primary">{patient.prenom} {patient.nom}</span>
                  {patient.allergies.length > 0 && (
                    <Badge variant="destructive" className="gap-1 ml-2"><AlertTriangle className="w-3 h-3" /> {t('triage.allergy')}: {patient.allergies.join(', ')}</Badge>
                  )}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">{t('triage.patient_journey')}</p>
                <PatientJourneyTracker patientId={patient.id} showEvents />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: t('triage.blood_pressure'), key: 'tension', placeholder: '120/80' },
                { label: t('triage.temperature'), key: 'temperature', placeholder: '37.0' },
                { label: t('triage.pulse'), key: 'pouls', placeholder: '80' },
                { label: t('triage.spo2'), key: 'spo2', placeholder: '98' },
                { label: t('triage.weight'), key: 'poids', placeholder: '70' },
              ].map(v => (
                <div key={v.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{v.label}</label>
                  <Input placeholder={v.placeholder} value={(triageData as any)[v.key]} onChange={e => setTriageData(d => ({ ...d, [v.key]: e.target.value }))} className="h-9" />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t('triage.symptoms')}</label>
              <Textarea placeholder={t('triage.describe_symptoms')} value={triageData.symptomes} onChange={e => setTriageData(d => ({ ...d, symptomes: e.target.value }))} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('triage.urgency_level')}</label>
                <Select value={triageData.urgence} onValueChange={v => setTriageData(d => ({ ...d, urgence: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('triage.level_1')}</SelectItem>
                    <SelectItem value="2">{t('triage.level_2')}</SelectItem>
                    <SelectItem value="3">{t('triage.level_3')}</SelectItem>
                    <SelectItem value="4">{t('triage.level_4')}</SelectItem>
                    <SelectItem value="5">{t('triage.level_5')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t('triage.orient_service')}</label>
                <Select value={triageData.serviceAssigne} onValueChange={v => setTriageData(d => ({ ...d, serviceAssigne: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={handleTransfer} disabled={!selectedPatient}>
              <Send className="w-4 h-4" /> {t('triage.transfer_doctor')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Triage;
