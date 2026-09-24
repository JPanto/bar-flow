import React, { createContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { syncService } from '../services/syncService';

export type UserRole = 'manager' | 'staff' | 'guest';

export interface SignUpOptions {
  name?: string;
  role?: 'manager' | 'staff';
  tenantId?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  tenantId: string;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | Error | null;
  }>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | Error | null;
  }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRole(user: User | null): UserRole {
  if (!user) return 'guest';
  const role =
    user.user_metadata?.role ||
    user.app_metadata?.role ||
    (user.role && user.role !== 'authenticated' ? user.role : undefined);
  if (role === 'manager') return 'manager';
  return 'staff';
}

function extractTenantId(user: User | null): string {
  if (!user) return 'default';
  return (
    user.user_metadata?.tenant_id ||
    user.user_metadata?.tenantId ||
    user.app_metadata?.tenant_id ||
    user.app_metadata?.tenantId ||
    'default'
  );
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [tenantId, setTenantId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    if (nextSession && nextUser) {
      const resolvedRole = extractRole(nextUser);
      const resolvedTenant = extractTenantId(nextUser);
      setRole(resolvedRole);
      setTenantId(resolvedTenant);
      syncService.setAuthToken(nextSession.access_token);
      syncService.fetchInitialState();
      syncService.triggerSync();
    } else {
      setRole('guest');
      setTenantId('default');
      syncService.setAuthToken(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Check existing active session on mount
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('Error reading active session:', error);
        }
        applySession(data?.session ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Unexpected error in getSession:', err);
        if (isMounted) setIsLoading(false);
      });

    // Listen to Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      applySession(currentSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [applySession]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { data: null, error };
      }
      if (data?.session) {
        applySession(data.session);
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    options?: SignUpOptions
  ) => {
    try {
      const assignedRole = options?.role || 'staff';
      const assignedTenantId = options?.tenantId || 'default';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: options?.name || '',
            role: assignedRole,
            tenant_id: assignedTenantId,
            tenantId: assignedTenantId,
          },
        },
      });

      if (error) {
        return { data: null, error };
      }
      if (data?.session) {
        applySession(data.session);
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      applySession(null);
      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      applySession(null);
      return { error: err };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    tenantId,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
