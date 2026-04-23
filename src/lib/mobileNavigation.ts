/**
 * Mobile Navigation Configuration
 * Конфигурация навигации для мобильного приложения «Запаркуй»
 * 
 * Использует React Navigation 7 с Bottom Tabs + Stack
 */

import { 
  createBottomTabNavigator, 
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
  type BottomTabNavigationOptions,
} from '@react-navigation/native';
import { type RouteProp } from '@react-navigation/native';

// ============================================================================
// Types / Типы
// ============================================================================

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ParkingDetail: { parkingId: string };
  Booking: { bookingId: string };
  WebView: { url: string; title: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CatalogTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ParkingDetail: { parkingId: string };
};

export type CatalogStackParamList = {
  Catalog: undefined;
  ParkingDetail: { parkingId: string };
};

export type FavoritesStackParamList = {
  Favorites: undefined;
  ParkingDetail: { parkingId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Bookings: undefined;
  Settings: undefined;
};

// ============================================================================
// Icons / Иконки (SVG компоненты или named imports)
// ============================================================================

// Примечание: Иконки должны быть импортированы из вашего UI-кита
// Пример: import { HomeIcon, ListIcon, HeartIcon, UserIcon } from '@/components/Icons';

// Для TypeScript нужны определения типов иконок
export interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

// ============================================================================
// Stack Navigators / Стековые навигаторы
// ============================================================================

/**
 * Home Stack Navigator
 * Навигатор для главной вкладки
 */
export function createHomeStackNavigator(
  screens: {
    Home: React.ComponentType<any>;
    ParkingDetail: React.ComponentType<any>;
  }
) {
  const Stack = createNativeStackNavigator<HomeStackParamList>();
  
  return function HomeStackNavigator() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={screens.Home}
        />
        <Stack.Screen 
          name="ParkingDetail" 
          component={screens.ParkingDetail}
        />
      </Stack.Navigator>
    );
  };
}

/**
 * Catalog Stack Navigator
 * Навигатор для каталога
 */
export function createCatalogStackNavigator(
  screens: {
    Catalog: React.ComponentType<any>;
    ParkingDetail: React.ComponentType<any>;
  }
) {
  const Stack = createNativeStackNavigator<CatalogStackParamList>();
  
  return function CatalogStackNavigator() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Catalog" 
          component={screens.Catalog}
        />
        <Stack.Screen 
          name="ParkingDetail" 
          component={screens.ParkingDetail}
        />
      </Stack.Navigator>
    );
  };
}

/**
 * Favorites Stack Navigator
 * Навигатор для избранного
 */
export function createFavoritesStackNavigator(
  screens: {
    Favorites: React.ComponentType<any>;
    ParkingDetail: React.ComponentType<any>;
  }
) {
  const Stack = createNativeStackNavigator<FavoritesStackParamList>();
  
  return function FavoritesStackNavigator() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Favorites" 
          component={screens.Favorites}
        />
        <Stack.Screen 
          name="ParkingDetail" 
          component={screens.ParkingDetail}
        />
      </Stack.Navigator>
    );
  };
}

/**
 * Profile Stack Navigator
 * Навигатор для профиля
 */
export function createProfileStackNavigator(
  screens: {
    Profile: React.ComponentType<any>;
    Bookings: React.ComponentType<any>;
    Settings: React.ComponentType<any>;
  }
) {
  const Stack = createNativeStackNavigator<ProfileStackParamList>();
  
  return function ProfileStackNavigator() {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Profile" 
          component={screens.Profile}
        />
        <Stack.Screen 
          name="Bookings" 
          component={screens.Bookings}
        />
        <Stack.Screen 
          name="Settings" 
          component={screens.Settings}
        />
      </Stack.Navigator>
    );
  };
}

// ============================================================================
// Auth Stack / Навигатор аутентификации
// ============================================================================

/**
 * Auth Stack Navigator
 * Навигатор для экранов аутентификации
 */
