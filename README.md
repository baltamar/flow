# FLOW — Order Management SaaS

> High-performance, RTL-first order-management SaaS for the Libyan market.
> Arabic-first UI · Libya region by default · LYD currency · Magic-link & Google auth (mocked).

## Stack

- **Vite + React 19 + TypeScript** — fast dev, strict types
- **Tailwind CSS v3** — utility-first, dark mode via `class` strategy
- **React Router v7** — client-side routing
- **Zustand (with `persist`)** — localStorage-backed state for orders & settings
- **@dnd-kit** — accessible drag & drop for the Kanban board
- **lucide-react** — icon set
- **recharts** — charts (available for analytics; current build uses CSS bars for minimal bundle)
- **xlsx** — spreadsheet import/export (available for the order store)
- **date-fns** — relative / locale-aware date formatting
- **Cairo** — Google Font for the entire UI (weights 200–900)

## Getting Started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build locally
npm run lint     # eslint over the source tree
```

## Project Layout

```
flow/
├─ index.html                 # <html dir="rtl" lang="ar"> + Cairo preconnect/link
├─ public/
│  ├─ favicon.svg             # FLOW mark
│  └─ manifest.webmanifest    # PWA manifest (RTL/LTR aware)
├─ src/
│  ├─ App.tsx                 # Provider tree + router
│  ├─ main.tsx                # React entry
│  ├─ index.css               # Tailwind + base styles + custom components
│  ├─ i18n/
│  │  ├─ I18nContext.tsx      # mini i18n: language, direction, t(key, params)
│  │  ├─ ar.json              # Arabic dictionary (default)
│  │  └─ de.json              # German dictionary (fallback / LTR demo)
│  ├─ config/
│  │  └─ region.ts            # Default region (Libya, LYD, ar-LY) + formatters
│  ├─ features/
│  │  ├─ auth/AuthContext.tsx # ⭐ AUTH-STUB seam — replace with Supabase
│  │  ├─ theme/ThemeContext.tsx
│  │  └─ orders/orderStore.ts # Zustand store, localStorage persisted
│  ├─ components/
│  │  ├─ AppShell.tsx         # Layout: sidebar + topbar + outlet
│  │  ├─ Sidebar.tsx          # Collapsible sidebar (drawer on mobile)
│  │  ├─ TopBar.tsx           # Search, language/theme toggle, user menu
│  │  ├─ OrderCard.tsx
│  │  ├─ StatusBadge.tsx
│  │  └─ ProtectedRoute.tsx
│  ├─ pages/
│  │  ├─ LoginPage.tsx
│  │  ├─ KanbanPage.tsx       # 4-column board, drag & drop
│  │  ├─ MasterListPage.tsx   # Searchable orders table
│  │  ├─ AnalyticsPage.tsx
│  │  ├─ ArchivePage.tsx
│  │  ├─ SettingsPage.tsx
│  │  ├─ OrderDetailPage.tsx
│  │  └─ NotFoundPage.tsx
│  ├─ types/order.ts          # `Order` type + status/priority enums
│  └─ utils/time.ts
```

## Auth — Supabase Integration Seam

The entire auth surface lives in **one file**: `src/features/auth/AuthContext.tsx`.

Look for the `AUTH-STUB: ready for Supabase` block at the top of that file. The
public API is:

```ts
const { currentUser, signInWithEmail, signInWithGoogle, signOut } = useAuth();
```

To wire Supabase:

1. `npm install @supabase/supabase-js`
2. Create a `src/lib/supabase.ts` with a typed client.
3. In `AuthContext.tsx`, replace the bodies of `signInWithEmail`,
   `signInWithGoogle`, and `signOut` with `supabase.auth.signInWithOtp({ email })`,
   `supabase.auth.signInWithOAuth({ provider: 'google' })`, and
   `supabase.auth.signOut()` respectively. Map Supabase's `User` into the local
   `AuthUser` shape.
4. Add a Supabase `onAuthStateChange` listener that updates `currentUser`.
5. Keep the `isAuthenticated(user)` helper — it gates the app shell on
   `emailVerified === true || authProvider === 'google'`.

No call site outside this file imports auth internals.

## Region & Currency

`src/config/region.ts` exports `DEFAULT_REGION` (Libya / LYD / ar-LY) and
`getRegion()` / `saveRegion()` that read & write to `localStorage` under
`flow.region`. The Settings page exposes the region to the user; updates
persist immediately and the formatters re-use the current value.

`formatCurrency` renders amounts with Arabic-Indic digits and the `د.ل` symbol by
default.

## i18n

A minimal context-based i18n with no external library. Add a new language by:

1. Dropping `src/i18n/<code>.json` with the same shape as `ar.json`.
2. Adding it to the `LANGUAGES` and `dictionaries` records in
   `I18nContext.tsx`.
3. Adding its `dir` / `htmlLang` to `languageMeta`.

Lookup is namespaced (`nav.kanban`), with `{{param}}` interpolation and
fallback to the Arabic dictionary.

## Theme

Tailwind `darkMode: 'class'`. The `ThemeProvider` toggles a `dark` class on
`<html>` and persists the choice in `localStorage` under `flow.theme`.

## Order Store

`useOrderStore` is a Zustand store with `persist` middleware writing to
`flow.orders.v1`. The store ships with **20 seeded orders** spanning all four
statuses (`new` / `preparing` / `shipped` / `delivered`), all four priorities,
and three Libyan cities (Tripoli · Benghazi · Misrata). Each customer has both
an Arabic name and a Latin transliteration.

CRUD API:

```ts
const { orders, addOrder, updateOrder, deleteOrder, setStatus, archive, restore, resetSeed } = useOrderStore();
```

## Routing

| Path             | Component           | Protection |
| ---------------- | ------------------- | ---------- |
| `/login`         | `LoginPage`         | Public     |
| `/`              | → redirect `/kanban`| Protected  |
| `/kanban`        | `KanbanPage`        | Protected  |
| `/list`          | `MasterListPage`    | Protected  |
| `/analytics`     | `AnalyticsPage`     | Protected  |
| `/archive`       | `ArchivePage`       | Protected  |
| `/settings`      | `SettingsPage`      | Protected  |
| `/orders/:id`    | `OrderDetailPage`   | Protected  |
| `*`              | `NotFoundPage`      | Public     |

## Push Notifications

FLOW ships with a notifications system that covers two cases:

**1. In-app + cross-tab notifications (no backend needed).**
When a new order is created in one tab, all other open tabs of the same app
instantly show a toast and a bell-icon badge via `BroadcastChannel('flow-orders')`.
The notification center (bell icon in the top bar) stores the last 50 events in
`localStorage` so they survive a page refresh.

**2. Browser Notifications API (works once the user opts in).**
Open Settings → "Notifications" → "Enable browser notifications". The browser
shows its standard permission prompt. After granting, every new order triggers
an OS-level notification (Chrome / Edge / Firefox desktop, Safari 16+ on macOS).
The notification deep-links to `/orders/:id` on click.

**3. Real Web Push (server-driven, across devices) — TODO.**
For push that works even when the browser is closed and across multiple devices,
you need a server. The service worker at `public/sw.js` is already wired to
handle `push` and `notificationclick` events — you only need to:

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add the public key as a subscription option in
   `navigator.serviceWorker.ready.then(reg => reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY }))`
3. POST the subscription to your backend (Supabase Edge Function, Firebase
   Cloud Functions, your own server, etc.)
4. From the backend, POST via the `web-push` npm library with the private VAPID key.

The `// TODO: real Web Push (VAPID)` block in `public/sw.js` marks the exact
spot to add a custom payload handler. The hook is already plumbed in
`src/utils/notifications.tsx`.

