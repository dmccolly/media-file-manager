"use strict";

// netlify/functions/webflow-sync.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ok: true, message: "Webflow sync stub invoked", data: body })
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return {
      statusCode: 500,
      body: message
    };
  }
};
//# sourceMappingURL=webflow-sync.js.map
