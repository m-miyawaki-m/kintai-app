# テストケース一覧

## 概要

このドキュメントは各ブランチのテストケースへのリンク集です。
詳細なテストケースは各ブランチディレクトリを参照してください。

## ブランチ別テストケース

| Issue | ブランチ | タイトル | ステータス |
|-------|---------|---------|----------|
| #1 | [feature-issue-1-supervisor-role](./feature-issue-1-supervisor-role/) | 主任ロールの追加と配下メンバー勤怠表示機能 | テスト完了 |

## テストケースID命名規則

- `TC-{機能コード}-{連番}`: テストケースID
- 機能コード:
  - `AUTH`: 認証機能
  - `ATT`: 勤怠打刻機能
  - `SUP`: 主任機能
  - `ADM`: 管理者機能

## ディレクトリ構造

```
docs/testing/
├── README.md                    # 概要・運用ルール
├── TEST_CASES.md                # このファイル（リンク集）
├── _templates/                  # テンプレート
│   ├── TEST_CASES_TEMPLATE.md
│   ├── TEST_REPORT_TEMPLATE.md
│   └── CHANGES_TEMPLATE.md
└── feature-issue-{N}-{name}/    # ブランチごとのディレクトリ
    ├── TEST_CASES.md            # テストケース
    ├── TEST_REPORT.md           # テスト結果
    └── CHANGES.md               # 修正内容
```

## 新規ブランチ作成時の手順

1. ブランチ用ディレクトリを作成
   ```bash
   mkdir docs/testing/feature-issue-{番号}-{概要}
   ```

2. テンプレートをコピー
   ```bash
   cp docs/testing/_templates/*.md docs/testing/feature-issue-{番号}-{概要}/
   ```

3. このファイルの「ブランチ別テストケース」テーブルに行を追加
