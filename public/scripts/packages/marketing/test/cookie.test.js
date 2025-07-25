import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  setURLSearchParams, 
  setCookieDirectly, 
  getCookieValue, 
  mockMobileUserAgent, 
  mockDesktopUserAgent,
  mockReferrer,
  isValidJSON,
  clearAllCookies
} from './utils.js';

// Import the cookie module
import '../src/cookie.js';

describe('DerivMarketingCookies', () => {
  beforeEach(() => {
    // Reset all global state
    clearAllCookies();
    window.marketingCookieLogs = [];
    window.marketingCookies = {};
    window.marketingTrackingSent = false;
    
    // Reset location
    window.location.search = '';
    
    // Reset console spies
    vi.clearAllMocks();
  });

  describe('Basic Cookie Operations', () => {
    it('should execute without errors', () => {
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
      expect(result.original).toBeDefined();
      expect(result.sanitized).toBeDefined();
    });

    it('should handle empty URL parameters', () => {
      setURLSearchParams({});
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
    });

    it('should detect mobile user agent', () => {
      mockMobileUserAgent();
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
    });

    it('should detect desktop user agent', () => {
      mockDesktopUserAgent();
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
    });
  });

  describe('UTM Parameter Handling', () => {
    it('should capture UTM parameters from URL', async () => {
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test_campaign',
        utm_term: 'test_term',
        utm_content: 'test_content'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      expect(utmData).toBeTruthy();
      
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('cpc');
      expect(parsedUtmData.utm_campaign).toBe('test_campaign');
      expect(parsedUtmData.utm_term).toBe('test_term');
      expect(parsedUtmData.utm_content).toBe('test_content');
    });

    it('should handle mapped UTM parameters', async () => {
      setURLSearchParams({
        fbclid: 'facebook_click_id',
        ttclid: 'tiktok_click_id',
        ScCid: 'snapchat_click_id'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      expect(utmData).toBeTruthy();
      
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_fbcl_id).toBe('facebook_click_id');
      expect(parsedUtmData.utm_ttclid).toBe('tiktok_click_id');
      expect(parsedUtmData.utm_sccid).toBe('snapchat_click_id');
    });

    it('should truncate long UTM values', async () => {
      const longValue = 'a'.repeat(150);
      const veryLongValue = 'b'.repeat(250);
      
      setURLSearchParams({
        utm_source: longValue,
        fbclid: veryLongValue
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      
      expect(parsedUtmData.utm_source.length).toBe(100);
      expect(parsedUtmData.utm_fbcl_id.length).toBe(200);
    });
  });

  describe('Affiliate Tracking', () => {
    it('should set affiliate_tracking cookie with t parameter', async () => {
      setURLSearchParams({
        t: 'affiliate_token_123'
      });
      
      const result = window.getMarketingCookies();
      
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('affiliate_token_123');
    });

    it('should set affiliate_tracking cookie with affiliate_token parameter', async () => {
      setURLSearchParams({
        affiliate_token: 'affiliate_token_456'
      });
      
      const result = window.getMarketingCookies();
      
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('affiliate_token_456');
    });

    it('should set affiliate_tracking cookie with sidc parameter', async () => {
      setURLSearchParams({
        sidc: 'sidc_token_789'
      });
      
      const result = window.getMarketingCookies();
      
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('sidc_token_789');
    });

    it('should prioritize t parameter over affiliate_token', async () => {
      setURLSearchParams({
        t: 'priority_token',
        affiliate_token: 'secondary_token'
      });
      
      const result = window.getMarketingCookies();
      
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('priority_token');
    });

    it('should create combined affiliate_data cookie when affiliate params exist', async () => {
      setURLSearchParams({
        t: 'affiliate_123',
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'test'
      });
      
      const result = window.getMarketingCookies();
      
      const affiliateData = getCookieValue('affiliate_data');
      expect(affiliateData).toBeTruthy();
      
      const parsedAffiliateData = JSON.parse(affiliateData);
      expect(parsedAffiliateData.affiliate_tracking).toBe('affiliate_123');
      expect(parsedAffiliateData.utm_data).toBeDefined();
      expect(parsedAffiliateData.utm_data.utm_source).toBe('google');
    });

    it('should handle both UTM parameters and affiliate token correctly', async () => {
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'summer_sale',
        utm_term: 'trading',
        utm_content: 'banner_ad',
        t: 'affiliate_token_xyz123'
      });
      
      const result = window.getMarketingCookies();
      
      // Check utm_data cookie
      const utmData = getCookieValue('utm_data');
      expect(utmData).toBeTruthy();
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('affiliate');
      expect(parsedUtmData.utm_campaign).toBe('summer_sale');
      expect(parsedUtmData.utm_term).toBe('trading');
      expect(parsedUtmData.utm_content).toBe('banner_ad');
      
      // Check affiliate_tracking cookie
      const affiliateTracking = getCookieValue('affiliate_tracking');
      expect(affiliateTracking).toBe('affiliate_token_xyz123');
      
      // Check affiliate_data cookie (combined data)
      const affiliateData = getCookieValue('affiliate_data');
      expect(affiliateData).toBeTruthy();
      const parsedAffiliateData = JSON.parse(affiliateData);
      expect(parsedAffiliateData.affiliate_tracking).toBe('affiliate_token_xyz123');
      expect(parsedAffiliateData.utm_data).toBeDefined();
      expect(parsedAffiliateData.utm_data.utm_source).toBe('google');
      expect(parsedAffiliateData.utm_data.utm_medium).toBe('affiliate');
      expect(parsedAffiliateData.utm_data.utm_campaign).toBe('summer_sale');
      expect(parsedAffiliateData.utm_data.utm_term).toBe('trading');
      expect(parsedAffiliateData.utm_data.utm_content).toBe('banner_ad');
      
      // Verify all three cookies are set correctly
      expect(utmData).toBeTruthy();
      expect(affiliateTracking).toBeTruthy();
      expect(affiliateData).toBeTruthy();
    });
  });

  describe('Incomplete Affiliate Link Detection', () => {
    it('should handle utm_medium=affiliate with affiliate params', async () => {
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'test',
        t: 'affiliate_token'
      });
      
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
      
      // Should have all cookies when affiliate params are present
      expect(getCookieValue('utm_data')).toBeTruthy();
      expect(getCookieValue('affiliate_tracking')).toBeTruthy();
      expect(getCookieValue('affiliate_data')).toBeTruthy();
    });

    it('should clean cookies when utm_medium=affiliate but no affiliate params', async () => {
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'test'
        // Missing affiliate parameters (t, affiliate_token, or sidc)
      });
      
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
      
      // Should NOT have these cookies when affiliate link is incomplete
      expect(getCookieValue('utm_data')).toBeNull();
      expect(getCookieValue('affiliate_tracking')).toBeNull();
      expect(getCookieValue('affiliate_data')).toBeNull();
    });

    it('should clean existing cookies when existing utm_medium=affiliate but no affiliate params', async () => {
      // Set existing utm_data cookie with affiliate medium
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'test'
      }));
      setCookieDirectly('affiliate_tracking', 'existing_token');
      setCookieDirectly('affiliate_data', JSON.stringify({
        affiliate_tracking: 'existing_token',
        utm_data: { utm_source: 'google', utm_medium: 'affiliate' }
      }));
      
      // Visit page without affiliate params
      setURLSearchParams({});
      
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
      
      // Should clean all marketing cookies due to incomplete affiliate link
      expect(getCookieValue('utm_data')).toBeNull();
      expect(getCookieValue('affiliate_tracking')).toBeNull();
      expect(getCookieValue('affiliate_data')).toBeNull();
    });

    it('should clean cookies when new utm_medium=affiliate without affiliate params', async () => {
      // Set some existing non-affiliate UTM data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'existing'
      }));
      
      // Visit with new affiliate UTM but no affiliate params
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'new_campaign'
        // Missing affiliate parameters
      });
      
      const result = window.getMarketingCookies();
      expect(result).toBeDefined();
      
      // Should clean all marketing cookies
      expect(getCookieValue('utm_data')).toBeNull();
      expect(getCookieValue('affiliate_tracking')).toBeNull();
      expect(getCookieValue('affiliate_data')).toBeNull();
    });
  });

  describe('shouldOverwrite Logic', () => {
    it('should overwrite when no existing data and valid new source', async () => {
      setURLSearchParams({
        utm_source: 'google'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
    });

    it('should overwrite when all required fields present', async () => {
      // Set existing utm_data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'old_campaign'
      }));
      
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'new_campaign'
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('cpc');
      expect(parsedUtmData.utm_campaign).toBe('new_campaign');
    });

    it('should not overwrite when insufficient new data', async () => {
      // Set existing utm_data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'old_campaign'
      }));
      
      setURLSearchParams({
        utm_source: 'google'
        // Missing utm_medium and utm_campaign
      });
      
      const result = window.getMarketingCookies();
      
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      // Should merge, keeping existing data
      expect(parsedUtmData.utm_medium).toBe('social');
      expect(parsedUtmData.utm_campaign).toBe('old_campaign');
      expect(parsedUtmData.utm_source).toBe('google'); // New value merged
    });

    it('should always erase affiliate_tracking when overwriting occurs', async () => {
      // Set existing cookies including affiliate data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'old_campaign'
      }));
      setCookieDirectly('affiliate_tracking', 'old_affiliate_token');
      setCookieDirectly('affiliate_data', JSON.stringify({
        affiliate_tracking: 'old_affiliate_token',
        utm_data: { utm_source: 'facebook', utm_medium: 'social' }
      }));
      
      // Trigger overwrite with new UTM data (no affiliate params)
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'new_campaign'
      });
      
      const result = window.getMarketingCookies();
      
      // UTM data should be overwritten
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('cpc');
      expect(parsedUtmData.utm_campaign).toBe('new_campaign');
      
      // affiliate_tracking should be erased
      expect(getCookieValue('affiliate_tracking')).toBeNull();
      
      // affiliate_data should be erased
      expect(getCookieValue('affiliate_data')).toBeNull();
    });

    it('should always erase affiliate_data when overwriting occurs', async () => {
      // Set existing cookies including affiliate data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'affiliate',
        utm_campaign: 'old_campaign'
      }));
      setCookieDirectly('affiliate_tracking', 'old_affiliate_token');
      setCookieDirectly('affiliate_data', JSON.stringify({
        affiliate_tracking: 'old_affiliate_token',
        utm_data: { utm_source: 'facebook', utm_medium: 'affiliate', utm_campaign: 'old_campaign' }
      }));
      
      // Trigger overwrite with new UTM data and new affiliate params
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'new_campaign',
        t: 'new_affiliate_token'
      });
      
      const result = window.getMarketingCookies();
      
      // UTM data should be overwritten
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('affiliate');
      expect(parsedUtmData.utm_campaign).toBe('new_campaign');
      
      // affiliate_tracking should be set to new value
      expect(getCookieValue('affiliate_tracking')).toBe('new_affiliate_token');
      
      // affiliate_data should be recreated with new data
      const affiliateData = getCookieValue('affiliate_data');
      expect(affiliateData).toBeTruthy();
      const parsedAffiliateData = JSON.parse(affiliateData);
      expect(parsedAffiliateData.affiliate_tracking).toBe('new_affiliate_token');
      expect(parsedAffiliateData.utm_data.utm_source).toBe('google');
      expect(parsedAffiliateData.utm_data.utm_campaign).toBe('new_campaign');
    });

    it('should erase both affiliate cookies when overwriting with non-affiliate UTM', async () => {
      // Set existing non-affiliate cookies (to avoid affiliate validation cleanup)
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'old_campaign'
      }));
      setCookieDirectly('affiliate_tracking', 'existing_affiliate_token');
      setCookieDirectly('affiliate_data', JSON.stringify({
        affiliate_tracking: 'existing_affiliate_token',
        utm_data: { utm_source: 'facebook', utm_medium: 'social' }
      }));
      
      // Overwrite with non-affiliate UTM data
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'new_campaign'
      });
      
      const result = window.getMarketingCookies();
      
      // UTM data should be overwritten with non-affiliate data
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('cpc');
      expect(parsedUtmData.utm_campaign).toBe('new_campaign');
      
      // Both affiliate cookies should be erased
      expect(getCookieValue('affiliate_tracking')).toBeNull();
      expect(getCookieValue('affiliate_data')).toBeNull();
    });

    it('should handle overwrite with complete UTM data (triggers overwrite)', async () => {
      // Set existing UTM data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'old_campaign'
      }));
      setCookieDirectly('affiliate_tracking', 'existing_token');
      setCookieDirectly('affiliate_data', JSON.stringify({
        affiliate_tracking: 'existing_token',
        utm_data: { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'old_campaign' }
      }));
      
      // Visit with complete new UTM data (should trigger overwrite)
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'new_campaign'
      });
      
      const result = window.getMarketingCookies();
      
      // UTM data should be overwritten
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('cpc');
      expect(parsedUtmData.utm_campaign).toBe('new_campaign');
      
      // Affiliate cookies should be erased during overwrite
      expect(getCookieValue('affiliate_tracking')).toBeNull();
      expect(getCookieValue('affiliate_data')).toBeNull();
    });

    it('should preserve affiliate cookies when no overwrite occurs', async () => {
      // Set existing data with non-affiliate medium to avoid validation cleanup
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'existing_campaign'
      }));
      setCookieDirectly('affiliate_tracking', 'existing_token');
      setCookieDirectly('affiliate_data', JSON.stringify({
        affiliate_tracking: 'existing_token',
        utm_data: { utm_source: 'facebook', utm_medium: 'social' }
      }));
      
      // Visit with insufficient data to trigger overwrite
      setURLSearchParams({
        utm_content: 'additional_content'
      });
      
      const result = window.getMarketingCookies();
      
      // UTM data should be merged (not overwritten)
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('facebook'); // Preserved
      expect(parsedUtmData.utm_medium).toBe('social'); // Preserved
      expect(parsedUtmData.utm_campaign).toBe('existing_campaign'); // Preserved
      expect(parsedUtmData.utm_content).toBe('additional_content'); // Added
      
      // Affiliate cookies should be preserved
      expect(getCookieValue('affiliate_tracking')).toBe('existing_token');
      expect(getCookieValue('affiliate_data')).toBeTruthy();
    });

    it('should handle edge case: overwrite with mixed affiliate and non-affiliate params', async () => {
      // Set existing non-affiliate data
      setCookieDirectly('utm_data', JSON.stringify({
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'old_campaign'
      }));
      
      // Overwrite with affiliate UTM + affiliate token
      setURLSearchParams({
        utm_source: 'google',
        utm_medium: 'affiliate',
        utm_campaign: 'new_campaign',
        t: 'new_affiliate_token'
      });
      
      const result = window.getMarketingCookies();
      
      // UTM data should be overwritten
      const utmData = getCookieValue('utm_data');
      const parsedUtmData = JSON.parse(utmData);
      expect(parsedUtmData.utm_source).toBe('google');
      expect(parsedUtmData.utm_medium).toBe('affiliate');
      expect(parsedUtmData.utm_campaign).toBe('new_campaign');
      
      // New affiliate cookies should be created
      expect(getCookieValue('affiliate_tracking')).toBe('new_affiliate_token');
      
      const affiliateData = getCookieValue('affiliate_data');
      expect(affiliateData).toBeTruthy();
      const parsedAffiliateData = JSON.parse(affiliateData);
      expect(parsedAffiliateData.affiliate_tracking).toBe('new_affiliate_token');
      expect(parsedAffiliateData.utm_data.utm_medium).toBe('affiliate');
    });
  });

  describe('GCLID Handling', () => {
    it('should set gclid cookie from gclid parameter', async () => {
      setURLSearchParams({
        gclid: 'google_click_id_123'
      });
      
      const result = window.getMarketingCookies();
      
      const gclid = getCookieValue('gclid');
      expect(gclid).toBe('google_click_id_123');
    });

    it('should set gclid cookie from gclid_url parameter', async () => {
      setURLSearchParams({
        gclid_url: 'google_click_url_456'
      });
      
      const result = window.getMarketingCookies();
      
      const gclid = getCookieValue('gclid');
      expect(gclid).toBe('google_click_url_456');
    });

    it('should prioritize gclid over gclid_url', async () => {
      setURLSearchParams({
        gclid: 'priority_gclid',
        gclid_url: 'secondary_gclid'
      });
      
      const result = window.getMarketingCookies();
      
      const gclid = getCookieValue('gclid');
      expect(gclid).toBe('priority_gclid');
    });
  });

  describe('Campaign Channel Handling', () => {
    it('should set campaign_channel cookie from ca parameter', async () => {
      setURLSearchParams({
        ca: 'email_campaign'
      });
      
      const result = window.getMarketingCookies();
      
      const campaignChannel = getCookieValue('campaign_channel');
      expect(campaignChannel).toBe('email_campaign');
    });
  });

  describe('Cookie Persistence', () => {
    it('should not overwrite existing signup_device cookie', async () => {
      setCookieDirectly('signup_device', JSON.stringify({
        signup_device: 'mobile'
      }));
      
      mockDesktopUserAgent();
      
      const result = window.getMarketingCookies();
      
      const signupDevice = getCookieValue('signup_device');
      const parsedSignupDevice = JSON.parse(signupDevice);
      expect(parsedSignupDevice.signup_device).toBe('mobile'); // Should keep existing
    });

    it('should not overwrite existing date_first_contact cookie', async () => {
      const existingDate = '2023-01-01';
      setCookieDirectly('date_first_contact', JSON.stringify({
        date_first_contact: existingDate
      }));
      
      const result = window.getMarketingCookies();
      
      const dateFirstContact = getCookieValue('date_first_contact');
      const parsedDate = JSON.parse(dateFirstContact);
      expect(parsedDate.date_first_contact).toBe(existingDate); // Should keep existing
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed utm_data cookie gracefully', async () => {
      setCookieDirectly('utm_data', 'invalid_json');
      
      const result = window.getMarketingCookies();
      
      // Should not throw error and should continue processing
      expect(result).toBeDefined();
      expect(window.marketingCookieLogs.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed signup_device cookie gracefully', async () => {
      setCookieDirectly('signup_device', 'invalid_json');
      
      const result = window.getMarketingCookies();
      
      // Should create new signup_device cookie
      const signupDevice = getCookieValue('signup_device');
      expect(signupDevice).toBeTruthy();
      expect(isValidJSON(signupDevice)).toBe(true);
    });

    it('should handle malformed date_first_contact cookie gracefully', async () => {
      setCookieDirectly('date_first_contact', 'invalid_json');
      
      const result = window.getMarketingCookies();
      
      // Should create new date_first_contact cookie
      const dateFirstContact = getCookieValue('date_first_contact');
      expect(dateFirstContact).toBeTruthy();
      expect(isValidJSON(dateFirstContact)).toBe(true);
    });
  });

  describe('Global State Management', () => {
    it('should return cookieData object with original and sanitized values', async () => {
      const result = window.getMarketingCookies();
      
      expect(result).toBeDefined();
      expect(result.original).toBeDefined();
      expect(result.sanitized).toBeDefined();
    });
  });
});
