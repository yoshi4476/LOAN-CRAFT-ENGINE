/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - ユーティリティモジュール
 * ============================================================ */

const Utils = {
  // 数値を万円表記にフォーマット
  formatMan(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const num = Number(value);
    if (Math.abs(num) >= 10000) return `${(num / 10000).toFixed(1)}億円`;
    return `${num.toLocaleString()}万円`;
  },

  // 数値を百万円表記
  formatHyakuman(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `${Number(value).toLocaleString()}百万円`;
  },

  // パーセント表記
  formatPercent(value, decimal = 1) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `${Number(value).toFixed(decimal)}%`;
  },

  // 倍率表記
  formatRatio(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `${Number(value).toFixed(2)}倍`;
  },

  // 月数表記
  formatMonths(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `${Number(value).toFixed(1)}ヶ月`;
  },

  // 年数表記
  formatYears(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `${Number(value).toFixed(1)}年`;
  },

  // 通貨フォーマット（円）
  formatYen(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    return `¥${Number(value).toLocaleString()}`;
  },

  // 日付フォーマット
  formatDate(date) {
    if (!date) return '—';
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  },

  // 現在時刻の文字列
  now() {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // 案件IDの自動採番
  generateCaseId() {
    const year = new Date().getFullYear();
    const count = Database.getCaseCount() + 1;
    return `LC-${year}-${String(count).padStart(4, '0')}`;
  },

  // HTMLエスケープ
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // テーブルHTML生成
  createTable(headers, rows, options = {}) {
    let html = '<table class="data-table">';
    html += '<thead><tr>';
    headers.forEach(h => {
      const cls = h.type === 'num' ? ' class="num"' : '';
      html += `<th${cls}>${Utils.escapeHtml(h.label || h)}</th>`;
    });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach((cell, i) => {
        const cls = (headers[i] && headers[i].type === 'num') ? ' class="num"' : '';
        html += `<td${cls}>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  },

  // プログレスバーHTML生成
  createProgressBar(value, max, type = '') {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const cls = type ? ` ${type}` : '';
    return `<div class="progress-bar${cls}"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  },

  // 格付けバッジHTML
  createGradeBadge(grade) {
    const cls = grade.toLowerCase().replace('+', 'p');
    const map = { 'sp': 'sp', 's+': 'sp', 's': 's', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f' };
    return `<span class="grade-badge ${map[grade.toLowerCase()] || 's'}">${Utils.escapeHtml(grade)}</span>`;
  },

  // アラートカードHTML
  createAlert(type, icon, message) {
    return `<div class="alert-card ${type}"><span class="alert-icon">${icon}</span><div>${message}</div></div>`;
  },

  // スコアに応じた色クラス
  scoreColor(score, max) {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'success';
    if (pct >= 60) return '';
    if (pct >= 40) return 'warning';
    return 'danger';
  },

  // 格付けスコアから格付け文字列を取得
  scoreToGrade(score) {
    if (score >= 86) return 'S+';
    if (score >= 76) return 'S';
    if (score >= 66) return 'A';
    if (score >= 56) return 'B';
    if (score >= 46) return 'C';
    if (score >= 36) return 'D';
    if (score >= 26) return 'E';
    return 'F';
  },

  // 格付けから債務者区分
  gradeToCategory(grade) {
    const map = {
      'S+': '正常先（最上位）', 'S': '正常先（上位）', 'A': '正常先',
      'B': '正常先（下位）', 'C': '要注意先', 'D': '要注意先（要管理）',
      'E': '破綻懸念先', 'F': '実質破綻先/破綻先'
    };
    return map[grade] || '不明';
  },

  // 格付けから銀行内での扱い
  gradeToTreatment(grade) {
    const map = {
      'S+': '積極推進先。プロパー融資優先',
      'S': '推進先。好条件提示可',
      'A': '通常対応。標準条件',
      'B': 'やや慎重。保証付き推奨',
      'C': '保全重視。保証付き必須',
      'D': '管理強化。新規融資困難',
      'E': '回収方針。新規は原則不可',
      'F': '法的整理検討'
    };
    return map[grade] || '';
  },

  // ディープコピー
  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // 数値バリデーション
  isValidNumber(val) {
    return val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
  },

  // 遅延実行
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // スクロールを一番下に
  scrollToBottom(element) {
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
};
