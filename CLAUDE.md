# Project: Kintai (勤怠管理アプリ)

## Overview
HERMOSライクな勤怠管理アプリ。出退勤を位置情報付きで記録し、管理者がリアルタイムで確認できる。

## Tech Stack
- Frontend: Vue.js 3 (Composition API) + Vite + TypeScript
- UI: Tailwind CSS
- Backend: Firebase Functions
- Database: Firestore
- Auth: Firebase Authentication (Email/Password)
- Hosting: Firebase Hosting
- Geolocation: Geolocation API + OpenStreetMap Nominatim

## Common Commands
- Dev (with Emulator): `npm run dev:local`
- Dev (Production Firebase): `npm run dev`
- Build: `npm run build`
- Deploy: `npm run deploy`
- Deploy Hosting only: `npm run deploy:hosting`
- Deploy Functions only: `npm run deploy:functions`

## Code Style
- **REQUIRED**: Keep functions small (50 lines max)
- **REQUIRED**: Keep files under 300 lines
- Naming: camelCase (variables/functions), PascalCase (types/classes/components)
- Prefer named exports
- Vue: Use Composition API with `<script setup>`

## Logging
Output logs only at these points:
- **API calls**: Request/response with key parameters (`console.log('API: methodName', { params })`)
- **Errors**: All caught errors (`console.error('Context:', error)`)
- **State changes**: Important state updates like login/logout (`console.log('State: description', data)`)
- Do NOT log: Every function call, branch conditions, or trivial operations

## Language
- Communicate in Japanese
- Code comments in English
- Commit messages in English

## Git Branch Strategy
- `master` - Production branch (auto-deployed to Firebase Hosting via GitHub Actions)
- `develop` - Development base branch
- `feature/*` - Feature branches (branch from develop, merge to develop via PR)

## CI/CD (GitHub Actions)
Auto-deploy to Firebase Hosting on push/merge to master.

**Required GitHub Secrets:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT` (Firebase service account JSON)

**Setup:**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key (JSON)
3. Add JSON content to GitHub Secrets as `FIREBASE_SERVICE_ACCOUNT`
4. Add Vite env vars to GitHub Secrets

## Production Environment
- URL: https://kintai-app-mm.web.app
- Firebase Project: kintai-app-mm
- Seed script: `node scripts/seed-production-rest.mjs`

## Issue-Driven Development
**REQUIRED**: All changes must be tracked via GitHub Issues.

**Workflow:**
1. When receiving a task, check existing GitHub Issues: `gh issue list`
2. If no related issue exists, create one: `gh issue create --title "..." --body "..."`
3. Create feature branch from develop: `git checkout develop && git checkout -b feature/issue-{番号}-{概要}`
4. Develop and commit changes (reference issue in commits: `fix #123` or `refs #123`)
5. Push and create Pull Request to develop (link to issue)
6. After review, merge to develop (issue auto-closes if using `fix #123`)
7. At release timing, merge develop to master and deploy

## Development Workflow

### Pre-modification Check (REQUIRED)
**Before making ANY code changes, ALWAYS verify:**
1. `git branch` - Check current branch
2. `gh issue view <number>` or `gh issue list` - Check related issue
3. Confirm the modification aligns with the current branch/issue purpose

### General Rules
1. Read existing code before making changes
2. Typecheck and lint must pass before commit
3. Use Conventional Commits format
4. Test with Firebase Emulator before deploying
5. **REQUIRED**: Update specification docs (`docs/SPEC.md`) when modifying source code to keep docs and code in sync

## Directory Structure
- `src/components/` - Reusable Vue components
- `src/views/` - Page components
- `src/stores/` - Pinia stores (auth, attendance, geolocation)
- `src/composables/` - Vue composables (wrappers for stores)
- `src/constants/` - Constants and messages (messages.ts)
- `src/services/` - Firebase and external API services
- `src/types/` - TypeScript type definitions
- `src/router/` - Vue Router configuration
- `functions/` - Firebase Cloud Functions
- `docs/` - Specification documents (SPEC.md)
- `scripts/` - Development scripts (seed.mjs)
