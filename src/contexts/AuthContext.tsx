import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getSupabaseClient,
  User as SupabaseUser,
  isSupabaseConfigured
} from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at?: string;
  role?: 'user' | 'moderator' | 'admin';
}

export type UserRole = 'user' | 'moderator' | 'admin';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  hasAdminAccess: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addParking: (parking: Omit<ParkingItem, 'id'>) => void;
  myParkings: ParkingItem[];
}

export interface ParkingItem {
  id: string;
  title: string;
  address: string;
  price: number;
  spots: number;
  description?: string;
  image?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = 'zaparkyi_user';
const AUTH_TOKEN_KEY = 'zaparkyi_token';
const PARKING_KEY = 'zaparkyi_parkings';

// Session expires in 30 days
const SESSION_EXPIRY_DAYS = 30;
const SESSION_EXPIRY_MS = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Security: Generate a secure random token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Save user with timestamp for session expiry
function saveUserSession(user: User): void {
  const sessionData = {
    user,
    timestamp: Date.now(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(sessionData));
  localStorage.setItem(AUTH_TOKEN_KEY, generateSecureToken());
}

// Load user if session not expired
function loadUserSession(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    
    const sessionData = JSON.parse(stored);
    const { user, timestamp } = sessionData;
    
    // Check if session expired (30 days)
    if (Date.now() - timestamp > SESSION_EXPIRY_MS) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
    
    return user;
  } catch {
    return null;
  }
}

// Security: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Security: Validate password strength
function isValidPassword(password: string): { valid: boolean; error: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен быть не менее 6 символов' };
  }
  return { valid: true, error: '' };
}

// Security: Validate phone format
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Security: Validate and sanitize parking data
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 500);
}

// Security: Validate numeric values
function safeParseNumber(value: string): { valid: boolean; value: number } {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { valid: false, value: 0 };
  }
  if (num > 1000000) {
    return { valid: false, value: 0 };
  }
  return { valid: true, value: Math.floor(num) };
}

