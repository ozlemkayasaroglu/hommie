# Hommie

Hommie is a personal home completion checklist designed for a new home. It helps the user track missing items, repairs, official tasks, and home styling details with a warm, playful visual interface.

## 1. Requirements

- Node.js 18+
- A Supabase project
- A Vercel account
- An NVIDIA API key
- Optional Pexels API key

## 2. Clone

```bash
git clone <your-repo-url>
cd hommie
npm install
```

## 3. Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run the SQL in `supabase/schema.sql`.
4. Confirm the `items` table exists.
5. Create a public storage bucket named `photos`.

## 4. Environment variables

Copy `.env.example` to `.env` and fill the values:

```bash
cp .env.example .env
```

Variables:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key only
- `NVIDIA_API_KEY`: for the chat and vision APIs
- `NVIDIA_TEXT_MODEL`: text model name
- `NVIDIA_VISION_MODEL`: vision model name
- `PEXELS_API_KEY`: optional image search key
- `APP_PASSWORD`: optional app password

## 5. Local development

```bash
npm install
npx vercel dev
```

Then open the local Vercel URL shown in the terminal.

## 6. Vercel deployment

1. Import the repo into Vercel.
2. Add all environment variables from `.env.example`.
3. Deploy the project.
4. Confirm `/api/items` loads successfully.

## 7. Security

- The Supabase service role key stays on the server only.
- The browser never calls Supabase directly.
- All image and data operations run through `/api/*`.
- `APP_PASSWORD` is never exposed to the browser and is validated by the API.

## 8. AI

Hommie uses the NVIDIA OpenAI-compatible API at `https://integrate.api.nvidia.com/v1/chat/completions`.

If the model returns 429, the API responds with a user-friendly message and the frontend shows: `Bir dakika sonra tekrar dene.`

## 9. Pexels

The Pexels integration is optional. If no API key is set, the app silently skips external image search and uses the fallback SVG system.

## 10. Troubleshooting

- Check that `vercel dev` is running.
- Confirm `.env` exists and values are populated.
- Make sure the `photos` bucket exists in Supabase.
- If model requests fail, ensure the NVIDIA API key is valid.
- If browser requests fail, check the terminal logs for API error details.

## Security and quality notes

- All user-supplied strings are escaped in the DOM rendering paths.
- The app does not expose service keys to the browser.
- Validation runs on the server before writing to storage or database.
