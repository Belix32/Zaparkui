// ============================================================================
// Sea Trips (Поездки на море) — API layer
// Dual mode: Supabase first, localStorage fallback
// Follows the exact patterns from src/lib/supabase.ts
// ============================================================================

import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import type {
  TravelDestination,
  RentalPartner,
  PartnerLocation,
  PartnerCar,
  TravelBooking,
  CarStorage,
  TravelSearchParams,
  TravelBookingForm,
  UserCarInfo,
  AdminTravelStats,
  TravelPriceBreakdown,
} from './types';

// ============================================================================
// LocalStorage helpers — used when Supabase is not configured
// ============================================================================

const LS_DESTINATIONS = 'zaparkyi_travel_destinations';
const LS_PARTNERS = 'zaparkyi_travel_partners';
const LS_CARS = 'zaparkyi_travel_cars';
const LS_LOCATIONS = 'zaparkyi_travel_locations';
const LS_BOOKINGS = 'zaparkyi_travel_bookings';
const LS_STORAGE = 'zaparkyi_travel_storage';

function getLocalData<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function setLocalData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing to localStorage key "${key}":`, e);
  }
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// ============================================================================
// 1. DESTINATIONS
// ============================================================================

/**
 * Get all active destinations (public)
 */
export async function getActiveDestinations(): Promise<TravelDestination[]> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelDestination>(LS_DESTINATIONS);
    return all.filter((d) => d.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_destinations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching active destinations:', error);
    return [];
  }

  return (data as TravelDestination[]) || [];
}

/**
 * Get a destination by its slug
 */
export async function getDestinationBySlug(slug: string): Promise<TravelDestination | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelDestination>(LS_DESTINATIONS);
    return all.find((d) => d.slug === slug) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_destinations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching destination by slug:', error);
    return null;
  }

  return data as TravelDestination;
}

/**
 * Get a destination by ID
 */
export async function getDestinationById(id: string): Promise<TravelDestination | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelDestination>(LS_DESTINATIONS);
    return all.find((d) => d.id === id) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_destinations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching destination:', error);
    return null;
  }

  return data as TravelDestination;
}

// --- Admin CRUD ---

/**
 * Get all destinations (admin — includes inactive)
 */
export async function getAllDestinationsAdmin(): Promise<TravelDestination[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<TravelDestination>(LS_DESTINATIONS);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_destinations')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching all destinations:', error);
    return [];
  }

  return (data as TravelDestination[]) || [];
}

/**
 * Create a new destination (admin)
 */
export async function createDestination(
  data: Partial<TravelDestination>,
  retries = 3,
): Promise<TravelDestination | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelDestination>(LS_DESTINATIONS);
    const newDest: TravelDestination = {
      id: generateId(),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || null,
      image: data.image || null,
      region: data.region || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newDest);
    setLocalData(LS_DESTINATIONS, all);
    return newDest;
  }

  const supabase = getSupabaseClient();
  const dbRecord: Record<string, unknown> = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    image: data.image || null,
    region: data.region || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    is_active: data.is_active ?? true,
    sort_order: data.sort_order ?? 0,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }

      const { data: result, error } = await supabase
        .from('travel_destinations')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) continue;
        console.error('Error creating destination:', error);
        throw new Error(error.message);
      }

      return result as TravelDestination;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) continue;
      throw err;
    }
  }

  throw new Error('Не удалось создать направление. Попробуйте ещё раз.');
}

/**
 * Update a destination (admin)
 */
export async function updateDestination(id: string, updates: Partial<TravelDestination>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelDestination>(LS_DESTINATIONS);
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Направление не найдено');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setLocalData(LS_DESTINATIONS, all);
    return;
  }

  const supabase = getSupabaseClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.region !== undefined) dbUpdates.region = updates.region;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
  if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('travel_destinations')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating destination:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete a destination (admin)
 */
export async function deleteDestination(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelDestination>(LS_DESTINATIONS);
    const filtered = all.filter((d) => d.id !== id);
    if (filtered.length === all.length) throw new Error('Направление не найдено');
    setLocalData(LS_DESTINATIONS, filtered);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('travel_destinations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting destination:', error);
    throw new Error(error.message);
  }
}

// ============================================================================
// 2. PARTNERS
// ============================================================================

/**
 * Get all active partners (public)
 */
export async function getActivePartners(): Promise<RentalPartner[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<RentalPartner>(LS_PARTNERS).filter((p) => p.is_active);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rental_partners')
    .select('*')
    .eq('is_active', true)
    .order('rating', { ascending: false });

  if (error) {
    console.error('Error fetching active partners:', error);
    return [];
  }

  return (data as RentalPartner[]) || [];
}

/**
 * Get partner by ID
 */
export async function getPartnerById(id: string): Promise<RentalPartner | null> {
  if (!isSupabaseConfigured()) {
    return getLocalData<RentalPartner>(LS_PARTNERS).find((p) => p.id === id) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rental_partners')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching partner:', error);
    return null;
  }

  return data as RentalPartner;
}

/**
 * Get all partners operating in a given destination
 * Resolves through partner_locations junction
 */
export async function getPartnersByDestination(destinationId: string): Promise<RentalPartner[]> {
  if (!isSupabaseConfigured()) {
    const locations = getLocalData<PartnerLocation>(LS_LOCATIONS).filter(
      (l) => l.destination_id === destinationId,
    );
    const partnerIds = Array.from(new Set(locations.map((l) => l.partner_id)));
    return getLocalData<RentalPartner>(LS_PARTNERS).filter(
      (p) => partnerIds.includes(p.id) && p.is_active,
    );
  }

  const supabase = getSupabaseClient();
  // Get distinct partner_ids from locations for this destination
  const { data: locations, error: locError } = await supabase
    .from('partner_locations')
    .select('partner_id')
    .eq('destination_id', destinationId);

  if (locError) {
    console.error('Error fetching partner locations for destination:', locError);
    return [];
  }

  if (!locations || locations.length === 0) return [];

  const partnerIds = Array.from(new Set(locations.map((l: { partner_id: string }) => l.partner_id)));

  const { data, error } = await supabase
    .from('rental_partners')
    .select('*')
    .in('id', partnerIds)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching partners by destination:', error);
    return [];
  }

  return (data as RentalPartner[]) || [];
}

// --- Admin CRUD ---

/**
 * Get all partners (admin — includes inactive)
 */
export async function getAllPartnersAdmin(): Promise<RentalPartner[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<RentalPartner>(LS_PARTNERS);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('rental_partners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all partners:', error);
    return [];
  }

  return (data as RentalPartner[]) || [];
}

/**
 * Create a new partner (admin)
 */
export async function createPartner(
  data: Partial<RentalPartner>,
  retries = 3,
): Promise<RentalPartner | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<RentalPartner>(LS_PARTNERS);
    const newPartner: RentalPartner = {
      id: generateId(),
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || null,
      logo: data.logo || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      is_active: data.is_active ?? true,
      commission_rate: data.commission_rate ?? 15,
      rating: data.rating ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newPartner);
    setLocalData(LS_PARTNERS, all);
    return newPartner;
  }

  const supabase = getSupabaseClient();
  const dbRecord: Record<string, unknown> = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    logo: data.logo || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    is_active: data.is_active ?? true,
    commission_rate: data.commission_rate ?? 15,
    rating: data.rating ?? 0,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }

      const { data: result, error } = await supabase
        .from('rental_partners')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) continue;
        console.error('Error creating partner:', error);
        throw new Error(error.message);
      }

      return result as RentalPartner;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) continue;
      throw err;
    }
  }

  throw new Error('Не удалось создать партнёра. Попробуйте ещё раз.');
}

/**
 * Update a partner (admin)
 */
export async function updatePartner(id: string, updates: Partial<RentalPartner>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<RentalPartner>(LS_PARTNERS);
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Партнёр не найден');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setLocalData(LS_PARTNERS, all);
    return;
  }

  const supabase = getSupabaseClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.website !== undefined) dbUpdates.website = updates.website;
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
  if (updates.commission_rate !== undefined) dbUpdates.commission_rate = updates.commission_rate;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('rental_partners').update(dbUpdates).eq('id', id);

  if (error) {
    console.error('Error updating partner:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete a partner (admin)
 */
export async function deletePartner(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<RentalPartner>(LS_PARTNERS);
    const filtered = all.filter((p) => p.id !== id);
    if (filtered.length === all.length) throw new Error('Партнёр не найден');
    setLocalData(LS_PARTNERS, filtered);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('rental_partners').delete().eq('id', id);

  if (error) {
    console.error('Error deleting partner:', error);
    throw new Error(error.message);
  }
}

// ============================================================================
// 3. CARS
// ============================================================================

/**
 * Get cars available for rent matching search params
 * Filters by destination, dates, price range, transmission, seats
 */
export async function getAvailableCars(params: TravelSearchParams): Promise<PartnerCar[]> {
  if (!isSupabaseConfigured()) {
    let cars = getLocalData<PartnerCar>(LS_CARS).filter((c) => c.is_available && c.is_active);

    if (params.min_price !== undefined) {
      cars = cars.filter((c) => c.price_per_day >= params.min_price!);
    }
    if (params.max_price !== undefined) {
      cars = cars.filter((c) => c.price_per_day <= params.max_price!);
    }
    if (params.transmission) {
      cars = cars.filter((c) => c.transmission === params.transmission);
    }
    if (params.seats) {
      cars = cars.filter((c) => c.seats >= params.seats!);
    }

    // Check for booking overlaps in localStorage
    const bookings = getLocalData<TravelBooking>(LS_BOOKINGS);
    const start = params.start_date;
    const end = params.end_date;

    cars = cars.filter((car) => {
      const overlapping = bookings.some(
        (b) =>
          b.car_id === car.id &&
          b.status !== 'cancelled' &&
          b.status !== 'completed' &&
          b.start_date < end &&
          b.end_date > start,
      );
      return !overlapping;
    });

    return cars;
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from('partner_cars')
    .select('*, partner:rental_partners(*), location:partner_locations(*)')
    .eq('is_available', true)
    .eq('is_active', true);

  // If destination_slug is provided, filter through locations → destination
  if (params.destination_slug) {
    // First get the destination ID
    const { data: dest } = await supabase
      .from('travel_destinations')
      .select('id')
      .eq('slug', params.destination_slug)
      .single();

    if (dest) {
      // Get location IDs for this destination
      const { data: locs } = await supabase
        .from('partner_locations')
        .select('id')
        .eq('destination_id', dest.id);

      if (locs && locs.length > 0) {
        const locIds = locs.map((l: { id: string }) => l.id);
        query = query.in('location_id', locIds);
      }
    }
  }

  if (params.min_price !== undefined) {
    query = query.gte('price_per_day', params.min_price);
  }
  if (params.max_price !== undefined) {
    query = query.lte('price_per_day', params.max_price);
  }
  if (params.transmission) {
    query = query.eq('transmission', params.transmission);
  }
  if (params.seats) {
    query = query.gte('seats', params.seats);
  }

  const { data, error } = await query.order('price_per_day', { ascending: true });

  if (error) {
    console.error('Error fetching available cars:', error);
    return [];
  }

  const cars = (data as PartnerCar[]) || [];

  // Filter out cars that have overlapping bookings
  const start = params.start_date;
  const end = params.end_date;

  const { data: overlappingBookings } = await supabase
    .from('travel_bookings')
    .select('car_id')
    .in('status', ['pending', 'confirmed', 'active'])
    .or(`start_date.lte.${end},end_date.gte.${start}`);

  if (overlappingBookings && overlappingBookings.length > 0) {
    const bookedCarIds = new Set(
      overlappingBookings.map((b: { car_id: string }) => b.car_id),
    );
    return cars.filter((c) => !bookedCarIds.has(c.id));
  }

  return cars;
}

/**
 * Get all cars belonging to a partner
 */
export async function getPartnerCars(partnerId: string): Promise<PartnerCar[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerCar>(LS_CARS).filter((c) => c.partner_id === partnerId);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_cars')
    .select('*')
    .eq('partner_id', partnerId)
    .order('price_per_day', { ascending: true });

  if (error) {
    console.error('Error fetching partner cars:', error);
    return [];
  }

  return (data as PartnerCar[]) || [];
}

/**
 * Get a car by ID
 */
export async function getCarById(id: string): Promise<PartnerCar | null> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerCar>(LS_CARS).find((c) => c.id === id) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_cars')
    .select('*, partner:rental_partners(*), location:partner_locations(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching car:', error);
    return null;
  }

  return data as PartnerCar;
}

// --- Admin CRUD ---

/**
 * Get all cars (admin)
 */
export async function getAllCarsAdmin(): Promise<PartnerCar[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerCar>(LS_CARS);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_cars')
    .select('*, partner:rental_partners(*), location:partner_locations(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all cars:', error);
    return [];
  }

  return (data as PartnerCar[]) || [];
}

/**
 * Create a new car (admin)
 */
export async function createCar(
  data: Partial<PartnerCar>,
  retries = 3,
): Promise<PartnerCar | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerCar>(LS_CARS);
    const newCar: PartnerCar = {
      id: generateId(),
      partner_id: data.partner_id || '',
      location_id: data.location_id || null,
      brand: data.brand || '',
      model: data.model || '',
      year: data.year || null,
      color: data.color || null,
      license_plate: data.license_plate || null,
      transmission: data.transmission || 'manual',
      fuel_type: data.fuel_type || 'gasoline',
      seats: data.seats || 5,
      price_per_day: data.price_per_day || 0,
      deposit: data.deposit || 0,
      image: data.image || null,
      images: data.images || [],
      description: data.description || null,
      is_available: data.is_available ?? true,
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newCar);
    setLocalData(LS_CARS, all);
    return newCar;
  }

  const supabase = getSupabaseClient();
  const dbRecord: Record<string, unknown> = {
    partner_id: data.partner_id,
    location_id: data.location_id || null,
    brand: data.brand,
    model: data.model,
    year: data.year || null,
    color: data.color || null,
    license_plate: data.license_plate || null,
    transmission: data.transmission || 'manual',
    fuel_type: data.fuel_type || 'gasoline',
    seats: data.seats || 5,
    price_per_day: data.price_per_day,
    deposit: data.deposit || 0,
    image: data.image || null,
    images: data.images || null,
    description: data.description || null,
    is_available: data.is_available ?? true,
    is_active: data.is_active ?? true,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }

      const { data: result, error } = await supabase
        .from('partner_cars')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) continue;
        console.error('Error creating car:', error);
        throw new Error(error.message);
      }

      return result as PartnerCar;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) continue;
      throw err;
    }
  }

  throw new Error('Не удалось создать автомобиль. Попробуйте ещё раз.');
}

/**
 * Update a car (admin)
 */
export async function updateCar(id: string, updates: Partial<PartnerCar>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerCar>(LS_CARS);
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Автомобиль не найден');
    all[idx] = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
    setLocalData(LS_CARS, all);
    return;
  }

  const supabase = getSupabaseClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
  if (updates.model !== undefined) dbUpdates.model = updates.model;
  if (updates.year !== undefined) dbUpdates.year = updates.year;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.license_plate !== undefined) dbUpdates.license_plate = updates.license_plate;
  if (updates.transmission !== undefined) dbUpdates.transmission = updates.transmission;
  if (updates.fuel_type !== undefined) dbUpdates.fuel_type = updates.fuel_type;
  if (updates.seats !== undefined) dbUpdates.seats = updates.seats;
  if (updates.price_per_day !== undefined) dbUpdates.price_per_day = updates.price_per_day;
  if (updates.deposit !== undefined) dbUpdates.deposit = updates.deposit;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.is_available !== undefined) dbUpdates.is_available = updates.is_available;
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
  if (updates.location_id !== undefined) dbUpdates.location_id = updates.location_id;
  if (updates.partner_id !== undefined) dbUpdates.partner_id = updates.partner_id;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('partner_cars').update(dbUpdates).eq('id', id);

  if (error) {
    console.error('Error updating car:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete a car (admin)
 */
export async function deleteCar(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerCar>(LS_CARS);
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length === all.length) throw new Error('Автомобиль не найден');
    setLocalData(LS_CARS, filtered);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('partner_cars').delete().eq('id', id);

  if (error) {
    console.error('Error deleting car:', error);
    throw new Error(error.message);
  }
}

// ============================================================================
// 4. LOCATIONS
// ============================================================================

/**
 * Get all locations for a specific partner
 */
export async function getPartnerLocations(partnerId: string): Promise<PartnerLocation[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerLocation>(LS_LOCATIONS).filter(
      (l) => l.partner_id === partnerId,
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_locations')
    .select('*, partner:rental_partners(*), destination:travel_destinations(*)')
    .eq('partner_id', partnerId);

  if (error) {
    console.error('Error fetching partner locations:', error);
    return [];
  }

  return (data as PartnerLocation[]) || [];
}

/**
 * Get all locations for a specific destination
 */
export async function getLocationsByDestination(destinationId: string): Promise<PartnerLocation[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerLocation>(LS_LOCATIONS).filter(
      (l) => l.destination_id === destinationId,
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_locations')
    .select('*, partner:rental_partners(*), destination:travel_destinations(*)')
    .eq('destination_id', destinationId);

  if (error) {
    console.error('Error fetching locations by destination:', error);
    return [];
  }

  return (data as PartnerLocation[]) || [];
}

/**
 * Get a location by ID
 */
export async function getLocationById(id: string): Promise<PartnerLocation | null> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerLocation>(LS_LOCATIONS).find((l) => l.id === id) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_locations')
    .select('*, partner:rental_partners(*), destination:travel_destinations(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching location:', error);
    return null;
  }

  return data as PartnerLocation;
}

// --- Admin CRUD ---

/**
 * Get all locations (admin)
 */
export async function getAllLocationsAdmin(): Promise<PartnerLocation[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<PartnerLocation>(LS_LOCATIONS);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('partner_locations')
    .select('*, partner:rental_partners(*), destination:travel_destinations(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all locations:', error);
    return [];
  }

  return (data as PartnerLocation[]) || [];
}

/**
 * Create a new location (admin)
 */
export async function createLocation(
  data: Partial<PartnerLocation>,
  retries = 3,
): Promise<PartnerLocation | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerLocation>(LS_LOCATIONS);
    const newLoc: PartnerLocation = {
      id: generateId(),
      partner_id: data.partner_id || '',
      destination_id: data.destination_id || '',
      name: data.name || '',
      address: data.address || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      phone: data.phone || null,
      has_storage: data.has_storage ?? false,
      has_rental: data.has_rental ?? true,
      created_at: new Date().toISOString(),
    };
    all.push(newLoc);
    setLocalData(LS_LOCATIONS, all);
    return newLoc;
  }

  const supabase = getSupabaseClient();
  const dbRecord: Record<string, unknown> = {
    partner_id: data.partner_id,
    destination_id: data.destination_id,
    name: data.name,
    address: data.address,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    phone: data.phone || null,
    has_storage: data.has_storage ?? false,
    has_rental: data.has_rental ?? true,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }

      const { data: result, error } = await supabase
        .from('partner_locations')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) continue;
        console.error('Error creating location:', error);
        throw new Error(error.message);
      }

      return result as PartnerLocation;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) continue;
      throw err;
    }
  }

  throw new Error('Не удалось создать локацию. Попробуйте ещё раз.');
}

/**
 * Update a location (admin)
 */
export async function updateLocation(id: string, updates: Partial<PartnerLocation>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerLocation>(LS_LOCATIONS);
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Локация не найдена');
    all[idx] = { ...all[idx], ...updates, created_at: all[idx].created_at };
    setLocalData(LS_LOCATIONS, all);
    return;
  }

  const supabase = getSupabaseClient();
  const dbUpdates: Record<string, unknown> = {};
  if (updates.partner_id !== undefined) dbUpdates.partner_id = updates.partner_id;
  if (updates.destination_id !== undefined) dbUpdates.destination_id = updates.destination_id;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.has_storage !== undefined) dbUpdates.has_storage = updates.has_storage;
  if (updates.has_rental !== undefined) dbUpdates.has_rental = updates.has_rental;

  const { error } = await supabase
    .from('partner_locations')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Error updating location:', error);
    throw new Error(error.message);
  }
}

/**
 * Delete a location (admin)
 */
export async function deleteLocation(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerLocation>(LS_LOCATIONS);
    const filtered = all.filter((l) => l.id !== id);
    if (filtered.length === all.length) throw new Error('Локация не найдена');
    setLocalData(LS_LOCATIONS, filtered);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from('partner_locations').delete().eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    throw new Error(error.message);
  }
}

// ============================================================================
// 5. BOOKINGS
// ============================================================================

/**
 * Create a new travel booking
 */
export async function createTravelBooking(
  form: TravelBookingForm,
  userCarInfo?: UserCarInfo,
  retries = 3,
): Promise<TravelBooking | null> {
  // Validate dates
  const start = new Date(form.start_date);
  const end = new Date(form.end_date);
  if (end <= start) {
    throw new Error('Дата окончания должна быть позже даты начала');
  }

  // Calculate price breakdown
  const car = await getCarById(form.car_id);
  if (!car) {
    throw new Error('Автомобиль не найден');
  }

  const price = calculateTravelPrice(
    car,
    form.start_date,
    form.end_date,
    form.has_storage,
  );

  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelBooking>(LS_BOOKINGS);
    const newBooking: TravelBooking = {
      id: generateId(),
      user_id: 'local-user',
      destination_id: form.destination_id,
      partner_id: form.partner_id,
      car_id: form.car_id,
      location_id: form.location_id || null,
      start_date: form.start_date,
      end_date: form.end_date,
      rental_price_per_day: car.price_per_day,
      total_rental_days: price.totalRentalDays,
      total_rental_price: price.totalRentalPrice,
      has_storage: form.has_storage,
      storage_price_per_day: car.deposit,
      total_storage_days: price.totalStorageDays,
      total_storage_price: price.totalStoragePrice,
      own_car_brand: userCarInfo?.brand || form.own_car_brand || null,
      own_car_model: userCarInfo?.model || form.own_car_model || null,
      own_car_color: userCarInfo?.color || form.own_car_color || null,
      own_car_license_plate: userCarInfo?.license_plate || form.own_car_license_plate || null,
      total_price: price.totalPrice,
      commission_price: price.commissionPrice,
      status: 'pending',
      payment_status: 'pending',
      payment_method: null,
      payment_id: null,
      notes: form.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newBooking);
    setLocalData(LS_BOOKINGS, all);
    return newBooking;
  }

  const supabase = getSupabaseClient();
  const dbRecord: Record<string, unknown> = {
    user_id: (await getCurrentUserId()) || 'anonymous',
    destination_id: form.destination_id,
    partner_id: form.partner_id,
    car_id: form.car_id,
    location_id: form.location_id || null,
    start_date: form.start_date,
    end_date: form.end_date,
    rental_price_per_day: car.price_per_day,
    total_rental_days: price.totalRentalDays,
    total_rental_price: price.totalRentalPrice,
    has_storage: form.has_storage,
    storage_price_per_day: car.deposit,
    total_storage_days: price.totalStorageDays,
    total_storage_price: price.totalStoragePrice,
    own_car_brand: userCarInfo?.brand || form.own_car_brand || null,
    own_car_model: userCarInfo?.model || form.own_car_model || null,
    own_car_color: userCarInfo?.color || form.own_car_color || null,
    own_car_license_plate: userCarInfo?.license_plate || form.own_car_license_plate || null,
    total_price: price.totalPrice,
    commission_price: price.commissionPrice,
    status: 'pending',
    payment_status: 'pending',
    notes: form.notes || null,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }

      const { data: result, error } = await supabase
        .from('travel_bookings')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) continue;
        console.error('Error creating travel booking:', error);
        throw new Error(error.message);
      }

      return result as TravelBooking;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) continue;
      throw err;
    }
  }

  throw new Error('Не удалось создать бронирование. Попробуйте ещё раз.');
}

/**
 * Get the current user ID from Supabase auth session
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Get all bookings for the current user
 */
export async function getUserTravelBookings(): Promise<TravelBooking[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<TravelBooking>(LS_BOOKINGS);
  }

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_bookings')
    .select(
      '*, destination:travel_destinations(*), partner:rental_partners(*), car:partner_cars(*), location:partner_locations(*)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user travel bookings:', error);
    return [];
  }

  return (data as TravelBooking[]) || [];
}

/**
 * Get a single travel booking by ID
 */
export async function getTravelBookingById(id: string): Promise<TravelBooking | null> {
  if (!isSupabaseConfigured()) {
    return getLocalData<TravelBooking>(LS_BOOKINGS).find((b) => b.id === id) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_bookings')
    .select(
      '*, destination:travel_destinations(*), partner:rental_partners(*), car:partner_cars(*), location:partner_locations(*)',
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching travel booking:', error);
    return null;
  }

  return data as TravelBooking;
}

/**
 * Update travel booking status
 */
export async function updateTravelBookingStatus(
  id: string,
  status: TravelBooking['status'],
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelBooking>(LS_BOOKINGS);
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Бронирование не найдено');
    all[idx].status = status;
    all[idx].updated_at = new Date().toISOString();
    setLocalData(LS_BOOKINGS, all);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('travel_bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating travel booking status:', error);
    throw new Error(error.message);
  }
}

/**
 * Cancel a travel booking
 */
export async function cancelTravelBooking(id: string): Promise<void> {
  await updateTravelBookingStatus(id, 'cancelled');
}

/**
 * Check if a car is available for the given date range
 */
export async function checkCarAvailability(
  carId: string,
  startDate: string,
  endDate: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const bookings = getLocalData<TravelBooking>(LS_BOOKINGS);
    return !bookings.some(
      (b) =>
        b.car_id === carId &&
        b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        b.start_date < endDate &&
        b.end_date > startDate,
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_bookings')
    .select('id')
    .eq('car_id', carId)
    .in('status', ['pending', 'confirmed', 'active'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    .limit(1);

  if (error) {
    console.error('Error checking car availability:', error);
    return true; // Allow on error
  }

  return !data || data.length === 0;
}

// ============================================================================
// Admin — Bookings
// ============================================================================

/**
 * Get all travel bookings (admin)
 */
export async function getAllTravelBookingsAdmin(): Promise<TravelBooking[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<TravelBooking>(LS_BOOKINGS);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_bookings')
    .select(
      '*, destination:travel_destinations(*), partner:rental_partners(*), car:partner_cars(*), location:partner_locations(*)',
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all travel bookings:', error);
    return [];
  }

  return (data as TravelBooking[]) || [];
}

/**
 * Get admin travel statistics
 */
export async function getAdminTravelStats(): Promise<AdminTravelStats> {
  if (!isSupabaseConfigured()) {
    const bookings = getLocalData<TravelBooking>(LS_BOOKINGS);
    const cars = getLocalData<PartnerCar>(LS_CARS);
    const partners = getLocalData<RentalPartner>(LS_PARTNERS);
    const destinations = getLocalData<TravelDestination>(LS_DESTINATIONS);

    const activeBookings = bookings.filter(
      (b) => b.status === 'active' || b.status === 'confirmed',
    );
    const totalRevenue = bookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.total_price, 0);
    const totalCommission = bookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + b.commission_price, 0);

    return {
      total_bookings: bookings.length,
      active_bookings: activeBookings.length,
      total_revenue: totalRevenue,
      total_commission: totalCommission,
      total_cars: cars.filter((c) => c.is_active).length,
      total_partners: partners.filter((p) => p.is_active).length,
      total_destinations: destinations.filter((d) => d.is_active).length,
      recent_bookings: bookings.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ).slice(0, 5),
    };
  }

  const supabase = getSupabaseClient();

  const [bookingsResult, carsResult, partnersResult, destinationsResult] = await Promise.all([
    supabase.from('travel_bookings').select('*'),
    supabase.from('partner_cars').select('*'),
    supabase.from('rental_partners').select('*'),
    supabase.from('travel_destinations').select('*'),
  ]);

  const bookings = (bookingsResult.data || []) as TravelBooking[];
  const cars = (carsResult.data || []) as PartnerCar[];
  const partners = (partnersResult.data || []) as RentalPartner[];
  const destinations = (destinationsResult.data || []) as TravelDestination[];

  const activeBookings = bookings.filter(
    (b) => b.status === 'active' || b.status === 'confirmed',
  );
  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.total_price, 0);
  const totalCommission = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.commission_price, 0);

  // Get 5 most recent bookings with joins
  const { data: recent } = await supabase
    .from('travel_bookings')
    .select(
      '*, destination:travel_destinations(*), partner:rental_partners(*), car:partner_cars(*), location:partner_locations(*)',
    )
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    total_bookings: bookings.length,
    active_bookings: activeBookings.length,
    total_revenue: totalRevenue,
    total_commission: totalCommission,
    total_cars: cars.filter((c) => c.is_active).length,
    total_partners: partners.filter((p) => p.is_active).length,
    total_destinations: destinations.filter((d) => d.is_active).length,
    recent_bookings: (recent as TravelBooking[]) || [],
  };
}

// ============================================================================
// 6. STORAGE
// ============================================================================

/**
 * Create a car storage record
 */
export async function createStorageRecord(
  data: Partial<CarStorage>,
  retries = 3,
): Promise<CarStorage | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<CarStorage>(LS_STORAGE);
    const newRecord: CarStorage = {
      id: generateId(),
      travel_booking_id: data.travel_booking_id || '',
      partner_id: data.partner_id || '',
      location_id: data.location_id || null,
      car_brand: data.car_brand || '',
      car_model: data.car_model || '',
      car_color: data.car_color || null,
      car_license_plate: data.car_license_plate || '',
      check_in_date: data.check_in_date || '',
      check_out_date: data.check_out_date || '',
      actual_check_in: data.actual_check_in || null,
      actual_check_out: data.actual_check_out || null,
      status: 'pending',
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all.push(newRecord);
    setLocalData(LS_STORAGE, all);
    return newRecord;
  }

  const supabase = getSupabaseClient();
  const dbRecord: Record<string, unknown> = {
    travel_booking_id: data.travel_booking_id,
    partner_id: data.partner_id,
    location_id: data.location_id || null,
    car_brand: data.car_brand,
    car_model: data.car_model,
    car_color: data.car_color || null,
    car_license_plate: data.car_license_plate,
    check_in_date: data.check_in_date,
    check_out_date: data.check_out_date,
    actual_check_in: data.actual_check_in || null,
    actual_check_out: data.actual_check_out || null,
    status: 'pending',
    notes: data.notes || null,
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }

      const { data: result, error } = await supabase
        .from('car_storage')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) continue;
        console.error('Error creating storage record:', error);
        throw new Error(error.message);
      }

      return result as CarStorage;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) continue;
      throw err;
    }
  }

  throw new Error('Не удалось создать запись хранения. Попробуйте ещё раз.');
}

/**
 * Get storage record for a booking
 */
export async function getBookingStorage(bookingId: string): Promise<CarStorage | null> {
  if (!isSupabaseConfigured()) {
    return getLocalData<CarStorage>(LS_STORAGE).find(
      (s) => s.travel_booking_id === bookingId,
    ) || null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('car_storage')
    .select('*')
    .eq('travel_booking_id', bookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching booking storage:', error);
    return null;
  }

  return data as CarStorage;
}

/**
 * Update storage status (admin)
 */
export async function updateStorageStatus(
  id: string,
  status: CarStorage['status'],
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<CarStorage>(LS_STORAGE);
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Запись хранения не найдена');
    all[idx].status = status;
    all[idx].updated_at = new Date().toISOString();
    setLocalData(LS_STORAGE, all);
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('car_storage')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating storage status:', error);
    throw new Error(error.message);
  }
}

/**
 * Get all storage records (admin)
 */
export async function getAllStorageAdmin(): Promise<CarStorage[]> {
  if (!isSupabaseConfigured()) {
    return getLocalData<CarStorage>(LS_STORAGE);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('car_storage')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all storage records:', error);
    return [];
  }

  return (data as CarStorage[]) || [];
}

// ============================================================================
// 7. PRICE CALCULATION
// ============================================================================

/**
 * Calculate full travel price breakdown
 * Commission is 15% of the subtotal (rental + storage)
 */
export function calculateTravelPrice(
  car: PartnerCar,
  startDate: string,
  endDate: string,
  hasStorage: boolean,
  storagePricePerDay: number = 0,
): TravelPriceBreakdown {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  const totalRentalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const totalRentalPrice = totalRentalDays * car.price_per_day;

  const totalStorageDays = hasStorage ? totalRentalDays : 0;
  const totalStoragePrice = totalStorageDays * storagePricePerDay;

  const subtotal = totalRentalPrice + totalStoragePrice;
  const commissionPrice = Math.round(subtotal * 0.15 * 100) / 100;
  const totalPrice = subtotal + commissionPrice;

  return {
    totalRentalDays,
    totalRentalPrice,
    totalStorageDays,
    totalStoragePrice,
    commissionPrice,
    totalPrice,
  };
}

// ============================================================================
// 8. PARTNER-SPECIFIC FUNCTIONS
// ============================================================================

// Get bookings for a specific partner (by their rental_partners record)
export async function getPartnerBookings(partnerId: string): Promise<TravelBooking[]> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelBooking>(LS_BOOKINGS);
    return all.filter((b) => b.partner_id === partnerId);
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('travel_bookings')
    .select('*, destination:travel_destinations(*), car:partner_cars(*), location:partner_locations(*)')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('Error:', error); return []; }
  return (data as TravelBooking[]) || [];
}

// Get storage records for a specific partner
export async function getPartnerStorageRecords(partnerId: string): Promise<CarStorage[]> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<CarStorage>(LS_STORAGE);
    return all.filter((s) => s.partner_id === partnerId);
  }
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('car_storage')
    .select('*, travel_booking:travel_bookings(*)')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) { console.error('Error:', error); return []; }
  return (data as CarStorage[]) || [];
}

// Get partner stats (for partner dashboard)
export async function getPartnerStats(partnerId: string): Promise<{
  totalBookings: number;
  activeBookings: number;
  totalCars: number;
  availableCars: number;
  totalStorage: number;
  activeStorage: number;
  totalRevenue: number;
}> {
  const bookings = await getPartnerBookings(partnerId);
  const cars = await getPartnerCars(partnerId);
  const storage = await getPartnerStorageRecords(partnerId);

  return {
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length,
    totalCars: cars.length,
    availableCars: cars.filter(c => c.is_available && c.is_active).length,
    totalStorage: storage.length,
    activeStorage: storage.filter(s => s.status === 'in_storage').length,
    totalRevenue: bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + b.total_price, 0),
  };
}

// Update partner car availability
export async function updatePartnerCarAvailability(carId: string, isAvailable: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<PartnerCar>(LS_CARS);
    const idx = all.findIndex(c => c.id === carId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], is_available: isAvailable };
      setLocalData(LS_CARS, all);
    }
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('partner_cars')
    .update({ is_available: isAvailable })
    .eq('id', carId);
  if (error) console.error('Error updating car availability:', error);
}

// Confirm a booking by partner
export async function confirmTravelBooking(bookingId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<TravelBooking>(LS_BOOKINGS);
    const idx = all.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], status: 'confirmed' };
      setLocalData(LS_BOOKINGS, all);
    }
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('travel_bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId);
  if (error) console.error('Error confirming booking:', error);
}

// Mark car as checked in to storage
export async function markStorageCheckIn(storageId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<CarStorage>(LS_STORAGE);
    const idx = all.findIndex(s => s.id === storageId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], status: 'in_storage', actual_check_in: new Date().toISOString() };
      setLocalData(LS_STORAGE, all);
    }
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('car_storage')
    .update({ status: 'in_storage', actual_check_in: new Date().toISOString() })
    .eq('id', storageId);
  if (error) console.error('Error marking storage check-in:', error);
}

// Mark car as checked out from storage
export async function markStorageCheckOut(storageId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const all = getLocalData<CarStorage>(LS_STORAGE);
    const idx = all.findIndex(s => s.id === storageId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], status: 'completed', actual_check_out: new Date().toISOString() };
      setLocalData(LS_STORAGE, all);
    }
    return;
  }
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('car_storage')
    .update({ status: 'completed', actual_check_out: new Date().toISOString() })
    .eq('id', storageId);
  if (error) console.error('Error marking storage check-out:', error);
}
