# HOMMIE --- Master Build Prompt for Claude Code

You are the lead full-stack engineer responsible for building the entire
**Hommie** application from scratch.

Your job is to implement the application completely, verify it locally,
run automated tests, use Playwright to inspect the real UI on desktop
and mobile, fix every issue you find, and leave the repository in a
deployable state.

**Do not stop at scaffolding. Do not give me a tutorial instead of
implementing the code. Do not ask me to manually complete implementation
steps. Work through the project step by step and validate each step.**

The final application must be production-ready for Vercel + Supabase.

------------------------------------------------------------------------

# 0. PRODUCT NAME

The product name is:

**Hommie**

Use `Hommie` consistently throughout the UI, metadata, README, page
title, empty states, login screen, and application copy.

Suggested tagline:

**Make your place feel like home.**

The UI language is **Turkish**.

Code, variable names, database columns, API contracts, comments, and
README technical documentation may be English.

------------------------------------------------------------------------

# 1. IMPORTANT USER CONTEXT

This is a personal home-completion application.

The user has recently moved into a new home and wants to track
everything that is missing, needs to be purchased, repaired, completed,
or handled officially.

The application is primarily used by one person.

The user will periodically upload photos of rooms. AI should inspect
those photos and suggest missing things.

The home should feel:

-   warm
-   creative
-   artistic
-   plant-heavy
-   stylish
-   personal
-   cheerful
-   modern

When analyzing room photos, AI should pay particular attention to:

-   plants
-   large indoor trees
-   decorative plants
-   pots and planters
-   artwork
-   paintings
-   wall art
-   sculptures
-   mirrors
-   decorative shelves
-   lighting
-   rugs
-   curtains
-   storage
-   coffee/tea corners
-   cozy details
-   practical missing household items

Do not limit AI suggestions to boring necessities.

The user already has an Excel file containing an existing home
checklist.

The Excel file is:

`Yeni_Ev_Planlama.xlsx`

If it exists in the repository or workspace, inspect it before
generating seed data.

Do not invent a completely unrelated seed list.

Preserve the useful existing items from the Excel file.

------------------------------------------------------------------------

# 2. WORKING RULE: ONE COMPLETE IMPLEMENTATION

Treat this document as the complete engineering specification.

Do not ask questions unless a technical impossibility prevents
implementation.

When something is ambiguous, choose the simplest robust implementation
consistent with this specification.

Do not replace requested technologies with a framework just because it
is easier.

Do not add unnecessary dependencies.

Do not introduce React, Vue, Next.js, TypeScript build pipelines,
Tailwind, Vite, Webpack, or another frontend build system.

The frontend must remain:

**plain HTML + CSS + vanilla JavaScript ES modules.**

------------------------------------------------------------------------

# 3. REQUIRED TECHNOLOGY

## Frontend

-   plain HTML
-   CSS
-   vanilla JavaScript
-   ES modules
-   no frontend build step
-   directory: `public/`

## Backend

Vercel Serverless Functions.

-   Node.js
-   ESM
-   directory: `api/`

## Database

Supabase:

-   PostgreSQL
-   Supabase Storage

Important security rule:

**The browser must NEVER connect directly to Supabase.**

All database and storage operations must go through `/api/*`.

The Supabase service key must only exist on the server.

Never expose it to frontend JavaScript.

## Hosting

Vercel.

## AI

NVIDIA build.nvidia.com OpenAI-compatible API.

Endpoint:

`https://integrate.api.nvidia.com/v1/chat/completions`

Authentication:

`Authorization: Bearer ${NVIDIA_API_KEY}`

Default text model:

`meta/llama-3.3-70b-instruct`

Default vision model:

`meta/llama-3.2-90b-vision-instruct`

Model names must be configurable through environment variables.

## Images

Pexels API.

Environment variable:

`PEXELS_API_KEY`

If `PEXELS_API_KEY` is missing:

-   silently skip external image retrieval
-   do not break the application
-   use the fallback SVG icon system

------------------------------------------------------------------------

# 4. ENVIRONMENT VARIABLES

Create:

`.env.example`

Required variables:

``` env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

NVIDIA_API_KEY=
NVIDIA_TEXT_MODEL=meta/llama-3.3-70b-instruct
NVIDIA_VISION_MODEL=meta/llama-3.2-90b-vision-instruct

PEXELS_API_KEY=

APP_PASSWORD=
```

