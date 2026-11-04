# url-shortner

Self-hosted URL shortener. One command starts the web page, the API and the short-link redirects on a single port.

## Requirements

- Node.js 22 or newer
- A MongoDB database (local or hosted)

## Usage

```sh
npx @shashi-hans/url-shortner
```

Then open http://localhost:4000, paste a long URL and get a short link.

With your own database and public domain:

```sh
MONGO_URI="mongodb://<user>:<password>@<host>:27017/<db>" \
  npx @shashi-hans/url-shortner --port 8080 --base-url https://sho.rt
```

Or install it globally:

```sh
npm install -g @shashi-hans/url-shortner
url-shortner --help
```

## Options

| Option | Env var | Default |
|---|---|---|
| `-p, --port` | `PORT` | `4000` |
| `-m, --mongo-uri` | `MONGO_URI` | `mongodb://127.0.0.1:27017/urldatabase` |
| `-b, --base-url` | `BASE_URL` | `http://localhost:<port>` |

`--base-url` is the origin written into short links, so set it to the domain people will open.
Pass a MongoDB URI that contains a password through `MONGO_URI`, not `--mongo-uri`: command-line arguments show up in the process list.

## API

- `POST /api/url/shorten` with JSON `{"url": "https://example.com/long/path"}` returns `{"shortUrl": "..."}`. Only `http` and `https` URLs up to 2048 characters are accepted. 30 calls per IP per 15 minutes.
- `GET /<code>` redirects to the original URL and counts the click. New codes are 6 characters. An IP that requests 30 unknown codes in 15 minutes is blocked for the rest of that window; successful redirects do not count.
- `POST /api/visitor/visit` increments and returns the page visitor count. 20 calls per IP per 15 minutes.
- `GET /api/visitor/count` returns the visitor count.

## License

ISC
