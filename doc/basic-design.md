# 勤怠管理アプリ 基本設計書

## 1. システム構成

### 1.1 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Vue.js 3 (Composition API) + TypeScript |
| UIフレームワーク | Tailwind CSS |
| ビルドツール | Vite |
| 認証 | Firebase Authentication |
| データベース | Cloud Firestore |
| バックエンド | Firebase Cloud Functions |
| ホスティング | Firebase Hosting |
| 位置情報 | Geolocation API + OpenStreetMap Nominatim |

### 1.2 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Vue.js 3 Application                    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │    │
│  │  │  Views   │ │Components│ │   Composables    │    │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Platform                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │     Auth     │ │  Firestore   │ │    Functions     │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         OpenStreetMap Nominatim API                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ディレクトリ構成

```
kintai-app/
├── doc/                      # ドキュメント
├── functions/                # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts         # Cloud Functions定義
│   ├── package.json
│   └── tsconfig.json
├── public/                   # 静的ファイル
├── src/
│   ├── assets/              # CSS等のアセット
│   │   └── main.css         # Tailwind CSS
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── AppHeader.vue    # 共通ヘッダー
│   │   ├── LoadingSpinner.vue
│   │   └── LocationDisplay.vue
│   ├── composables/         # Vue Composables
│   │   ├── useAuth.ts       # 認証ロジック
│   │   ├── useAttendance.ts # 勤怠ロジック
│   │   └── useGeolocation.ts # 位置情報ロジック
│   ├── router/              # Vue Router
│   │   └── index.ts         # ルーティング設定
│   ├── services/            # 外部サービス連携
│   │   ├── firebase.ts      # Firebase初期化
│   │   └── geocoding.ts     # 逆ジオコーディング
│   ├── types/               # TypeScript型定義
│   │   └── index.ts
│   ├── views/               # ページコンポーネント
│   │   ├── LoginView.vue    # ログイン画面
│   │   ├── RegisterView.vue # 新規登録画面
│   │   ├── AttendanceView.vue # 出退勤画面
│   │   ├── AdminView.vue    # 管理画面
│   │   └── DashboardView.vue # ダッシュボード（リダイレクト用）
│   ├── App.vue              # ルートコンポーネント
│   └── main.ts              # エントリーポイント
├── firebase.json            # Firebase設定
├── firestore.rules          # Firestoreセキュリティルール
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. 画面設計

### 3.1 共通ヘッダー（AppHeader）

```
┌─────────────────────────────────────────────────────────────┐
│  勤怠管理システム    [画面名]      ユーザー名  [ログアウト] │
└─────────────────────────────────────────────────────────────┘
```

| 要素 | 説明 |
|------|------|
| システム名 | 「勤怠管理システム」固定 |
| 画面名 | 現在表示中の画面名 |
| ユーザー名 | ログインユーザーの表示名 |
| ログアウトボタン | クリックでログアウト |

### 3.2 ログイン画面（LoginView）

```
┌─────────────────────────────────────────────────────────────┐
│                      勤怠管理システム                        │
│                                                             │
│                   ┌─────────────────┐                       │
│  メールアドレス   │                 │                       │
│                   └─────────────────┘                       │
│                   ┌─────────────────┐                       │
│  パスワード       │                 │                       │
│                   └─────────────────┘                       │
│                                                             │
│                   ┌─────────────────┐                       │
│                   │    ログイン     │                       │
│                   └─────────────────┘                       │
│                                                             │
│          ※開発モード時のみ表示                              │
│                   ┌─────────────────┐                       │
│  ユーザー選択     │ -- 選択 --  ▼  │                       │
│                   └─────────────────┘                       │
│                                                             │
│                アカウントを作成                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 出退勤画面（AttendanceView）

```
┌─────────────────────────────────────────────────────────────┐
│                      本日                                    │
│                 2026年2月1日（土）                           │
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │                    │  │                    │            │
│  │       出勤         │  │       退勤         │            │
│  │     Clock In       │  │     Clock Out      │            │
│  │                    │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
│  ─────────────────────────────────────────────             │
│                    本日の勤怠記録                            │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │ [出勤] 09:00  東京都渋谷区...                │           │
│  │ [退勤] 18:00  東京都渋谷区...                │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 管理画面（AdminView）

```
┌─────────────────────────────────────────────────────────────┐
│                      勤怠管理                                │
│                                                             │
│  [現在の状況] [出退勤履歴]                                   │
│  ═══════════════════════════════════════════════           │
│                                                             │
│  ◆ 現在の状況タブ                                           │
│  ┌─────────────────────────────────────────────┐           │
│  │ user01                            [勤務中] │           │
│  │ [出勤] 09:00  東京都渋谷区...                │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  ◆ 出退勤履歴タブ                                           │
│                              日付: [2026-02-01]            │
│  ┌─────────────────────────────────────────────┐           │
│  │ user01                            [退勤済] │           │
│  │ [出勤] 09:00  住所...  [退勤] 18:00  住所... │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. データベース設計

