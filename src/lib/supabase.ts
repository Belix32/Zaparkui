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

export interface ParkingInsert {
  title: string;
  address: string;
  price: number;
  spots: number;
  image?: string | null;
  description?: string;
  district?: string;
  metro?: string;
  parkingType?: 'ground' | 'underground' | 'roof' | 'covered';
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

export interface ParkingUpdate {
  title?: string;
  address?: string;
  price?: number;
  spots?: number;
  image?: string | null;
  description?: string;
  district?: string;
  metro?: string;
  parkingType?: 'ground' | 'underground' | 'roof' | 'covered';
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  parking_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface BookingInsert {
  user_id: string;
  parking_id: string;
  start_date: string;
  end_date: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface BookingUpdate {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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
  return !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

/**
 * Get or create Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Support both Vite and Next.js prefixes for flexibility
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'zaparkyi-web',
      },
    },
  });

  return supabaseClient;
}

/**
 * Fetch all parkings from database
 */
export async function fetchParkings(): Promise<Parking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('parkings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parkings:', error);
    throw new Error(error.message);
  }

  return (data as Parking[]) || [];
}

/**
 * Get parking by ID
 */
export async function getParkingById(id: string): Promise<Parking | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('parkings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching parking:', error);
    throw new Error(error.message);
  }

  return data as Parking;
}

/**
 * Search parkings with filters
 */
export async function searchParkings(filters: ParkingFilters): Promise<Parking[]> {
  const supabase = getSupabaseClient();
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

  if (filters.minSpots !== undefined) {
    query = query.gte('spots', filters.minSpots);
  }
  if (filters.maxSpots !== undefined) {
    query = query.lte('spots', filters.maxSpots);
  }

  if (filters.district) {
    const districtTerm = `%${filters.district}%`;
    query = query.ilike('district', districtTerm);
  }

  if (filters.metro) {
    const metroTerm = `%${filters.metro}%`;
    query = query.ilike('metro', metroTerm);
  }

  if (filters.parkingType) {
    query = query.eq('parking_type', filters.parkingType);
  }

  if (filters.minRating !== undefined) {
    query = query.gte('rating', filters.minRating);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching parkings:', error);
    throw new Error(error.message);
  }

  // Calculate distances and filter if user location provided
  let results = (data as Parking[]) || [];
  
  if (filters.userLatitude && filters.userLongitude && filters.maxDistance) {
    results = results.filter(p => {
      if (!p.latitude || !p.longitude) return true;
      const distance = calculateDistance(
        filters.userLatitude!,
        filters.userLongitude!,
        p.latitude,
        p.longitude
      );
      return distance <= filters.maxDistance!;
    });
  }

  return results;
}

/**
 * Calculate distance between two coordinates in km
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Create a new parking (admin)
 */
export async function createParking(parking: ParkingInsert): Promise<Parking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('parkings')
    .insert(parking as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating parking:', error);
    throw new Error(error.message);
  }

  return data as Parking;
}

/**
 * Update a parking
 */
export async function updateParking(id: string, parking: ParkingUpdate): Promise<Parking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('parkings')
    .update(parking as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating parking:', error);
    throw new Error(error.message);
  }

  return data as Parking;
}

/**
 * Delete a parking
 */
export async function deleteParking(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('parkings').delete().eq('id', id);

  if (error) {
    console.error('Error deleting parking:', error);
    throw new Error(error.message);
  }
}

/**
 * Create a new booking
 */
export async function createBooking(booking: BookingInsert): Promise<Booking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw new Error(error.message);
  }

  return data as Booking;
}

/**
 * Get bookings by user ID
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bookings:', error);
    throw new Error(error.message);
  }

  return (data as Booking[]) || [];
}

/**
 * Get bookings by parking ID
 */
export async function getParkingBookings(parkingId: string): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('parking_id', parkingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parking bookings:', error);
    throw new Error(error.message);
  }

  return (data as Booking[]) || [];
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  id: string,
  status: Booking['status']
): Promise<Booking> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw new Error(error.message);
  }

  return data as Booking;
}

/**
 * Create a new user profile
 */
export async function createUser(user: { email: string; name: string; phone?: string }): Promise<User> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .insert(user as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error(error.message);
  }

  return data as User;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user:', error);
    throw new Error(error.message);
  }

  return data as User;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching user by email:', error);
    throw new Error(error.message);
  }

  return data as User;
}

/**
 * Get reviews for a parking
 */
export async function getParkingReviews(parkingId: string): Promise<Review[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('parking_id', parkingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw new Error(error.message);
  }

  return (data as Review[]) || [];
}

/**
 * Create a new review
 */
export async function createReview(review: ReviewInsert): Promise<Review> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .insert(review as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating review:', error);
    throw new Error(error.message);
  }

  return data as Review;
}

/**
 * Get user's favorite parkings
 */
export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching favorites:', error);
    throw new Error(error.message);
  }

  return (data as Favorite[]) || [];
}

/**
 * Add a favorite
 */
export async function addFavorite(userId: string, parkingId: string): Promise<Favorite> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, parking_id: parkingId } as any)
    .select()
    .single();

  if (error) {
    console.error('Error adding favorite:', error);
    throw new Error(error.message);
  }

  return data as Favorite;
}

/**
 * Remove a favorite
 */
export async function removeFavorite(userId: string, parkingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('parking_id', parkingId);

  if (error) {
    console.error('Error removing favorite:', error);
    throw new Error(error.message);
  }
}

/**
 * Check if parking is favorited by user
 */
export async function isFavorite(userId: string, parkingId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('parking_id', parkingId)
    .single();

  if (error) {
    return false;
  }

  return !!data;
}