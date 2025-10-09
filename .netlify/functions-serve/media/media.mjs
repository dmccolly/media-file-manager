
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/media.mts
var media_default = async (req, context) => {
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
    console.log("Making request to Xano API...");
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Xano API error: ${response.status} - ${errorText}`);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log("Successfully fetched data from Xano:", data.length || 0, "records");
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("API /media error:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch media records",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
var config = {
  path: "/api/media"
};
export {
  config,
  media_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvbWVkaWEubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbnRleHQsIENvbmZpZyB9IGZyb20gXCJAbmV0bGlmeS9mdW5jdGlvbnNcIjtcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcTogUmVxdWVzdCwgY29udGV4dDogQ29udGV4dCkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGFwaUtleSA9IE5ldGxpZnkuZW52LmdldChcIlhBTk9fQVBJX0tFWVwiKSB8fCBwcm9jZXNzLmVudi5YQU5PX0FQSV9LRVk7XG4gICAgXG4gICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1hBTk9fQVBJX0tFWSBlbnZpcm9ubWVudCB2YXJpYWJsZSBub3QgZm91bmQnKTtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgZXJyb3I6ICdYQU5PX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IGNvbmZpZ3VyZWQnXG4gICAgICB9KSwge1xuICAgICAgICBzdGF0dXM6IDUwMCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKCdNYWtpbmcgcmVxdWVzdCB0byBYYW5vIEFQSS4uLicpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8veGFqby1iczdkLWNhZ3QubjdlLnhhbm8uaW8vYXBpOnBZZVFjdFZYL3VzZXJfc3VibWlzc2lvbmAsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YXBpS2V5fWAsXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICBjb25zb2xlLmVycm9yKGBYYW5vIEFQSSBlcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvclRleHR9YCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFhhbm8gQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yVGV4dH1gKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICBjb25zb2xlLmxvZygnU3VjY2Vzc2Z1bGx5IGZldGNoZWQgZGF0YSBmcm9tIFhhbm86JywgZGF0YS5sZW5ndGggfHwgMCwgJ3JlY29yZHMnKTtcbiAgICBcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpLCB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0FQSSAvbWVkaWEgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGZldGNoIG1lZGlhIHJlY29yZHMnLFxuICAgICAgZGV0YWlsczogZXJyb3IubWVzc2FnZSBcbiAgICB9KSwge1xuICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICBwYXRoOiBcIi9hcGkvbWVkaWFcIlxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFFQSxJQUFPLGdCQUFRLE9BQU8sS0FBYyxZQUFxQjtBQUN2RCxNQUFJO0FBQ0YsVUFBTSxTQUFTLFFBQVEsSUFBSSxJQUFJLGNBQWMsS0FBSyxRQUFRLElBQUk7QUFFOUQsUUFBSSxDQUFDLFFBQVE7QUFDWCxjQUFRLE1BQU0sNkNBQTZDO0FBQzNELGFBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLFFBQ2pDLE9BQU87QUFBQSxNQUNULENBQUMsR0FBRztBQUFBLFFBQ0YsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBRUEsWUFBUSxJQUFJLCtCQUErQjtBQUMzQyxVQUFNLFdBQVcsTUFBTSxNQUFNLG1FQUFtRTtBQUFBLE1BQzlGLFNBQVM7QUFBQSxRQUNQLGlCQUFpQixVQUFVLE1BQU07QUFBQSxRQUNqQyxnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0YsQ0FBQztBQUVELFFBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsWUFBTSxZQUFZLE1BQU0sU0FBUyxLQUFLO0FBQ3RDLGNBQVEsTUFBTSxtQkFBbUIsU0FBUyxNQUFNLE1BQU0sU0FBUyxFQUFFO0FBQ2pFLFlBQU0sSUFBSSxNQUFNLG1CQUFtQixTQUFTLE1BQU0sTUFBTSxTQUFTLEVBQUU7QUFBQSxJQUNyRTtBQUVBLFVBQU0sT0FBTyxNQUFNLFNBQVMsS0FBSztBQUNqQyxZQUFRLElBQUksd0NBQXdDLEtBQUssVUFBVSxHQUFHLFNBQVM7QUFFL0UsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLElBQUksR0FBRztBQUFBLE1BQ3hDLFFBQVE7QUFBQSxNQUNSLFNBQVM7QUFBQSxRQUNQLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxTQUFTLE9BQU87QUFDZCxZQUFRLE1BQU0scUJBQXFCLEtBQUs7QUFDeEMsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVO0FBQUEsTUFDakMsT0FBTztBQUFBLE1BQ1AsU0FBUyxNQUFNO0FBQUEsSUFDakIsQ0FBQyxHQUFHO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQUVPLElBQU0sU0FBaUI7QUFBQSxFQUM1QixNQUFNO0FBQ1I7IiwKICAibmFtZXMiOiBbXQp9Cg==
