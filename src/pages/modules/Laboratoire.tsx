import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MOCK_PATIENTS } from '@/data/mockData';
import { FlaskConical, Barcode, CheckCircle, Clock, Ban } from 'lucide-react';
import { toast } from 'sonner';

const Laboratoire = () => {
  const [scanResult, setScanResult] = useState('');
  const pendingLabs = MOCK_PATIENTS.flatMap(p => p.consultations.flatMap(c => c.examens.map(e => ({
    patient: `${p.prenom} ${p.nom}`, nhid: p.nhid, examen: e, paye: true, patientId: p.id
  }))));

  const handleScanBarcode = () => {
    setScanResult('TCD-2024-00001-L001');
    toast.info('Code-barres scanné: TCD-2024-00001-L001');
  };

  const handleAutoResults = () => {
    toast.success('Résultats automate reçus', { description: 'Roche Cobas 6000 – Résultats intégrés au DPI du patient' });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laboratoire LIMS</h1>
        <p className="text-muted-foreground text-sm">Gestion des analyses et interface automates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Analyses en attente', value: '23', icon: Clock, color: 'text-warning' },
          { label: 'En cours', value: '8', icon: FlaskConical, color: 'text-primary' },
          { label: 'Terminées aujourd\'hui', value: '45', icon: CheckCircle, color: 'text-secondary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barcode scanner */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Barcode className="w-4 h-4" /> Scanner Code-Barres</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Code-barres échantillon" value={scanResult} onChange={e => setScanResult(e.target.value)} />
              <Button onClick={handleScanBarcode} variant="outline">Scanner</Button>
            </div>
            <Button className="w-full gap-2" onClick={handleAutoResults}>
              <FlaskConical className="w-4 h-4" /> Recevoir Résultats Automate (Roche/Sysmex)
            </Button>
            <div className="p-3 rounded bg-muted/50 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Automates connectés:</p>
              <p>• Roche Cobas 6000 – Biochimie ✅</p>
              <p>• Sysmex XN-1000 – Hématologie ✅</p>
              <p>• GeneXpert – TB/Résistances ✅</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending analyses */}
        <Card>
          <CardHeader><CardTitle className="text-base">Prescriptions en attente</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {pendingLabs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune prescription en attente</p>
            ) : pendingLabs.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{l.patient}</p>
                  <p className="text-xs text-muted-foreground">{l.nhid}</p>
                  <p className="text-xs text-primary">{l.examen}</p>
                </div>
                <div className="flex items-center gap-2">
                  {l.paye ? (
                    <Badge variant="default" className="text-xs gap-1"><CheckCircle className="w-3 h-3" />Payé</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs gap-1"><Ban className="w-3 h-3" />Non payé</Badge>
                  )}
                  <Button size="sm" className="h-7 text-xs" onClick={() => toast.success(`Analyse "${l.examen}" lancée`)}>Lancer</Button>
                </div>
              </div>
            ))}

            {/* Extra mock entries */}
            {[
              { patient: 'Ousmane Djibril', nhid: 'TCD-2024-00008', examen: 'BK Crachats x3', paye: false },
              { patient: 'Khadija Abakar', nhid: 'TCD-2024-00007', examen: 'HbA1c + Créatinine', paye: true },
            ].map((l, i) => (
              <div key={`extra-${i}`} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{l.patient}</p>
                  <p className="text-xs text-muted-foreground">{l.nhid}</p>
                  <p className="text-xs text-primary">{l.examen}</p>
                </div>
                <div className="flex items-center gap-2">
                  {l.paye ? (
                    <Badge variant="default" className="text-xs gap-1"><CheckCircle className="w-3 h-3" />Payé</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs gap-1"><Ban className="w-3 h-3" />Bloqué</Badge>
                  )}
                  <Button size="sm" className="h-7 text-xs" disabled={!l.paye} onClick={() => toast.success(`Analyse lancée`)}>
                    {l.paye ? 'Lancer' : 'Payer d\'abord'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Laboratoire;
