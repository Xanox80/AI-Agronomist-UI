# AP Scout frontend

Angular 21 (standalone, zoneless) PWA with PrimeNG 21, ngx-translate, Leaflet.
The API is the separate `ap-scout-backend` project; start it first (`npm run start:dev` there, port 3000).
API contract shared with the backend: `docs/architecture.md`; spec PDF in `docs/`.

## Commands

- `npm install`: dependencies.
- `npm start`: dev server on http://localhost:4200 with `/api` proxied to `http://localhost:3000` (`proxy.conf.json`).
- `npm run build`: production build (service worker enabled, `ngsw-config.json`).
- `npm test`: all unit tests (Vitest through the Angular `unit-test` builder), watch mode.
- All tests once: `npx ng test --watch=false`.
- One folder only: `npx ng test --watch=false --include "src/app/features/<name>/**/*.spec.ts"`
  (core folder: `--include "src/app/core/<name>/**/*.spec.ts"`).

## Layout

- `src/app/core/api`: typed DTO models (`models/`) and one API client per backend module.
- `src/app/core/{auth,interceptors,i18n,theme,quality-gate,offline}`: shared services.
- `src/app/features/<name>`: lazy feature routes (`<name>.routes.ts` exporting `<NAME>_ROUTES`).
- `src/styles`: Agroprosperis design tokens (`--ap-*`), sun mode via `<html data-theme="sun">`, 48px touch targets.
- `src/assets/i18n/{uk,en}.json` hold `common.*`; each feature adds `assets/i18n/<feature>/{uk,en}.json`
  under its own top-level namespace. Folders are listed in `core/i18n/i18n-features.ts`.
- Config numbers live in `src/environments/environment.base.ts`.

## Notes

- `.npmrc` sets `legacy-peer-deps=true`: npm 11 crashes while resolving the vitest/jsdom peer set otherwise.
- `vitest ^4` and `jsdom ^28` come from the Angular 21 default (newer than the versions in `docs/architecture.md`).
