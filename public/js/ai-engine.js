/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - AI文書生成エンジン（ローカル＋サーバー対応）
 * ============================================================ */

const AIEngine = {

  docTypes: [
    { id: 'summary', icon: '📋', name: 'エグゼクティブサマリー', desc: '1枚で企業の融資適格性を伝える' },
    { id: 'plan', icon: '📊', name: '事業計画書', desc: '審査員が求める形式の事業計画' },
    { id: 'qa', icon: '❓', name: '想定Q&A集', desc: '面談で聞かれる質問と模範回答' },
    { id: 'meeting', icon: '🤝', name: '面談準備シート', desc: '面談の流れとポイント整理' },
    { id: 'repayment', icon: '💰', name: '返済計画書', desc: '返済原資の説明資料' },
    { id: 'strategy', icon: '🎯', name: '融資戦略レポート', desc: '最適な申込戦略の提案' },
    { id: 'cashflow', icon: '💹', name: '資金繰り表', desc: '月次12ヶ月＋年次3年の資金計画' },
    { id: 'improvement', icon: '📈', name: '経営改善計画書', desc: '405事業準拠の改善計画' },
    { id: 'debtAnalysis', icon: '🔢', name: '債務償還分析', desc: '償還年数・返済能力の詳細分析' },
    { id: 'bankBrief', icon: '🏦', name: '金融機関別稟議書', desc: 'メガバンク/地銀/信金/公庫別に最適化' },
    { id: 'autoCase', icon: '📂', name: '案件概要書自動作成', desc: 'DNAから融資案件概要を自動生成' },
  ],

  getApiKey() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    return settings.openaiApiKey || '';
  },

  getModel() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    return settings.openaiModel || 'gpt-4o-mini';
  },

  showGenerateUI() {
    const dna = Database.loadCompanyData() || {};
    const hasDNA = !!(dna.companyName || dna.industry || dna.annualRevenue);
    const apiKey = this.getApiKey();

    let html = `<div class="glass-card highlight">
      <div class="report-title">🤖 AI資料生成エンジン</div>`;

    if (!apiKey) {
      html += `<div style="text-align:center;padding:32px;">
        <div style="font-size:48px;margin-bottom:16px;">🔑</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px;">OpenAI APIキーが未設定です</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">AI資料生成を利用するには、管理コンソールからAPIキーを設定してください。</div>
        <button class="btn btn-primary" onclick="Admin.show()">⚙️ 管理コンソールを開く</button>
      </div></div>`;
      App.addSystemMessage(html);
      return;
    }

    if (!hasDNA) {
      html += `<div style="padding:16px;background:var(--bg-tertiary);border-radius:var(--border-radius-sm);margin-bottom:16px;">
        <div style="font-size:12px;color:var(--accent-gold);">⚠️ 企業DNAが未登録です。先にDNAを入力すると高品質な資料が生成されます。</div>
        <button class="btn btn-sm btn-secondary" style="margin-top:8px;" onclick="CompanyDNA.start()">🧬 DNA登録</button>
      </div>`;
    }

    html += `<p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
      企業DNAデータ＋格付け情報を基に、AIが融資申請資料を自動生成します。
    </p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:16px;">`;

    this.docTypes.forEach(dt => {
      html += `<div class="glass-card" style="padding:14px;cursor:pointer;transition:all 0.2s;"
        onclick="AIEngine.generate('${dt.id}')"
        onmouseover="this.style.borderColor='var(--primary)'"
        onmouseout="this.style.borderColor=''">
        <div style="font-size:20px;margin-bottom:6px;">${dt.icon}</div>
        <div style="font-size:13px;font-weight:600;">${dt.name}</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">${dt.desc}</div>
      </div>`;
    });
    html += `</div>
      <div class="report-subtitle">✏️ カスタム指示（任意）</div>
      <textarea id="aiCustomPrompt" rows="3" placeholder="追加指示（例：「決算書の改善点を重点的に」）" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>
    </div>`;
    App.addSystemMessage(html);
  },

  async generate(docType) {
    const dna = Database.loadCompanyData() || {};
    const customPrompt = document.getElementById('aiCustomPrompt')?.value || '';
    const apiKey = this.getApiKey();
    const model = this.getModel();

    App.addSystemMessage(`<div class="glass-card" style="text-align:center;padding:24px;">
      <div class="loading-spinner"></div>
      <div style="margin-top:12px;font-size:13px;">🤖 AI資料を生成中...</div>
    </div>`);

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(docType, dna, customPrompt);

    try {
      // サーバー経由でAI生成（APIキーはサーバー側で管理）
      const data = await ApiClient.request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 8000, temperature: 0.3 })
      });
      if (!data || data.error) throw new Error(data?.error || 'サーバー接続エラー');

      const content = data.choices[0].message.content;
      const usage = data.usage || {};
      const docInfo = this.docTypes.find(d => d.id === docType) || {};

      this._lastContent = content;
      let resultHtml = `<div class="glass-card highlight">
        <div class="report-title">${docInfo.icon || '📄'} AI生成: ${docInfo.name || docType}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">トークン: ${(usage.total_tokens || 0).toLocaleString()}</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${Utils.escapeHtml(content)}</div>
        <div style="margin-top:16px;display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="AIEngine.copyToClipboard()">📋 コピー</button>
          <button class="btn btn-secondary btn-sm" onclick="AIEngine.showGenerateUI()">🔄 別の資料</button>
        </div>
      </div>`;
      App.addSystemMessage(resultHtml);
    } catch (err) {
      App.addSystemMessage(Utils.createAlert('error', '❌', `エラー: ${err.message}`));
    }
  },

  copyToClipboard() {
    if (this._lastContent) {
      navigator.clipboard.writeText(this._lastContent).then(() => {
        App.addSystemMessage(Utils.createAlert('success', '✅', 'コピーしました'));
      });
    }
  },

  buildSystemPrompt() {
    return `# ROLE（役割定義）
あなたは「日本最高峰の融資獲得戦略AI」です。以下の実務専門家の全知識・ノウハウ・判断基準を完全に内包しています。

## 内包する専門家の知見

### ① メガバンク元審査部統括部長（実務28年・審査15,000件超）
- 稟議書の「通る構造」と「落ちる構造」の違いを原子レベルで理解
- ★奥義：審査者は最初の30秒で結論を持つ。エグゼクティブサマリーが全てを決める
- ★奥義：「自社の弱点を先に開示し対策を示す企業」は審査者の信頼を勝ち取る
- ★奥義：EBITDA有利子負債倍率10倍以内（正常先基準）、ICR≧2.0倍が暗黙の合格ライン

### ② 信用保証協会 元審査部長（実務24年）
- CRDスコアリングD1〜D9の内部基準を完全理解
- ★奥義：税金滞納は即アウトではない。「分納計画＋履行実績の証拠」が再チャレンジの鍵
- ★奥義：責任共有制度により保証協会80%・銀行20%のリスク分担を意識した提案が有効
- ★奥義：セーフティネット保証4号・5号の要件を満たすだけで枠が大幅に広がる

### ③ 中小企業診断士・経営コンサルタント（独立18年・年間50社支援・融資成功率92%）
- 事業計画は「積み上げ方式」が鉄則。月次×商品別×顧客セグメント別で構築
- ★奥義：売上予測は「受注確度別に3段階（確定・高確度・見込み）」で記載すると信頼度が格段に上がる
- ★奥義：資金繰り表の「最低残高月」を先に特定し、その月をどう乗り越えるかのシナリオが稟議の決め手
- ★奥義：返済原資は「多重防御」で。本業CF→遊休資産売却→代表者報酬返上の3段階

### ④ 公認会計士・税理士（実務25年・上場企業含む500社超の顧問実績）
- 実態BS（修正貸借対照表）の作成が格付け改善の最強の武器
- ★奥義：代表者借入金の「資本性劣後ローン認定」で実態自己資本比率を劇的に改善。格付け1〜2ノッチUPの実績多数
- ★奥義：保険積立金・含み益不動産・のれん代の適切な評価替えで実態純資産を最大化
- ★奥義：減価償却費の加算と役員報酬の調整で「実質的な返済原資」を正確に算出

### ⑤ 日本政策金融公庫 元融資課長（実務22年・年間800件審査）
- 公庫は「社会的意義＋雇用効果」を民間銀行以上に重視する
- ★奥義：確定申告書の第一表〜別表の「整合性」が審査の基本。決算書はあくまで補完
- ★奥義：「なぜ民間ではなく公庫に申し込むのか」の合理的理由を準備すること
- ★奥義：新創業融資・経営力強化資金・再挑戦支援資金など政策融資の制度要件を正確に把握

### ⑥ 金融庁検査官OB（金融検査マニュアル策定に関与）
- 金融検査マニュアルの「自己査定基準」を熟知。正常先・要注意先・破綻懸念先の分類基準を理解
- ★奥義：「要注意先→正常先」への格上げには「経営改善計画＋3期連続黒字化の実績」が最も有効

### ⑦ 事業再生コンサルタント（再生実績200社超）
- 経営改善計画（405事業）の策定プロフェッショナル
- ★奥義：リスケ中でも「実抜計画」が認められれば新規融資は可能。実績で証明した数値計画が鍵
- ★奥義：DDS（デット・デット・スワップ）やDES（デット・エクイティ・スワップ）で財務を根本改善

## 機密レベルの知識体系
### 銀行内部の「暗黙のルール」
- 信用格付け：正常先（A〜F）・要注意先・破綻懸念先・実質破綻先・破綻先の5区分と各基準
- 自己査定のIII分類・IV分類の判定基準と引当率の関係
- 「条件変更先」の取扱い（金融円滑化法終了後の実務対応）
- メイン寄せ・協調融資・シンジケートローンの組成基準

### 保証協会の審査の裏側
- CRDモデルのデフォルト判別ロジック（財務変数の重み付け）
- 経営者個人のCIC情報（個人信用情報）の影響度
- 保証審査委員会の「否決パターン」（税金滞納・粉飾・多重債務の3大地雷）

### 公庫審査の内部基準
- 面談評価シートの採点基準（経営者の経験・熱意・計画の具体性）
- 「面談で落ちる5パターン」（準備不足・数字を覚えていない・質問に感情的反応・矛盾した説明・代表者が来ない）

# 出力ルール（絶対遵守15箇条）
## A. 数値の絶対ルール
1. 根拠なき形容詞禁止。「前年比+12.3%（5,400万→6,066万）」と定量記載
2. 数値3点セット必須：過去実績→現在値→計画値を必ずセット
3. 否決シミュレーション：弱点は「認識→原因→対策→期限」の4点セットで先回り記載
4. 競合優位性の定量化：「市場シェアX%」「リピート率Y%」「顧客単価Z円」で記載
## B. 返済原資ルール
5. 3層防御必須：第1層=本業CF / 第2層=遊休資産・保険 / 第3層=代表者報酬返上
6. 債務償還年数を必ず計算：(有利子負債-正常運転資金)÷営業CF=X年
## C. 銀行別最適化
7. メガバンク→EBITDA・ROE重視 / 地銀→地域貢献 / 信金→代表者関係 / 公庫→社会的意義
8. 既存借入一覧＋今回追加後の返済総額を全体像で表示
## D. 精度最大化
9. 業種季節変動反映（建設:3月/飲食:12月/IT:期末/製造:四半期均等/小売:年末年始）
10. 売上予測は確度別3段階：確定/高確度(80%以上)/見込み
11. 資金繰り表は月次12ヶ月＋年次3年。最低残高月を強調
12. 制度融資・保証制度は具体名と条件を明記
13. 経営改善計画は実抜計画要件（売上-10%でも返済可能）を満たすこと
14. 銀行員が稟議書にコピペできる構造で出力
## E. 正直性・誠実性の絶対ルール
15. ユーザーが入力した数字は絶対に改変しない。実際のデータのみを使用する
16. 推測値には必ず「推定」「概算」と明記し、根拠を併記する
17. 不足データがある場合は「※要入力」と記載し、嘘の数字で埋めない
18. 融資が通るための「盛り」は厳禁。正当な根拠に基づく最善の見せ方を提案する

## F. 視覚資料の必須ルール
19. 表（テーブル）を積極的に使用：財務推移・比較分析・返済計画は必ず表形式で
20. 取引先関係図を記載：主要取引先（上位5社）の名称・取引額・取引年数・割合を記載
21. 組織図・事業構造図をテキストで図示（ASCII図またはMarkdown表）
22. 財務推移は必ず3期分の比較表で提示（増減額・増減率付き）
23. 必ず日本語で出力`;
  },

  buildUserPrompt(docType, dna, customPrompt) {
    let context = '【企業情報（DNAデータ）】\n';
    const fields = { companyName:'会社名', industry:'業種', yearsInBusiness:'業歴(年)', employeeCount:'従業員数', annualRevenue:'年商(万円)', operatingProfit:'営業利益(万円)', ordinaryProfit:'経常利益(万円)', netIncome:'税引後利益(万円)', totalAssets:'総資産(万円)', netAssets:'純資産(万円)', totalDebt:'有利子負債(万円)', loanAmount:'融資希望額(万円)', loanPurpose:'資金使途', businessModel:'事業モデル', competitiveAdvantage:'競争優位性', repaymentSource:'返済原資', mainBank:'メインバンク', mainBankYears:'取引年数' };
    Object.entries(fields).forEach(([k, label]) => { if (dna[k]) context += `${label}: ${dna[k]}\n`; });

    // 財務データがあれば追加
    if (dna.financials && dna.financials.length > 0) {
      context += '\n【決算データ】\n';
      dna.financials.forEach((f, i) => {
        if (f.revenue) context += `${f.year || `${i+1}期`}: 売上${f.revenue}万 営利${f.operatingProfit || '-'}万 経利${f.ordinaryProfit || '-'}万 純利${f.netIncome || '-'}万 純資産${f.netAssets || '-'}万\n`;
      });
    }

    // 自動計算された財務指標を追加
    context += this.buildFinancialIndicators(dna);

    const prompts = {
      summary: `以下の企業情報を基に、銀行提出用「エグゼクティブサマリー」を作成（A4 1枚）。\n\n${context}`,
      plan: `以下の企業情報を基に「事業計画書」ドラフトを作成。事業概要・市場分析・収支計画・資金計画を含む。\n\n${context}`,
      qa: `以下の企業情報を基に、銀行面談の「想定Q&A集」を15問作成。\n\n${context}`,
      meeting: `以下の企業情報を基に「銀行面談準備シート」を作成。流れ・持ち物・NG集・シナリオ含む。\n\n${context}`,
      repayment: `以下の企業情報を基に「返済計画書」を作成。返済原資・月次シミュレーション含む。\n\n${context}`,
      strategy: `以下の企業情報を基に「融資戦略レポート」を作成。金融機関の優先順位(理由付き)・金額配分戦略・申込タイムライン・各行差別化ポイント・否決時リカバリープラン含む。\n\n${context}`,
      cashflow: `以下の企業情報を基に「資金繰り表」を作成。月次12ヶ月入出金明細・年次3年・最低残高月を強調・季節変動説明・業種の入金出金サイト反映。\n\n${context}`,
      improvement: `以下の企業情報を基に「経営改善計画書(405事業準拠)」を作成。SWOT分析・数値KPI・月次アクションプラン・P/L,BS,CF 3年分・実抜計画要件(売上-10%でも返済可能)を満たすこと。\n\n${context}`,
      debtAnalysis: `以下の企業情報を基に「債務償還分析レポート」を作成。有利子負債一覧・正常運転資金算出・営業CF計算・債務償還年数・改善シナリオ3パターン。計算式:(有利子負債-正常運転資金)÷営業CF。\n\n${context}`,
      bankBrief: `以下の企業情報を基に「金融機関別稟議書補足資料」を作成。メガバンク版(財務指標重視)・地銀版(地域貢献)・信金版(代表者関係)・公庫版(社会的意義)の4パターン。\n\n${context}`,
      autoCase: `以下の企業情報を基に「融資案件概要書」を自動作成。案件サマリー・企業概要・融資条件・財務分析・返済能力分析・リスク評価・総合所見。銀行稟議書フォーマット準拠。\n\n${context}`,
      equipment: `以下の企業情報を基に「設備投資計画書」を作成。\n## 必須構成\n1. 設備概要（名称・仕様・メーカー・型番）\n2. 投資金額内訳（本体・設置工事・付帯費用）表形式\n3. 導入スケジュール（発注〜稼働開始のガントチャート）\n4. 期待効果（定量: 生産性向上率・コスト削減額・売上増加額）\n5. 投資回収計算（回収年数=投資額÷年間効果額）表形式\n6. 導入前後の比較表\n7. リスクと対策\n\n${context}`,
      profile: `以下の企業情報を基に「代表者略歴書」を作成。\n## 必須構成\n1. 基本情報（氏名・生年月日・最終学歴）\n2. 職歴（年月・会社名・職位・主な実績を時系列表で）\n3. 保有資格・免許一覧表\n4. 経営ビジョン（500字以上）\n5. 自己資金の状況\n6. 業界経験年数と専門性\n7. 個人信用情報（延滞・事故なしを明記）\n公庫面談で重視される「経営者の人物像」が伝わる内容に。\n\n${context}`,
      funduse: `以下の企業情報を基に「資金使途明細書」を作成。\n## 必須構成\n1. 資金調達の全体像（調達額・調達先・自己資金）表形式\n2. 使途別内訳表（項目・金額・支払先・支払時期）\n3. 運転資金: 算出根拠（月商×所要月数）\n4. 設備資金: 設備明細と見積対応\n5. つなぎ資金: 回収予定日\n6. 余剰資金がないことの説明\n1円単位での整合性を確保。全て表形式。\n\n${context}`,
      monthly: `以下の企業情報を基に「月次業績推移表」を作成。\n直近24ヶ月分の表形式で:\n| 年月 | 売上 | 原価 | 粗利 | 販管費 | 営利 | 経利 | CF |\n- 四半期合計・前年同月比を併記\n- 季節変動要因の解説\n- トレンド分析（矢印で上昇/下降を表示）\n- 異常値月の理由\n\n${context}`,
      collateral: `以下の企業情報を基に「担保評価書」を作成。\n## 必須構成\n1. 担保物件一覧表（所在地・面積・地目・建物構造・築年数）\n2. 評価額表（路線価・時価・掛目後評価）\n3. 既存担保設定状況（抵当権者・設定額・順位）表形式\n4. 担保余力の算出\n5. 動産担保（ABL対象: 売掛金・在庫・機械）\n6. 保証人の資産状況\n\n${context}`,
      clients: `以下の企業情報を基に「取引先一覧表」を作成。\n## 必須構成\n1. 販売先TOP10表（企業名・年間売上・構成比・取引年数・回収条件）\n2. 仕入先TOP10表（企業名・年間仕入・構成比・取引年数・支払条件）\n3. 取引先集中度分析（上位3社依存率）\n4. 取引先関係図（取引フロー）\n5. 与信リスク評価\n\n${context}`,
      permits: `以下の企業情報を基に「許認可・資格一覧」を作成。\n## 必須構成\n1. 許認可一覧表（名称・番号・取得日・有効期限・管轄官庁）\n2. 資格保有者一覧表（資格名・取得者・取得日）\n3. ISO・認定等（規格名・認定番号・認定機関）\n4. 業界団体加盟状況\n5. 事業に必須の許認可の充足状況\n\n${context}`,
      swot: `以下の企業情報を基に「SWOT分析書」を作成。\n## 必須構成\n1. SWOT 4象限マトリックス表（各5項目以上）\n   S: 内部プラス / W: 内部マイナス / O: 外部プラス / T: 外部マイナス\n2. クロスSWOT戦略表\n   SO戦略（強み×機会） / WO戦略（弱み×機会） / ST戦略（強み×脅威） / WT戦略（弱み×脅威）\n3. 対金融機関への訴求ポイント3つ\n全て表形式で整理。\n\n${context}`,
      ringi: `以下の企業情報を基に「金融機関別稟議サポート資料」を作成。\n銀行員が稟議書にそのまま転記できるフォーマットで:\n1. 案件概要表（借入人・金額・期間・資金使途・返済方法）\n2. 企業概要（業種・年商・従業員・業歴）\n3. 財務分析表（主要指標5つ+業界平均比較）\n4. 返済能力分析（CF計算）\n5. 担保・保証の状況表\n6. 融資判断ポイント（承認理由3つ）\n7. リスク要因と軽減策\n8. 総合所見（承認推奨根拠）\n稟議書の所見欄にコピペ可能な文章で。\n\n${context}`,
    };
    let prompt = prompts[docType] || `以下の企業情報を基に融資関連資料を作成。\n\n${context}`;
    if (customPrompt) prompt += `\n\n【追加指示】\n${customPrompt}`;
    return prompt;
  },

  // 財務指標の自動計算
  buildFinancialIndicators(dna) {
    let ind = '';
    const rev = parseFloat(dna.annualRevenue) || 0;
    const op = parseFloat(dna.operatingProfit) || 0;
    const dep = parseFloat(dna.depreciation) || 0;
    const debt = parseFloat(dna.totalDebt) || 0;
    const na = parseFloat(dna.netAssets) || 0;
    const ta = parseFloat(dna.totalAssets) || 0;
    if (rev > 0 || debt > 0) {
      ind += '\n【自動計算指標】\n';
      if (rev > 0 && op !== 0) ind += `営業利益率: ${(op/rev*100).toFixed(1)}%\n`;
      if (ta > 0 && na !== 0) ind += `自己資本比率: ${(na/ta*100).toFixed(1)}%\n`;
      const cf = op + dep;
      if (cf > 0 && debt > 0) {
        const wc = rev * 0.15;
        ind += `債務償還年数: ${((debt-wc)/cf).toFixed(1)}年(正常先基準:10年以内)\n`;
      }
      if (cf > 0) ind += `返済原資(営業CF): ${cf.toFixed(0)}万円/年(月${(cf/12).toFixed(0)}万円)\n`;
      if (debt > 0 && rev > 0) ind += `借入金月商倍率: ${(debt/(rev/12)).toFixed(1)}ヶ月\n`;
    }
    return ind;
  },

  _lastContent: ''
};
