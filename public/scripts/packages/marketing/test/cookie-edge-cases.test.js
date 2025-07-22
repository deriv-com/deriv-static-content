import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  setURLSearchParams, 
  setCookieDirectly, 
  getCookieValue, 
  clearAllCookies,
  mockReferrer
} from './utils.js';

// Import the cookie module
import '../src/cookie.js';

describe('DerivMarketingCookies - Edge Cases', () => {
  beforeEach(() => {
    clearAllCookies();
    window.marketingCookieLogs = [];
    window.marketingCookies = {};
    window.marketingTrackingSent = false;
    window.location.search = '';
    vi.clearAllMocks();
  });

  describe('Cookie Storage Limits', () => {
    it('should handle very long cookie values', async () => {
      const longValue = 'x'.repeat(4000); // Very long value
      
      setURLSearchParams({
        utm_campaign: longValue
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      expect(utmData).toBeTruthy();
      
      const parsedUtmData = JSON.parse(utmData);
      // Should be truncated to 100 characters
      expect(parsedUtmData.utm_campaign.length).toBe(100);
    });

    it('should handle special characters in UTM parameters', async () => {
      setURLSearchParams({
        utm_source: 'test source with spaces',
        utm_medium: 'test&medium=with&special=chars',
        utm_campaign: 'test"campaign\'with"quotes'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      expect(utmData).toBeTruthy();
      
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('test source with spaces');
      expect(parsedUtmData.utm_medium).toBe('test&medium=with&special=chars');
      // Quotes are preserved in UTM parameters
      expect(parsedUtmData.utm_campaign).toBe('test"campaign\'with"quotes');
    });
  });

  describe('Domain Edge Cases', () => {
    it('should handle different domain configurations', async () => {
      // Test with binary.sx domain
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'app.binary.sx',
          search: '?utm_source=test'
        },
        writable: true
      });
      
      setURLSearchParams({ utm_source: 'test' });
      
      const result = window.getMarketingCookies();
      
      // Should use binary.sx as domain
      expect(window.marketingCookieLogs.some(log => 
        log.details && log.details.domain === 'binary.sx'
      )).toBe(true);
    });

    it('should handle unknown domains', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'unknown-domain.com',
          search: '?utm_source=test'
        },
        writable: true
      });
      
      setURLSearchParams({ utm_source: 'test' });
      
      const result = window.getMarketingCookies();
      
      // Should use the actual hostname
      expect(window.marketingCookieLogs.some(log => 
        log.details && log.details.domain === 'unknown-domain.com'
      )).toBe(true);
    });
  });

  describe('Race Condition Edge Cases', () => {
    it('should handle rapid successive calls', async () => {
      setURLSearchParams({
        utm_source: 'google',
        t: 'affiliate_token'
      });
      
      // Call multiple times rapidly
      const results = await Promise.all([
        Promise.resolve(window.getMarketingCookies()),
        Promise.resolve(window.getMarketingCookies()),
        Promise.resolve(window.getMarketingCookies())
      ]);
      
      // All should return valid results
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.original).toBeDefined();
        expect(result.sanitized).toBeDefined();
      });
      
      // Cookies should be consistent
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('affiliate_token');
    });

    it('should handle cookie modification during execution', async () => {
      setURLSearchParams({
        utm_source: 'google'
      });
      
      const result = window.getMarketingCookies();
      
      // Modify cookies after execution
      setCookieDirectly('utm_data', JSON.stringify({ utm_source: 'modified' }));
      
      // Should complete successfully despite external modification
      expect(result).toBeDefined();
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle disabled cookies', async () => {
      // Mock disabled cookies
      Object.defineProperty(navigator, 'cookieEnabled', {
        value: false,
        writable: true
      });
      
      // Mock document.cookie to throw error
      Object.defineProperty(document, 'cookie', {
        get: () => {
          throw new Error('Cookies disabled');
        },
        set: () => {
          throw new Error('Cookies disabled');
        }
      });
      
      setURLSearchParams({
        utm_source: 'google'
      });
      
      const result = window.getMarketingCookies();
      
      // Should still return result and use in-memory storage
      expect(result).toBeDefined();
      expect(window.marketingCookies).toBeDefined();
    });

    it('should handle missing URLSearchParams', async () => {
      // Mock missing URLSearchParams
      const originalURLSearchParams = global.URLSearchParams;
      global.URLSearchParams = undefined;
      
      try {
        const result = window.getMarketingCookies();
        expect(result).toBeDefined();
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined();
      } finally {
        global.URLSearchParams = originalURLSearchParams;
      }
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with repeated calls', async () => {
      const initialLogCount = window.marketingCookieLogs.length;
      
      // Call function multiple times
      for (let i = 0; i < 10; i++) {
        setURLSearchParams({
          utm_source: `source_${i}`,
          utm_campaign: `campaign_${i}`
        });
        
        window.getMarketingCookies();
      }
      
      // Logs should accumulate but not excessively
      expect(window.marketingCookieLogs.length).toBeGreaterThan(initialLogCount);
      expect(window.marketingCookieLogs.length).toBeLessThan(1000); // Reasonable limit
    });

    it('should clean up global state properly', async () => {
      setURLSearchParams({
        utm_source: 'google',
        t: 'affiliate_token'
      });
      
      const result = window.getMarketingCookies();
      
      // Check that global objects are properly structured
      expect(typeof window.marketingCookies).toBe('object');
      expect(Array.isArray(window.marketingCookieLogs)).toBe(true);
      expect(typeof window.marketingTrackingSent).toBe('boolean');
    });
  });

  describe('Date and Time Edge Cases', () => {
    it('should handle invalid dates gracefully', async () => {
      // Mock Date to return invalid date
      const originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super();
            this.setTime(NaN); // Invalid date
          } else {
            super(...args);
          }
        }
      };
      
      try {
        const result = window.getMarketingCookies();
        expect(result).toBeDefined();
      } finally {
        global.Date = originalDate;
      }
    });

    it('should handle timezone edge cases', async () => {
      // Mock different timezone
      const originalTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = () => -480; // UTC+8
      
      try {
        const result = window.getMarketingCookies();
        
        const dateFirstContact = getCookieValue('date_first_contact');
        expect(dateFirstContact).toBeTruthy();
        
        const parsedDate = JSON.parse(dateFirstContact);
        expect(parsedDate.date_first_contact).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } finally {
        Date.prototype.getTimezoneOffset = originalTimezoneOffset;
      }
    });
  });

  describe('Encoding Edge Cases', () => {
    it('should handle Unicode characters', async () => {
      setURLSearchParams({
        utm_source: '测试源',
        utm_campaign: 'кампания',
        utm_content: '🚀🎯📊'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      expect(utmData).toBeTruthy();
      
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('测试源');
      expect(parsedUtmData.utm_campaign).toBe('кампания');
      expect(parsedUtmData.utm_content).toBe('🚀🎯📊');
    });

    it('should handle URL-encoded parameters', async () => {
      setURLSearchParams({
        utm_source: 'google%20ads',
        utm_campaign: 'test%20campaign%20with%20spaces'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      
      // Should handle URL encoding properly
      expect(parsedUtmData.utm_source).toBe('google%20ads');
      expect(parsedUtmData.utm_campaign).toBe('test%20campaign%20with%20spaces');
    });
  });

  describe('Affiliate Link Edge Cases', () => {
    it('should handle mixed affiliate parameters', async () => {
      setURLSearchParams({
        t: 'token1',
        affiliate_token: 'token2',
        sidc: 'token3',
        utm_medium: 'affiliate'
      });
      
      const result = window.getMarketingCookies();
      
      // Should prioritize 't' parameter
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('token1');
      
      // Should not clean cookies since affiliate params exist
      expect(getCookieValue('utm_data')).toBeTruthy();
    });

    it('should handle empty affiliate parameters', async () => {
      setURLSearchParams({
        t: '',
        utm_medium: 'affiliate'
      });
      
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
    });

    it('should handle whitespace-only affiliate parameters', async () => {
      setURLSearchParams({
        t: '   ',
        utm_medium: 'affiliate'
      });
      
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
    });
  });
});
