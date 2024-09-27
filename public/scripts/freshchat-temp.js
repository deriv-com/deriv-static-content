const getJWT = async (hostname, uuid, getTokenForWS, callDerivWS) => {
  let extra_fields = {};
  if (uuid) {
    console.log("Setting UUID in JWT request:", uuid);
    extra_fields.freshchat_uuid = uuid;
  }
  const token = await getTokenForWS();
  console.log("Token:", token);
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
  console.log("JWTResponse:", result);
  jwt = result.service_token.freshworks_user_jwt.token;

  console.log("JWT:", jwt, "=>", parseJwt(jwt));

  console.log("Using deriv JWT");
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
    console.log("Connecting to ", wsUri);
    const ws = new WebSocket(wsUri);
    let next_id = 1;
    let requests = {};

    ws.addEventListener("error", (e) => {
      console.error("deriv error " + hostname, e);
      ws.close();
      reject("Error connecting to deriv WS " + hostname);
    });

    const send = (msg) => {
      if (!msg.req_id) {
        msg.req_id = next_id++;
      }
      requests[msg.req_id] = { start: new Date().getTime(), msg: msg };
      console.log("deriv sending: ", msg);
      ws.send(JSON.stringify(msg));
    };

    ws.addEventListener("close", function close() {
      console.log("closed ws deriv" + hostname);
      reject("Deriv WS unexpected close" + hostname);
    });

    ws.addEventListener("open", function open() {
      console.log("connected to deriv " + hostname);
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

      console.log("deriv got unexpected: ", data + "");
      reject("Unexpected message from deriv WS " + this.hostname);
    });
  });
};

class FreshChat {
  tokenForWS = undefined;
  hostname = "qa179.deriv.dev";
  appId = 1;

  constructor({ token = null, locale = "en", hideButton = false } = {}) {
    this.authToken = token;
    this.locale = locale;
    this.hideButton = hideButton;
    this.init();
  }

  static async initialize(options) {
    return new FreshChat(options);
  }

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
    // Call Customer backend and get the signature for userReferenceId
    window.fcWidgetMessengerConfig = {
      locale: this.locale,
      meta: {
        cf_user_jwt: jwt,
      },
      config: {
        headerProperty: {
          hideChatButton: this.hideButton,
        },
      },
    };

    // Append the CRM Tracking Code Dynamically
    var script = document.createElement("script");
    script.src = "https://uae.fw-cdn.com/40116340/63296.js";
    script.setAttribute("chat", "true");
    document.body.appendChild(script);
  };

  getTokenForWS = async () => {
    return new Promise((resolve, reject) => {
      if (this.tokenForWS) {
        resolve(this.tokenForWS.token);
        return;
      }

      if (/^a1-.{29,29}$/.test(this.authToken)) {
        console.log("Valid token: ", this.authToken);
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
    console.log("All cookies for the current domain have been cleared.");
  };

  callDerivWS = async (hostname, params, token) => {
    return callDerivWS(hostname, params, token);
  };
}

window.FreshChat = FreshChat;

window.fcSettings = {
  onInit: function () {
    function authenticateUser(userData) {
      let authenticateCB = async (uuid) => {
        // Signed UUID Hardcoded. Call Customer backend and generate the signed uuid from uuid

        let signedUUID = await getJWT(
          "qa179.deriv.dev",
          uuid,
          () => null,
          callDerivWS
        );
        console.log("signedUUID", signedUUID);
        window.fcWidget.authenticate(signedUUID);
      };

      if (userData && userData.freshchat_uuid) {
        authenticateCB(userData.freshchat_uuid);
      } else {
        // Generate UUID and create new user
        window.fcWidget.user.getUUID().then((resp) => {
          let uuid = resp && resp.data && resp.data.uuid;

          if (uuid) {
            authenticateCB(uuid);
          }
        });
      }
    }

    window.fcWidget.on("frame:statechange", function (data) {
      if (
        data.success === false &&
        data.data.frameState === "not_authenticated"
      ) {
        authenticateUser(data);
      }
    });

    window.fcWidget.on("user:statechange", function (data) {
      if (data.success) {
        let userData = data.data;

        console.log({
          userData,
        });

        // authenticate user success
        if (userData) {
          if (userData.userState === "authenticated") {
            console.log("User Authenticated");
          }

          if (userData.userState === "created") {
            console.log("User Created");
          }

          if (userData.userState === "loaded") {
            console.log("User Loaded");
          }

          if (userData.userState === "identified") {
            console.log("User Identified");
          }

          if (userData.userState === "restored") {
            console.log("User Restored");
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
            authenticateUser(userData);
          }
        }
      }
    });
  },
};
