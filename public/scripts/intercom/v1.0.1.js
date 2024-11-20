class DerivInterCom {
  constructor({ userData = null, hideLauncher = true } = {}) {
    this.userData = userData;

    this.intercomConfig = {
      app_id: "rfwdy059",
      hide_default_launcher: hideLauncher,
    };

    if (userData) {
      this.intercomConfig = {
        ...this.intercomConfig,
        email: userData.email,
        name: userData.name,
        user_id: userData.user_id,
        created_at: userData.created_at,
      };
    }

    this.init();
  }

  static initialize(options) {
    return new DerivInterCom(options);
  }

  init = () => {
    let existingScript = document.getElementById("ic-script");
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
    Intercom("boot", this.intercomConfig);
  };
}

window.DerivInterCom = DerivInterCom;
