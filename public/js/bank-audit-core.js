/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 銀行融資審査AIシステム（コア）
 * MODULE 1: 決算書OCR取込・財務反映
 * MODULE 3: 格付判定・債務者区分
 * MODULE 4: 個人資産緩和
 * ============================================================ */
const BankAudit = {
  // 現在の財務データ
  currentFS: null,
  currentFS2: null,
  currentPlan: null,
  taxRate: 0.35,
  // 業種コード（製造業:manufacturing, 卸売:wholesale, サービス:service, その他:other）
  industry: 'other',

  // ===== MODULE 1: 決算書取込 =====
  showOCRImport() {
    const dna = Database.loadCompanyData() || {};
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 決算書取込・財務反映</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">
        決算書の数値を入力し、PL/BS/CFを構築します。銀行はPLを2期分見ます。
      </p>
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <select id="ba_unit" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
          <option value="thousand">千円</option><option value="million">百万円</option><option value="yen">円</option>
        </select>
        <input id="ba_period" value="${dna.companyName ? dna.companyName + ' ' : ''}${new Date().getFullYear()}年3月期" placeholder="決算期名" style="flex:1;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
        <select id="ba_type" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
          <option value="standalone">単体決算</option><option value="consolidated">連結決算</option>
        </select>
        <select id="ba_industry" onchange="BankAudit.industry=this.value" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
          <option value="other">業種選択</option>
          <option value="manufacturing">製造業</option>
          <option value="wholesale">卸売業</option>
          <option value="service">サービス業</option>
          <option value="construction">建設業</option>
          <option value="retail">小売業</option>
          <option value="other">その他</option>
        </select>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="BankAudit.showTab('pl')">📄 PL（当期）</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showTab('pl2')">📄 PL（前期）</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showTab('bs')">📄 BS</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showTab('cf')">📄 CF</button>
      </div>
      <div id="ba_tabContent">${this._renderPLForm({})}</div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="BankAudit.validateAndSave()">✅ 整合性チェック＆保存</button>
        <button class="btn btn-secondary" onclick="BankAudit.syncToDNA()">🧬 DNAに反映</button>
        <button class="btn btn-secondary" onclick="BankAudit.showCaseJudgment()">🏦 格付判定へ</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  showTab(tab) {
    const el = document.getElementById('ba_tabContent');
    if (!el) return;
    // タブ切替時にPL2データを保存
    if (this._currentTab === 'pl2') this._savePL2();
    this._currentTab = tab;
    if (tab === 'pl') { const d = this._collectFS(); el.innerHTML = this._renderPLForm(d); }
    else if (tab === 'pl2') { el.innerHTML = this._renderPLForm(this.currentFS2 || {}, '前期'); }
    else if (tab === 'bs') { const d = this._collectFS(); el.innerHTML = this._renderBSForm(d); }
    else if (tab === 'cf') { const d = this._collectFS(); el.innerHTML = this._renderCFForm(d); }
  },

  // 前期PL保存用
  _savePL2() {
    const d = {};
    const keys = ['revenue','cogs','grossProfit','laborCost','deprecCost','otherCost','sgaExp','sgaLabor','sgaDeprec','opProfit','nonOpIncome','nonOpExp','interestExp','ordProfit','specialProfit','specialLoss','preTaxProfit','netProfit','deprecTotal','interestIncome'];
    keys.forEach(k => { d[k] = this._g('ba_' + k); });
    this.currentFS2 = d;
  },

  _inp(id, label, val) {
    return `<div><label style="font-size:10px;color:var(--text-muted);">${label}</label>
      <input id="${id}" type="number" value="${val||''}" placeholder="0" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>`;
  },

  _renderPLForm(d, periodLabel) {
    const g = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;';
    const pl = periodLabel || '当期';
    return `<div class="report-subtitle" style="font-size:13px;">📄 損益計算書 (P/L) — ${pl}</div>
    <div style="${g}">
      ${this._inp('ba_revenue','売上高',d.revenue)}
      ${this._inp('ba_cogs','売上原価',d.cogs)}
      ${this._inp('ba_grossProfit','売上総利益',d.grossProfit)}
    </div><div style="${g}">
      ${this._inp('ba_laborCost','労務費（原価内）',d.laborCost)}
      ${this._inp('ba_deprecCost','減価償却費（原価内）',d.deprecCost)}
      ${this._inp('ba_otherCost','その他原価',d.otherCost)}
    </div><div style="${g}">
      ${this._inp('ba_sgaExp','販管費合計',d.sgaExp)}
      ${this._inp('ba_sgaLabor','販管費・人件費',d.sgaLabor)}
      ${this._inp('ba_sgaDeprec','販管費・減価償却',d.sgaDeprec)}
    </div><div style="${g}">
      ${this._inp('ba_opProfit','営業利益',d.opProfit)}
      ${this._inp('ba_nonOpIncome','営業外収益',d.nonOpIncome)}
      ${this._inp('ba_nonOpExp','営業外費用',d.nonOpExp)}
    </div><div style="${g}">
      ${this._inp('ba_interestExp','支払利息',d.interestExp)}
      ${this._inp('ba_ordProfit','経常利益',d.ordProfit)}
      ${this._inp('ba_specialProfit','特別利益',d.specialProfit)}
    </div><div style="${g}">
      ${this._inp('ba_specialLoss','特別損失',d.specialLoss)}
      ${this._inp('ba_preTaxProfit','税引前当期純利益',d.preTaxProfit)}
      ${this._inp('ba_netProfit','当期純利益',d.netProfit)}
    </div><div style="${g}">
      ${this._inp('ba_deprecTotal','減価償却費合計',d.deprecTotal)}
      ${this._inp('ba_interestIncome','受取利息',d.interestIncome)}
      <div></div>
    </div>`;
  },

  _renderBSForm(d) {
    const g = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;';
    return `<div class="report-subtitle" style="font-size:13px;">📄 貸借対照表 (B/S)</div>
    <div class="report-subtitle" style="font-size:11px;color:var(--accent-cyan);">【資産の部】</div>
    <div style="${g}">
      ${this._inp('ba_cash','現預金',d.cash)}
      ${this._inp('ba_notesRec','受取手形',d.notesRec)}
      ${this._inp('ba_accountsRec','売掛金',d.accountsRec)}
    </div><div style="${g}">
      ${this._inp('ba_inventory','棚卸資産',d.inventory)}
      ${this._inp('ba_otherCA','その他流動資産',d.otherCA)}
      ${this._inp('ba_currentAssets','流動資産合計',d.currentAssets)}
    </div><div style="${g}">
      ${this._inp('ba_tangibleFA','有形固定資産',d.tangibleFA)}
      ${this._inp('ba_intangibleFA','無形固定資産',d.intangibleFA)}
      ${this._inp('ba_investFA','投資その他',d.investFA)}
    </div><div style="${g}">
      ${this._inp('ba_fixedAssets','固定資産合計',d.fixedAssets)}
      ${this._inp('ba_deferredAssets','繰延資産',d.deferredAssets)}
      ${this._inp('ba_totalAssets','資産合計',d.totalAssets)}
    </div>
    <div class="report-subtitle" style="font-size:11px;color:var(--accent-cyan);">【負債の部】</div>
    <div style="${g}">
      ${this._inp('ba_notesPay','支払手形',d.notesPay)}
      ${this._inp('ba_accountsPay','買掛金',d.accountsPay)}
      ${this._inp('ba_shortDebt','短期借入金',d.shortDebt)}
    </div><div style="${g}">
      ${this._inp('ba_otherCL','その他流動負債',d.otherCL)}
      ${this._inp('ba_currentLiab','流動負債合計',d.currentLiab)}
      ${this._inp('ba_longDebt','長期借入金',d.longDebt)}
    </div><div style="${g}">
      ${this._inp('ba_bonds','社債',d.bonds)}
      ${this._inp('ba_otherFL','その他固定負債',d.otherFL)}
      ${this._inp('ba_fixedLiab','固定負債合計',d.fixedLiab)}
    </div><div style="${g}">
      ${this._inp('ba_totalLiab','負債合計',d.totalLiab)}
      <div></div><div></div>
    </div>
    <div class="report-subtitle" style="font-size:11px;color:var(--accent-cyan);">【純資産の部】</div>
    <div style="${g}">
      ${this._inp('ba_capital','資本金',d.capital)}
      ${this._inp('ba_capitalSurplus','資本剰余金',d.capitalSurplus)}
      ${this._inp('ba_retainedEarnings','利益剰余金',d.retainedEarnings)}
    </div><div style="${g}">
      ${this._inp('ba_netAssets','純資産合計',d.netAssets)}
      <div></div><div></div>
    </div>`;
  },

  _renderCFForm(d) {
    const g = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;';
    return `<div class="report-subtitle" style="font-size:13px;">📄 キャッシュフロー計算書 (C/F)</div>
    <div style="${g}">
      ${this._inp('ba_opCF','営業CF',d.opCF)}
      ${this._inp('ba_investCF','投資CF',d.investCF)}
      ${this._inp('ba_fcf','FCF（営業+投資）',d.fcf)}
    </div><div style="${g}">
      ${this._inp('ba_financeCF','財務CF',d.financeCF)}
      ${this._inp('ba_beginCash','期首現金',d.beginCash)}
      ${this._inp('ba_endCash','期末現金',d.endCash)}
    </div>`;
  },

  _g(id) { return parseFloat(document.getElementById(id)?.value) || 0; },

  _collectFS() {
    const keys = ['revenue','cogs','grossProfit','laborCost','deprecCost','otherCost',
      'sgaExp','sgaLabor','sgaDeprec','opProfit','nonOpIncome','nonOpExp','interestExp',
      'ordProfit','specialProfit','specialLoss','preTaxProfit','netProfit','deprecTotal','interestIncome',
      'cash','notesRec','accountsRec','inventory','otherCA','currentAssets',
      'tangibleFA','intangibleFA','investFA','fixedAssets','deferredAssets','totalAssets',
      'notesPay','accountsPay','shortDebt','otherCL','currentLiab',
      'longDebt','bonds','otherFL','fixedLiab','totalLiab',
      'capital','capitalSurplus','retainedEarnings','netAssets',
      'opCF','investCF','fcf','financeCF','beginCash','endCash'];
    const d = {};
    keys.forEach(k => { d[k] = this._g('ba_' + k); });
    return d;
  },

  // 整合性チェック
  validateAndSave() {
    const d = this._collectFS();
    const errors = [];
    // BS貸借一致
    if (d.totalAssets > 0 && d.totalLiab > 0 && d.netAssets !== undefined) {
      const diff = Math.abs(d.totalAssets - (d.totalLiab + d.netAssets));
      if (diff > 1) errors.push(`BS不一致: 資産合計(${d.totalAssets}) ≠ 負債(${d.totalLiab})+純資産(${d.netAssets}) 差額=${diff}`);
    }
    // PL整合
    if (d.revenue > 0 && d.cogs > 0) {
      const calcGP = d.revenue - d.cogs;
      if (Math.abs(calcGP - d.grossProfit) > 1) errors.push(`PL不整合: 売上高-売上原価(${calcGP}) ≠ 売上総利益(${d.grossProfit})`);
    }
    if (d.grossProfit > 0 && d.sgaExp > 0) {
      const calcOP = d.grossProfit - d.sgaExp;
      if (d.opProfit > 0 && Math.abs(calcOP - d.opProfit) > 1) errors.push(`PL不整合: 売上総利益-販管費(${calcOP}) ≠ 営業利益(${d.opProfit})`);
    }
    // CF整合
    if (d.opCF !== 0 && d.investCF !== 0) {
      const calcFCF = d.opCF + d.investCF;
      if (d.fcf !== 0 && Math.abs(calcFCF - d.fcf) > 1) errors.push(`CF不整合: 営業CF+投資CF(${calcFCF}) ≠ FCF(${d.fcf})`);
    }
    this.currentFS = d;
    if (errors.length > 0) {
      let html = '<div class="report-subtitle">⚠️ 整合性チェック結果</div>';
      errors.forEach(e => { html += Utils.createAlert('warning', '⚠️', e); });
      html += '<div style="margin-top:12px;"><button class="btn btn-secondary btn-sm" onclick="BankAudit.showOCRImport()">✏️ 修正する</button></div>';
      App.addSystemMessage(html);
    } else {
      App.addSystemMessage(Utils.createAlert('success', '✅', '整合性チェック合格。財務データを保存しました。'));
      this._saveToServer(d);
    }
  },

  async _saveToServer(d) {
    try {
      await ApiClient.request('/api/financial/statements', {
        method: 'POST',
        body: JSON.stringify({
          company_name: (Database.loadCompanyData() || {}).companyName || '',
          period_label: document.getElementById('ba_period')?.value || '',
          unit: document.getElementById('ba_unit')?.value || 'thousand',
          statement_type: document.getElementById('ba_type')?.value || 'standalone',
          pl_data: d, bs_data: d, cf_data: d
        })
      });
    } catch(e) { console.warn('サーバー保存スキップ:', e.message); }
  },

  syncToDNA() {
    const d = this.currentFS || this._collectFS();
    if (!d.revenue) { App.addSystemMessage(Utils.createAlert('warning','⚠️','決算データを入力してください。')); return; }
    const dna = Database.loadCompanyData() || {};
    dna.annualRevenue = d.revenue;
    dna.operatingProfit = d.opProfit;
    dna.ordinaryProfit = d.ordProfit;
    dna.netIncome = d.netProfit;
    dna.depreciation = d.deprecTotal;
    dna.totalAssets = d.totalAssets;
    dna.netAssets = d.netAssets;
    dna.totalDebt = (d.shortDebt||0) + (d.longDebt||0) + (d.bonds||0);
    dna.cash = d.cash;
    dna.receivables = (d.notesRec||0) + (d.accountsRec||0);
    dna.inventory = d.inventory;
    dna.payables = (d.notesPay||0) + (d.accountsPay||0);
    dna.interestExpense = d.interestExp;
    dna.currentAssets = d.currentAssets;
    dna.currentLiabilities = d.currentLiab;
    dna.fixedAssets = d.fixedAssets;
    Database.saveCompanyData(dna);
    App.addSystemMessage(Utils.createAlert('success','✅','決算データをDNAに反映しました。'));
  },

  // ===== MODULE 3: 格付判定 =====
  showCaseJudgment(isUpdate = false) {
    let fs;
    if (isUpdate) {
      fs = {
        revenue: this._g('rj_revenue'),
        opProfit: this._g('rj_opProfit'),
        ordProfit: this._g('rj_ordProfit'),
        netProfit: this._g('rj_netProfit'),
        totalAssets: this._g('rj_totalAssets'),
        netAssets: this._g('rj_netAssets'),
        deprecTotal: this._g('rj_deprecTotal'),
        shortDebt: this._g('rj_ibd') * 0.4,
        longDebt: this._g('rj_ibd') * 0.6,
        cash: this._g('rj_cash'),
        bonds: 0,
        notesRec: 0, accountsRec: this.currentFS?.accountsRec || 0,
        inventory: this.currentFS?.inventory || 0,
        notesPay: 0, accountsPay: this.currentFS?.accountsPay || 0,
        currentAssets: this.currentFS?.currentAssets || 0,
        fixedAssets: this.currentFS?.fixedAssets || 0,
        currentLiab: this.currentFS?.currentLiab || 0,
        interestExp: this._g('rj_interestExp') || 0
      };
      this.currentFS = { ...(this.currentFS || {}), ...fs };
    } else {
      const d = this.currentFS || this._collectFS();
      const dna = Database.loadCompanyData() || {};
      fs = d.revenue > 0 ? d : {
        revenue: dna.annualRevenue||0, opProfit: dna.operatingProfit||0,
        ordProfit: dna.ordinaryProfit||0, netProfit: dna.netIncome||0,
        totalAssets: dna.totalAssets||0, netAssets: dna.netAssets||0,
        deprecTotal: dna.depreciation||0, interestExp: dna.interestExpense||0,
        shortDebt: dna.totalDebt*0.4||0, longDebt: dna.totalDebt*0.6||0,
        cash: dna.cashDeposits||0,
        notesRec: 0, accountsRec: dna.receivables||0, inventory: dna.inventory||0,
        notesPay: 0, accountsPay: dna.payables||0,
        currentAssets: dna.currentAssets||0, fixedAssets: dna.fixedAssets||0,
        deferredAssets: 0, currentLiab: dna.currentLiabilities||0,
        bonds: 0
      };
      this.currentFS = fs;
    }
    if (!fs.revenue) { App.addSystemMessage(Utils.createAlert('warning','⚠️','決算データがありません。/決算取込 か /DNA で入力してください。')); return; }

    const indicators = this._calcIndicators(fs);
    const simpleCF = this._calcSimpleCF(fs);
    const ebitda = (fs.opProfit||0) + (fs.deprecTotal||0);
    const category = this._determineCategory(indicators, simpleCF);
    const indLbls = {manufacturing:'製造業',wholesale:'卸売業',service:'サービス業',construction:'建設業',retail:'飲食・小売業',realestate:'不動産賃貸・管理業',it:'IT・SaaS業',medical:'医療・クリニック',agriculture:'農業・一次産業',startup:'スタートアップ',other:''};
    const indLabel = indLbls[this.industry] || '標準（指定なし）';

    // 2期比較データ
    const fs2 = this.currentFS2 || {};
    const hasP2 = fs2.revenue > 0;
    const revChange = hasP2 ? ((fs.revenue - fs2.revenue) / fs2.revenue * 100).toFixed(1) : null;
    const opChange = hasP2 && fs2.opProfit ? ((fs.opProfit - fs2.opProfit) / Math.abs(fs2.opProfit) * 100).toFixed(1) : null;

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
    <div class="report-title">🏦 財務・融資審査レポート${indLabel ? ' — ' + indLabel : ''}</div>
    ${hasP2 ? `<div style="font-size:11px;color:var(--accent-cyan);margin-bottom:8px;">📊 2期比較: 売上高 ${revChange>=0?'+':''}${revChange}% / 営業利益 ${opChange!==null?(opChange>=0?'+':'')+opChange+'%':'—'}</div>` : '<div style="font-size:11px;color:var(--accent-gold);margin-bottom:8px;">⚠️ 銀行はPLを2期分見ます。前期データも入力すると精度が向上します。</div>'}

    <div class="glass-card" style="padding:16px;margin-bottom:16px;background:rgba(108,99,255,0.04);">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px;">✏️ 財務数値シミュレーション（手入力で即時判定）</div>
      <div style="font-size:10px;color:var(--text-secondary);margin-bottom:12px;">以下の数値を直接変更して「判定を更新」ボタンを押すと、格付や指標の変化を即座にシミュレーションできます。</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">
        ${this._inp('rj_revenue', '売上高', fs.revenue)}
        ${this._inp('rj_opProfit', '営業利益', fs.opProfit)}
        ${this._inp('rj_ordProfit', '経常利益', fs.ordProfit)}
        ${this._inp('rj_netProfit', '当期純利益', fs.netProfit)}
        ${this._inp('rj_deprecTotal', '減価償却費', fs.deprecTotal)}
        ${this._inp('rj_ibd', '有利子負債', (fs.shortDebt||0)+(fs.longDebt||0)+(fs.bonds||0))}
        ${this._inp('rj_cash', '現預金', fs.cash)}
        ${this._inp('rj_totalAssets', '総資産', fs.totalAssets)}
        ${this._inp('rj_netAssets', '純資産', fs.netAssets)}
        ${this._inp('rj_interestExp', '支払利息', fs.interestExp)}
      </div>
      <div style="margin-top:12px;text-align:right;">
        <button class="btn btn-primary btn-sm" onclick="BankAudit.showCaseJudgment(true)">🔄 判定を更新</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin:16px 0;">
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:10px;color:var(--text-muted);">債務者区分</div>
        <div style="font-size:16px;font-weight:800;color:${category.color};margin:4px 0;">${category.label}</div>
      </div>
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:10px;color:var(--text-muted);">償還年数</div>
        <div style="font-size:16px;font-weight:800;color:${indicators.repayColor};margin:4px 0;">${indicators.repayYears}</div>
      </div>
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:10px;color:var(--text-muted);">EBITDA</div>
        <div style="font-size:16px;font-weight:800;margin:4px 0;">${ebitda.toLocaleString()}</div>
      </div>
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:10px;color:var(--text-muted);">簡易営業CF</div>
        <div style="font-size:16px;font-weight:800;margin:4px 0;">${simpleCF.value.toLocaleString()}</div>
        <div style="font-size:9px;color:var(--text-muted);">実質経常利益×(1-税率)+償却</div>
      </div>
    </div>`;

    // 指標テーブル
    html += `<div class="report-subtitle">📊 定量評価指標</div>
    <table style="width:100%;font-size:12px;border-collapse:collapse;">
      <tr style="border-bottom:2px solid var(--border-secondary);">
        <th style="padding:6px;text-align:left;">指標</th><th style="text-align:right;">数値</th><th style="text-align:right;">判定</th>
      </tr>`;
    indicators.list.forEach(i => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);">
        <td style="padding:6px;">${i.label}</td>
        <td style="padding:6px;text-align:right;font-weight:600;">${i.value}</td>
        <td style="padding:6px;text-align:right;color:${i.color};">${i.verdict}</td>
      </tr>`;
    });
    html += `</table>`;

    // 営業CF簡易査定
    html += `<div class="report-subtitle">💰 営業CF簡易査定</div>
      <div class="report-row"><span class="label">実質経常利益</span><span class="value">${fs.ordProfit.toLocaleString()}</span></div>
      <div class="report-row"><span class="label">法人税率</span><span class="value">${(this.taxRate*100)}%</span></div>
      <div class="report-row"><span class="label">税後経常利益</span><span class="value">${simpleCF.afterTax.toLocaleString()}</span></div>
      <div class="report-row"><span class="label">減価償却費加算</span><span class="value">+${(fs.deprecTotal||0).toLocaleString()}</span></div>
      <div class="report-row" style="border-top:2px solid var(--border-primary);padding-top:8px;">
        <span class="label" style="font-weight:700;">簡易営業CF</span>
        <span class="value" style="font-size:16px;font-weight:700;">${simpleCF.value.toLocaleString()}</span>
      </div>`;

    // 定性評価セクション
    html += `<div class="report-subtitle">📋 定性評価（銀行審査の非財務要因）</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">`;
    const qualItems = [
      {id:'qual_mgmt',label:'経営者の資質・経験',opts:['優秀','良好','普通','問題あり']},
      {id:'qual_market',label:'市場・業界の成長性',opts:['成長市場','安定','縮小傾向','衰退']},
      {id:'qual_competition',label:'競合優位性',opts:['独占的','優位','同等','劣位']},
      {id:'qual_customer',label:'取引先の安定性',opts:['安定分散','やや集中','集中リスク','危険']},
      {id:'qual_governance',label:'経営管理体制',opts:['整備済','概ね良好','不十分','未整備']},
      {id:'qual_succession',label:'事業承継体制',opts:['整備済','計画中','未定','問題あり']}
    ];
    qualItems.forEach(q => {
      html += `<div><label style="font-size:10px;color:var(--text-muted);">${q.label}</label>
        <select id="${q.id}" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
          ${q.opts.map((o,i) => `<option value="${i}">${o}</option>`).join('')}
        </select></div>`;
    });
    html += `</div>`;

    // ✅ 銀行面談向け 業種別アドバイス表示
    const advice = this._getIndustryAdvice(this.industry);
    html += `<div class="glass-card" style="padding:16px;margin-bottom:16px;border-left:4px solid var(--accent-gold);background:var(--bg-secondary);">
      <div style="font-size:12px;font-weight:700;color:var(--accent-gold);margin-bottom:8px;">💡 【${indLabel}】銀行面談・融資獲得のポイント</div>
      <div style="font-size:12px;color:var(--text-primary);line-height:1.6;">${advice}</div>
    </div>`;

    // アクション
    html += `<div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="BankAudit.showOptimizationSimulator()" style="background:var(--accent-primary);">✨ 融資最適化シミュレーター</button>
      <button class="btn btn-secondary" onclick="BankAudit.showRealBSAdjustments()">🔧 実態修正</button>
      <button class="btn btn-secondary" onclick="BankAudit.showPersonalAssets()">💎 個人資産緩和</button>
      <button class="btn btn-secondary" onclick="BankAudit.showPlanEditor()">📈 事業計画</button>
      <button class="btn btn-secondary" onclick="BankAudit.exportReport()">📥 レポートHTML出力</button>
    </div></div>`;

    // サーバー保存
    this._saveRating(fs, indicators, simpleCF, category);
    App.addSystemMessage(html);
  },

  _getIndustryAdvice(id) {
    const advices = {
      manufacturing: "設備投資が重いため、原価率と労働分配率の適正化がポイントです。また過剰在庫（デッドストック）は実態BS修正で大幅減額されるリスクがあります。",
      realestate: "不動産業はCF(借入金返済能力)とLTV(借入金/物件価値)が命です。家賃下落リスクや空室率を織り込んだストレステスト計画を提示すると銀行の稟議が通りやすくなります。",
      construction: "未成工事受入金と未成工事支出金のバランス（立替金か前受金か）、および外注費の支払いサイクルが資金繰りに直結します。手持ち工事の明細書(個別工事台帳)を準備してください。",
      retail: "日銭商売のため、現預金残高（手元流動性）の厚さが死命を制します。月商の2〜3ヶ月分の現預金確保を目指してください。クレジットカード決済の入金ズレにも要注意です。",
      it: "無形資産(システム開発費等)は銀行から資産価値ゼロと見なされがちです。継続課金(ARR)の推移や、解約率(Churn Rate)などのビジネスKPIを事業計画でアピールしましょう。",
      medical: "診療報酬の入金は確実なため、売上債権の貸倒リスクはほぼ零と評価されます。ただし、高額な医療機器のリース・ローン負担（設備投資CF）が過剰にならないよう注意が必要です。",
      agriculture: "天候や市況変動リスクが伴うため、過去の利益のブレ幅を説明できるようにしてください。スーパーや農協への安定的な販路（契約栽培等）があると大幅プラス評価になります。",
      startup: "赤字先行の計画となるため、自己資金（エクイティ）の厚さと、黒字転換（PMF）までの資金繰り（ランウェイ）の証明が最重要。融資だけでなく資本性劣後ローンの活用も検討してください。"
    };
    return advices[id] || "利益の蓄積による自己資本の拡充と、計画的な借入金返済により、安定した財務体質を構築してください。";
  },

  _calcIndicators(fs) {
    const ibd = (fs.shortDebt||0) + (fs.longDebt||0) + (fs.bonds||0);
    // 簡易営業CF = 実質経常利益 ×（1 − 法人税率）＋ 減価償却費
    const opCF = fs.ordProfit * (1 - this.taxRate) + (fs.deprecTotal||0);
    // EBITDA = 営業利益 + 減価償却費
    const ebitda = (fs.opProfit||0) + (fs.deprecTotal||0);
    const rec = (fs.notesRec||0) + (fs.accountsRec||0);
    const pay = (fs.notesPay||0) + (fs.accountsPay||0);
    const inv = (fs.inventory||0);
    const nwc = rec + inv - pay; // 正常運転資金
    const monthly = fs.revenue / 12;
    const list = [];
    const judge = (val, thresholds, labels, colors) => {
      for (let i = 0; i < thresholds.length; i++) {
        if (val <= thresholds[i]) return { verdict: labels[i], color: colors[i] };
      }
      return { verdict: labels[labels.length-1], color: colors[colors.length-1] };
    };

    // 業種別閾値（製造業/卸/サービスで回転期間の基準が異なる）
    const indThresh = {
      manufacturing: { recM: 2.5, invM: 2.0, payM: 2.0, debtM: 6 },
      wholesale:     { recM: 2.0, invM: 1.0, payM: 1.5, debtM: 4 },
      service:       { recM: 1.5, invM: 0.5, payM: 1.0, debtM: 3 },
      realestate:    { recM: 1.0, invM: 5.0, payM: 1.0, debtM: 20 },
      it:            { recM: 2.0, invM: 0.1, payM: 1.0, debtM: 3 },
      medical:       { recM: 2.0, invM: 0.5, payM: 1.5, debtM: 5 },
      agriculture:   { recM: 1.5, invM: 2.0, payM: 1.5, debtM: 10 },
      startup:       { recM: 1.5, invM: 0.5, payM: 1.5, debtM: 4 },
      construction:  { recM: 3.0, invM: 2.0, payM: 2.5, debtM: 6 },
      retail:        { recM: 0.5, invM: 1.5, payM: 1.0, debtM: 3 },
      other:         { recM: 2.0, invM: 1.5, payM: 1.5, debtM: 5 }
    }[this.industry] || { recM: 2.0, invM: 1.5, payM: 1.5, debtM: 5 };

    // ★ 業種別 見る年数の違い（償還年数の基準）
    let repayTarget = { normal: 10, caution: 20 };
    if (this.industry === 'realestate') repayTarget = { normal: 20, caution: 30 };
    if (this.industry === 'it') repayTarget = { normal: 7, caution: 15 };
    if (this.industry === 'medical' || this.industry === 'agriculture') repayTarget = { normal: 15, caution: 20 };

    // ★ 有利子負債償還年数 = 有利子負債 ÷ 簡易営業CF
    const repayYears = opCF > 0 ? (ibd / opCF) : -1;
    const repayStr = repayYears < 0 ? '算定不能（CF赤字）' : repayYears.toFixed(1) + '年';
    const repayColor = repayYears < 0 ? 'var(--accent-red)' : repayYears <= repayTarget.normal ? 'var(--accent-green)' : repayYears <= repayTarget.caution ? 'var(--accent-gold)' : 'var(--accent-red)';
    const rj = repayYears < 0 ? {verdict:'⛔ 破綻懸念先以下（CF赤字）',color:'var(--accent-red)'} :
               judge(repayYears, [repayTarget.normal, repayTarget.caution, 999], [`✅ 正常（${repayTarget.normal}年以内）`,`⚠️ 要注意（${repayTarget.normal}〜${repayTarget.caution}年）`,`⛔ 要管理以下（${repayTarget.caution}年超）`], ['var(--accent-green)','var(--accent-gold)','var(--accent-red)']);
    list.push({ label: '★ 有利子負債償還年数', value: repayStr, ...rj });

    // ★ 要収益弁済借入金償還年数 = (有利子負債 − 正常運転資金) ÷ 簡易営業CF
    const reqRepayAmt = Math.max(0, ibd - Math.max(0, nwc));
    const reqRepayYears = opCF > 0 ? (reqRepayAmt / opCF) : -1;
    const reqRepayStr = reqRepayYears < 0 ? '算定不能（CF赤字）' : reqRepayYears.toFixed(1) + '年';
    const rj2 = reqRepayYears < 0 ? {verdict:'⛔ 破綻懸念先以下',color:'var(--accent-red)'} :
               judge(reqRepayYears, [repayTarget.normal, repayTarget.caution, 999], [`✅ 正常（${repayTarget.normal}年以内）`,`⚠️ 要注意（${repayTarget.normal}〜${repayTarget.caution}年）`,`⛔ 要管理以下`],['var(--accent-green)','var(--accent-gold)','var(--accent-red)']);
    list.push({ label: '★ 要収益弁済借入金償還年数', value: reqRepayStr, ...rj2 });

    // ★ EBITDA倍率 = 有利子負債 ÷ EBITDA
    let ebitdaTarget = [5, 10, 15, 999];
    if (this.industry === 'it') ebitdaTarget = [3, 7, 10, 999];
    if (this.industry === 'realestate' || this.industry === 'medical') ebitdaTarget = [10, 15, 20, 999];

    const ebitdaMultiple = ebitda > 0 ? (ibd / ebitda) : -1;
    const ebitdaStr = ebitdaMultiple < 0 ? '算定不能' : ebitdaMultiple.toFixed(1) + '倍';
    list.push({ label: '★ EBITDA倍率（有利子負債÷EBITDA）', value: ebitdaStr,
      ...(ebitdaMultiple < 0 ? {verdict:'⛔ EBITDA赤字',color:'var(--accent-red)'} :
         judge(ebitdaMultiple, ebitdaTarget, ['✅ 良好','普通','⚠️ 注意','⛔ 危険'], ['var(--accent-green)','var(--text-secondary)','var(--accent-gold)','var(--accent-red)'])) });

    // ★ 固定資産＋繰延資産−純資産（実質債務超過判定）
    let realDebt = (fs.fixedAssets||0) + (fs.deferredAssets||0) - (fs.netAssets||0);
    let rdVerdict = realDebt > 0 ? '⚠️ 固定資産を自己資本で賄えていない' : '✅ 良好';
    let rdColor = realDebt > 0 ? 'var(--accent-red)' : 'var(--accent-green)';
    
    if (this.industry === 'startup') {
      rdVerdict = realDebt > 0 ? '⚠️ 債務超過（スタートアップ特例: CFランウェイ重視）' : '✅ 良好';
      rdColor = realDebt > 0 ? 'var(--accent-gold)' : 'var(--accent-green)'; // スタートアップは赤字先行を許容
    }

    list.push({ label: '★ 固定資産+繰延資産−純資産', value: realDebt > 0 ? '超過 ' + realDebt.toLocaleString() : '− ' + Math.abs(realDebt).toLocaleString() + '（余裕）',
      verdict: rdVerdict, color: rdColor });

    // 売上高営業利益率
    const opMargin = fs.revenue > 0 ? ((fs.opProfit / fs.revenue) * 100).toFixed(1) + '%' : '—';
    list.push({ label: '売上高営業利益率', value: opMargin,
      ...judge(fs.opProfit/fs.revenue*100, [1,3,5,100], ['低','普通','良好','優良'], ['var(--accent-red)','var(--accent-gold)','var(--accent-green)','var(--accent-green)']) });

    // 売上高経常利益率
    const ordMargin = fs.revenue > 0 ? ((fs.ordProfit / fs.revenue) * 100).toFixed(1) + '%' : '—';
    list.push({ label: '売上高経常利益率', value: ordMargin,
      ...judge(fs.ordProfit/fs.revenue*100, [1,3,5,100], ['低','普通','良好','優良'], ['var(--accent-red)','var(--accent-gold)','var(--accent-green)','var(--accent-green)']) });

    // 自己資本比率
    const eqRatio = fs.totalAssets > 0 ? ((fs.netAssets / fs.totalAssets) * 100).toFixed(1) + '%' : '—';
    list.push({ label: '自己資本比率', value: eqRatio,
      ...judge(fs.netAssets/fs.totalAssets*100, [10,20,100], ['注意','普通','良好'], ['var(--accent-red)','var(--accent-gold)','var(--accent-green)']) });

    // 借入金月商倍率（業種別閾値）
    const debtMonths = monthly > 0 ? (ibd / monthly).toFixed(1) + 'ヶ月' : '—';
    list.push({ label: '借入金月商倍率', value: debtMonths,
      ...judge(ibd/monthly, [indThresh.debtM, indThresh.debtM*2, 99], ['良好','注意','⚠️ 警戒'], ['var(--accent-green)','var(--accent-gold)','var(--accent-red)']) });

    // 売上債権回転期間（業種別基準）
    const recPeriod = monthly > 0 ? (rec / monthly) : 0;
    const recStr = monthly > 0 ? recPeriod.toFixed(1) + 'ヶ月' : '—';
    list.push({ label: '売上債権回転期間', value: recStr + (this.industry !== 'other' ? ` (基準${indThresh.recM})` : ''),
      ...(recPeriod > indThresh.recM * 1.5 ? {verdict:'⚠️ 業種標準超',color:'var(--accent-red)'} :
         recPeriod > indThresh.recM ? {verdict:'やや長い',color:'var(--accent-gold)'} : {verdict:'標準',color:'var(--accent-green)'}) });

    // 棚卸資産回転期間（業種別基準）
    const invPeriod = monthly > 0 ? ((fs.inventory||0) / monthly) : 0;
    const invStr = monthly > 0 ? invPeriod.toFixed(1) + 'ヶ月' : '—';
    list.push({ label: '棚卸資産回転期間', value: invStr + (this.industry !== 'other' ? ` (基準${indThresh.invM})` : ''),
      ...(invPeriod > indThresh.invM * 1.5 ? {verdict:'⚠️ 業種標準超',color:'var(--accent-red)'} :
         invPeriod > indThresh.invM ? {verdict:'やや長い',color:'var(--accent-gold)'} : {verdict:'標準',color:'var(--accent-green)'}) });

    // 買入債務回転期間（業種別基準）
    const payPeriod = monthly > 0 ? (pay / monthly) : 0;
    const payStr = monthly > 0 ? payPeriod.toFixed(1) + 'ヶ月' : '—';
    list.push({ label: '買入債務回転期間', value: payStr + (this.industry !== 'other' ? ` (基準${indThresh.payM})` : ''),
      ...(payPeriod > indThresh.payM * 1.5 ? {verdict:'⚠️ 業種標準超',color:'var(--accent-red)'} :
         payPeriod > indThresh.payM ? {verdict:'やや長い',color:'var(--accent-gold)'} : {verdict:'標準',color:'var(--accent-green)'}) });

    // ★ インタレスト・カバレッジ・レシオ（ICR） = 営業利益 ÷ 支払利息
    const icr = (fs.interestExp||0) > 0 ? ((fs.opProfit||0) / fs.interestExp) : -1;
    const icrStr = icr < 0 ? '支払利息なし' : icr.toFixed(1) + '倍';
    list.push({ label: 'インタレスト・カバレッジ・レシオ', value: icrStr,
      ...(icr < 0 ? {verdict:'N/A',color:'var(--text-secondary)'} :
         judge(icr, [1,2,5,999], ['⛔ 利払い不能','⚠️ 要注意','普通','✅ 良好'], ['var(--accent-red)','var(--accent-gold)','var(--text-secondary)','var(--accent-green)'])) });

    // ★ DSCR（元利返済カバー率） = 簡易営業CF ÷ 年間返済額（概算: 有利子負債÷10）
    const annualRepay = ibd > 0 ? ibd / 10 : 0;
    const dscr = annualRepay > 0 ? (opCF / annualRepay) : -1;
    const dscrStr = dscr < 0 ? '算定不能' : dscr.toFixed(2) + '倍';
    list.push({ label: 'DSCR（元利返済カバー率）', value: dscrStr,
      ...(dscr < 0 ? {verdict:'N/A',color:'var(--text-secondary)'} :
         judge(dscr, [1,1.3,2,999], ['⛔ 返済不能','⚠️ ギリギリ','普通','✅ 余裕あり'], ['var(--accent-red)','var(--accent-gold)','var(--text-secondary)','var(--accent-green)'])) });

    // 経常収支比率 = 経常利益 ÷ 売上高 × 100（再掲だが銀行重視指標）
    const ordIncomeRatio = fs.revenue > 0 ? (fs.ordProfit / fs.revenue * 100) : 0;
    list.push({ label: '経常収支比率', value: ordIncomeRatio.toFixed(1) + '%',
      ...judge(ordIncomeRatio, [0,2,5,100], ['⛔ 赤字','⚠️ 低水準','普通','✅ 良好'], ['var(--accent-red)','var(--accent-gold)','var(--text-secondary)','var(--accent-green)']) });

    return { list, repayYears: repayStr, repayColor, ibd, opCF, ebitda, nwc };
  },

  _calcSimpleCF(fs) {
    const afterTax = Math.round(fs.ordProfit * (1 - this.taxRate));
    const value = afterTax + (fs.deprecTotal || 0);
    return { afterTax, value };
  },

  _determineCategory(indicators, simpleCF) {
    const ry = indicators.opCF > 0 ? indicators.ibd / indicators.opCF : -1;
    
    // 業種別の正常先基準年数
    let repayTarget = { normal: 10, caution: 20 };
    if (this.industry === 'realestate') repayTarget = { normal: 20, caution: 30 };
    if (this.industry === 'it') repayTarget = { normal: 7, caution: 15 };
    if (this.industry === 'medical' || this.industry === 'agriculture') repayTarget = { normal: 15, caution: 20 };

    if (ry < 0 || simpleCF.value < 0) return { label: '破綻懸念先', code: 4, color: 'var(--accent-red)' };
    
    const realDebt = indicators.list.find(x => x.label.includes('固定資産'));
    const hasExcess = realDebt && realDebt.value.includes('超過');
    const isStartup = this.industry === 'startup';

    if (ry <= repayTarget.normal && (!hasExcess || isStartup)) return { label: '正常先', code: 1, color: 'var(--accent-green)' };
    if (ry <= repayTarget.normal && hasExcess) return { label: '要注意先（実質債務超過あり）', code: 2, color: 'var(--accent-gold)' };
    if (ry <= repayTarget.caution) return { label: '要注意先', code: 2, color: 'var(--accent-gold)' };
    return { label: '要管理先以下', code: 3, color: 'var(--accent-red)' };
  },

  async _saveRating(fs, indicators, simpleCF, category) {
    try {
      await ApiClient.request('/api/financial/ratings', {
        method: 'POST',
        body: JSON.stringify({
          company_name: (Database.loadCompanyData()||{}).companyName||'',
          quantitative_scores: indicators.list,
          operating_cf: simpleCF.value,
          repayment_years: indicators.opCF > 0 ? indicators.ibd / indicators.opCF : -1,
          debtor_category: category.label
        })
      });
    } catch(e) { console.warn('格付保存スキップ:', e.message); }
  },

  // ===== 業種別特化モード =====
  showIndustryModeSelector() {
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">🏢 業種特化モードの選択</div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
        業種によって銀行の「審査年数」「計上方法」「重視指標」が異なります。<br>
        実態に合わせた業種モードを選択してください。
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">`;

    const modes = [
      { id: 'manufacturing', icon: '🏭', name: '製造・卸・一般業', desc: '標準的な審査。運転資金の回転期間や設備投資バランスを重視。', years: 10 },
      { id: 'retail', icon: '🏪', name: '飲食・小売業', desc: '日銭商売のため手元流動性（現預金）が命。売掛金が少ないことが前提。', years: 10 },
      { id: 'construction', icon: '🚧', name: '建設業', desc: '未成工事支出金などを運転資金とみなす。売掛回転期間の長期化も許容。', years: 10 },
      { id: 'it', icon: '💻', name: 'IT・SaaS・サービス業', desc: '有形資産が少ないため償還年数は短め（7年）に設定。利益率と手元流動性を重視。', years: 7 },
      { id: 'realestate', icon: '🏢', name: '不動産賃貸・管理業', desc: '建物の耐用年数が長いため、償還年数は20〜30年を許容。EBITDA倍率を重視。', years: 20 },
      { id: 'medical', icon: '🏥', name: '医療・クリニック', desc: '診療報酬等で収益が安定しているため、償還年数は長め（15年程度）に設定可能。', years: 15 },
      { id: 'agriculture', icon: '🌾', name: '農業・第一次産業', desc: '制度融資が中心となり、超長期の返済設定（15〜20年）が組まれることが多い。', years: 15 },
      { id: 'startup', icon: '🚀', name: 'スタートアップ・開業', desc: '初期の赤字や債務超過を許容し、将来キャッシュフローとランウェイを重視する特例判定。', years: 10 },
      { id: 'other', icon: '📂', name: 'その他・複合業種', desc: '上記以外の一般業種用の標準モード。基本的な銀行の審査基準（10年償還等）で評価が行われます。', years: 10 }
    ];

    modes.forEach(m => {
      const isActive = this.industry === m.id;
      html += `<div class="glass-card${isActive ? ' highlight' : ''}" style="padding:16px;cursor:pointer;position:relative;"
        onclick="BankAudit.selectIndustryMode('${m.id}')">
        ${isActive ? '<span class="tag tag-success" style="position:absolute;top:8px;right:8px;">選択中</span>' : ''}
        <div style="font-size:24px;margin-bottom:8px;">${m.icon}</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${m.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">基準償還年数: ${m.years}年</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${m.desc}</div>
      </div>`;
    });

    html += `</div></div>`;
    App.addSystemMessage(html);
  },

  selectIndustryMode(id) {
    this.industry = id;
    const dna = Database.loadCompanyData() || {};
    dna.industryCode = id;
    Database.saveCompanyData(dna);
    App.addSystemMessage(Utils.createAlert('success', '✅', '業種特化モードを切り替えました。計算ロジックと基準年数が変更されます。'));
    this.showCaseJudgment();
  },

  // ===== MODULE 3-B: 実態修正 =====
  showRealBSAdjustments() {
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">🔧 実態修正（実態BS/PL）</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        修正候補を提示します。最終判断は審査担当者が行い、修正根拠を記録してください。
      </p>
      <div class="report-subtitle">【実態BSへの修正項目】</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        ${this._inp('ba_adj_badRec','不良売掛金控除',0)}
        ${this._inp('ba_adj_inventory','過大棚卸評価減',0)}
        ${this._inp('ba_adj_securities','有価証券含み損',0)}
        ${this._inp('ba_adj_officerLoan','役員貸付金（回収不能）',0)}
        ${this._inp('ba_adj_deferredTax','繰延税金資産（回収不能分）',0)}
        ${this._inp('ba_adj_insurance','保険積立金（換金差額）',0)}
        ${this._inp('ba_adj_realEstate','不動産含み益（＋）/損（ー）',0)}
      </div>
      <div class="report-subtitle">【実態PLへの修正項目】</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        ${this._inp('ba_adj_specialExclude','特別損益除外額',0)}
        ${this._inp('ba_adj_officerComp','役員報酬適正化調整',0)}
        ${this._inp('ba_adj_relatedParty','関連会社取引調整',0)}
        ${this._inp('ba_adj_deprecShort','減価償却不足調整',0)}
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;color:var(--text-muted);">修正根拠・理由</label>
        <textarea id="ba_adj_reason" rows="3" placeholder="修正の根拠を記録してください" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></textarea>
      </div>
      <button class="btn btn-primary" onclick="BankAudit.applyAdjustments()">📊 修正後の再判定</button>
    </div>`;
    App.addSystemMessage(html);
  },

  applyAdjustments() {
    const adj = {
      badRec: this._g('ba_adj_badRec'), inventory: this._g('ba_adj_inventory'),
      securities: this._g('ba_adj_securities'), officerLoan: this._g('ba_adj_officerLoan'),
      deferredTax: this._g('ba_adj_deferredTax'), insurance: this._g('ba_adj_insurance'),
      realEstate: this._g('ba_adj_realEstate'), specialExclude: this._g('ba_adj_specialExclude'),
      officerComp: this._g('ba_adj_officerComp'), relatedParty: this._g('ba_adj_relatedParty'),
      deprecShort: this._g('ba_adj_deprecShort'),
      reason: document.getElementById('ba_adj_reason')?.value || ''
    };
    const bsDecrease = adj.badRec + adj.inventory + adj.securities + adj.officerLoan + adj.deferredTax;
    const bsIncrease = adj.insurance + (adj.realEstate > 0 ? adj.realEstate : 0);
    const bsLoss = adj.realEstate < 0 ? Math.abs(adj.realEstate) : 0;
    const dna = Database.loadCompanyData() || {};
    const origNA = dna.netAssets || 0;
    const realNA = origNA - bsDecrease - bsLoss + bsIncrease;

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 実態修正後の評価</div>
      <div class="report-row"><span class="label">帳簿上の純資産</span><span class="value">${origNA.toLocaleString()}</span></div>
      <div class="report-row"><span class="label">BS資産減額</span><span class="value" style="color:var(--accent-red);">△${bsDecrease.toLocaleString()}</span></div>
      <div class="report-row"><span class="label">BS資産増額</span><span class="value" style="color:var(--accent-green);">+${bsIncrease.toLocaleString()}</span></div>
      <div style="border-top:2px solid var(--border-primary);margin-top:8px;padding-top:8px;">
        <div class="report-row"><span class="label" style="font-weight:700;">実態純資産</span>
          <span class="value" style="font-size:16px;color:${realNA>=0?'var(--accent-green)':'var(--accent-red)'};">${realNA.toLocaleString()}</span></div>
        <div class="report-row"><span class="label">実態債務超過</span>
          <span class="value">${realNA < 0 ? '⚠️ 債務超過' : '✅ 債務超過なし'}</span></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="BankAudit.showPersonalAssets()">💎 個人資産緩和へ</button>
        <button class="btn btn-secondary" onclick="BankAudit.showCaseJudgment()">🏦 格付判定に戻る</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // ===== MODULE 4: 個人資産緩和 =====
  showPersonalAssets() {
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">💎 個人資産による格付緩和</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        以下の資産はエビデンス提出が必須です。緩和は最大1ランクまでです。
      </p>
      <div class="report-subtitle" style="color:var(--accent-green);">✅ 認容される個人資産</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        ${this._inp('ba_pa_realEstate','不動産（時価−担保設定額）',0)}
        ${this._inp('ba_pa_securities','有価証券（時価×70%）',0)}
        ${this._inp('ba_pa_deposits','預貯金（残高証明額面）',0)}
        ${this._inp('ba_pa_insurance','生命保険（解約返戻金）',0)}
        ${this._inp('ba_pa_golf','ゴルフ会員権（市場価格×70%）',0)}
      </div>
      <div class="report-subtitle" style="color:var(--accent-red);">❌ 認容されない資産</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;line-height:1.8;">
        暗号資産（仮想通貨）/ 高級時計（ロレックス等）/ 宝石・美術品・骨董品 / 外車・高級車 / 非上場株式
        <br><span style="font-size:11px;color:var(--text-muted);">理由: 流動性・価格の客観性・換金性に問題があるため</span>
      </div>
      <button class="btn btn-primary" onclick="BankAudit.calculateRelaxation()">📊 緩和判定実行</button>
    </div>`;
    App.addSystemMessage(html);
  },

  calculateRelaxation() {
    const pa = {
      realEstate: this._g('ba_pa_realEstate'), securities: this._g('ba_pa_securities'),
      deposits: this._g('ba_pa_deposits'), insurance: this._g('ba_pa_insurance'),
      golf: this._g('ba_pa_golf')
    };
    const totalPA = Object.values(pa).reduce((s,v) => s+v, 0);
    const dna = Database.loadCompanyData() || {};
    const companyNA = dna.netAssets || 0;
    const adjustedNA = companyNA + totalPA;
    const ibd = dna.totalDebt || 0;
    const dep = dna.depreciation || 0;
    const ni = dna.netIncome || 0;
    const opCF = (dna.ordinaryProfit||0) * (1 - this.taxRate) + dep;
    const origRepay = opCF > 0 ? ibd / opCF : -1;
    // 調整後: 個人資産を加味した実質純資産ベースで再計算
    const adjustedIBD = Math.max(0, ibd - totalPA);
    const adjRepay = opCF > 0 ? adjustedIBD / opCF : -1;

    const origCat = this._getCategoryLabel(origRepay);
    const adjCat = this._getCategoryLabel(adjRepay);
    const relaxed = adjCat.code < origCat.code && (origCat.code - adjCat.code) <= 1;

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 個人資産緩和判定結果</div>
      <div class="report-row"><span class="label">認容個人資産合計</span><span class="value" style="font-weight:700;">${totalPA.toLocaleString()}</span></div>
      <div class="report-row"><span class="label">会社実態純資産</span><span class="value">${companyNA.toLocaleString()}</span></div>
      <div class="report-row"><span class="label">調整後純資産</span><span class="value" style="color:var(--accent-green);font-weight:700;">${adjustedNA.toLocaleString()}</span></div>
      <div style="border-top:2px solid var(--border-primary);margin:12px 0;padding-top:12px;">
        <div class="report-row"><span class="label">調整前の債務者区分</span><span class="value">${origCat.label}</span></div>
        <div class="report-row"><span class="label">調整後の償還年数</span><span class="value">${adjRepay > 0 ? adjRepay.toFixed(1) + '年' : '算定不能'}</span></div>
        <div class="report-row"><span class="label" style="font-weight:700;">緩和後の債務者区分</span>
          <span class="value" style="font-size:16px;font-weight:700;color:${relaxed?'var(--accent-green)':adjCat.color};">
            ${relaxed ? adjCat.label + '（1ランク緩和）' : origCat.label + '（据え置き）'}
          </span></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">
        ※ 認容個人資産は毎年更新のエビデンス提出が必要です。緩和は最大1ランクまでです。
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  _getCategoryLabel(repayYears) {
    if (repayYears < 0) return { label: '破綻懸念先', code: 4, color: 'var(--accent-red)' };
    if (repayYears <= 10) return { label: '正常先', code: 1, color: 'var(--accent-green)' };
    if (repayYears <= 20) return { label: '要注意先', code: 2, color: 'var(--accent-gold)' };
    return { label: '要管理先以下', code: 3, color: 'var(--accent-red)' };
  },

  // レポートHTML出力
  exportReport() {
    const d = this.currentFS || this._collectFS();
    const dna = Database.loadCompanyData() || {};
    const companyName = dna.companyName || '企業名未設定';
    const now = new Date().toLocaleDateString('ja-JP');
    const fs = d.revenue > 0 ? d : {
      revenue: dna.annualRevenue||0, opProfit: dna.operatingProfit||0,
      ordProfit: dna.ordinaryProfit||0, netProfit: dna.netIncome||0,
      totalAssets: dna.totalAssets||0, netAssets: dna.netAssets||0,
      deprecTotal: dna.depreciation||0, interestExp: dna.interestExpense||0,
      shortDebt: dna.totalDebt*0.4||0, longDebt: dna.totalDebt*0.6||0,
      notesRec: 0, accountsRec: dna.receivables||0, inventory: dna.inventory||0,
      notesPay: 0, accountsPay: dna.payables||0,
      currentAssets: dna.currentAssets||0, fixedAssets: dna.fixedAssets||0,
      deferredAssets: 0, currentLiab: dna.currentLiabilities||0, bonds: 0
    };
    const indicators = this._calcIndicators(fs);
    const simpleCF = this._calcSimpleCF(fs);
    const category = this._determineCategory(indicators, simpleCF);
    const ebitda = (fs.opProfit||0) + (fs.deprecTotal||0);

    let rows = '';
    indicators.list.forEach(i => {
      rows += `<tr><td>${i.label}</td><td style="text-align:right;font-weight:600;">${i.value}</td><td style="text-align:right;">${i.verdict}</td></tr>`;
    });

    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
    <title>財務審査レポート - ${companyName}</title>
    <style>
      body { font-family: 'Meiryo','Hiragino Sans',sans-serif; max-width:900px; margin:0 auto; padding:32px; color:#222; }
      h1 { font-size:20px; border-bottom:3px solid #333; padding-bottom:8px; }
      h2 { font-size:15px; border-left:4px solid #6c63ff; padding-left:8px; margin-top:24px; }
      .meta { font-size:12px; color:#666; margin-bottom:24px; }
      .summary { display:flex; gap:24px; margin:16px 0; }
      .summary-card { border:2px solid #ddd; border-radius:8px; padding:16px; text-align:center; flex:1; }
      .summary-card .val { font-size:22px; font-weight:800; margin:4px 0; }
      .summary-card .lbl { font-size:11px; color:#888; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th, td { padding:6px 8px; border-bottom:1px solid #ddd; }
      th { background:#f5f5f5; text-align:left; }
      .cf-section .row { display:flex; justify-content:space-between; padding:4px 0; }
      .cf-section .row.total { border-top:2px solid #333; font-weight:700; }
      .footer { margin-top:32px; font-size:10px; color:#999; border-top:1px solid #ddd; padding-top:8px; }
      @media print { body { padding:16px; } }
    </style></head><body>
    <h1>🏦 財務・融資審査レポート</h1>
    <div class="meta">対象企業: <strong>${companyName}</strong> ｜ 作成日: ${now} ｜ 業種: ${this.industry}</div>
    <div class="summary">
      <div class="summary-card"><div class="lbl">債務者区分</div><div class="val">${category.label}</div></div>
      <div class="summary-card"><div class="lbl">償還年数</div><div class="val">${indicators.repayYears}</div></div>
      <div class="summary-card"><div class="lbl">EBITDA</div><div class="val">${ebitda.toLocaleString()}</div></div>
      <div class="summary-card"><div class="lbl">簡易営業CF</div><div class="val">${simpleCF.value.toLocaleString()}</div></div>
    </div>
    <h2>📊 定量評価指標</h2>
    <table><thead><tr><th>指標</th><th style="text-align:right;">数値</th><th style="text-align:right;">判定</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <h2>💰 営業CF簡易査定</h2>
    <div class="cf-section">
      <div class="row"><span>実質経常利益</span><span>${fs.ordProfit.toLocaleString()}</span></div>
      <div class="row"><span>法人税率</span><span>${(this.taxRate*100)}%</span></div>
      <div class="row"><span>税後経常利益</span><span>${simpleCF.afterTax.toLocaleString()}</span></div>
      <div class="row"><span>減価償却費加算</span><span>+${(fs.deprecTotal||0).toLocaleString()}</span></div>
      <div class="row total"><span>簡易営業CF</span><span>${simpleCF.value.toLocaleString()}</span></div>
    </div>
    <div class="footer">LOAN CRAFT ENGINE v5.0 - 本レポートは参考資料です。最終的な判断は審査担当者が行ってください。</div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    App.addSystemMessage(Utils.createAlert('success', '📥', 'レポートを新しいタブで出力しました。印刷やPDF保存が可能です。'));
  }
};
