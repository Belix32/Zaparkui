/**
 * App.tsx - Главный компонент приложения «Запаркуй»
 * 
 * Поддерживает два режима:
 * - Web: React Router DOM
 * - Mobile (Capacitor): React Navigation с Bottom Tabs
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages / Страницы
import { Home, Catalog, Login, Register, Dashboard, Profile } from './pages';

// Auth Context / Контекст аутентификации
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ============================================================================
// Mobile Navigation - только для Capacitor сборки
// ============================================================================

// Динамический импорт для избежания проблем с react-native в вебе
let MobileNavigation: React.ComponentType | null = null;
let NavigationContainer: React.ComponentType | null = null;

// Попытка загрузить мобильную навигацию (только в Capacitor окружении)
if (typeof window !== 'undefined' && 'Capacitor' in window) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mobileNav = require('./navigation/MobileNavigator');
    MobileNavigation = mobileNav.MobileNavigation;
    NavigationContainer = mobileNav.NavigationContainer;
  } catch {
    MobileNavigation = null;
    NavigationContainer = null;
  }
}

// ============================================================================
// Page Wrappers / Обертки для навигации
// ============================================================================

/**
 * Компонент страницы с layout-ом
 */
interface PageWrapperProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
}

function PageWrapper({ children, showFooter = true, showHeader = true }: PageWrapperProps) {
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
          element={
            <PageWrapper showFooter={true} showHeader={true}>
              <Home />
            </PageWrapper>
          } 
        />
        <Route 
          path="/catalog" 
          element={
            <PageWrapper showFooter={true} showHeader={true}>
              <Catalog />
            </PageWrapper>
          } 
        />
        <Route 
          path="/catalog/:id" 
          element={
            <PageWrapper showFooter={false} showHeader={false}>
              <Catalog />
            </PageWrapper>
          } 
        />
        <Route 
          path="/login" 
          element={
            <PageWrapper showFooter={false} showHeader={false}>
              <Login />
            </PageWrapper>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PageWrapper showFooter={false} showHeader={false}>
              <Register />
            </PageWrapper>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <PageWrapper showFooter={true} showHeader={true}>
              <Dashboard />
            </PageWrapper>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PageWrapper showFooter={true} showHeader={true}>
              <Profile />
            </PageWrapper>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// Mobile App / Мобильное приложение
// ============================================================================

/**
 * MobileApp - навигация для мобильных устройств
 */
function MobileApp() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Показываем загрузку пока проверяем аутентификацию
  if (isLoading) {
    return (
      <div className="mobile-splash">
        <div className="loading-spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }
  
  // Если мобильная навигация недоступна, используем веб-версию
  if (!MobileNavigation) {
    return <WebApp />;
  }
  
  return (
    <NavigationContainer>
      <MobileNavigation isAuthenticated={isAuthenticated} />
    </NavigationContainer>
  );
}

// ============================================================================
// Root App / Главный компонент
// ============================================================================

/**
 * Главный компонент приложения
 * Автоматически определяет режим работы (web/mobile)
 */
function AppContent() {
  const [isMobile, setIsMobile] = useState(false);
  const [isCapacitorReady, setIsCapacitorReady] = useState(false);
  
  useEffect(() => {
    // Проверка окружения Capacitor
    const checkPlatform = async () => {
      // Проверка через Capacitor API
      const platform = window.Capacitor?.isNativePlatform?.() 
        ? await window.Capacitor.getPlatform() 
        : 'web';
      
      setIsMobile(platform !== 'web');
      setIsCapacitorReady(true);
    };
    
    // Задержка для инициализации Capacitor
    if (window.Capacitor) {
      checkPlatform();
    } else {
      setIsCapacitorReady(true);
    }
  }, []);
  
  // Ожидание инициализации платформы
  if (!isCapacitorReady) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }
  
  return (
    <AuthProvider>
      {isMobile ? <MobileApp /> : <WebApp />}
    </AuthProvider>
  );
}

// ============================================================================
// App Export / Экспорт
// ============================================================================

/**
 * Main App компонент - точка входа
 */
function App() {
  return <AppContent />;
}

export default App;

// ============================================================================
// Type augmentations / Расширения типов
// ============================================================================

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => Promise<string>;
    };
  }
}