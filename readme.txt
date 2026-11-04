URL Shortener (MongoDB, Express, React, Node)

Requirements
- Node 22 (`nvm use`, reads .nvmrc)
- MongoDB; locally server/config/default.json points to mongodb://127.0.0.1:27017/urldatabase

Run locally (two terminals)
- server: `cd server && npm install && npm start`   (http://localhost:4000, `npm run app` restarts on file changes)
- client: `cd client && npm install && npm start`   (http://localhost:3000, Vite forwards /api to the server)

Tests
- server: `cd server && npm test`   (route tests with the database stubbed; no MongoDB needed)

Production
- Server host: set NODE_ENV=production and MONGO_URI (MongoDB connection string).
  BASE_URL is optional and overrides baseUrl in production.json.
  Never put the connection string in a config file; config/custom-environment-variables.json maps the env vars.
- Client build (Netlify): build command `npm run build`, publish directory `build`.
  The API origin comes from client/.env.production (VITE_API_URL, read at build time);
  a VITE_API_URL env var set on Netlify overrides it.
- Rate limits per IP, 15 minute window: 30 calls to /api/url/shorten, 20 calls to /api/visitor/visit,
  30 unknown short codes on GET /<code> (successful redirects are not counted).
- Short codes: new links get 6 characters; older 7-14 character codes keep working.

npm package (CLI)
- server/ is published as @shashi-hans/url-shortner; `npx @shashi-hans/url-shortner --help` (usage in server/README.md).
- `npm pack` / `npm publish` in server/ first builds the client into server/public (prepack), which the
  server then serves on the same port. server/public is gitignored.
- Publish: `cd server && npm login && npm publish` (publishConfig.access is public). Bump "version" first on each release.

Database migration (once, before deploying the unique originalUrl index)
- `cd server && NODE_ENV=production MONGO_URI=... npm run migrate:unique-url`
  Lists duplicate originalUrl documents and stops if any exist; otherwise swaps the
  old originalUrl_1 index for a unique one.
