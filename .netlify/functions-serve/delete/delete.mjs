
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/delete.mts
var delete_default = async (req, context) => {
  try {
    const apiKey = Netlify.env.get("XANO_API_KEY") || process.env.XANO_API_KEY;
    if (!apiKey) {
      console.error("XANO_API_KEY environment variable not found");
      return new Response(JSON.stringify({
        error: "XANO_API_KEY environment variable not configured"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return new Response(JSON.stringify({ error: "Record ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Deleting record:", id);
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Xano API error: ${response.status} - ${errorText}`);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API /delete error:", error);
    return new Response(JSON.stringify({
      error: "Failed to delete record",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
var config = {
  path: "/api/delete/:id"
};
export {
  config,
  delete_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvZGVsZXRlLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0LCBDb25maWcgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBhcGlLZXkgPSBOZXRsaWZ5LmVudi5nZXQoXCJYQU5PX0FQSV9LRVlcIikgfHwgcHJvY2Vzcy5lbnYuWEFOT19BUElfS0VZO1xuICAgIFxuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdYQU5PX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IGZvdW5kJyk7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICAgIGVycm9yOiAnWEFOT19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIG5vdCBjb25maWd1cmVkJ1xuICAgICAgfSksIHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpO1xuICAgIGNvbnN0IGlkID0gdXJsLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCk7XG4gICAgXG4gICAgaWYgKCFpZCkge1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUmVjb3JkIElEIGlzIHJlcXVpcmVkJyB9KSwge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygnRGVsZXRpbmcgcmVjb3JkOicsIGlkKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBodHRwczovL3hham8tYnM3ZC1jYWd0Lm43ZS54YW5vLmlvL2FwaTpwWWVRY3RWWC91c2VyX3N1Ym1pc3Npb24vJHtpZH1gLCB7XG4gICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthcGlLZXl9YFxuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFhhbm8gQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yVGV4dH1gKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgWGFubyBBUEkgZXJyb3I6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyb3JUZXh0fWApO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSB9KSwge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0FQSSAvZGVsZXRlIGVycm9yOicsIGVycm9yKTtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICBlcnJvcjogJ0ZhaWxlZCB0byBkZWxldGUgcmVjb3JkJyxcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgfSksIHtcbiAgICAgIHN0YXR1czogNTAwLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICBwYXRoOiBcIi9hcGkvZGVsZXRlLzppZFwiXG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUVBLElBQU8saUJBQVEsT0FBTyxLQUFjLFlBQXFCO0FBQ3ZELE1BQUk7QUFDRixVQUFNLFNBQVMsUUFBUSxJQUFJLElBQUksY0FBYyxLQUFLLFFBQVEsSUFBSTtBQUU5RCxRQUFJLENBQUMsUUFBUTtBQUNYLGNBQVEsTUFBTSw2Q0FBNkM7QUFDM0QsYUFBTyxJQUFJLFNBQVMsS0FBSyxVQUFVO0FBQUEsUUFDakMsT0FBTztBQUFBLE1BQ1QsQ0FBQyxHQUFHO0FBQUEsUUFDRixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsVUFDUCxnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLE1BQU0sSUFBSSxJQUFJLElBQUksR0FBRztBQUMzQixVQUFNLEtBQUssSUFBSSxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUk7QUFFdkMsUUFBSSxDQUFDLElBQUk7QUFDUCxhQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLHdCQUF3QixDQUFDLEdBQUc7QUFBQSxRQUN0RSxRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLE1BQ2hELENBQUM7QUFBQSxJQUNIO0FBRUEsWUFBUSxJQUFJLG9CQUFvQixFQUFFO0FBQ2xDLFVBQU0sV0FBVyxNQUFNLE1BQU0sbUVBQW1FLEVBQUUsSUFBSTtBQUFBLE1BQ3BHLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNQLGlCQUFpQixVQUFVLE1BQU07QUFBQSxNQUNuQztBQUFBLElBQ0YsQ0FBQztBQUVELFFBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsWUFBTSxZQUFZLE1BQU0sU0FBUyxLQUFLO0FBQ3RDLGNBQVEsTUFBTSxtQkFBbUIsU0FBUyxNQUFNLE1BQU0sU0FBUyxFQUFFO0FBQ2pFLFlBQU0sSUFBSSxNQUFNLG1CQUFtQixTQUFTLE1BQU0sTUFBTSxTQUFTLEVBQUU7QUFBQSxJQUNyRTtBQUVBLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLFNBQVMsS0FBSyxDQUFDLEdBQUc7QUFBQSxNQUNyRCxRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLElBQ2hELENBQUM7QUFBQSxFQUNILFNBQVMsT0FBTztBQUNkLFlBQVEsTUFBTSxzQkFBc0IsS0FBSztBQUN6QyxXQUFPLElBQUksU0FBUyxLQUFLLFVBQVU7QUFBQSxNQUNqQyxPQUFPO0FBQUEsTUFDUCxTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVTtBQUFBLElBQ3BELENBQUMsR0FBRztBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxJQUNoRCxDQUFDO0FBQUEsRUFDSDtBQUNGO0FBRU8sSUFBTSxTQUFpQjtBQUFBLEVBQzVCLE1BQU07QUFDUjsiLAogICJuYW1lcyI6IFtdCn0K