Behavior:

### APP_PASSWORD

If empty:

-   application is accessible without password.

If set:

-   client sends `x-app-password` on API requests.
-   server validates it.
-   invalid password returns HTTP 401.
-   frontend opens password dialog.
-   password is stored in `localStorage` after successful
    authentication.

Never store the password in Supabase.

Never expose `APP_PASSWORD` itself to the browser.

------------------------------------------------------------------------

# 5. DATABASE MODEL

Create:

`supabase/schema.sql`

Table:

`items`

Columns:

``` text
id uuid
name text
room text
type text
priority integer
status text
note text
price jsonb
image_url text
image_path text
image_credit text
image_tried boolean
created_at timestamptz
```

Price JSON:

``` json
{
  "range": "₺5.000 – ₺8.000",
  "tip": "Orta boy, kolay temizlenen bir model tercih et",
  "when": "2026-10-04"
}
```

Do NOT add:

-   responsible person
-   budget field
-   due date field

These are explicitly not part of the product.

------------------------------------------------------------------------

# 6. ENUM-LIKE VALIDATION

Allowed rooms:

``` text
Genel
Salon
Mutfak
Yatak Odası
Banyo
Balkon
Antre
```

Allowed types:

``` text
Alınacak
Yapılacak
Tamir
Resmi iş
```

Allowed priorities:

``` text
1 = Acil
2 = Önemli
3 = Sonra
```

Allowed statuses:

``` text
Yapılmadı
Araştırılıyor
Sipariş verildi
Tamam
```

All validation must happen on the server.

Never trust frontend validation alone.

Reject unknown fields where appropriate.

------------------------------------------------------------------------

# 7. SUPABASE STORAGE

Create a public bucket:

`photos`

The bucket is public for serving user-uploaded card images.

However:

-   uploads happen only through `/api/upload`
-   frontend never receives the Supabase service role key
-   old image must be deleted when replaced
-   uploaded files must be validated
-   maximum original upload size: 3 MB

------------------------------------------------------------------------

# 8. API

Implement these endpoints.

## GET `/api/items`

Return all items.

Support sensible sorting.

Recommended ordering:

1.  incomplete before completed
2.  priority ascending
3.  created_at ascending

------------------------------------------------------------------------

## POST `/api/items`

Create an item.

Validate:

-   name
-   room
-   type
-   priority
-   status
-   note

Server must reject invalid enum values.

------------------------------------------------------------------------

## PATCH `/api/items?id=...`

Update an item.

Only allow known editable fields.

Validate every field.

Do not allow clients to overwrite:

-   id
-   created_at
-   image_path arbitrarily
-   system fields

------------------------------------------------------------------------

## DELETE `/api/items?id=...`

Delete item.

If item has an uploaded storage image, delete it as well.

------------------------------------------------------------------------

# 9. AI ENDPOINT

Implement:

`POST /api/ai`

Supported tasks:

## task = "price"

Input:

-   array of item IDs

For every eligible item:

-   generate a realistic Turkish TL price range
-   generate an advice string
-   maximum 12 words for the advice
-   do not pretend this is a live price
-   explicitly frame it as an AI estimate

Return / persist:

``` json
[
  {
    "id": "uuid",
    "range": "₺...",
    "tip": "...",
    "when": "YYYY-MM-DD"
  }
]
```

Only process items that are not `Resmi iş`.

Persist results into `items.price`.

Use tolerant JSON parsing.

The model may return:

``` text
```json
[ ... ]
```


    or extra text.

    Implement a robust parser that can extract the first valid JSON array from the response.

    If NVIDIA returns 429:

    return a meaningful HTTP response that the frontend converts to:

    **"Bir dakika sonra tekrar dene."**

    Do not expose raw provider errors to the user.

    ---

    # 10. AI PHOTO ANALYSIS

    Same endpoint:

    `POST /api/ai`

    Use:

    `task = "photo"`

    Input:

    - selected room
    - existing item names
    - one or more compressed images

    Images must be sent to the vision model using:

    ```json
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,..."
      }
    }

Images must be resized client-side before sending.

Maximum width/height:

**768 px**

