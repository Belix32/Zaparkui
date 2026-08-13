import { getSupabaseClient, isSupabaseConfigured, Booking, BookingInsert } from './shared';

export async function checkParkingAvailability(
  parkingId: string, 
  startDate: string, 
  endDate: string
): Promise<{ available: boolean; message: string }> {
  const supabase = getSupabaseClient();
  
  // Check for existing confirmed/active bookings that overlap
  const { data: existingBookings, error } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, spots')
    .eq('parking_id', parkingId)
    .in('status', ['pending', 'confirmed', 'active'])
    .gte('end_date', startDate)
    .lte('start_date', endDate)
    .limit(10);
  
  if (error) {
    console.error('Error checking availability:', error);
    return { available: false, message: 'Не удалось проверить доступность парковки. Попробуйте ещё раз.' };
  }
  
  if (existingBookings && existingBookings.length > 0) {
    return { 
      available: false, 
      message: 'На эти даты уже есть бронирование. Выберите другие даты.' 
    };
  }
  
  return { available: true, message: '' };
}

export async function createBooking(booking: BookingInsert, retries = 3): Promise<Booking> {
  const supabase = getSupabaseClient();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Small delay between retries to avoid lock conflicts
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking as any)
        .select()
        .single();

      if (error) {
        // Check if it's a lock error
        if (error.message?.includes('Lock')) {
          lastError = new Error(error.message);
          continue; // Retry
        }
        console.error('Error creating booking:', error);
        throw new Error(error.message);
      }

      return data as Booking;
    } catch (err: any) {
      // Check if it's a retryable error
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) {
        lastError = err;
        continue; // Retry
      }
      throw err;
    }
  }
  
  // All retries failed
  console.error('All booking creation retries failed:', lastError);
  throw lastError || new Error('Не удалось создать бронирование. Попробуйте ещё раз.');
}

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

export async function getAllBookingsAdmin(): Promise<Booking[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parking:parkings(title, address), user:profiles(email, name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return (data as Booking[]) || [];
}

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
