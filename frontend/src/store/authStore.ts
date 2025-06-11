import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStatus } from '../types';

export interface AuthFormState {
  phoneNumber: string;
  phoneCode: string;
  password: string;
  phoneCodeHash: string;
  step: 'phone' | 'code' | 'password';
}

export interface AuthStore {
  // Status
  authStatus: AuthStatus;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  
  // Form state
  formState: AuthFormState;
  
  // Actions
  setAuthStatus: (status: AuthStatus) => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Form actions
  setPhoneNumber: (phoneNumber: string) => void;
  setPhoneCode: (phoneCode: string) => void;
  setPassword: (password: string) => void;
  setPhoneCodeHash: (phoneCodeHash: string) => void;
  setStep: (step: 'phone' | 'code' | 'password') => void;
  
  resetForm: () => void;
  reset: () => void;
}

const initialFormState: AuthFormState = {
  phoneNumber: '',
  phoneCode: '',
  password: '',
  phoneCodeHash: '',
  step: 'phone',
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      authStatus: { authorized: false },
      loading: false,
      initializing: true,
      error: null,
      formState: initialFormState,
      
      // Status actions
      setAuthStatus: (authStatus) => set({ authStatus }),
      setLoading: (loading) => set({ loading }),
      setInitializing: (initializing) => set({ initializing }),
      setError: (error) => set({ error }),
      
      // Form actions
      setPhoneNumber: (phoneNumber) => 
        set((state) => ({
          formState: { ...state.formState, phoneNumber }
        })),
      
      setPhoneCode: (phoneCode) => 
        set((state) => ({
          formState: { ...state.formState, phoneCode }
        })),
      
      setPassword: (password) => 
        set((state) => ({
          formState: { ...state.formState, password }
        })),
      
      setPhoneCodeHash: (phoneCodeHash) => 
        set((state) => ({
          formState: { ...state.formState, phoneCodeHash }
        })),
      
      setStep: (step) => 
        set((state) => ({
          formState: { ...state.formState, step }
        })),
      
      resetForm: () => 
        set((state) => ({
          formState: initialFormState,
          error: null
        })),
      
      reset: () => 
        set({
          authStatus: { authorized: false },
          loading: false,
          error: null,
          formState: initialFormState,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        authStatus: state.authStatus,
      }),
    }
  )
); 