// Convert Supabase user to App User
function mapSupabaseUserToAppUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    name: supabaseUser.name,
    email: supabaseUser.email,
    phone: supabaseUser.phone || '',
    created_at: supabaseUser.created_at,
    role: (supabaseUser as any).role || 'user',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [myParkings, setMyParkings] = useState<ParkingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Supabase client and set up auth listener
    const initializeAuth = async () => {
      try {
        // Check FIRST if Supabase is configured
        if (!isSupabaseConfigured()) {
          // Load from localStorage in demo mode - with session expiry check
          const sessionUser = loadUserSession();
          if (sessionUser) {
            setUser(sessionUser);
          }
          setIsLoading(false);
          return;
        }
        
        const supabaseClient = getSupabaseClient();
        
        // Get initial session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session?.user) {
          // Fetch user profile from users table
          const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error('Error fetching user profile:', userError);
          } else if (userData) {
            setUser(mapSupabaseUserToAppUser(userData as unknown as SupabaseUser));
          }
        }

        // Load parking data from localStorage (local backup)
        const storedParkings = localStorage.getItem(PARKING_KEY);
        if (storedParkings) {
          try {
            const parsed = JSON.parse(storedParkings);
            if (Array.isArray(parsed)) {
              setMyParkings(parsed);
            }
          } catch (e) {
            localStorage.removeItem(PARKING_KEY);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Fallback to localStorage if Supabase fails
        const sessionUser = loadUserSession();
        if (sessionUser) {
          setUser(sessionUser);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    let authListener: (() => void) | undefined;

    try {
      const supabaseClient = getSupabaseClient();
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            // Fetch user profile from users table
            const { data: userData } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userData) {
              setUser(mapSupabaseUserToAppUser(userData as unknown as SupabaseUser));
            }
          } else {
            setUser(null);
          }
        }
      );
      authListener = () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      if (authListener) {
        authListener();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate email format
    if (!email || !isValidEmail(email)) {
      return { success: false, error: 'Неверный формат email' };
    }

    // Validate password
    if (!password || password.length < 1) {
      return { success: false, error: 'Введите пароль' };
    }

// IMPORTANT: Supabase is configured - use it
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - using demo mode');
      // Demo mode only if not configured
      const existingUser = loadUserSession();
      if (existingUser && existingUser.email?.toLowerCase() === email.toLowerCase().trim()) {
        setUser(existingUser);
        saveUserSession(existingUser);
        return { success: true };
      }
      
      const mockUser: User = {
        id: generateSecureToken().substring(0, 16),
        name: email.toLowerCase().split('@')[0],
        email: email.toLowerCase().trim(),
        phone: '+7 (999) 000-00-00',
      };
      setUser(mockUser);
      saveUserSession(mockUser);
      return { success: true };
    }
    
    // Supabase is configured - use real auth
    console.log('Using Supabase auth');
    try {
      const supabaseClient = getSupabaseClient();
      console.log('Attempting login with:', email.toLowerCase().trim());
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Check for specific errors
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Неверный email или пароль. Проверьте данные или зарегистрируйтесь.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Email не подтвержден. Проверьте почту.' };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Fetch user profile from users table
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('Error fetching user profile:', userError);
          // Still allow login even if profile fetch fails
          setUser({
            id: data.user.id,
            name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email || email,
            phone: '',
          });
        } else if (userData) {
          setUser(mapSupabaseUserToAppUser(userData as unknown as SupabaseUser));
        }
      }

      return { success: true };
    } catch (supabaseError) {
      console.error('Supabase login error:', supabaseError);
      // Don't fallback to demo mode in production - show error instead
      return { success: false, error: 'Ошибка подключения к серверу. Попробуйте позже.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Validate name
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Имя должно быть не менее 2 символов' };
    }

    // Validate email
    if (!isValidEmail(email)) {
      return { success: false, error: 'Неверный формат email' };
    }

    // Validate phone
    if (!isValidPhone(phone)) {
      return { success: false, error: 'Неверный формат телефона' };
    }

    // Validate password strength
    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.error };
    }

    // Check if Supabase is configured - if not, use demo mode
    if (!isSupabaseConfigured()) {
      // Check if email already exists - loadUserSession checks expiry too
      const existingUser = loadUserSession();
      if (existingUser && existingUser.email?.toLowerCase() === email.toLowerCase().trim()) {
        return { success: false, error: 'Пользователь с таким email уже существует' };
      }
      
      // Check if this is the admin email
      const isAdminEmail = email.toLowerCase().trim() === 'ilya.cheplya@yandex.ru';
      
      const mockUser: User = {
        id: generateSecureToken().substring(0, 16),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        role: isAdminEmail ? 'admin' : 'user',
      };
      setUser(mockUser);
      saveUserSession(mockUser);
      return { success: true };
    }

    try {
      const supabaseClient = getSupabaseClient();
      const normalizedEmail = email.toLowerCase().trim();

      // Sign up with Supabase Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: sanitizeInput(name.trim()),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        // Handle specific error codes
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Пользователь с таким email уже существует' };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Create user profile in users table
        const { error: profileError } = await supabaseClient
          .from('users')
          .insert({
            id: data.user.id,
            email: normalizedEmail,
            name: sanitizeInput(name.trim()),
            phone: phone.trim(),
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway - user is registered in auth
        }

        // Set the user in state
        setUser({
          id: data.user.id,
          name: sanitizeInput(name.trim()),
          email: normalizedEmail,
          phone: phone.trim(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Ошибка регистрации. Попробуйте позже.' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabaseClient = getSupabaseClient();
        await supabaseClient.auth.signOut();
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addParking = (parking: Omit<ParkingItem, 'id'>) => {
    // Validate all inputs
    if (!parking.title || parking.title.trim().length < 2) {
      console.error('Invalid title');
      return;
    }

    if (!parking.address || parking.address.trim().length < 5) {
      console.error('Invalid address');
      return;
    }

    // Validate and sanitize numeric values
    const priceCheck = safeParseNumber(String(parking.price));
    if (!priceCheck.valid) {
      console.error('Invalid price');
      return;
    }

    const spotsCheck = safeParseNumber(String(parking.spots));
    if (!spotsCheck.valid || spotsCheck.value === 0) {
      console.error('Invalid spots');
      return;
    }

    const newParking: ParkingItem = {
      id: generateSecureToken().substring(0, 16),
      title: sanitizeInput(parking.title.trim()),
      address: sanitizeInput(parking.address.trim()),
      price: priceCheck.value,
      spots: spotsCheck.value,
      description: parking.description ? sanitizeInput(parking.description.trim()) : undefined,
    };

    const updated = [...myParkings, newParking];
    setMyParkings(updated);
    localStorage.setItem(PARKING_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.role === 'admin',
        isModerator: user?.role === 'admin' || user?.role === 'moderator',
        hasAdminAccess: user?.role === 'admin' || user?.role === 'moderator',
        login,
        register,
        logout,
        addParking,
        myParkings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}