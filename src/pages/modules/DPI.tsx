import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOCK_PATIENTS, SERVICES } from '@/data/mockData';
import {
  FileText, Clock, FlaskConical, ScanLine, AlertTriangle, Pill, Heart,
  Mic, Sparkles, Search, User, Send
} from 'lucide-react';
import { toast } from 'sonner';

const DPI = () => {
  const [selectedPatientId, setSelectedPatientId] = useState(MOCK_PATIENTS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [consultNote, setConsultNote] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [ordonnance, setOrdonnance] = useState('');
  const [examens, setExamens] = useState('');
  const [cim10Search, setCim10Search] = useState('');

  const patient = MOCK_PATIENTS.find(p => p.id === selectedPatientId)!;
  const filtered = MOCK_PATIENTS.filter(p =>
    `${p.prenom} ${p.nom} ${p.nhid}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveConsultation = () => {
    toast.success('Consultation enregistrée', {
      description: `Dossier de ${patient.prenom} ${patient.nom} mis à jour. Prescription envoyée à la pharmacie.`
    });
  };

  const handleVoiceNote = () => {
    toast.info('🎤 Dictée vocale simulée', { description: 'Patient présente fièvre depuis 3 jours avec céphalées...' });
    setConsultNote(prev => prev + 'Patient présente fièvre depuis 3 jours avec céphalées et myalgies. ');
  };

  const handleAISummary = () => {
    toast.success('🤖 Résumé IA généré', { description: 'Résumé de sortie prêt pour validation' });
  };

  const CIM10_SUGGESTIONS = [
    { code: 'B50.9', label: 'Paludisme à P. falciparum, sans précision' },
    { code: 'A39.0', label: 'Méningite à méningocoque' },
    { code: 'I21.0', label: 'Infarctus aigu du myocarde, paroi antérieure' },
    { code: 'J18.9', label: 'Pneumopathie, sans précision' },
    { code: 'E11.9', label: 'Diabète sucré de type 2' },
    { code: 'O14.1', label: 'Pré-éclampsie sévère' },
  ].filter(c => cim10Search && (c.code.toLowerCase().includes(cim10Search.toLowerCase()) || c.label.toLowerCase().includes(cim10Search.toLowerCase())));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dossier Patient Informatisé (DPI)</h1>
        <p className="text-muted-foreground text-sm">Vue 360° du patient – Accès réservé aux médecins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Patient list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <Input placeholder="Rechercher patient..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8" />
          </CardHeader>
          <CardContent className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`p-2 rounded-lg cursor-pointer transition-all ${selectedPatientId === p.id ? 'bg-accent border-primary border' : 'hover:bg-muted/50 border border-transparent'}`}
              >
                <p className="text-sm font-medium text-foreground">{p.prenom} {p.nom}</p>
                <p className="text-[11px] text-muted-foreground">{p.nhid} • {p.age} ans • {p.sexe}</p>
                <p className="text-[11px] text-primary">{p.pathologieActuelle}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Patient DPI */}
        <div className="lg:col-span-3 space-y-4">
          {/* Patient header */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{patient.prenom} {patient.nom}</h2>
                    <p className="text-sm text-muted-foreground">{patient.nhid} • {patient.age} ans • {patient.sexe} • {patient.groupeSanguin}</p>
                    <p className="text-sm text-primary font-medium">{patient.pathologieActuelle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.length > 0 && (
                    <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> Allergies: {patient.allergies.join(', ')}</Badge>
                  )}
                  <Badge variant="outline">{SERVICES.find(s => s.id === patient.service)?.name}</Badge>
                </div>
              </div>
              {/* Vitals */}
              {patient.vitaux && (
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {[
                    { label: 'TA', value: patient.vitaux.tension, unit: 'mmHg' },
                    { label: 'T°', value: patient.vitaux.temperature, unit: '°C' },
                    { label: 'FC', value: patient.vitaux.pouls, unit: 'bpm' },
                    { label: 'SpO2', value: patient.vitaux.spo2, unit: '%' },
                    { label: 'Poids', value: patient.vitaux.poids, unit: 'kg' },
                  ].map(v => (
                    <div key={v.label} className="text-center p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">{v.label}</p>
                      <p className="text-sm font-bold text-foreground">{v.value} <span className="text-xs font-normal">{v.unit}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DPI Tabs */}
          <Tabs defaultValue="consultation" className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted p-1">
              <TabsTrigger value="consultation" className="gap-1 text-xs"><FileText className="w-3 h-3" />Consultation</TabsTrigger>
              <TabsTrigger value="historique" className="gap-1 text-xs"><Clock className="w-3 h-3" />Historique</TabsTrigger>
              <TabsTrigger value="labo" className="gap-1 text-xs"><FlaskConical className="w-3 h-3" />Laboratoire</TabsTrigger>
              <TabsTrigger value="imagerie" className="gap-1 text-xs"><ScanLine className="w-3 h-3" />Imagerie</TabsTrigger>
              <TabsTrigger value="prescriptions" className="gap-1 text-xs"><Pill className="w-3 h-3" />Ordonnances</TabsTrigger>
              <TabsTrigger value="allergies" className="gap-1 text-xs"><AlertTriangle className="w-3 h-3" />Allergies</TabsTrigger>
            </TabsList>

            {/* CONSULTATION TAB */}
            <TabsContent value="consultation" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Nouvelle Consultation</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Médecin traitant</label>
                      <Input value="Dr. Ibrahim Moussa" readOnly className="bg-muted/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Service</label>
                      <Select defaultValue={patient.service}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SERVICES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* CIM-10 search */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Diagnostic (CIM-10)</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        placeholder="Rechercher code CIM-10..."
                        value={cim10Search || diagnostic}
                        onChange={e => { setCim10Search(e.target.value); setDiagnostic(e.target.value); }}
                      />
                    </div>
                    {CIM10_SUGGESTIONS.length > 0 && (
                      <div className="border rounded-md mt-1 bg-card shadow-md">
                        {CIM10_SUGGESTIONS.map(c => (
                          <div key={c.code} className="p-2 hover:bg-muted cursor-pointer text-sm border-b last:border-0" onClick={() => { setDiagnostic(`${c.code} – ${c.label}`); setCim10Search(''); }}>
                            <span className="font-mono text-primary mr-2">{c.code}</span>{c.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Notes de consultation</label>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleVoiceNote}>
                        <Mic className="w-3 h-3" /> Dictée vocale
                      </Button>
                    </div>
                    <Textarea placeholder="Anamnèse, examen clinique, observations..." value={consultNote} onChange={e => setConsultNote(e.target.value)} rows={4} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Ordonnance</label>
                    <Textarea placeholder="Médicaments, posologie, durée..." value={ordonnance} onChange={e => setOrdonnance(e.target.value)} rows={3} />
                    {patient.allergies.length > 0 && ordonnance.toLowerCase().includes('pénicilline') && (
                      <Badge variant="destructive" className="gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> ALERTE: Conflit avec allergie connue – Pénicilline!</Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Examens à prescrire</label>
                    <Textarea placeholder="Examens de laboratoire, imagerie..." value={examens} onChange={e => setExamens(e.target.value)} rows={2} />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 gap-1" onClick={handleSaveConsultation}><Send className="w-4 h-4" /> Enregistrer & Envoyer</Button>
                    <Button variant="outline" className="gap-1" onClick={handleAISummary}><Sparkles className="w-4 h-4" /> Résumé IA</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* HISTORIQUE TAB */}
            <TabsContent value="historique">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.consultations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune consultation précédente</p>
                  ) : patient.consultations.map(c => (
                    <div key={c.id} className="p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.docteur} – {c.service}</p>
                          <p className="text-xs text-muted-foreground">{c.date}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-primary mb-1">{c.diagnostic}</p>
                      <p className="text-sm text-foreground mb-2">{c.notes}</p>
                      <p className="text-sm text-muted-foreground"><strong>Ordonnance:</strong> {c.ordonnance}</p>
                      {c.examens.length > 0 && (
                        <div className="flex gap-1 mt-2">{c.examens.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}</div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* LABO TAB */}
            <TabsContent value="labo">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.labResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun résultat de laboratoire</p>
                  ) : patient.labResults.map(l => (
                    <div key={l.id} className="p-4 rounded-lg border border-border">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{l.type} – {l.date}</p>
                        <Badge variant={l.statut === 'termine' ? 'default' : 'secondary'}>{l.statut === 'termine' ? 'Terminé' : 'En cours'}</Badge>
                      </div>
                      <div className="space-y-1">
                        {l.resultats.map((r, i) => (
                          <div key={i} className="grid grid-cols-4 gap-2 text-xs p-1 rounded bg-muted/30">
                            <span className="font-medium text-foreground">{r.parametre}</span>
                            <span className={r.statut === 'anormal' ? 'text-destructive font-bold' : 'text-foreground'}>{r.valeur}</span>
                            <span className="text-muted-foreground">{r.normal}</span>
                            <Badge variant={r.statut === 'anormal' ? 'destructive' : 'outline'} className="text-[10px] w-fit">{r.statut === 'anormal' ? 'ANORMAL' : 'Normal'}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* IMAGERIE TAB */}
            <TabsContent value="imagerie">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.imagingResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun résultat d'imagerie</p>
                  ) : patient.imagingResults.map(img => (
                    <div key={img.id} className="p-4 rounded-lg border border-border">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{img.type} – {img.zone}</p>
                        <Badge variant={img.statut === 'termine' ? 'default' : 'secondary'}>{img.statut === 'termine' ? 'Terminé' : 'En cours'}</Badge>
                      </div>
                      <p className="text-sm text-foreground">{img.interpretation}</p>
                      <p className="text-xs text-muted-foreground mt-1">{img.date}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PRESCRIPTIONS TAB */}
            <TabsContent value="prescriptions">
              <Card>
                <CardContent className="p-4 space-y-3">
                  {patient.prescriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune ordonnance</p>
                  ) : patient.prescriptions.map(p => (
                    <div key={p.id} className="p-4 rounded-lg border border-border">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">Ordonnance du {p.date}</p>
                        <Badge variant={p.statut === 'delivre' ? 'default' : 'secondary'}>{p.statut === 'delivre' ? 'Délivré' : 'En attente'}</Badge>
                      </div>
                      {p.medicaments.map((m, i) => (
                        <div key={i} className="text-sm text-foreground">• {m.nom} – {m.dosage} – {m.frequence} – {m.duree}</div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ALLERGIES TAB */}
            <TabsContent value="allergies">
              <Card>
                <CardContent className="p-4">
                  {patient.allergies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune allergie connue</p>
                  ) : (
                    <div className="space-y-2">
                      {patient.allergies.map(a => (
                        <Badge key={a} variant="destructive" className="gap-1 mr-2 text-sm"><AlertTriangle className="w-3 h-3" /> {a}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default DPI;
