/* ============================================================
 * LOAN CRAFT ENGINE - 決算書分析モジュール
 * 決算書データ入力→自動分析→DNA反映
 * ============================================================ */

const FinancialAnalysis = {

  // 決算書入力フォーム表示
  showUploadForm() {
    const dna = Database.loadCompanyData() || {};
    let html = `<div class="glass-card highlight" style="max-width:900px;margin:0 auto;">
      <div class="report-title">📊 決算書分析</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
        決算書の数値を入力すると、自動分析してDNAに反映します。
      </p>

      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button class="btn btn-primary btn-sm" onclick="FinancialAnalysis.showPeriod(1)">第1期</button>
        <button class="btn btn-secondary btn-sm" onclick="FinancialAnalysis.showPeriod(2)">第2期</button>
        <button class="btn btn-secondary btn-sm" onclick="FinancialAnalysis.showPeriod(3)">第3期</button>
      </div>

      <div id="faPeriodForms">
        ${this._renderPeriodForm(1, dna)}
      </div>

      <div style="margin-top:20px;display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="FinancialAnalysis.analyze()">📊 分析実行</button>
        <button class="btn btn-secondary" onclick="FinancialAnalysis.syncToDNA()">🧬 DNAに反映</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  showPeriod(n) {
    const dna = Database.loadCompanyData() || {};
    const el = document.getElementById('faPeriodForms');
    if (el) el.innerHTML = this._renderPeriodForm(n, dna);
    document.querySelectorAll('#faPeriodForms').forEach(() => {});
  },

  _renderPeriodForm(period, dna) {
    const fs = dna[`fs_period${period}`] || {};
    const label = period === 1 ? '直近期' : period === 2 ? '前期' : '前々期';
    return `<div class="report-subtitle">📄 ${label}（第${period}期）</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
      <div><label style="font-size:11px;color:var(--text-muted);">決算期</label>
        <input id="fa_term${period}" value="${fs.term||''}" placeholder="2025年3月期" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
      <div><label style="font-size:11px;color:var(--text-muted);">月数</label>
        <input id="fa_months${period}" type="number" value="${fs.months||12}" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
      <div></div>
    </div>

    <div class="report-subtitle" style="font-size:12px;">損益計算書 (P/L)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
      ${this._field(`fa_revenue${period}`, '売上高', fs.revenue, '万円')}
      ${this._field(`fa_cogs${period}`, '売上原価', fs.cogs, '万円')}
      ${this._field(`fa_grossProfit${period}`, '売上総利益', fs.grossProfit, '万円')}
      ${this._field(`fa_sgaExp${period}`, '販管費', fs.sgaExp, '万円')}
      ${this._field(`fa_opProfit${period}`, '営業利益', fs.opProfit, '万円')}
      ${this._field(`fa_ordProfit${period}`, '経常利益', fs.ordProfit, '万円')}
      ${this._field(`fa_netProfit${period}`, '当期純利益', fs.netProfit, '万円')}
      ${this._field(`fa_depreciation${period}`, '減価償却費', fs.depreciation, '万円')}
      ${this._field(`fa_interestExp${period}`, '支払利息', fs.interestExp, '万円')}
    </div>

    <div class="report-subtitle" style="font-size:12px;">貸借対照表 (B/S)</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
      ${this._field(`fa_cash${period}`, '現預金', fs.cash, '万円')}
      ${this._field(`fa_receivables${period}`, '売掛金', fs.receivables, '万円')}
      ${this._field(`fa_inventory${period}`, '棚卸資産', fs.inventory, '万円')}
      ${this._field(`fa_currentAssets${period}`, '流動資産合計', fs.currentAssets, '万円')}
      ${this._field(`fa_fixedAssets${period}`, '固定資産合計', fs.fixedAssets, '万円')}
      ${this._field(`fa_totalAssets${period}`, '総資産', fs.totalAssets, '万円')}
      ${this._field(`fa_payables${period}`, '買掛金', fs.payables, '万円')}
      ${this._field(`fa_shortDebt${period}`, '短期借入金', fs.shortDebt, '万円')}
      ${this._field(`fa_currentLiab${period}`, '流動負債合計', fs.currentLiab, '万円')}
      ${this._field(`fa_longDebt${period}`, '長期借入金', fs.longDebt, '万円')}
      ${this._field(`fa_totalLiab${period}`, '負債合計', fs.totalLiab, '万円')}
      ${this._field(`fa_netAssets${period}`, '純資産', fs.netAssets, '万円')}
    </div>`;
  },

  _field(id, label, val, unit) {
    return `<div><label style="font-size:10px;color:var(--text-muted);">${label}(${unit})</label>
      <input id="${id}" type="number" value="${val||''}" placeholder="0" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>`;
  },

  // フォーム保存
  _savePeriod(period) {
    const g = id => parseFloat(document.getElementById(id)?.value) || 0;
    const dna = Database.loadCompanyData() || {};
    dna[`fs_period${period}`] = {
      term: document.getElementById(`fa_term${period}`)?.value || '',
      months: g(`fa_months${period}`) || 12,
      revenue: g(`fa_revenue${period}`), cogs: g(`fa_cogs${period}`), grossProfit: g(`fa_grossProfit${period}`),
      sgaExp: g(`fa_sgaExp${period}`), opProfit: g(`fa_opProfit${period}`), ordProfit: g(`fa_ordProfit${period}`),
      netProfit: g(`fa_netProfit${period}`), depreciation: g(`fa_depreciation${period}`), interestExp: g(`fa_interestExp${period}`),
      cash: g(`fa_cash${period}`), receivables: g(`fa_receivables${period}`), inventory: g(`fa_inventory${period}`),
      currentAssets: g(`fa_currentAssets${period}`), fixedAssets: g(`fa_fixedAssets${period}`), totalAssets: g(`fa_totalAssets${period}`),
      payables: g(`fa_payables${period}`), shortDebt: g(`fa_shortDebt${period}`), currentLiab: g(`fa_currentLiab${period}`),
      longDebt: g(`fa_longDebt${period}`), totalLiab: g(`fa_totalLiab${period}`), netAssets: g(`fa_netAssets${period}`),
    };
    Database.saveCompanyData(dna);
  },

  // 分析実行
  analyze() {
    // 全期間保存
    for (let p = 1; p <= 3; p++) {
      if (document.getElementById(`fa_term${p}`)) this._savePeriod(p);
    }
    const dna = Database.loadCompanyData() || {};
    const results = [];

    for (let p = 1; p <= 3; p++) {
      const fs = dna[`fs_period${p}`];
      if (!fs || !fs.revenue) continue;
      const r = { period: p, term: fs.term };
      // 安全性
      r.equityRatio = fs.totalAssets > 0 ? (fs.netAssets / fs.totalAssets * 100).toFixed(1) : '-';
      r.currentRatio = fs.currentLiab > 0 ? (fs.currentAssets / fs.currentLiab * 100).toFixed(1) : '-';
      const totalDebt = (fs.shortDebt || 0) + (fs.longDebt || 0);
      r.gearing = fs.netAssets > 0 ? (totalDebt / fs.netAssets * 100).toFixed(1) : '-';
      const cf = (fs.opProfit || 0) + (fs.depreciation || 0);
      const wc = fs.revenue * 0.15;
      r.debtRepayYears = cf > 0 ? ((totalDebt - wc) / cf).toFixed(1) : '-';
      // 収益性
      r.opMargin = fs.revenue > 0 ? (fs.opProfit / fs.revenue * 100).toFixed(1) : '-';
      r.ordMargin = fs.revenue > 0 ? (fs.ordProfit / fs.revenue * 100).toFixed(1) : '-';
      r.roa = fs.totalAssets > 0 ? (fs.ordProfit / fs.totalAssets * 100).toFixed(1) : '-';
      // 返済能力
      r.cashFlow = cf;
      r.monthlyRepay = cf > 0 ? (cf / 12).toFixed(0) : '-';
      r.icr = fs.interestExp > 0 ? (fs.opProfit / fs.interestExp).toFixed(1) : '-';
      // 効率性
      r.assetTurnover = fs.totalAssets > 0 ? (fs.revenue / fs.totalAssets).toFixed(2) : '-';
      r.receivableDays = fs.revenue > 0 ? (fs.receivables / (fs.revenue / 365)).toFixed(0) : '-';
      results.push(r);
    }

    if (results.length === 0) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '決算データが入力されていません。'));
      return;
    }

    // 結果を表示
    let html = `<div class="glass-card highlight" style="max-width:900px;margin:0 auto;">
      <div class="report-title">📊 決算書分析レポート</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">指標</th>
          ${results.map(r => `<th style="padding:8px;text-align:right;">${r.term || '第'+r.period+'期'}</th>`).join('')}
          <th style="padding:8px;text-align:right;">基準</th>
        </tr>
        ${this._row('自己資本比率', results.map(r=>r.equityRatio+'%'), '20%以上')}
        ${this._row('流動比率', results.map(r=>r.currentRatio+'%'), '150%以上')}
        ${this._row('ギアリング比率', results.map(r=>r.gearing+'%'), '100%以下')}
        ${this._row('債務償還年数', results.map(r=>r.debtRepayYears+'年'), '10年以内')}
        ${this._row('営業利益率', results.map(r=>r.opMargin+'%'), '3%以上')}
        ${this._row('経常利益率', results.map(r=>r.ordMargin+'%'), '3%以上')}
        ${this._row('ROA', results.map(r=>r.roa+'%'), '2%以上')}
        ${this._row('ICR(利払倍率)', results.map(r=>r.icr+'倍'), '2倍以上')}
        ${this._row('総資本回転率', results.map(r=>r.assetTurnover+'回'), '1.0以上')}
        ${this._row('売掛回転日数', results.map(r=>r.receivableDays+'日'), '60日以内')}
        ${this._row('年間CF', results.map(r=>(r.cashFlow||0).toLocaleString()+'万'), '-')}
        ${this._row('月返済可能額', results.map(r=>r.monthlyRepay+'万/月'), '-')}
      </table>

      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="FinancialAnalysis.syncToDNA()">🧬 DNAに反映</button>
        <button class="btn btn-secondary btn-sm" onclick="FinancialAnalysis.showUploadForm()">✏️ 数値修正</button>
      </div>
    </div>`;

    Database.save('fa_results', results);
    App.addSystemMessage(html);
  },

  _row(label, values, benchmark) {
    return `<tr style="border-bottom:1px solid var(--border-secondary);">
      <td style="padding:6px;font-weight:600;">${label}</td>
      ${values.map(v => `<td style="padding:6px;text-align:right;">${v}</td>`).join('')}
      <td style="padding:6px;text-align:right;color:var(--text-muted);font-size:11px;">${benchmark}</td>
    </tr>`;
  },

  // DNAに反映
  syncToDNA() {
    const dna = Database.loadCompanyData() || {};
    const fs1 = dna.fs_period1;
    if (!fs1 || !fs1.revenue) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '第1期の決算データを入力してから反映してください。'));
      return;
    }
    // DNAの財務フィールドに反映
    dna.annualRevenue = fs1.revenue;
    dna.operatingProfit = fs1.opProfit;
    dna.ordinaryProfit = fs1.ordProfit;
    dna.netProfit = fs1.netProfit;
    dna.depreciation = fs1.depreciation;
    dna.totalAssets = fs1.totalAssets;
    dna.netAssets = fs1.netAssets;
    dna.totalDebt = (fs1.shortDebt || 0) + (fs1.longDebt || 0);
    dna.cash = fs1.cash;
    dna.receivables = fs1.receivables;
    dna.inventory = fs1.inventory;
    dna.payables = fs1.payables;
    Database.saveCompanyData(dna);
    App.addSystemMessage(Utils.createAlert('success', '✅', '決算データを企業DNAに反映しました。格付け診断・資料生成の精度が向上します。'));
  },


  
  // AI呼出共通ヘルパー
  async _callAI(systemPrompt, userPrompt) {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const apiKey = settings.openaiApiKey;
    const model = settings.openaiModel || 'gpt-4o-mini';
    
    // サーバー経由を優先
    try {
      const data = await ApiClient.request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 4000, temperature: 0.4 })
      });
      if (data && data.choices) return data.choices[0].message.content;
    } catch(e) {}
    
    // フォールバック: ローカル直接呼出
    if (!apiKey) return null;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 4000, temperature: 0.4 })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  },

  // AI決算書分析レポート
  async aiAnalyzeFinancials() {
    const data = Database.loadCompanyData() || {};
    const results = [];
    for (let p = 1; p <= 3; p++) {
      const fs = data['financial_period' + p];
      if (fs) results.push({ period: p, ...fs });
    }
    if (results.length === 0) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', '先に決算データを入力してください（/決算分析）。')); return; }

    App.addSystemMessage(Utils.createAlert('info', '🤖', 'AI決算書分析レポートを生成中...'));

    const systemPrompt = 'あなたは中小企業の財務分析専門家です。銀行審査の視点から決算書を分析し、改善提案を行ってください。日本語で回答してください。';
    const userPrompt = `以下の決算データを分析し、銀行審査の視点からレポートを作成してください。

【決算データ】
${results.map(r => `第${r.period}期: 売上${r.revenue || 0}万 営業利益${r.operatingProfit || 0}万 経常利益${r.ordinaryProfit || 0}万 純資産${r.netAssets || 0}万 総資産${r.totalAssets || 0}万 借入${r.totalDebt || 0}万`).join('\n')}

以下の形式で回答してください：
## 📊 決算書AI分析レポート

### 収益性分析
売上・利益の推移と銀行評価

### 安全性分析
自己資本比率・債務の評価

### 成長性分析
トレンドの評価

### ⚠️ 銀行が懸念するポイント
具体的な懸念事項

### 📈 改善提案（3項目）
具体的な数値目標を含めた改善策`;

    try {
      const content = await this._callAI(systemPrompt, userPrompt);
      if (!content) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'APIキーが未設定です。')); return; }
      App.addSystemMessage(`<div class="glass-card highlight">
        <div class="report-title">📊 AI決算書分析レポート</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${Utils.escapeHtml(content)}</div>
      </div>`);
    } catch(e) { App.addSystemMessage(Utils.createAlert('error', '❌', 'AI分析エラー: ' + e.message)); }
  },
};
