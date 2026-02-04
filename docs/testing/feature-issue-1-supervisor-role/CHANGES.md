# 修正内容: 主任ロールの追加と配下メンバー勤怠表示機能

## 基本情報

| 項目 | 内容 |
|------|------|
| Issue | #1 |
| ブランチ | feature/issue-1-supervisor-role |
| 作成日 | 2025-02-05 |
| マージ日 | - |

---

## 概要

主任（supervisor）ロールを追加し、配下メンバーの勤怠状況をリアルタイムで確認できる機能を実装。

**主な機能:**
- 新しいユーザーロール「supervisor」の追加
- 主任に配下メンバー（subordinates）を紐付け
- 勤怠打刻画面で配下メンバーの勤怠状況をリアルタイム表示
- 自分の勤怠記録にも名前を表示（統一感のため）

---

## 変更ファイル一覧

| ファイル | 変更種別 | 概要 |
|---------|---------|------|
| `src/types/index.ts` | 修正 | User型にsupervisorロールとsubordinates追加 |
| `src/stores/auth.ts` | 修正 | isSupervisor, subordinates getters追加 |
| `src/composables/useAuth.ts` | 修正 | isSupervisor, subordinates公開 |
| `src/views/AttendanceView.vue` | 修正 | 配下メンバー表示セクション追加 |
| `functions/src/index.ts` | 修正 | onUserCreate修正（既存doc上書き防止） |
| `scripts/seed.mjs` | 修正 | supervisor/subordinatesデータ作成 |
| `public/dev-users.json` | 自動生成 | ログイン用ユーザーリスト更新 |
| `docs/SPEC.md` | 修正 | 仕様書に主任ロール追加 |
| `vitest.config.ts` | 新規 | テスト環境設定 |
| `src/stores/__tests__/auth.test.ts` | 新規 | 認証ストアのテスト |
| `src/components/__tests__/AttendanceRecordCard.test.ts` | 新規 | 勤怠カードのテスト |

---

## 詳細な変更内容

### 1. User型の拡張

**対象ファイル:** `src/types/index.ts`

**変更後:**
```typescript
export interface User {
  uid: string
  email: string
  displayName: string
  role: 'user' | 'supervisor' | 'admin'  // supervisorを追加
  subordinates?: string[]  // 配下メンバーのUID配列（新規）
  createdAt: Timestamp
}
```

**変更理由:**
主任ロールと配下メンバーの紐付けを管理するため

---

### 2. 認証ストアの拡張

**対象ファイル:** `src/stores/auth.ts`

**追加したgetters:**
```typescript
getters: {
  isSupervisor: (state) => state.user?.role === 'supervisor',
  subordinates: (state) => state.user?.subordinates ?? [],
}
```

**変更理由:**
コンポーネントから主任判定と配下メンバー取得を容易にするため

---

### 3. 勤怠打刻画面の拡張

**対象ファイル:** `src/views/AttendanceView.vue`

**追加機能:**
- 主任ログイン時に「配下メンバーの勤怠状況」セクションを表示
- Firestore onSnapshot で配下メンバーの勤怠をリアルタイム監視
- 自分の勤怠記録にも名前を表示

**主要なコード:**
```typescript
// 配下メンバーの勤怠を監視
watch(() => authStore.user, async (user) => {
  if (!user || user.role !== 'supervisor' || !user.subordinates?.length) {
    return
  }
  // Firestoreから配下メンバー情報を取得
  // onSnapshotで勤怠記録をリアルタイム監視
}, { immediate: true })
```

---

### 4. Cloud Functions修正

**対象ファイル:** `functions/src/index.ts`

**変更前:**
```typescript
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userDoc = { role: 'user', ... }
  await db.collection('users').doc(user.uid).set(userDoc)  // 常に上書き
})
```

**変更後:**
```typescript
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const existingDoc = await docRef.get()
  if (existingDoc.exists) {
    return  // 既存ドキュメントがあればスキップ
  }
  // 新規作成のみ実行
})
```

**変更理由:**
シードスクリプトで設定したroleをCloud Functionが上書きしてしまうバグを修正

---

### 5. シードスクリプトの拡張

**対象ファイル:** `scripts/seed.mjs`

**追加機能:**
- supervisorユーザーの作成
- subordinates（配下メンバー）の紐付け
- ロール検証・修正パス（Cloud Functions対策）

---

## バグ修正

### BUG-001: 主任のroleが'user'として保存される

| 項目 | 内容 |
|------|------|
| 原因 | Cloud Functions `onUserCreate` がシードスクリプトで設定したroleを上書き |
| 修正内容 | 既存ドキュメントがある場合はスキップするよう修正 |
| 影響範囲 | 新規ユーザー登録時の挙動（既存機能に影響なし） |

---

## データベース変更

| コレクション | フィールド | 変更内容 |
|-------------|----------|---------|
| `users` | `role` | 'supervisor' を選択肢に追加 |
| `users` | `subordinates` | 新規追加（配下メンバーUID配列） |

---

## 設定・環境変更

| 項目 | 変更内容 |
|------|---------|
| package.json | vitest, @vue/test-utils, happy-dom, @vitest/coverage-v8 を追加 |
| vitest.config.ts | テスト環境設定ファイルを新規作成 |

---

## 注意事項・申し送り

1. **シードデータの再投入が必要**
   - エミュレータ再起動後、`npm run seed` でデータを再投入

2. **本番環境への適用時**
   - 既存ユーザーにsupervisorロールを付与する場合は、Firestoreで直接 `role` と `subordinates` を更新

3. **今後の課題**
   - 管理画面でのsupervisor/subordinates設定UI
   - 複数の主任が同一メンバーを配下に持つケースの考慮
