# Inventory Clerk (Lake Cowal)

**For Dad: start here → [`HANDOFF.md`](./HANDOFF.md)**  
(checklist: GitHub access, clone, first wireless APK, day-to-day rebuilds — no USB)

Android-first Expo app for on-site inventory audits: photograph stock, tag fields, keep everything offline, then **email an Excel (.xlsx)** workbook (+ photos) so files can land in corporate Google Drive workflows.

## Stack

- Expo SDK 58 / React Native / TypeScript
- Expo Router (`src/app/`)
- SQLite + on-disk photos
- Excel via SheetJS (`xlsx`)
- Mail composer / share sheet for export

## Develop

```bash
npm install
npx expo start
```

Expo Go is fine for quick UI smoke tests. Prefer a **preview APK** (below) for camera, SQLite, mail, and GPS behaviour that matches what Dad will run.

```bash
npm run typecheck
```

## Install on Android (wireless)

**Primary install path (locked):** Expo **EAS Build + internal distribution**. Dad opens an install link or QR on Wi‑Fi/mobile data and downloads the APK — **no USB cable**, **no Google Play Console** for Phase 1.

### One-time setup (developer)

1. Install EAS CLI and log in: `npm i -g eas-cli` then `eas login`.
2. From this repo: `eas init` (links the project; writes `extra.eas.projectId` into `app.json` / `app.config`).
3. Ensure Android package stays `com.lakecowal.inventoryclerk` (see `app.json`).

### Build a shareable APK

```bash
eas build -p android --profile preview
```

- Profile `preview` in `eas.json` uses `"distribution": "internal"` and `"buildType": "apk"`.
- When the build finishes, EAS shows an **install URL / QR code**.
- On the phone: open the link (or scan the QR) → allow install from that source if prompted → install **Inventory Clerk**.

Re-run `eas build -p android --profile preview` whenever you want Dad on a newer build; send him the new link/QR.

### Not primary for Dad

| Method | Notes |
| --- | --- |
| USB / `adb install` | Dev/fallback only |
| Expo Go | Dev smoke tests only — not daily use |
| Google Play | Optional later for managed updates |

### Phone tips

- First install may require **Install unknown apps** permission for the browser or Expo’s installer page.
- Keep a mail app signed in so **Email export** can attach the `.xlsx` and photos.

## App flows (Phase 1)

1. **Capture** — camera (or gallery) → photo saved locally  
2. **Edit** — name, location, supplier/brand, part number, asset allocation, description (barcode scan + GPS location suggest when available)  
3. **Mark pending** → **Export pending** builds Excel and opens mail/share  
4. **Settings** — cache limit presets (500 MB / 1 GB / 2 GB / 5 GB / custom), retention, default export email  
5. **Locations** — onboard named places (+ optional GPS geofence)

## Deferred

- Google Drive API, LAN sync server  
- Label-maker export, OCR, landmark matching, multi-photo  
- Play Store listing  
