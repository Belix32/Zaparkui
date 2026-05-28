/**
 * ⚠️ SECURITY NOTE: Production Requirements
 * 
 * Current implementation uses localStorage for session persistence, which is 
 * acceptable for SPA with XSS protections but NOT fully secure.
 * 
 * For PRODUCTION deployment, implement:
 * 1. httpOnly cookies for session (requires backend proxy)
 * 2. CSRF tokens on all state-changing requests
 * 3. Content Security Policy (CSP) headers
 * 4. Subresource Integrity (SRI) for loaded scripts
 * 5. Use @supabase/ssr package with cookies in production
 * 
 * SECURITY AUDIT DATE: 2026-05
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getSupabaseClient,
  Profile as SupabaseUser,
  isSupabaseConfigured,
  createParking as createParkingDb,
  geocodeAddress
} from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at?: string;
  role?: 'user' | 'moderator' | 'admin' | 'partner';
}

export type UserRole = 'user' | 'moderator' | 'admin' | 'partner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isPartner: boolean;
  partnerId: string | null;
  hasAdminAccess: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
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
  latitude?: number;
  longitude?: number;
  district?: string;
  metro?: string;
  parkingType?: string;
  amenities?: string[];
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

// Encrypted session storage interface
interface StoredSession {
  id: string;
  email: string;
  role: string;
  expiry: number;
  hash: string;
}

// Derive encryption key from auth token (first 32 chars, padded if needed)
function deriveEncryptionKey(token: string): string {
  if (!token) return '';
  return token.padEnd(32, 'x').slice(0, 32);
}

// XOR cipher with key - simple obfuscation to prevent plaintext storage
function xorWithKey(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

// Encrypt session data: JSON → XOR → base64
function encryptData(data: StoredSession): string {
  const key = deriveEncryptionKey(localStorage.getItem(AUTH_TOKEN_KEY) || '');
  const json = JSON.stringify(data);
  if (!key) return btoa(json);
  return btoa(xorWithKey(json, key));
}

// Decrypt session data: base64 → XOR → JSON
function decryptData(encoded: string): StoredSession | null {
  try {
    const key = deriveEncryptionKey(localStorage.getItem(AUTH_TOKEN_KEY) || '');
    const decoded = atob(encoded);
    const json = key ? xorWithKey(decoded, key) : decoded;
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.expiry) {
      return null;
    }

    return parsed as StoredSession;
  } catch {
    return null;
  }
}

// Compute session integrity hash from data + auth token
function computeSessionHash(id: string, email: string, expiry: number, token: string): string {
  let hash = 0;
  const material = `${id}:${email}:${expiry}:${token}`;
  for (let i = 0; i < material.length; i++) {
    const chr = material.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash = hash | 0;
  }
  return (hash >>> 0).toString(36);
}

// Save minimal encrypted session (id, email, expiry, integrity hash)
function saveUserSession(user: User): void {
  const token = generateSecureToken();
  const expiry = Date.now() + SESSION_EXPIRY_MS;
  const hash = computeSessionHash(user.id, user.email, expiry, token);

  const sessionData: StoredSession = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    expiry,
    hash,
  };

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, encryptData(sessionData));
}

// Load and verify encrypted session, return minimal User if valid
function loadUserSession(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!stored || !token) return null;

    const session = decryptData(stored);
    if (!session) {
      clearSession();
      return null;
    }

    // Verify session integrity hash
    const expectedHash = computeSessionHash(session.id, session.email, session.expiry, token);
    if (session.hash !== expectedHash) {
      clearSession();
      return null;
    }

    // Check if session expired
    if (Date.now() > session.expiry) {
      clearSession();
      return null;
    }

    return {
      id: session.id,
      email: session.email,
      name: '',
      phone: '',
      role: normalizeRole(session.role),
    };
  } catch {
    clearSession();
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Normalize role string to valid values
function normalizeRole(role: string | undefined | null): 'user' | 'moderator' | 'admin' | 'partner' {
  if (role === 'admin' || role === 'moderator' || role === 'partner') return role;
  return 'user';
}
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get admin email from environment variable
function getAdminEmail(): string {
  return import.meta.env.VITE_ADMIN_EMAIL || '';
}

// Check if user is admin by email
function isAdminEmail(email: string): boolean {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  return email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

// Security: Validate password strength
function isValidPassword(password: string): { valid: boolean; error: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен быть не менее 8 символов' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну цифру' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-ZА-Я]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать хотя бы одну заглавную букву' };
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
      // Always try localStorage first as instant fallback
      const localUser = loadUserSession();
      
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured - demo mode');
        if (localUser) {
          setUser(localUser);
        }
        setIsLoading(false);
        return;
      }
      
      console.log('Supabase configured - initializing auth');
      const supabaseClient = getSupabaseClient();
      
      try {
        // Get session with timeout
        const sessionPromise = supabaseClient.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        // Race between Supabase and timeout
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (session?.user) {
          // Fetch user profile from users table - try multiple methods
          let userData = null;
          
          try {
            const { data: userByAuthId } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('auth_id', session.user.id)
              .single();
            
            if (userByAuthId) {
              userData = userByAuthId;
            } else {
              const { data: userByEmail } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              if (userByEmail) {
                userData = userByEmail;
              }
            }
          } catch (profileErr) {
            console.log('Profile fetch failed, using local fallback');
          }

          if (userData) {
            const userObj: User = {
              id: session.user.id,
              name: userData.name || session.user.email?.split('@')[0] || 'Пользователь',
              email: userData.email || session.user.email || '',
              phone: userData.phone || '',
              created_at: userData.created_at,
              role: userData?.role ? normalizeRole(userData.role) : (isAdminEmail(session.user.email || '') ? 'admin' as const : 'user' as const),
            };
            setUser(userObj);
            // Save to localStorage for reliability
            saveUserSession(userObj);
          } else if (localUser) {
            // Use localStorage fallback
            setUser(localUser);
          } else {
            // Create user from session data even without profile
            const fallbackUser = {
              id: session.user.id,
              name: session.user.email?.split('@')[0] || 'Пользователь',
              email: session.user.email || '',
              phone: '',
              role: normalizeRole(isAdminEmail(session.user.email || '') ? 'admin' : 'user'),
            };
            setUser(fallbackUser);
            saveUserSession(fallbackUser);
          }
        } else {
          // No Supabase session - use localStorage
          if (localUser) {
            setUser(localUser);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Always fallback to localStorage if anything fails
        if (localUser) {
          setUser(localUser);
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
            // Fetch user profile from users table - try multiple methods
            let userData = null;
            
            const { data: userByAuthId } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('auth_id', session.user.id)
              .single();
            
            if (userByAuthId) {
              userData = userByAuthId;
            } else {
              // Fallback: try by email
              const { data: userByEmail } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              if (userByEmail) {
                userData = userByEmail;
              }
            }

            if (userData) {
              setUser({
                id: session.user.id,
                name: userData.name || session.user.email?.split('@')[0] || 'Пользователь',
                email: userData.email || session.user.email || '',
                phone: userData.phone || '',
                created_at: userData.created_at,
                role: userData?.role ? normalizeRole(userData.role) : (isAdminEmail(session.user.email || '') ? 'admin' as const : 'user' as const),
              });
            } else {
              // Fallback: create user from session data even without profile
              setUser({
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'Пользователь',
                email: session.user.email || '',
                phone: '',
                role: normalizeRole(isAdminEmail(session.user.email || '') ? 'admin' : 'user'),
              });
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: string }> => {
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
        return { success: true, role: existingUser.role };
      }
      
      const mockUser: User = {
        id: generateSecureToken().substring(0, 16),
        name: email.toLowerCase().split('@')[0],
        email: email.toLowerCase().trim(),
        phone: '+7 (999) 000-00-00',
        role: isAdminEmail(email) ? 'admin' : 'user',
      };
      setUser(mockUser);
      saveUserSession(mockUser);
      return { success: true, role: mockUser.role };
    }
    
    // Supabase is configured - use real auth
    console.log('Using Supabase auth');
    
    // Retry logic for transient network errors
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const supabaseClient = getSupabaseClient();
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          console.error('Supabase auth error:', error);
          
          // Network-related errors — retry
          if (
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ERR_CONNECTION') ||
            error.message.includes('retryable')
          ) {
            if (attempt < maxRetries) {
              console.log(`Retrying login (attempt ${attempt + 2}/${maxRetries + 1})...`);
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
            return { success: false, error: 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова.' };
          }
          
          // Check for specific errors (non-retryable)
          if (error.message.includes('Invalid login credentials')) {
            return { success: false, error: 'Неверный email или пароль. Проверьте данные.' };
          }
          if (error.message.includes('Email not confirmed')) {
            return { success: false, error: 'Email не подтверждён. Проверьте почту.' };
          }
          if (error.message.includes('User already registered')) {
            return { success: false, error: 'Пользователь с таким email уже существует.' };
          }
          if (error.message.includes('Invalid email')) {
            return { success: false, error: 'Неверный формат email.' };
          }
          // Default Russian error message
          return { success: false, error: 'Ошибка входа. Попробуйте позже.' };
        }

        // ─── Success ──────────────────────────────────────────
        if (data?.user) {
          let userData = null;
          
          const { data: userByAuthId } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();
          
          if (userByAuthId) {
            userData = userByAuthId;
          } else {
            const { data: userByEmail } = await supabaseClient
              .from('profiles')
              .select('*')
              .eq('email', data.user.email)
              .single();
            
            if (userByEmail) {
              userData = userByEmail;
            }
          }

          const userObj: User = userData ? {
            id: data.user.id,
            name: userData.name || data.user.email?.split('@')[0] || 'Пользователь',
            email: userData.email || data.user.email || email,
            phone: userData.phone || '',
            created_at: userData.created_at,
            role: userData?.role ? normalizeRole(userData.role) : (isAdminEmail(email) ? 'admin' as const : 'user' as const),
          } : {
            id: data.user.id,
            name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email || email,
            phone: '',
            role: isAdminEmail(email) ? 'admin' as const : 'user' as const,
          };
          
          setUser(userObj);
          saveUserSession(userObj);
        }

        return { success: true, role: data?.user ? (isAdminEmail(email) ? 'admin' : 'user') : undefined };
        
      } catch (networkError) {
        console.error(`Login error (attempt ${attempt + 1}/${maxRetries + 1}):`, networkError);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return { success: false, error: 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова.' };
      }
    }
    
    // Fallback (shouldn't reach here)
    return { success: false, error: 'Ошибка входа. Попробуйте позже.' };
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
      const isAdmin = isAdminEmail(email);
      
      const mockUser: User = {
        id: generateSecureToken().substring(0, 16),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        role: isAdminEmail(email) ? 'admin' : 'user',
      };
      setUser(mockUser);
      saveUserSession(mockUser);
      return { success: true };
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Retry logic for transient network errors
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const supabaseClient = getSupabaseClient();

        // Sign up with Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: sanitizeInput(name.trim()),
              phone: phone.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) {
          console.error('Supabase signup error:', error);
          
          // Network-related errors — retry
          if (
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('ERR_CONNECTION') ||
            error.message.includes('retryable')
          ) {
            if (attempt < maxRetries) {
              console.log(`Retrying signup (attempt ${attempt + 2}/${maxRetries + 1})...`);
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
            return { success: false, error: 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова.' };
          }
          
          // Non-retryable errors
          if (error.message.includes('User already registered')) {
            return { success: false, error: 'Пользователь с таким email уже существует.' };
          }
          if (error.message.includes('Password')) {
            return { success: false, error: 'Пароль слишком простой. Используйте минимум 8 символов.' };
          }
          if (error.message.includes('Invalid email') || error.message.includes('email_address_invalid')) {
            return { success: false, error: 'Неверный формат email.' };
          }
          return { success: false, error: 'Ошибка регистрации. Попробуйте позже.' };
        }

        // If user is automatically confirmed (or disable confirmation)
        if (data?.user) {
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .upsert({
              auth_id: data.user.id,
              email: normalizedEmail,
              name: sanitizeInput(name.trim()),
              phone: phone.trim(),
              role: isAdminEmail(normalizedEmail) ? 'admin' : 'user',
            }, { onConflict: 'auth_id' });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            await supabaseClient
              .from('profiles')
              .update({
                name: sanitizeInput(name.trim()),
                phone: phone.trim(),
                role: isAdminEmail(normalizedEmail) ? 'admin' : 'user',
              })
              .eq('auth_id', data.user.id);
          }

          setUser({
            id: data.user.id,
            name: sanitizeInput(name.trim()),
            email: normalizedEmail,
            phone: phone.trim(),
            role: isAdminEmail(normalizedEmail) ? 'admin' : 'user',
          });

          return { success: true };
        }

        // Email confirmation required
        return { success: true };
        
      } catch (networkError) {
        console.error(`Registration error (attempt ${attempt + 1}/${maxRetries + 1}):`, networkError);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return { success: false, error: 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова.' };
      }
    }
    
    return { success: false, error: 'Ошибка регистрации. Попробуйте позже.' };
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabaseClient = getSupabaseClient();
        await supabaseClient.auth.signOut();
      }
      clearSession();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      clearSession();
      setUser(null);
    }
  };

  const addParking = async (parking: Omit<ParkingItem, 'id'>) => {
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

    // Save to Supabase (required for shared parkings)
    if (!isSupabaseConfigured() || !user) {
      console.error('Supabase not configured or user not logged in');
      throw new Error('Необходимо войти в аккаунт');
    }

    try {
      const supabase = getSupabaseClient();
      
      // Geocode address to get coordinates
      const coords = await geocodeAddress(parking.address);
      
      const { data, error } = await supabase
        .from('parkings')
        .insert({
          title: sanitizeInput(parking.title.trim()),
          address: sanitizeInput(parking.address.trim()),
          price: priceCheck.value,
          spots: spotsCheck.value,
          description: parking.description ? sanitizeInput(parking.description.trim()) : undefined,
          owner_id: user.id,
          owner_email: user.email,
          is_active: true,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          district: parking.district || null,
          metro: parking.metro || null,
          parking_type: parking.parkingType || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error saving parking:', error);
        throw new Error('Не удалось сохранить парковку: ' + error.message);
      } else if (data) {
        const updated = [...myParkings, data];
        setMyParkings(updated);
        return;
      }
    } catch (supabaseError: any) {
      console.error('Error saving to Supabase:', supabaseError);
      throw new Error(supabaseError?.message || 'Ошибка сохранения');
    }

    throw new Error('Не удалось сохранить парковку');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: user?.role === 'admin',
        isModerator: user?.role === 'admin' || user?.role === 'moderator',
        isPartner: user?.role === 'partner',
        partnerId: user?.role === 'partner' ? user.id : null,
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