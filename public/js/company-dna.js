/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 企業DNAモジュール（Part 1）
 * 3機関（信用保証協会・銀行・公庫）の審査基準を網羅した
 * 包括的企業プロフィール登録システム
 * ============================================================ */

const CompanyDNA = {

  // DNA登録セクション定義
  sections: [
    { id: 'identity', title: '🏢 企業アイデンティティ', icon: '🏢' },
    { id: 'ceo', title: '👤 経営者DNA', icon: '👤' },
    { id: 'business', title: '💼 事業DNA', icon: '💼' },
    { id: 'financial', title: '📊 財務DNA', icon: '📊' },
    { id: 'credit', title: '🔐 信用・取引DNA', icon: '🔐' },
    { id: 'collateral', title: '🏠 担保・保全DNA', icon: '🏠' },
    { id: 'risk', title: '⚠️ リスクDNA', icon: '⚠️' },
    { id: 'growth', title: '🚀 成長・将来性DNA', icon: '🚀' },
  ],

  // 重要度マーク（各機関での重要度）
  // H=最重要, M=重要, L=参考, -=対象外
  importanceLabels: {
    H: { label: '最重要', color: 'var(--accent-red)', icon: '🔴' },
    M: { label: '重要', color: 'var(--accent-gold)', icon: '🟡' },
    L: { label: '参考', color: 'var(--text-muted)', icon: '⚪' },
    '-': { label: '—', color: 'var(--text-muted)', icon: '—' }
  },

  // =========================================================
  // DNA登録フィールド定義
  // imp: { bank: 銀行, cga: 保証協会, jfc: 公庫 }
  // =========================================================
  fields: {
    identity: [
      { key: 'companyName', label: '会社名（正式名称）', type: 'text', required: true, imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'representativeName', label: '代表者氏名', type: 'text', required: true, imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'establishedDate', label: '設立年月', type: 'text', placeholder: '例: 2015年4月', imp: { bank: 'M', cga: 'M', jfc: 'H' } },
      { key: 'yearsInBusiness', label: '業歴（年数）', type: 'number', imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '創業審査では6年以上の業界経験が有利' },
      { key: 'industry', label: '業種', type: 'text', required: true, imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '農林漁業・金融保険業は保証協会対象外' },
      { key: 'industryCode', label: '日本標準産業分類コード', type: 'text', imp: { bank: 'L', cga: 'M', jfc: 'L' } },
      { key: 'corporateForm', label: '法人形態', type: 'select', options: ['株式会社', '合同会社', '合資会社', '合名会社', '個人事業主', 'NPO法人', 'その他'], imp: { bank: 'M', cga: 'M', jfc: 'M' } },
      { key: 'capitalAmount', label: '資本金（万円）', type: 'number', imp: { bank: 'M', cga: 'H', jfc: 'M' }, hint: '中小企業要件の判定に使用（製造業3億円以下等）' },
      { key: 'employeeCount', label: '従業員数', type: 'number', imp: { bank: 'M', cga: 'H', jfc: 'M' }, hint: '中小企業要件の判定に使用（製造業300人以下等）' },
      { key: 'headOfficeAddress', label: '本店所在地', type: 'text', imp: { bank: 'M', cga: 'H', jfc: 'M' }, hint: '保証協会の管轄区域チェックに必要' },
      { key: 'branchAddresses', label: '支店・営業所所在地', type: 'textarea', imp: { bank: 'L', cga: 'M', jfc: 'L' } },
      { key: 'licenses', label: '許認可・資格一覧', type: 'textarea', placeholder: '例: 建設業許可(般-30)第12345号', imp: { bank: 'M', cga: 'H', jfc: 'M' }, hint: '許認可業種は取得済みであることが保証協会の形式要件' },
      { key: 'hasAccountantAdvisor', label: '会計参与の設置', type: 'select', options: ['あり', 'なし'], imp: { bank: 'L', cga: 'M', jfc: 'L' }, hint: '設置企業は保証料0.1%割引の優遇' },
      { key: 'certifiedSupportOrg', label: '認定支援機関との連携', type: 'select', options: ['あり', 'なし', '検討中'], imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '公庫・保証協会の利用時に保証料優遇等のメリット' },
    ],

    ceo: [
      { key: 'ceoAge', label: '代表者年齢', type: 'number', imp: { bank: 'M', cga: 'L', jfc: 'M' } },
      { key: 'ceoIndustryExperience', label: '業界経験年数', type: 'number', imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '★公庫創業融資では6年以上が非常に有利' },
      { key: 'ceoManagementExperience', label: '経営・管理職経験年数', type: 'number', imp: { bank: 'M', cga: 'L', jfc: 'H' } },
      { key: 'ceoCareerHistory', label: '略歴・職歴', type: 'textarea', placeholder: '〇〇大学卒→△△株式会社（営業部長10年）→当社設立', imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '公庫面談で必ず聞かれる' },
      { key: 'ceoQualifications', label: '保有資格', type: 'textarea', placeholder: '例: 中小企業診断士、1級建築士', imp: { bank: 'L', cga: 'L', jfc: 'H' }, hint: '専門資格は公庫で大幅プラス' },
      { key: 'ceoMotivation', label: '創業動機・経営理念', type: 'textarea', imp: { bank: 'L', cga: 'L', jfc: 'H' }, hint: '★公庫面談の必須項目。「なぜこの事業を」に明確に答える' },
      { key: 'ceoPersonality', label: '経営者の特性（自己評価）', type: 'multi-select', options: ['リーダーシップ型', '技術職人型', '営業推進型', '管理堅実型', 'ビジョナリー型', '地域密着型'], imp: { bank: 'M', cga: 'M', jfc: 'H' } },
      { key: 'ceoPersonalAssets', label: '代表者の個人資産（概算・万円）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'M' }, hint: '銀行の実態審査で確認される' },
      { key: 'ceoPersonalDebt', label: '代表者の個人借入（住宅ローン等・万円）', type: 'number', imp: { bank: 'M', cga: 'L', jfc: 'M' } },
      { key: 'ceoSelfFunding', label: '自己資金額（万円）', type: 'number', imp: { bank: 'M', cga: 'L', jfc: 'H' }, hint: '★公庫創業融資：融資額の1/3以上が理想' },
      { key: 'ceoSelfFundingSource', label: '自己資金の出所', type: 'textarea', placeholder: '例: 給与からの積立10年分、退職金', imp: { bank: 'L', cga: '-', jfc: 'H' }, hint: '★公庫は通帳でコツコツ蓄積の履歴を確認' },
      { key: 'hasSuccessor', label: '後継者の有無', type: 'select', options: ['あり（親族）', 'あり（従業員）', 'あり（外部）', 'なし', '未定'], imp: { bank: 'M', cga: 'L', jfc: 'L' } },
      { key: 'ceoCreditHistory', label: '個人信用情報の状態', type: 'select', options: ['問題なし', 'カードローン残高あり', '過去に延滞あり（完済済）', '現在延滞中', '事故情報あり', '不明'], imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '★3機関共通：事故情報があると一発アウト。携帯分割払い延滞も含む' },
      { key: 'previousBusinessFailure', label: '過去の事業失敗経験', type: 'select', options: ['なし', 'あり（完済済）', 'あり（残債あり）'], imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '公庫は再チャレンジにも対応するが、反省と計画が必要' },
    ],

    business: [
      { key: 'businessModel', label: '事業モデルの概要', type: 'textarea', placeholder: '何を、誰に、どうやって提供しているか', imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '公庫面談で「自分の言葉」で説明できるか問われる' },
      { key: 'mainProducts', label: '主力商品・サービス（最大5つ）', type: 'textarea', imp: { bank: 'M', cga: 'M', jfc: 'H' } },
      { key: 'revenueBreakdown', label: '売上構成比', type: 'textarea', placeholder: '例: 製品A 40%, サービスB 35%, その他 25%', imp: { bank: 'M', cga: 'L', jfc: 'M' } },
      { key: 'targetMarket', label: 'ターゲット市場・顧客層', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'H' } },
      { key: 'competitiveAdvantage', label: '★競争優位性（同業他社との差別化）', type: 'textarea', imp: { bank: 'H', cga: 'M', jfc: 'H' }, hint: '★公庫面談必須：「同業他社との違いは?」に明確に答える' },
      { key: 'marketGrowth', label: '市場の成長性', type: 'select', options: ['高成長（年10%超）', '成長（年3-10%）', '安定（横ばい）', '縮小傾向', '大幅縮小'], imp: { bank: 'M', cga: 'L', jfc: 'H' } },
      { key: 'marketShare', label: '市場シェア・ポジション', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'M' } },
      { key: 'entryBarriers', label: '参入障壁', type: 'textarea', placeholder: '例: 特許技術、規制ライセンス、独自ネットワーク', imp: { bank: 'M', cga: 'L', jfc: 'M' } },
      { key: 'ipAssets', label: '知的財産・特許', type: 'textarea', placeholder: '例: 特許第1234567号（〇〇製造方法）', imp: { bank: 'M', cga: 'L', jfc: 'H' }, hint: '企業価値担保権では無形資産の価値が重要' },
      { key: 'topClients', label: '主要取引先（上位5社と売上比率）', type: 'textarea', placeholder: '例: A社 30%, B社 20%, C社 15%', imp: { bank: 'H', cga: 'M', jfc: 'M' }, hint: '取引先の分散度は銀行が重視' },
      { key: 'topSuppliers', label: '主要仕入先', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'L' } },
      { key: 'clientConcentrationRisk', label: '売上先集中リスク（最大取引先の売上比率%）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'M' }, hint: '1社50%超は高リスクと判定' },
      { key: 'monthlyAccounting', label: '月次決算の実施', type: 'select', options: ['毎月実施', '四半期', '半期', '年次のみ'], imp: { bank: 'H', cga: 'L', jfc: 'M' }, hint: '★銀行が非常に重視する管理体制の指標' },
      { key: 'localContribution', label: '地域貢献（雇用・地域経済への影響）', type: 'textarea', imp: { bank: 'L', cga: 'L', jfc: 'M' }, hint: '信金・信組のリレーションシップ審査で重要' },
    ],

    financial: [
      { key: 'annualRevenue', label: '年商（万円）', type: 'number', required: true, imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'operatingProfit', label: '営業利益（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '★銀行：営業赤字は「本業で稼げない」と判断。即大幅減点' },
      { key: 'ordinaryProfit', label: '経常利益（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'netIncome', label: '税引後利益（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'totalAssets', label: '総資産（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'M' } },
      { key: 'netAssets', label: '純資産（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'M' }, hint: '★債務超過（マイナス）は銀行格付け一発急落' },
      { key: 'totalDebt', label: '有利子負債合計（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'depreciation', label: '減価償却費（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'M' } },
      { key: 'interestExpense', label: '支払利息（万円）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'L' } },
      { key: 'currentAssets', label: '流動資産（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'M' } },
      { key: 'currentLiabilities', label: '流動負債（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'M' } },
      { key: 'receivables', label: '売掛金（万円）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'L' } },
      { key: 'inventory', label: '棚卸資産（万円）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'L' } },
      { key: 'payables', label: '買掛金（万円）', type: 'number', imp: { bank: 'M', cga: 'M', jfc: 'L' } },
      { key: 'monthlyRepayment', label: '月額返済額（万円）', type: 'number', imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'crdGuaranteeFeeRate', label: '直近の保証料率（%）', type: 'number', imp: { bank: 'L', cga: 'H', jfc: '-' }, hint: '★保証料率=自社のCRDランク通信簿。1.00%以下なら上位評価' },
      { key: 'consecutiveProfitYears', label: '連続黒字年数', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'M' }, hint: '3期連続減収は銀行で厳しい評価' },
      { key: 'grossProfitMargin', label: '売上総利益率（%）', type: 'number', imp: { bank: 'M', cga: 'M', jfc: 'L' } },
    ],

    credit: [
      { key: 'mainBank', label: 'メインバンク', type: 'text', imp: { bank: 'H', cga: 'M', jfc: 'M' } },
      { key: 'mainBankYears', label: 'メインバンク取引年数', type: 'number', imp: { bank: 'H', cga: 'L', jfc: 'L' } },
      { key: 'bankRelationships', label: '取引金融機関一覧', type: 'textarea', placeholder: '機関名 / 融資残高 / 取引年数', imp: { bank: 'H', cga: 'M', jfc: 'M' } },
      { key: 'guaranteeAssocUsage', label: '保証協会利用状況', type: 'select', options: ['未利用', '利用中（正常返済）', '利用中（条件変更あり）', '過去に利用（完済済）', '代位弁済履歴あり'], imp: { bank: 'M', cga: 'H', jfc: 'M' }, hint: '★代位弁済の求償権残があると保証協会は原則不可' },
      { key: 'guaranteeBalance', label: '保証協会保証残高（万円）', type: 'number', imp: { bank: 'L', cga: 'H', jfc: '-' }, hint: '一般保証枠2.8億円に対する残高' },
      { key: 'guaranteeCapacity', label: '保証枠の余力', type: 'select', options: ['十分あり', '半分程度', 'ほぼ上限', '枠なし'], imp: { bank: 'M', cga: 'H', jfc: '-' } },
      { key: 'existingLoanRepayStatus', label: '既存融資の返済状況', type: 'select', options: ['全て正常返済', '一部遅延あり', '条件変更（リスケ）中', '条件変更から正常化済'], imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'jfcExistingLoan', label: '公庫の既存融資', type: 'select', options: ['なし', 'あり（正常返済）', 'あり（遅延あり）'], imp: { bank: 'L', cga: 'L', jfc: 'H' } },
      { key: 'bankPassbook6m', label: '通帳6ヶ月分の提出可否', type: 'select', options: ['提出可能', '一部のみ可能', '困難'], imp: { bank: 'L', cga: '-', jfc: 'H' }, hint: '★公庫は必ず通帳を確認。自己資金の蓄積過程を見る' },
      { key: 'antiSocialCheck', label: '反社会的勢力との関係', type: 'select', options: ['一切なし', '不明'], imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '3機関共通：反社関連は一発アウト' },
    ],

    collateral: [
      { key: 'realEstateOwned', label: '保有不動産', type: 'textarea', placeholder: '所在地 / 種類 / 面積 / 概算評価額', imp: { bank: 'H', cga: 'M', jfc: 'L' } },
      { key: 'realEstateValue', label: '不動産評価額合計（万円）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'L' }, hint: '銀行：掛目は住宅地70%、商業地60%、工業地50%' },
      { key: 'existingMortgageBalance', label: '不動産上の既存担保残高（万円）', type: 'number', imp: { bank: 'H', cga: 'M', jfc: 'L' }, hint: '先順位の残高を控除した余力が融資限度' },
      { key: 'depositCollateral', label: '預金担保の可否（万円）', type: 'number', imp: { bank: 'M', cga: 'L', jfc: 'L' }, hint: '掛目100%' },
      { key: 'receivablesForABL', label: 'ABL対象売掛金（万円）', type: 'number', imp: { bank: 'M', cga: 'L', jfc: '-' }, hint: 'ABL担保：掛目70〜90%' },
      { key: 'inventoryForABL', label: 'ABL対象在庫（万円）', type: 'number', imp: { bank: 'M', cga: 'L', jfc: '-' }, hint: 'ABL担保：掛目30〜70%' },
      { key: 'personalGuaranteeWillingness', label: '経営者保証の意向', type: 'select', options: ['提供可能', '提供したくない', '解除を希望'], imp: { bank: 'H', cga: 'M', jfc: 'M' } },
      { key: 'insuranceSurrenderValue', label: '生命保険解約返戻金（万円）', type: 'number', imp: { bank: 'M', cga: 'L', jfc: 'L' } },
    ],

    risk: [
      { key: 'taxDelinquency', label: '税金・社会保険の滞納', type: 'select', options: ['なし', '分納中', '滞納あり（消費税）', '滞納あり（法人税）', '滞納あり（地方税）', '滞納あり（社会保険）'], imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '★保証協会：税金滞納は原則一発アウト。銀行・公庫も大幅マイナス' },
      { key: 'rescheduleHistory', label: 'リスケジュール履歴', type: 'select', options: ['なし', '過去にあり（正常化済）', '現在進行中'], imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'recentRejection', label: '直近1年の融資否決歴', type: 'select', options: ['なし', 'あり（1回）', 'あり（複数回）'], imp: { bank: 'H', cga: 'M', jfc: 'M' } },
      { key: 'litigationRisk', label: '訴訟・係争リスク', type: 'select', options: ['なし', '過去にあり（解決済）', '現在係争中'], imp: { bank: 'H', cga: 'M', jfc: 'M' } },
      { key: 'negativeEquity', label: '債務超過の有無', type: 'select', options: ['なし', 'あり（軽微）', 'あり（深刻）'], imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'consumerFinanceUsage', label: '消費者金融の利用', type: 'select', options: ['なし', '過去にあり（完済済）', '現在利用中'], imp: { bank: 'H', cga: 'M', jfc: 'H' }, hint: '★公庫：通帳で消費者金融への送金があると大幅マイナス' },
      { key: 'utilityPaymentDelay', label: '公共料金の延滞', type: 'select', options: ['なし', '過去にあり', '現在延滞中'], imp: { bank: 'L', cga: 'L', jfc: 'H' }, hint: '★公庫は通帳で公共料金の引落しもチェック' },
      { key: 'mobilePaymentDelay', label: '携帯電話料金の延滞', type: 'select', options: ['なし', '過去にあり', '現在延滞中'], imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '★携帯分割払い延滞はCIC事故情報として記録される' },
    ],

    growth: [
      { key: 'revenueGrowthRate', label: '売上成長率（前年比%）', type: 'number', imp: { bank: 'M', cga: 'M', jfc: 'H' } },
      { key: 'businessPlanExists', label: '事業計画書の有無', type: 'select', options: ['5年計画あり', '3年計画あり', '1年計画あり', 'なし'], imp: { bank: 'M', cga: 'M', jfc: 'H' }, hint: '★公庫：事業計画書が審査の最重要ポイント' },
      { key: 'salesPipeline', label: '受注見込み・商談状況', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'H' }, hint: '公庫創業融資：既に顧客候補や受注見込みがあると大幅有利' },
      { key: 'investmentPlan', label: '設備投資計画', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'H' } },
      { key: 'newBusinessPlan', label: '新規事業・新商品の計画', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'H' } },
      { key: 'riskAwareness', label: '★最大のリスクと対策', type: 'textarea', imp: { bank: 'M', cga: 'L', jfc: 'H' }, hint: '★公庫面談：楽観的すぎると「リスク認識が甘い」と判断' },
      { key: 'loanPurpose', label: '融資希望の資金使途', type: 'select', options: ['設備投資（前向き）', '正常運転資金', '増加運転資金', '借換（条件改善）', '赤字補填', 'その他'], imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '銀行：赤字補填・後ろ向き資金は×。前向き資金は◎' },
      { key: 'loanAmount', label: '融資希望額（万円）', type: 'number', required: true, imp: { bank: 'H', cga: 'H', jfc: 'H' } },
      { key: 'repaymentSource', label: '返済原資', type: 'textarea', placeholder: '例: 営業CFから月○万円の返済が可能', imp: { bank: 'H', cga: 'H', jfc: 'H' }, hint: '3機関共通：返済原資が不明確だと否決' },
    ]
  },

  currentSection: 0,
  dnaData: {},

  // =========================================================
  // DNA登録メインUI
  // =========================================================
  start() {
    this.dnaData = Database.loadCompanyData() || {};
    this.currentSection = 0;
    this.showSection(0);
  },

  showSection(index) {
    this.currentSection = index;
    const section = this.sections[index];
    const fields = this.fields[section.id];

    let html = `<div class="glass-card highlight">
      <div class="report-title">${section.title}</div>
      <div style="display:flex;gap:4px;margin-bottom:16px;">`;

    // セクションナビ
    this.sections.forEach((s, i) => {
      const isCurrent = i === index;
      const hasData = this.sectionHasData(s.id);
      html += `<div style="flex:1;height:4px;border-radius:2px;background:${isCurrent ? 'var(--primary)' : hasData ? 'var(--accent-green)' : 'var(--bg-tertiary)'};cursor:pointer;" onclick="CompanyDNA.showSection(${i})" title="${s.title}"></div>`;
    });
    html += `</div>`;

    // 重要度凡例
    html += `<div style="display:flex;gap:16px;font-size:10px;color:var(--text-muted);margin-bottom:16px;flex-wrap:wrap;">
      <span>重要度：</span>
      <span>🏦 銀行</span> <span>🛡️ 保証協会</span> <span>🏛️ 公庫</span>
      <span style="margin-left:auto;">🔴最重要 🟡重要 ⚪参考</span>
    </div>`;

    if (section.id === 'financial') {
      html += `<div style="margin-bottom:20px;padding:12px;background:rgba(245,166,35,0.05);border:1px dashed var(--accent-gold);border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;color:var(--text-secondary);">決算書（PDF/Excel）から数値を自動抽出し、以下のフォームへ入力します。</span>
        <button class="btn btn-primary btn-sm" onclick="BankAudit.showExcelImportForDNA()" style="background:var(--accent-gold);color:#000;">
          <span class="icon">📊</span> 決算書から自動入力
        </button>
      </div>`;
    }
    
    if (section.id === 'business') {
      const segText = this.dnaData['revenueBreakdown'] || '';
      html += `<div style="margin-bottom:20px;padding:12px;background:rgba(108,99,255,0.05);border:1px solid var(--border-secondary);border-radius:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="font-size:13px;font-weight:700;color:var(--primary-light);">🏢 複数事業セグメント構成（エンタープライズ版）</div>
          <button class="btn btn-secondary btn-sm" onclick="CompanyDNA.addSegment()" style="padding:4px 8px;font-size:11px;">+ セグメント追加</button>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">企業が複数の異なる事業を運営している場合、事業ごとの「売上構成比」や「利益貢献度」を明確に記載することで、AIが案件ごとの返済財源を正確に評価します。</div>
        
        <div id="dynamicSegmentsContainer"></div>
        
        <textarea class="dna-input" data-key="revenueBreakdown" rows="3" placeholder="手動入力も可能です。例:&#10;・IT開発事業：売上比率60%（安定黒字・全社利益の柱）&#10;・不動産事業：売上比率40%（今回融資の対象プロジェクト）" style="width:100%;padding:10px;background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;font-family:var(--font-primary);resize:vertical;">${segText}</textarea>
      </div>`;
    }

    // フィールド
    fields.forEach(f => {
      const val = this.dnaData[f.key] || '';
      const impHtml = `<span style="font-size:10px;display:flex;gap:4px;">
        <span title="銀行">🏦${this.importanceLabels[f.imp.bank].icon}</span>
        <span title="保証協会">🛡️${this.importanceLabels[f.imp.cga].icon}</span>
        <span title="公庫">🏛️${this.importanceLabels[f.imp.jfc].icon}</span>
      </span>`;

      html += `<div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <label style="font-size:13px;font-weight:500;color:var(--text-primary);">
            ${f.required ? '<span style="color:var(--accent-red);">*</span> ' : ''}${f.label}
          </label>
          ${impHtml}
        </div>`;

      if (f.hint) {
        html += `<div style="font-size:11px;color:var(--accent-cyan);margin-bottom:4px;">${f.hint}</div>`;
      }

      if (f.key === 'revenueBreakdown' && section.id === 'business') {
        // すでにカスタムUIを描画しているためスキップ
        html += `</div>`;
        return;
      }

      if (f.type === 'select') {
        html += `<select class="dna-input" data-key="${f.key}" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;font-family:var(--font-primary);">
          <option value="">選択してください</option>
          ${f.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>`;
      } else if (f.type === 'textarea') {
        html += `<textarea class="dna-input" data-key="${f.key}" rows="3" placeholder="${f.placeholder || ''}" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;font-family:var(--font-primary);resize:vertical;">${val}</textarea>`;
      } else if (f.type === 'multi-select') {
        const selected = val ? (Array.isArray(val) ? val : [val]) : [];
        html += `<div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${f.options.map(o => `<button type="button" class="dna-multi-btn ${selected.includes(o) ? 'active' : ''}" data-key="${f.key}" data-val="${o}" onclick="CompanyDNA.toggleMulti(this)" style="padding:6px 12px;border-radius:16px;border:1px solid ${selected.includes(o) ? 'var(--primary)' : 'var(--border-secondary)'};background:${selected.includes(o) ? 'var(--bg-active)' : 'transparent'};color:${selected.includes(o) ? 'var(--primary-light)' : 'var(--text-secondary)'};font-size:12px;cursor:pointer;">${o}</button>`).join('')}
        </div>`;
      } else {
        html += `<input class="dna-input" data-key="${f.key}" type="${f.type}" value="${val}" placeholder="${f.placeholder || ''}" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;font-family:var(--font-primary);">`;
      }
      html += `</div>`;
    });

    // 財務指標パネル（financialセクションのみ）
    if (section.id === 'financial') {
      html += `<div id="financialIndicators" style="margin-top:16px;padding:16px;background:rgba(108,99,255,0.06);border:1px solid var(--border-secondary);border-radius:12px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--primary-light);">📊 財務指標（リアルタイム計算）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;text-align:center;" id="indicatorGrid">
          <div class="glass-card" style="padding:10px;">
            <div style="font-size:10px;color:var(--text-muted);">流動比率</div>
            <div id="fi_currentRatio" style="font-size:18px;font-weight:700;">—</div>
            <div style="font-size:9px;color:var(--text-muted);">目安:150%↑</div>
          </div>
          <div class="glass-card" style="padding:10px;">
            <div style="font-size:10px;color:var(--text-muted);">自己資本比率</div>
            <div id="fi_equityRatio" style="font-size:18px;font-weight:700;">—</div>
            <div style="font-size:9px;color:var(--text-muted);">目安:20%↑</div>
          </div>
          <div class="glass-card" style="padding:10px;">
            <div style="font-size:10px;color:var(--text-muted);">債務償還年数</div>
            <div id="fi_debtRepay" style="font-size:18px;font-weight:700;">—</div>
            <div style="font-size:9px;color:var(--text-muted);">目安:10年↓</div>
          </div>
          <div class="glass-card" style="padding:10px;">
            <div style="font-size:10px;color:var(--text-muted);">営業利益率</div>
            <div id="fi_opMargin" style="font-size:18px;font-weight:700;">—</div>
            <div style="font-size:9px;color:var(--text-muted);">目安:5%↑</div>
          </div>
        </div>
      </div>`;
    }

    // ナビボタン
    html += `<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap;">`;
    if (index > 0) {
      html += `<button class="btn btn-secondary" onclick="CompanyDNA.saveAndNav(${index - 1})">← 前へ</button>`;
    }
    html += `<button class="btn btn-primary" onclick="CompanyDNA.saveCurrentSection()">💾 保存</button>`;
    if (index < this.sections.length - 1) {
      html += `<button class="btn btn-primary" onclick="CompanyDNA.saveAndNav(${index + 1})">次へ →</button>`;
    } else {
      html += `<button class="btn btn-primary" onclick="CompanyDNA.saveAndShowProfile()" style="background:var(--accent-green);">✅ DNA登録完了・プロフィール表示</button>`;
    }
    html += `</div></div>`;

    App.addSystemMessage(html);

    // 財務指標リアルタイム更新のイベント設定
    if (section.id === 'financial') {
      setTimeout(() => {
        CompanyDNA.updateFinancialIndicators();
        document.querySelectorAll('.dna-input').forEach(el => {
          el.addEventListener('input', () => CompanyDNA.updateFinancialIndicators());
        });
      }, 100);
    }

    if (section.id === 'business') {
      setTimeout(() => {
        CompanyDNA.renderSegments();
      }, 100);
    }
  },

  toggleMulti(btn) {
    btn.classList.toggle('active');
    const isActive = btn.classList.contains('active');
    btn.style.border = `1px solid ${isActive ? 'var(--primary)' : 'var(--border-secondary)'}`;
    btn.style.background = isActive ? 'var(--bg-active)' : 'transparent';
    btn.style.color = isActive ? 'var(--primary-light)' : 'var(--text-secondary)';
  },

  saveCurrentSection() {
    this.collectInputs();
    Database.saveCompanyData(this.dnaData);
    App.addSystemMessage(Utils.createAlert('success', '✅', `${this.sections[this.currentSection].title} を保存しました。`));
  },

  saveAndNav(targetIndex) {
    this.collectInputs();
    Database.saveCompanyData(this.dnaData);
    this.showSection(targetIndex);
  },

  saveAndShowProfile() {
    this.collectInputs();
    Database.saveCompanyData(this.dnaData);
    this.showProfile();
  },

  collectInputs() {
    document.querySelectorAll('.dna-input').forEach(el => {
      const key = el.dataset.key;
      let val = el.value;
      if (el.type === 'number' && val) val = parseFloat(val);
      if (val !== '' && val !== null && val !== undefined) {
        this.dnaData[key] = val;
      }
    });
    // multi-select
    const multiKeys = new Set();
    document.querySelectorAll('.dna-multi-btn.active').forEach(btn => {
      const key = btn.dataset.key;
      if (!multiKeys.has(key)) { this.dnaData[key] = []; multiKeys.add(key); }
      this.dnaData[key].push(btn.dataset.val);
    });
  },

  sectionHasData(sectionId) {
    const fields = this.fields[sectionId] || [];
    return fields.some(f => {
      const val = this.dnaData[f.key];
      return val !== undefined && val !== null && val !== '' && val !== 0;
    });
  },

  // 財務指標リアルタイム計算
  updateFinancialIndicators() {
    const getVal = (key) => {
      const el = document.querySelector(`.dna-input[data-key="${key}"]`);
      return el ? parseFloat(el.value) || 0 : 0;
    };

    const ca = getVal('currentAssets');
    const cl = getVal('currentLiabilities');
    const ta = getVal('totalAssets');
    const na = getVal('netAssets');
    const debt = getVal('totalDebt');
    const op = getVal('operatingProfit');
    const ni = getVal('netIncome');
    const dep = getVal('depreciation');
    const rev = getVal('annualRevenue');

    // 流動比率 = 流動資産 / 流動負債 × 100
    const crEl = document.getElementById('fi_currentRatio');
    if (crEl) {
      if (cl > 0 && ca > 0) {
        const cr = (ca / cl * 100).toFixed(0);
        crEl.textContent = cr + '%';
        crEl.style.color = cr >= 150 ? 'var(--accent-green)' : cr >= 100 ? 'var(--accent-gold)' : 'var(--accent-red)';
      } else { crEl.textContent = '—'; crEl.style.color = ''; }
    }

    // 自己資本比率 = 純資産 / 総資産 × 100
    const erEl = document.getElementById('fi_equityRatio');
    if (erEl) {
      if (ta > 0) {
        const er = (na / ta * 100).toFixed(1);
        erEl.textContent = er + '%';
        erEl.style.color = er >= 20 ? 'var(--accent-green)' : er >= 10 ? 'var(--accent-gold)' : 'var(--accent-red)';
      } else { erEl.textContent = '—'; erEl.style.color = ''; }
    }

    // 債務償還年数 = 有利子負債 / (税引後利益 + 減価償却費)
    const drEl = document.getElementById('fi_debtRepay');
    if (drEl) {
      const cf = ni + dep;
      if (cf > 0 && debt > 0) {
        const dr = (debt / cf).toFixed(1);
        drEl.textContent = dr + '年';
        drEl.style.color = dr <= 10 ? 'var(--accent-green)' : dr <= 20 ? 'var(--accent-gold)' : 'var(--accent-red)';
      } else if (debt > 0 && cf <= 0) {
        drEl.textContent = '∞';
        drEl.style.color = 'var(--accent-red)';
      } else { drEl.textContent = '—'; drEl.style.color = ''; }
    }

    // 営業利益率 = 営業利益 / 売上高 × 100
    const omEl = document.getElementById('fi_opMargin');
    if (omEl) {
      if (rev > 0) {
        const om = (op / rev * 100).toFixed(1);
        omEl.textContent = om + '%';
        omEl.style.color = om >= 5 ? 'var(--accent-green)' : om >= 0 ? 'var(--accent-gold)' : 'var(--accent-red)';
      } else { omEl.textContent = '—'; omEl.style.color = ''; }
    }
  },

  // =========================================================
  // DNAプロフィール表示
  // =========================================================
  showProfile() {
    this.dnaData = Database.loadCompanyData() || {};
    const d = this.dnaData;

    // 入力完了度
    let totalFields = 0, filledFields = 0;
    const sectionStats = {};
    this.sections.forEach(s => {
      const fields = this.fields[s.id];
      let filled = 0;
      fields.forEach(f => {
        totalFields++;
        const val = d[f.key];
        if (val !== undefined && val !== null && val !== '' && val !== 0) { filledFields++; filled++; }
      });
      sectionStats[s.id] = { total: fields.length, filled, pct: Math.round((filled / fields.length) * 100) };
    });
    const totalPct = Math.round((filledFields / totalFields) * 100);

    let html = `<div class="glass-card highlight">
      <div class="report-title">🧬 企業DNAプロフィール</div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:40px;font-weight:800;color:${totalPct >= 80 ? 'var(--accent-green)' : totalPct >= 50 ? 'var(--accent-gold)' : 'var(--accent-red)'};">${totalPct}%</div>
          <div style="font-size:11px;color:var(--text-muted);">DNA登録完了度</div>
        </div>
        <div style="flex:1;min-width:200px;">
          ${Utils.createProgressBar(filledFields, totalFields)}
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${filledFields}/${totalFields}項目入力済み</div>
        </div>
      </div>`;

    // セクション別完了度
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:20px;">`;
    this.sections.forEach((s, i) => {
      const stat = sectionStats[s.id];
      html += `<div class="glass-card" style="padding:12px;cursor:pointer;text-align:center;" onclick="CompanyDNA.showSection(${i})">
        <div style="font-size:20px;">${s.icon}</div>
        <div style="font-size:11px;margin:4px 0;">${s.title.replace(/^.+\s/, '')}</div>
        <div style="font-size:14px;font-weight:700;color:${stat.pct >= 80 ? 'var(--accent-green)' : stat.pct >= 50 ? 'var(--accent-gold)' : 'var(--text-muted)'};">${stat.pct}%</div>
        ${Utils.createProgressBar(stat.filled, stat.total)}
      </div>`;
    });
    html += `</div>`;

    // 企業概要
    if (d.companyName || d.industry) {
      html += `<div class="report-subtitle">🏢 企業概要</div>
        <div class="report-row"><span class="label">会社名</span><span class="value">${d.companyName || '—'}</span></div>
        <div class="report-row"><span class="label">代表者</span><span class="value">${d.representativeName || '—'}</span></div>
        <div class="report-row"><span class="label">業種</span><span class="value">${d.industry || '—'}</span></div>
        <div class="report-row"><span class="label">業歴</span><span class="value">${d.yearsInBusiness ? d.yearsInBusiness + '年' : '—'}</span></div>
        <div class="report-row"><span class="label">年商</span><span class="value">${d.annualRevenue ? Utils.formatMan(d.annualRevenue) : '—'}</span></div>
        <div class="report-row"><span class="label">従業員数</span><span class="value">${d.employeeCount ? d.employeeCount + '名' : '—'}</span></div>
        <div class="report-row"><span class="label">融資希望額</span><span class="value">${d.loanAmount ? Utils.formatMan(d.loanAmount) : '—'}</span></div>`;
    }

    // 3機関適性スコア
    html += `<div class="report-subtitle" style="margin-top:20px;">🏦 3機関審査適性スコア</div>`;
    const scores = this.calculate3InstitutionScores(d);
    [
      { key: 'bank', label: '🏦 銀行（民間金融機関）', color: 'var(--accent-blue)' },
      { key: 'cga', label: '🛡️ 信用保証協会', color: 'var(--accent-green)' },
      { key: 'jfc', label: '🏛️ 日本政策金融公庫', color: 'var(--accent-gold)' }
    ].forEach(inst => {
      const s = scores[inst.key];
      html += `<div style="margin:12px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-size:13px;font-weight:600;">${inst.label}</span>
          <span style="font-size:16px;font-weight:800;color:${inst.color};">${s.score}点</span>
        </div>
        ${Utils.createProgressBar(s.score, 100)}
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${s.verdict}</div>
        ${s.risks.length > 0 ? `<div style="margin-top:6px;">${s.risks.map(r => `<div style="font-size:11px;color:var(--accent-red);padding:2px 0;">⚠️ ${r}</div>`).join('')}</div>` : ''}
      </div>`;
    });

    // ★自動格付け（DNAデータから即時算出）
    if (d.annualRevenue && d.totalAssets) {
      const autoGrade = this.calculateAutoGrade(d);
      const gradeColors = { 'S+':'var(--grade-sp)','S':'var(--grade-s)','A':'var(--grade-a)','B+':'var(--grade-b)','B':'var(--grade-b)','C':'var(--grade-c)','D':'var(--grade-d)','E':'var(--grade-e)','F':'var(--grade-f)' };
      const gc = gradeColors[autoGrade.grade] || 'var(--text-primary)';
      html += `<div class="report-subtitle" style="margin-top:20px;">📊 DNA自動格付け（速報）</div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:12px;">
          <div style="text-align:center;">
            <div style="font-size:36px;font-weight:800;color:${gc};">${autoGrade.grade}</div>
            <div style="font-size:11px;color:var(--text-muted);">推定格付け</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:28px;font-weight:700;">${autoGrade.score}<span style="font-size:14px;color:var(--text-muted);">/100</span></div>
            <div style="font-size:11px;color:var(--text-muted);">定量スコア</div>
          </div>
          <div style="flex:1;min-width:200px;">${Utils.createProgressBar(autoGrade.score, 100)}
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${autoGrade.debtorCategory}</div>
          </div>
        </div>`;

      // ★融資方法別 成功率マトリックス
      const loanRates = this.calculateLoanSuccessRates(d, autoGrade, scores);
      html += `<div class="report-subtitle" style="margin-top:16px;">🎯 融資方法別 成功率マトリックス</div>`;
      html += `<table class="data-table"><thead><tr>
        <th>融資方法</th><th>成功率</th><th>推定金利</th><th>推定限度額</th><th>判定</th>
      </tr></thead><tbody>`;
      loanRates.forEach(lr => {
        const barColor = lr.rate >= 70 ? 'var(--accent-green)' : lr.rate >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)';
        html += `<tr>
          <td style="font-weight:600;">${lr.icon} ${lr.name}</td>
          <td><div style="display:flex;align-items:center;gap:8px;">
            <div style="width:60px;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden;">
              <div style="width:${lr.rate}%;height:100%;background:${barColor};border-radius:3px;"></div>
            </div><span style="font-weight:700;color:${barColor};">${lr.rate}%</span>
          </div></td>
          <td class="num">${lr.interest}</td>
          <td class="num">${lr.limit}</td>
          <td style="font-size:11px;">${lr.verdict}</td>
        </tr>`;
      });
      html += `</tbody></table>`;
    } else {
      html += `<div style="margin-top:20px;padding:16px;background:var(--bg-tertiary);border-radius:var(--border-radius-sm);text-align:center;color:var(--text-muted);font-size:13px;">
        📊 <strong>財務DNAを入力すると自動格付け・融資成功率が表示されます</strong><br>
        <button class="btn btn-primary btn-sm" style="margin-top:8px;" onclick="CompanyDNA.showSection(3)">📊 財務DNAを入力</button>
      </div>`;
    }

    // アクションボタン
    html += `<div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="CompanyDNA.start()">📝 DNA編集</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/診断')">🔍 詳細格付け診断</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/審査方式')">🔀 審査方式選択</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/ガイド')">📖 総合ガイド</button>
    </div></div>`;

    App.addSystemMessage(html);
  },

  // =========================================================
  // 3機関審査適性スコア計算
  // =========================================================
  calculate3InstitutionScores(d) {
    const result = {
      bank: { score: 50, risks: [], verdict: '' },
      cga: { score: 50, risks: [], verdict: '' },
      jfc: { score: 50, risks: [], verdict: '' }
    };

    // 共通リスク要因
    if (d.taxDelinquency && d.taxDelinquency !== 'なし') {
      result.cga.score -= 40; result.cga.risks.push('税金滞納：保証協会は原則一発アウト');
      result.bank.score -= 20; result.bank.risks.push('税金滞納：大幅マイナス');
      result.jfc.score -= 15; result.jfc.risks.push('税金滞納：マイナス（保証協会ほど厳格でない）');
    }
    if (d.ceoCreditHistory === '事故情報あり' || d.ceoCreditHistory === '現在延滞中') {
      result.bank.score -= 30; result.bank.risks.push('個人信用情報：事故情報で大幅減点');
      result.cga.score -= 30; result.cga.risks.push('個人信用情報：事故情報で大幅減点');
      result.jfc.score -= 40; result.jfc.risks.push('個人信用情報：ブラック情報で一発アウト');
    }
    if (d.antiSocialCheck === '不明') {
      result.bank.score -= 50; result.cga.score -= 50; result.jfc.score -= 50;
    }
    if (d.rescheduleHistory === '現在進行中') {
      result.bank.score -= 30; result.bank.risks.push('リスケ中：原則新規不可');
      result.cga.score -= 15; result.cga.risks.push('リスケ中：経営改善サポート保証で対応可能な場合あり');
      result.jfc.score -= 10; result.jfc.risks.push('リスケ中：セーフティネット貸付・資本性劣後ローンで対応可能');
    }
    if (d.negativeEquity && d.negativeEquity !== 'なし') {
      result.bank.score -= 25; result.bank.risks.push('債務超過：格付け一発急落');
      result.cga.score -= 15; result.cga.risks.push('債務超過：CRDスコア大幅低下');
      result.jfc.score -= 10; result.jfc.risks.push('債務超過：改善計画があれば検討可');
    }
    if (d.guaranteeAssocUsage === '代位弁済履歴あり') {
      result.cga.score -= 40; result.cga.risks.push('代位弁済履歴：求償権残があると原則保証不可');
    }
    if (d.consumerFinanceUsage === '現在利用中') {
      result.jfc.score -= 20; result.jfc.risks.push('消費者金融利用中：通帳で確認され大幅マイナス');
    }

    // 銀行プラス要因
    const rev = d.annualRevenue || 0;
    const na = d.netAssets || 0;
    const ta = d.totalAssets || 1;
    if (na > 0 && ta > 0) result.bank.score += Math.min(15, Math.floor((na / ta) * 50));
    if (d.operatingProfit > 0) result.bank.score += 10;
    if (d.monthlyAccounting === '毎月実施') result.bank.score += 5;
    if (d.mainBankYears >= 10) result.bank.score += 5;
    if (d.realEstateValue > 0) result.bank.score += 10;

    // 保証協会プラス要因
    if (d.guaranteeCapacity === '十分あり') result.cga.score += 10;
    if (rev > 0 && d.operatingProfit > 0) result.cga.score += 10;
    if (d.hasAccountantAdvisor === 'あり') result.cga.score += 5;
    if (d.crdGuaranteeFeeRate && d.crdGuaranteeFeeRate <= 1.0) result.cga.score += 10;
    if (d.consecutiveProfitYears >= 3) result.cga.score += 10;

    // 公庫プラス要因
    if (d.ceoIndustryExperience >= 6) result.jfc.score += 10;
    if (d.ceoSelfFunding > 0 && d.loanAmount > 0 && d.ceoSelfFunding / d.loanAmount >= 0.33) result.jfc.score += 15;
    if (d.businessPlanExists && d.businessPlanExists !== 'なし') result.jfc.score += 10;
    if (d.competitiveAdvantage && d.competitiveAdvantage.length > 20) result.jfc.score += 5;
    if (d.riskAwareness && d.riskAwareness.length > 20) result.jfc.score += 5;
    if (d.certifiedSupportOrg === 'あり') result.jfc.score += 5;
    if (d.bankPassbook6m === '提出可能') result.jfc.score += 5;

    // スコアをクランプ
    Object.keys(result).forEach(k => {
      result[k].score = Math.max(0, Math.min(100, result[k].score));
      const s = result[k].score;
      if (k === 'bank') {
        result[k].verdict = s >= 70 ? '融資可能性が高い。プロパーも視野' : s >= 50 ? '保証付きなら可能性あり' : s >= 30 ? '困難だが改善余地あり' : '現状では極めて困難';
      } else if (k === 'cga') {
        result[k].verdict = s >= 70 ? '保証承諾の可能性が高い' : s >= 50 ? '条件付きで承諾の可能性あり' : s >= 30 ? '減額or謝絶の可能性' : '保証謝絶の可能性が高い';
      } else {
        result[k].verdict = s >= 70 ? '融資決定の可能性が高い' : s >= 50 ? '面談次第で可能性あり' : s >= 30 ? '計画の充実が必要' : '現状では困難（再チャレンジ可能）';
      }
    });

    return result;
  },

  // =========================================================
  // DNA自動格付け算出
  // =========================================================
  calculateAutoGrade(d) {
    let score = 0;
    const rev = d.annualRevenue || 0;
    const ta = d.totalAssets || 1;
    const na = d.netAssets || 0;
    const op = d.operatingProfit || 0;
    const ordP = d.ordinaryProfit || 0;
    const ni = d.netIncome || 0;
    const debt = d.totalDebt || 0;
    const dep = d.depreciation || 0;
    const ie = d.interestExpense || 1;
    const ca = d.currentAssets || 0;
    const cl = d.currentLiabilities || 1;
    const cf = ni + dep;

    // 安全性（25点）
    const eqR = ta > 0 ? (na / ta) * 100 : 0;
    score += eqR >= 40 ? 8 : eqR >= 20 ? 6 : eqR >= 10 ? 4 : eqR > 0 ? 2 : 0;
    const curR = cl > 0 ? (ca / cl) * 100 : 0;
    score += curR >= 200 ? 5 : curR >= 150 ? 4 : curR >= 120 ? 3 : curR >= 100 ? 2 : 1;
    const gear = na > 0 ? debt / na : 99;
    score += gear <= 1 ? 5 : gear <= 2 ? 4 : gear <= 4 ? 3 : gear <= 6 ? 2 : 1;
    const nwc = (d.receivables || 0) + (d.inventory || 0) - (d.payables || 0);
    const dsr = cf > 0 ? Math.max(0, debt - Math.max(0, nwc)) / cf : 99;
    score += dsr <= 5 ? 7 : dsr <= 10 ? 5 : dsr <= 15 ? 3 : dsr <= 20 ? 2 : 0;

    // 収益性（25点）
    const opR = rev > 0 ? (ordP / rev) * 100 : 0;
    score += opR >= 5 ? 8 : opR >= 3 ? 6 : opR >= 1 ? 4 : opR > 0 ? 2 : 0;
    const roa = ta > 0 ? (ordP / ta) * 100 : 0;
    score += roa >= 8 ? 5 : roa >= 5 ? 4 : roa >= 2 ? 3 : roa > 0 ? 2 : 0;
    score += op > 0 ? 5 : 0; // 営業利益黒字
    const icr = ie > 0 ? op / ie : (op > 0 ? 99 : 0);
    score += icr >= 5 ? 7 : icr >= 2 ? 5 : icr >= 1 ? 3 : 1;

    // 成長性（15点）
    const gr = d.revenueGrowthRate || 0;
    score += gr >= 10 ? 8 : gr >= 5 ? 6 : gr >= 0 ? 4 : gr >= -5 ? 2 : 0;
    score += (d.consecutiveProfitYears || 0) >= 3 ? 7 : (d.consecutiveProfitYears || 0) >= 1 ? 4 : 0;

    // 返済能力（20点）
    score += cf > 0 ? 5 : 0;
    const mr = d.monthlyRepayment || 0;
    const cfRat = mr > 0 ? cf / (mr * 12) : (cf > 0 ? 3 : 0);
    score += cfRat >= 2 ? 8 : cfRat >= 1.5 ? 6 : cfRat >= 1 ? 4 : cfRat > 0.5 ? 2 : 0;
    score += dsr <= 10 ? 7 : dsr <= 15 ? 5 : dsr <= 20 ? 3 : 1;

    // 効率性（15点）
    const aturn = ta > 0 ? rev / ta : 0;
    score += aturn >= 2 ? 8 : aturn >= 1 ? 6 : aturn >= 0.5 ? 4 : 2;
    score += (d.grossProfitMargin || 0) >= 40 ? 7 : (d.grossProfitMargin || 0) >= 25 ? 5 : (d.grossProfitMargin || 0) >= 15 ? 3 : 1;

    // 定性加減点
    if (d.monthlyAccounting === '毎月実施') score += 3;
    if (d.ceoCreditHistory === '事故情報あり' || d.ceoCreditHistory === '現在延滞中') score -= 15;
    if (d.taxDelinquency && d.taxDelinquency !== 'なし') score -= 10;
    if (d.negativeEquity === 'あり（深刻）') score -= 20;
    else if (d.negativeEquity === 'あり（軽微）') score -= 10;
    if (d.rescheduleHistory === '現在進行中') score -= 15;

    score = Math.max(0, Math.min(100, score));

    let grade, debtorCategory;
    if (score >= 90) { grade = 'S+'; debtorCategory = '正常先（超優良）— 最優遇金利での融資が可能'; }
    else if (score >= 80) { grade = 'S'; debtorCategory = '正常先（優良）— プロパー融資を積極推進'; }
    else if (score >= 70) { grade = 'A'; debtorCategory = '正常先 — 通常条件での融資が可能'; }
    else if (score >= 60) { grade = 'B+'; debtorCategory = '正常先（下位）— 保証付き推奨'; }
    else if (score >= 50) { grade = 'B'; debtorCategory = '正常先（注意）— 条件次第で融資可能'; }
    else if (score >= 40) { grade = 'C'; debtorCategory = '要注意先に近い — 改善が必要'; }
    else if (score >= 30) { grade = 'D'; debtorCategory = '要注意先 — 新規融資は困難'; }
    else if (score >= 20) { grade = 'E'; debtorCategory = '要管理先 — 経営改善が急務'; }
    else { grade = 'F'; debtorCategory = '破綻懸念先 — 抜本的な対策が必要'; }

    return { score, grade, debtorCategory };
  },

  // =========================================================
  // 融資方法別 成功率算出
  // =========================================================
  calculateLoanSuccessRates(d, autoGrade, instScores) {
    const s = autoGrade.score;
    const rev = d.annualRevenue || 0;
    const la = d.loanAmount || 0;
    const bk = instScores.bank.score;
    const cg = instScores.cga.score;
    const jf = instScores.jfc.score;

    const clamp = v => Math.max(0, Math.min(99, Math.round(v)));
    const fmtMan = v => v >= 10000 ? (v / 10000).toFixed(1) + '億円' : v.toLocaleString() + '万円';

    const methods = [];

    // 1. プロパー融資（銀行直接）
    let propR = Math.min(95, bk * 0.9 + (s >= 70 ? 15 : s >= 50 ? 5 : -10));
    if (s < 50) propR = Math.max(0, propR - 20);
    methods.push({
      icon: '🏦', name: 'プロパー融資', rate: clamp(propR),
      interest: s >= 80 ? '0.5〜1.5%' : s >= 60 ? '1.5〜2.5%' : '2.5〜4.0%',
      limit: fmtMan(Math.min(rev * 0.3, la * 2)),
      verdict: propR >= 70 ? '◎ 積極的に交渉可能' : propR >= 40 ? '△ 条件交渉が鍵' : '× 現状では困難'
    });

    // 2. 保証協会付融資
    let cgaR = Math.min(95, cg * 0.85 + (s >= 50 ? 10 : 0));
    methods.push({
      icon: '🛡️', name: '保証協会付融資', rate: clamp(cgaR),
      interest: '1.0〜3.0% + 保証料',
      limit: fmtMan(Math.min(8000, la)),
      verdict: cgaR >= 70 ? '◎ 保証承諾見込み高い' : cgaR >= 40 ? '△ 減額の可能性あり' : '× 謝絶の可能性'
    });

    // 3. 日本政策金融公庫
    let jfcR = Math.min(95, jf * 0.85 + (d.businessPlanExists && d.businessPlanExists !== 'なし' ? 10 : 0));
    methods.push({
      icon: '🏛️', name: '公庫融資', rate: clamp(jfcR),
      interest: '1.0〜2.5%',
      limit: fmtMan(Math.min(7200, la)),
      verdict: jfcR >= 70 ? '◎ 面談準備で決まる' : jfcR >= 40 ? '△ 計画書の充実が必要' : '× 計画の見直しが必要'
    });

    // 4. 制度融資（自治体+保証協会）
    let seiR = clamp(cgaR + 5);
    methods.push({
      icon: '🏫', name: '制度融資', rate: seiR,
      interest: '0.5〜2.0%（利子補給あり）',
      limit: fmtMan(Math.min(5000, la)),
      verdict: seiR >= 70 ? '◎ 低利を活用すべき' : seiR >= 40 ? '△ 自治体の条件を確認' : '× 保証が通らない可能性'
    });

    // 5. ABL（動産担保融資）
    const ablAssets = (d.receivablesForABL || 0) + (d.inventoryForABL || 0);
    let ablR = ablAssets > 0 ? clamp(40 + bk * 0.3 + Math.min(20, ablAssets / la * 30)) : 0;
    methods.push({
      icon: '📦', name: 'ABL（動産担保）', rate: ablR,
      interest: '2.0〜5.0%',
      limit: ablAssets > 0 ? fmtMan(Math.round(ablAssets * 0.7)) : '—',
      verdict: ablR >= 50 ? '○ 担保資産で対応可能' : ablR > 0 ? '△ 担保評価次第' : '— 対象資産なし'
    });

    // 6. 不動産担保融資
    const reVal = (d.realEstateValue || 0) - (d.existingMortgageBalance || 0);
    let reR = reVal > 0 ? clamp(50 + Math.min(30, reVal / la * 40)) : 0;
    methods.push({
      icon: '🏠', name: '不動産担保融資', rate: reR,
      interest: '1.0〜3.5%',
      limit: reVal > 0 ? fmtMan(Math.round(reVal * 0.65)) : '—',
      verdict: reR >= 60 ? '◎ 担保余力あり' : reR > 0 ? '△ 余力不足の可能性' : '— 担保不動産なし'
    });

    return methods;
  }
};

// --- 複数事業セグメント（エンタープライズ版）管理機能 ---
Object.assign(CompanyDNA, {
  renderSegments() {
    const container = document.getElementById('dynamicSegmentsContainer');
    if(!container) return;
    
    let segments = this.dnaData.businessSegments || [];
    if(segments.length === 0) {
      container.innerHTML = '';
      return;
    }

    let html = `<div style="margin-bottom:12px;border-bottom:1px dashed var(--border-secondary);padding-bottom:12px;">`;
    segments.forEach((seg, idx) => {
      html += `<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <input type="text" class="dna-seg-input" data-idx="${idx}" data-field="name" value="${seg.name || ''}" placeholder="事業名 (例: IT事業)" style="flex:2;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
        <input type="number" class="dna-seg-input" data-idx="${idx}" data-field="salesRatio" value="${seg.salesRatio || ''}" placeholder="売上比率(%)" style="flex:1;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
        <input type="text" class="dna-seg-input" data-idx="${idx}" data-field="note" value="${seg.note || ''}" placeholder="特徴・利益貢献など" style="flex:3;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
        <button class="btn btn-danger btn-sm" onclick="CompanyDNA.removeSegment(${idx})" style="padding:4px 8px;font-size:10px;">削除</button>
      </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    
    container.querySelectorAll('.dna-seg-input').forEach(el => {
      el.addEventListener('change', (e) => {
        const idx = e.target.getAttribute('data-idx');
        const field = e.target.getAttribute('data-field');
        CompanyDNA.dnaData.businessSegments[idx][field] = e.target.value;
        CompanyDNA.updateSegmentTextarea();
        Database.saveCompanyData(CompanyDNA.dnaData);
      });
    });
  },

  addSegment() {
    if(!this.dnaData.businessSegments) this.dnaData.businessSegments = [];
    this.dnaData.businessSegments.push({ name: '', salesRatio: '', note: '' });
    this.renderSegments();
  },

  removeSegment(idx) {
    if(!this.dnaData.businessSegments) return;
    this.dnaData.businessSegments.splice(idx, 1);
    this.updateSegmentTextarea();
    Database.saveCompanyData(this.dnaData);
    this.renderSegments();
  },

  updateSegmentTextarea() {
    const segments = this.dnaData.businessSegments || [];
    if(segments.length === 0) return;
    const text = segments.map(s => `・${s.name || '名称未設定'}：売上比率${s.salesRatio || 0}%（${s.note || ''}）`).join('\n');
    this.dnaData.revenueBreakdown = text;
    const ta = document.querySelector('textarea[data-key="revenueBreakdown"]');
    if(ta) ta.value = text;
  }
});
