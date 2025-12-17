import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, AuthResponse, ApiUser } from '@/services/api';

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, full_name?: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.auth.login(email, password);
      if (response.user && response.token) {
        setUser(response.user);
        setToken(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
      }
      return response;
    } catch (error) {
      console.error("Login error", error);
      return { error: "Erro ao conectar com o servidor." };
    }
  };

  const register = async (email: string, password: string, full_name?: string): Promise<AuthResponse> => {
    try {
      const response = await api.auth.register(email, password, full_name);
      return response;
    } catch (error) {
      console.error("Register error", error);
      return { error: "Erro ao conectar com o servidor." };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
