const DERIV_APP = "app.deriv.com";
const STAGING_DERIV_APP = "staging-app.deriv.com";
const UAT_DERIV_APP = "uat-app.deriv.com";

const SMART_TRADER = "smarttrader.deriv.com";
const STAGING_SMART_TRADER = "staging-smarttrader.deriv.com";

const DOMAIN_LIST_APP_ID = {
  [DERIV_APP]: "16929",
  "app.deriv.be": "16929",
  "app.deriv.me": "16929",
  [STAGING_DERIV_APP]: "16930",
  "staging-app.deriv.me": "16930",
  "staging-app.deriv.be": "16930",
  [UAT_DERIV_APP]: "16929",
  "test-app.deriv.com": "16929",

  [SMART_TRADER]: "22168",
  "smarttrader.deriv.me": "22168",
  "smarttrader.deriv.be": "22168",
  [STAGING_SMART_TRADER]: "22169",
  "staging-smarttrader.deriv.be": "22169",
  "staging-smarttrader.deriv.me": "22169",
};

const getAppID = () => {
  const host =  window.location.hostname;
  return DOMAIN_LIST_APP_ID[host] || "16929";
};

class FreshChat {
  constructor({ token = null, hideButton = false } = {}) {
    this.authToken = token;
    this.hideButton = hideButton;
    const config_url = localStorage.getItem("config.server_url");
    const config_appID = localStorage.getItem("config.app_id");
    this.hostname = config_url && config_url.trim() !== "" ? config_url : "green.derivws.com";
    this.appId = config_appID && config_appID.trim() !== "" ? config_appID : getAppID();
    this.init();
  }

  static async initialize(options) {
    return new FreshChat(options);
  }

  init = async () => {
    let jwt = null;
    if (this.authToken) {
      jwt = await this.fetchJWTToken({
        token: this.authToken,
        appId: this.appId,
        server: this.hostname,
      });
    }

    let fcScript = document.getElementById("fc-script");
    if (fcScript) {
      document.body.removeChild(fcScript);
    }

    // Append the CRM Tracking Code Dynamically
    var script = document.createElement("script");
    script.src = "https://uae.fw-cdn.com/40116340/63296.js";
    script.setAttribute("chat", "true");
    script.id = "fc-script";
    document.body.appendChild(script);

    window.fcWidgetMessengerConfig = {
      config: {
        headerProperty: {
          hideChatButton: this.hideButton,
        },
      },
    };

    script.onload = function () {
      if (jwt) {
        window.fcWidget?.user?.setProperties({
          cf_user_jwt: jwt,
        });
      }
    };
  };

  fetchJWTToken = async ({ token, appId, server }) => {
    try {
      const response = await fetch(
        `https://${server}/websockets/service_token?app_id=${appId}&l=EN&brand=deriv`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": token,
          },
          body: JSON.stringify({ service: "freshworks_user_jwt" }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      return data?.service_token?.freshworks_user_jwt?.token;
    } catch (error) {
      return null;
    }
  };
}

window.FreshChat = FreshChat;

window.fcSettings = {
  onInit: function () {
    window.fcWidget.on("user:statechange", function (data) {
      if (data.success) {
        let userData = data.data;

        // authenticate user success
        if (userData) {
          if (userData.userState === "authenticated") {
          }

          if (userData.userState === "created") {
          }

          if (userData.userState === "loaded") {
          }

          if (userData.userState === "identified") {
          }

          if (userData.userState === "restored") {
          }
        }
      } else {
        let userData = data.data;
        if (userData) {
          if (
            userData.userState === "not_loaded" ||
            userData.userState === "unloaded" ||
            userData.userState === "not_created" ||
            userData.userState === "not_authenticated"
          ) {
          }
        }
      }
    });
  },
};