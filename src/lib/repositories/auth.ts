import { getSupabaseClient, isSupabaseConfigured, Profile } from './shared';

export async function createUser(user: { email: string; name: string; phone?: string }): Promise<Profile> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert(user as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error(error.message);
  }

  return data as Profile;
}

export async function getUserById(id: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
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

  return data as Profile;
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
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

  return data as Profile;
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return (data as Profile[]) || [];
}

export async function updateUserRole(userId: string, role: 'user' | 'moderator' | 'admin'): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user role:', error);
    throw new Error(error.message);
  }
}

export async function setUserBlocked(userId: string, isBlocked: boolean): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user blocked status:', error);
    throw new Error(error.message);
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }
}

export async function getRecentUsers(limit: number = 2): Promise<Profile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent users:', error);
    return [];
  }

  return (data as Profile[]) || [];
}
