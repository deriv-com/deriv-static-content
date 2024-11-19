// Version 1.0.12
const cacheTrackEvents = {
  interval: null,
  responses: [],
  isTrackingResponses: false,
  hash: (inputString, desiredLength = 32) => {
    const fnv1aHash = (string) => {
      let hash = 0x811c9dc5;
      for (let i = 0; i < string.length; i++) {
        hash ^= string.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
      }
      return hash.toString(16);
    };

    const base64Encode = (string) => btoa(string);

    let hash = fnv1aHash(inputString);
    let combined = base64Encode(hash);

    while (combined.length < desiredLength) {
      combined += base64Encode(fnv1aHash(combined));
    }

    return combined.substring(0, desiredLength);
  },
  getCookies: (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = decodeURIComponent(parts.pop().split(";").shift());

      try {
        return JSON.parse(cookieValue);
      } catch (e) {
        return cookieValue;
      }
    }
    return null;
  },
  trackPageUnload: () => {
    window.addEventListener("beforeunload", (event) => {
      if (!cacheTrackEvents.isPageViewSent()) {
        cacheTrackEvents.push("cached_analytics_page_views", {
          name: window.location.href,
          properties: {
            url: window.location.href,
          },
        });
      }
    });
  },
  trackResponses: () => {
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      this._method = method;
      return originalXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        let parsedPayload = null;

        if (typeof body === "string") {
          try {
            parsedPayload = JSON.parse(body);
          } catch (e) {
            parsedPayload = body;
          }
        }

        const responseData = {
          url: this._url,
          method: this._method,
          status: this.status,
          headers: this.getAllResponseHeaders(),
          data: (this.responseType === "" || this.responseType === "text") ? this.responseText : null,
          payload: parsedPayload,
        };

        cacheTrackEvents.responses.push(responseData);
      });

      return originalXhrSend.apply(this, arguments);
    };
  },
  isReady: () => {
    if (typeof Analytics === "undefined" || Analytics === null) {
      return false;
    }

    const instances = Analytics.Analytics.getInstances();
    return !!instances?.tracking;
  },
  parseCookies: (cookieName) => {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[decodeURIComponent(key)] = decodeURIComponent(value);
      return acc;
    }, {});

    try {
      return cookies[cookieName] ? JSON.parse(cookies[cookieName]) : null;
    } catch (error) {
      return null;
    }
  },
  isPageViewSent: () =>
    !!cacheTrackEvents.responses.find(
      (e) => e.payload?.type === "page" && e.payload?.anonymousId
    ),
  set: (event) => {
    cacheTrackEvents.push("cached_analytics_events", event);
  },
  push: (cookieName, data) => {
    let storedCookies = [];
    const cacheCookie = cacheTrackEvents.parseCookies(cookieName);
    if (cacheCookie) storedCookies = cacheCookie;
    storedCookies.push(data);

    document.cookie = `${cookieName}=${JSON.stringify(
      storedCookies
    )}; path=/; Domain=.deriv.com`;
  },
  processEvent: (event) => {
    const clientInfo = cacheTrackEvents.getCookies("client_information");

    if (clientInfo) {
      const { email = null } = clientInfo;

      if (email) {
        event.properties.email_hash = cacheTrackEvents.hash(email);
      }
    }
    if (event?.properties?.email) {
      const email = event.properties.email;
      delete event.properties.email;
      event.properties.email_hash = cacheTrackEvents.hash(email);
    }

    return event;
  },
  track: (originalEvent, cache) => {
    const event = cacheTrackEvents.processEvent(originalEvent);

    if (cacheTrackEvents.isReady() && !cache) {
      Analytics.Analytics.trackEvent(event.name, event.properties);
    } else {
      cacheTrackEvents.set(event);
    }
  },
  pageView: () => {
    if (!cacheTrackEvents.isTrackingResponses) {
      cacheTrackEvents.trackResponses();
      cacheTrackEvents.trackPageUnload();
    }

    let pageViewInterval = null;

    pageViewInterval = setInterval(() => {
      const clientInfo = cacheTrackEvents.parseCookies("client_information");
      const signupDevice =
        cacheTrackEvents.parseCookies("signup_device")?.signup_device;

      if (
        typeof window.Analytics !== "undefined" &&
        typeof window.Analytics.Analytics?.pageView === "function" &&
        cacheTrackEvents.isReady()
      ) {
        window.Analytics.Analytics.pageView(window.location.href, {
          loggedIn: !!clientInfo,
          device_type: signupDevice,
          network_type: window?.navigator?.connection?.effectiveType,
          network_rtt: window?.navigator?.connection?.rtt,
          network_downlink: window?.navigator?.connection?.downlink,
        });
      }

      if (cacheTrackEvents.isPageViewSent()) {
        clearInterval(pageViewInterval);
      }
    }, 1000);
  },
  listen: (
    element,
    { name = "", properties = {} },
    cache = false,
    callback = null
  ) => {
    const addClickListener = (el) => {
      if (!el.dataset.clickEventTracking) {
        el.addEventListener("click", function (e) {
          let event = {
            name,
            properties,
            cache,
          };

          if (typeof callback === "function") {
            event = callback(e);
          }

          cacheTrackEvents.track(event);
        });
        el.dataset.clickEventTracking = "true";
      }
    };

    const elements =
      element instanceof NodeList ? Array.from(element) : [element];

    elements.forEach(addClickListener);
  },

  addEventhandler: (items) => {
    cacheTrackEvents.interval = setInterval(() => {
      let allListenersApplied = true;

      items.forEach(
        ({ element, event = {}, cache = false, callback = null }) => {
          const elem =
            element instanceof Element
              ? element
              : document.querySelectorAll(element);
          const elements = elem instanceof NodeList ? Array.from(elem) : [elem];

          if (!elements.length) {
            allListenersApplied = false;
          }

          elements.forEach((el) => {
            if (!el.dataset.clickEventTracking) {
              cacheTrackEvents.listen(el, event, cache, callback);
              allListenersApplied = false;
            }
          });
        }
      );

      if (allListenersApplied) {
        clearInterval(cacheTrackEvents.interval);
      }
    }, 1);

    return cacheTrackEvents;
  },
  loadEvent: (items) => {
    items.forEach(({ event, cache }) => {
      const { name, properties } = event;
      cacheTrackEvents.track(
        {
          name,
          properties,
        },
        cache
      );
    });

    return cacheTrackEvents;
  },
  pageLoadEvent: (items) => {
    const pathname = window.location.pathname.slice(1);
    items.forEach(
      ({ pages = [], excludedPages = [], event, callback = null }) => {
        let dispatch = false;
        if (pages.length) {
          if (pages.includes(pathname)) {
            dispatch = true;
          }
        } else if (excludedPages.length) {
          if (!excludedPages.includes(pathname)) {
            dispatch = true;
          }
        } else {
          dispatch = true;
        }

        if (dispatch) {
          const eventData = callback ? callback() : event;
          cacheTrackEvents.loadEvent([{ event: eventData }]);
        }
      }
    );

    return cacheTrackEvents;
  },
  trackConsoleErrors: (callback) => {
    const originalConsoleError = console.error;
    console.error = function (...args) {
      // Log the error to the console as usual
      originalConsoleError.apply(console, args);

      // Create a clean error message without __trackjs_state__
      const errorMessage = args
        .map((arg) =>
          arg && typeof arg === "object" && arg.message
            ? arg.message
            : typeof arg === "object"
            ? JSON.stringify(arg, (key, value) =>
                key.startsWith("__trackjs") ? undefined : value
              )
            : String(arg)
        )
        .join(" ");

      if (typeof callback === "function") {
        callback(errorMessage);
      }
    };
  },
};
