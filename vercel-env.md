# Adding Environment Variables to Vercel

## Option 1 — Dashboard (easiest)

1. Go to [vercel.com/vishalgattanis-projects/concert-tracker/settings/environment-variables](https://vercel.com/vishalgattanis-projects/concert-tracker/settings/environment-variables)
2. Click **Add New**
3. Fill in:
   - **Key** — e.g. `SETLISTFM_API_KEY`
   - **Value** — paste the key
   - **Environments** — check **Production** (and Preview if you want it in preview deploys)
   - Leave **Sensitive** checked (hides the value after saving)
4. Click **Save**
5. Trigger a redeploy — either push a commit to `develop`, or go to **Deployments → ⋯ → Redeploy**

> `NEXT_PUBLIC_*` variables are baked in at build time. Any change to them requires a redeploy to take effect.

---

## Option 2 — CLI

```bash
cd /Users/vishal.gattani/my-brain-in-logseq/projects/github/concert-tracker/web

# Add to production only
echo "your-key-value" | npx vercel env add SETLISTFM_API_KEY production

# Add to both production and preview
echo "your-key-value" | npx vercel env add SETLISTFM_API_KEY production
echo "your-key-value" | npx vercel env add SETLISTFM_API_KEY preview

# Verify it's there
npx vercel env ls
```

Then redeploy:
```bash
npx vercel --prod --yes --token=<your-token>
```
Or just push a commit — the GitHub Actions workflow deploys automatically.

---

## Keys this project uses

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Web (build-time) | Public token — safe to expose, must be present at `next build` |
| `EDMTRAIN_API_KEY` | Web (server-only) | EDMTrain API |
| `TICKETMASTER_API_KEY` | Web (server-only) | Ticketmaster Discovery v2 |
| `SETLISTFM_API_KEY` | Web (server-only) | Setlist.fm API (add this next) |
| `TICKETMASTER_API_KEY` | CLI (`main.py`) | Only needed locally in root `.env` |

### Local dev
All keys live in `web/.env.local` (gitignored). Copy from `.env.example` if starting fresh:
```bash
cp web/.env.example web/.env.local
# then fill in values
```

---

## After adding a new server-side key

1. Add it to `web/.env.local` for local dev
2. Add it to Vercel dashboard under **Production** (and Preview if needed)
3. Update the table above
4. Push a commit or manually redeploy — the GitHub Actions workflow at `.github/workflows/deploy.yml` handles production deploys on every push to `develop`
