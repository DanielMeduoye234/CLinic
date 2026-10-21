'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import { Profile, DoctorProfile, UserRole } from './types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  doctorProfile: DoctorProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      // 0. Check if user is restricted by admin
      const isRestricted = currentUser.app_metadata?.moderation_status === 'banned' || 
                           currentUser.app_metadata?.moderation_status === 'suspended' ||
                           Boolean(currentUser.app_metadata?.is_banned) ||
                           Boolean(currentUser.app_metadata?.is_suspended);

      if (isRestricted) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setDoctorProfile(null);
        return;
      }

      // 1. Fetch user profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (prof) {
        setProfile(prof as Profile);

        // 2. If doctor, fetch doctor profile
        if (prof.role === 'doctor') {
          const { data: doc } = await supabase
            .from('doctor_profiles')
            .select('*')
            .eq('profile_id', currentUser.id)
            .maybeSingle();
          if (doc) {
            setDoctorProfile(doc as DoctorProfile);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
        setDoctorProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setDoctorProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        doctorProfile,
        role: profile?.role ?? null,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
