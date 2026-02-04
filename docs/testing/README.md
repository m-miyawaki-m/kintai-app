# テスト管理

## 概要

このディレクトリはブランチごとのテストケース、テスト結果、修正内容を管理します。

## ディレクトリ構造

```
docs/testing/
├── README.md                    # このファイル
├── _templates/                  # テンプレート
│   ├── TEST_CASES_TEMPLATE.md
│   ├── TEST_REPORT_TEMPLATE.md
│   └── CHANGES_TEMPLATE.md
├── feature-issue-1-xxx/         # ブランチごとのディレクトリ
│   ├── TEST_CASES.md            # テストケース
│   ├── TEST_REPORT.md           # テスト結果
│   └── CHANGES.md               # 修正内容
└── ...
```

## ブランチディレクトリの命名規則

- ブランチ名の `/` を `-` に置換
- 例: `feature/issue-1-supervisor-role` → `feature-issue-1-supervisor-role`

## 新規ブランチでの作業開始時

1. ブランチ用ディレクトリを作成
   ```bash
   mkdir docs/testing/feature-issue-{番号}-{概要}
   ```

2. テンプレートをコピー
   ```bash
   cp docs/testing/_templates/*.md docs/testing/feature-issue-{番号}-{概要}/
   ```

3. 各ファイルを記入
   - `TEST_CASES.md`: テストケースを定義
   - `TEST_REPORT.md`: テスト実施結果を記録
   - `CHANGES.md`: 修正内容を記録

## テストケースID命名規則

- `TC-{機能コード}-{連番}`
- 機能コード:
  - `AUTH`: 認証機能
  - `ATT`: 勤怠打刻機能
  - `SUP`: 主任機能
  - `ADM`: 管理者機能

## バグID命名規則

- `BUG-{連番}`
- 詳細は `docs/BUG_TRACKING.md` に記録
