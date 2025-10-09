
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/upload.mts
var upload_default = async (req, context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const apiKey = Netlify.env.get("XANO_API_KEY") || process.env.XANO_API_KEY;
    if (!apiKey) {
      console.error("XANO_API_KEY environment variable not found");
      return new Response(JSON.stringify({
        success: false,
        error: "XANO_API_KEY environment variable not configured"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const fileData = await req.json();
    console.log("\u{1F504} Netlify Function: Saving file to Xano:", fileData);
    const xanoData = {
      title: fileData.title,
      description: fileData.description,
      category: fileData.category,
      type: fileData.type,
      station: fileData.station,
      notes: fileData.notes,
      tags: fileData.tags,
      media_url: fileData.url,
      thumbnail: fileData.thumbnail,
      file_size: fileData.size,
      upload_date: (/* @__PURE__ */ new Date()).toISOString(),
      duration: fileData.duration || "",
      folder_path: fileData.folder_path || ""
    };
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(xanoData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("\u274C Netlify Function: Xano API error:", response.status, errorText);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    const savedRecord = await response.json();
    console.log("\u2705 Netlify Function: File saved to Xano:", savedRecord);
    return new Response(JSON.stringify({
      success: true,
      record: savedRecord
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("\u274C Netlify Function: Upload error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Upload failed",
      details: error.stack
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
var config = {
  path: "/api/upload"
};
export {
  config,
  upload_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvdXBsb2FkLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0LCBDb25maWcgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSksIHtcbiAgICAgIHN0YXR1czogNDA1LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGFwaUtleSA9IE5ldGxpZnkuZW52LmdldChcIlhBTk9fQVBJX0tFWVwiKSB8fCBwcm9jZXNzLmVudi5YQU5PX0FQSV9LRVk7XG4gICAgXG4gICAgaWYgKCFhcGlLZXkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1hBTk9fQVBJX0tFWSBlbnZpcm9ubWVudCB2YXJpYWJsZSBub3QgZm91bmQnKTtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnWEFOT19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIG5vdCBjb25maWd1cmVkJ1xuICAgICAgfSksIHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBmaWxlRGF0YSA9IGF3YWl0IHJlcS5qc29uKCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQwNCBOZXRsaWZ5IEZ1bmN0aW9uOiBTYXZpbmcgZmlsZSB0byBYYW5vOicsIGZpbGVEYXRhKTtcbiAgICBcbiAgICBjb25zdCB4YW5vRGF0YSA9IHtcbiAgICAgIHRpdGxlOiBmaWxlRGF0YS50aXRsZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBmaWxlRGF0YS5kZXNjcmlwdGlvbixcbiAgICAgIGNhdGVnb3J5OiBmaWxlRGF0YS5jYXRlZ29yeSxcbiAgICAgIHR5cGU6IGZpbGVEYXRhLnR5cGUsXG4gICAgICBzdGF0aW9uOiBmaWxlRGF0YS5zdGF0aW9uLFxuICAgICAgbm90ZXM6IGZpbGVEYXRhLm5vdGVzLFxuICAgICAgdGFnczogZmlsZURhdGEudGFncyxcbiAgICAgIG1lZGlhX3VybDogZmlsZURhdGEudXJsLFxuICAgICAgdGh1bWJuYWlsOiBmaWxlRGF0YS50aHVtYm5haWwsXG4gICAgICBmaWxlX3NpemU6IGZpbGVEYXRhLnNpemUsXG4gICAgICB1cGxvYWRfZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgZHVyYXRpb246IGZpbGVEYXRhLmR1cmF0aW9uIHx8ICcnLFxuICAgICAgZm9sZGVyX3BhdGg6IGZpbGVEYXRhLmZvbGRlcl9wYXRoIHx8ICcnXG4gICAgfTtcbiAgICBcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBodHRwczovL3hham8tYnM3ZC1jYWd0Lm43ZS54YW5vLmlvL2FwaTpwWWVRY3RWWC91c2VyX3N1Ym1pc3Npb25gLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YXBpS2V5fWAsXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh4YW5vRGF0YSlcbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICBjb25zb2xlLmVycm9yKCdcdTI3NEMgTmV0bGlmeSBGdW5jdGlvbjogWGFubyBBUEkgZXJyb3I6JywgcmVzcG9uc2Uuc3RhdHVzLCBlcnJvclRleHQpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBYYW5vIEFQSSBlcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvclRleHR9YCk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHNhdmVkUmVjb3JkID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgTmV0bGlmeSBGdW5jdGlvbjogRmlsZSBzYXZlZCB0byBYYW5vOicsIHNhdmVkUmVjb3JkKTtcbiAgICBcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgIHJlY29yZDogc2F2ZWRSZWNvcmQgXG4gICAgfSksIHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignXHUyNzRDIE5ldGxpZnkgRnVuY3Rpb246IFVwbG9hZCBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgc3VjY2VzczogZmFsc2UsIFxuICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ1VwbG9hZCBmYWlsZWQnLFxuICAgICAgZGV0YWlsczogZXJyb3Iuc3RhY2tcbiAgICB9KSwge1xuICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICBwYXRoOiBcIi9hcGkvdXBsb2FkXCJcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBRUEsSUFBTyxpQkFBUSxPQUFPLEtBQWMsWUFBcUI7QUFDdkQsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixXQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLHFCQUFxQixDQUFDLEdBQUc7QUFBQSxNQUNuRSxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFFQSxNQUFJO0FBQ0YsVUFBTSxTQUFTLFFBQVEsSUFBSSxJQUFJLGNBQWMsS0FBSyxRQUFRLElBQUk7QUFFOUQsUUFBSSxDQUFDLFFBQVE7QUFDWCxjQUFRLE1BQU0sNkNBQTZDO0FBQzNELGFBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLFFBQ2pDLFNBQVM7QUFBQSxRQUNULE9BQU87QUFBQSxNQUNULENBQUMsR0FBRztBQUFBLFFBQ0YsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBRUEsVUFBTSxXQUFXLE1BQU0sSUFBSSxLQUFLO0FBRWhDLFlBQVEsSUFBSSxvREFBNkMsUUFBUTtBQUVqRSxVQUFNLFdBQVc7QUFBQSxNQUNmLE9BQU8sU0FBUztBQUFBLE1BQ2hCLGFBQWEsU0FBUztBQUFBLE1BQ3RCLFVBQVUsU0FBUztBQUFBLE1BQ25CLE1BQU0sU0FBUztBQUFBLE1BQ2YsU0FBUyxTQUFTO0FBQUEsTUFDbEIsT0FBTyxTQUFTO0FBQUEsTUFDaEIsTUFBTSxTQUFTO0FBQUEsTUFDZixXQUFXLFNBQVM7QUFBQSxNQUNwQixXQUFXLFNBQVM7QUFBQSxNQUNwQixXQUFXLFNBQVM7QUFBQSxNQUNwQixjQUFhLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsTUFDcEMsVUFBVSxTQUFTLFlBQVk7QUFBQSxNQUMvQixhQUFhLFNBQVMsZUFBZTtBQUFBLElBQ3ZDO0FBRUEsVUFBTSxXQUFXLE1BQU0sTUFBTSxtRUFBbUU7QUFBQSxNQUM5RixRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxpQkFBaUIsVUFBVSxNQUFNO0FBQUEsUUFDakMsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxNQUNBLE1BQU0sS0FBSyxVQUFVLFFBQVE7QUFBQSxJQUMvQixDQUFDO0FBRUQsUUFBSSxDQUFDLFNBQVMsSUFBSTtBQUNoQixZQUFNLFlBQVksTUFBTSxTQUFTLEtBQUs7QUFDdEMsY0FBUSxNQUFNLDRDQUF1QyxTQUFTLFFBQVEsU0FBUztBQUMvRSxZQUFNLElBQUksTUFBTSxtQkFBbUIsU0FBUyxNQUFNLE1BQU0sU0FBUyxFQUFFO0FBQUEsSUFDckU7QUFFQSxVQUFNLGNBQWMsTUFBTSxTQUFTLEtBQUs7QUFDeEMsWUFBUSxJQUFJLGdEQUEyQyxXQUFXO0FBRWxFLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxJQUNWLENBQUMsR0FBRztBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLFFBQ1AsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUVILFNBQVMsT0FBTztBQUNkLFlBQVEsTUFBTSwwQ0FBcUMsS0FBSztBQUN4RCxXQUFPLElBQUksU0FBUyxLQUFLLFVBQVU7QUFBQSxNQUNqQyxTQUFTO0FBQUEsTUFDVCxPQUFPLE1BQU0sV0FBVztBQUFBLE1BQ3hCLFNBQVMsTUFBTTtBQUFBLElBQ2pCLENBQUMsR0FBRztBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLFFBQ1AsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFFTyxJQUFNLFNBQWlCO0FBQUEsRUFDNUIsTUFBTTtBQUNSOyIsCiAgIm5hbWVzIjogW10KfQo=