The analysis photos are NOT saved.

The AI should identify useful missing items.

Important:

The AI must consider the existing checklist and avoid recommending
things that are already listed unless there is a clear reason.

It should especially consider:

-   plants
-   indoor trees
-   planters
-   wall art
-   paintings
-   decorative objects
-   mirrors
-   rugs
-   curtains
-   shelving
-   lighting
-   storage
-   functional household items
-   cozy details

Return a JSON array.

Example:

``` json
[
  {
    "name": "Büyük salon bitkisi",
    "room": "Salon",
    "type": "Alınacak",
    "priority": 3,
    "reason": "Boş köşe için büyük bir bitki alanı tamamlar."
  }
]
```

Use tolerant JSON parsing.

Strip markdown JSON fences.

Ignore leading/trailing prose.

If no valid JSON can be recovered, return a clean error instead of
crashing.

------------------------------------------------------------------------

# 11. PEXELS IMAGE ENDPOINT

Implement:

`POST /api/image`

Input:

-   item id
-   item name

Search Pexels.

Use the first suitable result.

Save:

-   `image_url`
-   `image_credit`

Set:

`image_tried = true`

Every item should only attempt automatic Pexels lookup once.

If Pexels is unavailable or API key is missing:

-   do not break
-   set `image_tried = true` where appropriate
-   frontend uses SVG fallback

Never repeatedly request the same item every render.

------------------------------------------------------------------------

# 12. USER PHOTO UPLOAD

Implement:

`POST /api/upload`

Input:

-   item id
-   dataURL

Rules:

-   maximum 3 MB
-   validate image type
-   upload to Supabase Storage
-   delete previous user image if present
-   save new `image_path`
-   save public `image_url`

Never trust MIME type alone.

Reject malformed data URLs.

------------------------------------------------------------------------

# 13. OFFICIAL BUSINESS RULE

Items with:

`type = "Resmi iş"`

must NOT show:

-   Pexels image
-   AI price estimate
-   Akakçe link
-   Trendyol link
-   Hepsiburada link

They should show only:

-   title
-   room
-   priority
-   status
-   note

Examples:

-   Elektrik abonelik devri
-   Su abonelik devri
-   Doğalgaz abonelik devri
-   İnternet aboneliği
-   e-Devlet adres değişikliği
-   Banka adres güncellemesi

------------------------------------------------------------------------

# 14. NORMAL ITEM CARD

For normal cards:

The image must be displayed directly inside the card.

Do NOT show a plain external image URL.

If Pexels image exists:

display it.

If user uploaded image exists:

prefer the user image.

If no image exists:

display a hand-drawn/friendly SVG icon.

Create an icon resolver using keyword matching.

At minimum support concepts such as:

-   broom
-   vacuum
-   iron
-   coffee machine
-   kettle
-   toaster
-   blender
-   light bulb
-   curtain
-   towel
-   rug
-   plant
-   tree
-   pot
-   key
-   toolbox
-   shelf
-   television
-   bed
-   pillow
-   cookware
-   storage container
-   hanger
-   shoe rack
-   first aid
-   trash bin

The fallback SVG icons should match the colorful neo-brutalist visual
language.

------------------------------------------------------------------------

# 15. SHOPPING BUTTONS

Normal items may show small buttons:

-   `Fiyat tahmini`
-   `Akakçe`
-   `Trendyol`
-   `Hepsiburada`

These are search links based on the item name.

Do NOT scrape prices.

Do NOT claim live pricing.

Price estimates are AI estimates only.

Every estimated price should include:

**"Bu bir AI tahminidir. Güncel fiyat için mağazalara bak."**

------------------------------------------------------------------------

# 16. BULK PRICE BUTTON

At the top:

**"Fiyatı olmayanları tahmin et"**

When clicked:

-   find eligible items without a price
-   exclude `Resmi iş`
-   send IDs to `/api/ai`
-   show progress
-   update cards
-   handle 429 gracefully

Do not fire unlimited parallel AI requests.

Respect the provider rate limit.

------------------------------------------------------------------------

# 17. PHOTO TAB

Create a dedicated photo-analysis tab.

Flow:

