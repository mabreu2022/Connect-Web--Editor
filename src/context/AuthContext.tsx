import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UserProfile {
  id: number;
  nome: string;
  email: string;
  empresa: string;
  perfil: number; // 0=cliente, 1=admin
  plano: string;
  limites: { maxPaginas: number; maxProjetos: number; maxExportacoes: number };
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registro: (nome: string, email: string, senha: string, empresa?: string, planoId?: number, comprovantePix?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cwe_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get(`${API_URL}/auth/me`)
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('cwe_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, senha: string) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, senha });
    localStorage.setItem('cwe_token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setToken(data.token);
    setUser(data.user);
  };

  const registro = async (nome: string, email: string, senha: string, empresa?: string, planoId?: number, comprovantePix?: string) => {
    await axios.post(`${API_URL}/auth/registro`, { nome, email, senha, empresa, planoId, comprovantePix });
  };

  const logout = () => {
    localStorage.removeItem('cwe_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registro, logout, isAdmin: user?.perfil === 1 }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
