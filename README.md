# ToteScan

ToteScan is a mobile-first inventory app for tracking physical storage containers like totes, bins, drawers, and shelves.

This build is wired for:

- Firebase Realtime Database for tote and item data
- Firebase Storage for item photos
- Firebase Anonymous Authentication for app access
- GitHub Pages for hosting

## What is built

- Tote CRUD with name, location, owner, and last-updated tracking
- Item CRUD with quantity, notes, and optional photo upload
- QR code generation for each tote
- QR scan flow that opens the matching tote screen
- Global item search with a location filter
- Anonymous Firebase sign-in before reads and writes

## Local commands

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

Deploy Firebase rules:

```bash
npm run firebase:login
npm run firebase:deploy:rules
```

## Firebase files in this repo

- `src/lib/firebase.ts`
- `database.rules.json`
- `storage.rules`
- `firebase.json`
- `.firebaserc`

The Firebase project is already set to `totescan-998a3`.

## One-time setup in Firebase Console

1. Enable `Authentication > Sign-in method > Anonymous`.
2. Confirm Realtime Database is created for project `totescan-998a3`.
3. Confirm Storage is enabled for the same project.
4. Deploy the rules from this repo with `npm run firebase:deploy:rules`.

## GitHub Pages deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

To publish the app:

1. Open `Settings > Pages` in the GitHub repo.
2. Set the source to `GitHub Actions`.
3. Re-run the failed workflow or push a new commit.

Expected site URL:

- `https://sbozzone.github.io/tote_tkr/`

## Security model

- App users must have a Firebase auth session
- This app uses anonymous auth right now
- Realtime Database reads and writes require `auth != null`
- Storage reads and writes require `auth != null`
- Storage uploads are limited to image files under 10 MB

## Important note

Firebase web config is public in client apps by design. Security comes from Firebase Auth plus rules, not from hiding API keys in the frontend.
