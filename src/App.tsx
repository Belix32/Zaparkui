import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Lazy load all pages - only load when needed
const Home = lazy(() => import('./pages/Home/Home').then(m => ({ default: m.Home })));
const Catalog = lazy(() => import('./pages/Catalog/Catalog').then(m => ({ default: m.Catalog })));
const ParkingDetail = lazy(() => import('./pages/ParkingDetail/ParkingDetail').then(m => ({ default: m.ParkingDetail })));
const Login = lazy(() => import('./pages/Login/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/Profile/Profile').then(m => ({ default: m.Profile })));

// Admin routes - lazy load since rarely used
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminParkings = lazy(() => import('./pages/Admin/AdminParkings').then(m => ({ default: m.AdminParkings })));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminBookings = lazy(() => import('./pages/Admin/AdminBookings').then(m => ({ default: m.AdminBookings })));
const AdminReviews = lazy(() => import('./pages/Admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminPromotions = lazy(() => import('./pages/Admin/AdminPromotions').then(m => ({ default: m.AdminPromotions })));

// Booking pages
const BookingPage = lazy(() => import('./pages/Booking/BookingPage').then(m => ({ default: m.BookingPage })));
const BookingConfirm = lazy(() => import('./pages/Booking/BookingConfirm').then(m => ({ default: m.BookingConfirm })));
const BookingSuccess = lazy(() => import('./pages/Booking/BookingSuccess').then(m => ({ default: m.BookingSuccess })));
const BookingsHistory = lazy(() => import('./pages/Profile/BookingsHistory').then(m => ({ default: m.BookingsHistory })));

// Admin login
const AdminLogin = lazy(() => import('./pages/AdminLogin/AdminLogin').then(m => ({ default: m.AdminLogin })));

// Payment coming soon
const PaymentComingSoon = lazy(() => import('./pages/PaymentComingSoon/PaymentComingSoon').then(m => ({ default: m.PaymentComingSoon })));

// Travel module (Sea Trips)
const TravelHome = lazy(() => import('./pages/Travel/TravelHome').then(m => ({ default: m.TravelHome })));
const TravelSearch = lazy(() => import('./pages/Travel/TravelSearch').then(m => ({ default: m.TravelSearch })));
const TravelBooking = lazy(() => import('./pages/Travel/TravelBooking').then(m => ({ default: m.TravelBooking })));
const TravelBookingConfirm = lazy(() => import('./pages/Travel/TravelBookingConfirm').then(m => ({ default: m.TravelBookingConfirm })));
const TravelBookingSuccess = lazy(() => import('./pages/Travel/TravelBookingSuccess').then(m => ({ default: m.TravelBookingSuccess })));
const MyTravelTrips = lazy(() => import('./pages/Travel/MyTravelTrips').then(m => ({ default: m.MyTravelTrips })));
const TravelMap = lazy(() => import('./pages/Travel/TravelMap').then(m => ({ default: m.TravelMap })));

// Travel Admin pages
const AdminTravelDashboard = lazy(() => import('./pages/Admin/AdminTravelDashboard').then(m => ({ default: m.AdminTravelDashboard })));
const AdminTravelDestinations = lazy(() => import('./pages/Admin/AdminTravelDestinations').then(m => ({ default: m.AdminTravelDestinations })));
const AdminTravelPartners = lazy(() => import('./pages/Admin/AdminTravelPartners').then(m => ({ default: m.AdminTravelPartners })));
const AdminTravelCars = lazy(() => import('./pages/Admin/AdminTravelCars').then(m => ({ default: m.AdminTravelCars })));
const AdminTravelBookings = lazy(() => import('./pages/Admin/AdminTravelBookings').then(m => ({ default: m.AdminTravelBookings })));
const AdminTravelStorage = lazy(() => import('./pages/Admin/AdminTravelStorage').then(m => ({ default: m.AdminTravelStorage })));

// Partner Cabinet pages
const PartnerDashboard = lazy(() => import('./pages/Partner/PartnerDashboard').then(m => ({ default: m.PartnerDashboard })));
const PartnerCars = lazy(() => import('./pages/Partner/PartnerCars').then(m => ({ default: m.PartnerCars })));
const PartnerBookings = lazy(() => import('./pages/Partner/PartnerBookings').then(m => ({ default: m.PartnerBookings })));
const PartnerStorage = lazy(() => import('./pages/Partner/PartnerStorage').then(m => ({ default: m.PartnerStorage })));

// Loading fallback component
function PageLoader() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: '#1a1a2e',
      color: '#fff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '3px solid #00d9ff',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Загрузка...
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <a href="#main" className="skipLink">Перейти к основному контенту</a>
      <main id="main" role="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<Catalog />} />
            <Route path="/parking" element={<ParkingDetail />} />
            <Route path="/parking/:id" element={<ParkingDetail />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:id" element={<BookingPage />} />
            <Route path="/booking/confirm" element={<BookingConfirm />} />
            <Route path="/booking/success" element={<BookingSuccess />} />
            <Route path="/my-bookings" element={<BookingsHistory />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* Admin routes - lazy loaded */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/payment-soon" element={<PaymentComingSoon />} />
            <Route path="/admin/parkings" element={<AdminParkings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/promotions" element={<AdminPromotions />} />
            
            {/* Travel Module Routes */}
            <Route path="/travel" element={<TravelHome />} />
            <Route path="/travel/search" element={<TravelSearch />} />
            <Route path="/travel/booking/:carId" element={<TravelBooking />} />
            <Route path="/travel/booking/confirm" element={<TravelBookingConfirm />} />
            <Route path="/travel/booking/success" element={<TravelBookingSuccess />} />
            <Route path="/travel/my-trips" element={<MyTravelTrips />} />
            <Route path="/travel/map" element={<TravelMap />} />
            
            {/* Travel Admin Routes */}
            <Route path="/admin/travel" element={<AdminTravelDashboard />} />
            <Route path="/admin/travel/destinations" element={<AdminTravelDestinations />} />
            <Route path="/admin/travel/partners" element={<AdminTravelPartners />} />
            <Route path="/admin/travel/cars" element={<AdminTravelCars />} />
            <Route path="/admin/travel/bookings" element={<AdminTravelBookings />} />
            <Route path="/admin/travel/storage" element={<AdminTravelStorage />} />
            
            {/* Partner Cabinet Routes */}
            <Route path="/partner" element={<PartnerDashboard />} />
            <Route path="/partner/cars" element={<PartnerCars />} />
            <Route path="/partner/bookings" element={<PartnerBookings />} />
            <Route path="/partner/storage" element={<PartnerStorage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default App;