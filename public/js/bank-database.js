/* ============================================================
 * LOAN CRAFT ENGINE - 金融機関データベース
 * 銀行・公庫・保証協会の融資条件を一覧化
 * ============================================================ */

const BankDatabase = {

  // 金融機関データ（主要機関の融資条件）
  banks: [
    { id: 'mega1', name: '三菱UFJ銀行', type: 'メガバンク', icon: '🏦',
      minRating: 'B+', loanRange: '5000万〜', rate: '0.5〜2.0%', term: '〜10年',
      strength: '大口融資・M&A・海外展開', weakness: '小規模企業は審査厳格',
      criteria: '格付けB+以上・年商3億以上が目安' },
    { id: 'mega2', name: 'みずほ銀行', type: 'メガバンク', icon: '🏦',
      minRating: 'B+', loanRange: '5000万〜', rate: '0.5〜2.0%', term: '〜10年',
      strength: '産業別の専門性・シンジケートローン', weakness: '審査期間が長い',
      criteria: '格付けB+以上・年商5億以上推奨' },
    { id: 'mega3', name: '三井住友銀行', type: 'メガバンク', icon: '🏦',
      minRating: 'B', loanRange: '3000万〜', rate: '0.5〜2.5%', term: '〜10年',
      strength: '中小企業にも積極的・スピード審査', weakness: '担保重視の傾向',
      criteria: '格付けB以上・財務内容重視' },
    { id: 'regional1', name: '地方銀行（一般）', type: '地方銀行', icon: '🏛️',
      minRating: 'C+', loanRange: '500万〜3億', rate: '1.0〜3.5%', term: '〜15年',
      strength: '地域密着・柔軟な対応・メイン化で有利', weakness: '営業エリア限定',
      criteria: '地域の雇用・経済への貢献度も評価' },
    { id: 'shinkin', name: '信用金庫', type: '信用金庫', icon: '🏦',
      minRating: 'D+', loanRange: '100万〜1億', rate: '1.5〜4.0%', term: '〜15年',
      strength: '小規模に最も親身・経営者との関係重視', weakness: '大口は困難',
      criteria: '代表者の人柄・事業への情熱を重視' },
    { id: 'jfc_general', name: '日本政策金融公庫（一般貸付）', type: '政府系', icon: '🏛️',
      minRating: 'D', loanRange: '〜4800万', rate: '1.0〜2.5%', term: '〜10年(運転) 〜20年(設備)',
      strength: '創業・赤字でも扱い可能・無担保枠あり', weakness: '融資限度額が低い',
      criteria: '事業計画の実現性・代表者面談重視' },
    { id: 'jfc_new', name: '日本政策金融公庫（新創業融資）', type: '政府系', icon: '🏛️',
      minRating: '-', loanRange: '〜3000万', rate: '2.0〜3.5%', term: '〜7年',
      strength: '創業2期未満でも融資可能・無担保無保証', weakness: '自己資金1/10以上必要',
      criteria: '創業計画書の完成度・自己資金・経験' },
    { id: 'jfc_keiei', name: '日本政策金融公庫（経営力強化資金）', type: '政府系', icon: '🏛️',
      minRating: 'D+', loanRange: '〜7200万', rate: '1.0〜2.0%', term: '〜20年',
      strength: '認定支援機関経由で金利優遇', weakness: '認定支援機関の関与必須',
      criteria: '経営改善計画・認定支援機関の推薦' },
    { id: 'cgc', name: '信用保証協会（一般枠）', type: '保証協会', icon: '🛡️',
      minRating: 'D', loanRange: '〜2.8億(無担保8000万)', rate: '金融機関による+保証料0.5〜2.0%', term: '〜10年',
      strength: '銀行の保全80%で審査が通りやすい', weakness: '保証料が加算される',
      criteria: 'CRDスコア・税金完納が絶対条件' },
    { id: 'cgc_safety4', name: 'セーフティネット4号', type: '保証協会', icon: '🛡️',
      minRating: 'D', loanRange: '別枠2.8億', rate: '金融機関による+保証料0.7〜1.0%', term: '〜10年',
      strength: '100%保証・通常枠とは別枠', weakness: '自然災害等の認定が必要',
      criteria: '市区町村の認定書・売上減少の証明' },
    { id: 'cgc_safety5', name: 'セーフティネット5号', type: '保証協会', icon: '🛡️',
      minRating: 'D', loanRange: '別枠2.8億', rate: '金融機関による+保証料0.7〜1.0%', term: '〜10年',
      strength: '80%保証・業況悪化業種向け', weakness: '指定業種に限定',
      criteria: '3ヶ月以上の売上5%以上減少' },
    { id: 'seido', name: '制度融資（自治体連携）', type: '制度融資', icon: '🏫',
      minRating: 'D', loanRange: '自治体により異なる', rate: '0.1〜2.0%(利子補給あり)', term: '〜10年',
      strength: '実質無利息も。保証料補助あり', weakness: '手続きが煩雑・時間がかかる',
      criteria: '自治体の要件（所在地・業種・規模等）' },
  ],

  // 一覧表示
  show() {
    const dna = Database.loadCompanyData() || {};
    const rating = dna.autoRating || '-';

    let html = `<div class="glass-card highlight" style="max-width:900px;margin:0 auto;">
      <div class="report-title">🏦 金融機関データベース</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        現在の格付け: <strong style="color:var(--primary-light);">${rating}</strong>　※格付けに基づく申込適格性を表示
      </div>

      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="BankDatabase.filter('all')">全て</button>
        <button class="btn btn-secondary btn-sm" onclick="BankDatabase.filter('メガバンク')">メガバンク</button>
        <button class="btn btn-secondary btn-sm" onclick="BankDatabase.filter('地方銀行')">地銀</button>
        <button class="btn btn-secondary btn-sm" onclick="BankDatabase.filter('信用金庫')">信金</button>
        <button class="btn btn-secondary btn-sm" onclick="BankDatabase.filter('政府系')">公庫</button>
        <button class="btn btn-secondary btn-sm" onclick="BankDatabase.filter('保証協会')">保証協会</button>
        <button class="btn btn-secondary btn-sm" onclick="BankDatabase.filter('制度融資')">制度融資</button>
      </div>

      <div id="bankDbList">${this._renderList(this.banks, rating)}</div>
    </div>`;
    App.addSystemMessage(html);
  },

  filter(type) {
    const dna = Database.loadCompanyData() || {};
    const rating = dna.autoRating || '-';
    const filtered = type === 'all' ? this.banks : this.banks.filter(b => b.type === type);
    const el = document.getElementById('bankDbList');
    if (el) el.innerHTML = this._renderList(filtered, rating);
  },

  _renderList(banks, rating) {
    return banks.map(b => {
      const eligible = this._checkEligible(b.minRating, rating);
      const badge = eligible === 'ok' ? '✅ 申込可能' : eligible === 'maybe' ? '🟡 条件付き' : '🔴 困難';
      const badgeColor = eligible === 'ok' ? 'var(--accent-green)' : eligible === 'maybe' ? 'var(--accent-gold)' : 'var(--accent-red)';
      return `<div class="glass-card" style="padding:14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:14px;font-weight:700;">${b.icon} ${b.name} <span style="font-size:11px;color:var(--text-muted);">${b.type}</span></div>
          <span style="font-size:11px;color:${badgeColor};font-weight:600;">${badge}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:8px;font-size:11px;">
          <div><span style="color:var(--text-muted);">融資額</span><br>${b.loanRange}</div>
          <div><span style="color:var(--text-muted);">金利</span><br>${b.rate}</div>
          <div><span style="color:var(--text-muted);">期間</span><br>${b.term}</div>
          <div><span style="color:var(--text-muted);">必要格付</span><br>${b.minRating}</div>
        </div>
        <div style="margin-top:6px;font-size:11px;">
          <span style="color:var(--accent-green);">◎ ${b.strength}</span><br>
          <span style="color:var(--accent-red);">△ ${b.weakness}</span>
        </div>
        <div style="margin-top:4px;font-size:10px;color:var(--text-muted);">📋 ${b.criteria}</div>
      </div>`;
    }).join('');
  },

  _checkEligible(minRating, currentRating) {
    if (minRating === '-') return 'ok';
    const order = ['S','A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','E'];
    const ci = order.indexOf(currentRating);
    const mi = order.indexOf(minRating);
    if (ci === -1) return 'maybe';
    if (ci <= mi) return 'ok';
    if (ci <= mi + 2) return 'maybe';
    return 'ng';
  },
};
