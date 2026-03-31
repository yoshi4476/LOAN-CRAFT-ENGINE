---
name: loan-system-architecture
description: LOAN CRAFT ENGINE v5.0のシステム構造・データフロー・モジュール依存関係を理解し、効率的な開発を支援するスキル
---

# LOAN CRAFT ENGINE v5.0 — システムアーキテクチャスキル

## プロジェクト概要

**LOAN CRAFT ENGINE v5.0** は、日本の中小企業向け融資獲得を包括的に支援するAIプラットフォーム。
銀行審査の逆算型アプローチで、企業情報登録→格付け診断→資料作成→戦略立案の一貫フローを提供。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| サーバー | Express.js (Node.js) |
| データベース | PostgreSQL (pg ドライバー) |
| 認証 | JWT (jsonwebtoken) + bcryptjs |
| AI | OpenAI API (gpt-4o-mini / gpt-4o) |
| フロントエンド | バニラ HTML/CSS/JavaScript |
| PDF生成 | html2pdf.js (CDN) |
| デプロイ | Railway (バックエンド) / Vercel (フロントエンド) |

## ディレクトリ構造

```
f:\融資支援システム\
├── server/                     # バックエンド
│   ├── index.js                # Expressサーバー起動・ルーティング
│   ├── db.js                   # PostgreSQL接続・テーブル初期化・SQLヘルパー
│   ├── middleware/
│   │   └── auth.js             # JWT認証・デフォルトユーザー・super_admin検証
│   ├── routes/
│   │   ├── auth.js             # 認証（登録・ログイン・/me）
│   │   ├── company.js          # 企業DNA（CRUD）
│   │   ├── data.js             # 格付け結果・案件データ
│   │   ├── ai.js               # OpenAI APIプロキシ・コスト追跡
│   │   ├── admin.js            # 最高管理者（ユーザーCRUD・監査ログ）
│   │   └── features.js         # ドキュメント保存・学習データ・スケジュール
│   └── data/
│       └── lce.db              # SQLite（レガシー。PostgreSQLに移行済み）
├── public/                     # フロントエンド
│   ├── index.html              # メインSPA
│   ├── login.html              # ログインページ
│   ├── css/style.css           # グローバルCSS（51KB）
│   ├── js/                     # フロントエンドモジュール（25ファイル）
│   └── vercel.json             # Vercelデプロイ設定
├── package.json                # 依存関係定義
├── .env                        # 環境変数（SECRET）
└── .env.example                # 環境変数テンプレート
```

## フロントエンドモジュール一覧

各モジュールはグローバルオブジェクト（シングルトン）として定義。

| モジュール | ファイル | 役割 |
|-----------|---------|------|
| `App` | app.js | メインコントローラー・コマンドシステム・UI管理 |
| `ApiClient` | api-client.js | サーバーAPI通信クライアント |
| `Utils` | utils.js | ユーティリティ関数群 |
| `Database` | database.js | ローカルストレージ管理・データ永続化 |
| `CompanyDNA` | company-dna.js | 企業DNA情報のインタビュー・登録 |
| `Interview` | interview.js | 初回ヒアリング・チャットUI・実態BS |
| `Rating` | rating.js | 格付け自己査定・AI分析 |
| `Matrix` | matrix.js | 審査マトリックス判定 |
| `AssessmentModes` | assessment-modes.js | 8方式の審査モード切替 |
| `LoanSelector` | loan-selector.js | 最適融資手段の選定 |
| `DocGenerator` | doc-generator.js | AI融資資料生成エンジン（最大149KB） |
| `DocLearning` | doc-learning.js | 融資資料学習エンジン |
| `Documents` | documents.js | 個別資料テンプレート生成 |
| `Strategy` | strategy.js | 総合戦略・面談準備・金利交渉 |
| `Extra` | extra.js | 劣後ローン・リスケ復活・比較・チェックリスト |
| `FinancialAnalysis` | financial-analysis.js | 決算書分析・AIレポート |
| `BankDatabase` | bank-database.js | 金融機関データベース |
| `ScenarioCompare` | scenario-compare.js | シナリオ比較分析 |
| `Schedule` | schedule.js | 面談スケジュール管理 |
| `Glossary` | glossary.js | 融資用語辞典 |
| `Guide` | guide.js | 総合ガイド |
| `Admin` | admin.js | 管理コンソール |
| `SuperAdmin` | super-admin.js | 最高管理者コンソール |
| `SaaSManager` | saas-manager.js | SaaS管理機能 |

