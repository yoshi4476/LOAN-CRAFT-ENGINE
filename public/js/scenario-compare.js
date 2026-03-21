/* ============================================================
 * LOAN CRAFT ENGINE - 複数シナリオ比較モジュール
 * 融資パターンを並べて比較検討
 * ============================================================ */

const ScenarioCompare = {

  scenarios: [],

  // 比較画面表示
  show() {
    this.scenarios = Database.load('loan_scenarios') || [];
    if (this.scenarios.length === 0) {
      this.scenarios = [
        { name: 'シナリオA', bank: '', type: 'プロパー', amount: 0, rate: 0, term: 0, guarantee: 'なし', collateral: 'なし' },
        { name: 'シナリオB', bank: '', type: '保証協会付', amount: 0, rate: 0, term: 0, guarantee: '保証協会', collateral: 'なし' },
      ];
    }

    let html = `<div class="glass-card highlight" style="max-width:900px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="report-title" style="margin:0;">⚖️ 融資シナリオ比較</div>
        <button class="btn btn-secondary btn-sm" onclick="ScenarioCompare.addScenario()">➕ シナリオ追加</button>
      </div>

      <div style="overflow-x:auto;">
        <table style="width:100%;font-size:12px;border-collapse:collapse;min-width:600px;">
          <tr style="border-bottom:2px solid var(--border-secondary);">
            <th style="padding:8px;text-align:left;width:120px;">項目</th>
            ${this.scenarios.map((s, i) => `<th style="padding:8px;text-align:center;">
              <input value="${s.name}" onchange="ScenarioCompare.update(${i},'name',this.value)" style="width:100%;text-align:center;font-weight:700;background:transparent;border:none;color:var(--primary-light);font-size:13px;">
              <button onclick="ScenarioCompare.remove(${i})" style="font-size:10px;background:none;border:none;color:var(--accent-red);cursor:pointer;">✕削除</button>
            </th>`).join('')}
          </tr>
          ${this._inputRow('金融機関', 'bank', 'text', '')}
          ${this._selectRow('融資種別', 'type', ['プロパー','保証協会付','公庫','制度融資','ABL','不動産担保'])}
          ${this._inputRow('融資額(万円)', 'amount', 'number', '0')}
          ${this._inputRow('金利(%)', 'rate', 'number', '0')}
          ${this._inputRow('返済期間(年)', 'term', 'number', '0')}
          ${this._selectRow('保証', 'guarantee', ['なし','保証協会','経営者保証','第三者保証'])}
          ${this._selectRow('担保', 'collateral', ['なし','不動産','預金','売掛金','在庫'])}
        </table>
      </div>

      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="ScenarioCompare.calculate()">📊 比較分析</button>
        <button class="btn btn-secondary" onclick="ScenarioCompare.save()">💾 保存</button>
      </div>

      <div id="scenarioResult"></div>
    </div>`;
    App.addSystemMessage(html);
  },

  _inputRow(label, field, type, placeholder) {
    return `<tr style="border-bottom:1px solid var(--border-secondary);">
      <td style="padding:6px;font-weight:600;">${label}</td>
      ${this.scenarios.map((s, i) => `<td style="padding:4px;">
        <input type="${type}" value="${s[field]||''}" placeholder="${placeholder}"
          onchange="ScenarioCompare.update(${i},'${field}',this.value)"
          style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;text-align:center;">
      </td>`).join('')}
    </tr>`;
  },

  _selectRow(label, field, options) {
    return `<tr style="border-bottom:1px solid var(--border-secondary);">
      <td style="padding:6px;font-weight:600;">${label}</td>
      ${this.scenarios.map((s, i) => `<td style="padding:4px;">
        <select onchange="ScenarioCompare.update(${i},'${field}',this.value)"
          style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
          ${options.map(o => `<option value="${o}" ${s[field]===o?'selected':''}>${o}</option>`).join('')}
        </select>
      </td>`).join('')}
    </tr>`;
  },

  update(idx, field, value) {
    if (field === 'amount' || field === 'rate' || field === 'term') value = parseFloat(value) || 0;
    this.scenarios[idx][field] = value;
  },

  addScenario() {
    const n = this.scenarios.length + 1;
    this.scenarios.push({ name: 'シナリオ' + String.fromCharCode(64+n), bank: '', type: 'プロパー', amount: 0, rate: 0, term: 0, guarantee: 'なし', collateral: 'なし' });
    this.show();
  },

  remove(idx) {
    if (this.scenarios.length <= 1) return;
    this.scenarios.splice(idx, 1);
    this.show();
  },

  save() {
    Database.save('loan_scenarios', this.scenarios);
    App.addSystemMessage(Utils.createAlert('success', '✅', 'シナリオを保存しました。'));
  },

  // 比較分析
  calculate() {
    this.save();
    const dna = Database.loadCompanyData() || {};
    const monthlyCF = ((parseFloat(dna.operatingProfit)||0) + (parseFloat(dna.depreciation)||0)) / 12;

    let html = `<div style="margin-top:20px;">
      <div class="report-subtitle">📊 比較分析結果</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">分析項目</th>
          ${this.scenarios.map(s => `<th style="padding:8px;text-align:center;font-weight:700;">${s.name}</th>`).join('')}
        </tr>`;

    // 各シナリオの計算
    const calcs = this.scenarios.map(s => {
      const monthlyRate = (s.rate / 100) / 12;
      const months = s.term * 12;
      let monthlyPayment = 0;
      if (monthlyRate > 0 && months > 0 && s.amount > 0) {
        monthlyPayment = s.amount * monthlyRate * Math.pow(1+monthlyRate, months) / (Math.pow(1+monthlyRate, months) - 1);
      } else if (months > 0 && s.amount > 0) {
        monthlyPayment = s.amount / months;
      }
      const totalPayment = monthlyPayment * months;
      const totalInterest = totalPayment - s.amount;
      const guaranteeCost = s.guarantee === '保証協会' ? s.amount * 0.01 * s.term : 0;
      const totalCost = totalInterest + guaranteeCost;
      const repayRatio = monthlyCF > 0 ? (monthlyPayment / monthlyCF * 100).toFixed(1) : '-';
      return { monthlyPayment, totalPayment, totalInterest, guaranteeCost, totalCost, repayRatio };
    });

    // 最低コストのインデックス
    const minCostIdx = calcs.reduce((min, c, i) => c.totalCost > 0 && (min === -1 || c.totalCost < calcs[min].totalCost) ? i : min, -1);

    const rows = [
      ['月額返済額', calcs.map(c => c.monthlyPayment > 0 ? c.monthlyPayment.toFixed(1) + '万' : '-')],
      ['総返済額', calcs.map(c => c.totalPayment > 0 ? c.totalPayment.toFixed(0) + '万' : '-')],
      ['利息総額', calcs.map(c => c.totalInterest > 0 ? c.totalInterest.toFixed(0) + '万' : '-')],
      ['保証料概算', calcs.map(c => c.guaranteeCost > 0 ? c.guaranteeCost.toFixed(0) + '万' : '-')],
      ['総コスト', calcs.map((c, i) => {
        const val = c.totalCost > 0 ? c.totalCost.toFixed(0) + '万' : '-';
        return i === minCostIdx ? '⭐' + val : val;
      })],
      ['CF返済比率', calcs.map(c => c.repayRatio !== '-' ? c.repayRatio + '%' : '-')],
    ];

    rows.forEach(([label, values]) => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);">
        <td style="padding:6px;font-weight:600;">${label}</td>
        ${values.map(v => `<td style="padding:6px;text-align:center;">${v}</td>`).join('')}
      </tr>`;
    });

    html += `</table>`;

    // 推奨
    if (minCostIdx >= 0) {
      const best = this.scenarios[minCostIdx];
      html += `<div style="margin-top:12px;padding:12px;background:linear-gradient(135deg,rgba(0,200,100,0.1),rgba(0,150,200,0.05));border:1px solid var(--border-primary);border-radius:8px;">
        <div style="font-size:13px;font-weight:700;color:var(--accent-green);">⭐ 推奨: ${best.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
          総コストが最も低い: ${calcs[minCostIdx].totalCost.toFixed(0)}万円
          ${calcs[minCostIdx].repayRatio !== '-' ? `（月間CFの${calcs[minCostIdx].repayRatio}%）` : ''}
        </div>
      </div>`;
    }

    html += `</div>`;
    document.getElementById('scenarioResult').innerHTML = html;
  },
};
