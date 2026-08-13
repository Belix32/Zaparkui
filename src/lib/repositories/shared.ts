import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parkings as staticParkings } from '../../data/parkings';

// Extended parking type with new fields for enhanced features
export interface Parking {
  id: string;
  title: string;
  address: string;
  price: number;
  spots: number;
  image: string | null;
  images?: string[];
  created_at: string;
  description?: string;
  district?: string;
  metro?: string;
  parkingType?: 'ground' | 'underground' | 'roof' | 'covered';
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  owner_id?: string;
  owner_email?: string;
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'pending';
}

export interface ParkingInsert {
  title: string;
  address: string;
  price: number;
  spots: number;
  image?: string | null;
  images?: string[];
  description?: string;
  district?: string;
  metro?: string;
  parkingType?: 'ground' | 'underground' | 'roof' | 'covered';
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  owner_id?: string;
  owner_email?: string;
}

export interface ParkingUpdate {
  title?: string;
  address?: string;
  price?: number;
  spots?: number;
  image?: string | null;
  images?: string[];
  description?: string;
  district?: string;
  metro?: string;
  parkingType?: 'ground' | 'underground' | 'roof' | 'covered';
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  status?: 'active' | 'inactive' | 'pending';
}

export interface Profile {
  id: string;
  auth_id?: string;
  email: string;
  name: string;
  phone: string | null;
  role?: 'user' | 'moderator' | 'admin';
  is_blocked?: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  parking_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'active';
  created_at: string;
  // New fields
  booking_type: 'hourly' | 'daily' | 'monthly';
  car_brand?: string;
  car_model?: string;
  car_number?: string;
  total_price?: number;
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  payment_id?: string;
  qr_code?: string;
  start_time?: string;
  end_time?: string;
  // Relations (for admin queries)
  parking?: { title: string; address: string };
  user?: { email: string; name: string };
}

export interface BookingInsert {
  user_id: string;
  parking_id: string;
  start_date: string;
  end_date: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'active';
  // New fields
  booking_type?: 'hourly' | 'daily' | 'monthly';
  car_brand?: string;
  car_model?: string;
  car_number?: string;
  total_price?: number;
  payment_status?: 'pending' | 'paid' | 'refunded';
  payment_method?: string;
  start_time?: string;
  end_time?: string;
}

export interface BookingUpdate {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'active';
  payment_status?: 'pending' | 'paid' | 'refunded';
  total_price?: number;
}

export interface ParkingFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minSpots?: number;
  maxSpots?: number;
  district?: string;
  metro?: string;
  parkingType?: 'ground' | 'underground' | 'roof' | 'covered';
  minRating?: number;
  maxDistance?: number;
  userLatitude?: number;
  userLongitude?: number;
}

export interface Review {
  id: string;
  parking_id: string;
  user_id: string;
  user_name?: string;
  rating: number;
  comment: string;
  created_at: string;
  author_name?: string;
  status?: 'pending' | 'approved' | 'rejected';
  // Relations (for admin queries)
  parking?: { title: string };
  user?: { name: string; email: string };
}

export interface ReviewInsert {
  parking_id: string;
  user_id: string;
  rating: number;
  comment: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  parking_id: string;
  created_at: string;
}

// Supabase client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  try {
    return !!(
      import.meta.env.VITE_SUPABASE_URL && 
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  } catch {
    return false;
  }
}

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  // Check if configured first - return null if not
  if (!isSupabaseConfigured()) {
    return null as unknown as SupabaseClient;
  }
  
  if (supabaseClient) {
    return supabaseClient;
  }

  // Support both Vite and Next.js prefixes for flexibility
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null as unknown as SupabaseClient;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: false,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
        'x-client-info': 'zaparkyi-web',
      },
    },
  });

  return supabaseClient;
}

export interface Promotion {
  id: string;
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface PromotionInsert {
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  bg_color?: string;
  text_color?: string;
  is_active?: boolean;
  sort_order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
}

export interface PromotionUpdate {
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  bg_color?: string;
  text_color?: string;
  is_active?: boolean;
  sort_order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
}
