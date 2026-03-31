---
description: ローカル開発サーバーの起動と動作確認手順
---

# 開発サーバー起動

// turbo-all

## 手順

1. 環境変数の確認
```bash
type f:\融資支援システム\.env
```

2. 依存関係のインストール
```bash
cd f:\融資支援システム && npm install
```

3. 開発サーバーの起動（ファイル変更時自動再起動）
```bash
cd f:\融資支援システム && npm run dev
```

4. ヘルスチェック
```bash
curl http://localhost:3000/api/health
```

## 確認ポイント
- コンソールに `LOAN CRAFT ENGINE v5.0 — Server` が表示されること
- `✅ DB接続成功` が表示されること
- `http://localhost:3000` でフロントエンドが表示されること
- `/api/health` が `{ status: 'ok' }` を返すこと
