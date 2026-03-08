import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MOCK_PATIENTS, QUEUE_DATA } from '@/data/mockData';
import { Monitor, QrCode, Fingerprint, Users, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Accueil = () => {
  const [showKiosk, setShowKiosk] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [newPatient, setNewPatient] = useState({ nom: '', prenom: '', age: '', telephone: '' });

  const handleRegister = () => {
    setRegistering(true);
    setTimeout(() => {
      setRegistering(false);
      toast.success('Patient enregistré avec succès!', { description: `ID National: TCD-2024-${String(MOCK_PATIENTS.length + 1).padStart(5, '0')}` });
      setNewPatient({ nom: '', prenom: '', age: '', telephone: '' });
    }, 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accueil & Kiosque Patient</h1>
          <p className="text-muted-foreground text-sm">Enregistrement et gestion de la file d'attente</p>
        </div>
        <Button onClick={() => setShowKiosk(!showKiosk)} variant={showKiosk ? "default" : "outline"} className="gap-2">
          <Monitor className="w-4 h-4" /> {showKiosk ? 'Vue Standard' : 'Mode Kiosque'}
        </Button>
      </div>

      {showKiosk ? (
        /* KIOSK MODE - Large touch-friendly interface */
        <div className="space-y-6">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-3xl font-bold text-foreground">Bienvenue à l'Hôpital</h2>
              <p className="text-xl text-muted-foreground">مرحبا بكم في المستشفى</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Button className="h-32 text-xl flex-col gap-3" variant="default" onClick={() => toast.info('Scan QR Code en cours...')}>
                  <QrCode className="w-12 h-12" />
                  Scanner QR Code
                </Button>
                <Button className="h-32 text-xl flex-col gap-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={() => toast.info('Simulation biométrique...')}>
                  <Fingerprint className="w-12 h-12" />
                  Empreinte Digitale
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Nouveau patient ? Approchez-vous du comptoir d'accueil</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration Form */}
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Nouvel Enregistrement</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nom" value={newPatient.nom} onChange={e => setNewPatient(p => ({ ...p, nom: e.target.value }))} />
              <Input placeholder="Prénom" value={newPatient.prenom} onChange={e => setNewPatient(p => ({ ...p, prenom: e.target.value }))} />
              <Input placeholder="Âge" type="number" value={newPatient.age} onChange={e => setNewPatient(p => ({ ...p, age: e.target.value }))} />
              <Input placeholder="Téléphone" value={newPatient.telephone} onChange={e => setNewPatient(p => ({ ...p, telephone: e.target.value }))} />
              <div className="flex gap-2">
                <Button className="flex-1 gap-1" onClick={() => toast.info('📸 Capture photo en cours...')} variant="outline"><QrCode className="w-3 h-3" />Photo</Button>
                <Button className="flex-1 gap-1" onClick={() => toast.info('👆 Scan empreinte...')} variant="outline"><Fingerprint className="w-3 h-3" />Bio</Button>
              </div>
              <Button className="w-full" onClick={handleRegister} disabled={registering}>
                {registering ? 'Enregistrement...' : 'Enregistrer & Générer ID National'}
              </Button>
            </CardContent>
          </Card>

          {/* Queue Display */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> File d'Attente</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {QUEUE_DATA.map(q => (
                  <div key={q.position} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{q.position}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{q.patient}</p>
                        <p className="text-xs text-muted-foreground">{q.nhid} • {q.service}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{q.heureArrivee}</span>
                      <Badge variant={q.statut === 'En consultation' ? 'default' : q.statut === 'Triage' ? 'secondary' : 'outline'} className="text-xs">
                        {q.statut === 'En consultation' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {q.statut}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients aujourd\'hui', value: '47', color: 'text-primary' },
          { label: 'En attente', value: '12', color: 'text-warning' },
          { label: 'En consultation', value: '8', color: 'text-secondary' },
          { label: 'Sortis', value: '27', color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Accueil;