### 4.1 Firestoreコレクション

#### users コレクション
```
/users/{userId}
{
  uid: string,           // Firebase Auth UID
  email: string,         // メールアドレス
  displayName: string,   // 表示名
  role: 'admin' | 'user', // ロール
  createdAt: Timestamp   // 作成日時
}
```

#### attendances コレクション
```
/attendances/{recordId}
{
  userId: string,        // ユーザーID
  userName: string,      // ユーザー表示名
  type: 'clock_in' | 'clock_out', // 打刻種別
  timestamp: Timestamp,  // 打刻日時
  date: string,          // 日付（YYYY-MM-DD）
  location: {
    latitude: number,    // 緯度
    longitude: number,   // 経度
    address: string      // 住所
  }
}
```

### 4.2 インデックス

| コレクション | フィールド | 用途 |
|--------------|------------|------|
| attendances | userId, date, timestamp | ユーザー別・日付別の記録取得 |
| attendances | date, timestamp | 日付別の全記録取得 |

---

## 5. コンポーネント設計

### 5.1 Composables

#### useAuth
| メソッド/プロパティ | 説明 |
|---------------------|------|
| currentUser | 現在のログインユーザー |
| isAuthenticated | 認証済みかどうか |
| isAdmin | 管理者かどうか |
| isLoading | 読み込み中かどうか |
| login(email, password) | ログイン |
| register(email, password, displayName) | 新規登録 |
| logout() | ログアウト |

#### useAttendance
| メソッド/プロパティ | 説明 |
|---------------------|------|
| todayRecords | 本日の勤怠記録 |
| canClockIn | 出勤可能かどうか |
| canClockOut | 退勤可能かどうか |
| clockIn(location) | 出勤打刻 |
| clockOut(location) | 退勤打刻 |
| subscribeToTodayRecords() | 本日の記録を購読 |

#### useGeolocation
| メソッド/プロパティ | 説明 |
|---------------------|------|
| state | 位置情報の状態 |
| getCurrentPosition() | 現在位置を取得 |
| reset() | 状態をリセット |

---

## 6. ルーティング設計

### 6.1 ルート定義

| パス | コンポーネント | 認証 | ロール |
|------|----------------|------|--------|
| /login | LoginView | 不要 | - |
| /register | RegisterView | 不要 | - |
| / | DashboardView | 必要 | - |
| /attendance | AttendanceView | 必要 | user |
| /admin | AdminView | 必要 | admin |

### 6.2 ナビゲーションガード

```
ログイン前 → 認証必要ページ → /login にリダイレクト
ログイン後 → /login, /register → ロールに応じてリダイレクト
  - admin → /admin
  - user → /attendance
```

---

## 7. セキュリティ設計

### 7.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザードキュメント
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null
                            && request.auth.uid == userId;
    }

    // 勤怠記録
    match /attendances/{recordId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## 8. 外部API連携

### 8.1 OpenStreetMap Nominatim API

| 項目 | 内容 |
|------|------|
| 用途 | 座標から住所への変換（逆ジオコーディング） |
| エンドポイント | https://nominatim.openstreetmap.org/reverse |
| レート制限 | 1リクエスト/秒 |
| 認証 | 不要 |

---

## 9. エラーハンドリング

### 9.1 認証エラー

| エラーコード | 日本語メッセージ |
|--------------|------------------|
| auth/user-not-found | メールアドレスまたはパスワードが正しくありません |
| auth/wrong-password | メールアドレスまたはパスワードが正しくありません |
| auth/invalid-credential | メールアドレスまたはパスワードが正しくありません |
| auth/email-already-in-use | このメールアドレスは既に使用されています |
| auth/weak-password | パスワードは6文字以上で入力してください |
| auth/invalid-email | 有効なメールアドレスを入力してください |

### 9.2 位置情報エラー

| エラー種別 | 日本語メッセージ |
|------------|------------------|
| PERMISSION_DENIED | 位置情報の取得が許可されていません |
| POSITION_UNAVAILABLE | 位置情報を取得できませんでした |
| TIMEOUT | 位置情報の取得がタイムアウトしました |
