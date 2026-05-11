/**
 * SuperTokens Custom Storage Handlers for Iframe Contexts
 * 
 * Based on official SuperTokens iframe example:
 * https://github.com/supertokens/supertokens-auth-react/tree/master/examples/with-next-iframe
 * 
 * These handlers provide fallback storage mechanisms when localStorage is blocked:
 * - Safari: Blocks document.cookies in iframes → Use localStorage
 * - Chrome Incognito: Blocks localStorage → Use in-memory storage
 * - Other restrictive contexts → Use in-memory storage
 * 
 * IMPORTANT: In-memory storage means tokens are lost on page refresh/navigation.
 * This is unavoidable in highly restrictive iframe contexts.
 */

// In-memory storage fallback
let inMemoryStorage: Record<string, string> = {};
const inMemoryCookies: Record<string, string> = {};

const FRONTEND_COOKIES_KEY = 'st-frontend-cookies';

/**
 * Try to use localStorage, fall back to in-memory storage if blocked
 */
function setKeyValue(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch (err) {
    // localStorage blocked - use in-memory storage
    inMemoryStorage[key] = value;
  }
}

function getKeyValue(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (err) {
    // localStorage blocked - use in-memory storage
    return inMemoryStorage[key] === undefined ? null : inMemoryStorage[key];
  }
}

function removeKeyValue(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    delete inMemoryStorage[key];
  }
}

function clearStorage(): void {
  try {
    window.localStorage.clear();
  } catch (err) {
    inMemoryStorage = {};
  }
}

/**
 * Get all cookies from storage (localStorage or in-memory)
 */
function getCookiesFromStorage(): string {
  const cookiesFromStorage = getKeyValue(FRONTEND_COOKIES_KEY);

  if (cookiesFromStorage === null) {
    setKeyValue(FRONTEND_COOKIES_KEY, '[]');
    return '';
  }

  try {
    // Parse and filter expired cookies
    const cookieArray = JSON.parse(cookiesFromStorage) as string[];
    const validCookies: string[] = [];
    const currentTime = Date.now();

    for (const cookieString of cookieArray) {
      const parts = cookieString.split(';');
      let isExpired = false;

      // Check for expiration
      for (const part of parts) {
        if (part.toLowerCase().includes('expires=')) {
          const expirationValue = part.split('=')[1];
          const expirationDate = new Date(expirationValue);

          if (expirationDate.getTime() < currentTime) {
            isExpired = true;
            break;
          }
        }
      }

      if (!isExpired) {
        validCookies.push(cookieString);
      }
    }

    // Update storage with only valid cookies
    setKeyValue(FRONTEND_COOKIES_KEY, JSON.stringify(validCookies));

    return validCookies.join('; ');
  } catch (err) {
    console.error('[SuperTokens] Error parsing cookies:', err);
    return '';
  }
}

/**
 * Set a cookie in storage (localStorage or in-memory)
 */
function setCookieToStorage(cookieString: string): void {
  const cookieName = cookieString.split(';')[0].split('=')[0];
  const cookiesFromStorage = getKeyValue(FRONTEND_COOKIES_KEY);
  let cookiesArray: string[] = [];

  if (cookiesFromStorage !== null) {
    try {
      cookiesArray = JSON.parse(cookiesFromStorage) as string[];
    } catch (err) {
      console.error('[SuperTokens] Error parsing stored cookies:', err);
      cookiesArray = [];
    }
  }

  // Find existing cookie with same name
  const cookieIndex = cookiesArray.findIndex((cookie) =>
    cookie.startsWith(`${cookieName}=`)
  );

  // Replace existing or add new
  if (cookieIndex !== -1) {
    cookiesArray[cookieIndex] = cookieString;
  } else {
    cookiesArray.push(cookieString);
  }

  setKeyValue(FRONTEND_COOKIES_KEY, JSON.stringify(cookiesArray));
}

/**
 * Custom Window Handler for SuperTokens
 * Provides localStorage access with in-memory fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWindowHandler(original: any): any {
  return {
    ...original,
    localStorage: {
      ...original.localStorage,
      // Async methods
      key: async (index: number) => {
        try {
          return window.localStorage.key(index);
        } catch (err) {
          return Object.keys(inMemoryStorage)[index] || null;
        }
      },
      getItem: async (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch (err) {
          return inMemoryStorage[key] === undefined ? null : inMemoryStorage[key];
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          return window.localStorage.setItem(key, value);
        } catch (err) {
          inMemoryStorage[key] = value;
        }
      },
      removeItem: async (key: string) => {
        try {
          return window.localStorage.removeItem(key);
        } catch (err) {
          delete inMemoryStorage[key];
        }
      },
      clear: async () => {
        try {
          return window.localStorage.clear();
        } catch (err) {
          inMemoryStorage = {};
        }
      },
      // Sync methods
      keySync: (index: number) => {
        try {
          return window.localStorage.key(index);
        } catch (err) {
          return Object.keys(inMemoryStorage)[index] || null;
        }
      },
      getItemSync: (key: string) => {
        try {
          return window.localStorage.getItem(key);
        } catch (err) {
          return inMemoryStorage[key] === undefined ? null : inMemoryStorage[key];
        }
      },
      setItemSync: (key: string, value: string) => {
        try {
          return window.localStorage.setItem(key, value);
        } catch (err) {
          inMemoryStorage[key] = value;
        }
      },
      removeItemSync: (key: string) => {
        try {
          return window.localStorage.removeItem(key);
        } catch (err) {
          delete inMemoryStorage[key];
        }
      },
      clearSync: () => {
        try {
          return window.localStorage.clear();
        } catch (err) {
          inMemoryStorage = {};
        }
      },
    },
  };
}

/**
 * Custom Cookie Handler for SuperTokens
 * Stores cookies in localStorage (or in-memory if localStorage blocked)
 * This works around Safari blocking document.cookies in iframes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCookieHandler(original: any): any {
  return {
    ...original,
    getCookie: async function (): Promise<string> {
      return getCookiesFromStorage();
    },
    setCookie: async function (cookieString: string): Promise<void> {
      setCookieToStorage(cookieString);
    },
  };
}

/**
 * Check if we should use custom storage handlers
 * Returns true if in iframe or storage is blocked
 */
export function shouldUseCustomHandlers(): boolean {
  // Check if in iframe
  try {
    if (window.self !== window.top) {
      return true;
    }
  } catch (e) {
    // Can't access window.top - definitely in iframe
    return true;
  }

  // Check if localStorage is blocked
  try {
    const testKey = '__st_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return false; // localStorage works
  } catch (e) {
    // localStorage blocked
    return true;
  }
}