1.  User selects a room.
2.  User uploads up to 3 photos.
3.  Browser compresses each image using `<canvas>`.
4.  Maximum output dimension: 768 px.
5.  Images are converted to JPEG data URLs.
6.  Images are sent to `/api/ai`.
7.  AI analyzes the room.
8.  Suggested missing items appear.
9.  User selects suggestions using checkboxes.
10. One button adds selected suggestions to the checklist.

Important:

The uploaded analysis photos must NOT be stored.

------------------------------------------------------------------------

# 18. AUTO REFRESH / TWO-DEVICE SAFETY

The original concept supports more than one person using the list.

Refresh the item list every:

**8 seconds**

BUT:

Do NOT refresh while:

-   user is typing in a note
-   an input has focus
-   a modal is open
-   an API mutation is running
-   photo analysis is running
-   an item is being edited

After the interaction ends, resume polling.

Avoid destroying unsaved DOM state.

------------------------------------------------------------------------

# 19. PROGRESS

At the top display:

-   total items
-   completed items
-   remaining items
-   percentage

Example:

**18 / 37 tamamlandı**

Use a visual progress bar.

The progress bar fill must have a giraffe-spot pattern.

------------------------------------------------------------------------

# 20. FILTERS

Provide room filter pills.

Rooms:

-   Genel
-   Salon
-   Mutfak
-   Yatak Odası
-   Banyo
-   Balkon
-   Antre

Each room pill must display remaining incomplete count.

Also provide:

-   status filter
-   priority filter
-   sorting

Recommended sorting options:

-   Öncelik
-   En yeni
-   En eski
-   Tamamlanma durumu

------------------------------------------------------------------------

# 21. DESIGN SYSTEM

The current design must NOT look boring, corporate, gray, or generic.

Use a bold colorful neo-brutalist style.

Primary palette:

``` css
--navy: #1B1A3A;
--yellow: #FFC93C;
--orange: #FF8A3D;
--pink: #FF5FA2;
--green: #2BB673;
--cyan: #26B5E8;
--purple: #8B5CF6;
--lime: #A3D133;
--background: #EAF2FF;
```

Cards:

-   thick dark navy border
-   approximately 4--5 px border
-   hard shadow: `5px 5px 0 #1B1A3A`
-   rounded but not overly soft
-   strong typography
-   colorful badges
-   playful micro-interactions

Avoid:

-   glassmorphism
-   excessive gradients
-   generic SaaS dashboard appearance
-   tiny unreadable text
-   weak contrast

------------------------------------------------------------------------

# 22. ROOM COLORS

Use:

``` text
Genel       -> purple
Salon       -> orange
Mutfak      -> green
Yatak Odası -> pink
Banyo       -> cyan
Balkon      -> lime
Antre       -> yellow
```

The image area of each card should use the room color.

------------------------------------------------------------------------

# 23. TYPOGRAPHY

Use:

-   `Baloo 2` for headings
-   `Nunito` for body text

Load them efficiently.

Provide sensible system fallbacks.

------------------------------------------------------------------------

# 24. BILGE CHARACTER

The application mascot is:

**Bilge**

Bilge is a friendly giraffe.

Bilge has:

-   glasses
-   bow tie
-   a small checklist in hand

Bilge should be implemented as a hand-drawn SVG.

Do NOT use a remote image.

The SVG should be inline or local.

The giraffe should have subtle animation.

Animation:

-   gentle rocking/swaying

Respect:

``` css
@media (prefers-reduced-motion: reduce)
```

and disable unnecessary motion.

------------------------------------------------------------------------

# 25. HERO

At the top:

Large yellow hero section.

Bilge appears next to a speech bubble.

The speech bubble changes based on state.

Examples:

When empty:

**"Ev bomboş olabilir ama merak etme, birlikte güzelleştireceğiz!"**

When many tasks remain:

**"Bugün birkaç işi halledersek evimiz hızla toparlanır!"**

When urgent tasks exist:

**"Önce acil işlere bakalım. Ben listeyi tuttum!"**

When an item is completed:

**"Yaşasın! Bir iş daha tamamlandı! 🦒✨"**

When filtered to a room:

**"Salon modundayız! Bakalım burada neler eksik?"**

When everything is complete:

**"Tebrikler! Artık burası gerçekten ev olmuş. 🦒🏡"**

The message must be generated deterministically from application state.

