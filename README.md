# Trend Detective (Frontend)

Web frontend for the NASA Earth System challenge *"Be An Earth System Trend Detective!"*. Click any coordinate on Earth to query ~45 years of NASA POWER (MERRA-2) monthly climate reanalysis and display significance-tested temperature and precipitation trends, change points, and co-movement statistics from the backend API.

## Development

```bash
npm install
npm run dev
```

Create a `.env` file from `.env.example` and configure your backend URL:

```env
VITE_API_BASE_URL=https://trend-detective-api.vercel.app
VITE_USE_FIXTURES=false
```

## Production Build

```bash
npm run build
```

## Deploy on Vercel

1. Push this repository to GitHub/GitLab and import it into Vercel (Vite preset, build command `npm run build`, output directory `dist`).
2. Set `VITE_API_BASE_URL` in Vercel project settings to your deployed backend URL.
3. Single-page app routing fallback is configured in `vercel.json`.
