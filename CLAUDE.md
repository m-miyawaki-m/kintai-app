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
- `master` - Production branch (deployed to Vercel)
- `develop` - Development base branch
- `feature/*` - Feature branches (branch from develop, merge to develop via PR)

**Workflow:**
1. Create feature branch from develop: `git checkout develop && git checkout -b feature/xxx`
2. Develop and commit changes
3. Push and create Pull Request to develop
4. After review, merge to develop
5. At release timing, merge develop to master and deploy

## Development Workflow
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
