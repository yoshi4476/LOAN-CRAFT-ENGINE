---
name: deployment-operations
description: Railway/Vercelデプロイ、環境変数設定、本番運用、SuperAdmin・SaaS管理の開発・運用を支援するスキル
---

# デプロイ・運用スキル

## 概要

LOAN CRAFT ENGINEのRailway/Vercelデプロイ設定、
本番環境の運用管理、SuperAdminコンソール、SaaS管理機能の開発を支援する。

## 対象ファイル

| ファイル | 役割 |
|---------|------|
| `server/index.js` | Expressサーバー起動・設定 |
| `public/vercel.json` | Vercelデプロイ設定 |
| `.env` / `.env.example` | 環境変数 |
| `package.json` | 依存関係・起動スクリプト |
| `public/js/super-admin.js` | 最高管理者コンソール |
| `public/js/admin.js` | 管理コンソール |
| `public/js/saas-manager.js` | SaaS管理 |

## 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|------------|
| `PORT` | サーバーポート | `3000` |
| `JWT_SECRET` | JWT署名キー | `lce-default-secret` |
| `SUPER_ADMIN_EMAIL` | 最高管理者メール | `y.wakata.linkdesign@gmail.com` |
| `DATABASE_URL` | PostgreSQL接続URL | — |
| `OPENAI_API_KEY` | OpenAI APIキー | — |
| `NODE_ENV` | 環境（production/development） | — |

## デプロイ構成

### Railway（バックエンド）
```
本番URL: https://loan-craft-engine-production.up.railway.app
起動コマンド: npm start → node server/index.js
ヘルスチェック: GET /api/health → { status: 'ok', version: '5.0.0' }
```

### Vercel（フロントエンド）
```json
// public/vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**API接続先**: `window.LCE_API_BASE` で設定（`index.html` 内）

## 起動フロー

```
1. dotenv で環境変数読み込み
2. Express + CORS + JSON設定
3. 静的ファイル配信（public/）
4. PostgreSQL接続 → テーブル自動初期化
5. デフォルトユーザーの自動作成（id=1, super_admin）
6. APIルート登録（6グループ）
7. SPAフォールバック（/ → index.html）
8. PORT でリスン開始
```

## 最高管理者コンソール（SuperAdmin）

```javascript
// コマンド: /最高管理者
SuperAdmin.show()
```

### 機能
- ダッシュボード（ユーザー数、API使用量、コスト）
- ユーザー管理（検索・追加・編集・削除・復元）
- プラン管理（Free/Standard/Premium）
- ライセンスキー自動生成
- 監査ログ閲覧
- API使用量モニタリング

### API
```
GET /api/admin/dashboard   → { totalUsers, activeUsers, planDist, apiStats, expiringSoon, recentLogs }
GET /api/admin/users       → { users[], total, page, limit }
POST /api/admin/users      → { id, licenseKey }
PUT /api/admin/users/:id   → { success: true }
DELETE /api/admin/users/:id → { success: true }（論理削除）
POST /api/admin/users/:id/restore → { success: true }
GET /api/admin/logs        → audit_logs[]
```

## SaaS管理（SaaSManager）

```javascript
// saas-manager.js
SaaSManager.show()
// → プラン管理・課金管理・使用量制限の設定UI
```

## ヘルスチェック

```javascript
// GET /api/health
{ status: 'ok', version: '5.0.0', time: '2026-03-31T00:00:00.000Z' }
```

## 運用監視項目

1. **DB接続**: 起動時に自動チェック（失敗してもサーバーは起動継続）
2. **APIコスト**: `api_usage` テーブルで自動追跡
3. **監査ログ**: `audit_logs` で重要操作を記録
4. **ユーザー有効期限**: `renewal_date` のチェック（30日以内の期限切れを警告）

## ローカル開発

```bash
# 開発サーバー起動（ファイル変更時自動再起動）
npm run dev
# → node --watch server/index.js

# 本番モード起動
npm start
# → node server/index.js
```

## 開発時の注意

- 本番環境ではSSL接続が必須（`ssl: { rejectUnauthorized: false }`）
- デフォルトユーザー（id=1）は自動作成されるため、初回起動時にDBが空でもOK
- `JWT_SECRET` は本番環境では必ず変更すること
- `OPENAI_API_KEY` はDB設定（`settings` テーブル）からもフォールバック取得可能
- CORS設定は `origin: true`（全オリジン許可）— 本番では制限推奨
