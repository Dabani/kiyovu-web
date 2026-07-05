# Phase 2 — Frontend Skeleton: React + TypeScript + Mantine + PWA

**Verified in this environment:** `npm install`, `tsc --noEmit` (clean), and a full
`vite build` all pass — including PWA service-worker generation. This is a
working, buildable skeleton, not just illustrative code.

## What this phase delivers
- Vite + React 18 + TypeScript project, PWA-enabled (`vite-plugin-pwa`, installable, offline shell, brand manifest using the Kiyovu crest as 192/512/maskable icons)
- Mantine 7 theme (`theme/theme.ts`) — brand green `#006400` expanded into a full shade scale, Lato loaded via Google Fonts in `index.html`
- Sanctum-aware `axios` client (`lib/api.ts`) with CSRF priming and central 401 redirect
- `authStore` (Zustand) — login/logout/me, role & permission helpers
- `react-i18next` set up with English, French, and Kinyarwanda seed translations (`i18n/locales/*.json`) — French mirrors the IRR's own bilingual wording; Kinyarwanda is a first-pass translation and **should get a native-speaker review pass** before go-live
- `AppLayout` — header (crest, language switcher, user menu) + **role-driven sidebar** (`navConfig.ts` — the single place that maps IRR roles to visible modules; every bundle delivery just adds one entry here)
- **`<DataTable>`** — the reusable component every one of the 53 screens will use: search, column-driven rendering, per-column filters, pagination, Excel export (client-side, via `xlsx`), and a PDF report trigger
- **`<ReportPeriodModal>`** — daily/weekly/monthly/quarterly/annual/custom period picker, feeds a `GET /{module}?period=...` call to a server-rendered PDF (Bundle deliveries wire this to `barryvdh/laravel-dompdf` endpoints)
- **`useCrudList`** — one hook backing every list screen's server-side pagination/search/filter + delete mutation
- **`useLookup`** — the hook every dropdown calls against `/api/lookups/{key}`, so no option list is ever hardcoded in a component
- Login page, protected-route guard, role-gated route wrapper, placeholder dashboard that auto-renders tiles for whatever modules the logged-in user's role can see

## File tree delivered
```
web/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── public/
│   ├── kiyovu-crest.png       (your logo, unmodified)
│   └── favicon.png
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── theme/theme.ts
    ├── lib/api.ts
    ├── stores/authStore.ts
    ├── hooks/useLookup.ts
    ├── hooks/useCrudList.ts
    ├── i18n/index.ts
    ├── i18n/locales/{en,fr,rw}.json
    ├── routes/ProtectedRoute.tsx
    ├── components/layout/navConfig.ts
    ├── components/layout/AppLayout.tsx
    ├── components/DataTable/DataTable.tsx
    ├── components/DataTable/ReportPeriodModal.tsx
    └── pages/
        ├── DashboardPage.tsx
        └── auth/LoginPage.tsx
```

## Setup commands (Windows 11 / Laragon)
```bash
cd www
npm create vite@latest kiyovu-web -- --template react-ts
# Delete the generated src/ and public/, drop this delivery's files in instead.
cd kiyovu-web
npm install
npm run dev            # http://localhost:5173, proxies /api and /sanctum to kiyovu-api.test
```

### PWA icons
Generate the three sizes referenced in `vite.config.ts`'s manifest from the
crest (a quick way: `npx pwa-asset-generator public/kiyovu-crest.png public/icons`
then trim to the 192 / 512 / 512-maskable set) and place them in `public/icons/`.

## How every future module bundle plugs in
1. Add the module's icon + route entry to `navConfig.ts` (one array item).
2. Build `src/pages/{module}/{Screen}List.tsx` using `<DataTable>` + `useCrudList('/api/{endpoint}')` — this is almost entirely configuration, not new logic.
3. Build `src/pages/{module}/{Screen}Form.tsx` using Mantine `useForm` + `useLookup()` for every dropdown.
4. Register the route(s) in `App.tsx`'s module-routes comment block.
5. If the module introduces a new dropdown, its `lu_*` table + model come from the matching backend bundle delivery, and its key gets one line in `LookupController::MAP`.

## Design note
This is a governance/records tool used by committee members and staff, not a
marketing surface — the theme leans toward density, legibility, and clear
status color-coding over visual flourish, while staying unmistakably Kiyovu:
the crest as the one recurring mark, the brand green as the single accent
color throughout (buttons, active nav, avatars), Lato as the only typeface.

## Next up
**Phase 3: Bundle 1 — Membership & Honorary** (MEM-001–007, HON-001–002).
Full stack: migrations for `members`, `honorary_members` + their `lu_*`
dropdown tables (membership categories, fee tiers, honorary titles),
models, policies, controllers (list/create/update/delete/export/report),
and the 9 React screens using the components built in this phase.
