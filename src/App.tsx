import { Routes, Route } from 'react-router-dom';
import { Home, Catalog, ParkingDetail, Login, Register, Dashboard, Profile } from './pages';
import { BookingPage, BookingConfirm, BookingSuccess } from './pages/Booking';
import { BookingsHistory } from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:id" element={<Catalog />} />
      <Route path="/parking" element={<ParkingDetail />} />
      <Route path="/parking/:id" element={<ParkingDetail />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/confirm" element={<BookingConfirm />} />
      <Route path="/booking/success" element={<BookingSuccess />} />
      <Route path="/my-bookings" element={<BookingsHistory />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;