export function createAuthStackNavigator(
  screens: {
    Login: React.ComponentType<any>;
    Register: React.ComponentType<any>;
    ForgotPassword: React.ComponentType<any>;
  }
) {
  const Stack = createNativeStackNavigator<AuthStackParamList>();
  
  const screenOptions: NativeStackNavigationOptions = {
    headerShown: true,
    headerTitle: '',
    headerBackTitle: 'Назад',
    headerTintColor: '#000',
    headerShadowVisible: false,
  };
  
  return function AuthStackNavigator() {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen 
          name="Login" 
          component={screens.Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={screens.Register}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={screens.ForgotPassword}
          options={{ 
            title: 'Восстановление пароля',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    );
  };
}

// ============================================================================
// Bottom Tab Navigator / Навигатор нижних вкладок
// ============================================================================

/**
 * Конфигурация табов
 */
export interface TabConfig {
  name: keyof MainTabParamList;
  title: string;
  // Компонент иконки
  icon: React.ComponentType<TabIconProps>;
  // Сте��-на��игатор
  component: React.ComponentType;
}

/**
 * Конфигурация вкладок приложения
 */
export const tabsConfig: TabConfig[] = [
  {
    name: 'HomeTab',
    title: 'Главная',
    // HomeIcon импортируется из компонентов
    icon: ({ focused, color, size }: TabIconProps) => (
      <TabIcon name="home" focused={focused} color={color} size={size} />
    ),
    component: HomeStackNavigator as any,
  },
  {
    name: 'CatalogTab',
    title: 'Каталог',
    icon: ({ focused, color, size }: TabIconProps) => (
      <TabIcon name="list" focused={focused} color={color} size={size} />
    ),
    component: CatalogStackNavigator as any,
  },
  {
    name: 'FavoritesTab',
    title: 'Избранное',
    icon: ({ focused, color, size }: TabIconProps) => (
      <TabIcon name="heart" focused={focused} color={color} size={size} />
    ),
    component: FavoritesStackNavigator as any,
  },
  {
    name: 'ProfileTab',
    title: 'Профиль',
    icon: ({ focused, color, size }: TabIconProps) => (
      <TabIcon name="user" focused={focused} color={color} size={size} />
    ),
    component: ProfileStackNavigator as any,
  },
];

/**
 * Bottom Tab Navigator
 */
export function createTabNavigator(
  screens: Record<keyof MainTabParamList, React.ComponentType>
) {
  const Tab = createBottomTabNavigator<MainTabParamList>();
  
  return function TabNavigator() {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#E5E5EA',
            paddingTop: 8,
            paddingBottom: 8,
            height: 84,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        {tabsConfig.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={screens[tab.name]}
            options={{
              tabBarLabel: tab.title,
              tabBarIcon: tab.icon,
            }}
          />
        ))}
      </Tab.Navigator>
    );
  };
}

// ============================================================================
// Placeholder компоненты иконок (заменить на реальные SVG)
// ============================================================================

/**
 * Упрощённый компонент иконки для табов
 * В реальном проекте заменить на компоненты из UI-кита
 */
function TabIcon({ 
  name, 
  focused, 
  color, 
  size 
}: { 
  name: 'home' | 'list' | 'heart' | 'user';
  focused: boolean; 
  color: string; 
  size: number;
}) {
  // Placeholder - в реальном проекте использовать Icon компонент
  // Пример: return <Icon name={name} size={size} color={color} />;
  return null;
}

// ============================================================================
// Навигаторы-заглушки (будут заменены при реализации)
// ============================================================================

// Эти компоненты будут экспортированы из соответствующих модулей навигации
// Пока определены как placeholder для сборки

const HomeStackNavigator = () => null;
const CatalogStackNavigator = () => null;
const FavoritesStackNavigator = () => null;
const ProfileStackNavigator = () => null;

// ============================================================================
// Deep Linking Configuration / Конфигурация Deep Linking
// ============================================================================

/**
 * Схема URI для приложения
 */
export const uriScheme = 'zaparkyi';

/**
 * Prefixes для deep linking
 */
export const linkingPrefixes = [
  `${uriScheme}://`,
  'https://zaparkyi.app/',
];

/**
 * Конфигурация deep linking
 */
export const deepLinkConfig = {
  prefixes: linkingPrefixes,
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: 'home',
              ParkingDetail: 'parking/:parkingId',
            },
          },
          CatalogTab: {
            screens: {
              Catalog: 'catalog',
              ParkingDetail: 'parking/:parkingId',
            },
          },
          FavoritesTab: {
            screens: {
              Favorites: 'favorites',
              ParkingDetail: 'parking/:parkingId',
            },
          },
          ProfileTab: {
            screens: {
              Profile: 'profile',
              Bookings: 'bookings',
              Settings: 'settings',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
    },
  },
};

// ============================================================================
// Screen Options / Опции экранов
// ============================================================================

/**
 * Стандартные опции для header
 */
export const commonHeaderOptions: NativeStackNavigationOptions = {
  headerLargeTitle: true,
  headerLargeTitleShadowVisible: false,
  headerTransparent: false,
  headerBlurEffect: 'regular',
};

/**
 * Опции для модальных экранов
 */
export const modalScreenOptions: NativeStackNavigationOptions = {
  presentation: 'modal',
  headerShown: true,
  headerTitle: '',
  headerLeft: () => null, // Кастомная кнопка закрытия
};

// ============================================================================
// Navigation Container / Контейнер навигации
// ============================================================================

/**
 * App Navigator - главный компонент навигации
 * В реальном приложении интегрировать с Auth контекстом
 */
export function AppNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  // Импорт экранов (в реальном проекте)
  // const { Home, Catalog, Favorites, Profile } = useScreens();
  
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }
  
  return <MainNavigator />;
}

// Placeholder компоненты (будут заменены)
const AuthNavigator = () => null;
const MainNavigator = () => null;

// ============================================================================
// Exports / Экспорты
// ============================================================================

export type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  CatalogStackParamList,
  FavoritesStackParamList,
  ProfileStackParamList,
};

export {
  createBottomTabNavigator,
  createNativeStackNavigator,
  uriScheme,
  linkingPrefixes,
  deepLinkConfig,
};