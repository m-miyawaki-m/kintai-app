# 勤怠管理アプリ (Kintai App)

HERMOSライクな勤怠管理アプリケーション。出退勤を位置情報付きで記録し、管理者がリアルタイムで確認できます。

## 機能

- **出退勤打刻**: 位置情報付きで出勤・退勤を記録
- **リアルタイム同期**: Firestoreによるリアルタイムデータ同期
- **管理者ダッシュボード**: 全従業員の勤怠状況をリアルタイム確認
- **住所表示**: OpenStreetMap Nominatimによる逆ジオコーディング

## 技術スタック

- **Frontend**: Vue.js 3 (Composition API) + Vite + TypeScript
- **UI**: Tailwind CSS
- **Backend**: Firebase Functions
- **Database**: Firestore
- **Auth**: Firebase Authentication (Email/Password)
- **Hosting**: Firebase Hosting

## セットアップ

### 前提条件

- Node.js 18以上
- npm
- Firebaseプロジェクト（本番環境用）

### インストール

```bash
# 依存関係をインストール
npm install

# Cloud Functions の依存関係をインストール
npm install --prefix functions

# Cloud Functions をビルド
npm run build --prefix functions
```

### 環境変数の設定

`.env.example`をコピーして`.env.local`を作成:

```bash
cp .env.example .env.local
```

**ローカル開発（エミュレーター使用）の場合:**
```env
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:demo
VITE_USE_EMULATORS=true
```

**本番Firebase使用の場合:**
Firebase ConsoleからProject Settings > Web Appの値を設定し、`VITE_USE_EMULATORS=false`に設定。

## 開発

### ローカル開発（Firebaseエミュレーター使用）

```bash
npm run dev:local
```

以下が起動します:
- Vite開発サーバー: http://localhost:5173
- Firebase Emulator UI: http://localhost:4000
- Auth Emulator: http://localhost:9099
- Firestore Emulator: http://localhost:8080

### ローカル開発（本番Firebase使用）

```bash
npm run dev
```

## 初回ログイン（エミュレーター使用時）

エミュレーター使用時は、新規ユーザー登録から始めてください:

1. アプリにアクセス
2. 「新規登録」をクリック
3. メールアドレス、パスワード、表示名を入力して登録
4. 登録後、自動的にログインされます

## ビルド・デプロイ

```bash
# プロダクションビルド
npm run build

# Firebase全体をデプロイ
npm run deploy

# Hostingのみデプロイ
npm run deploy:hosting

# Functionsのみデプロイ
npm run deploy:functions
```

## ディレクトリ構成

```
kintai-app/
├── src/
│   ├── components/     # 再利用可能なVueコンポーネント
│   ├── views/          # ページコンポーネント
│   ├── composables/    # Vue composables (useAuth, useAttendance, useGeolocation)
│   ├── services/       # Firebase・外部APIサービス
│   ├── types/          # TypeScript型定義
│   └── router/         # Vue Router設定
├── functions/          # Firebase Cloud Functions
└── dist/               # ビルド出力
```

## トラブルシューティング

### ログインできない

1. エミュレーターが起動しているか確認 (`http://localhost:4000`)
2. `.env.local`で`VITE_USE_EMULATORS=true`が設定されているか確認
3. 新規登録からユーザーを作成してください

### 位置情報が取得できない

- ブラウザの位置情報許可を確認
- HTTPSまたはlocalhost環境で実行する必要があります

### Functionsエラー

Cloud Functionsをビルドしてください:
```bash
npm run build --prefix functions
```
