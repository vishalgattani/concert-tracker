# concert-tracker

CLI tool + interactive music event map. CLI uses Ticketmaster; web map uses Ticketmaster Discovery API v2 + Mapbox, hosted on Vercel.

## CLI

```bash
pip install -r requirements.txt
cp .env.example .env
# Add your Ticketmaster API key to .env
python main.py --city "San Francisco"
```

Events are printed to terminal and saved to `events.json`.

---

## Web Map (`web/`)

Interactive map of music events for the next 7 days, powered by [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) and Mapbox.

Live site: https://concert-tracker-gamma.vercel.app

### Local development

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

### Environment variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | build-time | Mapbox public token (`pk.*`) |
| `TICKETMASTER_API_KEY` | server (runtime) | Ticketmaster Discovery API consumer key |

Add to `web/.env.local` for local dev. For Vercel production:

```bash
cd web
echo "your-key" | vercel env add TICKETMASTER_API_KEY production
```

### Ticketmaster Discovery API v2

Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

The `/api/events` route queries:

```
GET https://app.ticketmaster.com/discovery/v2/events.json
  ?apikey=<key>
  &city=San Francisco
  &classificationName=music
  &startDateTime=<today T00:00:00Z>
  &endDateTime=<+6 days T23:59:59Z>
  &size=50
  &sort=date,asc
```

Accepts an optional `?city=` query param to search other cities.

### Deploying to Vercel

Deploys automatically via the nightly GitHub Actions workflow (`.github/workflows/deploy.yml`, runs 11pm PT). Requires GitHub environment secrets `VERCEL_TOKEN` and `NEXT_PUBLIC_MAPBOX_TOKEN` under the `production` environment.

To deploy manually:

```bash
cd web
npx vercel pull --yes --environment=production --token=<VERCEL_TOKEN>
NEXT_PUBLIC_MAPBOX_TOKEN="pk...." npx vercel build --prod --token=<VERCEL_TOKEN>
npx vercel deploy --prebuilt --prod --token=<VERCEL_TOKEN>
```