Do not call AI for mascot messages.

------------------------------------------------------------------------

# 26. PASSWORD DIALOG

If `APP_PASSWORD` is configured and API returns 401:

Open a friendly password dialog.

Show Bilge inside the dialog.

Turkish copy.

Example:

**"Hommie'ye hoş geldin!"**

**"Bu evin listesi biraz özel. Şifreyi gir bakalım."**

Provide:

-   password input
-   submit
-   error state
-   keyboard accessibility

After successful authentication:

store password in localStorage.

------------------------------------------------------------------------

# 27. RESPONSIVE DESIGN

Desktop:

-   multi-column cards
-   comfortable spacing
-   hero prominent

Tablet:

-   adaptive grid

Mobile:

-   one column
-   full-width cards
-   safe-area padding
-   sticky/friendly controls where useful
-   touch targets at least approximately 44px
-   keyboard focus must remain visible
-   dialogs must fit small screens
-   horizontal filter scrolling is acceptable

Test at least:

-   1440x900
-   1280x800
-   390x844
-   375x812

------------------------------------------------------------------------

# 28. ACCESSIBILITY

Implement:

-   semantic HTML
-   labels
-   keyboard navigation
-   visible focus rings
-   `aria-label` where needed
-   buttons must have meaningful accessible names
-   dialogs should trap focus appropriately
-   escape closes dialogs where appropriate
-   sufficient contrast

------------------------------------------------------------------------

# 29. INITIAL DATA

Create approximately 37 seed items in `schema.sql`.

The seed data must include the existing Excel checklist.

At minimum, ensure the final seed set covers categories such as:

-   electricity subscription transfer
-   water subscription transfer
-   natural gas subscription transfer
-   internet subscription
-   e-Devlet address update
-   bank address updates where applicable
-   lock replacement
-   light bulbs
-   cleaning supplies
-   trash bin
-   first aid kit
-   toolbox
-   extension cable
-   curtains
-   shelving / TV unit
-   rug
-   artwork
-   cookware set
-   food storage containers
-   shower curtain
-   bathroom mat
-   coat rack
-   shoe rack
-   door mat
-   vacuum cleaner
-   iron
-   ironing board
-   drying rack
-   hair dryer
-   coffee machine
-   kettle
-   toaster
-   blender
-   bedside lamp
-   duvet / pillow
-   plants / planters

However, if the Excel file contains different or more appropriate items,
preserve those instead of blindly replacing them.

Include artistic and plant-oriented items as normal `Alınacak` items.

------------------------------------------------------------------------

# 30. EXCEL INSPECTION

Before writing the seed list:

1.  Locate `Yeni_Ev_Planlama.xlsx`.
2.  Read all relevant sheets.
3.  Inspect headers.
4.  Extract useful existing items.
5.  Normalize them into the `items` schema.
6.  Avoid duplicate entries.
7.  Preserve meaningful room/category information where available.
8.  Add missing mandatory categories only where needed.

Do not simply ignore the Excel file.

------------------------------------------------------------------------

# 31. PROJECT STRUCTURE

Use approximately:

``` text
hommie/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── api-client.js
│   ├── state.js
│   ├── ui.js
│   ├── icons.js
│   ├── bilge.js
│   └── assets/
│
├── api/
│   ├── items.js
│   ├── ai.js
│   ├── image.js
│   ├── upload.js
│   └── _lib/
│       ├── auth.js
│       ├── supabase.js
│       ├── validation.js
│       ├── ai.js
│       └── json.js
│
├── supabase/
│   └── schema.sql
│
├── tests/
│
├── screenshots/
│
├── .env.example
├── .gitignore
├── vercel.json
├── package.json
└── README.md
```

You may change the exact file split if there is a strong technical
reason, but preserve the architecture.

------------------------------------------------------------------------

# 32. VERCEL CONFIGURATION

Create `vercel.json`.

The AI function must have:

``` json
{
  "maxDuration": 60
}
```

Use correct Vercel configuration for Node serverless functions.

Do not create unnecessary build steps.

------------------------------------------------------------------------

# 33. README

Create a complete English `README.md`.

It must explain step by step:

## 1. Requirements

-   Node.js
-   Supabase account
-   Vercel account
-   NVIDIA API key
-   optional Pexels API key

