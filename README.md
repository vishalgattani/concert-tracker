# concert-tracker

CLI tool + interactive music event map. CLI uses Ticketmaster; web map combines Ticketmaster Discovery API v2 + EDMTrain + Mapbox, hosted on Vercel.

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

Interactive map of music events for the next 7 days, combining [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) (all genres) and [EDMTrain](https://edmtrain.com) (electronic). EDMTrain events take priority at overlapping venues.

Live site: https://concert-tracker-gamma.vercel.app

### Local development

```bash
cd web
cp .env.example .env.local
# Fill in your keys (see Environment Variables below)
npm install
npm run dev   # http://localhost:3000
```

### Environment variables

| Variable | Where set | Description |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | build-time | Mapbox public token (`pk.*`) |
| `TICKETMASTER_API_KEY` | server (runtime) | Ticketmaster Discovery API consumer key |
| `EDMTRAIN_API_KEY` | server (runtime) | EDMTrain client key |

For local dev add to `web/.env.local`. For Vercel, add under **Settings → Environment Variables** (Production + Preview).

### First-time Vercel setup

1. Install Vercel CLI: `npm i -g vercel`
2. Link the project: `cd web && vercel link`
3. In the [Vercel dashboard](https://vercel.com) → concert-tracker → **Settings → General → Root Directory** → set to `web` → Save
4. Under **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_MAPBOX_TOKEN` — your `pk.*` Mapbox token (Production + Preview)
   - `TICKETMASTER_API_KEY` — Ticketmaster consumer key (Production + Preview)
   - `EDMTRAIN_API_KEY` — EDMTrain client key (Production + Preview)
5. Under **Settings → Git** → ensure the GitHub repo is connected

### Deployment

Deploys automatically via GitHub Actions nightly at 11pm PT (`.github/workflows/deploy.yml`). Also triggers on `workflow_dispatch`.

Requires GitHub **environment secrets** (Settings → Secrets → Environments → production):
- `VERCEL_TOKEN` — Vercel personal access token (vercel.com → Account Settings → Tokens)
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox public token (needed at build time in CI)

To deploy manually:
```bash
gh workflow run deploy.yml --repo vishalgattani/concert-tracker
```

### Ticketmaster Discovery API v2

Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/

The `/api/events` route queries:
```
GET https://app.ticketmaster.com/discovery/v2/events.json
  ?apikey=<key>&city=San Francisco&classificationName=music
  &startDateTime=<today T00:00:00Z>&endDateTime=<+6d T23:59:59Z>
  &size=50&sort=date,asc
```

Accepts an optional `?city=` query param to search other cities.
