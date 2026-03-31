---
name: document-generation
description: OpenAI APIを活用した融資申請資料の自動生成・整合チェック・学習エンジンの開発を支援するスキル
---

# AI融資資料生成スキル

## 概要

日本の銀行融資申請に必要な各種書類をAIで自動生成し、
資料間の整合性チェックと学習機能を提供する。

## 対象モジュール

| モジュール | ファイル | サイズ |
|-----------|---------|-------|
| `DocGenerator` | `public/js/doc-generator.js` | 150KB（最大モジュール） |
| `DocLearning` | `public/js/doc-learning.js` | 29KB |
| `Documents` | `public/js/documents.js` | 25KB |

## 生成可能な資料（10種類）

| 資料ID | 資料名 | コマンド |
|--------|-------|---------|
| `executive` | エグゼクティブサマリー | `/資料 エグゼクティブサマリー` |
| `company` | 企業概要書 | `/資料 企業概要書` |
| `cashflow` | 資金繰り表 | `/資料 資金繰り表` |
| `bizplan` | 事業計画書 | `/資料 事業計画書` |
| `debtlist` | 借入金一覧表 | `/資料 借入金一覧` |
| `repayplan` | 返済計画書 | `/資料 返済計画` |
| `performance` | 業績推移表 | `/資料 業績推移` |
| `profile` | 代表者プロフィール | `/資料 代表者プロフィール` |
| `deepening` | 取引深耕提案書 | `/資料 取引深耕` |
| `qa` | Q&A（想定質問集） | `/資料 Q&A` |

## 資料生成フロー

```
1. /資料 コマンド実行
2. DocGenerator.showMenu() → 資料選択UI表示
3. ユーザーが資料を選択
4. Documents.generate(docId) → 資料テンプレート生成
   └─ 企業DNA（company_data）から自動データ挿入
5. AI生成の場合 → ApiClient.aiGenerate() で本文生成
6. 表示 → 編集 → 保存（saved_documents テーブル）
7. PDF出力 → html2pdf.js で変換
```

## 整合チェック機能

### 手動チェック
```javascript
// コマンド: /整合チェック
DocGenerator.runConsistencyCheck()
// → 各資料間の数値（売上高、利益、借入金等）の一致を検証
```

### AI整合チェック
```javascript
// コマンド: /AI整合
Extra.aiConsistencyCheck()
// → OpenAI APIで全資料を横断分析し矛盾点を検出
```

## 学習エンジン（DocLearning）

融資の成功/失敗事例から学習し、資料作成の精度を向上させる。

### データ構造
```javascript
{
  result: 'success' | 'fail',  // 結果
  bank: '三井住友銀行',        // 金融機関
  amount: 5000,                // 金額（万円）
  fail_reason: '',             // 失敗理由
  memo: '',                    // メモ
  company_snapshot: {},        // 企業DNA スナップショット
  doc_snapshot: {}             // 提出資料スナップショット
}
```

### 統計API
```
GET /api/features/learning/stats
→ { total, success, fail, successRate, failReasons[] }
```

## 保存済み資料管理

```javascript
// コマンド: /保存資料
DocGenerator.showSavedDocuments()

// API
GET    /api/features/documents          // 一覧
GET    /api/features/documents/:docId   // 個別取得
PUT    /api/features/documents/:docId   // 保存（upsert）
DELETE /api/features/documents/:id      // 削除
```

## PDF出力

```javascript
// html2pdf.js を使用
html2pdf().set({
  margin: 10,
  filename: '融資資料.pdf',
  html2canvas: { scale: 2 },
  jsPDF: { unit: 'mm', format: 'a4' }
}).from(element).save();
```

## 印刷機能

```javascript
// コマンド: /印刷
Extra.printDocuments()
// → window.print() でブラウザ印刷ダイアログ
```

## 開発時の注意

- `doc-generator.js` は150KBの最大モジュール。変更時は影響範囲に注意
- 資料テンプレートは `Documents` モジュールで定義
- AI生成時のプロンプトは各資料タイプごとにカスタマイズ
- 保存は `saved_documents` テーブル（サーバー）とlocalStorage（クライアント）の二重管理
- 資料のバージョン管理は `file_versions` テーブルで対応可能
