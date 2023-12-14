/* utility functions */
const getDomain = () => {
  const domain = location.hostname;

  if (domain.includes("deriv.com")) {
    return "deriv.com";
  }

  return domain.includes("binary.sx") ? "binary.sx" : domain;
};

const eraseCookie = (name) => {
  document.cookie = `${name}=; Max-Age=-99999999; domain=${getDomain()}; path=/;`;
};

const getCookie = (name) => {
  const dc = document.cookie;
  const prefix = name + "=";

  // check begin index
  let begin = dc.indexOf("; " + prefix);
  if (begin == -1) {
    begin = dc.indexOf(prefix);
    // cookie not available
    if (begin != 0) return null;
  } else {
    begin += 2;
  }

  // check end index
  let end = document.cookie.indexOf(";", begin);
  if (end == -1) {
    end = dc.length;
  }

  return decodeURI(dc.substring(begin + prefix.length, end));
};

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const toISOFormat = (date) => {
  if (date instanceof Date) {
    const utc_year = date.getUTCFullYear();
    const utc_month =
      (date.getUTCMonth() + 1 < 10 ? "0" : "") + (date.getMonth() + 1);
    const utc_date = (date.getUTCDate() < 10 ? "0" : "") + date.getUTCDate();

    return `${utc_year}-${utc_month}-${utc_date}`;
  }

  return "";
};

const shouldOverwrite = (new_utm_data, current_utm_data) => {
  // If we don't have old utm data, the utm_source field is enough for new utm data
  const valid_new_utm_source =
    new_utm_data.utm_source && new_utm_data.utm_source !== "null";
  if (!current_utm_data && valid_new_utm_source) {
    return true;
  }
  // If we have old utm data, 3 fields are required for new utm data to rewrite the old one
  const required_fields = ["utm_source", "utm_medium", "utm_campaign"];
  const has_new_required_fields = required_fields.every(
    (field) => new_utm_data[field]
  );
  if (has_new_required_fields) {
    return true;
  }

  // Otherwise we don't rewrite the old utm_data
  return false;
};
/* end utility functions */

(function initMarketingCookies() {
  const searchParams = new URLSearchParams(window.location.search);
  const brand_name = "deriv";
  const app_id = 11780;

  /* start handling UTMs */
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
  ];

  let utm_data = {};
  const current_utm_data = JSON.parse(
    decodeURIComponent(getCookie("utm_data"))
  );

  // If the user comes to the site for the first time without any URL params
  // Only set the utm_source to referrer if the user does not have utm_data cookies stored
  if (!current_utm_data?.utm_source) {
    utm_data = {
      utm_source: document.referrer ? document.referrer : "null",
    };
  }

  // If the user has any new UTM params, store them
  utm_fields.forEach((field) => {
    if (searchParams.has(field)) {
      utm_data[field] = searchParams.get(field).substring(0, 100); // Limit to 100 supported characters
    }
  });

  if (shouldOverwrite(utm_data, current_utm_data)) {
    eraseCookie("affiliate_tracking");
    eraseCookie("utm_data");

    const utm_data_cookie = encodeURIComponent(JSON.stringify(utm_data))
      .replaceAll("%2C", ",")
      .replaceAll("%7B", "{")
      .replaceAll("%7D", "}");

    // Non-expiring cookie for utm_data
    // Max 400 days
    document.cookie = `utm_data=${utm_data_cookie}; expires=Tue, 19 Jan 9999 03:14:07 UTC; domain=${getDomain()}; path=/; SameSite=None; Secure;`;
  }

  /* end handling UTMs */

  /* start handling affiliate tracking */
  if (searchParams.has("t")) {
    eraseCookie("affiliate_tracking");
    document.cookie = `affiliate_tracking=${searchParams.get(
      "t"
    )}; expires=Tue, 19 Jan 9999 03:14:07 UTC;  domain=${getDomain()}; path=/; SameSite=None; Secure;`;
  }
  /* end handling affiliate tracking */

  /* start handling signup device */
  const signup_device_cookie_unparsed = getCookie("signup_device") || "{}";
  const signup_device_cookie = JSON.parse(
    decodeURI(signup_device_cookie_unparsed).replaceAll("%2C", ",")
  );
  if (!signup_device_cookie.signup_device) {
    const signup_data = {
      signup_device: isMobile() ? "mobile" : "desktop",
    };
    const signup_data_cookie = encodeURI(JSON.stringify(signup_data))
      .replace(",", "%2C")
      .replace("%7B", "{")
      .replace("%7D", "}");

    document.cookie = `signup_device=${signup_data_cookie};domain=${getDomain()}; path=/; SameSite=None; Secure;`;
  }
  /* end handling signup device */

  /* start handling date first contact */
  const date_first_contact_cookie_unparsed =
    getCookie("date_first_contact") || "{}";
  const date_first_contact_cookie = JSON.parse(
    decodeURI(date_first_contact_cookie_unparsed).replaceAll("%2C", ",")
  );

  if (!date_first_contact_cookie.date_first_contact) {
    const ws = new WebSocket(
      `wss://green.binaryws.com/websockets/v3?app_id=${app_id}&brand=${brand_name}`
    );

    ws.onopen = function (evt) {
      ws.send(JSON.stringify({ time: 1 }));
    };

    ws.onmessage = function (msg) {
      const date_first_contact_response = JSON.parse(msg.data);

      const date_first_contact_data = {
        date_first_contact: toISOFormat(
          new Date(date_first_contact_response.time * 1000)
        ),
      };

      const date_first_contact_data_cookie = encodeURI(
        JSON.stringify(date_first_contact_data)
      )
        .replace(",", "%2C")
        .replace("%7B", "{")
        .replace("%7D", "}");

      document.cookie = `date_first_contact=${date_first_contact_data_cookie};domain=${getDomain()}; path=/; SameSite=None; Secure;`;

      ws.close();
    };
  }
  /* end handling date first contact */

  /* start handling gclid */
  if (searchParams.has("gclid")) {
    eraseCookie("gclid");
    document.cookie = `gclid=${searchParams.get(
      "gclid"
    )};domain=${getDomain()}; path=/; SameSite=None; Secure;`;
  }
  /* end handling gclid */
})();
