import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'salesperson' | 'superadmin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (loginIdentifier: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    username: string;
    full_name?: string;
    phone?: string;
    password: string;
  }) => Promise<User>;
  logout: () => void;
  updateProfile: (payload: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('sevee_token');
      if (storedToken) {
        try {
          setToken(storedToken);
          // Set authorization header manually for the initial verification call
          const res = await client.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(res.data);
        } catch (error) {
          console.error('Session initialization failed, logging out:', error);
          localStorage.removeItem('sevee_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (loginIdentifier: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await client.post('/auth/login', { loginIdentifier, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('sevee_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return receivedUser;
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const register = async (payload: {
    email: string;
    username: string;
    full_name?: string;
    phone?: string;
    password: string;
  }): Promise<User> => {
    setLoading(true);
    try {
      const res = await client.post('/auth/register', payload);
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem('sevee_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      setLoading(false);
      return receivedUser;
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.error || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('sevee_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (payload: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
  }): Promise<User> => {
    try {
      const res = await client.put('/auth/profile', payload);
      const updatedUser = res.data;
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      throw error.response?.data?.error || 'Failed to update profile';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
