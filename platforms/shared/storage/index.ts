import { Platform } from '../config'

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

// Web storage adapter using localStorage
class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Error getting item from localStorage:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Error setting item in localStorage:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing item from localStorage:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

// Mock storage adapter for SSR/testing
class MockStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>()

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value)
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }
}

// Storage factory
export function createStorage(): StorageAdapter {
  if (Platform.isWeb && typeof window !== 'undefined') {
    return new WebStorageAdapter()
  }
  
  // For React Native, would return AsyncStorageAdapter
  // For iOS native, would return KeychainAdapter
  
  // Fallback to mock storage
  return new MockStorageAdapter()
}

// Default storage instance
export const storage = createStorage()

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'listbackup_auth_token',
  REFRESH_TOKEN: 'listbackup_refresh_token',
  USER_DATA: 'listbackup_user_data',
  ACCOUNT_ID: 'listbackup_account_id',
  THEME: 'listbackup_theme',
  BIOMETRICS_ENABLED: 'listbackup_biometrics_enabled',
  PUSH_ENABLED: 'listbackup_push_enabled',
} as const

// Typed storage helpers
export const authStorage = {
  async getToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  },
  
  async setToken(token: string): Promise<void> {
    return storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  },
  
  async getRefreshToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  },
  
  async setRefreshToken(token: string): Promise<void> {
    return storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
  },
  
  async clear(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    await storage.removeItem(STORAGE_KEYS.USER_DATA)
    await storage.removeItem(STORAGE_KEYS.ACCOUNT_ID)
  },
}

export const userStorage = {
  async getUser(): Promise<any | null> {
    const data = await storage.getItem(STORAGE_KEYS.USER_DATA)
    return data ? JSON.parse(data) : null
  },
  
  async setUser(user: any): Promise<void> {
    return storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
  },
  
  async getAccountId(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.ACCOUNT_ID)
  },
  
  async setAccountId(accountId: string): Promise<void> {
    return storage.setItem(STORAGE_KEYS.ACCOUNT_ID, accountId)
  },
}