## 2. Clone

Show commands.

## 3. Supabase

Explain:

-   create project
-   open SQL Editor
-   run `supabase/schema.sql`
-   verify `items`
-   verify `photos` bucket

## 4. Environment variables

Explain every variable.

## 5. Local development

Show:

``` bash
npm install
vercel dev
```

Explain local URL.

## 6. Vercel deployment

Explain:

-   import repository
-   configure environment variables
-   deploy

## 7. Security

Explain:

-   service key remains server-side
-   browser never connects to Supabase directly
-   APP_PASSWORD behavior

## 8. AI

Explain NVIDIA models and 429 behavior.

## 9. Pexels

Explain optional behavior.

## 10. Troubleshooting

Include common issues.

------------------------------------------------------------------------

# 34. ERROR HANDLING

Never let an API error crash the UI.

Every API should return predictable JSON.

Example:

``` json
{
  "ok": false,
  "error": "..."
}
```

Frontend must show friendly Turkish messages.

Never display stack traces to the user.

Log useful diagnostic information server-side without logging secrets.

Never log:

-   Supabase service key
-   NVIDIA API key
-   APP_PASSWORD
-   uploaded private image contents

------------------------------------------------------------------------

# 35. SECURITY AUDIT

Before finishing, inspect the complete repository for:

-   leaked secrets
-   service role key in frontend
-   API keys in JS
-   unsafe HTML insertion
-   arbitrary SQL
-   unvalidated IDs
-   path traversal
-   unrestricted upload
-   oversized request bodies
-   malformed data URLs
-   prototype pollution risks
-   unsafe external URLs
-   XSS through item names or notes

Use safe DOM APIs or properly escaped HTML.

User-provided notes and names must never execute as HTML/JS.

------------------------------------------------------------------------

# 36. FRONTEND ARCHITECTURE

Keep state centralized.

At minimum maintain:

``` js
items
activeRoom
statusFilter
priorityFilter
sort
isLoading
isMutating
isPhotoAnalyzing
isModalOpen
```

Rendering should be predictable.

Avoid duplicated event listeners.

Use event delegation where useful.

Avoid full-page reloads.

------------------------------------------------------------------------

# 37. UX DETAILS

Adding an item should feel instant.

After mutation:

-   update local UI optimistically where safe
-   reconcile with server response

Status changes should be easy.

Each card should clearly communicate:

-   item name
-   room
-   type
-   priority
-   status
-   note
-   image
-   price estimate where applicable
-   shopping links where applicable

Keep secondary actions visually smaller.

------------------------------------------------------------------------

# 38. IMAGE PRIORITY

For normal items:

1.  user-uploaded image
2.  Pexels image
3.  SVG fallback icon

Do not show broken image icons.

If an image fails to load:

automatically fall back to the SVG icon.

------------------------------------------------------------------------

# 39. AI PROMPT ENGINEERING

Do not send vague prompts.

The price prompt must force strict JSON.

The photo prompt must:

-   understand Turkish
-   return Turkish item names
-   consider the room
-   compare against existing items
-   avoid duplicates
-   identify both functional and aesthetic omissions
-   prioritize useful additions
-   include plants/art/decor when visually appropriate
-   return only JSON

Use low temperature or equivalent deterministic settings when possible.

------------------------------------------------------------------------

# 40. TOLERANT JSON PARSER

Create a reusable parser.

It must handle:

``` text
plain JSON
```

``` text
```json
JSON
```


    and:

    ```text
    Here is the JSON:
    [...]

Extract the first balanced valid JSON object/array.

Do not use unsafe `eval`.

Use `JSON.parse`.

Write tests for the parser.

------------------------------------------------------------------------

# 41. TESTING REQUIREMENTS

Do not declare the project finished without testing.

At minimum:

## Unit-level checks

Test:

-   validation
-   JSON parser
-   official-business detection
-   room colors
-   icon resolver
-   price formatting
-   search URL generation

## API checks

Test:

-   GET items
-   POST item validation
-   PATCH validation
-   DELETE
-   unauthorized request behavior
-   malformed input behavior

If Supabase credentials are unavailable locally, create a clean test
strategy that mocks the provider without compromising production code.

------------------------------------------------------------------------

# 42. PLAYWRIGHT

