import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.js';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  loginWithRole: (role: UserRole, email?: string) => Promise<UserProfile | null>;
  loginWithSupabase: (email: string, password: string) => Promise<UserProfile | null>;
  signupStudent: (payload: {
    full_name: string;
    registration_number: string;
    email: string;
    section: string;
    password: string;
  }) => Promise<void>;
  signupWithSupabase: (email: string, password: string, fullName: string) => Promise<void>;
  updateProfile: (fullName: string, avatarUrl?: string, section?: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const savedToken = localStorage.getItem('cc_auth_token');
        const savedUserStr = localStorage.getItem('cc_user');

        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            setUser(parsed);
          } catch (e) {
            localStorage.removeItem('cc_user');
          }
        }

        if (savedToken) {
          setToken(savedToken);
          // Try validating with backend /me
          try {
            const meRes = await api.getMe();
            if (meRes.success && meRes.data) {
              setUser(meRes.data);
              localStorage.setItem('cc_user', JSON.stringify(meRes.data));
            }
          } catch (err) {
            console.warn('Session verification fallback:', err);
          }
        } else {
          // Default demo preview session: Alex Chen (Student) for immediate out-of-the-box immersion
          await loginWithRole('student', 'alex.chen@student.srmist.edu.in');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const loginWithRole = async (role: UserRole, email?: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      const res = await api.devLogin(role, email);
      if (res.success && res.data) {
        setUser(res.data.user);
        setToken(res.data.token);
        localStorage.setItem('cc_auth_token', res.data.token);
        localStorage.setItem('cc_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
      return null;
    } catch (err) {
      console.error('Role login failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithSupabase = async (email: string, password: string): Promise<UserProfile | null> => {
    if (!supabase) {
      // If Supabase not configured, use local dev login with inferred role
      let inferredRole: UserRole = 'student';
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === 'admin@srmist.edu.in' || cleanEmail.includes('admin')) {
        inferredRole = 'admin';
      } else if (cleanEmail.includes('organizer') || cleanEmail.includes('acm')) {
        inferredRole = 'organizer';
      }
      return await loginWithRole(inferredRole, email.trim());
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        setToken(data.session.access_token);
        localStorage.setItem('cc_auth_token', data.session.access_token);
        const meRes = await api.getMe();
        if (meRes.success && meRes.data) {
          setUser(meRes.data);
          localStorage.setItem('cc_user', JSON.stringify(meRes.data));
          return meRes.data;
        }
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signupStudent = async (payload: {
    full_name: string;
    registration_number: string;
    email: string;
    section: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      // 1. If Supabase is active, create auth user in Supabase Auth
      if (supabase) {
        const { data, error: supaErr } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              full_name: payload.full_name,
              registration_number: payload.registration_number,
              section: payload.section,
              role: 'student',
            },
          },
        });
        if (supaErr) throw supaErr;

        if (data.session) {
          setToken(data.session.access_token);
          localStorage.setItem('cc_auth_token', data.session.access_token);
        }
      }

      // 2. Persist profile in backend store
      const res = await api.studentSignup(payload);
      if (res.success && res.data) {
        setUser(res.data.user);
        if (!token && res.data.token) {
          setToken(res.data.token);
          localStorage.setItem('cc_auth_token', res.data.token);
        }
        localStorage.setItem('cc_user', JSON.stringify(res.data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const signupWithSupabase = async (email: string, password: string, fullName: string) => {
    return signupStudent({
      full_name: fullName,
      registration_number: `REG-${Date.now().toString(16).slice(-6).toUpperCase()}`,
      email,
      section: 'CSE-A',
      password,
    });
  };

  const requestPasswordReset = async (email: string): Promise<string> => {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      return 'Password reset link sent to your registered email via Supabase Auth.';
    }
    const res = await api.recoverPassword(email);
    return res.data?.message || 'Password reset link dispatched.';
  };

  const updateProfile = async (fullName: string, avatarUrl?: string, section?: string) => {
    const res = await api.updateProfile({ full_name: fullName, avatar_url: avatarUrl, section });
    if (res.success && res.data) {
      setUser(res.data);
      localStorage.setItem('cc_user', JSON.stringify(res.data));
    }
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('cc_auth_token');
    localStorage.removeItem('cc_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithRole,
        loginWithSupabase,
        signupStudent,
        signupWithSupabase,
        requestPasswordReset,
        updateProfile,
        logout,
        isAuthenticated: !!user,
      }}
    >
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
