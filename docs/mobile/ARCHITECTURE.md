# Архитектура мобильного приложения «Запаркуй»

**Дата:** 23 апреля 2026 года  
**Версия:** 1.0  
**Статус:** Утверждено  
**Платформа:** Capacitor (Android + iOS)

---

## 1. Структура проекта

### 1.1 Общая структура

```
src/
├── components/          # Переиспользуемые UI-компоненты
│   ├── Mobile/         # Мобильные специфичные компоненты
│   │   ├── MobileButton/
│   │   ├── MobileCard/
│   │   └── MobileInput/
│   ├── Map/
│   ├── ParkingCard/
│   ├── FilterPanel/
│   ├── Reviews/
│   ├── Header/
│   ├── Footer/
│   └── Input/
├── pages/              # Экраны приложения
│   ├── Home/           # Главная страница
│   ├── Catalog/        # Каталог парковок
│   ├── ParkingDetail/ # Детали парковки
│   ├── Favorites/      # Избранное
│   ├── Profile/        # Профиль пользователя
│   ├── Login/          # Вход
│   ├── Register/      # Регистрация
│   └── Bookings/       # История бронирований
├── navigation/          # Навигационная конфигурация
│   ├── RootNavigator.tsx
│   ├── TabNavigator.tsx
│   └── types.ts
├── stores/              # Zustand сторы
│   ├── authStore.ts
│   ├── parkingStore.ts
│   ├── favoritesStore.ts
│   ├── searchStore.ts
│   └── bookingStore.ts
├── lib/                # Утилиты и интеграции
│   ├── supabase.ts
│   ├── storage.ts      # Capacitor Storage обёртка
│   ├── offline.ts     # Офлайн-логика
│   └── api.ts        # API клиент
├── hooks/              # Кастомные хуки
│   ├── useGeolocation.ts
│   ├── useParkings.ts
│   ├── useFavorites.ts
│   └── useSearchHistory.ts
├── contexts/           # React контексты
│   └── AuthContext.tsx
└── styles/             # Стили
    ├── variables.css
    └── mobile-tokens.css

ios/android/            # Нативная часть (Capacitor)
```

### 1.2 Структура папок страниц (по модулям)

Каждый экран — отдельный модуль с изолированными стилями:

```
pages/Home/
├── Home.tsx           # Компонент страницы
├── Home.module.css    # Стили
└── index.ts         # Экспорт

pages/ParkingDetail/
├── ParkingDetail.tsx
├── ParkingDetail.module.css
└── index.ts
```

---

## 2. Навигация

### 2.1 Архитектура навигации

Используется React Navigation 7 с двухуровневой структурой:

```
Root Navigator (Stack)
├── Auth Stack (если не авторизован)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
│
└── Main Tab Navigator (если авторизован)
    ├── Home Tab (Stack)
    │   ├── Home (главная)
    │   └── ParkingDetail (детали)
    │
    ├── Catalog Tab (Stack)
    │   ├── Catalog (список)
    │   └── ParkingDetail
    │
    ├── Favorites Tab (Stack)
    │   ├── Favorites (избранное)
    │   └── ParkingDetail
    │
    └── Profile Tab (Stack)
        ├── Profile (профиль)
        ├── Bookings (история)
        └── Settings (настройки)
```

### 2.2 Bottom Tab Bar

| Таб | Иконка | Экран | Описание |
|-----|-------|-------|----------|
| Главная | `home` | Home | Поиск, рекомендации |
| Каталог | `list` | Catalog | Все парковки |
| Избранное | `heart` | Favorites | Сохранённые |
| Профиль | `user` | Profile | Пользователь |

### 2.3 Конфигурация табов

```typescript
// navigation/tabs.ts
const tabs = [
  {
    name: 'Home',
    title: 'Главная',
    icon: HomeIcon,
    stack: HomeStack,
  },
  {
    name: 'Catalog',
    title: 'Каталог',
    icon: CatalogIcon,
    stack: CatalogStack,
  },
  {
    name: 'Favorites',
    title: 'Избранное',
    icon: HeartIcon,
    stack: FavoritesStack,
  },
  {
    name: 'Profile',
    title: 'Профиль',
    icon: UserIcon,
    stack: ProfileStack,
  },
];
```

### 2.4 Deep Linking

Поддержка URI-схемы `zaparkyi://`:

```
zaparkyi://parking/{id}     → Детали парковки
zaparkyi://booking/{id}    → Бронирование
zaparkyi://favorites      → Избранное
zaparkyi://catalog       → Каталог
```

### 2.5 Навигационные переходы

- **Stack:**slide from right (iOS стандарт)
- **Modal:** slide from bottom
- **Tab switch:** none (мгновенный)

