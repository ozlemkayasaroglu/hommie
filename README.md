# Hommie

Hommie is a personal home completion checklist designed for a new home. It helps the user track missing items, repairs, official tasks, and home styling details with a warm, playful visual interface.

The app is deployed on **Netlify only** — Netlify Functions for the API and Netlify Blobs for storage.

## 1. Requirements

- Node.js 20+
- A Netlify account
- An NVIDIA API key (free tier at [build.nvidia.com](https://build.nvidia.com))
- Optional Pexels API key

## 2. Clone

```bash
git clone <your-repo-url>
cd hommie
npm install
```

## 3. Storage

No external database is needed.

- **On Netlify:** data lives in Netlify Blobs (store name `hommie`), which is enabled automatically for linked sites. Keys: `items`, `spaces`, `jobs/<id>`.
- **Locally:** the same data is written to the git-ignored `.data/` directory.

The item list is seeded on first read, so a fresh deploy starts with the default checklist.

## 4. Environment variables

Copy `.env.example` to `.env` and fill the values:

```bash
cp .env.example .env
```

Variables:

- `NVIDIA_API_KEY`: for the chat and vision APIs
- `NVIDIA_TEXT_MODEL`: text model name (default `openai/gpt-oss-20b`)
- `NVIDIA_VISION_MODEL`: vision model name (default `meta/llama-3.2-11b-vision-instruct`)
- `PEXELS_API_KEY`: optional image search key
- `APP_PASSWORD`: optional app password

## 5. Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000. `server.js` serves `public/` and routes `/api/*` to the same handlers Netlify Functions use, and `--env-file-if-exists=.env` loads the environment.

## 6. Netlify deployment

1. Import the repo into Netlify. `netlify.toml` already sets publish dir, functions dir and Node 20.
2. Add the environment variables from `.env.example` under **Site settings → Environment variables**.
3. Deploy. `/api/*` is redirected to `/.netlify/functions/*`.
4. Confirm `/api/items` loads successfully.

## 7. Spaces, members and invites

- A space is created from the onboarding dialog and gets a 6-character invite code.
- Sharing `?davet=CODE` opens the join tab with the code pre-filled.
- Items are scoped to a space through the `x-space-id` / `x-member-id` headers.
- Only the space owner can rename the space or remove members.

## 8. Excel import

`Excel'den ekle` uploads an `.xlsx`/`.xls`/`.csv` file to `/api/import`, which parses it server-side with SheetJS.

- The header row is detected anywhere in the first 15 rows, so title/description rows above the table are fine.
- Recognised columns (Turkish, case-insensitive): `Oda / Alan`, `Kalem` (or Ürün/Ad), `Tür`, `Öncelik`, `Durum`, `Not / Link`.
- Unknown rooms/types/statuses fall back to `Genel` / `Alınacak` / `Yapılmadı`; `1 - Acil` style priorities are reduced to `1`.
- Rows whose name already exists in the space are skipped, so re-importing the same file adds nothing.
- Limits: 4 MB per file, 500 rows per import.

## 9. AI

Hommie uses the NVIDIA OpenAI-compatible API at `https://integrate.api.nvidia.com/v1/chat/completions`.

Photo analysis runs in two stages: a vision model describes the photo in English, then a text model turns that description into Turkish product suggestions as JSON.

Because Netlify's synchronous functions time out after 10 seconds, the analysis runs as a **background function**:

1. The browser posts to `/api/photo-background` with a `jobId` and gets `202` back.
2. The function writes the result to Blobs under `jobs/<jobId>`.
3. The browser polls `/api/photo-status?jobId=...` until the job is `done`.

If the model returns 429, the frontend shows a user-friendly Turkish message.

## 10. Pexels

The Pexels integration is optional. If no API key is set, the app silently skips external image search and uses the fallback SVG system.

## 11. Troubleshooting

- Check that `npm run dev` is running (local) or the deploy finished (Netlify).
- Confirm `.env` exists locally and the same variables are set in the Netlify UI.
- If suggestions fall back to the sample list, the toast shows the reason (missing key, model error, timeout).
- If model requests fail, ensure the NVIDIA API key is valid and the model names still exist in the NVIDIA catalog.

## Security and quality notes

- All user-supplied strings are escaped in the DOM rendering paths.
- The app does not expose API keys to the browser; every model call runs server-side.
- Validation runs on the server before writing to storage.
- `APP_PASSWORD` is never exposed to the browser and is validated by the API.
