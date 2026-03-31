/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 事業計画モジュール
 * MODULE 2: 10年間事業計画の策定・保存・閲覧
 * ============================================================ */

// BankAuditオブジェクトに事業計画機能を追加
Object.assign(BankAudit, {

  // 事業計画エディタ
  showPlanEditor() {
    const dna = Database.loadCompanyData() || {};
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
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
        <button class="btn btn-primary btn-sm" onclick="BankAudit.showPlanPL()">📊 PL計画</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showSegmentPlan()">📦 セグメント売上</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showFixedAssetSchedule()">🏭 固定資産</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showDebtSchedule()">💳 有利子負債</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showPlanList()">📁 計画一覧</button>
      </div>
      <div id="bp_content">${this._renderPlanPL()}</div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="BankAudit.savePlan()">💾 計画保存</button>
        <button class="btn btn-secondary" onclick="BankAudit.lockPlan()">🔒 バージョンロック</button>
        <button class="btn btn-secondary" onclick="BankAudit.showVarianceAnalysis()">📊 乖離分析</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  showPlanPL() {
    const el = document.getElementById('bp_content');
    if (el) el.innerHTML = this._renderPlanPL();
  },

  _renderPlanPL() {
    const periods = ['実績1期','実績2期','実績3期','計画1年','計画2年','計画3年','計画4年','計画5年','計画6年','計画7年','計画8年','計画9年','計画10年'];
    const rows = [
      {key:'revenue',label:'売上高',cat:'A'},
      {key:'cogs',label:'売上原価',cat:'A'},
      {key:'cogsLabor',label:'　労務費',cat:''},
      {key:'cogsDeprec',label:'　減価償却費',cat:''},
      {key:'cogsOther',label:'　その他',cat:''},
      {key:'grossProfit',label:'売上総利益',cat:'A',calc:true},
      {key:'sgaExp',label:'販管費合計',cat:'B'},
      {key:'sgaLabor',label:'　人件費',cat:''},
      {key:'sgaDeprec',label:'　減価償却費',cat:''},
      {key:'sgaOther',label:'　その他',cat:''},
      {key:'opProfit',label:'営業利益',cat:'B',calc:true},
      {key:'nonOpNet',label:'営業外損益（純額）',cat:'C'},
      {key:'ordProfit',label:'経常利益',cat:'C',calc:true},
      {key:'specialNet',label:'特別損益（純額）',cat:'D'},
      {key:'preTaxProfit',label:'税引前利益',cat:'D',calc:true},
      {key:'tax',label:'法人税等',cat:'E'},
      {key:'netProfit',label:'当期純利益',cat:'E',calc:true}
    ];

    let html = `<div class="report-subtitle" style="font-size:13px;">📊 損益計画（PL）</div>
    <div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;min-width:1200px;">
    <thead><tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:4px 6px;text-align:left;min-width:120px;">勘定科目</th>`;
    periods.forEach((p,i) => {
      const bg = i < 3 ? 'rgba(108,99,255,0.08)' : 'transparent';
      html += `<th style="padding:4px 6px;text-align:right;background:${bg};font-size:10px;min-width:80px;">${p}</th>`;
    });
    html += `<th style="padding:4px 6px;text-align:right;font-size:10px;">ストレス</th></tr></thead><tbody>`;

    rows.forEach(row => {
      const isBold = row.calc;
      html += `<tr style="border-bottom:1px solid var(--border-secondary);${isBold?'font-weight:700;background:rgba(255,255,255,0.02);':''}">
        <td style="padding:4px 6px;font-size:11px;">${row.label}</td>`;
      periods.forEach((p,i) => {
        const bg = i < 3 ? 'rgba(108,99,255,0.05)' : '';
        if (row.calc) {
          html += `<td style="padding:4px 6px;text-align:right;background:${bg};"><span id="bp_${row.key}_${i}" style="font-size:11px;">0</span></td>`;
        } else {
          html += `<td style="padding:2px;background:${bg};"><input id="bp_${row.key}_${i}" type="number" value="0" onchange="BankAudit.recalcPlan()" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`;
        }
      });
      // ストレス列
      if (['cogsLabor','cogsOther','sgaLabor','sgaOther'].includes(row.key)) {
        html += `<td style="padding:4px 6px;text-align:right;font-size:10px;color:var(--accent-gold);">×1.03</td>`;
      } else {
        html += `<td></td>`;
      }
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  },

  recalcPlan() {
    for (let i = 0; i < 13; i++) {
      const g = (k) => parseFloat(document.getElementById(`bp_${k}_${i}`)?.value) || 0;
      const s = (k, v) => { const el = document.getElementById(`bp_${k}_${i}`); if (el) el.textContent = Math.round(v).toLocaleString(); };
      s('grossProfit', g('revenue') - g('cogs'));
      s('opProfit', (g('revenue') - g('cogs')) - g('sgaExp'));
      s('ordProfit', (g('revenue') - g('cogs') - g('sgaExp')) + g('nonOpNet'));
      s('preTaxProfit', (g('revenue') - g('cogs') - g('sgaExp') + g('nonOpNet')) + g('specialNet'));
      s('netProfit', (g('revenue') - g('cogs') - g('sgaExp') + g('nonOpNet') + g('specialNet')) - g('tax'));
    }
  },

  // セグメント売上計画
  showSegmentPlan() {
    const el = document.getElementById('bp_content');
    if (!el) { this.showPlanEditor(); return; }
    let html = `<div class="report-subtitle" style="font-size:13px;">📦 セグメント別売上計画（数量×単価）</div>`;
    for (let seg = 1; seg <= 5; seg++) {
      html += `<div style="margin-bottom:12px;padding:12px;background:rgba(108,99,255,0.04);border-radius:8px;">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:6px;">
          <div><label style="font-size:10px;color:var(--text-muted);">セグメント${seg}名称</label>
            <input id="bp_seg${seg}_name" placeholder="セグメント名" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;"></div>
          <div><label style="font-size:10px;color:var(--text-muted);">数量</label>
            <input id="bp_seg${seg}_qty" type="number" value="0" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;"></div>
          <div><label style="font-size:10px;color:var(--text-muted);">単価</label>
            <input id="bp_seg${seg}_price" type="number" value="0" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;"></div>
          <div><label style="font-size:10px;color:var(--text-muted);">売上高</label>
            <div id="bp_seg${seg}_total" style="padding:6px;font-size:11px;font-weight:600;">0</div></div>
        </div>
      </div>`;
    }
    el.innerHTML = html;
  },

  // 固定資産・減価償却費明細
  showFixedAssetSchedule() {
    const el = document.getElementById('bp_content');
    if (!el) { this.showPlanEditor(); return; }
    const categories = ['建物','機械設備','車両運搬具','ソフトウェア','その他'];
    const cols = ['実績1期','実績2期','計画1年','計画2年','計画3年','計画4年','計画5年'];
    let html = `<div class="report-subtitle" style="font-size:13px;">🏭 固定資産・減価償却費明細</div>
    <div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;">
    <thead><tr style="border-bottom:2px solid var(--border-secondary);">
      <th style="padding:4px 6px;text-align:left;">資産区分</th>
      ${cols.map(c => `<th style="padding:4px 6px;text-align:right;font-size:10px;">${c}</th>`).join('')}
    </tr></thead><tbody>`;
    // 取得価額セクション
    html += `<tr style="background:rgba(108,99,255,0.06);"><td colspan="${cols.length+1}" style="padding:6px;font-weight:700;font-size:11px;">取得価額</td></tr>`;
    categories.forEach(cat => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:4px 6px;">${cat}</td>`;
      cols.forEach((c,i) => { html += `<td style="padding:2px;"><input id="fa_acq_${cat}_${i}" type="number" value="0" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`; });
      html += `</tr>`;
    });
    html += `<tr style="font-weight:700;border-bottom:2px solid var(--border-secondary);"><td style="padding:4px 6px;">固定資産合計</td>`;
    cols.forEach((c,i) => { html += `<td style="padding:4px 6px;text-align:right;" id="fa_acq_total_${i}">0</td>`; });
    html += `</tr>`;
    // 減価償却費セクション
    html += `<tr style="background:rgba(255,193,7,0.06);"><td colspan="${cols.length+1}" style="padding:6px;font-weight:700;font-size:11px;">減価償却費</td></tr>`;
    categories.forEach(cat => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:4px 6px;">${cat}減価償却費</td>`;
      cols.forEach((c,i) => { html += `<td style="padding:2px;"><input id="fa_dep_${cat}_${i}" type="number" value="0" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`; });
      html += `</tr>`;
    });
    html += `<tr style="font-weight:700;"><td style="padding:4px 6px;">減価償却費合計</td>`;
    cols.forEach((c,i) => { html += `<td style="padding:4px 6px;text-align:right;" id="fa_dep_total_${i}">0</td>`; });
    html += `</tr></tbody></table></div>`;
    el.innerHTML = html;
  },

  // 有利子負債明細
  showDebtSchedule() {
    const el = document.getElementById('bp_content');
    if (!el) { this.showPlanEditor(); return; }
    const debtTypes = ['短期借入金','長期借入金','社債'];
    const cols = ['実績1期','計画1年','計画2年','計画3年','計画4年','計画5年'];
    let html = `<div class="report-subtitle" style="font-size:13px;">💳 有利子負債明細</div>
    <div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;">
    <thead><tr style="border-bottom:2px solid var(--border-secondary);">
      <th style="padding:4px 6px;text-align:left;">勘定科目</th>
      ${cols.map(c => `<th style="padding:4px 6px;text-align:right;font-size:10px;">${c}</th>`).join('')}
    </tr></thead><tbody>`;
    // 調達(IN)
    html += `<tr style="background:rgba(76,175,80,0.06);"><td colspan="${cols.length+1}" style="padding:6px;font-weight:700;font-size:11px;">財務CF・IN（調達）</td></tr>`;
    debtTypes.forEach(dt => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:4px 6px;">${dt}</td>`;
      cols.forEach((c,i) => { html += `<td style="padding:2px;"><input type="number" value="0" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`; });
      html += `</tr>`;
    });
    html += `<tr style="font-weight:700;border-bottom:2px solid var(--border-secondary);"><td>有利子負債調達合計</td>`;
    cols.forEach(() => { html += `<td style="padding:4px 6px;text-align:right;">0</td>`; });
    html += `</tr>`;
    // 返済(OUT)
    html += `<tr style="background:rgba(244,67,54,0.06);"><td colspan="${cols.length+1}" style="padding:6px;font-weight:700;font-size:11px;">財務CF・OUT（返済）</td></tr>`;
    debtTypes.forEach(dt => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:4px 6px;">${dt}</td>`;
      cols.forEach((c,i) => { html += `<td style="padding:2px;"><input type="number" value="0" style="width:100%;padding:3px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:right;"></td>`; });
      html += `</tr>`;
    });
    html += `<tr style="font-weight:700;border-bottom:2px solid var(--border-secondary);"><td>有利子負債返済合計</td>`;
    cols.forEach(() => { html += `<td style="padding:4px 6px;text-align:right;">0</td>`; });
    html += `</tr>`;
    // 残高
    html += `<tr style="font-weight:700;background:rgba(108,99,255,0.06);"><td>有利子負債残高合計</td>`;
    cols.forEach(() => { html += `<td style="padding:4px 6px;text-align:right;">0</td>`; });
    html += `</tr></tbody></table></div>`;
    el.innerHTML = html;
  },

  // 計画保存
  async savePlan() {
    const version = document.getElementById('bp_version')?.value || 'v1.0';
    const company = document.getElementById('bp_company')?.value || '';
    const stress = parseFloat(document.getElementById('bp_stress')?.value) || 1.03;
    const taxRate = parseFloat(document.getElementById('bp_taxRate')?.value) / 100 || 0.35;
    BankAudit.taxRate = taxRate;
    // PL計画データ収集
    const plData = {};
    for (let i = 0; i < 13; i++) {
      const keys = ['revenue','cogs','cogsLabor','cogsDeprec','cogsOther','sgaExp','sgaLabor','sgaDeprec','sgaOther','nonOpNet','specialNet','tax'];
      const row = {};
      keys.forEach(k => { row[k] = parseFloat(document.getElementById(`bp_${k}_${i}`)?.value) || 0; });
      plData[i] = row;
    }
    try {
      const r = await ApiClient.request('/api/financial/plans', {
        method: 'POST',
        body: JSON.stringify({
          version_name: version, company_name: company,
          stress_factor: stress, corporate_tax_rate: taxRate,
          pl_plan: plData
        })
      });
      BankAudit.currentPlanId = r.id;
      App.addSystemMessage(Utils.createAlert('success', '✅', `事業計画「${version}」を保存しました。(ID: ${r.id})`));
    } catch(e) {
      // ローカル保存フォールバック
      Database.save('business_plan_' + Date.now(), { version, company, stress, taxRate, plData });
      App.addSystemMessage(Utils.createAlert('success', '✅', `事業計画「${version}」をローカルに保存しました。`));
    }
  },

  // バージョンロック
  async lockPlan() {
    if (!BankAudit.currentPlanId) { App.addSystemMessage(Utils.createAlert('warning','⚠️','先に計画を保存してください。')); return; }
    try {
      await ApiClient.request(`/api/financial/plans/${BankAudit.currentPlanId}/lock`, { method: 'POST' });
      App.addSystemMessage(Utils.createAlert('success', '🔒', 'バージョンをロックしました。以降の編集はできません。修正時は新バージョンとして保存してください。'));
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
    html += `<div style="margin-top:16px;"><button class="btn btn-primary btn-sm" onclick="BankAudit.showPlanEditor()">📈 新規計画作成</button></div>
    </div>`;
    App.addSystemMessage(html);
  },

  // 計画vs実績 乖離分析
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
  }
});