---

## 3. State Management (Zustand)

### 3.1 Сторы приложения

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  restoreSession: () => Promise<void>;
}

// stores/parkingStore.ts
interface ParkingState {
  parkings: Parking[];
  selectedParking: Parking | null;
  isLoading: boolean;
  error: string | null;
  filters: ParkingFilters;
  
  // Actions
  fetchParkings: (filters?: ParkingFilters) => Promise<void>;
  fetchParkingById: (id: string) => Promise<void>;
  setFilters: (filters: ParkingFilters) => void;
}

// stores/favoritesStore.ts
interface FavoritesState {
  favorites: Parking[];
  
  // Actions
  addFavorite: (parking: Parking) => Promise<void>;
  removeFavorite: (parkingId: string) => Promise<void>;
  syncFavorites: () => Promise<void>;
}

// stores/searchStore.ts
interface SearchState {
  query: string;
  history: SearchHistoryItem[];
  
  // Actions
  search: (query: string) => Promise<void>;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}
```

### 3.2 Персистентность

Сторы с персистентностью (Capacitor Storage):

```typescript
// Использование zustand/middleware
import { persist, createJSONStorage } from 'zustand/middleware';
import { Storage } from '@capacitor/storage';

const storage = {
  getItem: async (name: string) => {
    const value = await Storage.get({ key: name });
    return value.value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await Storage.set({ key: name, value });
  },
  removeItem: async (name: string) => {
    await Storage.remove({ key: name });
  },
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: async (parking) => {
        const { favorites } = get();
        set({ favorites: [...favorites, parking] });
        // Sync с сервером
      },
      // ...
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
```

### 3.3 Рекомендации

- **Размер стора:** один стор — один домен (одно окно)
- **Селекторы:** использовать `useStore(state => state.property)`
- **Actions:** async для операций с API
- **Optimistic updates:** для быстрого UI (избранное)

---

## 4. Кэширование (Capacitor Storage)

### 4.1 Стратегия кэширования

| Данные | Метод | TTL | Описание |
|--------|-------|-----|----------|
| Парковки | Cache API | 5 мин | Каталог |
| Детали парковки | Cache API | 24 часа | Details |
| Избранное | Capacitor Storage | ∞ | Local-first |
| История поиска | Capacitor Storage | 30 дней | Local-only |
| Профиль | Secure Storage | ∞ | Encrypted |
| Токены | Secure Storage | Session | Auth |

### 4.2 Cache API интеграция

```typescript
// lib/cache.ts
import { Cache } from '@capacitor/cache';

class CacheService {
  private defaultTTL = 60 * 5; // 5 минут

  async get<T>(key: string): Promise<T | null> {
    const value = await Cache.get({ key });
    if (!value.value) return null;
    
    const data = JSON.parse(value.value);
    if (data.expiry < Date.now()) {
      await Cache.remove({ key });
      return null;
    }
    
    return data.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl || this.defaultTTL) * 1000;
    await Cache.set({
      key,
      value: JSON.stringify({ value, expiry }),
    });
  }

  async remove(key: string): Promise<void> {
    await Cache.remove({ key });
  }

  async clear(): Promise<void> {
    await Cache.clear();
  }
}

export const cacheService = new CacheService();
```

### 4.3 Схема кэширования данных

```
parkings:list        → Список парковок (filters hash key)
parkings:{id}       → Детали парковки
parkings:geo:{lat},{lng} → Парковки по геолокации
search:history     → История поиска (local)
user:profile       → Профиль пользователя
```

---

## 5. Офлайн-стратегия

### 5.1 Уровни офлайн-режима

| Функция | Офлайн | Описание |
|---------|--------|----------|
| Просмотр каталога | Частично | Кэшированные данные |
| Поиск | Нет | Требуется сеть |
| Детали парковки | Да | Кэшировано |
| Избранное | Да | Local-first |
| Профиль | Частично | Кэшированные данные |
| Бронирование | Queue | Синхронизация позже |

### 5.2 Офлайн-архитектура

```
┌─────────────────────────────────────┐
│           UI Layer                   │
│  (React Components + Hooks)       │
└─────────────────┬─────────────────┘
                   │
┌─────────────────▼─────────────────┐
│         State Layer                │
│  (Zustand + Optimistic Updates)   │
└─────────────────┬─────────────────┘
                   │
┌─────────────────▼─────────────────┐
│       Service Layer                │
│  ┌─────────────┬─────────────┐     │
│  │ Online Path │ Offline Path│     │
│  └──────┬──────┴──────┬──────┘     │
│         │             │             │
└─────────▼─────────────▼─────────────┘
          │             │
