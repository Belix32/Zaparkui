import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Extended parking type with new fields for enhanced features
export interface Parking {
  id: string;
  title: string;
  address: string;
  price: number;
  spots: number;
  image: string | null;
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
}

// Demo parking data
const DEMO_PARKINGS: Parking[] = [
  {
    id: '1',
    title: 'ЖК Северный',
    address: 'Москва, ул. Ленина, 25',
    price: 8000,
    spots: 5,
    image: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'ЖК Парковый',
    address: 'Москва, пр-т Мира, 42',
    price: 12000,
    spots: 2,
    image: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'ЖК Речной',
    address: 'Москва, ул. Набережная, 18',
    price: 9500,
    spots: 8,
    image: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'ЖК Центральный',
    address: 'Москва, ул. Тверская, 15',
    price: 15000,
    spots: 3,
    image: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'ЖК Южный',
    address: 'Москва, ул. Южная, 33',
    price: 7000,
    spots: 12,
    image: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'ЖК Звездный',
    address: 'Москва, ул. Космонавтов, 7',
    price: 11000,
    spots: 4,
    image: null,
    created_at: new Date().toISOString(),
  },
];

// User type for auth
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

// Supabase client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL && 
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/**
 * Get Supabase client - returns null if not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

/**
 * Fetch all parkings - uses demo data if Supabase not configured
 */
export async function fetchParkings(): Promise<Parking[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return DEMO_PARKINGS;
  }

  try {
    const { data, error } = await supabase
      .from('parkings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parkings:', error);
      return DEMO_PARKINGS;
    }

    return (data as Parking[]) || DEMO_PARKINGS;
  } catch (e) {
    console.error('Error:', e);
    return DEMO_PARKINGS;
  }
}

/**
 * Get parking by ID
 */
export async function getParkingById(id: string): Promise<Parking | null> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return DEMO_PARKINGS.find(p => p.id === id) || null;
  }

  try {
    const { data, error } = await supabase
      .from('parkings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return DEMO_PARKINGS.find(p => p.id === id) || null;
    }

    return data as Parking;
  } catch (e) {
    return DEMO_PARKINGS.find(p => p.id === id) || null;
  }
}

/**
 * Search parkings
 */
export async function searchParkings(filters: {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Parking[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    let results = [...DEMO_PARKINGS];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(p => 
        p.title.toLowerCase().includes(s) || 
        p.address.toLowerCase().includes(s)
      );
    }
    if (filters.minPrice) {
      results = results.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      results = results.filter(p => p.price <= filters.maxPrice!);
    }
    return results;
  }

  let query = supabase.from('parkings').select('*');

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`title.ilike.${searchTerm},address.ilike.${searchTerm}`);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  try {
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching parkings:', error);
      return DEMO_PARKINGS;
    }

    return (data as Parking[]) || DEMO_PARKINGS;
  } catch (e) {
    return DEMO_PARKINGS;
  }
}

/**
 * Create a new booking
 */
export async function createBooking(booking: {
  user_id: string;
  parking_id: string;
  start_date: string;
  end_date: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    // Demo mode - save to localStorage
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push({ ...booking, id: Date.now().toString(), status: 'confirmed' });
    localStorage.setItem('bookings', JSON.stringify(bookings));
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .insert(booking);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Get user bookings
 */
export async function getUserBookings(userId: string): Promise<unknown[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase) {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return [];
    }

    return data || [];
  } catch (e) {
    return [];
  }
}

export { DEMO_PARKINGS };