Use Playwright.

If Playwright is not installed:

install the minimum required development dependency.

Run the application locally.

Test:

### Desktop

`1440x900`

Verify:

-   hero
-   Bilge
-   filters
-   progress
-   cards
-   dialogs
-   no horizontal overflow

### Mobile

`390x844`

Verify:

-   one-column layout
-   no horizontal page overflow
-   readable cards
-   usable buttons
-   modal fits viewport
-   filter controls remain usable

Take screenshots:

``` text
screenshots/desktop.png
screenshots/mobile.png
```

Inspect the screenshots.

Do not just generate them and assume success.

If visual problems exist:

fix the CSS and rerun Playwright.

------------------------------------------------------------------------

# 43. BROWSER CONSOLE

During Playwright testing:

-   collect console errors
-   collect page errors
-   collect failed network requests

Fix all application-generated errors.

A failed optional Pexels request should not make the UI fail.

------------------------------------------------------------------------

# 44. FINAL QA LOOP

Before saying the task is complete, perform this exact sequence:

### Step 1

Inspect repository.

### Step 2

Inspect Excel.

### Step 3

Create architecture.

### Step 4

Implement database schema.

### Step 5

Implement server utilities.

### Step 6

Implement API endpoints.

### Step 7

Implement frontend.

### Step 8

Implement Bilge and SVG icons.

### Step 9

Implement AI.

### Step 10

Implement image handling.

### Step 11

Implement responsive CSS.

### Step 12

Run syntax checks.

### Step 13

Run tests.

### Step 14

Run the local application.

### Step 15

Run Playwright desktop.

### Step 16

Run Playwright mobile.

### Step 17

Inspect screenshots.

### Step 18

Fix all discovered issues.

### Step 19

Run tests again.

### Step 20

Perform security audit.

### Step 21

Perform final repository audit.

Only after all of these succeed should you report completion.

------------------------------------------------------------------------

# 45. ZERO-REGRESSION RULE

When fixing one issue:

Do not break another feature.

After meaningful changes, rerun relevant tests.

Before final completion verify:

-   item CRUD works
-   filters work
-   progress works
-   official items stay restricted
-   Pexels fallback works
-   user upload works
-   price AI flow works
-   photo AI flow works
-   429 handling works
-   password flow works
-   polling pauses correctly
-   responsive UI works
-   no frontend Supabase access exists
-   no secrets are committed
-   README is complete

------------------------------------------------------------------------

# 46. DO NOT FAKE FUNCTIONALITY

Do not create fake API responses pretending that NVIDIA or Supabase is
working.

Do not hard-code fake successful database writes.

Do not make buttons that merely show alerts instead of implementing the
requested behavior.

If external credentials are unavailable during local verification, mock
only the external dependency in tests while keeping production
implementation real.

------------------------------------------------------------------------

# 47. FINAL OUTPUT

When everything is complete, provide a concise final report containing:

1.  What was built.
2.  Files created/changed.
3.  Tests executed.
4.  Playwright viewport results.
5.  Any remaining environment-dependent limitations.
6.  Exact commands to run locally.
7.  Exact Vercel deployment steps.

Do NOT claim "zero errors" unless you actually ran the relevant checks.

If something cannot be verified because credentials are missing, clearly
identify it.

------------------------------------------------------------------------

# 48. IMPORTANT CODING STYLE

Prefer:

-   simple
-   readable
-   maintainable
-   defensive
-   modular
-   explicit

Avoid:

-   over-engineering
-   unnecessary frameworks
-   unnecessary dependencies
-   huge single files
-   duplicated logic
-   magic constants scattered everywhere

Centralize constants.

Use meaningful function names.

Use async/await.

Handle all expected errors.

------------------------------------------------------------------------

# 49. START NOW

Start by inspecting the repository and the Excel file.

Then implement the project in the exact sequence described above.

Do not stop after planning.

Do not ask me to approve intermediate steps.

Do not wait for confirmation.

Build it.

Test it.

Run Playwright.

Inspect the screenshots.

Fix what you find.

Run the checks again.

Leave the repository ready for:

``` bash
npm install
vercel dev
```

and deployment to Vercel.

The final application must be called:

# HOMMIE

with the tagline:

# Make your place feel like home.
