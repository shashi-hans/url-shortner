const baseURL = (window.location.hostname === "localhost") ?
          "http://localhost:4000" : "https://urlshortner-oezp.onrender.com";
const end = '/api/url/shorten';
export const baseUrl = `${baseURL}`;
export const fullURL = `${baseURL}${end}`;