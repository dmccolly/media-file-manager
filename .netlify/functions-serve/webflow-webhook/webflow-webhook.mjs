
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/webflow-webhook.mts
var webflow_webhook_default = async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }
  try {
    console.log("\u{1F504} Webflow webhook received:", req.method);
    if (req.method === "POST") {
      const webhookData = await req.json();
      console.log("\u{1F4E5} Webhook payload:", webhookData);
      const eventType = webhookData.triggerType || webhookData._meta?.eventType;
      switch (eventType) {
        case "collection_item_created":
          console.log("\u2705 New collection item created:", webhookData.name);
          break;
        case "collection_item_changed":
          console.log("\u{1F504} Collection item updated:", webhookData.name);
          break;
        case "collection_item_deleted":
          console.log("\u{1F5D1}\uFE0F Collection item deleted:", webhookData.name);
          break;
        default:
          console.log("\u{1F4DD} Unknown webhook event:", eventType);
      }
      return new Response(JSON.stringify({
        success: true,
        message: "Webhook processed successfully",
        eventType
      }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u274C Webhook error:", error);
    return new Response(JSON.stringify({
      error: error.message || "Webhook processing failed"
    }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }
};
var config = {
  path: "/api/webflow/webhook"
};
export {
  config,
  webflow_webhook_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvd2ViZmxvdy13ZWJob29rLm10cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb250ZXh0LCBDb25maWcgfSBmcm9tIFwiQG5ldGxpZnkvZnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIChyZXE6IFJlcXVlc3QsIGNvbnRleHQ6IENvbnRleHQpID0+IHtcbiAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJyonLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJyonXG4gIH07XG4gIFxuICBpZiAocmVxLm1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnJywgeyBzdGF0dXM6IDIwMCwgaGVhZGVycyB9KTtcbiAgfVxuICBcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZygnXHVEODNEXHVERDA0IFdlYmZsb3cgd2ViaG9vayByZWNlaXZlZDonLCByZXEubWV0aG9kKTtcbiAgICBcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gJ1BPU1QnKSB7XG4gICAgICBjb25zdCB3ZWJob29rRGF0YSA9IGF3YWl0IHJlcS5qc29uKCk7XG4gICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0U1IFdlYmhvb2sgcGF5bG9hZDonLCB3ZWJob29rRGF0YSk7XG4gICAgICBcbiAgICAgIC8vIEhhbmRsZSBkaWZmZXJlbnQgV2ViZmxvdyB3ZWJob29rIGV2ZW50c1xuICAgICAgY29uc3QgZXZlbnRUeXBlID0gd2ViaG9va0RhdGEudHJpZ2dlclR5cGUgfHwgd2ViaG9va0RhdGEuX21ldGE/LmV2ZW50VHlwZTtcbiAgICAgIFxuICAgICAgc3dpdGNoIChldmVudFR5cGUpIHtcbiAgICAgICAgY2FzZSAnY29sbGVjdGlvbl9pdGVtX2NyZWF0ZWQnOlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdcdTI3MDUgTmV3IGNvbGxlY3Rpb24gaXRlbSBjcmVhdGVkOicsIHdlYmhvb2tEYXRhLm5hbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb2xsZWN0aW9uX2l0ZW1fY2hhbmdlZCc6XG4gICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REQwNCBDb2xsZWN0aW9uIGl0ZW0gdXBkYXRlZDonLCB3ZWJob29rRGF0YS5uYW1lKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29sbGVjdGlvbl9pdGVtX2RlbGV0ZWQnOlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdcdUQ4M0RcdURERDFcdUZFMEYgQ29sbGVjdGlvbiBpdGVtIGRlbGV0ZWQ6Jywgd2ViaG9va0RhdGEubmFtZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1RENERCBVbmtub3duIHdlYmhvb2sgZXZlbnQ6JywgZXZlbnRUeXBlKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IFxuICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgbWVzc2FnZTogJ1dlYmhvb2sgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIGV2ZW50VHlwZSBcbiAgICAgIH0pLCB7XG4gICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICBoZWFkZXJzOiB7IC4uLmhlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBcbiAgICAgIGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyBcbiAgICB9KSwge1xuICAgICAgc3RhdHVzOiA0MDUsXG4gICAgICBoZWFkZXJzOiB7IC4uLmhlYWRlcnMsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfVxuICAgIH0pO1xuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1x1Mjc0QyBXZWJob29rIGVycm9yOicsIGVycm9yKTtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgXG4gICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnV2ViaG9vayBwcm9jZXNzaW5nIGZhaWxlZCcgXG4gICAgfSksIHtcbiAgICAgIHN0YXR1czogNTAwLFxuICAgICAgaGVhZGVyczogeyAuLi5oZWFkZXJzLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH1cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ29uZmlnID0ge1xuICBwYXRoOiBcIi9hcGkvd2ViZmxvdy93ZWJob29rXCJcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7O0FBRUEsSUFBTywwQkFBUSxPQUFPLEtBQWMsWUFBcUI7QUFDdkQsUUFBTSxVQUFVO0FBQUEsSUFDZCwrQkFBK0I7QUFBQSxJQUMvQixnQ0FBZ0M7QUFBQSxJQUNoQyxnQ0FBZ0M7QUFBQSxFQUNsQztBQUVBLE1BQUksSUFBSSxXQUFXLFdBQVc7QUFDNUIsV0FBTyxJQUFJLFNBQVMsSUFBSSxFQUFFLFFBQVEsS0FBSyxRQUFRLENBQUM7QUFBQSxFQUNsRDtBQUVBLE1BQUk7QUFDRixZQUFRLElBQUksdUNBQWdDLElBQUksTUFBTTtBQUV0RCxRQUFJLElBQUksV0FBVyxRQUFRO0FBQ3pCLFlBQU0sY0FBYyxNQUFNLElBQUksS0FBSztBQUNuQyxjQUFRLElBQUksOEJBQXVCLFdBQVc7QUFHOUMsWUFBTSxZQUFZLFlBQVksZUFBZSxZQUFZLE9BQU87QUFFaEUsY0FBUSxXQUFXO0FBQUEsUUFDakIsS0FBSztBQUNILGtCQUFRLElBQUksdUNBQWtDLFlBQVksSUFBSTtBQUM5RDtBQUFBLFFBQ0YsS0FBSztBQUNILGtCQUFRLElBQUksc0NBQStCLFlBQVksSUFBSTtBQUMzRDtBQUFBLFFBQ0YsS0FBSztBQUNILGtCQUFRLElBQUksNENBQWdDLFlBQVksSUFBSTtBQUM1RDtBQUFBLFFBQ0Y7QUFDRSxrQkFBUSxJQUFJLG9DQUE2QixTQUFTO0FBQUEsTUFDdEQ7QUFFQSxhQUFPLElBQUksU0FBUyxLQUFLLFVBQVU7QUFBQSxRQUNqQyxTQUFTO0FBQUEsUUFDVCxTQUFTO0FBQUEsUUFDVDtBQUFBLE1BQ0YsQ0FBQyxHQUFHO0FBQUEsUUFDRixRQUFRO0FBQUEsUUFDUixTQUFTLEVBQUUsR0FBRyxTQUFTLGdCQUFnQixtQkFBbUI7QUFBQSxNQUM1RCxDQUFDO0FBQUEsSUFDSDtBQUVBLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLE1BQ2pDLE9BQU87QUFBQSxJQUNULENBQUMsR0FBRztBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsU0FBUyxFQUFFLEdBQUcsU0FBUyxnQkFBZ0IsbUJBQW1CO0FBQUEsSUFDNUQsQ0FBQztBQUFBLEVBRUgsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLHlCQUFvQixLQUFLO0FBQ3ZDLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVTtBQUFBLE1BQ2pDLE9BQU8sTUFBTSxXQUFXO0FBQUEsSUFDMUIsQ0FBQyxHQUFHO0FBQUEsTUFDRixRQUFRO0FBQUEsTUFDUixTQUFTLEVBQUUsR0FBRyxTQUFTLGdCQUFnQixtQkFBbUI7QUFBQSxJQUM1RCxDQUFDO0FBQUEsRUFDSDtBQUNGO0FBRU8sSUFBTSxTQUFpQjtBQUFBLEVBQzVCLE1BQU07QUFDUjsiLAogICJuYW1lcyI6IFtdCn0K
