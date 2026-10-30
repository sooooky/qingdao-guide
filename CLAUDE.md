# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Korean-language, mobile-first travel planner + survival toolkit for a 3-day (2박 3일) trip to Qingdao. It is a purely client-side React 18 + TypeScript SPA built with Vite and styled with Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config`). There is no backend. UI strings, comments in data, and type union values (e.g. categories like `'식사/맥주'`) are in Korean — keep new user-facing text in Korean.

The project originated from Google AI Studio. `metadata.json`, `.env.example` (`GEMINI_API_KEY`, `APP_URL`) and the `DISABLE_HMR` handling in `vite.config.ts` are AI Studio scaffolding; no code currently calls Gemini.

## Commands

```bash
npm install --legacy-peer-deps   # same flags CI uses
npm run dev                      # Vite dev server
npm run build                    # production build to dist/
npm run preview                  # serve the built dist/
npx tsc --noEmit                 # type-check (no script for this; build does not type-check)
```

- There is no test suite.
- `npm run lint` is effectively broken: it targets `--ext js,jsx` (the code is `.ts/.tsx`) and there is no ESLint config file in the repo. Use `npx tsc --noEmit` for static checking.
- `bun.lock` exists, but CI uses npm.

## Deployment

`.github/workflows/static.yml` builds and deploys `dist/` to GitHub Pages on every push to `main`. Because of this, `vite.config.ts` sets `base: '/qingdao-guide/'` — asset paths and any URL building must respect that base.

## Architecture

**Single state owner: `src/App.tsx`.** All domain state (itinerary, backup pool, expenses, checklist, food places, wishlist, survival phrases, exchange rate) lives in `App` as `useState`, is passed down to tab components as props with `onUpdateX` setters, and is persisted to `localStorage` by one `useEffect` per slice. Tab switching is a simple `activeTab` conditional render (no router); the tab list is defined in `src/components/Navigation.tsx` (`TabKey`).

- localStorage keys are in `STORAGE_KEYS` and are versioned (`_v5`). Changing the shape of a persisted type in a breaking way means bumping the suffix (old data then silently falls back to defaults).
- Initial/seed data for every slice comes from `src/data/initialData.ts` (real Qingdao places with `lat/lng`, Chinese addresses `addressCn`, pinyin). "Reset" in the header clears storage and restores these constants. Some exports there (`TAXI_CARDS`, `BEER_GUIDE`, `FOOD_DELICACIES`, `EMERGENCY_CONTACTS`) are static reference data imported directly by components, not part of App state.
- Adding a new persisted slice requires touching several places in `App.tsx`: `STORAGE_KEYS`, the lazy `useState` initializer, a persistence `useEffect`, `handleResetData`, and `handleImportBackup` (JSON backup/restore in `BackupModal`). Also consider `RoomData` in `utils/firebase.ts`.
- Cross-tab actions (e.g. adding a food place or wishlist item into a day's schedule) are implemented as handlers in `App.tsx` that build a `ScheduleItem` and append it after the last item of that day.

**Schedule timing model.** `ScheduleItem` has `startTime` ('HH:MM'), `durationMinutes`, and `transitMinutes`. `recalculateCascade` in `src/utils/geo.ts` recomputes each item's start time from the previous item's end + transit; times wrap at 24h via `minutesToTime`.

**Attachments.** Images (vouchers, tickets, QR codes) are compressed with `compressImageFile` (`utils/attachmentStorage.ts`) and stored inline as base64 `dataUrl` inside `ScheduleItem.attachments`, i.e. in the itinerary's localStorage entry (watch the ~5MB quota). The IndexedDB helpers in the same file (`saveAttachmentToDB`, etc.) exist but are currently unused.

**Chinese-language helpers.**
- `utils/translator.ts`: Korean → Simplified Chinese + pinyin + English via the unofficial `translate.googleapis.com` (`client=gtx`) endpoint, with a built-in Korean-keyed offline dictionary as fallback.
- `utils/tts.ts`: `speakChinese` uses the browser Web Speech API (`zh-CN`, rate 0.85). Used for taxi cards and survival phrases.
- `utils/geo.ts` also opens Amap / Baidu map searches for an address (Google Maps is not usable in China).

**Map.** `MapTab` uses Leaflet/react-leaflet with ArcGIS and OSM tile layers; Leaflet CSS and the Pretendard font are loaded from CDNs in `index.html`.

## Known gaps / gotchas

- **Firebase real-time sync is not wired up.** `utils/firebase.ts` (Firestore `rooms/{roomId}` doc + anonymous auth, `subscribeToRoom`/`saveRoomData`) and `components/ShareModal.tsx` (`?room=` share links) exist, but neither is imported by `App.tsx` or any other component.
- `exchangeRate` is read from localStorage on load but there is no `useEffect` that writes it back, so changes made in the calculator tab are not persisted across reloads.
- Commit history consists of direct edits via the GitHub web UI ("Update App.tsx"), so there is no meaningful history to infer conventions from.
