import type { Config } from '@netlify/functions';

/**
 * Minimal health check endpoint for Netlify Functions. Returns a JSON
 * payload with an `ok` flag and whether the XANO_API_KEY environment
 * variable is visible to the function runtime. Mounts at `/api/health`.
 */
export default async () => {
  const hasEnv =
    // Netlify Runtime 2.x API (preferred)
    (globalThis as any)?.Netlify?.env?.get?.('XANO_API_KEY') != null ||
    // Fallback for older/local execution contexts
    process.env.XANO_API_KEY != null;
  return new Response(JSON.stringify({ ok: true, env: !!hasEnv }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config: Config = { path: '/api/health' }
