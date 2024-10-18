const getJWT = async (hostname, uuid, getTokenForWS, callDerivWS) => {
  let extra_fields = {};
  if (uuid) {
    extra_fields.freshchat_uuid = uuid;
  }
  const token = await getTokenForWS();
  let jwt;
  const result = await callDerivWS(
    hostname,
    {
      service_token: 1,
      extra_fields: extra_fields,
      service: "freshworks_user_jwt",
    },
    token
  );
  jwt = result?.service_token?.freshworks_user_jwt?.token;

  return jwt;
};

const parseJwt = (jwt) => {
  if (!jwt) return {};
  var base64Url = jwt.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
};

const callDerivWS = async (hostname, params, token) => {
  return new Promise((resolve, reject) => {
    const wsUri = `wss://${hostname}/websockets/v3?app_id=1&l=EN&brand=deriv`;
    const ws = new WebSocket(wsUri);
    let next_id = 1;
    let requests = {};

    ws.addEventListener("error", (e) => {
      ws.close();
      reject("Error connecting to deriv WS " + hostname);
    });

    const send = (msg) => {
      if (!msg.req_id) {
        msg.req_id = next_id++;
      }
      requests[msg.req_id] = { start: new Date().getTime(), msg: msg };
      ws.send(JSON.stringify(msg));
    };

    ws.addEventListener("close", function close() {
      reject("Deriv WS unexpected close" + hostname);
    });

    ws.addEventListener("open", function open() {
      send({ authorize: token });
    });

    ws.addEventListener("message", function message(data) {
      if (typeof data === "object") {
        let jsonStr = data.data;
        let json = JSON.parse(jsonStr);
        if (typeof json === "object" && "authorize" in json) {
          send(params);
          return;
        } else {
          resolve(json);
          ws.close();
          return;
        }
      }

      reject("Unexpected message from deriv WS " + this.hostname);
    });
  });
};

class FreshChat {
  tokenForWS = undefined;
  hostname = "green.derivws.com";
  appId = 1;

  constructor({ token = null, hideButton = false } = {}) {
    this.authToken = token;
    this.hideButton = hideButton;
    this.init();
  }

  static async initialize(options) {
    return new FreshChat(options);
  }

  actions = [];

  getStorage = (name) => {
    const value = localStorage.getItem(name);
    return value === "1" ? true : value === "0" ? false : value;
  };
  deleteStorage = (name) => localStorage.removeItem(name);
  clean = () => {
    this.deleteStorage("cfc_is_signed");
    this.deleteStorage("cfc_has_freshchat_interaction");
  };

  init = async () => {
    this.clearCookies();

    let jwt = null;
    if (this.authToken) {
      jwt = await getJWT(
        this.hostname,
        null,
        this.getTokenForWS,
        this.callDerivWS
      );
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

    const _this = this;
    script.onload = function () {
      const hasJWT = jwt && jwt !== "";

      if (hasJWT) {
        window.fcWidget?.user?.setProperties({
          cf_user_jwt: jwt,
        });
      }

      // Clear chat if user logged in without recent chat interactions
      const isSigned = _this.getStorage("cfc_is_signed");
      const hasInteractions = _this.getStorage("cfc_has_freshchat_interaction");

      if (!isSigned && hasJWT) {
        console.log("user came from signout to signin");

        if (!hasInteractions) {
          console.log(
            "user has no previous conversation so we are resetting the chat"
          );

          _this.dispatchAction(() => {
            window.fcWidget.user.clear();
          });
        }
      } else {
        _this.clean();
      }

      // Track user interaction
      _this.dispatchAction(() => {
        window.fcWidget.on("message:sent", function () {
          localStorage.setItem("cfc_has_freshchat_interaction", 1);
        });
      });

      localStorage.setItem("cfc_is_signed", hasJWT ? 1 : 0);
    };
  };

  dispatchAction = (action = null) => {
    // This will wait for the fc.widget to be loaded and dispatch specific actions
    let isFCLoaded = typeof window.fcWidget !== "undefined";

    if (action) {
      this.actions.push(action);
    }

    if (!isFCLoaded) {
      const _this = this;
      setTimeout(() => {
        _this.dispatchAction();
      }, 50);
    } else {
      this.actions.map((action) => {
        action?.();
      });
    }
  };

  getTokenForWS = async () => {
    return new Promise((resolve, reject) => {
      if (this.tokenForWS) {
        resolve(this.tokenForWS.token);
        return;
      }

      if (/^a1-.{29,29}$/.test(this.authToken)) {
        this.tokenForWS = { token: this.authToken };
        resolve(this.authToken);
      } else if (/./.test(this.authToken)) {
        console.log("Invalid token: ", this.authToken);
      }
    });
  };

  clearCookies = () => {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      // Delete cookies for the current path
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;

      // Delete cookies for all possible subdomain paths
      const domainParts = window.location.hostname.split(".");
      while (domainParts.length > 0) {
        const domain = domainParts.join(".");
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;
        domainParts.shift();
      }
    }
  };

  callDerivWS = async (hostname, params, token) => {
    return callDerivWS(hostname, params, token);
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
