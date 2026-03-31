---
name: loan-strategy
description: 融資獲得のための総合戦略立案、面談準備、金利交渉、経営者保証解除の開発を支援するスキル
---

# 融資戦略・面談支援スキル

## 概要

日本の銀行融資における戦略立案から面談準備、金利交渉、
経営者保証解除まで一貫した支援機能群の開発を支援する。

## 対象モジュール

| モジュール | ファイル | サイズ |
|-----------|---------|-------|
| `Strategy` | `public/js/strategy.js` | 24KB |
| `LoanSelector` | `public/js/loan-selector.js` | 18KB |
| `Extra` | `public/js/extra.js` | 28KB |
| `Schedule` | `public/js/schedule.js` | 9KB |
| `Interview` | `public/js/interview.js` | 36KB |

## 戦略レポート機能群

### 総合戦略レポート
```javascript
// コマンド: /戦略
Strategy.generateFullReport()
// → 企業DNA + 格付け結果を元に包括的な融資戦略を生成

// コマンド: /AI戦略
Strategy.aiStrategyReport()
// → OpenAI APIで高度な戦略レポートを生成
```

### 面談準備
```javascript
// コマンド: /面談準備
Strategy.showMeetingPrep()
// → 銀行担当者との面談前の準備チェックリスト

// コマンド: /AI面談
Interview.aiSimulateMeeting()
// → AI銀行担当者との面談シミュレーション
```

### 金利交渉
```javascript
// コマンド: /金利交渉
Strategy.showInterestRateNegotiation()
// → 現在の格付けに基づく金利交渉ポイント

// コマンド: /AI交渉
Strategy.aiNegotiationStrategy()
// → AIによる金利交渉戦略の生成
```

### 経営者保証解除
```javascript
// コマンド: /保証解除
Strategy.showGuaranteeRemoval()
// → ガイドライン準拠の保証解除戦略

// コマンド: /AI保証
Strategy.aiGuaranteeAdvice()
// → AI保証解除アドバイス
```

## 融資手段選定（LoanSelector）

企業の状況に応じた最適な融資手段を提案:

### 融資種別
- **プロパー融資**: 銀行独自審査（格付けB以上推奨）
- **保証協会付き融資**: 信用保証協会の保証を活用
- **日本政策金融公庫**: 政府系金融機関
- **制度融資**: 自治体の制度融資
- **ファクタリング**: 売掛金の資金化
- **ABL**: 動産・債権担保融資

### 特殊融資制度
```javascript
// コマンド: /保証協会
LoanSelector.showGuaranteeDetail()
// → 信用保証協会の各種制度詳細

// コマンド: /企業価値担保
LoanSelector.showEnterpriseValueCollateral()
// → 2024年施行の企業価値担保権制度

// コマンド: /劣後ローン
Extra.showSubordinatedLoan()
// → 資本性劣後ローンの活用戦略

// コマンド: /リスケ復活
Extra.showRescheduleRecovery()
// → リスケジュール後の新規融資獲得戦略
```

## 提出前チェック

```javascript
// コマンド: /チェック
Extra.showPreSubmitChecklist()
// → 融資申請前の最終確認リスト（手動）

// コマンド: /AI提出
Extra.aiPreSubmitCheck()
// → AIによる提出前の包括的チェック
```

## スケジュール管理

```javascript
// コマンド: /スケジュール
Schedule.show()

// API
GET    /api/features/schedules          // 一覧（from/to絞り込み）
POST   /api/features/schedules          // 追加
PUT    /api/features/schedules/:id      // 更新
DELETE /api/features/schedules/:id      // 削除
POST   /api/features/schedules/:id/toggle // 完了トグル
```

### スケジュールデータ構造
```javascript
{
  title: '三井住友銀行面談',
  date: '2026-04-15',
  time: '14:00',
  type: 'meeting',    // meeting, deadline, other
  bank: '三井住友銀行',
  memo: '決算書持参',
  completed: 0
}
```

## 比較分析

```javascript
// コマンド: /比較
Extra.showComparison()
// → 複数の融資手段を並列比較

// コマンド: /レーダー
Extra.renderRadarChart()
// → 企業の財務状況をレーダーチャートで可視化
```

## おすすめアクション

```javascript
// コマンド: /次へ
Extra.suggestNextAction()
// → 現在の進捗状況に応じた次のステップを提案
```

## 開発時の注意

- 戦略ロジックは日本の融資制度に準拠（保証協会、公庫等）
- AI生成コンテンツは必ず `ApiClient.aiGenerate()` 経由
- スケジュールはサーバー保存（`schedules` テーブル）とローカルストレージの併用
- 面談シミュレーションはチャット形式のインタラクティブUI
- 企業価値担保権は2024年法制化の最新制度
