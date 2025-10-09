
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/batch-update.mts
var batch_update_default = async (req, context) => {
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
    const { updates } = await req.json();
    if (!updates || !Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: "Updates array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Batch updating records:", updates.length);
    const promises = updates.map(async ({ id, fields }) => {
      const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fields)
      });
      if (!response.ok) {
        throw new Error(`Failed to update record ${id}`);
      }
      return response.json();
    });
    const results = await Promise.all(promises);
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API /batch-update error:", error);
    return new Response(JSON.stringify({
      error: "Failed to batch update records",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
var config = {
  path: "/api/batch-update"
};
export {
  config,
  batch_update_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYmF0Y2gtdXBkYXRlLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0LCBDb25maWcgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBhcGlLZXkgPSBOZXRsaWZ5LmVudi5nZXQoXCJYQU5PX0FQSV9LRVlcIikgfHwgcHJvY2Vzcy5lbnYuWEFOT19BUElfS0VZO1xuICAgIFxuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdYQU5PX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IGZvdW5kJyk7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICAgIGVycm9yOiAnWEFOT19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIG5vdCBjb25maWd1cmVkJ1xuICAgICAgfSksIHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCB7IHVwZGF0ZXMgfSA9IGF3YWl0IHJlcS5qc29uKCk7XG4gICAgXG4gICAgaWYgKCF1cGRhdGVzIHx8ICFBcnJheS5pc0FycmF5KHVwZGF0ZXMpKSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdVcGRhdGVzIGFycmF5IGlzIHJlcXVpcmVkJyB9KSwge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygnQmF0Y2ggdXBkYXRpbmcgcmVjb3JkczonLCB1cGRhdGVzLmxlbmd0aCk7XG4gICAgXG4gICAgY29uc3QgcHJvbWlzZXMgPSB1cGRhdGVzLm1hcChhc3luYyAoeyBpZCwgZmllbGRzIH06IHsgaWQ6IHN0cmluZywgZmllbGRzOiBhbnkgfSkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly94YWpvLWJzN2QtY2FndC5uN2UueGFuby5pby9hcGk6cFllUWN0VlgvdXNlcl9zdWJtaXNzaW9uLyR7aWR9YCwge1xuICAgICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHthcGlLZXl9YCxcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGZpZWxkcylcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHVwZGF0ZSByZWNvcmQgJHtpZH1gKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICB9KTtcbiAgICBcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIFxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCByZXN1bHRzIH0pLCB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignQVBJIC9iYXRjaC11cGRhdGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIGJhdGNoIHVwZGF0ZSByZWNvcmRzJyxcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgfSksIHtcbiAgICAgIHN0YXR1czogNTAwLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICBwYXRoOiBcIi9hcGkvYmF0Y2gtdXBkYXRlXCJcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBRUEsSUFBTyx1QkFBUSxPQUFPLEtBQWMsWUFBcUI7QUFDdkQsTUFBSTtBQUNGLFVBQU0sU0FBUyxRQUFRLElBQUksSUFBSSxjQUFjLEtBQUssUUFBUSxJQUFJO0FBRTlELFFBQUksQ0FBQyxRQUFRO0FBQ1gsY0FBUSxNQUFNLDZDQUE2QztBQUMzRCxhQUFPLElBQUksU0FBUyxLQUFLLFVBQVU7QUFBQSxRQUNqQyxPQUFPO0FBQUEsTUFDVCxDQUFDLEdBQUc7QUFBQSxRQUNGLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUVBLFVBQU0sRUFBRSxRQUFRLElBQUksTUFBTSxJQUFJLEtBQUs7QUFFbkMsUUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLFFBQVEsT0FBTyxHQUFHO0FBQ3ZDLGFBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU8sNEJBQTRCLENBQUMsR0FBRztBQUFBLFFBQzFFLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDaEQsQ0FBQztBQUFBLElBQ0g7QUFFQSxZQUFRLElBQUksMkJBQTJCLFFBQVEsTUFBTTtBQUVyRCxVQUFNLFdBQVcsUUFBUSxJQUFJLE9BQU8sRUFBRSxJQUFJLE9BQU8sTUFBbUM7QUFDbEYsWUFBTSxXQUFXLE1BQU0sTUFBTSxtRUFBbUUsRUFBRSxJQUFJO0FBQUEsUUFDcEcsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsaUJBQWlCLFVBQVUsTUFBTTtBQUFBLFVBQ2pDLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsUUFDQSxNQUFNLEtBQUssVUFBVSxNQUFNO0FBQUEsTUFDN0IsQ0FBQztBQUVELFVBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsY0FBTSxJQUFJLE1BQU0sMkJBQTJCLEVBQUUsRUFBRTtBQUFBLE1BQ2pEO0FBRUEsYUFBTyxTQUFTLEtBQUs7QUFBQSxJQUN2QixDQUFDO0FBRUQsVUFBTSxVQUFVLE1BQU0sUUFBUSxJQUFJLFFBQVE7QUFFMUMsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsU0FBUyxNQUFNLFFBQVEsQ0FBQyxHQUFHO0FBQUEsTUFDOUQsUUFBUTtBQUFBLE1BQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxJQUNoRCxDQUFDO0FBQUEsRUFDSCxTQUFTLE9BQU87QUFDZCxZQUFRLE1BQU0sNEJBQTRCLEtBQUs7QUFDL0MsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVO0FBQUEsTUFDakMsT0FBTztBQUFBLE1BQ1AsU0FBUyxpQkFBaUIsUUFBUSxNQUFNLFVBQVU7QUFBQSxJQUNwRCxDQUFDLEdBQUc7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsSUFDaEQsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQUVPLElBQU0sU0FBaUI7QUFBQSxFQUM1QixNQUFNO0FBQ1I7IiwKICAibmFtZXMiOiBbXQp9Cg==
