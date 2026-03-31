---
name: database-management
description: PostgreSQLデータベースとデータ管理機能（ユーザー管理、企業DNA、案件管理、監査ログ等）の開発・保守を支援するスキル
---

# DB・データ管理スキル

## 概要

LOAN CRAFT ENGINEのPostgreSQLデータベース設計・運用と、
ユーザー管理・データ永続化機能の開発を支援する。

## 対象ファイル

| ファイル | 役割 |
|---------|------|
| `server/db.js` | PostgreSQL接続・テーブル初期化・SQLヘルパー |
| `server/routes/auth.js` | 認証API（登録・ログイン） |
| `server/routes/admin.js` | 管理者API（ユーザーCRUD） |
| `server/routes/company.js` | 企業DNA API |
| `server/routes/data.js` | 格付け・案件API |
| `server/routes/features.js` | ドキュメント・学習・スケジュールAPI |
| `public/js/database.js` | ローカルストレージ管理 |
| `public/js/api-client.js` | サーバーAPI通信 |

## PostgreSQL接続

```javascript
// server/db.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

## SQLヘルパー関数

```javascript
// INSERT/UPDATE/DELETE
await dbRun(sql, params)    // → { lastInsertRowid: number }

// SELECT 1行
await dbGet(sql, params)    // → row | null

// SELECT 全行
await dbAll(sql, params)    // → rows[]
```

### SQLite→PostgreSQL 自動変換
`convertSql()` が以下を自動変換:
- `?` → `$1`, `$2`, `$3`...
- `datetime('now')` → `NOW()`
- `datetime('now', '+N days')` → `NOW() + INTERVAL 'N days'`

> ⚠️ `INSERT OR REPLACE` は PostgreSQL 非対応。`ON CONFLICT` 構文への手動変換が必要。

## テーブル一覧と設計指針

### ユーザー管理
```sql
users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- bcryptjs
  plan TEXT DEFAULT 'Free',     -- Free, Standard, Premium
  status TEXT DEFAULT 'Active', -- Active, Suspended, Deleted
  role TEXT DEFAULT 'user',     -- user, admin, super_admin
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  renewal_date TIMESTAMPTZ,
  memo TEXT,
  deleted_at TIMESTAMPTZ,       -- 論理削除
  deleted_by INTEGER,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### データ管理パターン
- **JSON格納**: `company_data.data`, `rating_results.detail` はJSON文字列で格納
- **論理削除**: `users` テーブルは `deleted_at` による論理削除
- **監査ログ**: 重要操作は `audit_logs` に自動記録
- **コスト追跡**: AI API呼び出しは `api_usage` に自動記録

## ローカルストレージ（フロントエンド）

`Database` モジュールがローカルストレージとサーバーの二重管理:

```javascript
// ローカルストレージキー
Database.KEYS = {
  COMPANY_DATA: 'lce_company_data',
  RATING_RESULT: 'lce_rating_result',
  MATRIX_RESULT: 'lce_matrix_result',
  SETTINGS: 'lce_settings',
  PROJECTS: 'lce_projects',
  ACTIVE_PROJECT: 'lce_active_project'
};
```

## 案件管理（マルチプロジェクト）

```javascript
// コマンド: /案件
Database.showProjectSelector()
// → 複数案件の切替・作成・削除

Database.getProjects()         // プロジェクト一覧
Database.getActiveProjectId()  // 現在のプロジェクトID
```

## エクスポート/インポート

```javascript
// コマンド: /エクスポート
Database.exportAll()
// → ローカルストレージの全データをJSONファイルで出力

// コマンド: /インポート
Database.importData()
// → JSONファイルからデータを一括読込
```

## テーブル追加手順

1. `server/db.js` の `getDb()` 内に `CREATE TABLE IF NOT EXISTS` を追加
2. 必要に応じて `server/routes/` にAPIルートを追加
3. `server/index.js` にルート登録: `app.use('/api/新パス', require('./routes/新ルート'))`
4. フロントエンドの `ApiClient` にメソッド追加

## 開発時の注意

- 全DB操作は `async/await` 必須
- エラー時はログ出力のみで例外は投げない設計（`catch` で空配列/null返却）
- `INSERT` 文には自動的に `RETURNING id` が付与される
- SQLiteレガシーの `datetime('now')` は自動変換されるが、`INSERT OR REPLACE` は手動対応が必要
- パスワードは `bcryptjs.hashSync(password, 10)` でハッシュ化
- 本番環境ではSSL接続必須（`rejectUnauthorized: false`）
