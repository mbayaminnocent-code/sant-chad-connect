import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MOCK_PATIENTS } from '@/data/mockData';
import { ScanLine, Camera, FileImage, Send, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const IMAGING_TYPES = [
  'Radiographie', 'Échographie', 'Scanner (TDM)', 'IRM', 'Mammographie', 'Échocardiographie', 'Doppler vasculaire', 'Panoramique dentaire'
];

const Imagerie = () => {
  const [selectedType, setSelectedType] = useState('');
  const [interpretation, setInterpretation] = useState('');

  const pendingImaging = MOCK_PATIENTS.filter(p => p.imagingResults.some(r => r.statut !== 'termine') || p.consultations.some(c => c.examens.some(e => e.toLowerCase().includes('écho') || e.toLowerCase().includes('scanner') || e.toLowerCase().includes('radio'))));
  const completedImaging = MOCK_PATIENTS.flatMap(p => p.imagingResults.filter(r => r.statut === 'termine').map(r => ({ ...r, patient: `${p.prenom} ${p.nom}`, nhid: p.nhid })));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Imagerie Médicale</h1>
        <p className="text-muted-foreground text-sm">Radiologie, échographie, scanner et IRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'En attente', value: '7', icon: Clock, color: 'text-warning' },
          { label: 'En cours', value: '2', icon: Camera, color: 'text-primary' },
          { label: 'Terminés aujourd\'hui', value: '15', icon: CheckCircle, color: 'text-secondary' },
          { label: 'Envoyés au DPI', value: '13', icon: Send, color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-6 h-6 ${s.color}`} />
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New exam */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ScanLine className="w-4 h-4" />Nouvel Examen d'Imagerie</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger><SelectValue placeholder="Type d'examen" /></SelectTrigger>
              <SelectContent>
                {IMAGING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Interprétation</label>
              <Textarea placeholder="Résultat et interprétation de l'examen..." value={interpretation} onChange={e => setInterpretation(e.target.value)} rows={4} />
            </div>
            <Button className="w-full gap-2" onClick={() => { toast.success('Résultat envoyé au DPI du patient', { description: 'Le médecin traitant a été notifié' }); setInterpretation(''); }}>
              <Send className="w-4 h-4" /> Envoyer au Dossier Patient
            </Button>
            <div className="p-3 rounded bg-muted/50 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Équipements disponibles:</p>
              <p>• Radiographie numérique – Salle 1 ✅</p>
              <p>• Échographe GE Logiq E10 – Salle 2 ✅</p>
              <p>• Scanner 64 coupes – Salle 3 ✅</p>
              <p>• IRM 1.5T – Salle 4 ⚠️ Maintenance</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed results */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileImage className="w-4 h-4" />Résultats Récents</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {completedImaging.map(r => (
              <div key={r.id} className="p-3 rounded-lg border border-border">
                <div className="flex justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{r.patient} ({r.nhid})</p>
                  <Badge variant="default" className="text-xs">Terminé</Badge>
                </div>
                <p className="text-xs text-primary font-medium">{r.type} – {r.zone}</p>
                <p className="text-xs text-foreground mt-1">{r.interpretation}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{r.date}</p>
              </div>
            ))}
            {/* Extra mock */}
            <div className="p-3 rounded-lg border border-border">
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium text-foreground">Fatimé Zara (TCD-2024-00005)</p>
                <Badge variant="default" className="text-xs">Terminé</Badge>
              </div>
              <p className="text-xs text-primary font-medium">Radiographie – Jambe droite</p>
              <p className="text-xs text-foreground mt-1">Fracture ouverte diaphysaire du tibia droit, Gustilo II.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Imagerie;
