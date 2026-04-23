# 🚗 Запаркуй - Capacitor Infrastructure

Полная настройка мобильного приложения на Capacitor для проекта Запаркуй.

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Конфигурация](#конфигурация)
- [Настройка Android](#настройка-android)
- [Настройка iOS](#настройка-ios)
- [Иконки и Splash Screens](#иконки-и-splash-screens)
- [PWA совместимость](#pwa-совместимость)
- [Тестовая сборка](#тестовая-сборка)
- [Команды](#команды)

## 🚀 Быстрый старт

```bash
# 1. Перейдите в директорию проекта
cd /root/zaparkyi

# 2. Запустите установку Capacitor
bash capacitor/setup.sh

# 3. Добавьте нативные платформы
npx cap add android
npx cap add ios

# 4. Запустите приложение
npx cap run android
```

## ⚠️ Требования

- **Node.js** 18+
- **npm** 9+
- **Java** 17 (для Android)
- **Android Studio** (для Android)
- **Xcode** 15+ (для iOS, только macOS)

## 📦 Конфигурация

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaparkyi.app',
  appName: 'Запаркуй',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'http://localhost:5173',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#2563EB',
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#2563EB',
    },
  },
  android: {
    minSdkVersion: 22,
    targetSdkVersion: 34,
  },
  ios: {
    minVersion: '13.0',
  },
};

export default config;
```

### Основные параметры

| Параметр | Описание | Значение |
|----------|-----------|-----------|
| `appId` | Идентификатор приложения | `com.zaparkyi.app` |
| `appName` | Название приложения | `Запаркуй` |
| `webDir` | Директория веб-приложения | `dist` |
| `minSdkVersion` | Минимальная версия Android | 22 |
| `targetSdkVersion` | Целевая версия Android | 34 |
| `minVersion` | Минимальная версия iOS | 13.0 |

### Установленные плагины

```bash
# Ядро
@capacitor/core              # Основной пакет
@capacitor/cli              # CLI утилиты

# Плагины
@capacitor/app              # App события и состояние
@capacitor/browser         # In-app браузер
@capacitor/camera           # Камера
@capacitor/geolocation     # Геолокация
@capacitor/keyboard        # Клавиатура
@capacitor/local-notifications  # Локальные уведомления
@capacitor/status-bar      # Статус бар
@capacitor/haptics         # Вибрация
@capacitor/splash-screen  # Экран загрузки
@capacitor/network        # Состояние сети
@capacitor/preferences    # Локальное хранилище
@capacitor/push-notifications  # Push уведомления
@capacitor/device        # Информация об устройстве
```

## 🤖 Настройка Android

### Структура файлов

```
capacitor/android/
├── app/
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/zaparkyi/app/
│       └── res/
│           ├── drawable/
│           ├── drawable-hdpi/
│           ├── drawable-mdpi/
│           ├── drawable-xhdpi/
│           ├── drawable-xxhdpi/
│           ├── drawable-xxxhdpi/
│           ├── mipmap-hdpi/
│           ├── mipmap-mdpi/
│           ├── mipmap-xhdpi/
│           ├── mipmap-xxhpdpi/
│           ├── mipmap-xxxhdpi/
│           ├── mipmap-anydpi-v26/
│           ├── values/
│           ├── values-night/
│           └── xml/
├── build.gradle
├── gradle.properties
└── settings.gradle
```

### AndroidManifest.xml

Основные разрешения:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Сборка APK

```bash
# Debug сборка
npx cap sync
cd android && ./gradlew assembleDebug

# Release сборка
cd android && ./gradlew assembleRelease
```

APK будет доступен в:
- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/apk/release/app-release.apk`

## 🍎 Настройка iOS

### Структура файлов

```
capacitor/ios/
└── App/
    ├── App/
    │   ├── AppDelegate.swift
    │   ├── SceneDelegate.swift
    │   └── Info.plist
    ├── App.xcodeproj/
    ├── App.xcworkspace/
    ├── Podfile
    └── LaunchScreen.storyboard
```

### Info.plist

Ключевые настройки:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Запаркуй использует ваше местоположение для поиска ближайших парковок.</string>

<key>NSCameraUsageDescription</key>
<string>Запаркуй использует камеру для сканирования QR-кодов.</string>

<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleLightContent</string>
```

### Сборка iOS

```bash
# Debug сборка
npx cap sync ios
xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Debug

# Release сборка
xcodebuild -workspace ios/App.xcworkspace -scheme App -configuration Release
```

## 🖼️ Иконки и Splash Screens

### Иконки приложения

Рекомендуемые размеры для Android:

| Разрешение | Папка | Использование |
|------------|-------|----------------|
| 36x36 | drawable-mdpi | Обычные экраны |
| 48x48 | drawable-hdpi | Обычные экраны |
| 72x72 | drawable-xhdpi | Обычные экраны |
| 96x96 | drawable-xxhdpi | Обычные экраны |
| 144x144 | drawable-xxxhdpi | Обычные экраны |
| 48x48 | mipmap-mdpi | launcher icon |
| 72x72 | mipmap-hdpi | launcher icon |
| 96x96 | mipmap-xhdpi | launcher icon |
| 144x144 | mipmap-xxhdpi | launcher icon |
| 192x192 | mipmap-xxxhdpi | launcher icon |

Форматы:
- PNG (primary)
- WebP (optimized)
- SVG (vector, для адаптивных иконок)

### Splash Screen

```xml
<!-- Android: @drawable/splash_background -->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/primary"/>
</layer-list>

<!-- iOS: LaunchScreen.storyboard -->
<!-- Полный экран с логотипом -->
```

### Конфигурация в capacitor.config.ts

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 3000,
    launchAutoHide: true,
    launchFadeOutDuration: 1000,
    backgroundColor: '#2563EB',
    androidScaleType: 'CENTER_CROP',
    showSpinner: true,
    spinnerColor: '#FFFFFF',
    splashFullScreen: true,
    splashImmersive: true,
  },
}
```

## 🌐 PWA Совместимость

### manifest.json

```json
{
  "name": "Запаркуй - Найди парковку",
  "short_name": "Запаркуй",
  "description": "Мобильное приложение для поиска парковок",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#2563EB",
  "theme_color": "#2563EB",
  "lang": "uk",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker

```typescript
// public/sw.ts
import { build, files, timestamp } from '$service-worker';

const CACHE_NAME = `zaparkyi-${timestamp}`;

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([...build, ...files]))
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => 
        caches.open(CACHE_NAME).then(cache =>
          cache.put(event.request, response.clone())
        )
      )
    )
  );
});
```

### PWA Особенности

| Feature | Статус | Описание |
|---------|-------|-----------|
| Service Worker | ✅ | Офлайн режим |
| Web App Manifest | ✅ | Установка на домашний экран |
| Push Notifications | ✅ | Уведомления |
| Background Sync | ⏳ | Синхронизация данных |
| Web Share API | ⏳ | Шеринг парковок |

## 🧪 Тестовая сборка

### Предварительные требования

```bash
# Android
node -v    # >= 18
java -v    # >= 17
echo $ANDROID_HOME  # Должен быть установлен

