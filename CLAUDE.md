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

## Language
- Communicate in Japanese
- Code comments in English
- Commit messages in English

## Workflow
1. Read existing code before making changes
2. Typecheck and lint must pass before commit
3. Use Conventional Commits format
4. Test with Firebase Emulator before deploying

## Directory Structure
- `src/components/` - Reusable Vue components
- `src/views/` - Page components
- `src/composables/` - Vue composables (useAuth, useAttendance, useGeolocation)
- `src/services/` - Firebase and external API services
- `src/types/` - TypeScript type definitions
- `src/router/` - Vue Router configuration
- `functions/` - Firebase Cloud Functions
