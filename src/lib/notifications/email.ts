import { Booking, Parking } from '../supabase';

/**
 * Email notification types
 */
export interface EmailNotificationData {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send confirmation email for a booking
 * Stub function - to be implemented with Supabase Edge Function
 */
export async function sendConfirmation(
  booking: Booking,
  parking: Parking,
  userEmail: string
): Promise<boolean> {
  console.log('[EMAIL] Sending confirmation email:', {
    to: userEmail,
    bookingId: booking.id,
    parking: parking.title,
    dates: `${booking.start_date} - ${booking.end_date}`,
  });

  // Stub: In production, this would call Supabase Edge Function
  // await supabase.functions.invoke('send-email', {
  //   body: {
  //     type: 'confirmation',
  //     to: userEmail,
  //     booking: {
  //       id: booking.id,
  //       parking: parking.title,
  //       address: parking.address,
  //       startDate: booking.start_date,
  //       endDate: booking.end_date,
  //       car: `${booking.car_brand} ${booking.car_model}`,
  //       licensePlate: booking.car_number,
  //       totalPrice: booking.total_price,
  //       qrCode: booking.qr_code,
  //     },
  //   },
  // });

  return true;
}

/**
 * Send reminder email before booking start date
 * Stub function - to be implemented with Supabase Edge Function
 */
export async function sendReminder(
  booking: Booking,
  parking: Parking,
  userEmail: string
): Promise<boolean> {
  console.log('[EMAIL] Sending reminder email:', {
    to: userEmail,
    bookingId: booking.id,
    parking: parking.title,
    startDate: booking.start_date,
  });

  // Stub: In production, this would call Supabase Edge Function
  // await supabase.functions.invoke('send-email', {
  //   body: {
  //     type: 'reminder',
  //     to: userEmail,
  //     booking: {
  //       id: booking.id,
  //       parking: parking.title,
  //       address: parking.address,
  //       startDate: booking.start_date,
  //       car: `${booking.car_brand} ${booking.car_model}`,
  //       qrCode: booking.qr_code,
  //     },
  //   },
  // });

  return true;
}

/**
 * Send cancellation confirmation email
 * Stub function - to be implemented with Supabase Edge Function
 */
export async function sendCancellation(
  booking: Booking,
  parking: Parking,
  userEmail: string,
  reason?: string
): Promise<boolean> {
  console.log('[EMAIL] Sending cancellation email:', {
    to: userEmail,
    bookingId: booking.id,
    parking: parking.title,
    reason: reason || 'User requested',
  });

  // Stub: In production, this would call Supabase Edge Function
  return true;
}

/**
 * Send booking extended notification
 * Stub function - to be implemented with Supabase Edge Function
 */
export async function sendExtension(
  booking: Booking,
  parking: Parking,
  userEmail: string,
  newEndDate: string
): Promise<boolean> {
  console.log('[EMAIL] Sending extension email:', {
    to: userEmail,
    bookingId: booking.id,
    parking: parking.title,
    newEndDate: newEndDate,
  });

  // Stub: In production, this would call Supabase Edge Function
  return true;
}