# concert-tracker

CLI tool + interactive EDM event map. CLI uses Ticketmaster; web map uses EDMTrain + Mapbox, hosted on Vercel.

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

Interactive map of EDM events powered by [EDMTrain](https://edmtrain.com) and Mapbox.

Live site: https://concert-tracker-gamma.vercel.app

### Local development

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

The map runs on dummy Bay Area data by default. To use live EDMTrain data, add your API key (see below).

### Adding your EDMTrain API key

Get a key at https://edmtrain.com/dev-api, then add it to Vercel:

```bash
cd concert-tracker/web
echo "your-edmtrain-key" | vercel env add EDMTRAIN_API_KEY production
```

The `/api/events` route automatically switches from dummy data to live EDMTrain events once `EDMTRAIN_API_KEY` is set.

### Deploying to Vercel

```bash
cd concert-tracker/web
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-pk-token" vercel build --prod && vercel deploy --prebuilt --prod
```

> **Note:** `NEXT_PUBLIC_MAPBOX_TOKEN` must be passed at build time so it gets baked into the client bundle. `EDMTRAIN_API_KEY` is server-side only and does not need to be passed here — Vercel injects it at runtime.

### Environment variables

| Variable | Where | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | build-time | Mapbox public token (`pk.*`) |
| `MAPBOX_SECRET_TOKEN` | Vercel (server) | Mapbox secret token (`sk.*`) |
| `EDMTRAIN_API_KEY` | Vercel (server) | EDMTrain client key — leave unset to use dummy data |
