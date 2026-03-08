import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePatientJourney, JOURNEY_STEPS } from '@/contexts/PatientJourneyContext';
import PatientJourneyTracker from '@/components/PatientJourneyTracker';
import { Monitor, QrCode, Fingerprint, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Accueil = () => {
  const [showKiosk, setShowKiosk] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [newPatient, setNewPatient] = useState({ nom: '', prenom: '', age: '', telephone: '' });
  const { registerNewPatient, advancePatient, getPatientsByStep, recentEvents, patients } = usePatientJourney();

  const patientsAccueil = getPatientsByStep('accueil');
  const patientsPaiement = getPatientsByStep('paiement');

  const handleRegister = () => {
    if (!newPatient.nom || !newPatient.prenom) {
      toast.error('Veuillez remplir le nom et le prénom');
      return;
    }
    setRegistering(true);
    setTimeout(() => {
      const p = registerNewPatient({
        nom: newPatient.nom,
        prenom: newPatient.prenom,
        age: Number(newPatient.age) || 30,
        telephone: newPatient.telephone,
      });
      setRegistering(false);
      setNewPatient({ nom: '', prenom: '', age: '', telephone: '' });
    }, 1200);
  };

  const handleSendToPaiement = (patientId: string) => {
    advancePatient(patientId, 'paiement', 'Accueil', 'Dirigé vers la caisse');
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

          {/* Queue with real-time journey */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Patients à l'Accueil ({patientsAccueil.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {patientsAccueil.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun patient en attente à l'accueil</p>
              ) : patientsAccueil.map(p => (
                <div key={p.id} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                      <p className="text-xs text-muted-foreground">{p.nhid} • {p.age} ans • {p.pathologieActuelle}</p>
                    </div>
                    <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => handleSendToPaiement(p.id)}>
                      <ArrowRight className="w-3 h-3" /> Envoyer à la Caisse
                    </Button>
                  </div>
                  <PatientJourneyTracker patientId={p.id} compact />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Journey Feed */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2">🔄 Flux en temps réel – Parcours patients</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
            {recentEvents.slice(0, 15).map(evt => {
              const toStep = JOURNEY_STEPS.find(s => s.key === evt.to);
              const fromStep = JOURNEY_STEPS.find(s => s.key === evt.from);
              return (
                <div key={evt.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs">
                  <span className="text-muted-foreground font-mono w-12">
                    {evt.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{evt.nhid}</Badge>
                  <span className="font-medium text-foreground">{evt.patientName}</span>
                  <span className="text-muted-foreground">{fromStep?.icon} → {toStep?.icon}</span>
                  <span className="text-primary font-medium">{toStep?.label}</span>
                  <span className="text-muted-foreground ml-auto">via {evt.module}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients aujourd\'hui', value: String(patients.length), color: 'text-primary' },
          { label: 'À l\'accueil', value: String(patientsAccueil.length), color: 'text-warning' },
          { label: 'En consultation', value: String(getPatientsByStep('consultation').length), color: 'text-secondary' },
          { label: 'Sortis', value: String(getPatientsByStep('sorti').length), color: 'text-muted-foreground' },
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
