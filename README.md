# ToteScan

ToteScan is a mobile-first inventory app for tracking physical storage containers like totes, bins, drawers, and shelves.

This build is now wired for:

- Firebase Realtime Database for tote and item data
- Firebase Storage for item photos
- GitHub Pages for hosting
- Hash-based routing so QR links work on GitHub Pages

## What is built

- Tote CRUD with name, location, owner, and last-updated tracking
- Item CRUD with quantity, notes, and optional photo upload
- QR code generation for each tote
- QR scan flow that opens the matching tote screen
- Global item search with a location filter
- Firebase-backed sync with local fallback logic still in place for development

## Firebase config

The app already includes your Firebase web config in `src/lib/firebase.ts`, so GitHub Pages can build and deploy without extra repo variables.

If you ever want to override it locally, copy `.env.example` to `.env` and set the `VITE_FIREBASE_*` values.

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Data layout

- `totes/{toteId}` in Realtime Database
- `items/{itemId}` in Realtime Database
- `totes/{toteId}/...` photo files in Firebase Storage

Each item stores its parent `toteId`, which keeps global search simple.

## GitHub Pages deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

To use it:

1. Push the repo to GitHub.
2. In GitHub, open `Settings > Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main`.

## Important Firebase note

Your Firebase web config is public in the built app. That is normal for Firebase web apps. Security comes from Realtime Database rules and Storage rules, not from hiding these values.

If your database or storage rules are still locked down, the app may connect but photo uploads or writes can fail until those rules are updated.

## Recommended next step

Add Firebase Authentication and lock Realtime Database and Storage rules to signed-in users before storing real inventory data long term.
