import { getSupabaseClient, isSupabaseConfigured, Review, ReviewInsert } from './shared';

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

export async function getAllReviewsAdmin(): Promise<Review[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*, parking:parkings(title), user:profiles(name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return (data as Review[]) || [];
}

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
