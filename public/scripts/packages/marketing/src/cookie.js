window.marketingTrackingSent = false;

function DerivMarketingCookies() {
  let cookieData = {
    original: {},
    sanitized: {},
  };
  // Initialize logging array in window
  window.marketingCookieLogs = [];
  window.marketingCookies = {};

    const searchParams = new URLSearchParams(window.location.search);

  // Initialize variables that will be used throughout the process
  let utm_data = {};
  let affiliate_tracking = null;
  let potential_mistagging = true;
  let overwrite_happened = false;
  let dropped_affiliate_tracking = null;

  // Consolidated affiliate parameter detection
  const hasAffiliateParams = searchParams.has("t") || searchParams.has("affiliate_token") || searchParams.has("sidc");
  
  const utm_fields = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_ad_id",
    "utm_click_id",
    "utm_adgroup_id",
    "utm_campaign_id",
    "utm_msclk_id",
    // For cases where we need to map the query param to some different name e.g [name_from_query_param, mapped_name]
    ["fbclid", "utm_fbcl_id"],
    ["ttclid", "utm_ttclid"],
    ["ScCid", "utm_sccid"],
  ];

  const log = (action, details) => {
    window.marketingCookieLogs.push({
      timestamp: new Date().toISOString(),
      action,
      details,
    });
  };

  log("DerivMarketingCookies", "Initialization started");

  /* utility functions */
  const getDomain = () => {
    const host_domain = location.hostname;
    const allowed_domains = ["deriv.com", "binary.sx"];

    const matched_domain = allowed_domains.find((allowed_domain) =>
      host_domain.includes(allowed_domain)
    );

    return matched_domain ?? host_domain;
  };

  const sanitizeCookieValue = (name, value) => {
    if (value === null || value === undefined) {
      return "";
    }

    // Convert to string if not already
    let stringValue = typeof value === "string" ? value : String(value);
    
    // For JSON strings, validate and return as-is if valid
    if (stringValue.startsWith('{') || stringValue.startsWith('[')) {
      try {
        JSON.parse(stringValue);
        // If it's valid JSON, return as-is (encoding will happen in setCookie)
        return stringValue;
      } catch (e) {
        // If invalid JSON, sanitize it
        log("sanitizeCookieValue", { 
          name, 
          value: stringValue, 
          error: "Invalid JSON, sanitizing",
          action: "sanitizing_invalid_json" 
        });
      }
    }
    
    // For non-JSON strings, apply basic sanitization
    // Allow more characters for URLs, UTM parameters, etc.
    const sanitized = stringValue.replace(/[<>'"]/g, "");
    
    log("sanitizeCookieValue", { 
      name, 
      original: stringValue, 
      sanitized,
      action: "string_sanitized" 
    });
    
    return sanitized;
  };

  const setCookie = (name, value, options = {}) => {
    const sanitizedValue = sanitizeCookieValue(name, value);
    
    // Default options
    const defaults = {
      expires: 365, // days from now
      domain: getDomain(),
      path: '/',
      sameSite: 'None',
      secure: true
    };
    
    const config = { ...defaults, ...options };
    
    // Calculate expiration date
    let expiresString = '';
    if (config.expires) {
      const date = new Date();
      if (typeof config.expires === 'number') {
        // If expires is a number, treat it as days from now
        date.setTime(date.getTime() + (config.expires * 24 * 60 * 60 * 1000));
      } else if (config.expires instanceof Date) {
        // If expires is a Date object, use it directly
        date.setTime(config.expires.getTime());
      }
      expiresString = `; expires=${date.toUTCString()}`;
    }
    
    // Build cookie string
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(sanitizedValue)}${expiresString}`;
    
    if (config.domain) {
      cookieString += `; domain=${config.domain}`;
    }
    
    if (config.path) {
      cookieString += `; path=${config.path}`;
    }
    
    if (config.sameSite) {
      cookieString += `; SameSite=${config.sameSite}`;
    }
    
    if (config.secure) {
      cookieString += `; Secure`;
    }
    
    try {
      document.cookie = cookieString;
      log("setCookie", {
        name,
        sanitizedValue,
        domain: config.domain,
        expires: expiresString,
        success: true
      });
    } catch (error) {
      log("setCookie", {
        name,
        sanitizedValue,
        error: error.message,
        success: false
      });
      console.error('Failed to set cookie:', error);
    }

    window.marketingCookies[name] = value;
    cookieData.original[name] = value;
    cookieData.sanitized[name] = sanitizedValue;
  };

  const eraseCookie = (name) => {
    const existingValue = getCookie(name);
    
    // Set cookie with past expiration date to delete it
    const pastDate = new Date(0).toUTCString();
    const domain = getDomain();
    
    try {
      // Try to delete with current domain
      document.cookie = `${encodeURIComponent(name)}=; expires=${pastDate}; domain=${domain}; path=/; SameSite=None; Secure`;
      
      // Also try to delete without domain (for cookies set without domain)
      document.cookie = `${encodeURIComponent(name)}=; expires=${pastDate}; path=/; SameSite=None; Secure`;
      
      // Try with different path variations
      document.cookie = `${encodeURIComponent(name)}=; expires=${pastDate}; domain=${domain}; path=/`;
      document.cookie = `${encodeURIComponent(name)}=; expires=${pastDate}; path=/`;
      
      log("eraseCookie", { 
        name, 
        existingValue, 
        domain,
        success: true 
      });
    } catch (error) {
      log("eraseCookie", { 
        name, 
        existingValue, 
        error: error.message,
        success: false 
      });
      console.error('Failed to erase cookie:', error);
    }
    
    delete window.marketingCookies[name];
    delete cookieData.original[name];
    delete cookieData.sanitized[name];
  };

  const getCookie = (name) => {
    log("getCookie", { name, action: "started" });
    
    if (!name) {
      log("getCookie", { name, result: null, reason: "invalid_name" });
      return null;
    }
    
    try {
      const encodedName = encodeURIComponent(name);
      const cookies = document.cookie.split(';');
      
      for (let cookie of cookies) {
        cookie = cookie.trim();
        
        // Check if this cookie starts with our name
        if (cookie.startsWith(encodedName + '=')) {
          const value = cookie.substring(encodedName.length + 1);
          const decodedValue = decodeURIComponent(value);
          
          log("getCookie", { 
            name, 
            result: decodedValue, 
            reason: "cookie_found" 
          });
          return decodedValue;
        }
        
        // Also check for non-encoded name for backward compatibility
        if (cookie.startsWith(name + '=')) {
          const value = cookie.substring(name.length + 1);
          let decodedValue;
          
          try {
            decodedValue = decodeURIComponent(value);
          } catch (e) {
            // If decoding fails, return the raw value
            decodedValue = value;
          }
          
          log("getCookie", { 
            name, 
            result: decodedValue, 
            reason: "cookie_found_unencoded" 
          });
          return decodedValue;
        }
      }
      
      log("getCookie", { name, result: null, reason: "cookie_not_found" });
      return null;
    } catch (error) {
      log("getCookie", { 
        name, 
        result: null, 
        error: error.message, 
        reason: "error" 
      });
      console.error('Failed to get cookie:', error);
      return null;
    }
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  const toISOFormat = (date) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      const utc_year = date.getUTCFullYear();
      const utc_month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const utc_date = String(date.getUTCDate()).padStart(2, '0');

      return `${utc_year}-${utc_month}-${utc_date}`;
    }

    return "";
  };

  const shouldOverwrite = (new_utm_data, current_utm_data) => {
    // If we don't have old utm data, the utm_source field is enough for new utm data
    const valid_new_utm_source =
      new_utm_data.utm_source && new_utm_data.utm_source !== "null";
    if (!current_utm_data && valid_new_utm_source) {
      log("shouldOverwrite", {
        reason: "No current UTM data and valid new UTM source",
        new_utm_data,
      });
      return true;
    }

    // If we have old utm data, 3 fields are required for new utm data to rewrite the old one
    const required_fields = ["utm_source", "utm_medium", "utm_campaign"];
    const has_new_required_fields = required_fields.every(
      (field) => new_utm_data[field]
    );
    if (has_new_required_fields) {
      log("shouldOverwrite", {
        reason: "All required fields present in new UTM data",
        new_utm_data,
        current_utm_data,
      });
      return true;
    }

    log("shouldOverwrite", {
      reason: "Conditions not met for overwrite",
      new_utm_data,
      current_utm_data,
    });
    return false;
  };

    const stringifyCookieValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (e) {
      console.warn("Failed to stringify cookie value:", e);
      return String(value);
    }
  };

  const getStringifiedCookies = () => {
    const stringifiedCookies = {};
    Object.entries(window.marketingCookies).forEach(([name, value]) => {
      stringifiedCookies[name] = stringifyCookieValue(value);
    });
    return stringifiedCookies;
  };

  const testCookieFunctionality = () => {
    try {
      // Test basic cookie functionality
      document.cookie = "deriv_test_cookie=1; SameSite=None; Secure";
      const test_result = document.cookie.includes("deriv_test_cookie=");

      // Gather browser and cookie configuration info
      const cookieInfo = {
        status: test_result ? "enabled" : "disabled",
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
        },
        cookieConfig: {
          sameSite: "None",
          secure: true,
          domain: getDomain(),
        },
        cookieSettings: {
          thirdPartyCookies: test_result ? "supported" : "blocked",
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack || window.doNotTrack,
        },
        storage: {
          localStorage: (() => {
            try {
              localStorage.setItem("test", "test");
              localStorage.removeItem("test");
              return "supported";
            } catch (e) {
              return "blocked";
            }
          })(),
          sessionStorage: (() => {
            try {
              sessionStorage.setItem("test", "test");
              sessionStorage.removeItem("test");
              return "supported";
            } catch (e) {
              return "blocked";
            }
          })(),
        },
      };

      if (!test_result) {
        console.warn("⚠️ Cookies not stored - possibly ITP or blocked.");
      }

      return JSON.stringify(cookieInfo);
    } catch (e) {
      console.warn("❌ Cookie setting failed:", e);
      return `error: ${e.message || e.toString()}`;
    }
  };

  const waitForTrackEvent = (retries = 150, interval = 1000) => {
    const getTrackEventFn = () => {
      return window.Analytics?.trackEvent instanceof Function
        ? window.Analytics.trackEvent
        : window.Analytics?.Analytics?.trackEvent instanceof Function
        ? window.Analytics.Analytics.trackEvent
        : null;
    };

    const trackEvent = getTrackEventFn();

    if (trackEvent) {
      setTimeout(() => {
        console.warn("Marketing cookies has been handled");
        trackEvent("debug_marketing_cookies", {
          marketing_cookies: getStringifiedCookies(),
          cookie_status: testCookieFunctionality(),
        });
      }, 1000);
    } else if (retries > 0) {
      setTimeout(() => waitForTrackEvent(retries - 1, interval), interval);
    } else {
      console.warn("trackEvent not available after waiting.");
    }
  };

    // Helper function to clean all marketing cookies
  const cleanAllMarketingCookies = (reason) => {
    const cookiesToRemove = [
      "utm_data", "affiliate_tracking", "affiliate_data", 
      "signup_device", "date_first_contact", "gclid", "campaign_channel"
    ];
    
    cookiesToRemove.forEach(cookieName => eraseCookie(cookieName));
    
    window.marketingCookies = {};
    cookieData.original = {};
    cookieData.sanitized = {};
    
    console.error("🚨 AFFILIATE LINK ERROR:", reason);
    console.error("🧹 All marketing cookies cleared due to incomplete affiliate link");
    log("affiliate_validation", { error: reason, action: "cookies_cleaned" });
  };

  /* start handling UTMs */
  log("UTM_handling", "Started UTM parameter processing");

  // Read existing UTM data once and use consistently
  const utm_data_cookie = getCookie("utm_data");
  let current_utm_data = {};
  
  if (utm_data_cookie) {
    try {
      current_utm_data = JSON.parse(utm_data_cookie);
    } catch (e) {
      // Try with additional decoding for backward compatibility
      try {
        current_utm_data = JSON.parse(decodeURIComponent(utm_data_cookie));
      } catch (e2) {
        log("UTM_handling", { error: "Failed to parse utm_data cookie", utm_data_cookie });
        current_utm_data = {};
      }
    }
  }

  log("UTM_handling", { utm_data_cookie, current_utm_data });

  // Early validation: Check for existing utm_medium=affiliate in cookies
  if (current_utm_data?.utm_medium === "affiliate" && !hasAffiliateParams) {
    cleanAllMarketingCookies("Existing utm_medium=affiliate but missing affiliate parameters (t, affiliate_token, or sidc)");
    log("DerivMarketingCookies", "Initialization completed early due to existing incomplete affiliate link");
    return cookieData;
  }

  // Collect new UTM parameters from URL
  let new_utm_data = {};
  
  // If the user comes to the site for the first time without any URL params
  // Only set the utm_source to referrer if the user does not have utm_data cookies stored
  if (!current_utm_data?.utm_source && !searchParams.toString()) {
    new_utm_data = {
      utm_source: document.referrer ? document.referrer : "null",
    };
  }

  // Collect UTM parameters from URL
  utm_fields.forEach((field) => {
    if (Array.isArray(field)) {
      const [field_key, mapped_field_value] = field;
      if (searchParams.has(field_key)) {
        const value = searchParams.get(field_key).substring(0, 200);
        new_utm_data[mapped_field_value] = value;
        log("UTM_handling", { action: "mapped_field_added", field_key, mapped_field_value, value });
      }
    } else {
      if (searchParams.has(field)) {
        const value = searchParams.get(field).substring(0, 100);
        new_utm_data[field] = value;
        log("UTM_handling", { action: "field_added", field, value });
      }
    }
  });

  // Early validation: Check for new utm_medium=affiliate without affiliate parameters
  if (new_utm_data.utm_medium === "affiliate" && !hasAffiliateParams) {
    cleanAllMarketingCookies("New utm_medium=affiliate but missing affiliate parameters (t, affiliate_token, or sidc)");
    log("DerivMarketingCookies", "Initialization completed early due to new incomplete affiliate link");
    return cookieData;
  }

  // Determine if we should overwrite existing data
  const should_overwrite = shouldOverwrite(new_utm_data, current_utm_data);
  
  if (should_overwrite) {
    log("UTM_handling", "Overwriting existing UTM data");
    
    // Preserve affiliate tracking if it exists and no new affiliate params
    const existing_affiliate_tracking = getCookie("affiliate_tracking");
    if (existing_affiliate_tracking && !hasAffiliateParams) {
      dropped_affiliate_tracking = existing_affiliate_tracking;
      log("UTM_handling", { action: "preserving_affiliate_tracking", existing_affiliate_tracking });
    } else {
      eraseCookie("affiliate_tracking");
    }
    
    eraseCookie("utm_data");
    setCookie("utm_data", JSON.stringify(new_utm_data));
    overwrite_happened = true;
    utm_data = new_utm_data;
    
    log("UTM_handling", { action: "overwrite_completed", new_utm_data, overwrite_happened });
  } else {
    potential_mistagging = false;
    // Use existing data, merge with any new non-conflicting data
    utm_data = { ...current_utm_data, ...new_utm_data };
    
    // Only update cookie if there's new data to add
    if (Object.keys(new_utm_data).length > 0) {
      setCookie("utm_data", JSON.stringify(utm_data));
      log("UTM_handling", { action: "merged_utm_data", current_utm_data, new_utm_data, utm_data });
    } else {
      log("UTM_handling", { action: "no_new_utm_data", current_utm_data });
    }
  }

  log("UTM_handling", "Completed UTM parameter processing");
  /* end handling UTMs */

  /* start handling affiliate tracking */
  log("affiliate_tracking", "Started affiliate tracking processing");
  
  // Consolidated affiliate tracking - all parameters (t, affiliate_token, sidc) set the same cookie
  if (hasAffiliateParams) {
    // Get affiliate value from any of the available parameters
    const affiliateValue = searchParams.get("t") || 
                          searchParams.get("affiliate_token") || 
                          searchParams.get("sidc");
    
    // If overwrite happened but we didn't preserve affiliate tracking, capture it now
    if (overwrite_happened && !dropped_affiliate_tracking) {
      dropped_affiliate_tracking = getCookie("affiliate_tracking");
      potential_mistagging = false;
    }

    eraseCookie("affiliate_tracking");
    setCookie("affiliate_tracking", affiliateValue);
    affiliate_tracking = affiliateValue;
    
    log("affiliate_tracking", { 
      action: "affiliate_set", 
      value: affiliateValue,
      source: searchParams.has("t") ? "t" : 
              searchParams.has("affiliate_token") ? "affiliate_token" : "sidc",
      overwrite_happened,
      dropped_affiliate_tracking
    });
  } else if (dropped_affiliate_tracking) {
    // Restore preserved affiliate tracking if no new affiliate params
    setCookie("affiliate_tracking", dropped_affiliate_tracking);
    affiliate_tracking = dropped_affiliate_tracking;
    
    log("affiliate_tracking", { 
      action: "affiliate_restored", 
      value: dropped_affiliate_tracking 
    });
  }
  
  log("affiliate_tracking", "Completed affiliate tracking processing");
  /* end handling affiliate tracking */

  /* start handling signup device */
  log("signup_device", "Started signup device processing");
  
  const signup_device_cookie_unparsed = getCookie("signup_device") || "{}";
  let signup_device_cookie = {};
  
  try {
    signup_device_cookie = JSON.parse(signup_device_cookie_unparsed);
  } catch (e) {
    // Try with additional decoding for backward compatibility
    try {
      signup_device_cookie = JSON.parse(
        decodeURI(signup_device_cookie_unparsed).replaceAll("%2C", ",")
      );
    } catch (e2) {
      log("signup_device", { error: "Failed to parse signup_device cookie", signup_device_cookie_unparsed });
      signup_device_cookie = {};
    }
  }
  
  log("signup_device", { signup_device_cookie_unparsed, signup_device_cookie });
  
  if (!signup_device_cookie.signup_device) {
    const device = isMobile() ? "mobile" : "desktop";
    const signup_data = {
      signup_device: device,
    };

    setCookie("signup_device", JSON.stringify(signup_data));
    log("signup_device", { action: "device_set", device, signup_data });
  } else {
    cookieData.original.signup_device = signup_device_cookie.signup_device;
    cookieData.sanitized.signup_device = signup_device_cookie.signup_device;
    log("signup_device", { action: "existing_device_used", device: signup_device_cookie.signup_device });
  }
  
  log("signup_device", "Completed signup device processing");
  /* end handling signup device */

  /* start handling date first contact */
  log("date_first_contact", "Started date first contact processing");
  
  const date_first_contact_cookie_unparsed =
    getCookie("date_first_contact") || "{}";
  let date_first_contact_cookie = {};
  
  try {
    date_first_contact_cookie = JSON.parse(date_first_contact_cookie_unparsed);
  } catch (e) {
    // Try with additional decoding for backward compatibility
    try {
      date_first_contact_cookie = JSON.parse(
        decodeURI(date_first_contact_cookie_unparsed).replaceAll("%2C", ",")
      );
    } catch (e2) {
      log("date_first_contact", { error: "Failed to parse date_first_contact cookie", date_first_contact_cookie_unparsed });
      date_first_contact_cookie = {};
    }
  }
  
  log("date_first_contact", { date_first_contact_cookie_unparsed, date_first_contact_cookie });

  if (!date_first_contact_cookie.date_first_contact) {
    const date_first_contact_response = Math.floor(Date.now() / 1000);

    const date_first_contact_data = {
      date_first_contact: toISOFormat(
        new Date(date_first_contact_response * 1000)
      ),
    };

    setCookie("date_first_contact", JSON.stringify(date_first_contact_data));
    log("date_first_contact", { action: "date_set", date_first_contact_response, date_first_contact_data });
  } else {
    cookieData.original.date_first_contact =
      date_first_contact_cookie.date_first_contact;
    cookieData.sanitized.date_first_contact =
      date_first_contact_cookie.date_first_contact;
    log("date_first_contact", { action: "existing_date_used", date: date_first_contact_cookie.date_first_contact });
  }

  log("date_first_contact", "Completed date first contact processing");
  /* end handling date first contact */

  /* start handling gclid */
  log("gclid", "Started gclid processing");
  
  const gclid = searchParams.get("gclid");
  const gclid_url = searchParams.get("gclid_url");
  const final_gclid = gclid || gclid_url || "";
  log("gclid", { gclid, gclid_url, final_gclid });

  if (!!final_gclid) {
    eraseCookie("gclid");
    setCookie("gclid", final_gclid);
    log("gclid", { action: "gclid_set", final_gclid });
  } else {
    log("gclid", { action: "no_gclid_found" });
  }
  
  log("gclid", "Completed gclid processing");
  /* end handling gclid */

  /* start handling campaign channel */
  log("campaign_channel", "Started campaign channel processing");
  
  const campaign_channel = searchParams.get("ca");
  log("campaign_channel", { campaign_channel });

  if (campaign_channel) {
    eraseCookie("campaign_channel");
    setCookie("campaign_channel", campaign_channel);
    log("campaign_channel", { action: "channel_set", campaign_channel });
  } else {
    log("campaign_channel", { action: "no_channel_found" });
  }
  
  log("campaign_channel", "Completed campaign channel processing");
  /* end handling campaign channel */

  /* start handling combined affiliate data */
  // Only create affiliate_data cookie if affiliate parameters are present
  if (hasAffiliateParams) {
    const current_utm_data_for_affiliate = getCookie("utm_data");
    let utm_data_parsed = {};
    
    if (current_utm_data_for_affiliate) {
      try {
        utm_data_parsed = JSON.parse(current_utm_data_for_affiliate);
      } catch (e) {
        try {
          utm_data_parsed = JSON.parse(decodeURIComponent(current_utm_data_for_affiliate));
        } catch (e2) {
          utm_data_parsed = {};
        }
      }
    }
    
    const combined_affiliate_data = {
      affiliate_tracking: affiliate_tracking,
      utm_data: utm_data_parsed
    };
    
    eraseCookie("affiliate_data");
    setCookie("affiliate_data", JSON.stringify(combined_affiliate_data));
    
    log("affiliate_data", { action: "combined_data_set", combined_affiliate_data });
  }

  /* start handling final affiliate validation */
  // Final check for utm_medium=affiliate without affiliate parameters
  const current_utm_medium = utm_data.utm_medium || current_utm_data?.utm_medium;
  
  if (current_utm_medium === "affiliate" && !hasAffiliateParams) {
    cleanAllMarketingCookies("utm_medium=affiliate but missing affiliate parameters (t, affiliate_token, or sidc)");
  }
  /* end handling final affiliate validation */

  log("DerivMarketingCookies", "Initialization completed");



  if (!window.marketingTrackingSent) {
    waitForTrackEvent();
    window.marketingTrackingSent = true;
  }

  return cookieData;
}

DerivMarketingCookies();

window.getMarketingCookies = () => {
  return DerivMarketingCookies();
};
