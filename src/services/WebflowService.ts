<old_str>     constructor() {
       this.apiToken = import.meta.env.VITE_WEBFLOW_API_TOKEN || '';
       this.siteId = import.meta.env.VITE_WEBFLOW_SITE_ID || '688ed8debc05764047afa2a7';
       this.collectionId = import.meta.env.VITE_WEBFLOW_COLLECTION_ID || '6891479d29ed1066b71124e9';
     }</old_str><new_str>     constructor() {
       // Support both browser and Node.js environments
       const getEnvVar = (name: string) => {
         if (typeof process !== 'undefined' && process.env) {
           return process.env[name] || process.env[name.replace('VITE_', '')] || '';
         }
         if (typeof import.meta !== 'undefined' && import.meta.env) {
           return import.meta.env[name] || '';
         }
         return '';
       };

       this.apiToken = getEnvVar('VITE_WEBFLOW_API_TOKEN') || getEnvVar('WEBFLOW_API_KEY') || '';
       this.siteId = getEnvVar('VITE_WEBFLOW_SITE_ID') || '688ed8debc05764047afa2a7';
       this.collectionId = getEnvVar('VITE_WEBFLOW_COLLECTION_ID') || '6891479d29ed1066b71124e9';
     }</old_str>