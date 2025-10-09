
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/batch-delete.mts
var batch_delete_default = async (req, context) => {
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
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) {
      return new Response(JSON.stringify({ error: "IDs array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Batch deleting records:", ids.length);
    const promises = ids.map(async (id) => {
      const response = await fetch(`https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX/user_submission/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to delete record ${id}`);
      }
      return { id, success: true };
    });
    const results = await Promise.all(promises);
    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("API /batch-delete error:", error);
    return new Response(JSON.stringify({
      error: "Failed to batch delete records",
      details: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
var config = {
  path: "/api/batch-delete"
};
export {
  config,
  batch_delete_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYmF0Y2gtZGVsZXRlLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0LCBDb25maWcgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBhcGlLZXkgPSBOZXRsaWZ5LmVudi5nZXQoXCJYQU5PX0FQSV9LRVlcIikgfHwgcHJvY2Vzcy5lbnYuWEFOT19BUElfS0VZO1xuICAgIFxuICAgIGlmICghYXBpS2V5KSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdYQU5PX0FQSV9LRVkgZW52aXJvbm1lbnQgdmFyaWFibGUgbm90IGZvdW5kJyk7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICAgIGVycm9yOiAnWEFOT19BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIG5vdCBjb25maWd1cmVkJ1xuICAgICAgfSksIHtcbiAgICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCB7IGlkcyB9ID0gYXdhaXQgcmVxLmpzb24oKTtcbiAgICBcbiAgICBpZiAoIWlkcyB8fCAhQXJyYXkuaXNBcnJheShpZHMpKSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJRHMgYXJyYXkgaXMgcmVxdWlyZWQnIH0pLCB7XG4gICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKCdCYXRjaCBkZWxldGluZyByZWNvcmRzOicsIGlkcy5sZW5ndGgpO1xuICAgIFxuICAgIGNvbnN0IHByb21pc2VzID0gaWRzLm1hcChhc3luYyAoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly94YWpvLWJzN2QtY2FndC5uN2UueGFuby5pby9hcGk6cFllUWN0VlgvdXNlcl9zdWJtaXNzaW9uLyR7aWR9YCwge1xuICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7YXBpS2V5fWBcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZGVsZXRlIHJlY29yZCAke2lkfWApO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4geyBpZCwgc3VjY2VzczogdHJ1ZSB9O1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdHMgfSksIHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdBUEkgL2JhdGNoLWRlbGV0ZSBlcnJvcjonLCBlcnJvcik7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gYmF0Y2ggZGVsZXRlIHJlY29yZHMnLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICB9KSwge1xuICAgICAgc3RhdHVzOiA1MDAsXG4gICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgY29uZmlnOiBDb25maWcgPSB7XG4gIHBhdGg6IFwiL2FwaS9iYXRjaC1kZWxldGVcIlxufTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFFQSxJQUFPLHVCQUFRLE9BQU8sS0FBYyxZQUFxQjtBQUN2RCxNQUFJO0FBQ0YsVUFBTSxTQUFTLFFBQVEsSUFBSSxJQUFJLGNBQWMsS0FBSyxRQUFRLElBQUk7QUFFOUQsUUFBSSxDQUFDLFFBQVE7QUFDWCxjQUFRLE1BQU0sNkNBQTZDO0FBQzNELGFBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLFFBQ2pDLE9BQU87QUFBQSxNQUNULENBQUMsR0FBRztBQUFBLFFBQ0YsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFVBQ1AsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBRUEsVUFBTSxFQUFFLElBQUksSUFBSSxNQUFNLElBQUksS0FBSztBQUUvQixRQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sUUFBUSxHQUFHLEdBQUc7QUFDL0IsYUFBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyx3QkFBd0IsQ0FBQyxHQUFHO0FBQUEsUUFDdEUsUUFBUTtBQUFBLFFBQ1IsU0FBUyxFQUFFLGdCQUFnQixtQkFBbUI7QUFBQSxNQUNoRCxDQUFDO0FBQUEsSUFDSDtBQUVBLFlBQVEsSUFBSSwyQkFBMkIsSUFBSSxNQUFNO0FBRWpELFVBQU0sV0FBVyxJQUFJLElBQUksT0FBTyxPQUFlO0FBQzdDLFlBQU0sV0FBVyxNQUFNLE1BQU0sbUVBQW1FLEVBQUUsSUFBSTtBQUFBLFFBQ3BHLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxVQUNQLGlCQUFpQixVQUFVLE1BQU07QUFBQSxRQUNuQztBQUFBLE1BQ0YsQ0FBQztBQUVELFVBQUksQ0FBQyxTQUFTLElBQUk7QUFDaEIsY0FBTSxJQUFJLE1BQU0sMkJBQTJCLEVBQUUsRUFBRTtBQUFBLE1BQ2pEO0FBRUEsYUFBTyxFQUFFLElBQUksU0FBUyxLQUFLO0FBQUEsSUFDN0IsQ0FBQztBQUVELFVBQU0sVUFBVSxNQUFNLFFBQVEsSUFBSSxRQUFRO0FBRTFDLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLFNBQVMsTUFBTSxRQUFRLENBQUMsR0FBRztBQUFBLE1BQzlELFFBQVE7QUFBQSxNQUNSLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsSUFDaEQsQ0FBQztBQUFBLEVBQ0gsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLDRCQUE0QixLQUFLO0FBQy9DLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLE1BQ2pDLE9BQU87QUFBQSxNQUNQLFNBQVMsaUJBQWlCLFFBQVEsTUFBTSxVQUFVO0FBQUEsSUFDcEQsQ0FBQyxHQUFHO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLElBQ2hELENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFFTyxJQUFNLFNBQWlCO0FBQUEsRUFDNUIsTUFBTTtBQUNSOyIsCiAgIm5hbWVzIjogW10KfQo=
