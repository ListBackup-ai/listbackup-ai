export interface PlatformConfig {
  name: string
  apiUrl: string
  apiTimeout: number
  features: {
    offline: boolean
    pushNotifications: boolean
    biometrics: boolean
    widgets: boolean
    deeplinking: boolean
  }
  storage: {
    type: 'localStorage' | 'AsyncStorage' | 'CoreData' | 'IndexedDB'
    encryption: boolean
  }
}

export interface ApiConfig {
  baseUrl: string
  timeout: number
  headers: Record<string, string>
  interceptors?: {
    request?: (config: any) => any
    response?: (response: any) => any
    error?: (error: any) => any
  }
}

// Platform detection
export const Platform = {
  isWeb: typeof window !== 'undefined' && typeof document !== 'undefined',
  isReactNative: typeof navigator !== 'undefined' && navigator.product === 'ReactNative',
  isIOS: typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent),
  isAndroid: typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent),
  isMobile: typeof navigator !== 'undefined' && /Mobile/.test(navigator.userAgent),
}

// Get platform-specific configuration
export function getPlatformConfig(): PlatformConfig {
  if (Platform.isWeb) {
    return {
      name: 'web',
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://main.api.listbackup.ai',
      apiTimeout: 30000,
      features: {
        offline: true,
        pushNotifications: true,
        biometrics: false,
        widgets: false,
        deeplinking: true,
      },
      storage: {
        type: 'localStorage',
        encryption: false,
      },
    }
  }
  
  if (Platform.isReactNative) {
    return {
      name: Platform.isIOS ? 'ios' : 'android',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://main.api.listbackup.ai',
      apiTimeout: 30000,
      features: {
        offline: true,
        pushNotifications: true,
        biometrics: true,
        widgets: Platform.isIOS,
        deeplinking: true,
      },
      storage: {
        type: 'AsyncStorage',
        encryption: true,
      },
    }
  }
  
  // Default configuration
  return {
    name: 'unknown',
    apiUrl: 'https://main.api.listbackup.ai',
    apiTimeout: 30000,
    features: {
      offline: false,
      pushNotifications: false,
      biometrics: false,
      widgets: false,
      deeplinking: false,
    },
    storage: {
      type: 'localStorage',
      encryption: false,
    },
  }
}

// Get API configuration
export function getApiConfig(): ApiConfig {
  const platformConfig = getPlatformConfig()
  
  return {
    baseUrl: platformConfig.apiUrl,
    timeout: platformConfig.apiTimeout,
    headers: {
      'Content-Type': 'application/json',
      'X-Platform': platformConfig.name,
      'X-App-Version': '2.0.0',
    },
  }
}