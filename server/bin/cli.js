#!/usr/bin/env node
// Starts the URL shortener (API, redirects and the bundled web client) on one port.
const path = require('path');
const { parseArgs } = require('util');

const pkg = require('../package.json');

const HELP = `Usage: url-shortner [options]

Starts the URL shortener web app and API on one port. Needs a running MongoDB.

Options:
  -p, --port <port>      Port to listen on (env PORT, default 4000)
  -m, --mongo-uri <uri>  MongoDB connection string
                         (env MONGO_URI, default mongodb://127.0.0.1:27017/urldatabase)
  -b, --base-url <url>   Public origin used to build short links
                         (env BASE_URL, default http://localhost:<port>)
  -h, --help             Show this help
  -v, --version          Show the version

Prefer the MONGO_URI env var over --mongo-uri when the URI holds a password:
command-line arguments are visible to other users in the process list.`;

let values;
try {
  ({ values } = parseArgs({
    options: {
      port: { type: 'string', short: 'p' },
      'mongo-uri': { type: 'string', short: 'm' },
      'base-url': { type: 'string', short: 'b' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  }));
} catch (err) {
  console.error(`${err.message}\n\n${HELP}`);
  process.exit(1);
}

if (values.help) {
  console.log(HELP);
  process.exit(0);
}
if (values.version) {
  console.log(pkg.version);
  process.exit(0);
}

const port = values.port || process.env.PORT || '4000';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  console.error(`Invalid port: ${port}`);
  process.exit(1);
}

const baseUrl = (values['base-url'] || process.env.BASE_URL || `http://localhost:${port}`).replace(/\/+$/, '');
let parsedBase = null;
try {
  parsedBase = new URL(baseUrl);
} catch {}
if (!parsedBase || !['http:', 'https:'].includes(parsedBase.protocol)) {
  console.error(`Invalid base URL: ${baseUrl} (expected http:// or https://)`);
  process.exit(1);
}

// The config package reads these env vars through config/custom-environment-variables.json
process.env.PORT = port;
process.env.BASE_URL = baseUrl;
if (values['mongo-uri']) process.env.MONGO_URI = values['mongo-uri'];
// Load the package's own config folder, not one in the user's working directory
process.env.NODE_CONFIG_DIR = path.join(__dirname, '..', 'config');

require('../index.js');
