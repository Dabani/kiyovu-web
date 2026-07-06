<div align="center">

<img src="public/kiyovu-crest.png" alt="Kiyovu Sports Association" width="96" />

# Kiyovu IRMS — Web

**Internal Rules Management System for Kiyovu Sports Association**
React + TypeScript progressive web app — the frontend for Kiyovu Sports' digitised Internal Rules & Regulations (IRR)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Mantine](https://img.shields.io/badge/Mantine-7-339AF0)](https://mantine.dev)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey)](#license)

</div>

---

## About

This is the interface committee members, HQ staff, players, fan club
representatives, and self-service members use to work with Kiyovu Sports'
Internal Rules & Regulations day to day — **53 screens across 8 module
bundles**, each a full CRUD experience (search, filter, pagination, Excel
export, PDF reporting) driven entirely by data from the
[API](../kiyovu-api), with zero hardcoded dropdown options anywhere in the
codebase.

It's built as an installable Progressive Web App, translated into English,
French, and Kinyarwanda, and themed around Kiyovu's actual brand identity —
not a generic admin template with a logo swapped in.

## What this is not

This is a **records and workflow management tool for internal governance
processes**, not a public-facing fan site. Public content (fixtures, news,
ticketing) is out of scope; every screen here sits behind authentication
and role-based access control enforced by the API.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| UI library | [Mantine](https://mantine.dev) 7 |
| Server state | TanStack Query |
| Client state | Zustand |
| Routing | React Router 6 |
| i18n | react-i18next (EN / FR / RW) |
| PWA | vite-plugin-pwa |
| Icons | Tabler Icons |
| Exports | xlsx (client-side Excel generation) |

## Module bundles

| # | Bundle | Screens |
|---|---|---|
| 1 | Membership & Honorary | 9 |
| 2 | HR & Recruitment | 7 |
| 3 | Elections | 5 |
| 4 | Disciplinary & Legal | 6 |
| 5 | Financial, Procurement & Asset | 7 |
| 6 | Fan Clubs | 8 |
| 7 | Players & Safeguarding | 7 |
| 8 | Operations, Security & Commissions | 4 |
| | **Total** | **53** |

## Requirements

- Node.js 22+ and npm 11+
- The [Kiyovu API](../kiyovu-api) running locally (default expected at `kiyovu-api.test`)

## Getting started

```bash
git clone <this-repo> kiyovu-web
cd kiyovu-web
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies `/api` and
`/sanctum` requests to the backend (configured in `vite.config.ts`) — make
sure the API is running first, and that its `SANCTUM_STATEFUL_DOMAINS`
includes `localhost:5173`.

### PWA icons

`vite.config.ts` references `public/icons/icon-192.png`,
`icon-512.png`, and `icon-512-maskable.png` for the installable app
manifest. These need to be generated from the crest before a production
build — they are **not** included yet:

```bash
npx pwa-asset-generator public/kiyovu-crest.png public/icons
```

### Build for production

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Design system

| Token | Value |
|---|---|
| Brand green | `#006400` |
| Brand white | `#ffffff` |
| Typeface | Lato (loaded via Google Fonts in `index.html`) |

This is a records/governance tool used by committee members and staff, not
a marketing surface — the theme (`src/theme/theme.ts`) prioritises density,
legibility, and clear status colour-coding over visual flourish, while
staying recognisably Kiyovu: the crest as the one recurring mark, the brand
green as the single accent colour throughout.

## Internationalisation

English and French translations mirror the IRR's own bilingual wording.
**Kinyarwanda translations are a first pass and should get a
native-speaker review before relying on them in production** — flagged
here deliberately rather than presented as finished.

## Project structure

```
src/
├── components/
│   ├── layout/AppLayout.tsx, navConfig.ts    # role-driven sidebar — the one file that maps roles to visible modules
│   └── DataTable/DataTable.tsx, ReportPeriodModal.tsx   # the shared component every screen is built on
├── hooks/
│   ├── useCrudList.ts, useCrudMutations.ts   # generic list/search/filter/paginate + create/update
│   ├── useLookup.ts                          # every dropdown fetches from here
│   └── use{Member,Candidate,FanClub,Player,...}Options.ts   # cross-module entity pickers
├── modules/
│   └── {bundle}/                             # one folder per bundle: screens + a Module.tsx tab shell
├── i18n/locales/{en,fr,rw}.json
├── stores/authStore.ts
├── theme/theme.ts
└── App.tsx                                   # all 8 module routes registered here
```

## How a new screen gets added

Because of the shared `<DataTable>` + `useCrudList` + `useLookup` machinery,
adding a 54th screen is almost entirely configuration:

1. Add the endpoint's lookup keys to the API's `LookupController::MAP` (backend).
2. Build `{Screen}Page.tsx` using `<DataTable>` for the list and a Mantine
   `useForm` + `<Select>`s wired to `useLookup()` for the form — no new
   list/pagination/export logic needed.
3. Register the route inside the relevant bundle's `*Module.tsx` tab shell.

## Testing & verification status

Every screen has been type-checked (`tsc --noEmit`) and the full project
builds cleanly with `vite build`, including PWA manifest generation.
**No component or end-to-end test suite exists yet.** Contributions adding
tests (Vitest, React Testing Library, Playwright) are welcome.

## License

Proprietary — © Kiyovu Sports Association. Not licensed for reuse outside
the organisation without permission.
