import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'zaparkyi_auth';
const USER_KEY = 'zaparkyi_user';
const PARKING_KEY = 'zaparkyi_parkings';
const AUTH_TOKEN_KEY = 'zaparkyi_token';

// Security: Generate a secure random token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Security: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Security: Validate password strength
function isValidPassword(password: string): { valid: boolean; error: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Пароль должен быть не менее 8 символов' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать латинские буквы' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Пароль должен содержать цифры' };
  }
  return { valid: true, error: '' };
}

// Security: Validate phone format
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Security: Simple hash function for demo purposes (in production use bcrypt)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Security: Validate and sanitize parking data
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 500); // Limit length
}

// Security: Validate numeric values
function safeParseNumber(value: string): { valid: boolean; value: number } {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return { valid: false, value: 0 };
  }
  // Check for reasonable limits
  if (num > 1000000) {
    return { valid: false, value: 0 };
  }
  return { valid: true, value: Math.floor(num) };
}

// Security: Hash sensitive data before storage
function hashData(data: string): string {
  return simpleHash(data + 'salt_value_do_not_use_in_production');
}

// Mock user database (in production this would be a real backend)
const MOCK_USERS: Record<string, { passwordHash: string; user: User }> = {};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [myParkings, setMyParkings] = useState<ParkingItem[]>([]);

  useEffect(() => {
    // Security: Verify stored data integrity
    const stored = localStorage.getItem(USER_KEY);
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    
    if (stored && storedToken) {
      try {
        const parsed = JSON.parse(stored);
        const expectedHash = hashData(parsed.email + parsed.id);
        
        // Security: Verify data integrity
        if (storedToken === expectedHash) {
          setUser(parsed);
        } else {
          // Data was tampered - clear storage
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch (e) {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
    
    const storedParkings = localStorage.getItem(PARKING_KEY);
    if (storedParkings) {
      try {
        const parsed = JSON.parse(storedParkings);
        // Security: Validate parking data structure
        if (Array.isArray(parsed)) {
          setMyParkings(parsed);
        }
      } catch (e) {
        localStorage.removeItem(PARKING_KEY);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Security: Validate email format
    if (!email || !isValidEmail(email)) {
      return { success: false, error: 'Неверный формат email' };
    }
    
    // Security: Validate password
    if (!password || password.length < 1) {
      return { success: false, error: 'Введите пароль' };
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // In production: validate credentials against database
    // const userData = MOCK_USERS[normalizedEmail];
    // const passwordHash = simpleHash(password);
    
    // Mock login - in production validate against database
    // For demo purposes, allow login with valid email format
    const mockUser: User = {
      id: generateSecureToken().substring(0, 16),
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      phone: '+7 (999) 000-00-00',
    };
    
    // Security: Generate authentication token
    const authToken = hashData(mockUser.email + mockUser.id);
    
    setUser(mockUser);
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    
    return { success: true };
  };

  const register = async (
    name: string, 
    email: string, 
    phone: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Security: Validate name
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Имя должно быть не менее 2 символов' };
    }
    
    // Security: Validate email
    if (!isValidEmail(email)) {
      return { success: false, error: 'Неверный формат email' };
    }
    
    // Security: Validate phone
    if (!isValidPhone(phone)) {
      return { success: false, error: 'Неверный формат телефона' };
    }
    
    // Security: Validate password strength
    const passwordCheck = isValidPassword(password);
    if (!passwordCheck.valid) {
      return { success: false, error: passwordCheck.error };
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = simpleHash(password);
    
    // Store user in mock database
    const newUser: User = {
      id: generateSecureToken().substring(0, 16),
      name: sanitizeInput(name.trim()),
      email: normalizedEmail,
      phone: phone.trim(),
    };
    
    MOCK_USERS[normalizedEmail] = { passwordHash, user: newUser };
    
    // Security: Generate authentication token
    const authToken = hashData(newUser.email + newUser.id);
    
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addParking = (parking: Omit<ParkingItem, 'id'>) => {
    // Security: Validate all inputs
    if (!parking.title || parking.title.trim().length < 2) {
      console.error('Invalid title');
      return;
    }
    
    if (!parking.address || parking.address.trim().length < 5) {
      console.error('Invalid address');
      return;
    }
    
    // Security: Validate and sanitize numeric values
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