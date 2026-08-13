import { getSupabaseClient, isSupabaseConfigured, Favorite } from './shared';

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
