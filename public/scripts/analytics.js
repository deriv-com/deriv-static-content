const cacheTrackEvents = {
  interval: null,
  responses: [],
  isTrackingResponses: false,
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
          data: this.responseText,
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
    return !!(instances?.tracking && instances?.ab);
  },
  parseCookies: (cookieName) => {
    const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=");
      acc[decodeURIComponent(key)] = decodeURIComponent(value);
      return acc;
    }, {});

    return JSON.parse(cookies[cookieName] || null);
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
  track: (event, cache) => {
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
      if (
        typeof window.Analytics !== "undefined" &&
        typeof window.Analytics.Analytics?.pageView === "function" &&
        cacheTrackEvents.isReady()
      ) {
        window.Analytics.Analytics.pageView(window.location.href);
      }

      if (cacheTrackEvents.isPageViewSent()) {
        clearInterval(pageViewInterval);
      }
    }, 1000);
  },
  listen: (element, { name, properties }, cache) => {
    const addClickListener = (el) => {
      if (!el.dataset.clickEventTracking) {
        el.addEventListener("click", function () {
          cacheTrackEvents.track({
            name,
            properties,
            cache,
          });
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

      items.forEach(({ element, event, cache = false }) => {
        const elem = document.querySelectorAll(element);
        const elements = elem instanceof NodeList ? Array.from(elem) : [elem];

        if (!elements.length) {
          allListenersApplied = false;
        }

        elements.forEach((el) => {
          if (!el.dataset.clickEventTracking) {
            cacheTrackEvents.listen(el, event, cache);
            allListenersApplied = false;
          }
        });
      });

      if (allListenersApplied) {
        clearInterval(cacheTrackEvents.interval);
      }
    }, 1);

    return cacheTrackEvents;
  },
  loadEvent: (items) => {
    items.forEach(({ event }) => {
      const { name, properties } = event;
      cacheTrackEvents.track({
        name,
        properties,
      });
    });

    return cacheTrackEvents;
  },
  pageLoadEvent: (items) => {
    const pathname =  window.location.pathname.slice(1);

    items.forEach(({ pages = [],event }) => {
        if(pages.includes(pathname)){
            console.log(`dispatching page load event for: ${event}`)

            cacheTrackEvents.loadEvent([{event}])
        }
    });
  },
};
