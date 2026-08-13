import { getSupabaseClient, isSupabaseConfigured, Promotion, PromotionInsert, PromotionUpdate } from './shared';

export async function getActivePromotions(): Promise<Promotion[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  let query = supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Filter by date range: starts_at <= now AND (ends_at IS NULL OR ends_at >= now)
  query = query.lte('starts_at', now);
  query = query.or(`ends_at.is.null,ends_at.gte.${now}`);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching active promotions:', error);
    return [];
  }

  return (data as Promotion[]) || [];
}

export async function getAllPromotionsAdmin(): Promise<Promotion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promotions:', error);
    return [];
  }

  return (data as Promotion[]) || [];
}

export async function createPromotion(promotion: PromotionInsert, retries = 3): Promise<Promotion> {
  const supabase = getSupabaseClient();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }

      const { data, error } = await supabase
        .from('promotions')
        .insert({
          title: promotion.title || null,
          description: promotion.description || null,
          image_url: promotion.image_url || null,
          link_url: promotion.link_url || null,
          link_text: promotion.link_text || null,
          bg_color: promotion.bg_color || '#2563eb',
          text_color: promotion.text_color || '#ffffff',
          is_active: promotion.is_active ?? true,
          sort_order: promotion.sort_order ?? 0,
          starts_at: promotion.starts_at || new Date().toISOString(),
          ends_at: promotion.ends_at || null,
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) {
          continue; // Retry on lock contention
        }
        console.error('Error creating promotion:', error);
        throw new Error(error.message);
      }

      return data as Promotion;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) {
        continue; // Retry
      }
      throw err;
    }
  }

  throw new Error('Не удалось создать акцию. Попробуйте ещё раз.');
}

export async function updatePromotion(id: string, updates: PromotionUpdate, retries = 3): Promise<Promotion> {
  const supabase = getSupabaseClient();
  const dbUpdates: Record<string, any> = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title || null;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url || null;
  if (updates.link_url !== undefined) dbUpdates.link_url = updates.link_url || null;
  if (updates.link_text !== undefined) dbUpdates.link_text = updates.link_text || null;
  if (updates.bg_color !== undefined) dbUpdates.bg_color = updates.bg_color;
  if (updates.text_color !== undefined) dbUpdates.text_color = updates.text_color;
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
  if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;
  if (updates.starts_at !== undefined) dbUpdates.starts_at = updates.starts_at;
  if (updates.ends_at !== undefined) dbUpdates.ends_at = updates.ends_at;
  dbUpdates.updated_at = new Date().toISOString();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }

      const { data, error } = await supabase
        .from('promotions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('Lock')) {
          continue;
        }
        console.error('Error updating promotion:', error);
        throw new Error(error.message);
      }

      return data as Promotion;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Не удалось обновить акцию. Попробуйте ещё раз.');
}

export async function deletePromotion(id: string, retries = 3): Promise<void> {
  const supabase = getSupabaseClient();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }

      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.message?.includes('Lock')) {
          continue;
        }
        console.error('Error deleting promotion:', error);
        throw new Error(error.message);
      }

      return;
    } catch (err: any) {
      if (err?.message?.includes('Lock') || err?.message?.includes('claim')) {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Не удалось удалить акцию. Попробуйте ещё раз.');
}
