const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const createError = require("http-errors");
const rateLimit = require("express-rate-limit");

const Url = require('./models/Model-Url');
const urlRoute = require("./routes/route-url");
const visitorRoutes = require('./routes/visitor');

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Render terminates TLS at one proxy hop; without this every client shares the proxy IP for rate limiting
if (isProduction) app.set('trust proxy', 1);

// cors() also answers preflight (OPTIONS) requests for the routes it covers
app.use(cors({
  origin: isProduction ? 'https://url-shortning.netlify.app' : true,
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const limiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use("/api/url/shorten", limiter(30));
app.use("/api/visitor/visit", limiter(20));

app.use("/api/url", urlRoute);
app.use('/api/visitor', visitorRoutes);

// The npm package bundles the built client in public/; the Render deploy has no such folder
// and serves only the API, with the client hosted separately on Netlify.
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) app.use(express.static(PUBLIC_DIR));

// Short codes use A-Z, a-z, 0-9, _ and -: 6 characters for new links, 7-14 for links made by the shortid library.
// Other paths (e.g. /favicon.ico) skip the DB lookup.
const SHORT_ID_PATTERN = /^[A-Za-z0-9_-]{6,14}$/;

// Counts only failed lookups (404), so normal clicks are never limited while code guessing is slowed down
const redirectMissLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many unknown links. Please try again later.',
});

const NOT_FOUND_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Link not found</title></head>
<body style="font-family:sans-serif;text-align:center;padding:4rem 1rem">
<h1>Link not found</h1><p>This short link does not exist or has been removed.</p>
</body></html>`;

// Redirect to the original URL and record the visit
app.get('/:shortId', (req, res, next) => {
  next(SHORT_ID_PATTERN.test(req.params.shortId) ? undefined : 'route');
}, redirectMissLimiter, async (req, res, next) => {
  try {
    const url = await Url.findOneAndUpdate(
      { shortId: req.params.shortId },
      {
        $inc: { clicks: 1 },
        $push: {
          visitHistory: {
            $each: [{ timestamp: new Date() }],
            $slice: -Url.MAX_VISIT_HISTORY,
          },
        },
      },
      { projection: { originalUrl: 1 } }
    );

    if (url) return res.redirect(url.originalUrl);
    return res.status(404).type('html').send(NOT_FOUND_PAGE);
  } catch (err) {
    return next(err);
  }
});

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  if (status >= 500) console.error(err);
  // Hide internal error details from clients
  res.status(status).send(status >= 500 ? 'Internal Server Error' : err.message);
});

module.exports = app;
