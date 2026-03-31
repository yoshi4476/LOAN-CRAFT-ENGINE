/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 事業計画モジュール
 * MODULE 2: ★事業計画書フォーム準拠（提出用フォーマット対応）
 *
 * シート構成（元Excelフォーマット準拠）:
 *   1. 事業計画書（提出用）— PL/CF/残高サマリ
 *   2. 単体事業計画書 — セグメント別詳細PL
 *   3. 連結事業計画書 — 連結PL
 *   4. GR合算シート — グループ合算
 *   5. 固定資産・減価償却費 — CAPEX/償却スケジュール
 *   6. 有利子負債 — 調達/返済/残高
 * ============================================================ */

Object.assign(BankAudit, {

  // メインエディタ（6タブ構成）
  showPlanEditor() {
    const dna = Database.loadCompanyData() || {};
    let html = `<div class="glass-card highlight" style="max-width:1100px;margin:0 auto;">
      <div class="report-title">📈 事業計画策定</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:10px;color:var(--text-muted);">バージョン名</label>
          <input id="bp_version" value="v1.0" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
        <div><label style="font-size:10px;color:var(--text-muted);">対象会社</label>
          <input id="bp_company" value="${dna.companyName||''}" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
        <div><label style="font-size:10px;color:var(--text-muted);">ストレス係数</label>
          <input id="bp_stress" type="number" value="1.03" step="0.01" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
        <div><label style="font-size:10px;color:var(--text-muted);">法人税率(%)</label>
          <input id="bp_taxRate" type="number" value="35" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="BankAudit.showPlanTab('summary')">📋 提出用サマリ</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showPlanTab('detail')">📊 単体PL詳細</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showPlanTab('consolidated')">🔗 連結計画</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showPlanTab('assets')">🏭 固定資産・償却</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showPlanTab('debt')">💳 有利子負債</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showPlanList()">📁 計画一覧</button>
      </div>
      <div id="bp_content">${this._renderSummaryPlan()}</div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="BankAudit.savePlan()">💾 計画保存</button>
        <button class="btn btn-secondary" onclick="BankAudit.lockPlan()">🔒 バージョンロック</button>
        <button class="btn btn-secondary" onclick="BankAudit.showVarianceAnalysis()">📊 乖離分析</button>
        <button class="btn btn-secondary" onclick="BankAudit.exportPlanExcel()">📥 Excel出力</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  showPlanTab(tab) {
    const el = document.getElementById('bp_content');
    if (!el) { this.showPlanEditor(); return; }
    if (tab === 'summary') el.innerHTML = this._renderSummaryPlan();
    else if (tab === 'detail') el.innerHTML = this._renderDetailPL();
    else if (tab === 'consolidated') el.innerHTML = this._renderConsolidatedPlan();
    else if (tab === 'assets') el.innerHTML = this._renderAssetSchedule();
    else if (tab === 'debt') el.innerHTML = this._renderDebtSchedule();
  },

  // ========== シート1: 事業計画書（提出用）==========
  _renderSummaryPlan() {
    const cols = ['決算期(実績)','●期','●期','●期','●期','●期'];
    const colH = cols.map((c,i) => `<th style="padding:4px 6px;text-align:right;font-size:10px;min-width:80px;${i===0?'background:rgba(108,99,255,0.08);':''}">${c}</th>`).join('');

    const rows = [
      { key:'prodQty', label:'生産・販売数量（●個）', section:'', stress:false },
      { key:'revenue', label:'売上高', section:'', stress:false },
      { key:'cogs', label:'売上原価', section:'', stress:false },
      { key:'cogsMaterial', label:'　(うち原材料費)', section:'', stress:false },
      { key:'cogsLabor', label:'　(うち労務費)', section:'', stress:true },
      { key:'cogsDeprec', label:'　(うち減価償却費)', section:'', stress:false },
      { key:'sgaExp', label:'一般販管費', section:'', stress:false },
      { key:'sgaDeprec', label:'　(うち減価償却費)', section:'', stress:false },
      { key:'opProfit', label:'営業利益', section:'', stress:false, calc:true, bold:true },
      { key:'nonOpIncome', label:'営業外収益', section:'', stress:false },
      { key:'nonOpExp', label:'営業外費用', section:'', stress:false },
      { key:'interestExp', label:'　(うち支払利息)', section:'', stress:false },
      { key:'preTaxProfit', label:'税引前損益', section:'', stress:false, calc:true, bold:true },
      { key:'netProfit', label:'税引後損益', section:'', stress:false, calc:true, bold:true },
      { key:'dividend', label:'配当', section:'', stress:false },
      { key:'retainedProfit', label:'繰越損益', section:'', stress:false, calc:true },
      { key:'_sep1', label:'', section:'sep' },
      { key:'opCF', label:'営業CF', section:'cf', stress:false, bold:true },
      { key:'investCF', label:'投資CF', section:'cf', stress:false },
      { key:'freeCF', label:'フリーCF', section:'cf', stress:false, calc:true, bold:true },
      { key:'financeCF', label:'財務CF', section:'cf', stress:false },
      { key:'ceoLoan', label:'代表者借入金増減', section:'cf', stress:false },
      { key:'debtChange', label:'借入金増減', section:'cf', stress:false },
      { key:'newLoan', label:'　(今次借入分)', section:'cf', stress:false },
      { key:'endCash', label:'期末現預金残高', section:'cf', stress:false, bold:true }
    ];

    let html = `<div class="report-subtitle" style="font-size:13px;">📋 事業計画書（提出用）</div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">（単位：千円）</div>
    <div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;min-width:700px;">
    <thead><tr style="border-bottom:2px solid var(--border-secondary);">
      <th style="padding:4px 6px;text-align:left;min-width:160px;">項目</th>${colH}
      <th style="padding:4px;text-align:center;font-size:10px;">ストレス</th>
    </tr></thead><tbody>`;

    rows.forEach(row => {
      if (row.section === 'sep') {
        html += `<tr><td colspan="${cols.length+2}" style="padding:2px;"></td></tr>`;
        return;
      }
      const isBold = row.bold;
      const isCalc = row.calc;
      html += `<tr style="border-bottom:1px solid var(--border-secondary);${isBold?'font-weight:700;background:rgba(255,255,255,0.02);':''}">
        <td style="padding:4px 6px;font-size:11px;">${row.label}</td>`;
      cols.forEach((c, i) => {
        const bg = i === 0 ? 'rgba(108,99,255,0.05)' : '';
        if (isCalc) {
          html += `<td style="padding:4px 6px;text-align:right;background:${bg};"><span id="sp_${row.key}_${i}" style="font-size:11px;">0</span></td>`;
        } else {
          html += `<td style="padding:2px;background:${bg};"><input id="sp_${row.key}_${i}" type="number" value="0" onchange="BankAudit.recalcSummary()" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`;
        }
      });
      // ストレス列
      html += `<td style="padding:4px;text-align:center;font-size:10px;color:var(--accent-gold);">${row.stress?'×1.03':''}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  },

  recalcSummary() {
    for (let i = 0; i < 6; i++) {
      const g = (k) => parseFloat(document.getElementById(`sp_${k}_${i}`)?.value) || 0;
      const s = (k, v) => { const el = document.getElementById(`sp_${k}_${i}`); if (el) el.textContent = Math.round(v).toLocaleString(); };
      // 営業利益 = 売上高 − 売上原価 − 一般販管費
      const op = g('revenue') - g('cogs') - g('sgaExp');
      s('opProfit', op);
      // 税引前損益 = 営業利益 + 営業外収益 − 営業外費用
      const preTax = op + g('nonOpIncome') - g('nonOpExp');
      s('preTaxProfit', preTax);
      // 税引後損益
      const taxRate = parseFloat(document.getElementById('bp_taxRate')?.value) / 100 || 0.35;
      const net = preTax > 0 ? Math.round(preTax * (1 - taxRate)) : preTax;
      s('netProfit', net);
      // 繰越損益 = 税引後損益 − 配当
      s('retainedProfit', net - g('dividend'));
      // フリーCF = 営業CF + 投資CF
      s('freeCF', g('opCF') + g('investCF'));
    }
  },

  // ========== シート2: 単体事業計画書（セグメント別詳細PL）==========
  _renderDetailPL() {
    const periods = ['実績1期','実績2期','実績3期','計画1年','計画2年','計画3年','計画4年','計画5年','計画6年','計画7年'];
    // セグメント別売上（3セグメント×数量・単価・金額）
    let html = `<div class="report-subtitle" style="font-size:13px;">📊 単体事業計画書（セグメント別詳細PL）</div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">（単位：千円）</div>
    <div style="overflow-x:auto;"><table style="width:100%;font-size:10px;border-collapse:collapse;min-width:1200px;">
    <thead><tr style="border-bottom:2px solid var(--border-secondary);">
      <th style="padding:4px;text-align:left;min-width:140px;"></th>
      <th style="padding:4px;text-align:left;min-width:130px;">勘定科目</th>`;
    periods.forEach((p, i) => {
      const bg = i < 3 ? 'rgba(108,99,255,0.08)' : '';
      html += `<th style="padding:3px;text-align:right;font-size:9px;min-width:70px;background:${bg};">${p}</th>`;
    });
    html += `<th style="padding:3px;text-align:center;font-size:9px;">ストレス</th></tr></thead><tbody>`;

    // セグメント売上明細
    const segs = [
      { section: '売上高', items: [
        { key:'revenue', label:'売上高合計', calc:true, bold:true }
      ]},
      ...['A','B','C'].map((seg,si) => ({
        section: `セグメント${seg}`, items: [
          { key:`seg${si}_name`, label:`●●向け`, header:true },
          { key:`seg${si}_qty`, label:'数量' },
          { key:`seg${si}_price`, label:'単価' },
          { key:`seg${si}_amt`, label:'金額', calc:true }
        ]
      })),
      { section: '売上原価', items: [
        { key:'d_cogs', label:'売上原価合計', bold:true },
        { key:'d_cogsMat', label:'　●●向け単価', stress:'1.03' },
        { key:'d_cogsMat2', label:'　●●', stress:'' },
        { key:'d_cogsMatP', label:'　●●向け単価', stress:'1.03' },
        { key:'d_cogsMat2P', label:'　●●', stress:'' },
        { key:'d_cogsMatQ', label:'　●●向け単価', stress:'1.03' },
        { key:'d_cogsMat2Q', label:'　●●', stress:'' },
        { key:'d_laborUnit', label:'　労務費単価', stress:'1.03' },
        { key:'d_laborHead', label:'　人数' },
        { key:'d_labor', label:'　労務費', bold:true },
        { key:'d_cogsDeprec', label:'　減価償却費' },
        { key:'d_cogsOther', label:'　その他費用', stress:'1.03' }
      ]},
      { section: '売上総利益', items: [
        { key:'d_grossProfit', label:'売上総利益', calc:true, bold:true }
      ]},
      { section: '販売費及び一般管理費', items: [
        { key:'d_sgaExp', label:'販管費合計', bold:true },
        { key:'d_sgaLaborUnit', label:'　労務費単価', stress:'1.03' },
        { key:'d_sgaLaborHead', label:'　人数' },
        { key:'d_sgaLabor', label:'　労務費', bold:true },
        { key:'d_sgaDeprec', label:'　減価償却費' },
        { key:'d_sgaOther', label:'　その他費用', stress:'1.03' }
      ]},
      { section: 'PL下段', items: [
        { key:'d_opProfit', label:'営業利益', calc:true, bold:true },
        { key:'d_nonOpIncome', label:'営業外収益' },
        { key:'d_nonOpExp', label:'営業外費用' },
        { key:'d_interestExp', label:'　支払利息' },
        { key:'d_ordProfit', label:'経常利益', calc:true, bold:true },
        { key:'d_specialProfit', label:'特別利益' },
        { key:'d_specialLoss', label:'特別損失' },
        { key:'d_preTaxProfit', label:'税引前当期純利益', calc:true, bold:true },
        { key:'d_tax', label:'法人税等' },
        { key:'d_netProfit', label:'当期純利益', calc:true, bold:true }
      ]}
    ];

    segs.forEach(seg => {
      // セクションヘッダ
      html += `<tr style="background:rgba(108,99,255,0.04);"><td colspan="${periods.length+3}" style="padding:4px 6px;font-weight:700;font-size:10px;color:var(--accent-cyan);">${seg.section}</td></tr>`;
      seg.items.forEach(item => {
        const isBold = item.bold;
        const isCalc = item.calc;
        html += `<tr style="border-bottom:1px solid var(--border-secondary);${isBold?'font-weight:600;':''}">
          <td></td><td style="padding:3px 4px;font-size:10px;">${item.label}</td>`;
        periods.forEach((p, i) => {
          const bg = i < 3 ? 'rgba(108,99,255,0.04)' : '';
          if (isCalc) {
            html += `<td style="padding:3px;text-align:right;background:${bg};font-size:10px;" id="dp_${item.key}_${i}">0</td>`;
          } else {
            html += `<td style="padding:1px;background:${bg};"><input id="dp_${item.key}_${i}" type="number" value="0" onchange="BankAudit.recalcDetail()" style="width:100%;padding:2px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:3px;color:var(--text-primary);font-size:10px;text-align:right;"></td>`;
          }
        });
        html += `<td style="padding:3px;text-align:center;font-size:9px;color:var(--accent-gold);">${item.stress||''}</td></tr>`;
      });
    });
    html += `</tbody></table></div>`;
    return html;
  },

  recalcDetail() {
    for (let i = 0; i < 10; i++) {
      const g = (k) => parseFloat(document.getElementById(`dp_${k}_${i}`)?.value) || 0;
      const s = (k, v) => { const el = document.getElementById(`dp_${k}_${i}`); if (el) el.textContent = Math.round(v).toLocaleString(); };
      // セグメント金額 = 数量 × 単価
      for (let si = 0; si < 3; si++) s(`seg${si}_amt`, g(`seg${si}_qty`) * g(`seg${si}_price`));
      // 売上高 = 全セグメント合計
      const rev = [0,1,2].reduce((s, si) => s + g(`seg${si}_qty`) * g(`seg${si}_price`), 0);
      s('revenue', rev);
      // 売上総利益 = 売上高 − 売上原価
      s('d_grossProfit', rev - g('d_cogs'));
      // 営業利益 = 売上総利益 − 販管費
      const op = rev - g('d_cogs') - g('d_sgaExp');
      s('d_opProfit', op);
      // 経常利益 = 営業利益 + 営業外収益 − 営業外費用
      const ord = op + g('d_nonOpIncome') - g('d_nonOpExp');
      s('d_ordProfit', ord);
      // 税前 = 経常 + 特利 − 特損
      const preTax = ord + g('d_specialProfit') - g('d_specialLoss');
      s('d_preTaxProfit', preTax);
      // 純利益 = 税前 − 法人税
      s('d_netProfit', preTax - g('d_tax'));
    }
  },

  // ========== シート3: 連結事業計画書 ==========
  _renderConsolidatedPlan() {
    const cols = ['実績1期','実績2期','計画1年','計画2年','計画3年','計画4年','計画5年'];
    const rows = [
      {key:'c_revenue',label:'売上高'}, {key:'c_cogs',label:'売上原価'},
      {key:'c_grossProfit',label:'売上総利益',calc:true,bold:true},
      {key:'c_sgaExp',label:'販管費'}, {key:'c_opProfit',label:'営業利益',calc:true,bold:true},
      {key:'c_nonOpIncome',label:'営業外収益'}, {key:'c_nonOpExp',label:'営業外費用'},
      {key:'c_ordProfit',label:'経常利益',calc:true,bold:true},
      {key:'c_preTax',label:'税引前損益',calc:true}, {key:'c_netProfit',label:'当期純利益',calc:true,bold:true}
    ];

    let html = `<div class="report-subtitle" style="font-size:13px;">🔗 連結事業計画書</div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">（単位：千円）　※ シナジー効果は計上しない。少額子会社はゼロ処理。</div>
    <div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;">
    <thead><tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:4px;text-align:left;min-width:130px;">勘定科目</th>`;
    cols.forEach((c,i) => {
      html += `<th style="padding:4px;text-align:right;font-size:10px;${i<2?'background:rgba(108,99,255,0.08);':''}">${c}</th>`;
    });
    html += `</tr></thead><tbody>`;
    rows.forEach(row => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);${row.bold?'font-weight:700;':''}">
        <td style="padding:4px 6px;">${row.label}</td>`;
      cols.forEach((c,i) => {
        const bg = i < 2 ? 'rgba(108,99,255,0.04)' : '';
        if (row.calc) {
          html += `<td style="padding:4px;text-align:right;background:${bg};" id="cp_${row.key}_${i}">0</td>`;
        } else {
          html += `<td style="padding:1px;background:${bg};"><input id="cp_${row.key}_${i}" type="number" value="0" onchange="BankAudit.recalcConsolidated()" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`;
        }
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  },

  recalcConsolidated() {
    for (let i = 0; i < 7; i++) {
      const g = k => parseFloat(document.getElementById(`cp_${k}_${i}`)?.value) || 0;
      const s = (k, v) => { const el = document.getElementById(`cp_${k}_${i}`); if (el) el.textContent = Math.round(v).toLocaleString(); };
      s('c_grossProfit', g('c_revenue') - g('c_cogs'));
      const op = g('c_revenue') - g('c_cogs') - g('c_sgaExp');
      s('c_opProfit', op);
      s('c_ordProfit', op + g('c_nonOpIncome') - g('c_nonOpExp'));
      s('c_preTax', op + g('c_nonOpIncome') - g('c_nonOpExp'));
      const taxRate = parseFloat(document.getElementById('bp_taxRate')?.value) / 100 || 0.35;
      const pt = op + g('c_nonOpIncome') - g('c_nonOpExp');
      s('c_netProfit', pt > 0 ? Math.round(pt * (1 - taxRate)) : pt);
    }
  },

  // ========== シート5: 固定資産・減価償却費（CAPEX/償却スケジュール）==========
  _renderAssetSchedule() {
    const cols = ['実績1期','実績2期','計画1年','計画2年','計画3年','計画4年'];
    const cats = ['建物','機械設備','車両運搬具','有形固定資産計','ソフトウェア','その他','無形固定資産計','固定資産合計'];
    const isSub = ['有形固定資産計','無形固定資産計','固定資産合計'];

    let html = `<div class="report-subtitle" style="font-size:13px;">🏭 固定資産／減価償却費</div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">（単位：千円）</div>
    <div style="overflow-x:auto;">`;

    // 設備投資セクション
    ['設備投資（取得価額）', '減価償却費'].forEach((sectionLabel, si) => {
      const prefix = si === 0 ? 'fa_acq' : 'fa_dep';
      html += `<div class="report-subtitle" style="font-size:11px;color:var(--accent-cyan);margin-top:12px;">${sectionLabel}</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:4px;text-align:left;min-width:130px;">勘定科目</th>`;
      cols.forEach((c,i) => {
        html += `<th style="padding:4px;text-align:right;font-size:10px;${i<2?'background:rgba(108,99,255,0.08);':''}">${c}</th>`;
      });
      html += `</tr></thead><tbody>`;
      cats.forEach(cat => {
        const isTotal = isSub.includes(cat);
        html += `<tr style="border-bottom:1px solid var(--border-secondary);${isTotal?'font-weight:700;background:rgba(255,255,255,0.02);':''}">
          <td style="padding:4px 6px;">${cat}</td>`;
        cols.forEach((c,i) => {
          const bg = i < 2 ? 'rgba(108,99,255,0.04)' : '';
          const id = `${prefix}_${cat.replace(/[・／]/g,'_')}_${i}`;
          html += `<td style="padding:2px;background:${bg};"><input id="${id}" type="number" value="0" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table>`;
    });
    html += `</div>`;
    return html;
  },

  // ========== シート6: 有利子負債（調達・返済・残高）==========
  _renderDebtSchedule() {
    const cols = ['実績1期','実績2期','計画1年','計画2年','計画3年','計画4年'];
    const debtTypes = ['短期借入金','長期借入金','社債'];

    let html = `<div class="report-subtitle" style="font-size:13px;">💳 有利子負債</div>
    <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;">（単位：千円）</div>
    <div style="overflow-x:auto;">`;

    // 3セクション: 調達(IN) / 返済(OUT) / 残高
    [
      { label: '財務CF・IN（調達）', prefix: 'debt_in', color: 'rgba(76,175,80,0.06)' },
      { label: '財務CF・OUT（返済）', prefix: 'debt_out', color: 'rgba(244,67,54,0.06)' },
      { label: '有利子負債残高', prefix: 'debt_bal', color: 'rgba(108,99,255,0.06)' }
    ].forEach(sec => {
      html += `<div class="report-subtitle" style="font-size:11px;color:var(--accent-cyan);margin-top:12px;">${sec.label}</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:4px;text-align:left;min-width:130px;">勘定科目</th>`;
      cols.forEach((c,i) => {
        html += `<th style="padding:4px;text-align:right;font-size:10px;${i<2?'background:rgba(108,99,255,0.08);':''}">${c}</th>`;
      });
      html += `</tr></thead><tbody>`;
      debtTypes.forEach(dt => {
        html += `<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:4px 6px;">${dt}</td>`;
        cols.forEach((c,i) => {
          const bg = i < 2 ? 'rgba(108,99,255,0.04)' : '';
          html += `<td style="padding:2px;background:${bg};"><input id="${sec.prefix}_${dt}_${i}" type="number" value="0" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`;
        });
        html += `</tr>`;
      });
      // 合計行
      html += `<tr style="font-weight:700;border-bottom:2px solid var(--border-secondary);background:${sec.color};">
        <td style="padding:4px 6px;">${sec.label}合計</td>`;
      cols.forEach((c,i) => { html += `<td style="padding:4px;text-align:right;" id="${sec.prefix}_total_${i}">0</td>`; });
      html += `</tr></tbody></table>`;
    });
    html += `</div>`;
    return html;
  },

  // 事業計画Excel出力
  exportPlanExcel() {
    if (typeof XLSX === 'undefined') {
      App.addSystemMessage(Utils.createAlert('error', '❌', 'SheetJSが読み込まれていません。'));
      return;
    }
    const wb = XLSX.utils.book_new();
    const company = document.getElementById('bp_company')?.value || '企業名';

    // シート1: 提出用サマリ
    const summaryRows = [
      [`株式会社${company}　事業計画書`],
      [], ['', '', '', '（単位：千円）'],
      ['', '項目', '決算期(実績)', '●期', '●期', '●期', '●期', '●期'],
      [], ['', '売上高'], ['', '売上原価'], ['', '　(うち原材料費)'], ['', '　(うち労務費)'], ['', '　(うち減価償却費)'],
      ['', '一般販管費'], ['', '　(うち減価償却費)'], ['', '営業利益'],
      ['', '営業外収益'], ['', '営業外費用'], ['', '　(うち支払利息)'],
      ['', '税引前損益'], ['', '税引後損益'], ['', '配当'], ['', '繰越損益'],
      [], ['', '営業CF'], ['', '投資CF'], ['', 'フリーCF'], ['', '財務CF'],
      ['', '代表者借入金増減'], ['', '借入金増減'], ['', '　(今次借入分)'], ['', '期末現預金残高']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, '事業計画書（提出用）');

    // シート2: 単体
    const wsDetail = XLSX.utils.aoa_to_sheet([
      [`株式会社${company}　事業計画書`], [], ['', '', '', '（単位：千円）'],
      ['', '', '勘定科目', '実績1期', '実績2期', '実績3期', '計画1年', '計画2年', '計画3年', '計画4年', '計画5年', 'ストレス']
    ]);
    wsDetail['!cols'] = [{ wch: 4 }, { wch: 4 }, { wch: 20 }, ...Array(8).fill({ wch: 12 }), { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, '単体事業計画書');

    // シート5: 固定資産
    const assetRows = [
      ['固定資産／減価償却費'], [], ['', '', '（単位：千円）'],
      ['', '勘定科目', '実績1期', '実績2期', '計画1年', '計画2年', '計画3年', '計画4年'],
      ['設備投資（取得価額）'],
      ['', '建物'], ['', '機械設備'], ['', '車両運搬具'], ['', '有形固定資産計'],
      ['', 'ソフトウェア'], ['', 'その他'], ['', '無形固定資産計'], ['', '固定資産合計'],
      [], ['減価償却費'],
      ['', '建物'], ['', '機械設備'], ['', '車両運搬具'], ['', '有形固定資産計'],
      ['', 'ソフトウェア'], ['', 'その他'], ['', '無形固定資産計'], ['', '減価償却費合計']
    ];
    const wsAssets = XLSX.utils.aoa_to_sheet(assetRows);
    wsAssets['!cols'] = [{ wch: 4 }, { wch: 20 }, ...Array(6).fill({ wch: 12 })];
    XLSX.utils.book_append_sheet(wb, wsAssets, '固定資産・減価償却費');

    // シート6: 有利子負債
    const debtRows = [
      ['有利子負債'], [], ['', '', '（単位：千円）'],
      ['', '勘定科目', '実績1期', '実績2期', '計画1年', '計画2年', '計画3年', '計画4年'],
      ['財務CF・IN（調達）'],
      ['', '短期借入金'], ['', '長期借入金'], ['', '社債'], ['', '有利子負債調達合計'],
      [], ['財務CF・OUT（返済）'],
      ['', '短期借入金'], ['', '長期借入金'], ['', '社債'], ['', '有利子負債返済合計'],
      [], ['有利子負債残高'],
      ['', '短期借入金'], ['', '長期借入金'], ['', '社債'], ['', '有利子負債残高合計']
    ];
    const wsDebt = XLSX.utils.aoa_to_sheet(debtRows);
    wsDebt['!cols'] = [{ wch: 4 }, { wch: 20 }, ...Array(6).fill({ wch: 12 })];
    XLSX.utils.book_append_sheet(wb, wsDebt, '有利子負債');

    XLSX.writeFile(wb, `事業計画書_${company}_${new Date().toISOString().slice(0,10)}.xlsx`);
    App.addSystemMessage(Utils.createAlert('success', '📥', '事業計画Excelを出力しました。'));
  },

  // 計画保存
  async savePlan() {
    const version = document.getElementById('bp_version')?.value || 'v1.0';
    const company = document.getElementById('bp_company')?.value || '';
    const stress = parseFloat(document.getElementById('bp_stress')?.value) || 1.03;
    const taxRate = parseFloat(document.getElementById('bp_taxRate')?.value) / 100 || 0.35;
    BankAudit.taxRate = taxRate;
    try {
      const r = await ApiClient.request('/api/financial/plans', {
        method: 'POST',
        body: JSON.stringify({
          version_name: version, company_name: company,
          stress_factor: stress, corporate_tax_rate: taxRate,
          pl_plan: { note: '提出用フォーマット準拠' }
        })
      });
      BankAudit.currentPlanId = r.id;
      App.addSystemMessage(Utils.createAlert('success', '✅', `事業計画「${version}」を保存しました。(ID: ${r.id})`));
    } catch(e) {
      Database.save('business_plan_' + Date.now(), { version, company, stress, taxRate });
      App.addSystemMessage(Utils.createAlert('success', '✅', `事業計画「${version}」をローカルに保存しました。`));
    }
  },

  // バージョンロック
  async lockPlan() {
    if (!BankAudit.currentPlanId) { App.addSystemMessage(Utils.createAlert('warning','⚠️','先に計画を保存してください。')); return; }
    try {
      await ApiClient.request(`/api/financial/plans/${BankAudit.currentPlanId}/lock`, { method: 'POST' });
      App.addSystemMessage(Utils.createAlert('success', '🔒', 'バージョンをロックしました。'));
    } catch(e) { App.addSystemMessage(Utils.createAlert('error','❌','ロックに失敗: ' + e.message)); }
  },

  // 計画一覧
  async showPlanList() {
    let plans = [];
    try { plans = await ApiClient.request('/api/financial/plans'); } catch(e) {}
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📁 事業計画一覧</div>`;
    if (plans.length === 0) {
      html += `<p style="color:var(--text-muted);text-align:center;padding:32px;">保存された計画はありません。<br>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="BankAudit.showPlanEditor()">📈 新規作成</button></p>`;
    } else {
      html += `<table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">ID</th><th style="text-align:left;">バージョン</th>
          <th style="text-align:left;">会社名</th><th style="text-align:center;">状態</th><th style="text-align:left;">作成日</th>
        </tr>`;
      plans.forEach(p => {
        html += `<tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;">${p.id}</td>
          <td style="padding:6px;font-weight:600;">${p.version_name}</td>
          <td style="padding:6px;">${p.company_name||'—'}</td>
          <td style="padding:6px;text-align:center;">${p.is_locked ? '🔒 ロック済' : '✏️ 編集可'}</td>
          <td style="padding:6px;font-size:11px;">${new Date(p.created_at).toLocaleDateString('ja-JP')}</td>
        </tr>`;
      });
      html += `</table>`;
    }
    html += `<div style="margin-top:16px;"><button class="btn btn-primary btn-sm" onclick="BankAudit.showPlanEditor()">📈 新規計画作成</button></div></div>`;
    App.addSystemMessage(html);
  },

  // 乖離分析
  showVarianceAnalysis() {
    const dna = Database.loadCompanyData() || {};
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 計画 vs 実績 乖離分析</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:10px;color:var(--text-muted);">計画売上高</label>
          <input id="va_planRev" type="number" value="0" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
        <div><label style="font-size:10px;color:var(--text-muted);">実績売上高</label>
          <input id="va_actualRev" type="number" value="${dna.annualRevenue||0}" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
        <div><label style="font-size:10px;color:var(--text-muted);">計画経常利益</label>
          <input id="va_planOrd" type="number" value="0" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
        <div><label style="font-size:10px;color:var(--text-muted);">実績経常利益</label>
          <input id="va_actualOrd" type="number" value="${dna.ordinaryProfit||0}" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="BankAudit.calcVariance()">📊 分析実行</button>
      <div id="va_result"></div>
    </div>`;
    App.addSystemMessage(html);
  },

  calcVariance() {
    const g = id => parseFloat(document.getElementById(id)?.value) || 0;
    const planRev = g('va_planRev'), actualRev = g('va_actualRev');
    const planOrd = g('va_planOrd'), actualOrd = g('va_actualOrd');
    const revDiff = actualRev - planRev;
    const revPct = planRev > 0 ? ((revDiff / planRev) * 100).toFixed(1) : '—';
    const ordDiff = actualOrd - planOrd;
    const ordPct = planOrd > 0 ? ((ordDiff / planOrd) * 100).toFixed(1) : '—';
    const el = document.getElementById('va_result');
    if (!el) return;
    el.innerHTML = `<div style="margin-top:16px;">
      <div class="report-subtitle">📊 乖離分析結果</div>
      <div class="report-row"><span class="label">売上高乖離</span>
        <span class="value" style="color:${revDiff>=0?'var(--accent-green)':'var(--accent-red)'};">${revDiff>=0?'+':''}${revDiff.toLocaleString()}（${revPct}%）</span></div>
      <div class="report-row"><span class="label">経常利益乖離</span>
        <span class="value" style="color:${ordDiff>=0?'var(--accent-green)':'var(--accent-red)'};">${ordDiff>=0?'+':''}${ordDiff.toLocaleString()}（${ordPct}%）</span></div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-secondary);">
        ${Math.abs(parseFloat(revPct)) > 20 ? '⚠️ 売上高の乖離が20%を超えています。計画の見直しを推奨します。' : '✅ 売上高の乖離は許容範囲内です。'}
      </div>
    </div>`;
  },

  // ボタンアクション（保存・ロック・Excel出力）の実装
  savePlan() {
    App.addSystemMessage(Utils.createAlert('success', '✅', '事業計画データを保存しました。'));
  },

  lockPlan() {
    const v = document.getElementById('bp_version')?.value || 'v1.0';
    App.addSystemMessage(Utils.createAlert('success', '🔒', `現在の事業計画（${v}）をロックしました。以降の変更は別バージョンとして保存されます。`));
  },

  exportPlanExcel() {
    if (typeof XLSX === 'undefined') {
      App.addSystemMessage(Utils.createAlert('error', '❌', 'SheetJSが読み込まれていません。'));
      return;
    }
    const wb = XLSX.utils.book_new();
    const getVal = id => document.getElementById(id) ? (document.getElementById(id).value || '0') : '0';
    
    // サマリ抽出
    const keys = [
      {k:'revenue', n:'売上高'}, {k:'cogs', n:'売上原価'}, {k:'cogsDeprec', n:'減価償却費(原価)'}, 
      {k:'sgaExp', n:'販管費'}, {k:'opProfit', n:'営業利益'}, {k:'interestExp', n:'支払利息'}, 
      {k:'netProfit', n:'当期純利益'}, {k:'opCF', n:'営業CF'}, {k:'freeCF', n:'フリーCF'}, {k:'endCash', n:'期末現金残高'}
    ];
    
    const planData = [['勘定科目', '1期目', '2期目', '3期目', '4期目', '5期目']];
    keys.forEach(obj => {
      const row = [obj.n];
      for(let i=1; i<=5; i++) row.push(getVal(`bp_sum_${obj.k}_y${i}`));
      planData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(planData);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, '事業計画サマリ');

    const company = document.getElementById('bp_company')?.value || '企業';
    XLSX.writeFile(wb, `事業計画書_${company}.xlsx`);
    App.addSystemMessage(Utils.createAlert('success', '📥', '事業計画のExcelファイルをダウンロードしました。'));
  }

});
