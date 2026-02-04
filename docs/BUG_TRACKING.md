# バグ・修正管理表

## 概要

このドキュメントは勤怠管理アプリで発見されたバグ、および実施した修正を管理します。

## バグID命名規則

- `BUG-{連番}`: バグID
- ステータス: `OPEN` / `IN_PROGRESS` / `RESOLVED` / `CLOSED` / `WONTFIX`
- 優先度: `Critical` / `High` / `Medium` / `Low`

---

## バグ一覧

| BUG ID | タイトル | ステータス | 優先度 | 発見日 | 解決日 | 関連Issue |
|--------|---------|----------|--------|--------|--------|-----------|
| BUG-001 | 主任のroleが'user'として保存される | RESOLVED | High | 2025-02-05 | 2025-02-05 | #1 |

---

## バグ詳細

### BUG-001: 主任のroleが'user'として保存される

| 項目 | 内容 |
|------|------|
| **ステータス** | RESOLVED |
| **優先度** | High |
| **発見日** | 2025-02-05 |
| **解決日** | 2025-02-05 |
| **発見者** | - |
| **関連Issue** | #1 |

#### 現象

supervisor@example.com でログインしても、`role` が `'user'` として取得され、配下メンバーの勤怠状況セクションが表示されない。

コンソールログ:
```
State: User data fetched {uid: '...', email: 'supervisor@example.com', displayName: '鈴木 一郎', role: 'user', subordinates: [...]}
```

`subordinates` 配列は存在するが、`role` が `'supervisor'` ではなく `'user'` になっている。

#### 原因

Cloud Functions の `onUserCreate` トリガーが、シードスクリプトで設定した正しい role を上書きしていた。

`functions/src/index.ts`:
```typescript
// 問題のコード
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const userDoc = {
    // ...
    role: 'user' as const,  // 常に 'user' で上書き
  }
  await db.collection('users').doc(user.uid).set(userDoc)  // 既存ドキュメントを上書き
})
```

タイミング問題:
1. シードスクリプトがAuthユーザー作成
2. シードスクリプトがFirestoreに `role: 'supervisor'` で保存
3. Cloud Function `onUserCreate` が非同期で実行され、`role: 'user'` で上書き

#### 修正内容

1. **Cloud Functions修正** (`functions/src/index.ts`)
   - `onUserCreate` で既存ドキュメントの存在チェックを追加
   - 既存ドキュメントがある場合はスキップ

```typescript
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const docRef = db.collection('users').doc(user.uid)

  // Check if document already exists
  const existingDoc = await docRef.get()
  if (existingDoc.exists) {
    functions.logger.info(`User document already exists for ${user.uid}, skipping`)
    return
  }
  // ... create new document
})
```

2. **シードスクリプト修正** (`scripts/seed.mjs`)
   - Cloud Functions完了を待つ時間を追加（2秒）
   - 全ユーザー作成後にロールの検証・修正パスを追加

```javascript
async function verifyAndFixRoles() {
  for (const userData of testUsers) {
    const doc = await docRef.get()
    if (data.role !== userData.role) {
      await docRef.update({ role: userData.role })
    }
  }
}
```

#### 確認方法

1. エミュレータを再起動
2. `npm run seed` を実行
3. シードログで `Role correct for supervisor@example.com: supervisor` を確認
4. supervisor@example.com でログインし、配下メンバーセクションが表示されることを確認

---

## 修正履歴テンプレート

### BUG-XXX: [タイトル]

| 項目 | 内容 |
|------|------|
| **ステータス** | OPEN |
| **優先度** | - |
| **発見日** | YYYY-MM-DD |
| **解決日** | - |
| **発見者** | - |
| **関連Issue** | - |

#### 現象

[バグの具体的な現象を記述]

#### 再現手順

1. [手順1]
2. [手順2]
3. ...

#### 期待される動作

[本来どうあるべきか]

#### 原因

[根本原因の分析]

#### 修正内容

[修正したコードや設定の説明]

#### 確認方法

[修正確認の手順]

---

## 統計

| 項目 | 件数 |
|------|------|
| 総バグ数 | 1 |
| 未解決 (OPEN) | 0 |
| 対応中 (IN_PROGRESS) | 0 |
| 解決済 (RESOLVED) | 1 |
| クローズ (CLOSED) | 0 |
| 対応しない (WONTFIX) | 0 |
