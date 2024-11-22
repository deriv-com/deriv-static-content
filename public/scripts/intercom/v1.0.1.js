const APP_ID = "1000005";
const SERVER_URL = "qa83.deriv.dev";

class DerivInterCom {
  constructor({ token = null, hideLauncher = true, userData = null } = {}) {
    this.authToken = token;
    this.userData = userData;

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
          appId: APP_ID,
          server: SERVER_URL,
        });


        if (userHashData) {
          const { signature, user_id } = userHashData;
          this.intercomConfig = {
            ...this.intercomConfig,
            api_base: "https://api-iam.intercom.io",
            user_id,
            user_hash: signature,
            name: this.userData.name, //temp, to be removed
            email: this.userData.email, //temp to be removed
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

  fetchUserHash = async ({ token, appId, server }) => {
    try {
      const response = await fetch(
        `https://${server}/websockets/service_token?app_id=${appId}&l=EN&brand=deriv`,
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
