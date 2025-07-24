import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  setURLSearchParams, 
  setCookieDirectly, 
  getCookieValue, 
  clearAllCookies
} from './utils.js';

// Import the cookie module
import '../src/cookie.js';

describe('DerivMarketingCookies - Performance Tests', () => {
  beforeEach(() => {
    clearAllCookies();
    window.marketingCookieLogs = [];
    window.marketingCookies = {};
    window.marketingTrackingSent = false;
    window.location.search = '';
    vi.clearAllMocks();
  });

  describe('Execution Time', () => {
    it('should execute within reasonable time limits', async () => {
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test_campaign',
        utm_term: 'test_term',
        utm_content: 'test_content',
        t: 'affiliate_token',
        gclid: 'google_click_id',
        ca: 'email_campaign'
      });
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Should execute in less than 100ms
    });

    it('should handle large datasets efficiently', async () => {
      // Create large UTM parameters
      const largeParams = {};
      for (let i = 0; i < 50; i++) {
        largeParams[`utm_custom_${i}`] = `value_${i}`.repeat(10);
      }
      largeParams.utm_source = 'google';
      largeParams.utm_medium = 'cpc';
      largeParams.utm_campaign = 'large_test';
      
      setURLSearchParams(largeParams);
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(200); // Should still be reasonably fast
    });

    it('should scale well with multiple cookie operations', async () => {
      // Set multiple existing cookies
      for (let i = 0; i < 20; i++) {
        setCookieDirectly(`test_cookie_${i}`, `value_${i}`);
      }
      
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'scale_test',
        t: 'affiliate_token'
      });
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(150); // Should handle multiple cookies efficiently
    });
  });

  describe('Memory Usage', () => {
    it('should not accumulate excessive logs', async () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        setURLSearchParams({
          utm_source: `source_${i}`,
          utm_campaign: `campaign_${i}`
        });
        
        window.getMarketingCookies();
        
        // Reset for next iteration
        clearAllCookies();
        window.marketingCookieLogs = [];
        window.marketingCookies = {};
        window.marketingTrackingSent = false;
      }
      
      // Final execution
      setURLSearchParams({
        utm_source: 'final_test'
      });
      
      const result = window.getMarketingCookies();
      
      expect(result).toBeDefined();
      expect(window.marketingCookieLogs.length).toBeLessThan(100); // Should not accumulate excessively
    });

    it('should handle repeated executions without memory leaks', async () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // Execute many times
      for (let i = 0; i < 1000; i++) {
        setURLSearchParams({
          utm_source: 'memory_test',
          utm_campaign: `iteration_${i}`
        });
        
        window.getMarketingCookies();
        
        // Occasional cleanup to simulate real usage
        if (i % 100 === 0) {
          clearAllCookies();
          window.marketingCookieLogs = [];
          window.marketingCookies = {};
          window.marketingTrackingSent = false;
        }
      }
      
      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
      
      // Memory should not grow excessively (allow for some growth due to test overhead)
      if (process.memoryUsage) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(15 * 1024 * 1024); // Less than 15MB growth (increased due to affiliate logging)
      }
    });
  });

  describe('Cookie Operations Performance', () => {
    it('should set cookies efficiently', async () => {
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'performance_test',
        utm_term: 'test_term',
        utm_content: 'test_content',
        t: 'affiliate_token',
        gclid: 'google_click_id',
        ca: 'email_campaign'
      });
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      // Verify all cookies were set
      expect(getCookieValue('utm_data')).toBeTruthy();
      expect(getCookieValue('affiliate_tracking')).toBe('affiliate_token');
      expect(getCookieValue('gclid')).toBe('google_click_id');
      expect(getCookieValue('campaign_channel')).toBe('email_campaign');
      expect(getCookieValue('signup_device')).toBeTruthy();
      expect(getCookieValue('date_first_contact')).toBeTruthy();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(50); // Cookie operations should be fast
    });

    it('should read cookies efficiently', async () => {
      // Pre-set cookies
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'existing_campaign'
      }));
      setCookieDirectly('affiliate_tracking', 'existing_token');
      setCookieDirectly('signup_device', JSON.stringify({ signup_device: 'mobile' }));
      setCookieDirectly('date_first_contact', JSON.stringify({ date_first_contact: '2023-01-01' }));
      
      setURLSearchParams({
        utm_term: 'new_term' // Should merge with existing
      });
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(30); // Reading existing cookies should be very fast
      
      // Verify existing cookies were preserved
      const utmData = JSON.parse(getCookieValue('utm_data'));
      expect(utmData.utm_source).toBe('google');
      expect(utmData.utm_term).toBe('new_term');
    });
  });

  describe('JSON Operations Performance', () => {
    it('should handle JSON parsing efficiently', async () => {
      // Create complex JSON structure
      const complexUtmData = {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'complex_test',
        utm_content: JSON.stringify({
          nested: {
            data: 'test',
            array: [1, 2, 3, 4, 5],
            boolean: true
          }
        })
      };
      
      setCookieDirectly('utm_data', JSON.stringify(complexUtmData));
      
      setURLSearchParams({
        utm_term: 'additional_term'
      });
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(20); // JSON operations should be fast
      
      expect(result).toBeDefined();
    });

    it('should handle malformed JSON gracefully without performance impact', async () => {
      // Set malformed JSON cookies
      setCookieDirectly('utm_data', '{"invalid": json}');
      setCookieDirectly('signup_device', 'not json at all');
      setCookieDirectly('date_first_contact', '{"incomplete":');
      
      setURLSearchParams({
        utm_source: 'recovery_test'
      });
      
      const startTime = performance.now();
      const result = window.getMarketingCookies();
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(50); // Error handling should not significantly impact performance
      
      expect(result).toBeDefined();
    });
  });


  describe('Concurrent Operations', () => {
    it('should handle concurrent cookie operations', async () => {
      const promises = [];
      
      // Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(new Promise(resolve => {
          setTimeout(() => {
            setURLSearchParams({
              utm_source: `concurrent_${i}`,
              utm_campaign: `test_${i}`
            });
            
            const result = window.getMarketingCookies();
            resolve(result);
          }, Math.random() * 10);
        }));
      }
      
      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      
      // All operations should complete successfully
      results.forEach(result => {
        expect(result).toBeDefined();
      });
      
      // Total time should be reasonable for concurrent operations
      expect(totalTime).toBeLessThan(200);
    });
  });
});
