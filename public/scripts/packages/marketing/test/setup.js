import { beforeEach, vi } from 'vitest';

// Mock cookie storage
let mockCookieStorage = new Map();

// Mock global objects and functions
beforeEach(() => {
  // Clear mock cookie storage
  mockCookieStorage.clear();
  
  // Mock document.cookie with getter/setter
  let cookieString = '';
  Object.defineProperty(document, 'cookie', {
    get: () => {
      // Convert mock storage to cookie string format
      const cookies = [];
      for (const [name, value] of mockCookieStorage.entries()) {
        cookies.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
      }
      return cookies.join('; ');
    },
    set: (value) => {
      // Parse cookie string and store in mock storage
      const parts = value.split(';');
      const [nameValue] = parts;
      const [name, val] = nameValue.split('=');
      
      if (name) {
        const decodedName = decodeURIComponent(name.trim());
        
        // Check if this is a deletion (empty value or past expiration)
        const isExpired = parts.some(part => {
          const trimmed = part.trim();
          if (trimmed.startsWith('expires=')) {
            const expireDate = new Date(trimmed.substring(8));
            return expireDate < new Date();
          }
          return false;
        });
        
        if (!val || val.trim() === '' || isExpired) {
          // Delete the cookie
          mockCookieStorage.delete(decodedName);
        } else {
          // Set the cookie
          const decodedValue = decodeURIComponent(val.trim());
          mockCookieStorage.set(decodedName, decodedValue);
        }
      }
    },
    configurable: true
  });
  
  // Mock location
  Object.defineProperty(window, 'location', {
    value: {
      hostname: 'deriv.com',
      search: '',
      href: 'https://deriv.com'
    },
    writable: true
  });

  // Mock navigator
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    writable: true
  });

  Object.defineProperty(navigator, 'cookieEnabled', {
    value: true,
    writable: true
  });

  // Mock document.referrer
  Object.defineProperty(document, 'referrer', {
    value: 'https://google.com',
    writable: true
  });

  // Reset global variables
  window.marketingCookieLogs = [];
  window.marketingCookies = {};
  window.marketingTrackingSent = false;
  
  // Mock Analytics
  window.Analytics = {
    trackEvent: vi.fn()
  };

  // Mock console methods to avoid noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Reset URLSearchParams mock
  global.URLSearchParams = URLSearchParams;
});