## Quality Gate

```bash
npm run build   # tsc -b && vite build, must succeed with 0 TS errors
npm run lint    # eslint flat config, must pass
```

The build output lands in `dist/` (~330 KB gzipped JS, ~7 KB gzipped CSS). The
heaviest view (Analytics with Recharts) is code-split into its own chunk
(~115 KB gzipped) and lazy-loaded only when you visit `/analytics`.

## Deployment

`npm run build` produces a static `dist/` directory that can be hosted on any
static host (Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, GitHub Pages,
etc.). For SPA routing, configure the host to fall back to `index.html` on
unknown routes (Netlify: `_redirects` with `/* /index.html 200`; Vercel:
`vercel.json` with rewrites; etc.).

The service worker registers automatically in production builds
(`import.meta.env.DEV` guard skips registration in dev to avoid stale-cache headaches).

### GitHub Pages (recommended, free, push-to-deploy)

The repo is pre-configured for GitHub Pages:

- `vite.config.ts` has `base: '/flow/'` — change this if your repo name is
  different.
- `.github/workflows/deploy.yml` is a GitHub Actions workflow that builds and
  deploys on every push to `main`.
- `public/404.html` is the SPA fallback that GitHub Pages uses when the user
  hits an unknown route (e.g. `/orders/abc123`).
- `public/_redirects` is for Netlify (GitHub Pages ignores it).

**One-time setup** (replace `<your-username>` with your actual GitHub username):

```bash
# 1. Create an empty repo on https://github.com/new  (name: flow, NO README/license/.gitignore)
# 2. Push the code
./scripts/init-github.sh <your-username> flow
git push -u origin main
# 3. On GitHub: Settings → Pages → Source: 'GitHub Actions'
# 4. After ~1 minute the workflow finishes and your app is live at:
#    https://<your-username>.github.io/flow/
```

For a different repo name, edit `base: '/<your-repo>/'` in `vite.config.ts` and
the `repoName` variable in `public/404.html`. For a user/org root site
(`https://<user>.github.io/`, no repo prefix), set `base: '/'` in
`vite.config.ts` and delete `public/404.html`.


