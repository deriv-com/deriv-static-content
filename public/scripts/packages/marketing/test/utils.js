import { vi } from 'vitest';

/**
 * Helper function to set URL search parameters for testing
 */
export function setURLSearchParams(params) {
  const searchParams = new URLSearchParams(params);
  const searchString = searchParams.toString();
  
  // Mock window.location.search
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      search: searchString ? `?${searchString}` : ''
    },
    writable: true
  });
  
  // Also mock document.referrer to empty to avoid interference
  Object.defineProperty(document, 'referrer', {
    value: '',
    writable: true
  });
}

/**
 * Helper function to set cookies directly in document.cookie
 */
export function setCookieDirectly(name, value, options = {}) {
  const domain = options.domain || 'deriv.com';
  const path = options.path || '/';
  const expires = options.expires || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  
  const cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; domain=${domain}; path=${path}; SameSite=None; Secure`;
  
  // Set using document.cookie (which is mocked in setup.js)
  document.cookie = cookieString;
}

/**
 * Helper function to clear all cookies
 */
export function clearAllCookies() {
  // Get all current cookies and delete them
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
}

/**
 * Helper function to get cookie value from document.cookie
 */
export function getCookieValue(name) {
  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(encodedName + '=')) {
      return decodeURIComponent(cookie.substring(encodedName.length + 1));
    }
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

/**
 * Helper function to mock mobile user agent
 */
export function mockMobileUserAgent() {
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    writable: true
  });
}

/**
 * Helper function to mock desktop user agent
 */
export function mockDesktopUserAgent() {
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    writable: true
  });
}

/**
 * Helper function to mock document.referrer
 */
export function mockReferrer(referrer) {
  Object.defineProperty(document, 'referrer', {
    value: referrer,
    writable: true
  });
}

/**
 * Helper function to wait for async operations
 */
export function waitFor(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to create a fresh instance of the cookie function
 */
export async function createFreshCookieInstance() {
  // Clear all global state
  window.marketingCookieLogs = [];
  window.marketingCookies = {};
  window.marketingTrackingSent = false;
  clearAllCookies();
  
  // Import and execute the cookie function
  const module = await import('../src/cookie.js');
  return module;
}

/**
 * Helper function to validate cookie format
 */
export function validateCookieFormat(cookieString) {
  const parts = cookieString.split(';');
  const nameValue = parts[0].trim();
  
  return {
    isValid: nameValue.includes('='),
    name: nameValue.split('=')[0],
    value: nameValue.split('=')[1],
    attributes: parts.slice(1).map(part => part.trim())
  };
}

/**
 * Helper function to check if a value is valid JSON
 */
export function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