┌────────▼─────────────▼────────────┐
│      Storage Layer               │
│  ┌──────────┬────────────────┐ │
│  │ Network  │ Capacitor       │ │
│  │(Supabase)│ Storage        │ │
│  └─────────┴────────────────┘ │
└──────────────────────────────┬──────┘
                             │
┌───────────────────────────▼──────┐
│      Sync Queue                   │
│  (Pending Operations)          │
└────────────────────────────────┘
```

### 5.3 Offline Queue

```typescript
// lib/offline.ts
import { Storage } from '@capacitor/storage';

interface PendingOperation {
  id: string;
  type: 'booking' | 'favorite' | 'profile';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

class OfflineManager {
  private queue: PendingOperation[] = [];

  async addOperation(op: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<void> {
    const operation: PendingOperation = {
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    this.queue.push(operation);
    await this.persistQueue();
  }

  async processQueue(): Promise<void> {
    const isOnline = navigator.onLine;
    if (!isOnline) return;

    for (const op of this.queue) {
      try {
        await this.executeOperation(op);
        this.queue = this.queue.filter(o => o.id !== op.id);
        await this.persistQueue();
      } catch (error) {
        console.error('Offline operation failed:', error);
      }
    }
  }

  private async executeOperation(op: PendingOperation): Promise<void> {
    // Supabase API вызов
  }

  private async persistQueue(): Promise<void> {
    await Storage.set({
      key: 'offline-queue',
      value: JSON.stringify(this.queue),
    });
  }
}

export const offlineManager = new OfflineManager();
```

### 5.4 Обработка состояний

```typescript
// hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    checkConnection();

    const listener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
      if (status.connected) {
        offlineManager.processQueue();
      }
    });

    return () => listener.remove();
  }, []);

  return isOnline;
}
```

### 5.5 Offline UI

```typescript
// КомпонентOfflineBanner
function OfflineBanner() {
  const isOnline = useOnlineStatus();
  
  if (isOnline) return null;
  
  return (
    <div className="offline-banner">
      Вы офлайн. Изменения синхронизируются при подключении.
    </div>
  );
}
```

---

## 6. Интеграции

### 6.1 Supabase

| Сервис | Использование |
|--------|---------------|
| Auth | Аутентификация |
| Database | Парковки, бронирования |
| Realtime | Статусы бронирований |
| Edge Functions | Платежи (ЮKassa) |

### 6.2 capacitor-плагины

| Плагин | Версия | Назначение |
|--------|--------|------------|
| @capacitor/app | ^6.0.0 | App lifecycle |
| @capacitor/network | ^6.0.0 | Online status |
| @capacitor/storage | ^6.0.0 | Local storage |
| @capacitor/preferences | ^6.0.0 | Настройки |
| @capacitor/geolocation | ^6.0.0 | Геолокация |
| @capacitor/push-notifications | ^6.0.0 | Push |
| @capacitor/haptics | ^6.0.0 | haptic feedback |
| @capacitor/status-bar | ^6.0.0 | Status bar |

---

## 7. Безопасность

### 7.1 Хранение данных

- **Токены:** Capacitor Storage (зашифровано)
- **Профиль:** Secure Storage
- **Избранное:** Capacitor Storage (нечувствительные данные)

### 7.2 Network Security

- HTTPS only (Supabase)
- Certificate pinning (production)
- No sensitive data in logs

---

## 8. Производительность

### 8.1 Метрики

| Метрика | Цель |
|---------|------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Bundle Size | < 500KB |
| FPS | > 50 |

### 8.2 Оптимизации

- Code splitting по routes
- Lazy loading экранов
- Image lazy loading
- Virtual scrolling для списков

---

## 9. ADR (Architecture Decision Records)

### ADR-001: Навигация

**Дата:** 23.04.2026  
**Статус:** Принято

Использовать React Navigation 7 с:
- Bottom Tabs для главной навигации
- Stack для вложенных экранов
- Адаптация под iOS/Android

### ADR-002: State Management

**Дата:** 23.04.2026  
**Статус:** Принято

Zustand для клиентского state:
- Простота и производительность
- Персистентность с Capacitor Storage
- TypeScript поддержка

### ADR-003: Кэширование

**Дата:** 23.04.2026  
**Статус:** Принято

Capacitor Cache API + Storage:
- Cache API для API-ответов
- Capacitor Storage для local-first данных
- Offline queue для операций

---

## 10. Следующие шаги

1. **Задача 1.5:** Создание базовой структуры навигации
2. Установка react-navigation
3. Реализация экранов табов
4. Настройка deep linking
5. Интеграция Zustand персистентности

---

**Документ создан:** 23.04.2026  
**Ответственный:** react-specialist