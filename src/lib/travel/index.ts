/**
 * Sea Trips (Поездки на море) — travel module
 *
 * Provides types, API functions, and price calculation for the
 * travel / sea trips feature: destinations, rental partners,
 * cars, locations, bookings, and car storage.
 */

// Export all types
export * from './types';

// Export all API functions
export {
  // Destinations
  getActiveDestinations,
  getDestinationBySlug,
  getDestinationById,
  getAllDestinationsAdmin,
  createDestination,
  updateDestination,
  deleteDestination,

  // Partners
  getActivePartners,
  getPartnerById,
  getPartnersByDestination,
  getAllPartnersAdmin,
  createPartner,
  updatePartner,
  deletePartner,

  // Cars
  getAvailableCars,
  getPartnerCars,
  getCarById,
  getAllCarsAdmin,
  createCar,
  updateCar,
  deleteCar,

  // Locations
  getPartnerLocations,
  getLocationsByDestination,
  getLocationById,
  getAllLocationsAdmin,
  createLocation,
  updateLocation,
  deleteLocation,

  // Bookings
  createTravelBooking,
  getUserTravelBookings,
  getTravelBookingById,
  updateTravelBookingStatus,
  cancelTravelBooking,
  checkCarAvailability,
  getAllTravelBookingsAdmin,
  getAdminTravelStats,

  // Storage
  createStorageRecord,
  getBookingStorage,
  updateStorageStatus,
  getAllStorageAdmin,

  // Price calculation
  calculateTravelPrice,

  // Partner-specific
  getPartnerBookings,
  getPartnerStorageRecords,
  getPartnerStats,
  updatePartnerCarAvailability,
  confirmTravelBooking,
  markStorageCheckIn,
  markStorageCheckOut,
} from './api';
