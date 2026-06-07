# FLOW — Final Deliverable

> **VERDICT: COMPLETE** — feature-complete RTL/Arabic order-management SaaS,
> ready to share with your team.

## What you can do with FLOW

| View          | Capabilities                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| **Kanban**    | 4-column Arabic board, accordion order cards, drag & drop between columns, WhatsApp button per card, edit + archive inline, mobile horizontal snap-scroll, floating + button. |
| **Master List** | High-density table, sortable (date / priority / customer / total), multi-filter (status / priority / city / date range), debounced search, **bulk actions**: Mark Shipped · Archive · **Export .xlsx**. |
| **Analytics** | 4 KPIs (orders, revenue, avg, % delivered) + donut (status) + area (30-day revenue) + horizontal bar (top 10 products) + bar (revenue by city). Lazy-loaded. |
| **Order Drawer** | Right-side RTL drawer: edit customer / city, add/remove items with auto-total, notes, **attachments** (drag-drop, max 5 files @ 2MB, image thumbnails, base64 stored on order), status, priority, save/cancel, WhatsApp shortcut. |
| **Archive**   | Read-only table of archived orders with Restore action. |
| **Settings**  | Language (AR/DE), theme (light/dark), region (Libya/LYD/locale), **Enable browser notifications** (with permission flow), **Reset demo data**, "Auth: ready for Supabase" stub panel. |
| **Notifications** | Bell icon in top bar with unread badge + dropdown. Cross-tab sync via `BroadcastChannel('flow-orders')`. OS-level `Notification` after user opts in. Service worker ready for real Web Push (VAPID TODO marker). |

## Tech stack
- **Vite + React 19 + TypeScript** (strict, builds clean)
- **Tailwind CSS v3** with Cairo font, dark mode, RTL-first
- **React Router v7**, **Zustand** (with `persist`), **@dnd-kit**, **lucide-react**
- **recharts** (lazy-loaded chunk)
- **xlsx** for real Excel export
- **date-fns** for locale-aware formatting

## Build status
- `npm run build` → 0 errors, 0 warnings (other than the generic chunk-size info)
- Output: `dist/index.html` (1 KB) + `dist/assets/index-*.js` (214 KB gzipped) + `dist/assets/AnalyticsPage-*.js` (113 KB gzipped) + `dist/assets/index-*.css` (7 KB gzipped) + `dist/sw.js` + `dist/manifest.webmanifest` + `dist/_redirects` (for SPA routing)
- Local preview verified: `/`, `/sw.js`, `/manifest.webmanifest`, `/favicon.svg`, `/assets/*` all return 200

## How to run locally
```bash
cd /workspace/flow
npm install     # already done
npm run dev     # http://localhost:5173
npm run build   # type-check + production build
npm run preview # serve the built dist/
```

## How to deploy
`dist/` is a fully static bundle. Upload it to:
- **Netlify** — drop the `dist/` folder, the included `_redirects` handles SPA routing
- **Vercel** — `vercel.json` with `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`
- **Cloudflare Pages** — build output: `dist/`
- **GitHub Pages** — needs a `404.html` that mirrors `index.html`; or use a subpath with `base: '/<repo>/'` in `vite.config.ts`
- Any S3 + CloudFront setup with index document `index.html` and error document `index.html`

## What's mocked vs. real

| Feature                  | Status                                                              |
| ------------------------ | ------------------------------------------------------------------- |
| Order storage            | localStorage via Zustand `persist` (real, persistent across reloads) |
| Auth                     | Mock provider with explicit `AUTH-STUB: ready for Supabase` seam — swap one file to wire Supabase |
| Cross-tab notifications  | Real (`BroadcastChannel`)                                           |
| Browser Notifications API| Real (after user clicks "Enable" in Settings)                       |
| Service Worker           | Real, registered in prod, handles `push` + `notificationclick`      |
| Real Web Push (server-driven across devices) | TODO — VAPID setup documented in `public/sw.js` and README |
| WhatsApp deep link       | Real `wa.me` link with `+218` and URL-encoded Arabic message        |
| Excel export             | Real `.xlsx` file via the `xlsx` library                            |

## File map (new files added in cycle 2)
- `src/utils/whatsapp.ts` — phone normalization + wa.me link builder
- `src/utils/excelExport.ts` — xlsx export utility
- `src/utils/toast.tsx` — global toast system
- `src/utils/notifications.tsx` — in-app + cross-tab + browser notifications
- `src/utils/serviceWorker.ts` — SW registration
- `src/components/OrderDrawer.tsx` — right-side edit drawer
- `public/sw.js` — service worker (push + notificationclick + VAPID TODO)
- `public/_redirects` — SPA fallback for Netlify
- `src/pages/MasterListPage.tsx` — rewritten with sort/filter/bulk/xlsx
- `src/pages/AnalyticsPage.tsx` — rewritten with Recharts
- `src/pages/KanbanPage.tsx` — rewritten with drawer + snap-scroll + floating +
- `src/pages/SettingsPage.tsx` — extended with notifications + auth stub panel
- `src/components/OrderCard.tsx` — rewritten as accordion with WhatsApp + edit/archive inline
- `src/components/TopBar.tsx` — added notification bell with dropdown
- `src/App.tsx` — wrapped with ToastProvider + NotificationProvider; AnalyticsPage lazy-loaded
- `src/main.tsx` — registers service worker in prod
- `src/i18n/ar.json` + `de.json` — extended with all new strings

## Region & RTL positioning
- Default region: Libya, LYD (د.ل), ar-LY locale
- Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) in all currency displays
- Cairo font, weights 200–900
- `<html dir="rtl" lang="ar">` at the root, all components reverse-aware
- Manifest sets `dir: "rtl"`, `lang: "ar"`

## Quick demo path for your team
1. Open the deployed URL → click "Continue with Google" (mock auth)
2. Land on the Kanban board with 20 seeded Libyan orders
3. Drag a card between columns to change status
4. Expand a card, click the green **WhatsApp** button — a new tab opens wa.me with a pre-formatted Arabic message
5. Click the pencil icon → edit drawer opens, change items, upload an image attachment, save
6. Switch to **Master List** → tick a few rows, click **Export Excel** → a real .xlsx downloads
7. Open **Analytics** → 4 charts render with the live data
8. Open **Settings** → click "Enable browser notifications" → grant permission
9. Go back to Kanban, click the floating + (on mobile) or the Quick Create button → fill in a new order → save
10. In a second browser tab of the same app: you see the bell badge increment and a toast fire (cross-tab `BroadcastChannel`); if you granted browser permission, you also get an OS-level notification
