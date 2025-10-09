
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/health.mts
var health_default = async () => {
  const hasEnv = (
    // Netlify Runtime 2.x API (preferred)
    globalThis?.Netlify?.env?.get?.("XANO_API_KEY") != null || // Fallback for older/local execution contexts
    process.env.XANO_API_KEY != null
  );
  return new Response(JSON.stringify({ ok: true, env: !!hasEnv }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
var config = { path: "/api/health" };
export {
  config,
  health_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvaGVhbHRoLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb25maWcgfSBmcm9tICdAbmV0bGlmeS9mdW5jdGlvbnMnO1xuXG4vKipcbiAqIE1pbmltYWwgaGVhbHRoIGNoZWNrIGVuZHBvaW50IGZvciBOZXRsaWZ5IEZ1bmN0aW9ucy4gUmV0dXJucyBhIEpTT05cbiAqIHBheWxvYWQgd2l0aCBhbiBgb2tgIGZsYWcgYW5kIHdoZXRoZXIgdGhlIFhBTk9fQVBJX0tFWSBlbnZpcm9ubWVudFxuICogdmFyaWFibGUgaXMgdmlzaWJsZSB0byB0aGUgZnVuY3Rpb24gcnVudGltZS4gTW91bnRzIGF0IGAvYXBpL2hlYWx0aGAuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGFzeW5jICgpID0+IHtcbiAgY29uc3QgaGFzRW52ID1cbiAgICAvLyBOZXRsaWZ5IFJ1bnRpbWUgMi54IEFQSSAocHJlZmVycmVkKVxuICAgIChnbG9iYWxUaGlzIGFzIGFueSk/Lk5ldGxpZnk/LmVudj8uZ2V0Py4oJ1hBTk9fQVBJX0tFWScpICE9IG51bGwgfHxcbiAgICAvLyBGYWxsYmFjayBmb3Igb2xkZXIvbG9jYWwgZXhlY3V0aW9uIGNvbnRleHRzXG4gICAgcHJvY2Vzcy5lbnYuWEFOT19BUElfS0VZICE9IG51bGw7XG4gIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBvazogdHJ1ZSwgZW52OiAhIWhhc0VudiB9KSwge1xuICAgIHN0YXR1czogMjAwLFxuICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gIH0pO1xufTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0geyBwYXRoOiAnL2FwaS9oZWFsdGgnIH1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFPQSxJQUFPLGlCQUFRLFlBQVk7QUFDekIsUUFBTTtBQUFBO0FBQUEsSUFFSCxZQUFvQixTQUFTLEtBQUssTUFBTSxjQUFjLEtBQUs7QUFBQSxJQUU1RCxRQUFRLElBQUksZ0JBQWdCO0FBQUE7QUFDOUIsU0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsSUFBSSxNQUFNLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHO0FBQUEsSUFDL0QsUUFBUTtBQUFBLElBQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxFQUNoRCxDQUFDO0FBQ0g7QUFFTyxJQUFNLFNBQWlCLEVBQUUsTUFBTSxjQUFjOyIsCiAgIm5hbWVzIjogW10KfQo=
