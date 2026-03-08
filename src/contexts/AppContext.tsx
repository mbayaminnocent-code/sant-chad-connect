import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;
  solarLevel: number;
  starlinkSignal: number;
  currentHospital: string;
  setCurrentHospital: (h: string) => void;
  language: 'fr' | 'ar';
  setLanguage: (l: 'fr' | 'ar') => void;
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'time'>) => void;
  isSyncing: boolean;
  startSync: () => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  time: string;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [currentHospital, setCurrentHospital] = useState('CHU La Renaissance - N\'Djamena');
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'warning', message: 'Alerte: Stock ACT critique (45 unités)', time: '08:30' },
    { id: '2', type: 'info', message: 'Résultat labo disponible – Patient TCD-2024-00001', time: '08:15' },
    { id: '3', type: 'success', message: 'Synchronisation Starlink réussie – 147 dossiers', time: '07:45' },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Apply RTL direction and lang attribute when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const addNotification = (n: Omit<Notification, 'id' | 'time'>) => {
    const now = new Date();
    setNotifications(prev => [{
      ...n, id: Date.now().toString(), time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    }, ...prev]);
  };

  const startSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      addNotification({ type: 'success', message: 'Synchronisation via Starlink terminée – 23 dossiers mis à jour' });
    }, 3000);
  };

  return (
    <AppContext.Provider value={{
      isOffline, setIsOffline, solarLevel: 78, starlinkSignal: 85,
      currentHospital, setCurrentHospital, language, setLanguage,
      notifications, addNotification, isSyncing, startSync,
    }}>
      {children}
    </AppContext.Provider>
  );
};
