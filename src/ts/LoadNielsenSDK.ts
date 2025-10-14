/**
 * Configuration options for the Nielsen Measurements integration.
 */

type NielsenConfig = {
  // The application ID provided by Nielsen.
  appId: string;
  instanceName: string;
  options?: Record<string, string>;
  // If "true", disables all tracking. Use this to manage user consent.
  optout?: boolean;
  // Turn on or off the First Party ID. Defaults to "true".
  enableFpid?: boolean;
  // If "true", enables Nielsen console logging. Defaults to "false".
  debug?: boolean;
  onError?: (err: Error) => void;
  timeoutMs?: number;
};

export function LoadNielsenSDK({
  appId,
  instanceName,
  options = {},
  optout = false,
  enableFpid = true,
  debug = false,
  onError,
  timeoutMs = 5000,
}: NielsenConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      const error = new Error('Nielsen SDK can only be loaded in a browser environment.');
      onError?.(error);
      reject(error);
      return;
    }

    if ((window as any).NOLBUNDLE?.[instanceName]) {
      (window as any).nSdkInstance = (window as any).NOLBUNDLE[instanceName];
      return resolve();
    }

    // Extracted from: https://engineeringportal.nielsen.com/wiki/DCR_France_Video_Browser_SDK
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `!function(e,n){
      function t(e){return"object"==typeof e?JSON.parse(JSON.stringify(e)):e}
      e[n]=e[n]||{
        nlsQ:function(o,r,c){
          var s=e.document,a=s.createElement("script");
          a.async=1;
          a.src=("http:"===e.location.protocol?"http:":"https:")+"//cdn-gl.nmrodam.com/conf/"+o+".js#name="+r+"&ns="+n;
          var i=s.getElementsByTagName("script")[0];
          i.parentNode.insertBefore(a,i);
          e[n][r]=e[n][r]||{
            g:c||{},
            q:[],
            ggPM:function(o,c,s,a,i){
              try{e[n][r].q.push(t([o,c,s,a,i]))}
              catch(e){console?.log("Error: Cannot register event in Nielsen SDK queue.")}
            },
            te:[],
            trackEvent:function(o){
              try{e[n][r].te.push(t(o))}
              catch(e){console?.log("Error: Cannot register event in Nielsen SDK queue.")}
            }
          };
          return e[n][r];
        }
      };
    }(window,"NOLBUNDLE");`;

    document.head.appendChild(script);

    setTimeout(() => {
      if (!(window as any).nSdkInstance) {
        const error = new Error('Nielsen SDK load timeout.');
        onError?.(error);
        reject(error);
      }
    }, timeoutMs);

    try {
      if (!(window as any).NOLBUNDLE || typeof (window as any).NOLBUNDLE.nlsQ !== 'function') {
        throw new Error('Nielsen Static Queue Snippet did not load properly.');
      }

      const fullOptions: Record<string, string> = {
        ...options,
        optout: optout ? 'true' : 'false',
        enableFpid: enableFpid ? 'true' : 'false',
      };

      if (debug) {
        fullOptions.nol_sdkDebug = 'debug';
      }

      const sdkInstance = (window as any).NOLBUNDLE.nlsQ(appId, instanceName, fullOptions);

      const checkReady = () => {
        if (sdkInstance?.ggPM) {
          (window as any).nSdkInstance = sdkInstance;
          console?.log(`Nielsen SDK instance "${instanceName}" initialized successfully.`);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };

      checkReady();
    } catch (err) {
      const error = new Error(`Failed to initialize Nielsen SDK: ${(err as Error).message}`);
      onError?.(error);
      reject(error);
    }
  });
}
