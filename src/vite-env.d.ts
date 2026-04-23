/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const css: string;
  export default css;
}

// Capacitor type declarations for web compatibility
interface CapacitorPlatforms {
  isNativePlatform: () => boolean;
  Plugins?: Record<string, unknown>;
}

interface CapacitorWindow extends Window {
  Capacitor?: CapacitorPlatforms;
}