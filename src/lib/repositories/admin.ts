import { getSupabaseClient, isSupabaseConfigured, Profile, Parking, Booking, Review } from './shared';

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
    supabase.from('profiles').select('*'),
    supabase.from('parkings').select('*'),
    supabase.from('bookings').select('*'),
  ]);

  const users = (usersResult.data || []) as Profile[];
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
