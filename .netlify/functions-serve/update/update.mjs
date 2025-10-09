
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/update.mts
var update_default = async (req, context) => {
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
    const updates = await req.json();
    console.log("Updating record:", id, "with:", updates);
    const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Xano API error: ${response.status} - ${errorText}`);
      throw new Error(`Xano API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API /update error:", error);
    return new Response(JSON.stringify({
      error: "Failed to update record",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
var config = {
  path: "/api/update/:id"
};
export {
  config,
  update_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvdXBkYXRlLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0LCBDb25maWcgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBhcGlLZXkgPSBOZXRsaWZ5LmVudi5nZXQoXCJYQU5PX0FQSV9LRVlcIikgfHwgcHJvY2Vzcy5lbnYuWEFOT19BUElfS0VZO1xuICAgIFxuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdYQU5PX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IGZvdW5kJyk7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICAgIGVycm9yOiAnWEFOT19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIG5vdCBjb25maWd1cmVkJ1xuICAgICAgfSksIHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpO1xuICAgIGNvbnN0IGlkID0gdXJsLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCk7XG4gICAgXG4gICAgaWYgKCFpZCkge1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUmVjb3JkIElEIGlzIHJlcXVpcmVkJyB9KSwge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCB1cGRhdGVzID0gYXdhaXQgcmVxLmpzb24oKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnVXBkYXRpbmcgcmVjb3JkOicsIGlkLCAnd2l0aDonLCB1cGRhdGVzKTtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGBodHRwczovL3hham8tYnM3ZC1jYWd0Lm43ZS54YW5vLmlvL2FwaTpwWWVRY3RWWC91c2VyX3N1Ym1pc3Npb24vJHtpZH1gLCB7XG4gICAgICBtZXRob2Q6ICdQQVRDSCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke2FwaUtleX1gLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodXBkYXRlcylcbiAgICB9KTtcbiAgICBcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICBjb25zdCBlcnJvclRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICBjb25zb2xlLmVycm9yKGBYYW5vIEFQSSBlcnJvcjogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJvclRleHR9YCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFhhbm8gQVBJIGVycm9yOiAke3Jlc3BvbnNlLnN0YXR1c30gLSAke2Vycm9yVGV4dH1gKTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICBcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KGRhdGEpLCB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignQVBJIC91cGRhdGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHVwZGF0ZSByZWNvcmQnLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICB9KSwge1xuICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XG4gIHBhdGg6IFwiL2FwaS91cGRhdGUvOmlkXCJcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBRUEsSUFBTyxpQkFBUSxPQUFPLEtBQWMsWUFBcUI7QUFDdkQsTUFBSTtBQUNGLFVBQU0sU0FBUyxRQUFRLElBQUksSUFBSSxjQUFjLEtBQUssUUFBUSxJQUFJO0FBRTlELFFBQUksQ0FBQyxRQUFRO0FBQ1gsY0FBUSxNQUFNLDZDQUE2QztBQUMzRCxhQUFPLElBQUksU0FBUyxLQUFLLFVBQVU7QUFBQSxRQUNqQyxPQUFPO0FBQUEsTUFDVCxDQUFDLEdBQUc7QUFBQSxRQUNGLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUVBLFVBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQzNCLFVBQU0sS0FBSyxJQUFJLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFBSTtBQUV2QyxRQUFJLENBQUMsSUFBSTtBQUNQLGFBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU8sd0JBQXdCLENBQUMsR0FBRztBQUFBLFFBQ3RFLFFBQVE7QUFBQSxRQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDaEQsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLFVBQVUsTUFBTSxJQUFJLEtBQUs7QUFFL0IsWUFBUSxJQUFJLG9CQUFvQixJQUFJLFNBQVMsT0FBTztBQUNwRCxVQUFNLFdBQVcsTUFBTSxNQUFNLG1FQUFtRSxFQUFFLElBQUk7QUFBQSxNQUNwRyxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsUUFDUCxpQkFBaUIsVUFBVSxNQUFNO0FBQUEsUUFDakMsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxNQUNBLE1BQU0sS0FBSyxVQUFVLE9BQU87QUFBQSxJQUM5QixDQUFDO0FBRUQsUUFBSSxDQUFDLFNBQVMsSUFBSTtBQUNoQixZQUFNLFlBQVksTUFBTSxTQUFTLEtBQUs7QUFDdEMsY0FBUSxNQUFNLG1CQUFtQixTQUFTLE1BQU0sTUFBTSxTQUFTLEVBQUU7QUFDakUsWUFBTSxJQUFJLE1BQU0sbUJBQW1CLFNBQVMsTUFBTSxNQUFNLFNBQVMsRUFBRTtBQUFBLElBQ3JFO0FBRUEsVUFBTSxPQUFPLE1BQU0sU0FBUyxLQUFLO0FBRWpDLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxJQUFJLEdBQUc7QUFBQSxNQUN4QyxRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLElBQ2hELENBQUM7QUFBQSxFQUNILFNBQVMsT0FBTztBQUNkLFlBQVEsTUFBTSxzQkFBc0IsS0FBSztBQUN6QyxXQUFPLElBQUksU0FBUyxLQUFLLFVBQVU7QUFBQSxNQUNqQyxPQUFPO0FBQUEsTUFDUCxTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVTtBQUFBLElBQ3BELENBQUMsR0FBRztBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxJQUNoRCxDQUFDO0FBQUEsRUFDSDtBQUNGO0FBRU8sSUFBTSxTQUFpQjtBQUFBLEVBQzVCLE1BQU07QUFDUjsiLAogICJuYW1lcyI6IFtdCn0K
