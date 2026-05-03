import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { parkings as staticParkings } from '../data/parkings';

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

export interface User {
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
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    // Return from static data
    const staticParking = staticParkings.find(p => p.id === id);
    return staticParking || null;
  }
  
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

  // Always show active parkings
  query = query.eq('is_active', true);
  
  // OR show all if no filters (for admin/super admin use)
  // For now, just get active ones
  query = query.eq('is_active', true);

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
 * Geocode address to coordinates using Nominatim (OpenStreetMap)
 * Returns null if not found
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(address + ', Москва, Россия');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Zaparkyi/1.0',
        },
      }
    );
    
    if (!response.ok) {
      console.error('Geocoding failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
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

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data as User[]) || [];
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin'): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw new Error(error.message);
  }
}

/**
 * Block/unblock user (admin only)
 */
export async function setUserBlocked(userId: string, isBlocked: boolean): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users')
    .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user blocked status:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }
}

/**
 * Get all parkings (admin view - includes inactive)
 */
export async function getAllParkingsAdmin(): Promise<Parking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('parkings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching parkings:', error);
    return [];
  }

  return (data as Parking[]) || [];
}

/**
 * Update parking status (admin)
 */
export async function updateParkingStatus(parkingId: string, status: 'active' | 'inactive' | 'pending'): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('parkings')
    .update({ 
      status,
      is_active: status === 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', parkingId);

  if (error) {
    console.error('Error updating parking status:', error);
    throw new Error(error.message);
  }
}

// Duplicate removed - using the first one

/**
 * Delete parking (admin)
 */

/**
 * Get all bookings (admin view)
 */
export async function getAllBookingsAdmin(): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parking:parkings(title, address), user:users(email, name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return (data as Booking[]) || [];
}

/**
 * Update booking (admin)
 */
export async function updateBookingAdmin(
  bookingId: string,
  updates: Partial<Booking>
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking:', error);
    throw new Error(error.message);
  }
}

/**
 * Get all reviews (admin view)
 */
export async function getAllReviewsAdmin(): Promise<Review[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*, parking:parkings(title), user:users(name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return (data as Review[]) || [];
}

/**
 * Update review status (admin)
 */
export async function updateReviewStatus(
  reviewId: string,
  status: 'pending' | 'approved' | 'rejected',
  reason?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  if (reason) {
    updateData.admin_comment = reason;
  }
  const { error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', reviewId);

  if (error) {
    console.error('Error updating review status:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete review (admin)
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Error deleting review:', error);
    throw new Error(error.message);
  }
}

/**
 * Get platform statistics (admin)
 */
export async function getAdminStats(): Promise<{
  totalUsers: number;
  totalParkings: number;
  activeParkings: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}> {
  const supabase = getSupabaseClient();
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [usersResult, parkingsResult, bookingsResult] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('parkings').select('*'),
    supabase.from('bookings').select('*'),
  ]);

  const users = (usersResult.data || []) as User[];
  const parkings = (parkingsResult.data || []) as Parking[];
  const bookings = (bookingsResult.data || []) as Booking[];
  
  const totalUsers = users.length;
  const totalParkings = parkings.length;
  const activeParkings = parkings.filter(p => p.is_active !== false).length;
  const activeBookings = bookings.filter(b => 
    b.status === 'active' || b.status === 'confirmed'
  ).length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const newUsersThisWeek = users.filter(u => 
    new Date(u.created_at).getTime() > weekAgo.getTime()
  ).length;
  const newUsersThisMonth = users.filter(u => 
    new Date(u.created_at).getTime() > monthAgo.getTime()
  ).length;

  return {
    totalUsers,
    totalParkings,
    activeParkings,
    totalBookings: bookings.length,
    activeBookings,
    pendingBookings,
    totalRevenue,
    newUsersThisWeek,
    newUsersThisMonth,
  };
}

/**
 * Get recent bookings (admin)
 */
export async function getRecentBookings(limit: number = 5): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent bookings:', error);
    return [];
  }

  return (data as Booking[]) || [];
}

/**
 * Get recent parkings (admin)
 */
export async function getRecentParkings(limit: number = 3): Promise<Parking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('parkings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent parkings:', error);
    return [];
  }

  return (data as Parking[]) || [];
}

/**
 * Get recent users (admin)
 */
export async function getRecentUsers(limit: number = 2): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent users:', error);
    return [];
  }

  return (data as User[]) || [];
}