# Cache Track Events Documentation

This documentation covers the `cacheTrackEvents` utility for managing page load and user interaction events. It caches events and fires them once the analytics service is ready.

## Methods

### 1. `cacheTrackEvents.loadEvent(events)`

Triggers an event when the page is loaded and immediately stores it in the cache if analytics is not yet ready.

**Example usage:**

```js
cacheTrackEvents.loadEvent([
  {
    name: "ce_virtual_signup_form",
    properties: {
      action: "email_confirmation_sent",
      form_source: window.location.hostname,
      form_name: "virtual_signup_ppc_landing",
      url: window.location.href,
    },
  },
]);
```

### 2. `cacheTrackEvents.pageLoadEvent(events)`

Triggers an event on page load with specific page targeting. You can either include or exclude pages to trigger the event accordingly.

**Example usage:**

```js
cacheTrackEvents.pageLoadEvent([
  {
    excludedPages: ["signup-success"],
    event: {
      name: "ce_virtual_signup_form",
      properties: {
        action: "open",
        form_source: window.location.hostname,
        form_name: "virtual_signup_ppc_landing",
        url: window.location.href,
      },
    },
  },
  {
    pages: ["signup-success"],
    event: {
      name: "ce_virtual_signup_form",
      properties: {
        action: "email_confirmation_sent",
        form_source: window.location.hostname,
        form_name: "virtual_signup_ppc_landing",
        url: window.location.href,
      },
    },
  },
]);
```

### 3. `cacheTrackEvents.addEventhandler(handlers)`

This function waits for the specified elements to be ready. It applies click listeners that store events in cookies if analytics is not ready, or fire them immediately if analytics is available.

**Example usage:**

```js
cacheTrackEvents.addEventhandler([
  {
    element: ".btn-free-demo .w-button",
    event: {
      name: "ce_cta_clicks",
      properties: {
        action: "click",
        cta_name: "Try free demo",
      },
    },
  },
  {
    element: '[data-attributes="btn-primary-fcta"][data-class="w-button"]',
    event: {
      name: "ce_cta_clicks",
      properties: {
        action: "click",
        cta_name: "Try free demo",
      },
    },
  },
  {
    element: ".livechatbtn",
    event: {
      name: "ce_widget_usage_form",
      properties: {
        action: "click",
        widget_name: "livechat",
      },
    },
  },
  {
    element: ".whatsapp_chat",
    event: {
      name: "ce_widget_usage_form",
      properties: {
        action: "click",
        widget_name: "whatsapp",
      },
    },
  },
  {
    element: ".tradershub-btn",
    event: {
      name: "ce_cta_clicks",
      properties: {
        action: "click",
        cta_name: "Traders Hub",
      },
    },
  },
  {
    element: '[data-attributes="btn-primary-nav"]',
    event: {
      name: "ce_cta_clicks",
      properties: {
        action: "click",
        cta_name: "Try free demo",
      },
    },
  },
  {
    element: '[data-attributes="btn-primary-nav"].tradershub-btn',
    event: {
      name: "ce_cta_clicks",
      properties: {
        action: "click",
        cta_name: "Trader's Hub",
      },
    },
  },
  {
    element: '[data-attributes="btn-secondary-nav"]',
    event: {
      name: "ce_cta_clicks",
      properties: {
        action: "click",
        cta_name: "Login",
      },
    },
  },
]);
```

### 4. `cacheTrackEvents.pageView()`

This triggers the RudderStack page view event when analytics is loaded. If the user moves to another page while analytics is not yet ready, it will store it in cookies to handle and fire accordingly.

```js
cacheTrackEvents.pageView();
```
