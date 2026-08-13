import { getSupabaseClient, isSupabaseConfigured, Parking, ParkingInsert, ParkingUpdate, ParkingFilters } from './shared';
import { parkings as staticParkings } from '../../data/parkings';

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

export async function createParking(parking: ParkingInsert): Promise<Parking> {
  const supabase = getSupabaseClient();
  // Map camelCase → snake_case for DB columns
  const dbParking: Record<string, any> = {
    title: parking.title,
    address: parking.address,
    price: parking.price,
    spots: parking.spots,
    image: parking.image || null,
    images: parking.images || null,
    description: parking.description || null,
    district: parking.district || null,
    metro: parking.metro || null,
    parking_type: parking.parkingType,
    amenities: parking.amenities || null,
    latitude: parking.latitude || null,
    longitude: parking.longitude || null,
    owner_id: parking.owner_id || null,
    owner_email: parking.owner_email || null,
  };

  const { data, error } = await supabase
    .from('parkings')
    .insert(dbParking)
    .select()
    .single();

  if (error) {
    console.error('Error creating parking:', error);
    throw new Error(error.message);
  }

  return data as Parking;
}

export async function updateParking(id: string, parking: ParkingUpdate): Promise<Parking> {
  const supabase = getSupabaseClient();
  // Map camelCase → snake_case for DB columns
  const dbParking: Record<string, any> = {};
  if (parking.title !== undefined) dbParking.title = parking.title;
  if (parking.address !== undefined) dbParking.address = parking.address;
  if (parking.price !== undefined) dbParking.price = parking.price;
  if (parking.spots !== undefined) dbParking.spots = parking.spots;
  if (parking.image !== undefined) dbParking.image = parking.image;
  if (parking.images !== undefined) dbParking.images = parking.images;
  if (parking.description !== undefined) dbParking.description = parking.description;
  if (parking.district !== undefined) dbParking.district = parking.district;
  if (parking.metro !== undefined) dbParking.metro = parking.metro;
  if (parking.parkingType !== undefined) dbParking.parking_type = parking.parkingType;
  if (parking.amenities !== undefined) dbParking.amenities = parking.amenities;
  if (parking.latitude !== undefined) dbParking.latitude = parking.latitude;
  if (parking.longitude !== undefined) dbParking.longitude = parking.longitude;
  if (parking.is_active !== undefined) dbParking.is_active = parking.is_active;
  if (parking.status !== undefined) dbParking.status = parking.status;
  dbParking.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('parkings')
    .update(dbParking)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating parking:', error);
    throw new Error(error.message);
  }

  return data as Parking;
}

export async function deleteParking(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('parkings').delete().eq('id', id);

  if (error) {
    console.error('Error deleting parking:', error);
    throw new Error(error.message);
  }
}

export async function uploadParkingImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();
  
  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `parking-${timestamp}-${random}.${extension}`;
  
  // Upload to Storage
  const { data, error } = await supabase.storage
    .from('parking-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
  
  if (error) {
    console.error('Error uploading image:', error);
    throw new Error('Ошибка загрузки изображения');
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('parking-images')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
}

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
