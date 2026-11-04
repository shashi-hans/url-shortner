// API origin, set at build time through VITE_API_URL (e.g. https://url-shortner-5wbk.onrender.com).
// Empty means same origin: the Vite dev proxy in development, or a server that also serves the client.
export const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
export const fullURL = `${baseUrl}/api/url/shorten`;
