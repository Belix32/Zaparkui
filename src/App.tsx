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

// Booking pages
const BookingPage = lazy(() => import('./pages/Booking/BookingPage').then(m => ({ default: m.BookingPage })));
const BookingConfirm = lazy(() => import('./pages/Booking/BookingConfirm').then(m => ({ default: m.BookingConfirm })));
const BookingSuccess = lazy(() => import('./pages/Booking/BookingSuccess').then(m => ({ default: m.BookingSuccess })));
const BookingsHistory = lazy(() => import('./pages/Profile/BookingsHistory').then(m => ({ default: m.BookingsHistory })));

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
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/parkings" element={<AdminParkings />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default App;