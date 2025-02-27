(function () {
  const DERIV_APP = "app.deriv.com";
  const STAGING_DERIV_APP = "staging-app.deriv.com";
  const UAT_DERIV_APP = "uat-app.deriv.com";

  const SMART_TRADER = "smarttrader.deriv.com";
  const STAGING_SMART_TRADER = "staging-smarttrader.deriv.com";

  const P2P = "p2p.deriv.com";

  const DBOT = "dbot.deriv.com";
  const DBOT_STAGING = "staging-dbot.deriv.com";

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

    [P2P]: "61859",

    [DBOT]: "65555",
    "dbot.deriv.be": "65556",
    "dbot.deriv.me": "65557",
    [DBOT_STAGING]: "29934",

    "hub.deriv.com": "61554",
    "staging-hub.deriv.com": "53503",
  };

  const getAppID = () => {
    const host = window.location.hostname;
    return DOMAIN_LIST_APP_ID[host] || "16929";
  };

  class DerivInterCom {
    constructor({ token = null, hideLauncher = true } = {}) {
      this.authToken = token;
      const config_url = localStorage
        .getItem("config.server_url")
        ?.replace(/^['"]+|['"]+$/g, "");
      const config_appID = localStorage
        .getItem("config.app_id")
        ?.replace(/^['"]+|['"]+$/g, "");
      this.hostname =
        config_url && config_url.trim() !== ""
          ? config_url
          : "green.derivws.com";
      this.appId =
        config_appID && config_appID.trim() !== "" ? config_appID : getAppID();

      this.intercomConfig = {
        app_id: "rfwdy059",
        hide_default_launcher: hideLauncher,
      };

      this.init();
    }

    static initialize(options) {
      return new DerivInterCom(options);
    }

    init = async () => {
      try {
        if (this.authToken) {
          const userHashData = await this.fetchUserHash({
            token: this.authToken,
          });

          if (userHashData) {
            const { signature, name, email, phone, user_id } = userHashData;
            this.intercomConfig = {
              ...this.intercomConfig,
              api_base: "https://api-iam.intercom.io",
              user_id,
              user_hash: signature,
              name: name,
              email: email,
              phone: phone,
            };
          } else {
            console.warn(
              "Failed to fetch user hash. Proceeding without user authentication."
            );
          }
        }

        this.injectScript();

        Intercom("boot", this.intercomConfig);
      } catch (error) {
        console.warn("Initialization failed:", error);
      }
    };

    injectScript = () => {
      const existingScript = document.getElementById("ic-script");
      if (existingScript) {
        document.body.removeChild(existingScript);
      }

      const script = document.createElement("script");
      script.id = "ic-script";
      script.textContent = `
              (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/rfwdy059';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
          `;
      document.body.appendChild(script);

      window.isInterComExists = true;
    };

    fetchUserHash = async ({ token }) => {
      try {
        const response = await fetch(
          `https://${this.hostname}/websockets/service_token?app_id=${this.appId}&l=EN&brand=deriv`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token": token,
            },
            body: JSON.stringify({
              service: ["intercom"],
              service_token: 1,
            }),
          }
        );

        if (!response.ok) {
          console.warn(`fetchUserHash error: HTTP ${response.status}`);
          return null;
        }

        const data = await response.json();
        if (!data?.service_token?.intercom) {
          console.warn("fetchUserHash: Missing service token in response.");
          return null;
        }
        return data?.service_token?.intercom;
      } catch (error) {
        console.warn("fetchUserHash failed:", error);
        return null;
      }
    };
  }

  window.DerivInterCom = DerivInterCom;
})();
