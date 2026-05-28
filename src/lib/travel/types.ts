// ============================================================================
// Sea Trips (Поездки на море) — TypeScript types matching the database schema
// ============================================================================

/**
 * Travel Destination — sea resort city (e.g. "Сочи", "Анапа")
 */
export interface TravelDestination {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Rental Partner — car rental company
 */
export interface RentalPartner {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  commission_rate: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

/**
 * Partner Location — office where user picks up or stores a car
 */
export interface PartnerLocation {
  id: string;
  partner_id: string;
  destination_id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  has_storage: boolean;
  has_rental: boolean;
  created_at: string;
  // Joined fields
  partner?: RentalPartner;
  destination?: TravelDestination;
}

/**
 * Partner Car — vehicle available for rent
 */
export interface PartnerCar {
  id: string;
  partner_id: string;
  location_id: string | null;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  license_plate: string | null;
  transmission: 'manual' | 'automatic';
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  price_per_day: number;
  deposit: number;
  image: string | null;
  images: string[];
  description: string | null;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  partner?: RentalPartner;
  location?: PartnerLocation;
}

/**
 * Travel Booking — full rental + optional storage booking
 */
export interface TravelBooking {
  id: string;
  user_id: string;
  destination_id: string;
  partner_id: string;
  car_id: string;
  location_id: string | null;
  start_date: string;
  end_date: string;
  rental_price_per_day: number;
  total_rental_days: number;
  total_rental_price: number;
  has_storage: boolean;
  storage_price_per_day: number;
  total_storage_days: number | null;
  total_storage_price: number;
  own_car_brand: string | null;
  own_car_model: string | null;
  own_car_color: string | null;
  own_car_license_plate: string | null;
  total_price: number;
  commission_price: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'partially_refunded';
  payment_method: string | null;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  destination?: TravelDestination;
  partner?: RentalPartner;
  car?: PartnerCar;
  location?: PartnerLocation;
}

/**
 * Car Storage Record — separate tracking when user stores own car
 */
export interface CarStorage {
  id: string;
  travel_booking_id: string;
  partner_id: string;
  location_id: string | null;
  car_brand: string;
  car_model: string;
  car_color: string | null;
  car_license_plate: string;
  check_in_date: string;
  check_out_date: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  status: 'pending' | 'in_storage' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Helper / Form types
// ============================================================================

export interface TravelSearchParams {
  destination_slug?: string;
  start_date: string;
  end_date: string;
  min_price?: number;
  max_price?: number;
  transmission?: 'manual' | 'automatic';
  seats?: number;
}

export interface TravelBookingForm {
  destination_id: string;
  partner_id: string;
  car_id: string;
  location_id?: string;
  start_date: string;
  end_date: string;
  has_storage: boolean;
  own_car_brand?: string;
  own_car_model?: string;
  own_car_color?: string;
  own_car_license_plate?: string;
  notes?: string;
}

export interface UserCarInfo {
  brand: string;
  model: string;
  color?: string;
  license_plate?: string;
}

// ============================================================================
// Admin types
// ============================================================================

export interface AdminTravelStats {
  total_bookings: number;
  active_bookings: number;
  total_revenue: number;
  total_commission: number;
  total_cars: number;
  total_partners: number;
  total_destinations: number;
  recent_bookings: TravelBooking[];
}

// ============================================================================
// Local storage types for demo / fallback mode
// ============================================================================

export interface LocalTravelData {
  bookings: TravelBooking[];
  storage: CarStorage[];
}

// ============================================================================
// Price calculation result
// ============================================================================

export interface TravelPriceBreakdown {
  totalRentalDays: number;
  totalRentalPrice: number;
  totalStorageDays: number;
  totalStoragePrice: number;
  commissionPrice: number;
  totalPrice: number;
}