## DBスキーマ（PostgreSQL）

12テーブルが `server/db.js` の `getDb()` 関数で自動初期化：

| テーブル | 主要カラム | 用途 |
|---------|-----------|------|
| `users` | id, name, email, password_hash, plan, role, status | ユーザー管理 |
| `company_data` | user_id, data (JSON) | 企業DNA情報 |
| `rating_results` | user_id, score, grade, mode, detail | 格付け結果 |
| `cases` | user_id, case_id, institution, amount | 融資案件 |
| `settings` | key, value | システム設定 |
| `audit_logs` | user_id, action, detail, ip | 監査ログ |
| `api_usage` | user_id, model, input_tokens, output_tokens, cost | AI利用コスト |
| `license_keys` | user_id, license_key, plan, expires_at | ライセンス |
| `file_versions` | user_id, file_name, version, content | ファイル版管理 |
| `saved_documents` | user_id, doc_id, doc_name, content, mode | 保存済み資料 |
| `learning_cases` | user_id, result, bank, amount, fail_reason | 学習データ |
| `schedules` | user_id, title, date, time, type, bank | スケジュール |

## API エンドポイント一覧

| パス | メソッド | 認証 | 概要 |
|------|---------|------|------|
| `/api/health` | GET | 不要 | ヘルスチェック |
| `/api/auth/register` | POST | 不要 | 新規登録 |
| `/api/auth/login` | POST | 不要 | ログイン |
| `/api/auth/me` | GET | 必要 | 自分の情報 |
| `/api/company` | GET/PUT | 必要 | 企業DNA取得/更新 |
| `/api/data/rating` | GET/POST | 必要 | 格付け結果一覧/登録 |
| `/api/data/rating/latest` | GET | 必要 | 最新格付け |
| `/api/data/cases` | GET/POST | 必要 | 案件一覧/登録 |
| `/api/ai/generate` | POST | 必要 | OpenAI APIプロキシ |
| `/api/ai/usage` | GET | 必要 | API使用量 |
| `/api/ai/settings` | PUT | 必要 | AIキー/モデル設定 |
| `/api/admin/dashboard` | GET | super_admin | 管理ダッシュボード |
| `/api/admin/users` | CRUD | super_admin | ユーザー管理 |
| `/api/admin/logs` | GET | super_admin | 監査ログ |
| `/api/features/documents` | CRUD | 必要 | ドキュメント保存 |
| `/api/features/learning` | CRUD | 必要 | 学習データ |
| `/api/features/schedules` | CRUD | 必要 | スケジュール |

## 認証フロー

1. **デフォルトモード**: トークンなし → `user_id=1` (super_admin) として自動認証
2. **JWT認証**: `Authorization: Bearer <token>` ヘッダーで認証
3. **super_admin**: `SUPER_ADMIN_EMAIL` 環境変数で指定されたメールのみ

## コマンドシステム

`App.commands` 配列で50以上のコマンドを定義。`/` プレフィックスで始まるコマンドを入力→対応する関数を実行。

**主要カテゴリ**:
- **基本**: `/DNA`, `/start`, `/診断`, `/マトリックス`, `/融資方法`, `/資料`
- **戦略**: `/戦略`, `/面談準備`, `/金利交渉`, `/保証解除`, `/チェック`
- **AI**: `/AI戦略`, `/AI格付け`, `/AI面談`, `/AI決算`, `/AI交渉`, `/AI整合`
- **ツール**: `/比較`, `/レーダー`, `/審査方式`, `/金融機関`, `/シナリオ`, `/案件`
- **管理**: `/管理`, `/最高管理者`, `/エクスポート`, `/インポート`

## 新機能追加パターン

1. **サーバー側**:
   - `server/routes/` にルートファイル追加
   - `server/db.js` にテーブル追加
   - `server/index.js` にルート登録

2. **フロントエンド側**:
   - `public/js/` にモジュールファイル追加
   - `public/index.html` に `<script>` タグ追加
   - `App.commands` にコマンド追加
   - サイドバーに `nav-item` 追加

3. **スタイリング**:
   - `public/css/style.css` にCSS追加

## 開発時の注意点

- すべてのDB操作は `async/await` で実行
- SQLは `convertSql()` でSQLite構文→PostgreSQL構文に自動変換
- フロントエンドのデータはローカルストレージとサーバーの二重管理
- `html2pdf.js` はCDNから読み込み（バンドル不要）
- API基底URLは `window.LCE_API_BASE` で設定
