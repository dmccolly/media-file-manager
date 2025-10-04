import type { Handler } from '@netlify/functions'

/**
 * Placeholder Webflow sync function.
 *
 * This stub exists to prevent 404 errors when the client code calls
 * `/.netlify/functions/webflow-sync`. It simply returns a 200 OK status
 * along with any request body it receives. In a real-world deployment,
 * you would replace the contents of this handler with logic that
 * interacts with the Webflow API or performs whatever synchronization
 * your application requires.
 */
export const handler: Handler = async (event) => {
  // Only allow POST requests; respond with 405 for all other methods
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    }
  }

  try {
    // Attempt to parse the request body as JSON. If the body is empty
    // or not valid JSON, default to an empty object.
    const body = event.body ? JSON.parse(event.body) : {}
    // TODO: Implement real sync logic here if needed.

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, message: 'Webflow sync stub invoked', data: body })
    }
  } catch (err) {
    // On JSON parse error or unexpected failure, return a 500 status
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return {
      statusCode: 500,
      body: message
    }
  }
}
