---
name: financial-analysis
description: 日本の融資審査に特化した財務分析・格付け診断機能の開発・保守を支援するスキル。格付け自己査定、8審査方式、決算分析、マトリックス判定に対応。
---

# 財務分析・格付け診断スキル

## 概要

日本の銀行融資審査で使用される格付け・財務分析ロジックに基づき、
企業の融資適格性を多角的に評価する機能群の開発を支援する。

## 対象モジュール

| モジュール | ファイル | サイズ |
|-----------|---------|-------|
| `Rating` | `public/js/rating.js` | 28KB |
| `Matrix` | `public/js/matrix.js` | 14KB |
| `AssessmentModes` | `public/js/assessment-modes.js` | 14KB |
| `FinancialAnalysis` | `public/js/financial-analysis.js` | 15KB |
| `BankDatabase` | `public/js/bank-database.js` | 9KB |
| `ScenarioCompare` | `public/js/scenario-compare.js` | 9KB |

## 格付けシステム

### 格付けグレード体系
```
S+ (90点以上) → 最優良: 最低金利、無担保
S  (80-89点)  → 優良
A  (70-79点)  → 良好
B  (60-69点)  → 普通
C  (50-59点)  → 注意: 保証協会活用推奨
D  (40-49点)  → 要改善
E  (30-39点)  → 危険
F  (30点未満) → 融資困難
```

### 評価項目（日本の銀行審査基準準拠）
1. **定量分析**（財務指標）
   - 自己資本比率、流動比率、当座比率
   - 売上高経常利益率、営業利益率
   - 債務償還年数、借入金月商倍率
   - インタレストカバレッジレシオ
   - キャッシュフロー・損益分岐点

2. **定性分析**
   - 業歴、業種の安定性
   - 経営者の資質・後継者
   - 取引先の分散度
   - 市場環境・競合状況

### 8つの審査方式（AssessmentModes）
```javascript
// assessment-modes.js で定義
const MODES = [
  'standard',           // 標準モード（デフォルト）
  'cash_flow',          // キャッシュフロー重視
  'collateral',         // 担保重視
  'growth',             // 成長性重視
  'rehabilitation',     // 企業再生
  'startup',            // 創業・新規事業
  'government',         // 政府系金融
  'micro'               // 小規模事業者
];
```

## 実態BS分析

実態バランスシートの分析フロー:
1. 企業DNA（company_data）から財務情報を取得
2. 資産の時価評価（含み損益の調整）
3. 実態自己資本の算出
4. 債務超過チェック

## 決算書分析（FinancialAnalysis）

```javascript
// コマンド: /決算分析
FinancialAnalysis.showUploadForm()  // 手動入力フォーム表示

// コマンド: /AI決算
FinancialAnalysis.aiAnalyzeFinancials()  // AIによる決算分析
```

## AI統合

### AI格付け分析
```javascript
// コマンド: /AI格付け
Rating.aiAnalyzeRating()
// → OpenAI APIに格付け結果と企業データを送信
// → 改善提案・比較分析・リスク評価を生成
```

### APIフロー
1. フロントエンド → `ApiClient.aiGenerate(messages, options)`
2. → `POST /api/ai/generate` 
3. → OpenAI API
4. → `api_usage` テーブルにコスト記録
5. → レスポンスを返却

## DB格納先

| データ | テーブル | 備考 |
|-------|---------|------|
| 格付け結果 | `rating_results` | score, grade, mode, detail(JSON) |
| 企業財務 | `company_data` | data(JSON) 内に financials[] |
| 案件記録 | `cases` | institution, amount, result |

## 開発時の注意

- 格付けスコアのロジック変更は `Rating` モジュール内で完結
- `AssessmentModes` はモード別に重み付けを変更する設計
- 金融機関DBは `BankDatabase` にハードコーディング
- シナリオ比較は複数条件のシミュレーション結果を並列表示
- すべてのAI呼び出しは `ApiClient.aiGenerate()` 経由で行う