# iOS (macOS only)
node -v
xcodebuild -version
```

### Сборка Debug APK

```bash
# 1. Синхронизация
npx cap sync

# 2. Сборка
cd android && ./gradlew assembleDebug

# 3. Проверка APK
ls -la android/app/build/outputs/apk/debug/
```

### Запуск на устройстве

```bash
# Подключите устройство через USB
# Включите режим разработчика на Android

# Запуск
npx cap run android
```

### Запуск в эмуляторе

```bash
# Запуск эмулятора
emulator -avd Pixel_8_API_34

# Установка APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Логи

```bash
# Android
adb logcat | grep Zaparkyi

# iOS (Console app)
# Откройте Console app на macOS
```

## 📱 Команды Capacitor

### Основные команды

```bash
# Добавить платформу
npx cap add android
npx cap add ios

# Синхронизировать
npx cap sync

# Открыть в IDE
npx cap open android   # Android Studio
npx cap open ios       # Xcode

# Создать релиз
npx cap build android
npx cap build ios

# Запустить на устройстве
npx cap run android
```

### Копиров��ни�� файлов

```bash
# Скопировать изменения в нативные проекты
npx cap copy

# Обновить зависимости
npx cap update
```

### Управление плагинами

```bash
# Добавить плагин
npm install @capacitor/new-plugin
npx cap add @capacitor/new-plugin

# Удалить плагин
npx cap remove @capacitor/plugin-name
```

## 🐛 Устранение проблем

### Частые ошибки

| Ошибка | Решение |
|--------|---------|
| `SDK not found` | Установите Android SDK |
| `Java version` | Используйте Java 17+ |
| `npm permissions` | Используйте nvm |
| `Gradle build failed` | Очистите `./gradlew clean` |
| `CocoaPods failed` | Удалите `ios/Podfile.lock` и повторите |

### Очистка кэша

```bash
# Gradle
cd android && ./gradlew clean

# Capacitor
rm -rf ios/App/Pods
rm -rf ios/App/build

# npm
rm -rf node_modules
rm package-lock.json
npm install
```

## 📄 Лицензия

MIT License - см. файл LICENSE в корне проекта.

---

**Запаркуй** - Упрощаем поиск парковок в Украине 🅿️