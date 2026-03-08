import React, { createContext, useContext, useState, useCallback } from 'react';
import { Role, USERS, DOCTOR_PROFILES, DoctorProfile } from '@/data/mockData';

interface AuthState {
  isAuthenticated: boolean;
  username: string;
  role: Role;
  name: string;
  doctorProfile: DoctorProfile | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false, username: '', role: 'doctor', name: '', doctorProfile: null,
  });

  const login = useCallback((username: string, password: string) => {
    const user = USERS[username];
    if (user && user.password === password) {
      const profile = user.role === 'doctor' ? (DOCTOR_PROFILES[username] || null) : null;
      setAuth({ isAuthenticated: true, username, role: user.role, name: user.name, doctorProfile: profile });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, username: '', role: 'doctor', name: '', doctorProfile: null });
  }, []);

  const switchRole = useCallback((role: Role) => {
    setAuth(prev => ({ ...prev, role, doctorProfile: role === 'doctor' ? prev.doctorProfile : null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};
