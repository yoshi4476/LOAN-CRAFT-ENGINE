---
description: Railway/Vercelへの本番デプロイ手順
---

# 本番デプロイ手順

## Railway（バックエンド）デプロイ

### 前提条件
- Railway CLIがインストール済み、またはGitHub連携設定済み
- PostgreSQLがRailwayで作成済み

### 手順

1. 環境変数を確認
```
必須環境変数:
- DATABASE_URL     (Railway PostgreSQLが自動設定)
- JWT_SECRET       (強力なランダム文字列)
- SUPER_ADMIN_EMAIL
- OPENAI_API_KEY
- NODE_ENV=production
```

2. Gitにコミット
```bash
cd f:\融資支援システム && git add -A && git commit -m "deploy: 更新内容"
```

3. Railwayにプッシュ（GitHub連携の場合は自動デプロイ）
```bash
git push origin main
```

4. デプロイ確認
```bash
curl https://loan-craft-engine-production.up.railway.app/api/health
```

### 確認ポイント
- ヘルスチェックが `{ status: 'ok' }` を返すこと
- DB接続が成功していること（Railwayログで確認）
- フロントエンドからAPI呼び出しが成功すること

## Vercel（フロントエンド）デプロイ

### 前提条件
- Vercel CLIがインストール済み、またはGitHub連携設定済み

### 手順

1. `public/index.html` のAPI基底URLを確認
```javascript
window.LCE_API_BASE = 'https://loan-craft-engine-production.up.railway.app';
```

2. Vercelにデプロイ
```bash
cd f:\融資支援システム\public && vercel --prod
```

### vercel.json 設定
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## デプロイ後チェックリスト

- [ ] `/api/health` が正常応答
- [ ] ログイン・新規登録が動作
- [ ] 企業DNA登録が動作
- [ ] AI生成（OpenAI API）が動作
- [ ] 最高管理者コンソールにアクセス可能
- [ ] データのエクスポート/インポートが動作
