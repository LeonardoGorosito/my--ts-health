# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **My Pets Health**: a React SPA where users register, log in, and manage their pets (profile, medical records, vaccines, dewormings, file attachments, and a public QR "digital tag" page). The backend lives in the sibling directory `../my-pet-api` (uses Prisma); check it when you need the exact shape of an endpoint. UI text and code comments are in Spanish.

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build     # tsc -b (type-check) + vite build -> dist/
npm run lint      # eslint .
npm run preview   # serve the production build
```

There is no test suite. `npm run build` is the type-check gate. `tsconfig.app.json` is strict and sets `noUnusedLocals`/`noUnusedParameters`, `verbatimModuleSyntax` (use `import type` for type-only imports), and `erasableSyntaxOnly` (no `enum`s or parameter properties).

## Environment

- `VITE_API_URL`: backend base URL, read in `src/lib/axios.ts`. Defaults to `http://localhost:3000`.
- Deployed on Vercel. `vercel.json` rewrites every path to `index.html` so client-side routing works, sends `X-Robots-Tag: noindex` for `/public/*` (pet pages that show owner contact data), and caches `/img` and `/video`.
- Animation utilities (`animate-in`, `fade-in`, `slide-in-from-*`) come from `tw-animate-css`, imported in `src/index.css`.

## Architecture

**Bootstrapping**: `main.tsx` wraps the app in `QueryClientProvider` and `BrowserRouter`. `App.tsx` adds `AuthProvider`, `AppRouter`, and the `sonner` `<Toaster>` (use `toast` from `sonner` for user feedback).

**HTTP / auth**:
- Every call goes through the shared `api` axios instance in `src/lib/axios.ts`. A request interceptor attaches `Authorization: Bearer <token>` from `localStorage.token`, and `withCredentials: true` is set. The same file holds upload helpers such as `uploadPetAttachment` (`POST /upload?petId=`).
- `context/AuthContext.tsx` owns the session. On mount it calls `/auth/me` if a token exists. `login` and `verifyEmail` store the returned token and then fetch `/auth/me`. `logout` only clears the token locally. The global `loading` flag covers the initial session check only; don't toggle it from other actions, because that unmounts routes behind `ProtectedRoute`.

**Routing** (`routes/Router.tsx`):
- `/`: landing page. `/public/pet/:id`: unauthenticated pet profile reached from the QR code (`GET /pets/public/:id`).
- `/login`, `/register`, `/forgot-password`, `/reset-password` are wrapped in `AuthGate`, which redirects users who are already logged in to `/app`. Login and register share `AuthPage` through the `initialRegister` prop.
- `/app` (pet list), `/app/qr`, and `/app/pets/:id` are nested under `MainLayout` (navbar plus `<Outlet>`). `/perfil`, `/configuracion`, and `/dispositivos` sit under a second, pathless `MainLayout` route. Every private page is wrapped individually in `ProtectedRoute`, which also accepts an optional `roles` array (`'USER' | 'ADMIN'`). It sends signed-out users to `/login` and users with the wrong role to `/`.
- The catch-all `*` route redirects to `/app` when logged in and to `/` otherwise.

**Data fetching is mixed**: `PetList` and `Navbar` use React Query with the `['pets']` key; invalidate it after any change that affects the pet list. `PetProfile` (the largest page, with info, history, and files tabs) fetches with plain `useEffect` + `useState` and passes its `fetchPet` function to the modals so it can refresh: as `onSuccess` to the Add* modals, `onPetUpdated` to `EditPetModal`, and `onUploadSuccess` to `UploadButton`.

**Forms**: modals and auth pages use `react-hook-form` with `zodResolver` and a zod schema defined in the same file. Pet create and edit send `FormData` because they include a photo upload.

**Styling**: Tailwind CSS v4 through `@tailwindcss/vite`. There is no tailwind config file; theme tokens (`bg-matte`, `bg-card`, `text-main`) are declared in `@theme` in `src/index.css` and overridden under `.dark`. Dark mode is class-based (`@variant dark` on `.dark`). `hooks/useTheme.ts` is one shared store with three options: `system` (the default; follows the device live), `light`, or `dark`. Only an explicit choice is saved in `localStorage.theme`. The inline script in `index.html` applies the theme before React loads. `components/ThemeToggle.tsx` is the selector and appears on the landing, the auth pages (through `AuthTopBar`), and the profile menu. Every new screen needs `dark:` variants. Icons come from `lucide-react`.

**Subscriptions**: 30-day trial with everything in Pro (no card), then `STANDARD` (max 2 pets, no reminders or attachments) or `PRO`. If no plan is active, the account is read-only, but the public QR page and lost mode keep working. The backend enforces limits in `../my-pet-api/src/lib/subscription.ts` (`requireActive`, `requireFeature`, `requirePetSlot`) and answers `402` with a `code` (`SUBSCRIPTION_EXPIRED`, `PLAN_REQUIRED`, `PET_LIMIT`). `/auth/me` returns `subscription` (tier and limits). On the front, `hooks/useSubscription.ts` decides which buttons to show, and the axios interceptor turns any 402 into a toast linking to `/app/plan`. Prices and plan copy live only in `src/lib/plans.ts`; if you change what a plan includes, change the backend too. No payment provider is connected yet: admins assign plans by hand at `/admin` (`PUT /admin/plan`).

**Brand**: the logo and the mascot "Placo" (a collar tag with a face) are SVG components in `src/components/brand/` (`Logo`, `PlacoIcon`, `Placo` with `mood`). The favicon is `public/favicon.svg`. The brand font is Space Grotesk (`font-brand`), loaded in `index.html`.

## Gotchas

- `README.md` is outdated: it still lists `Login.tsx`/`Register.tsx`, which have been merged into `AuthPage`. Trust the code over the README.
- The editor settings folder is named `,vscode` (with a comma), not `.vscode`.
- Landing media in `public/` is pre-optimized (720p `hero.webm`/`hero.mp4`, WebP + JPG images). Keep new media small; the hero video only loads on screens ≥768px without reduced motion.
