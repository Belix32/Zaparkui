/**
 * App.tsx - Главный компонент приложения «Запаркуй»
 * 
 * Поддерживает:
 * - Web: React Router DOM
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages / Страницы
import { Home, Catalog, Login, Register, Dashboard, Profile, BookingPage, BookingConfirm, BookingSuccess } from './pages';

// Auth Context / Контекст аутентификации
import { AuthProvider } from './contexts/AuthContext';

// ============================================================================
// Page Wrapper / Обёртка страницы
// ============================================================================

interface PageWrapperProps {
  children: React.ReactNode;
}

function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="page-wrapper">
      {children}
    </div>
  );
}

// ============================================================================
// Web Routes / Веб-маршруты
// ============================================================================

/**
 * WebApp - маршрутизация для веба
 */
function WebApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<PageWrapper><Home /></PageWrapper>} 
        />
        <Route 
          path="/catalog" 
          element={<PageWrapper><Catalog /></PageWrapper>} 
        />
        <Route 
          path="/catalog/:id" 
          element={<PageWrapper><Catalog /></PageWrapper>} 
        />
        <Route 
          path="/login" 
          element={<PageWrapper><Login /></PageWrapper>} 
        />
        <Route 
          path="/register" 
          element={<PageWrapper><Register /></PageWrapper>} 
        />
        <Route 
          path="/dashboard" 
          element={<PageWrapper><Dashboard /></PageWrapper>} 
        />
        <Route 
          path="/profile" 
          element={<PageWrapper><Profile /></PageWrapper>} 
        />
        <Route 
          path="/booking" 
          element={<PageWrapper><BookingPage /></PageWrapper>} 
        />
        <Route 
          path="/booking/confirm" 
          element={<PageWrapper><BookingConfirm /></PageWrapper>} 
        />
        <Route 
          path="/booking/success" 
          element={<PageWrapper><BookingSuccess /></PageWrapper>} 
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// Root App / Главный компонент
// ============================================================================

/**
 * Главный компонент приложения
 */
export default function App() {
  return (
    <AuthProvider>
      <WebApp />
    </AuthProvider>
  );
}