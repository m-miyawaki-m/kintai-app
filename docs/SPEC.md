# 勤怠管理アプリ 機能仕様書

## 概要

HERMOSライクな勤怠管理アプリケーション。出退勤を位置情報付きで記録し、管理者がリアルタイムで確認できる。

## ユーザー種別

| 種別 | role | 権限 |
|------|------|------|
| 一般ユーザー | `user` | 自分の出退勤記録の閲覧・打刻 |
| 管理者 | `admin` | 全ユーザーの勤怠記録の閲覧、管理者ダッシュボード |

## 画面一覧

### 1. ログイン画面 (`/login`)

**機能:**
- メールアドレス・パスワードによるログイン
- 新規ユーザー登録
- 開発モード時: Firestoreに登録されているユーザーをプルダウンで選択可能

**ログイン後の遷移:**
- 管理者（role: admin）→ `/admin`
- 一般ユーザー → `/attendance`

**開発モード機能:**
- `VITE_USE_EMULATORS=true` の場合、ユーザー選択プルダウンを表示
- プルダウンのデータは `public/dev-users.json` から読み込み（シードスクリプトで生成）

### 2. 勤怠打刻画面 (`/attendance`)

**機能:**
- 本日の日付表示
- 出勤ボタン: 位置情報を取得して出勤を記録
- 退勤ボタン: 位置情報を取得して退勤を記録
- 本日の勤怠記録一覧表示

**出勤・退勤ボタンの状態:**
- 出勤可能: 本日の出勤記録がない場合
- 退勤可能: 本日の出勤記録があり、退勤記録がない場合

**処理中の表示:**
- 画面全体にオーバーレイ（半透明の黒背景）を表示
- 中央にスピナーと処理状況メッセージ（「出勤処理中...」「退勤処理中...」）
- 位置情報取得状況を表示
- オーバーレイ中は他の操作を受け付けない

**勤怠記録の表示:**
共通コンポーネント `AttendanceRecordCard` を使用。1カードで出勤（左）・退勤（右）を並べて表示。

| 項目 | 内容 |
|------|------|
| 出勤 | 時刻、住所 |
| 退勤 | 時刻、住所 |
| ステータス | 未出勤 / 勤務中 / 退勤済 |

### 3. 管理者ダッシュボード (`/admin`)

**機能:**
- 全ユーザーの本日の勤怠状況をリアルタイム表示
- ユーザーごとの出勤・退勤時刻と位置情報

## データモデル

### users コレクション

```typescript
interface User {
  uid: string           // Firebase Auth UID
  email: string         // メールアドレス
  displayName: string   // 表示名
  role: 'user' | 'admin' // ユーザー種別
  createdAt: Timestamp  // 作成日時
}
```

### attendances コレクション

```typescript
interface AttendanceRecord {
  id: string            // ドキュメントID
  userId: string        // ユーザーUID
  userName: string      // ユーザー表示名
  type: 'clock_in' | 'clock_out' // 打刻種別
  timestamp: Timestamp  // 打刻日時
  location: {
    latitude: number    // 緯度
    longitude: number   // 経度
    address: string     // 住所（逆ジオコーディング結果）
  }
  date: string          // 日付 (YYYY-MM-DD形式)
}
```

## 開発環境

### エミュレータ起動

```bash
npm run dev:local
```

以下が起動:
- Vite開発サーバー: http://localhost:5173
- Firebase Emulator UI: http://localhost:4000
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080

### シードデータ

エミュレータ起動時に自動でシードスクリプトが実行され、以下のテストユーザーが作成される:

| メールアドレス | パスワード | 表示名 | 役割 |
|--------------|----------|--------|------|
| admin@example.com | admin123 | 管理者 | admin |
| user01@example.com | password | 山田 太郎 | user |
| user02@example.com | password | 佐藤 花子 | user |

## セキュリティルール

### Firestore

- `users`: 認証済みユーザーのみ読み取り可能、自分のドキュメントのみ作成・更新可能
- `attendances`: 認証済みユーザーのみアクセス可能、自分の記録のみ作成可能

## 状態管理

**Pinia** を使用してアプリケーションの状態を管理。

### stores

| Store | 役割 |
|-------|------|
| `auth` | 認証状態（ユーザー情報、ログイン状態、エラー） |

### 使用方法

```typescript
// コンポーネントで使用
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

// または互換性レイヤー経由
import { useAuth } from '@/composables/useAuth'
const { currentUser, login, logout } = useAuth()
```

## 外部サービス連携

### 位置情報

- **取得**: ブラウザの Geolocation API
- **逆ジオコーディング**: OpenStreetMap Nominatim API
  - エンドポイント: `https://nominatim.openstreetmap.org/reverse`
  - 日本語の住所を取得

## メッセージ管理

エラーメッセージ等は `src/constants/messages.ts` で一元管理。

| 定数 | 用途 |
|------|------|
| `AUTH_ERRORS` | 認証エラーメッセージ |
| `GEOLOCATION_ERRORS` | 位置情報エラーメッセージ |
| `ATTENDANCE_ERRORS` | 勤怠エラーメッセージ |

**使用例:**
```typescript
import { getAuthErrorMessage } from '@/constants/messages'
const message = getAuthErrorMessage(error.code)
```

## ログ出力方針

以下のタイミングでのみログを出力する:

| タイミング | 形式 | 例 |
|-----------|------|-----|
| API呼び出し | `console.log('API: methodName', { params })` | `console.log('API: clockIn', { location })` |
| エラー発生 | `console.error('Context:', error)` | `console.error('Failed to get position:', error)` |
| 状態変更 | `console.log('State: description', data)` | `console.log('State: User logged in', user.email)` |

**出力しない**: 全関数呼び出し、分岐条件、軽微な操作

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-02-04 | 初版作成 |
| 2025-02-04 | 出退勤処理中の画面全体オーバーレイ追加 |
| 2025-02-04 | ログイン画面のユーザー選択を動的に変更（dev-users.jsonから読み込み） |
| 2025-02-04 | シードスクリプト追加（npm run seed） |
| 2025-02-04 | dev:local起動時にシード自動実行 |
| 2025-02-04 | ログ出力方針を追加（API・エラー・状態変更のみ） |
| 2025-02-04 | Pinia導入（状態管理をComposablesからPinia storeに移行） |
| 2025-02-04 | メッセージ管理を constants/messages.ts に分離 |
| 2025-02-04 | 勤怠記録カードを共通コンポーネント化（出勤・退勤左右並び表示） |
