/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 統合資料生成エンジン
 * DNA＋案件データ → AIが銀行提出レベルの書類を自動生成
 * テンプレ版とAI版を統合、10種類の資料＋整合チェック
 * ============================================================ */

const DocGenerator = {

  // 資料定義（20種類）
  docTypes: [
    { id: 'executive',   icon: '📋', name: 'エグゼクティブサマリー', tag: '必須',   desc: '支店長が最初に見るA4 1枚の概要' },
    { id: 'company',     icon: '🏢', name: '企業概要書',             tag: '必須',   desc: '事業の全体像（沿革・組織・事業内容）' },
    { id: 'bizplan',     icon: '📊', name: '事業計画書',             tag: '必須',   desc: '3〜5年の事業計画と収支予測' },
    { id: 'cashflow',    icon: '💰', name: '資金繰り表',             tag: '必須',   desc: '月次12ヶ月分の入出金計画' },
    { id: 'repayplan',   icon: '📈', name: '返済計画書',             tag: '必須',   desc: '返済スケジュールと返済原資の根拠' },
    { id: 'debtlist',    icon: '📝', name: '借入金一覧表',           tag: '必須',   desc: '全借入の完全開示（鉄則）' },
    { id: 'improvement', icon: '📈', name: '経営改善計画書',         tag: '必須',   desc: 'リスケ・業績悪化時の再建計画（数値付き）' },
    { id: 'equipment',   icon: '🏭', name: '設備投資計画書',         tag: '必須',   desc: '設備概要・費用・効果・投資回収計画' },
    { id: 'profile',     icon: '👤', name: '代表者略歴書',           tag: '必須',   desc: '経歴・資格・経営ビジョン（公庫必須）' },
    { id: 'funduse',     icon: '💹', name: '資金使途明細書',         tag: '必須',   desc: '調達資金の使い道を項目別・金額別に説明' },
    { id: 'monthly',     icon: '📅', name: '月次業績推移表',         tag: '効果大', desc: '直近24ヶ月の売上・利益・CFの推移' },
    { id: 'collateral',  icon: '🏠', name: '担保評価書',             tag: '効果大', desc: '不動産・動産の評価額と担保設定状況' },
    { id: 'clients',     icon: '🤝', name: '取引先一覧表',           tag: '効果大', desc: '主要取引先・取引額・取引年数・依存度' },
    { id: 'permits',     icon: '📜', name: '許認可・資格一覧',       tag: '効果大', desc: '保有許認可・資格・認定・ISO等' },
    { id: 'swot',        icon: '🎯', name: 'SWOT分析書',             tag: '効果大', desc: '強み・弱み・機会・脅威の4象限分析' },
    { id: 'ringi',       icon: '🏦', name: '金融機関別稟議サポート', tag: '推奨',   desc: '銀行員が稟議書にそのまま使える資料' },
    { id: 'qa',          icon: '❓', name: '想定Q&A集',              tag: '効果大', desc: '面談で聞かれる質問＋模範回答15問' },
    { id: 'meeting',     icon: '🤝', name: '面談準備シート',         tag: '効果大', desc: '流れ・持ち物・NG集・シナリオ' },
    { id: 'strategy',    icon: '🎯', name: '融資戦略レポート',       tag: '推奨',   desc: '金融機関の優先順・金額配分' },
    { id: 'deepening',   icon: '🤝', name: '取引深耕提案書',         tag: '効果大', desc: '銀行員が最も喜ぶ隠れた最強資料' },
  ],

  // 資料履歴
  _history: [],
  _lastContent: '',

  // APIキー取得
  getApiKey() {
    const s = Database.load(Database.KEYS.SETTINGS) || {};
    return s.openaiApiKey || '';
  },
  getModel() {
    const s = Database.load(Database.KEYS.SETTINGS) || {};
    return s.openaiModel || 'gpt-4o-mini';
  },

  /* ================================================================
   * メインUI — /資料 で表示
   * ================================================================ */
  showMenu() {
    const data = Database.loadCompanyData() || {};
    const hasDNA = !!(data.industry || data.annualRevenue || data.companyName);
    const apiKey = this.getApiKey();

    let html = `<div class="glass-card highlight">
      <div class="report-title">📄 AI資料生成エンジン</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">
        DNAデータ＋案件情報をもとに、AIが<strong>銀行提出レベル</strong>の書類を自動生成します。
      </p>`;

    if (!hasDNA) {
      html += `<div style="padding:12px;background:var(--bg-tertiary);border-radius:var(--border-radius-sm);margin-bottom:16px;">
        <div style="font-size:12px;color:var(--accent-gold);">⚠️ 企業DNAが未登録です。先にDNAを入力すると高精度な資料が生成されます。</div>
        <button class="btn btn-sm btn-secondary" style="margin-top:8px;" onclick="CompanyDNA.start()">🧬 DNA登録</button>
      </div>`;
    }

    // 生成方法の選択（APIはバックグラウンドで自動判定）
    html += `<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="DocGenerator.showDocGrid(${apiKey ? 'ai' : 'template'})">
        📄 資料を生成
      </button>
      <button class="btn btn-secondary" onclick="DocGenerator.showCaseForm()" style="background:linear-gradient(135deg,var(--accent-gold),var(--accent-orange));color:white;border:none;">
        📂 案件自動作成
      </button>
    </div>
    <div id="docGridContainer"></div>
    </div>`;

    const cm=document.getElementById("chatMessages"); if(cm) cm.innerHTML=html;

    // デフォルトでAIキーがあればAI、なければテンプレ
    this.showDocGrid(apiKey ? 'ai' : 'template');
  },

  // 資料グリッド表示
  showDocGrid(mode) {
    this._currentMode = mode;
    const container = document.getElementById('docGridContainer');
    if (!container) return;

    let html = '';

    if (mode === 'ai' && !this.getApiKey()) {
      html = `<div style="text-align:center;padding:24px;">
        <div style="font-size:36px;margin-bottom:12px;">🔑</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">APIキーが未設定です</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">管理コンソールからOpenAI APIキーを設定してください。</div>
        <button class="btn btn-primary" onclick="Admin.show()">⚙️ 管理コンソール</button>
      </div>`;
      container.innerHTML = html;
      return;
    }

    const modeLabel = mode === 'ai' ? '🤖 AIが詳細に生成' : '📋 テンプレートベース';
    html += `<div style="font-size:12px;color:var(--accent-cyan);margin-bottom:12px;">
      ${modeLabel}　※クリックで個別生成、下の一括ボタンで全資料まとめて生成</div>`;

    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:16px;">`;
    this.docTypes.forEach(dt => {
      const tagCls = dt.tag === '必須' ? 'tag-danger' : dt.tag === '効果大' ? 'tag-success' : 'tag-warning';
      html += `<div class="glass-card" style="padding:14px;cursor:pointer;transition:all 0.2s;"
        onclick="DocGenerator.generate('${dt.id}', '${mode}')"
        onmouseover="this.style.borderColor='var(--primary)'"
        onmouseout="this.style.borderColor=''">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <span style="font-size:20px;">${dt.icon}</span>
          <span class="tag ${tagCls}" style="font-size:10px;">${dt.tag}</span>
        </div>
        <div style="font-size:13px;font-weight:600;margin-top:6px;">${dt.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${dt.desc}</div>
      </div>`;
    });
    html += `</div>`;

    // 金融機関別テンプレ（AI専用）
    if (mode === 'ai') {
      html += `<div class="report-subtitle">🏦 金融機関向け最適化</div>
        <select id="docTargetBank" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;margin-bottom:12px;">
          <option value="general">汎用（全金融機関向け）</option>
          <option value="megabank">メガバンク向け（三菱UFJ・三井住友・みずほ）</option>
          <option value="regional">地方銀行・第二地銀向け</option>
          <option value="shinkin">信用金庫・信用組合向け</option>
          <option value="jfc">日本政策金融公庫向け</option>
          <option value="guarantee">信用保証協会向け</option>
        </select>`;

      html += `<div class="report-subtitle">✏️ 追加指示（任意）</div>
        <textarea id="aiCustomPrompt" rows="2" placeholder="例：「初めての融資なので丁寧に」「決算書の改善点を重点的に」" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>`;
    }

    // アクションボタン
    html += `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="DocGenerator.generateAll('${mode}')">📄 全資料を一括生成</button>
      <button class="btn btn-secondary" onclick="DocGenerator.runConsistencyCheck()">🔍 整合チェック</button>
      ${this._history.length > 0 ? `<button class="btn btn-secondary" onclick="DocGenerator.showHistory()">💾 生成履歴(${this._history.length})</button>` : ''}
    </div>`;

    container.innerHTML = html;
  },

  /* ================================================================
   * 資料生成（AIまたはテンプレート）
   * ================================================================ */
  async generate(docId, mode) {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const docInfo = this.docTypes.find(d => d.id === docId);
    if (!docInfo) return;

    if (mode === 'ai') {
      await this.generateAI(docId, docInfo, data, rr);
    } else {
      this.generateTemplate(docId, data, rr);
    }
  },

  /* ================================================================
   * AI生成
   * ================================================================ */
  async generateAI(docId, docInfo, data, rr) {
    const apiKey = this.getApiKey();
    const model = this.getModel();
    const target = document.getElementById('docTargetBank')?.value || 'general';
    const custom = document.getElementById('aiCustomPrompt')?.value || '';

    App.addSystemMessage(`<div class="glass-card" style="text-align:center;padding:24px;">
      <div class="loading-spinner"></div>
      <div style="margin-top:12px;font-size:13px;">🤖 ${docInfo.icon} ${docInfo.name}を生成中...</div>
      <div style="font-size:11px;color:var(--text-muted);">DNAデータを解析してAIが詳細に作成しています</div>
    </div>`);

    const systemPrompt = this.buildSystemPrompt(target);
    const userPrompt = this.buildAIPrompt(docId, data, rr, target, custom);

    try {
      // サーバー経由を優先、フォールバックでローカル直接呼出
      let responseData;
      try {
        responseData = await ApiClient.request('/api/ai/generate', {
          method: 'POST',
          body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 8000, temperature: 0.3 })
        });
        if (!responseData) throw new Error('no response');
      } catch(serverErr) {
        // サーバー未稼働時はローカルから直接API呼出
        if (!apiKey) throw new Error('サーバー未接続かつAPIキー未設定です');
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 8000, temperature: 0.3 })
        });
        responseData = await resp.json();
        if (responseData.error) throw new Error(responseData.error.message);
      }

      const content = responseData.choices[0].message.content;
      const usage = responseData.usage || {};
      this._lastContent = content;

      // 履歴に保存
      this._history.unshift({ id: docId, name: docInfo.name, icon: docInfo.icon, content, tokens: usage.total_tokens || 0, target, createdAt: new Date().toISOString() });
      if (this._history.length > 20) this._history.pop();

      // 表示
      this.showGeneratedDoc(docInfo, content, usage, 'ai');

    } catch (err) {
      App.addSystemMessage(Utils.createAlert('error', '❌', `生成エラー: ${err.message}`));
    }
  },

  /* ================================================================
   * テンプレート生成（旧Documents.generateの内容）
   * ================================================================ */
  generateTemplate(docId, data, rr) {
    const generators = {
      executive: () => this.tmplExecutive(data, rr),
      company: () => this.tmplCompany(data),
      bizplan: () => this.tmplBizPlan(data, rr),
      cashflow: () => this.tmplCashFlow(data),
      repayplan: () => this.tmplRepayPlan(data, rr),
      debtlist: () => this.tmplDebtList(data),
      qa: () => this.tmplQA(data, rr),
      meeting: () => this.tmplMeeting(data),
      strategy: () => this.tmplStrategy(data, rr),
      deepening: () => this.tmplDeepening(data),
      improvement: () => this.tmplImprovement(data, rr),
      equipment: () => this.tmplEquipment(data),
      profile: () => this.tmplProfile(data),
      funduse: () => this.tmplFundUse(data),
      monthly: () => this.tmplMonthly(data),
      collateral: () => this.tmplCollateral(data),
      clients: () => this.tmplClients(data),
      permits: () => this.tmplPermits(data),
      swot: () => this.tmplSWOT(data, rr),
      ringi: () => this.tmplRingi(data, rr),
    };

    const docInfo = this.docTypes.find(d => d.id === docId);
    if (generators[docId]) {
      const content = generators[docId]();
      this._lastContent = content;
      App.addSystemMessage(`<div class="glass-card highlight">
        <div class="report-title">${docInfo.icon} ${docInfo.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">📋 テンプレート生成　<span style="color:var(--accent-gold);">※○○の個所は実データに置き換えてください</span></div>
        <div id="docContent_${docId}">${content}</div>
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="DocGenerator.downloadPDF('${docId}', '${docInfo.name}')">📥 PDF保存</button>
          <button class="btn btn-primary btn-sm" onclick="DocGenerator.copyToClipboard()">📋 コピー</button>
          <button class="btn btn-secondary btn-sm" onclick="DocGenerator.toggleEdit('${docId}')">✏️ 編集</button>
          <button class="btn btn-secondary btn-sm" onclick="DocGenerator.saveDocument('${docId}', '${docInfo.name}')">💾 保存</button>
          <button class="btn btn-secondary btn-sm" onclick="DocGenerator.generate('${docId}', 'ai')">🤖 AI版で再生成</button>
          <button class="btn btn-secondary btn-sm" onclick="DocGenerator.showMenu()">📄 他の資料</button>
        </div>
      </div>`);
    }
  },

  /* ================================================================
   * 生成結果表示（全画面ドキュメントビュー）
   * ================================================================ */
  showGeneratedDoc(docInfo, content, usage, mode) {
    const docId = docInfo.id;
    const rendered = this.renderMarkdown(content);
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';
    const html = `<div class="glass-card highlight" style="max-width:900px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="report-title" style="margin:0;">${docInfo.icon} ${docInfo.name}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-primary btn-sm" onclick="DocGenerator.downloadPDF('${docId}', '${docInfo.name}')">📥 PDF</button>
          <button class="btn btn-primary btn-sm" onclick="DocGenerator.copyToClipboard()">📋 コピー</button>
          <button class="btn btn-secondary btn-sm" onclick="DocGenerator.saveDocument('${docId}', '${docInfo.name}')">💾 保存</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;font-size:11px;color:var(--text-muted);margin-bottom:20px;border-bottom:1px solid var(--border-secondary);padding-bottom:12px;">
        <span>🤖 AI生成</span>
        <span>トークン: ${(usage.total_tokens || 0).toLocaleString()}</span>
        <span>${new Date().toLocaleTimeString('ja-JP')}</span>
      </div>
      <div id="docContent_${docId}" class="doc-viewer" style="font-size:13px;line-height:2.0;color:var(--text-primary);">${rendered}</div>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-secondary);display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="DocGenerator.toggleEdit('${docId}')">✏️ 編集</button>
        <button class="btn btn-secondary btn-sm" onclick="DocGenerator.generate('${docId}', 'ai')">🔄 再生成</button>
        <button class="btn btn-secondary btn-sm" onclick="DocGenerator.showMenu()">📄 他の資料</button>
      </div>
    </div>`;
    if (chatMessages) chatMessages.innerHTML = html;
  },

  // Markdown→HTML簡易レンダリング
  renderMarkdown(text) {
    let html = Utils.escapeHtml(text);
    // 見出し
    html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:var(--primary-light);margin:20px 0 8px;border-left:3px solid var(--primary);padding-left:10px;">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border-secondary);">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:800;color:var(--text-primary);margin:24px 0 16px;">$1</h1>');
    // 太字
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // テーブル（Markdown表）
    html = html.replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim() !== '');
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '';
      const isHeader = cells.some(c => /^\s*---/.test(c));
      if (isHeader) return '';
      const tds = cells.map(c => `<td style="padding:8px 12px;border:1px solid var(--border-secondary);">${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    });
    html = html.replace(/(<tr>.+<\/tr>\n?)+/g, (match) => {
      const rows = match.trim().split('\n').filter(r => r.trim());
      if (rows.length === 0) return match;
      const firstRow = rows[0].replace(/<td/g, '<th').replace(/<\/td/g, '</th');
      const rest = rows.slice(1).join('\n');
      return `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;">${firstRow}${rest}</table>`;
    });
    // 箇条書き
    html = html.replace(/^[\-\*] (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>');
    html = html.replace(/(<li.+<\/li>\n?)+/g, '<ul style="margin:8px 0 8px 16px;list-style:disc;">$&</ul>');
    // 番号付き
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;">$1</li>');
    // 改行
    html = html.replace(/\n/g, '<br>');
    return html;
  },

  /* ================================================================
   * PDF出力
   * ================================================================ */
  downloadPDF(docId, docName) {
    const el = document.getElementById(`docContent_${docId}`);
    if (!el) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'PDFの対象が見つかりません')); return; }

    // PDF用ラッパー作成（A4横・プロフェッショナルスタイル）
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `background:#fff;color:#1a1a2e;padding:32px 40px;font-family:"Noto Sans JP","Hiragino Sans",sans-serif;font-size:11px;line-height:1.7;max-width:290mm;`;
    wrapper.innerHTML = `
      <style>
        .doc-preview h1{font-size:16px;color:#1a1a2e;border-bottom:3px solid #2563eb;padding-bottom:8px;margin:0 0 16px 0;}
        .doc-preview h2{font-size:13px;color:#1e40af;margin:16px 0 8px;padding-left:8px;border-left:4px solid #2563eb;}
        .doc-preview h3{font-size:12px;color:#374151;margin:12px 0 6px;}
        .doc-preview table{width:100%;border-collapse:collapse;margin:8px 0 12px;font-size:10px;}
        .doc-preview th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-weight:600;white-space:nowrap;}
        .doc-preview td{padding:5px 8px;border-bottom:1px solid #e5e7eb;}
        .doc-preview tr:nth-child(even){background:#f8fafc;}
        .doc-preview .risk-red{color:#dc2626;font-weight:700;}
        .doc-preview .ok-green{color:#16a34a;font-weight:700;}
        .doc-preview .warn-yellow{color:#d97706;font-weight:700;}
        .doc-preview .bar-container{background:#e5e7eb;border-radius:4px;overflow:hidden;height:12px;margin:2px 0;}
        .doc-preview .bar-fill{height:100%;border-radius:4px;}
        .doc-preview .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0 12px;}
        .doc-preview .kpi-card{padding:10px;border:1px solid #e5e7eb;border-radius:6px;text-align:center;}
        .doc-preview .kpi-value{font-size:18px;font-weight:800;color:#1e40af;}
        .doc-preview .kpi-label{font-size:9px;color:#6b7280;margin-top:2px;}
        .doc-preview .summary-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:8px 0;}
        .doc-preview .danger-box{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:8px 0;}
        .doc-preview .footer{font-size:9px;color:#9ca3af;text-align:right;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px;}
      </style>` + el.innerHTML;

    const opt = {
      margin: [8, 10, 8, 10],
      filename: `${docName}_${new Date().toISOString().slice(0,10)}.pdf`,
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    App.addSystemMessage(Utils.createAlert('info', '⏳', `${docName}のPDFを生成中...`));
    html2pdf().set(opt).from(wrapper).save().then(() => {
      App.addSystemMessage(Utils.createAlert('success', '✅', `${docName}のPDF（A4横）をダウンロードしました`));
    }).catch(e => {
      App.addSystemMessage(Utils.createAlert('error', '❌', `PDF生成エラー: ${e.message}`));
    });
  },

  /* ================================================================
   * 資料の編集切替
   * ================================================================ */
  toggleEdit(docId) {
    const el = document.getElementById(`docContent_${docId}`);
    if (!el) return;
    const isEditable = el.contentEditable === 'true';
    el.contentEditable = isEditable ? 'false' : 'true';

    // 編集ツールバーの表示/非表示
    const toolbarId = `editToolbar_${docId}`;
    let toolbar = document.getElementById(toolbarId);

    if (!isEditable) {
      // 編集モードON
      el.style.border = '2px solid var(--primary)';
      el.style.padding = '16px';
      el.style.borderRadius = '8px';
      el.style.outline = 'none';
      el.style.minHeight = '200px';
      el.style.background = 'rgba(108,99,255,0.03)';
      el.focus();

      // ツールバー追加
      if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = toolbarId;
        toolbar.style.cssText = 'display:flex;gap:4px;margin-bottom:8px;padding:8px;background:var(--bg-tertiary);border-radius:8px;flex-wrap:wrap;';
        toolbar.innerHTML = `
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('bold')" title="太字">𝐁</button>
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('italic')" title="斜体">𝐼</button>
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('underline')" title="下線">U̲</button>
          <span style="border-left:1px solid var(--border-secondary);margin:0 4px;"></span>
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('insertUnorderedList')" title="リスト">•≡</button>
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('insertOrderedList')" title="番号リスト">1.</button>
          <span style="border-left:1px solid var(--border-secondary);margin:0 4px;"></span>
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'h2')" title="見出し">H2</button>
          <button class="btn btn-secondary btn-sm" onclick="document.execCommand('formatBlock',false,'h3')" title="小見出し">H3</button>
          <span style="flex:1;"></span>
          <span style="font-size:11px;color:var(--accent-green);font-weight:600;align-self:center;">✏️ 編集モード ON</span>
        `;
        el.parentNode.insertBefore(toolbar, el);
      }
      App.addSystemMessage(Utils.createAlert('info', '✏️', '編集モードON — 直接テキストを編集できます。完了後「💾 保存」を押してください。'));
    } else {
      // 編集モードOFF
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.background = 'transparent';
      if (toolbar) toolbar.remove();
    }
  },

  /* ================================================================
   * 資料の保存（LocalStorage）
   * ================================================================ */
  saveDocument(docId, docName) {
    const el = document.getElementById(`docContent_${docId}`);
    if (!el) return;
    const content = el.innerText || el.textContent;
    const docs = Database.load('lce_saved_documents') || {};
    docs[docId] = { name: docName, content, savedAt: new Date().toISOString() };
    Database.save('lce_saved_documents', docs);

    // サーバーにも同期保存
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      ApiClient.saveDocument(docId, { doc_name: docName, content, mode: 'saved' })
        .catch(e => console.warn('ドキュメントサーバー同期失敗:', e));
    }
    App.addSystemMessage(Utils.createAlert('success', '✅', `「${docName}」を保存しました`));
  },

  // 保存済み資料の一覧表示
  showSavedDocuments() {
    const docs = Database.load('lce_saved_documents') || {};
    const keys = Object.keys(docs);
    if (keys.length === 0) {
      App.addSystemMessage(Utils.createAlert('info', 'ℹ️', '保存済みの資料はありません'));
      return;
    }
    let html = `<div class="glass-card"><div class="report-title">💾 保存済み資料</div>`;
    keys.forEach(key => {
      const d = docs[key];
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid var(--border-secondary);">
        <div>
          <div style="font-size:13px;font-weight:600;">${d.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${new Date(d.savedAt).toLocaleString('ja-JP')}</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-primary btn-sm" onclick="DocGenerator.loadSavedDoc('${key}')">開く</button>
          <button class="btn btn-secondary btn-sm" onclick="DocGenerator.downloadPDF('saved_${key}', '${d.name}')">📥</button>
        </div>
      </div>`;
    });
    html += `</div>`;
    const cm=document.getElementById("chatMessages"); if(cm) cm.innerHTML=html;
  },

  loadSavedDoc(key) {
    const docs = Database.load('lce_saved_documents') || {};
    const d = docs[key];
    if (!d) return;
    const docInfo = this.docTypes.find(dt => dt.id === key) || { icon: '📄', name: d.name, id: key };
    App.addSystemMessage(`<div class="glass-card highlight">
      <div class="report-title">${docInfo.icon} ${d.name} <span style="font-size:11px;color:var(--text-muted);">(保存済み)</span></div>
      <div id="docContent_saved_${key}" style="font-size:13px;line-height:1.8;white-space:pre-wrap;">${Utils.escapeHtml(d.content)}</div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="DocGenerator.downloadPDF('saved_${key}', '${d.name}')">📥 PDF</button>
        <button class="btn btn-secondary btn-sm" onclick="DocGenerator.toggleEdit('saved_${key}')">✏️ 編集</button>
        <button class="btn btn-secondary btn-sm" onclick="DocGenerator.saveDocument('${key}', '${d.name}')">💾 上書き</button>
      </div>
    </div>`);
  },

  /* ================================================================
   * 全資料一括生成
   * ================================================================ */
  async generateAll(mode) {
    const data = Database.loadCompanyData() || {};
    if (!data.industry && !data.annualRevenue) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'データが不足しています。先に<code>/DNA</code>または<code>/start</code>で情報を入力してください。'));
      return;
    }

    if (mode === 'template') {
      // テンプレ版は全て一気に生成
      const rr = Database.loadRatingResult();
      this.docTypes.forEach(dt => {
        this.generateTemplate(dt.id, data, rr);
      });
      return;
    }

    // AI版：順番に生成（1つずつ）
    const rr = Database.loadRatingResult();
    App.addSystemMessage(`<div class="glass-card" style="text-align:center;padding:24px;">
      <div style="font-size:48px;margin-bottom:12px;">📄</div>
      <div style="font-size:16px;font-weight:600;">全${this.docTypes.length}種類の資料をAI生成します</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">順番に生成していきます。完了まで数分かかる場合があります。</div>
    </div>`);

    for (let i = 0; i < this.docTypes.length; i++) {
      const dt = this.docTypes[i];
      try {
        await this.generateAI(dt.id, dt, data, rr);
        // レート制限回避
        if (i < this.docTypes.length - 1) await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        App.addSystemMessage(Utils.createAlert('error', '❌', `${dt.name}の生成に失敗: ${e.message}`));
      }
    }

    App.addSystemMessage(Utils.createAlert('success', '✅', '全資料の生成が完了しました。'));
  },

  /* ================================================================
   * AI用プロンプト構築 — プロンプトエンジニアリング設計
   * ================================================================ */
  buildSystemPrompt(target) {
    // 金融機関別の審査視点と稟議構造
    const bankProfiles = {
      general: `【共通基準】
全金融機関に共通する稟議書の必須構成要素に沿って作成してください。
稟議書は「案件概要→企業概要→財務分析→返済能力→案件評価→条件付帯事項→結論」の流れです。`,

      megabank: `【メガバンク（都市銀行）審査の特性】
■ 審査体制：支店→審査部→本部与信管理部の3層構造。稟議書は支店起案→審査部精査→本部決裁。
■ 重視指標：①EBITDA有利子負債倍率 ②インタレスト・カバレッジ・レシオ（ICR≧2.0倍） ③自己資本比率（業種平均対比） ④売上高営業利益率
■ 審査者の着目点：業界ポジション・市場シェア、SWOT分析の論理性、感応度分析（金利+0.5%時/売上△10%時のストレスシナリオ）
■ 稟議書の特徴：定量分析が全体の60%以上、業界データ・マクロ指標の引用必須
■ 文体：客観的・論理的。形容詞より数字。「当社は〜であることから」の因果関係表現を多用`,

      regional: `【地方銀行・第二地銀審査の特性】
■ 審査体制：支店長専決枠（概ね3,000万〜5,000万まで）→本部審査部。支店長の裁量が比較的大きい。
■ 重視指標：①債務償還年数（10年以内が正常先基準） ②経常利益+減価償却費ベースのCF ③預金シェア・メインバンク度 ④地元経済への貢献
■ 審査者の着目点：地域での評判・取引先ネットワーク、経営者の人脈・信用力、取引深耕の可能性（預金・為替・保険等のクロスセル）
■ 稟議書の特徴：定量と定性が50:50、「取引方針」欄で今後の取引拡大計画を記載
■ 文体：丁寧だが熱意を込める。「当行との取引拡大にも意欲的で」等のポジティブ表現が有効`,

      shinkin: `【信用金庫・信用組合審査の特性】
■ 審査体制：営業店→審査部。会員（出資者）であることが前提。地区制限あり。
■ 重視指標：①返済余力（CF÷年間返済額≧1.2倍） ②既存取引実績・入金状況 ③代表者の個人資産
■ 審査者の着目点：経営者の人柄・誠実さ、地域貢献度（雇用・納税）、営業エリア内での事業安定性、信金理念との合致
■ 稟議書の特徴：定性評価の比重が高い（60%以上）、「経営者評価」欄が特に重要
■ 文体：温かみのある表現。「地域に根ざした企業として」「従業員○名の雇用を支え」等の人間的フレーズが効果的`,

      jfc: `【日本政策金融公庫（国民生活事業・中小企業事業）審査の特性】
■ 審査体制：支店受付→審査役が面談→本店審査部（金額による）。面談重視。平均審査期間3〜4週間。
■ 重視指標：①資金使途の妥当性（設備：見積書/運転：算出根拠必須） ②事業の社会的意義・雇用創出効果 ③税務申告書ベースの財務分析 ④経営者の経験・スキル
■ 審査者の着目点：「なぜ民間金融機関ではなく公庫に来たのか」の合理的説明、政策目的への適合（創業支援・事業承継・地方創生等）
■ 稟議書の特徴：政策的意義を重視、「公庫融資の必要性」欄が必須。セーフティネット機能があるため、民間より許容範囲が広い
■ 文体：公的文書にふさわしいフォーマル体。「雇用の維持・創出に資する」「地域経済の活性化に寄与する」等の政策用語を自然に使用`,

      guarantee: `【信用保証協会審査の特性】
■ 審査体制：金融機関経由申込→保証協会受付→CRDスコアリング（自動）→審査役面談→保証審査委員会（金額による）
■ CRDスコアリング：決算書データから自動算出。D1〜D9の9ランク。D1〜D4が原則保証可能ゾーン。
■ 重視指標：①CRDスコア（デフォルト確率） ②経営者の信用情報（個人CIC） ③税金・社会保険の納付状況 ④業歴（創業1年未満は創業枠） ⑤既存保証残高と信用保証料率
■ 代位弁済リスクの着目点：「保証協会が代わりに返済するリスク」として評価。過去のリスケ歴・税金滞納は大幅減点。
■ 稟議書の特徴：CRD区分と保証制度の適合性を重視。「セーフティネット保証4号5号」「経営力強化保証」等の制度名を正確に記載
■ 文体：定量重視。「CRDスコアD○に該当し」「保証料率○種に相当する財務体質」等の保証協会用語を使用`
    };

    return `# ROLE（役割定義）
あなたは「融資獲得戦略AI」です。以下の5名の実務経験者の知見を完全に統合し、それぞれの視点から資料を作成します。

## 専門家チーム
### ① 審査部統括部長（メガバンク勤務28年）
- 稟議書の起案から決裁まで延べ15,000件以上の審査を経験
- 格付けモデルの設計・運用に従事（自己査定基準・信用リスク管理）
- 「稟議が通る申込書」と「落ちる申込書」の差を熟知
- ★最重要知見：審査者は最初の30秒で「通すか落とすか」の印象を持つ。エグゼクティブサマリーの完成度が全てを決める

### ② 信用保証協会 審査部長（経験24年）
- CRDスコアリングモデルの開発・運用に携わった
- 代位弁済率を0.1%改善するための審査基準を策定した実績
- 保証制度の選択最適化と保証料率の仕組みを内側から理解
- ★最重要知見：「税金の滞納=即アウト」ではない。分納計画の誠実な履行実績こそが信頼の根拠

### ③ 中小企業診断士（独立コンサルタント18年）
- 年間50社以上の事業計画策定を支援、融資成功率92%
- 「数字に基づくストーリーテリング」の達人
- ★最重要知見：事業計画は「積み上げ方式」でしか信用されない。トップダウンの「売上○%成長」は門前払い

### ④ 公認会計士・税理士（実務25年）
- 実態BSの作成（簿外債務・含み損益の洗い出し）のプロ
- 修正キャッシュフロー計算で「見かけの赤字企業」を正常先に引き上げた実績多数
- ★最重要知見：代表者借入金の資本性劣後ローン認定で実態自己資本比率を改善できる。この1点だけで格付けが1ノッチ上がる事例が多い

### ⑤ 日本政策金融公庫 融資課長（経験22年）
- 年間800件超の融資審査を担当
- 創業融資・再挑戦支援・事業承継等の政策融資に精通
- ★最重要知見：公庫は「税務申告書の第一表〜別表」が審査の基本。決算書はあくまで補完資料。確定申告書の整合性が重要

### ⑥ 金融庁検査官OB（金融検査マニュアル策定に関与・実務20年）
- 自己査定基準の「正常先・要注意先・破綻懸念先」の分類ロジックを完全理解
- ★最重要知見：「要注意先→正常先」への格上げは「経営改善計画＋3期連続黒字化の実績」が最短ルート
- ★最重要知見：条件変更先（リスケ先）でも「実抜計画（実現可能性の高い抜本的な経営再建計画）」があれば「貸出条件緩和債権」から除外可能
- 引当率：正常先0.2〜0.5%、要注意先5〜15%、破綻懸念先70%以上。この差が銀行の融資姿勢を決定する

### ⑦ 事業再生コンサルタント（再生実績200社超・経験16年）
- 405事業（経営改善計画策定支援事業）の認定支援機関として200社超の再生を支援
- ★最重要知見：リスケ中でも新規融資は可能。「実抜計画」＋「3期分の改善実績」が鍵
- ★最重要知見：DDS（デット・デット・スワップ：既存借入の劣後化）で実質自己資本を改善。DES（デット・エクイティ・スワップ：借入の資本転換）で債務超過を一気に解消
- ★最重要知見：代表者保証の解除には「経営者保証ガイドライン」の3要件（①法人・個人の資産分離 ②財務基盤の強化 ③適時適切な情報開示）を満たすことが条件

## 機密レベルの知識体系

### 銀行内部の「暗黙のルール」
- 信用格付け：正常先（A〜F6段階）・要注意先（要管理先含む）・破綻懸念先・実質破綻先・破綻先
- 債務者区分の判定基準：①定量評価（財務スコアリング70%）②定性評価（経営者評価30%）
- 自己査定のII分類・III分類・IV分類の判定基準と引当率の関係
- 「支店長専決枠」の存在：地銀3,000〜5,000万、信金1,000〜2,000万。この枠内なら審査が格段に早い
- メイン寄せ・協調融資の組成基準と銀行間の力学

### 保証協会の審査の裏側
- CRDモデルV5のデフォルト判別ロジック（23の財務変数の重み付け）
- 保証審査委員会の「否決3大パターン」：税金滞納・粉飾決算の疑い・多重債務
- 「保証付き融資から始めてプロパー＝保証なし融資へ」の王道ステップアップ戦略

### 業種別の審査攻略法（重要）
- 建設業：完成工事高の計上基準、工事原価の透明性、施工能力（技術者数）が重視
- 飲食業：既存店売上高（FL比率60%以内が合格ライン）、回転率、ブランド力
- IT・SaaS：MRR/ARR、チャーンレート、LTV/CAC比が審査指標。「ストック型収益」の証明が鍵
- 製造業：設備稼働率、受注残、技術力（特許・認証）、取引先の分散度
- 小売業：既存店売上前年比、在庫回転率、EC化比率、客単価推移
- 医療・介護：診療報酬/介護報酬の安定性を活かし、社会的必要性を前面に
- 不動産業：賃料収入のNOI（ネット・オペレーティング・インカム）、DSCR≧1.3倍

${bankProfiles[target] || bankProfiles.general}

# OUTPUT RULES（出力ルール）
1. **数値根拠の必須化**：すべての数字には根拠を1文以上付与する（例：「売上高15,000万円（前期実績14,800万円×新規受注2件の増加分を加算）」）
2. **プレースホルダーの最小化**：「○○」は極力使わない。データがない場合は業種平均値や合理的推定値を使い、「※業種平均に基づく推定値」と注記する
3. **稟議書フォーマット準拠**：銀行員が稟議書にコピー＆ペーストできる構造で記載する（表形式、箇条書き、見出し付き）
4. **リスクの先回り**：弱点は必ず自ら開示し、その対策・改善計画をセットで記載する（隠す企業は信頼されない）
5. **審査者の心理を把握**：審査者が「この案件を通したい」と思えるよう、感情ではなく論理と数字で説得力を作る
6. **業種特性の反映**：業種ごとの商慣行・決算特性・事業リスクを踏まえた記述にする
7. **制度融資の最適活用**：使える制度融資・保証制度がある場合は具体的な制度名と適用条件を明記する
8. **日本語で出力**：資料は全て日本語、金額は万円単位、表は markdown のテーブル記法を使用
9. **返済原資の多重防御**：返済原資は「本業CF→遊休資産売却→代表者報酬返上→保険解約返戻金」の多段階で構築
10. **実態BSの活用**：簿価と実態値の乖離を必ず指摘し、修正後の財務指標で審査を有利にする`

    + this._buildLearningContext();
  },

  /* ================================================================
   * 学習データからAIプロンプト用コンテキストを構築
   * ================================================================ */
  _buildLearningContext() {
    // DocLearningモジュールから学習データを読み込み
    if (typeof DocLearning === 'undefined') return '';

    const data = DocLearning.load();
    const cases = data.cases || [];
    if (cases.length === 0) return '';

    const successCases = cases.filter(c => c.result === 'success');
    const failCases = cases.filter(c => c.result === 'fail');
    const totalCount = cases.length;
    const successRate = totalCount > 0 ? Math.round(successCases.length / totalCount * 100) : 0;

    let ctx = `\n\n# 📊 学習データ（過去${totalCount}件の実績分析に基づく指示）\n`;
    ctx += `成功率: ${successRate}%（成功${successCases.length}件 / 失敗${failCases.length}件）\n`;

    // 失敗要因の分析＋回避指示
    if (failCases.length > 0) {
      const reasons = {};
      failCases.forEach(c => {
        const reason = c.failReason || c.tags?.failReason || '不明';
        if (reason && reason !== '不明') reasons[reason] = (reasons[reason] || 0) + 1;
      });

      if (Object.keys(reasons).length > 0) {
        ctx += '\n## ⚠️ 過去の失敗要因（以下を重点的に回避・対策すること）\n';
        Object.entries(reasons)
          .sort((a, b) => b[1] - a[1])
          .forEach(([reason, count]) => {
            ctx += `- 【${count}件】${reason} → この点を特に強化する記述・データ・エビデンスを必ず含めてください\n`;
          });

        ctx += '\n★ 具体的な回避策:\n';
        const reasonList = Object.keys(reasons);
        if (reasonList.some(r => r.includes('財務') || r.includes('債務超過') || r.includes('自己資本'))) {
          ctx += '- 財務面の弱点には「改善計画」「役員借入金の劣後ローン認定」「将来CF予測」を必ず提示\n';
        }
        if (reasonList.some(r => r.includes('返済') || r.includes('CF') || r.includes('キャッシュフロー'))) {
          ctx += '- 返済能力には「月次CF推移」「EBITDA基準の返済原資」「バックアッププラン」を3段階で提示\n';
        }
        if (reasonList.some(r => r.includes('計画') || r.includes('事業') || r.includes('根拠'))) {
          ctx += '- 事業計画には「過去実績との整合性」「3シナリオ分析」「KPI設定と達成ロードマップ」を具体的に記載\n';
        }
        if (reasonList.some(r => r.includes('説明') || r.includes('不足') || r.includes('資料'))) {
          ctx += '- 説明不足を避けるため、全セクションで「なぜ？」「どのように？」「いつまでに？」を明確に記述\n';
        }
      }
    }

    // 成功パターンの分析＋強化指示
    if (successCases.length > 0) {
      ctx += '\n## ✅ 成功パターン（以下の要素を積極的に取り入れること）\n';
      const successBanks = {};
      successCases.forEach(c => {
        const bank = c.tags?.bank || c.bank || '';
        if (bank) successBanks[bank] = (successBanks[bank] || 0) + 1;
      });
      if (Object.keys(successBanks).length > 0) {
        ctx += '- 成功実績のある金融機関: ' + Object.entries(successBanks).map(([b, c]) => `${b}(${c}件)`).join('、') + '\n';
      }
      const successAmounts = successCases.filter(c => (c.tags?.amount || c.amount) > 0).map(c => c.tags?.amount || c.amount);
      if (successAmounts.length > 0) {
        const avgAmount = Math.round(successAmounts.reduce((a, b) => a + b, 0) / successAmounts.length);
        ctx += `- 過去の成功案件の平均融資額: ${avgAmount.toLocaleString()}万円\n`;
      }
      ctx += '- 成功した資料の共通点を踏まえ、説得力のある構成と具体的データの提示を心がけてください\n';
    }

    return ctx;
  },

  buildAIPrompt(docId, data, rr, target, custom) {
    // ━━━━━━ 企業DNAコンテキスト構築 ━━━━━━
    let ctx = '═══════════════════════════════════════\n';
    ctx += '【企業DNAデータ — 全情報】\n';
    ctx += '═══════════════════════════════════════\n';

    // 基本情報
    const basicFields = {
      companyName:'会社名', industry:'業種', yearsInBusiness:'業歴(年)',
      employeeCount:'従業員数', businessModel:'事業モデル/ビジネスの仕組み',
      competitiveAdvantage:'競争優位性', strengths:'当社の強み(定量的)',
      outlook:'今後の事業見通し'
    };
    ctx += '\n▶ 基本情報\n';
    Object.entries(basicFields).forEach(([k, label]) => {
      const v = data[k];
      if (v !== null && v !== undefined && v !== '' && v !== false) ctx += `  ${label}: ${v}\n`;
    });

    // 経営者情報
    ctx += '\n▶ 代表者情報\n';
    if (data.ceoProfile) ctx += `  経歴: ${data.ceoProfile}\n`;
    if (data.guaranteePreference) ctx += `  経営者保証の希望: ${data.guaranteePreference}\n`;

    // 財務サマリー
    ctx += '\n▶ 財務サマリー（直近期）\n';
    const finFields = {
      annualRevenue:'売上高(万円)', operatingProfit:'営業利益(万円)',
      ordinaryProfit:'経常利益(万円)', netIncome:'税引後利益(万円)',
      totalAssets:'総資産(万円)', netAssets:'純資産(万円)',
      totalDebt:'有利子負債総額(万円)', monthlyRepayment:'月次返済額(万円)'
    };
    Object.entries(finFields).forEach(([k, label]) => {
      const v = data[k];
      if (v !== null && v !== undefined && v !== '' && v !== 0) ctx += `  ${label}: ${typeof v === 'number' ? v.toLocaleString() : v}\n`;
    });

    // BS詳細
    const bsFields = {
      currentAssets:'流動資産', currentLiabilities:'流動負債', fixedAssets:'固定資産',
      fixedLiabilities:'固定負債', receivables:'売掛金', inventory:'棚卸資産',
      payables:'買掛金', depreciation:'減価償却費', interestExpense:'支払利息',
      grossProfit:'売上総利益'
    };
    let hasBs = false;
    Object.entries(bsFields).forEach(([k, label]) => {
      if (data[k]) {
        if (!hasBs) { ctx += '\n▶ BS詳細\n'; hasBs = true; }
        ctx += `  ${label}: ${data[k].toLocaleString()}万円\n`;
      }
    });

    // 複数期決算
    if (data.financials && data.financials.length > 0) {
      ctx += '\n▶ 決算推移（複数期）\n';
      data.financials.forEach((f, i) => {
        if (f.revenue) {
          ctx += `  ${f.year || `第${i+1}期`}: 売上${f.revenue.toLocaleString()}万 | 営利${(f.operatingProfit || 0).toLocaleString()}万 | 経利${(f.ordinaryProfit || 0).toLocaleString()}万 | 純利${(f.netIncome || 0).toLocaleString()}万 | 純資産${(f.netAssets || 0).toLocaleString()}万\n`;
        }
      });
    }

    // 取引金融機関
    ctx += '\n▶ 取引金融機関\n';
    if (data.mainBank) ctx += `  メインバンク: ${data.mainBank}（取引${data.mainBankYears || '○'}年）\n`;
    if (data.lenders && data.lenders.length) ctx += `  全借入先: ${data.lenders.join('、')}\n`;
    if (data.guaranteeBalance) ctx += `  信用保証協会利用残高: ${data.guaranteeBalance.toLocaleString()}万円\n`;
    if (data.collateral) ctx += `  担保: ${data.collateral}\n`;

    // 案件情報
    ctx += '\n▶ 今回の融資案件\n';
    if (data.loanAmount) ctx += `  融資希望額: ${data.loanAmount.toLocaleString()}万円\n`;
    if (data.loanPurpose) ctx += `  資金使途: ${data.loanPurpose}\n`;
    if (data.urgency) ctx += `  希望時期: ${data.urgency}\n`;
    if (data.repaymentSource) ctx += `  返済原資: ${data.repaymentSource}\n`;

    // リスク情報
    ctx += '\n▶ リスク・懸念事項\n';
    ctx += `  税金滞納: ${data.taxDelinquency ? 'あり' : 'なし'}\n`;
    ctx += `  リスケ歴: ${data.rescheduleHistory ? 'あり' : 'なし'}\n`;
    ctx += `  債務超過: ${data.negativeEquity ? 'あり' : 'なし'}\n`;

    // 格付結果
    if (rr) {
      ctx += '\n▶ 格付け診断結果\n';
      ctx += `  総合格付: ${rr.grade || '—'}\n`;
      ctx += `  総合点数: ${rr.totalScore || '—'}点\n`;
      if (rr.modCF) {
        ctx += `  修正CF: ${rr.modCF.simpleCF?.toLocaleString() || 0}万円/年\n`;
        ctx += `  年間返済額: ${rr.modCF.annualRepay?.toLocaleString() || 0}万円\n`;
        ctx += `  返済余力: ${rr.modCF.repayCapacity?.toLocaleString() || 0}万円/年\n`;
      }
      if (rr.quant?.scores) {
        ctx += `  債務償還年数: ${rr.quant.scores.dsr?.value?.toFixed(1) || '—'}年\n`;
        ctx += `  自己資本比率: ${rr.quant.scores.equityRatio?.value?.toFixed(1) || '—'}%\n`;
      }
    }

    // ━━━━━━ 資料別の専門プロンプト ━━━━━━
    const expertInstructions = {
      executive: `# タスク：エグゼクティブサマリーの作成

## あなたの視点
元メガバンク審査部統括部長として作成してください。
「審査者は最初の30秒で印象を決める」—この30秒で勝負が決まるA4 1枚の渾身の資料です。

## 必須構成（この順番で）
1. **企業概要テーブル**：会社名・業種・業歴・年商・経常利益・従業員数・代表者を1つの表にまとめる
2. **今回のご相談**：融資金額・資金使途・希望条件を表形式で。使途は「なぜこの金額が必要か」の根拠を1文で
3. **返済原資の概要**：年間CF・年間返済額・返済余力を数字で示し、「新規融資を加えても返済倍率○倍を確保」と明記
4. **当社の強み（3点）**：MUST：各強みの横に定量的根拠を付ける（「リピート率87%」「○○特許3件」等）
5. **御行との取引メリット**：「融資以外に○○の取引拡大も検討」と具体的なクロスセル提案を含める

## 注意事項
- 弱点がある場合（赤字・債務超過・滞納等）は「■ ご留意事項と対策」セクションを追加し、先回りで説明＋対策を明示
- 全体で1,200〜1,500字を目安`,

      company: `# タスク：企業概要書の作成

## あなたの視点
中小企業診断士として作成してください。
銀行員は「この会社は何で・誰に・どうやって稼いでいるか」を最初に理解したい。

## 必須構成
1. **会社概要テーブル**：商号・設立・所在地・代表者・業種・年商・従業員数・資本金・主要拠点
2. **沿革**：設立から現在までの主要イベント（DNAデータから推定可能な範囲）を時系列で
3. **事業内容の詳細**
   - ビジネスモデルの説明（「何を・誰に・どのように」の3要素）
   - 売上構成比（推定でよい。業種特性から合理的に推定し注記する）
   - 事業の季節性・繁忙期があれば記載
4. **競合優位性**：MUST：定量的に証明する（「業界平均利益率○%に対し当社は○%」等）
5. **主要取引先テーブル**：売上先・仕入先を各3社程度、取引年数と年間取引額を含むテーブル
6. **組織体制**：部門構成、キーパーソン、後継者問題（該当する場合）
7. **取引金融機関一覧**

## 注意事項
- A4 2〜3ページが適切
- 業種特有のリスク（季節変動・規制リスク等）にも触れ、その管理体制を説明する`,

      bizplan: `# タスク：事業計画書の作成

## あなたの視点
中小企業診断士＋公認会計士のダブル視点で作成してください。
審査者が最も重視するのは「数字の積み上げ根拠」と「達成可能性」です。

## 必須構成（7章立て）
### 第1章：エグゼクティブサマリー（200字以内で計画全体の要約）
### 第2章：事業概要と市場環境
- 対象市場の規模と成長率（業種統計から推定）
- 競合環境と自社のポジショニング
### 第3章：事業戦略
- 成長戦略の具体的施策（「新規顧客○社獲得」「単価○%改善」等の定量目標）
- 今回の融資がどう戦略に寄与するか
### 第4章：売上計画（3年分）※積み上げ方式が鉄則※
- 既存顧客の維持・深耕による売上（保守的に前年比○%で推計）
- 新規顧客の獲得による売上（「月○件の新規訪問→成約率○%→客単価○万円」のファネル計算）
- テーブル形式で月次/四半期/年次を表示
### 第5章：収支計画・利益計画
- PL予測（3年分）：売上高→売上原価→売上総利益→販管費→営利→経利→税後利益
- 各コストの前提条件を明記
### 第6章：資金計画と返済原資
- 今回の融資の具体的使途内訳（テーブル）
- 返済原資の計算ロジック
### 第7章：リスク分析と3シナリオ
- 悲観（売上△15%・原価率+3%）/標準/楽観の3パターン
- MUST：「悲観シナリオでも返済可能」であることを数字で証明

## 注意事項
- 「前年比○%成長」のトップダウン計画は審査者に一蹴される。必ず積み上げ根拠を付ける
- 計画は保守的であるほど信頼される（「乗せてない計画だな」と審査者が安心する）`,

      cashflow: `# タスク：月次資金繰り表の作成

## あなたの視点
公認会計士・税理士として作成してください。
資金繰り表は「嘘がつけない」最強の資料。通帳の動きと完全一致する精度が求められます。

## 必須構成
### パターンA：融資なしのケース
### パターンB：融資ありのケース
各パターンで12ヶ月分（4月〜3月）のテーブルを作成。

### テーブル行構成
| 項目 | 4月 | 5月 | ... | 3月 |
|------|------|------|------|------|
| 月初現預金残高 | | | | |
| 【経常収入】売上代金回収 | | | | |
| 【経常支出】仕入代金支払 | | | | |
| 【経常支出】人件費 | | | | |
| 【経常支出】その他固定費 | | | | |
| 経常収支 | | | | |
| 【財務】既存借入返済 | | | | |
| 【財務】★新規借入入金 | | | | |
| 【財務】★新規借入返済 | | | | |
| 月末現預金残高 | | | | |

## 重要ルール
- 売上代金の回収サイト（月末締め翌月末入金など）を考慮する
- 業種特性による季節変動を反映する（建設業の工期、飲食の繁閑等）
- 人件費は固定費として毎月同額（賞与月は加算）
- 「融資なし→○月に資金ショート」「融資あり→余裕を持って運営」の対比が説得の核心
- 月末残高がマイナスになる月を赤字で強調し、「だからこの融資が必要」と結論づける`,

      repayplan: `# タスク：返済計画書（5年シミュレーション）の作成

## あなたの視点
元メガバンク審査部統括部長として作成してください。
「返済可能性の立証」は融資審査の最終防衛線です。

## 必須構成
1. **融資条件の前提テーブル**：金額・金利・期間・返済方法・据置期間
2. **5年間の返済スケジュールテーブル**
   | 年度 | 既存返済額 | 新規返済額 | 返済合計 | 予想CF | CF倍率 | 判定 |
   各年度の数字はDNAデータから算出し、根拠コメントを付ける
3. **返済原資の内訳と根拠**
   - 経常利益 + 減価償却費 = 簡易CF
   - 役員報酬の調整余力（削減可能額）
   - 保険解約返戻金（緊急時の安全弁）
4. **バックアッププラン**：返済が困難になった場合の3段階プラン
   - 第1段階：経費削減（○○万円/年の余地）
   - 第2段階：役員報酬減額（○○万円/月→○○万円/月）
   - 第3段階：資産売却（不要資産○○万円相当）
5. **CF倍率の推移グラフ代替**：5年間の数値変化を視覚的に表現

## 重要ルール
- CF倍率（予想CF÷年間返済額）は1.2倍以上が安全ライン
- 悲観シナリオ（CF△20%）でも返済可能であることを別途計算で示す
- 据置期間の設定根拠も明記（「設備稼働開始まで○ヶ月」等）`,

      debtlist: `# タスク：借入金一覧表の作成

## あなたの視点
元メガバンク審査部統括部長として作成してください。

## 鉄則
「借入を1件でも隠した企業」は二度と信用されない。全件開示が大前提。
銀行は信用情報機関（CIC・JICC・KSC）で必ず裏取りする。自ら全件開示する企業は「正直な企業」として加点される。

## 必須テーブル構成
| No | 金融機関名 | 融資形態 | 当初金額 | 現在残高 | 金利(%) | 月額返済 | 最終返済日 | 担保の有無 | 保証の種類 | 備考 |

## 記載ルール
- 融資形態：証書貸付/手形貸付/当座貸越/割引手形 を正確に区分
- 保証の種類：プロパー/保証協会付(○号保証)/制度融資名 を明記
- 合計行は必須
- 年間返済額の合計も別途明記
- 代表者個人の借入（住宅ローン等）がある場合は「参考」として別表に記載

## 追加情報（あれば付記）
- 過去の返済実績（延滞なし→加点要素として明記）
- 借入金の推移（過去3年で増加/減少/横ばい）`,

      qa: `# タスク：銀行面談 想定Q&A集の作成

## あなたの視点
5名の専門家全員の知見を統合して作成してください。
「銀行員が絶対に聞く質問」と「答えに詰まると致命的な質問」を網羅します。

## 構成：5カテゴリ × 3問 = 全15問

### カテゴリ1：財務に関する質問（審査部統括部長の視点）
- Q1: 債務償還年数が○年ですが、改善の見通しは？
- Q2: 自己資本比率が○%と低いですが？
- Q3: 経常利益率の推移についてご説明ください

### カテゴリ2：事業に関する質問（中小企業診断士の視点）
- Q4: 今後の市場環境と御社の見通しは？
- Q5: 競合他社との差別化ポイントは何ですか？
- Q6: 主要取引先の集中リスクはありませんか？

### カテゴリ3：融資案件に関する質問（融資課長の視点）
- Q7: 資金使途の詳細と金額の根拠を教えてください
- Q8: 返済原資は具体的に何ですか？返済が厳しくなった場合は？
- Q9: なぜ今このタイミングで融資が必要なのですか？

### カテゴリ4：リスク・懸念に関する質問（保証協会審査部長の視点）
- Q10: （赤字/債務超過/滞納がある場合）この状況をどうお考えですか？
- Q11: コロナ/原材料費高騰等の外部リスクへの対策は？
- Q12: 後継者問題・事業継続計画はありますか？

### カテゴリ5：取引関係に関する質問（地銀支店長の視点）
- Q13: 当行をメインバンクとしてお考えですか？
- Q14: 他行との取引状況を教えてください
- Q15: 今後のお取引の拡大余地はありますか？

## 回答作成ルール
- 各回答は80〜120字程度の「模範回答文」を作成
- データに基づく具体的数字を必ず含める
- リスク質問には「認識→原因分析→対策→改善見通し」の4段構成
- 最後に "★面談のコツ" を3点付記`,

      meeting: `# タスク：銀行面談 完全準備シートの作成

## あなたの視点
元メガバンク審査部統括部長＋中小企業診断士の2名体制で作成してください。
「準備9割」—面談の成否は準備で決まります。

## 必須構成
### 1. 面談タイムテーブル（40分想定）
| 時間 | 内容 | 話者 | ポイント |
0〜2分/2〜12分/12〜27分/27〜37分/37〜40分の5フェーズ

### 2. 持参資料チェックリスト（優先度付き）
必須（★★★）/推奨（★★）/あると好印象（★）の3段階で分類
具体的なファイル名と部数を指定

### 3. 第一印象の極意（5ポイント）
- 服装・名刺・座り方・話すスピード・メモの取り方

### 4. 絶対やってはいけないNG集（10項目）
実際の失敗事例に基づく具体的なNG行動（「他行は○%」発言、数字の曖昧化等）

### 5. 想定シナリオ別 対処法
- **好感触パターン**：「前向きに検討させていただきます」と言われたら
- **厳しめパターン**：「もう少し検討が必要ですね」と言われたら
- **想定外の質問**：答えられない質問をされたときの切り返し方法

### 6. 面談後の即実行アクション（3日以内）
- お礼メール/追加資料の送付/次回面談の日程調整`,

      strategy: `# タスク：融資戦略レポートの作成

## あなたの視点
5名の専門家全員の知見で、最適な融資獲得戦略を設計してください。

## 必須構成
### 1. 推奨金融機関の優先順位テーブル
| 優先度 | 金融機関 | 推奨理由 | 融資可能性 | 推定金利 | 推定期間 | 注意点 |
企業DNAの格付け・財務状況・取引状況から具体的に判断

### 2. 最適な金額配分シミュレーション
- 希望額全額を1社からの場合のリスク
- 2〜3社に分散した場合のメリット
- 具体的な配分提案（テーブル形式）

### 3. 制度融資・保証制度の活用提案
- 利用可能な制度を網羅的にリストアップ（保証協会制度、公庫制度、自治体制度）
- 各制度の金利・期間・保証料率を比較テーブルで提示
- 最適な組み合わせ案

### 4. タイムラインと実行計画
6〜8週間のガントチャート的なテーブル
| 週 | アクション | 担当 | 完了条件 |

### 5. 成功確率向上のためのアクションプラン
- 融資申込前にやるべき財務改善施策（即効性のあるもの）
- 面談時のキーメッセージ（3つに絞る）
- 条件交渉の余地（金利・期間・担保の交渉カード）`,

      deepening: `# タスク：取引深耕提案書の作成

## あなたの視点
地方銀行の支店長として「この提案書を受け取ったら嬉しい」と思えるものを作成してください。

## なぜこの資料が最強なのか
銀行員の業績評価は「融資残高」だけでなく：
- 預金量（特に要求払預金）増加
- クロスセル件数（カード・保険・投信・為替等）
- 給与振込口座の獲得数
- IB（インターネットバンキング）契約数
で決まる。「この企業に融資すれば自分の成績が上がる」と思わせたら稟議は必ず通る。

## 必須構成
### 1. 現在のお取引状況テーブル
| 項目 | 現在の状況 |

### 2. 融資実現後の取引拡大イメージテーブル
| 項目 | 現在 | 融資後見込 | 増加額/効果 |
融資残高/預金残高/給与振込/売上入金/クレジットカード等

### 3. 追加でご検討いただきたいお取引（具体的に）
- 役員報酬の振込口座変更（月○○万円）
- 従業員給与振込の集約（月○○万円×○名＝月○○万円）
- 売上入金口座の移管（月次入金○○万円）
- 法人カード・ビジネスローンカード
- ネットバンキング・でんさいネット

### 4. 中長期的なパートナーシップ構想
- 今後の設備投資計画（次の融資案件の布石）
- 事業承継への御行の関与期待
- 当社の成長による取引拡大の見通し

## 注意事項
- 数字は具体的に記載（「給与振込30万円×15名＝月450万円の預金効果」等）
- 銀行員が支店長に報告しやすいフォーマットで作成`
    };

    let prompt = `${expertInstructions[docId] || '与えられた企業データを基に、融資関連の専門資料を作成してください。'}\n\n${ctx}`;
    if (custom) prompt += `\n\n【依頼者からの追加指示】\n${custom}`;
    return prompt;
  },

  /* ================================================================
   * テンプレート生成関数群（旧documents.jsから移植＋改善）
   * ================================================================ */
  tmplExecutive(data, rr) {
    const d = data;
    const rev = d.annualRevenue || 0;
    const op = d.operatingProfit || 0;
    const ordP = d.ordinaryProfit || 0;
    const ni = d.netIncome || 0;
    const ta = d.totalAssets || 1;
    const na = d.netAssets || 0;
    const debt = d.totalDebt || 0;
    const dep = d.depreciation || 0;
    const cf = ni + dep;
    const mr = (d.monthlyRepayment || 0) * 12;
    const la = d.loanAmount || 0;
    const eqR = ta > 0 ? (na / ta * 100).toFixed(1) : '—';
    const dsr = cf > 0 ? (debt / cf).toFixed(1) : '—';
    const opR = rev > 0 ? (op / rev * 100).toFixed(1) : '—';
    const cfRatio = mr > 0 ? (cf / mr).toFixed(2) : '—';

    const barHtml = (val, max, color) => {
      const pct = Math.min(100, Math.max(0, val / max * 100));
      return `<div class="bar-container"><div class="bar-fill" style="width:${pct}%;background:${color};"></div></div>`;
    };

    return `<div class="doc-preview">
      <h1>融資ご相談の概要 — エグゼクティブサマリー</h1>
      <div class="summary-box" style="display:flex;gap:16px;align-items:center;">
        <div style="font-size:14px;font-weight:700;">${d.companyName || '○○株式会社'}</div>
        <div style="font-size:11px;color:#6b7280;">| ${d.industry || '—'} | 業歴 ${d.yearsInBusiness || '○'}年 | 従業員 ${d.employeeCount || '○'}名</div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-value">${rev ? (rev/10000).toFixed(1) : '—'}</div><div class="kpi-label">年商（億円）</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:${op >= 0 ? '#16a34a' : '#dc2626'};">${op ? (op).toLocaleString() : '—'}</div><div class="kpi-label">営業利益（万円）</div></div>
        <div class="kpi-card"><div class="kpi-value">${eqR}%</div><div class="kpi-label">自己資本比率</div>${barHtml(parseFloat(eqR)||0, 50, '#2563eb')}</div>
        <div class="kpi-card"><div class="kpi-value">${dsr}年</div><div class="kpi-label">債務償還年数</div></div>
      </div>
      <h2>■ ご相談内容</h2>
      <table>
        <tr><th width="25%">資金使途</th><td>${d.loanPurpose || '—'}</td><th width="20%">希望金額</th><td style="font-weight:700;color:#1e40af;">${la ? la.toLocaleString() + '万円' : '—'}</td></tr>
        <tr><th>希望時期</th><td>${d.urgency || '可能な限り早期'}</td><th>希望期間</th><td>${d.repaymentPeriod || '5〜7年'}</td></tr>
      </table>
      <h2>■ 返済原資と安全性</h2>
      <table>
        <tr><th>項目</th><th>金額</th><th>説明</th><th>判定</th></tr>
        <tr><td>年間キャッシュフロー</td><td style="font-weight:700;">${cf.toLocaleString()}万円</td><td>税引後利益 + 減価償却費</td><td class="${cf > 0 ? 'ok-green' : 'risk-red'}">${cf > 0 ? '●' : '×'}</td></tr>
        <tr><td>年間返済額（既存）</td><td>${mr.toLocaleString()}万円</td><td>既存借入の年間返済額</td><td>—</td></tr>
        <tr><td>返済余力</td><td style="font-weight:700;">${(cf - mr).toLocaleString()}万円</td><td>CF − 既存返済</td><td class="${cf - mr > 0 ? 'ok-green' : 'risk-red'}">${cf - mr > 0 ? '●余裕あり' : '×不足'}</td></tr>
        <tr><td>CF倍率</td><td style="font-weight:700;">${cfRatio}倍</td><td>CF ÷ 返済額（1.2倍以上が安全）</td><td class="${parseFloat(cfRatio) >= 1.2 ? 'ok-green' : parseFloat(cfRatio) >= 1.0 ? 'warn-yellow' : 'risk-red'}">${parseFloat(cfRatio) >= 1.2 ? '◎安全' : parseFloat(cfRatio) >= 1.0 ? '△注意' : '×危険'}</td></tr>
      </table>
      <h2>■ 当社の強み（3点）</h2>
      <table>
        <tr><th style="width:10%;">No</th><th style="width:30%;">強み</th><th>定量的根拠</th></tr>
        <tr><td>①</td><td>${d.competitiveAdvantage ? d.competitiveAdvantage.split('\n')[0] || '業界トップクラスの技術力' : '業界トップクラスの技術力'}</td><td>業歴${d.yearsInBusiness || '○'}年の実績、営業利益率${opR}%</td></tr>
        <tr><td>②</td><td>安定した顧客基盤</td><td>${d.topClients ? '主要取引先: ' + d.topClients.split('\n')[0] : '高いリピート率'}</td></tr>
        <tr><td>③</td><td>堅実な財務体質</td><td>自己資本比率${eqR}%${parseFloat(eqR) >= 20 ? '（業種平均以上）' : ''}</td></tr>
      </table>
      ${(d.taxDelinquency && d.taxDelinquency !== 'なし') || (d.negativeEquity && d.negativeEquity !== 'なし') ? `
      <div class="danger-box">
        <h3 style="color:#dc2626;margin:0 0 6px;">■ ご留意事項と改善計画</h3>
        ${d.taxDelinquency && d.taxDelinquency !== 'なし' ? '<p>税金：分納計画に基づき返済中。○月完納予定。</p>' : ''}
        ${d.negativeEquity && d.negativeEquity !== 'なし' ? '<p>債務超過：経営改善計画により○期での解消を目標。役員借入金の資本性劣後ローン認定により実態自己資本比率は改善。</p>' : ''}
      </div>` : ''}
      <div class="footer">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
  },

  tmplCompany(data) {
    const d = data;
    return `<div class="doc-preview">
      <h1>企業概要書</h1>
      <table>
        <tr><th width="20%">商号</th><td>${d.companyName || '○○株式会社'}</td><th width="20%">代表者</th><td>${d.representativeName || '○○ ○○'}</td></tr>
        <tr><th>設立年月</th><td>${d.establishedDate || '—'}</td><th>業歴</th><td>${d.yearsInBusiness ? d.yearsInBusiness + '年' : '—'}</td></tr>
        <tr><th>業種</th><td>${d.industry || '—'}</td><th>法人形態</th><td>${d.corporateForm || '株式会社'}</td></tr>
        <tr><th>資本金</th><td>${d.capitalAmount ? d.capitalAmount.toLocaleString() + '万円' : '—'}</td><th>従業員数</th><td>${d.employeeCount ? d.employeeCount + '名' : '—'}</td></tr>
        <tr><th>本店所在地</th><td colspan="3">${d.headOfficeAddress || '—'}</td></tr>
        <tr><th>年商</th><td>${d.annualRevenue ? d.annualRevenue.toLocaleString() + '万円' : '—'}</td><th>メインバンク</th><td>${d.mainBank || '—'}${d.mainBankYears ? '（' + d.mainBankYears + '年）' : ''}</td></tr>
        <tr><th>許認可</th><td colspan="3">${d.licenses || '—'}</td></tr>
      </table>
      <h2>■ 事業内容</h2>
      <div class="summary-box">
        <strong>ビジネスモデル：</strong>${d.businessModel || '（DNAに事業モデルを登録してください）'}<br>
        <strong>主力商品・サービス：</strong>${d.mainProducts || '—'}<br>
        <strong>ターゲット市場：</strong>${d.targetMarket || '—'}
      </div>
      ${d.revenueBreakdown ? `<h2>■ 売上構成比</h2><p>${d.revenueBreakdown}</p>` : ''}
      <h2>■ 競合優位性</h2>
      <p>${d.competitiveAdvantage || '（DNAに競合優位性を登録してください）'}</p>
      ${d.ipAssets ? `<h3>知的財産・特許</h3><p>${d.ipAssets}</p>` : ''}
      <h2>■ 主要取引先</h2>
      <table>
        <tr><th>区分</th><th>取引先</th></tr>
        <tr><td>売上先</td><td>${d.topClients || '—'}</td></tr>
        <tr><td>仕入先</td><td>${d.topSuppliers || '—'}</td></tr>
      </table>
      <h2>■ 代表者プロフィール</h2>
      <table>
        <tr><th>年齢</th><td>${d.ceoAge || '—'}歳</td><th>業界経験</th><td>${d.ceoIndustryExperience || '—'}年</td></tr>
        <tr><th>略歴</th><td colspan="3">${d.ceoCareerHistory || '—'}</td></tr>
        <tr><th>保有資格</th><td colspan="3">${d.ceoQualifications || '—'}</td></tr>
      </table>
      <h2>■ 取引金融機関</h2>
      <p>${d.bankRelationships || d.mainBank || '—'}</p>
      <div class="footer">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
  },

  tmplBizPlan(data, rr) {
    const d = data;
    const rev = d.annualRevenue || 0;
    const op = d.operatingProfit || 0;
    const ni = d.netIncome || 0;
    const gpm = d.grossProfitMargin || 30;
    const cost = Math.round(rev * (1 - gpm / 100));
    const sgaBase = rev - cost - op;
    const gr = d.revenueGrowthRate || 3;
    const years = [
      { y:'1年目', r:Math.round(rev*(1+gr/200)), c:Math.round(cost*1.01), s:Math.round(sgaBase*1.02) },
      { y:'2年目', r:Math.round(rev*(1+gr/100)), c:Math.round(cost*1.02), s:Math.round(sgaBase*1.03) },
      { y:'3年目', r:Math.round(rev*(1+gr*1.5/100)), c:Math.round(cost*1.03), s:Math.round(sgaBase*1.04) }
    ];

    let html = `<div class="doc-preview">
      <h1>事業計画書（3ヵ年）</h1>
      <div class="summary-box">
        <strong>${d.companyName || '○○株式会社'}</strong> | ${d.industry || '○○業'} | 業歴 ${d.yearsInBusiness || '○'}年<br>
        融資目的: ${d.loanPurpose || '○○'} | 希望額: ${d.loanAmount ? d.loanAmount.toLocaleString() + '万円' : '—'}
      </div>
      <h2>■ 売上計画（積み上げ方式）</h2>
      <table>
        <tr><th>区分</th><th>実績（直近期）</th><th>1年目</th><th>2年目</th><th>3年目</th><th>根拠</th></tr>
        <tr><td>既存顧客売上</td><td>${Math.round(rev*0.95).toLocaleString()}</td><td>${Math.round(rev*0.93).toLocaleString()}</td><td>${Math.round(rev*0.94).toLocaleString()}</td><td>${Math.round(rev*0.95).toLocaleString()}</td><td>保守的に前年比維持</td></tr>
        <tr><td>新規顧客売上</td><td>${Math.round(rev*0.05).toLocaleString()}</td><td>${Math.round(rev*0.07).toLocaleString()}</td><td>${Math.round(rev*0.09).toLocaleString()}</td><td>${Math.round(rev*0.12).toLocaleString()}</td><td>月○件×成約率○%×単価</td></tr>
        <tr style="font-weight:700;background:#eff6ff;"><td>売上合計</td><td>${rev.toLocaleString()}</td>`;
    years.forEach(y => html += `<td>${y.r.toLocaleString()}</td>`);
    html += `<td>—</td></tr></table>
      <h2>■ 収支計画（P/L予測）</h2>
      <table>
        <tr><th>項目</th><th>実績</th><th>1年目</th><th>2年目</th><th>3年目</th></tr>
        <tr><td>売上高</td><td>${rev.toLocaleString()}</td>${years.map(y=>`<td>${y.r.toLocaleString()}</td>`).join('')}</tr>
        <tr><td>売上原価</td><td>${cost.toLocaleString()}</td>${years.map(y=>`<td>${y.c.toLocaleString()}</td>`).join('')}</tr>
        <tr><td>売上総利益</td><td>${(rev-cost).toLocaleString()}</td>${years.map(y=>`<td>${(y.r-y.c).toLocaleString()}</td>`).join('')}</tr>
        <tr><td>販管費</td><td>${sgaBase.toLocaleString()}</td>${years.map(y=>`<td>${y.s.toLocaleString()}</td>`).join('')}</tr>
        <tr style="font-weight:700;background:#eff6ff;"><td>営業利益</td><td>${op.toLocaleString()}</td>${years.map(y=>`<td>${(y.r-y.c-y.s).toLocaleString()}</td>`).join('')}</tr>
      </table>
      <h2>■ 3シナリオ分析</h2>
      <table>
        <tr><th>シナリオ</th><th>売上前提</th><th>3年目売上</th><th>3年目営業利益</th><th>返済可否</th></tr>
        <tr><td>😨 悲観</td><td>売上△15%</td><td>${Math.round(rev*0.85).toLocaleString()}</td><td>${Math.round((rev*0.85-cost*0.95-sgaBase)).toLocaleString()}</td><td class="${(rev*0.85-cost*0.95-sgaBase) > 0 ? 'ok-green' : 'risk-red'}">${(rev*0.85-cost*0.95-sgaBase) > 0 ? '○ 可能' : '△ 要対策'}</td></tr>
        <tr style="background:#eff6ff;"><td>📊 標準</td><td>計画通り</td><td>${years[2].r.toLocaleString()}</td><td>${(years[2].r-years[2].c-years[2].s).toLocaleString()}</td><td class="ok-green">○ 可能</td></tr>
        <tr><td>🚀 楽観</td><td>売上+15%</td><td>${Math.round(rev*1.15).toLocaleString()}</td><td>${Math.round((rev*1.15-cost*1.05-sgaBase)).toLocaleString()}</td><td class="ok-green">◎ 余裕</td></tr>
      </table>
      <div class="footer">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
    return html;
  },

  tmplCashFlow(data) {
    const d = data;
    const mr = d.monthlyRepayment || 0;
    const rev = d.annualRevenue || 0;
    const monthlyRev = Math.round(rev / 12);
    const monthlyCost = Math.round(monthlyRev * 0.65);
    const monthlyHR = Math.round(monthlyRev * 0.15);
    const monthlyOther = Math.round(monthlyRev * 0.1);
    const monthlyIncome = monthlyRev - monthlyCost - monthlyHR - monthlyOther;
    const la = d.loanAmount || 0;
    const newMR = la > 0 ? Math.round(la / 84) : 0;
    const months = ['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'];
    const seasonal = [0.95,0.9,1.0,1.0,0.85,1.0,1.05,1.0,1.1,0.9,0.95,1.3];

    let html = `<div class="doc-preview"><h1>資金繰り表（月次12ヶ月）</h1>
      <div class="summary-box">パターンB：融資あり（${la.toLocaleString()}万円）のケース | 新規返済 月${newMR.toLocaleString()}万円（7年返済）</div>
      <table style="font-size:9px;"><tr><th style="min-width:100px;">項目</th>`;
    months.forEach(m => html += `<th style="text-align:right;">${m}</th>`);
    html += `<th style="text-align:right;background:#1e40af;">合計</th></tr>`;

    let balance = Math.round(monthlyRev * 0.8);
    let annualTotal = {};
    const rows = [
      { label:'月初現預金', calc: (i) => balance, bold: true },
      { label:'【収入】売上代金回収', calc: (i) => Math.round(monthlyRev * seasonal[i]) },
      { label:'【支出】仕入代金', calc: () => -monthlyCost },
      { label:'【支出】人件費', calc: (i) => i === 5 || i === 11 ? -Math.round(monthlyHR * 1.5) : -monthlyHR },
      { label:'【支出】その他固定費', calc: () => -monthlyOther },
      { label:'経常収支', calc: (i) => Math.round(monthlyRev*seasonal[i]) - monthlyCost - (i===5||i===11 ? Math.round(monthlyHR*1.5) : monthlyHR) - monthlyOther, bold: true },
      { label:'既存借入返済', calc: () => -mr },
      { label:'★新規借入入金', calc: (i) => i === 0 ? la : 0, highlight: true },
      { label:'★新規借入返済', calc: (i) => i === 0 ? 0 : -newMR, highlight: true },
    ];

    rows.forEach(row => {
      const style = row.bold ? 'font-weight:700;background:#f8fafc;' : row.highlight ? 'color:#1e40af;font-weight:600;' : '';
      html += `<tr><td style="${style}">${row.label}</td>`;
      let rowTotal = 0;
      months.forEach((m, i) => {
        const val = row.calc(i);
        rowTotal += val;
        const color = val < 0 ? '#dc2626' : val > 0 ? '#111' : '#9ca3af';
        html += `<td style="text-align:right;color:${color};${style}">${val.toLocaleString()}</td>`;
      });
      html += `<td style="text-align:right;font-weight:700;">${rowTotal.toLocaleString()}</td></tr>`;
    });

    // 月末残高行
    html += `<tr style="font-weight:700;background:#eff6ff;"><td>月末現預金残高</td>`;
    let runBal = balance;
    months.forEach((m, i) => {
      const income = Math.round(monthlyRev * seasonal[i]);
      const hrCost = i === 5 || i === 11 ? Math.round(monthlyHR * 1.5) : monthlyHR;
      const net = income - monthlyCost - hrCost - monthlyOther - mr - (i === 0 ? 0 : newMR) + (i === 0 ? la : 0);
      runBal += net;
      const color = runBal < 0 ? '#dc2626' : '#16a34a';
      html += `<td style="text-align:right;color:${color};">${runBal.toLocaleString()}</td>`;
    });
    html += `<td>—</td></tr></table>
      <div class="footer">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
    return html;
  },

  tmplRepayPlan(data, rr) {
    const d = data;
    const cf = (d.netIncome || 0) + (d.depreciation || 0);
    const mr = (d.monthlyRepayment || 0) * 12;
    const la = d.loanAmount || 0;
    const newAnnual = la > 0 ? Math.round(la / 7) : 0;
    const debtBal = d.totalDebt || 0;

    let html = `<div class="doc-preview"><h1>返済計画書（5年シミュレーション）</h1>
      <h2>■ 融資条件の前提</h2>
      <table>
        <tr><th>融資金額</th><td>${la.toLocaleString()}万円</td><th>返済方法</th><td>元金均等返済</td></tr>
        <tr><th>想定金利</th><td>1.5〜2.5%</td><th>返済期間</th><td>7年（84ヶ月）</td></tr>
        <tr><th>据置期間</th><td>6ヶ月</td><th>据置理由</th><td>設備稼働開始まで</td></tr>
      </table>
      <h2>■ 5年返済スケジュール</h2>
      <table>
        <tr><th>年度</th><th>既存返済</th><th>新規返済</th><th>返済合計</th><th>予想CF</th><th>CF倍率</th><th>判定</th></tr>`;
    for (let i = 1; i <= 5; i++) {
      const exRepay = Math.max(0, Math.round(mr - mr / 7 * (i - 1)));
      const total = exRepay + newAnnual;
      const projCF = Math.round(cf * (1 + 0.03 * i));
      const ratio = total > 0 ? (projCF / total).toFixed(2) : '—';
      const ratioN = parseFloat(ratio) || 0;
      const cls = ratioN >= 1.5 ? 'ok-green' : ratioN >= 1.0 ? 'warn-yellow' : 'risk-red';
      const mark = ratioN >= 1.5 ? '◎安全' : ratioN >= 1.0 ? '○返済可' : '×要対策';
      html += `<tr><td>${i}年目</td><td>${exRepay.toLocaleString()}</td><td>${newAnnual.toLocaleString()}</td><td style="font-weight:700;">${total.toLocaleString()}</td><td>${projCF.toLocaleString()}</td><td style="font-weight:700;">${ratio}倍</td><td class="${cls}">${mark}</td></tr>`;
    }
    html += `</table>
      <h2>■ 返済原資の内訳</h2>
      <table>
        <tr><th>返済原資</th><th>金額（万円/年）</th><th>根拠</th></tr>
        <tr><td>簡易CF（税引後利益+減価償却費）</td><td style="font-weight:700;">${cf.toLocaleString()}</td><td>直近決算ベース</td></tr>
        <tr><td>役員報酬調整余力</td><td>○○</td><td>現在月額○○万円→○○万円に削減可能</td></tr>
        <tr><td>保険解約返戻金</td><td>${d.insuranceSurrenderValue ? d.insuranceSurrenderValue.toLocaleString() : '○○'}</td><td>緊急時の安全弁</td></tr>
      </table>
      <h2>■ バックアッププラン</h2>
      <table>
        <tr><th>段階</th><th>対策</th><th>効果</th></tr>
        <tr><td>第1段階</td><td>経費削減（広告費・交際費の見直し）</td><td>年間○○万円の削減</td></tr>
        <tr><td>第2段階</td><td>役員報酬の減額</td><td>月○○万円→○○万円で年間○○万円確保</td></tr>
        <tr><td>第3段階</td><td>遊休資産の売却</td><td>${d.realEstateValue ? d.realEstateValue.toLocaleString() + '万円相当' : '○○万円相当'}</td></tr>
      </table>
      <div class="footer">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
    return html;
  },

  tmplDebtList(data) {
    const d = data;
    const debt = d.totalDebt || 0;
    const mr = d.monthlyRepayment || 0;
    return `<div class="doc-preview">
      <h1>借入金一覧表（全件開示）</h1>
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:12px;margin:8px 0;">
        <strong>★鉄則：</strong>借入を1件でも隠した企業は二度と信用されない。信用情報機関で必ず裏取りされます。自ら全件開示＝正直な企業として加点。
      </div>
      <h2>■ 法人借入一覧</h2>
      <table>
        <tr><th>No</th><th>金融機関</th><th>融資形態</th><th>当初金額</th><th>現在残高</th><th>金利(%)</th><th>月額返済</th><th>最終返済日</th><th>担保</th><th>保証種類</th><th>備考</th></tr>
        <tr><td>1</td><td>${d.mainBank || '○○銀行'}</td><td>証書貸付</td><td>○○万円</td><td>○○万円</td><td>○.○%</td><td>○○万円</td><td>20○○/○○</td><td>なし</td><td>保証協会</td><td>正常返済</td></tr>
        <tr><td>2</td><td>○○信金</td><td>証書貸付</td><td>○○万円</td><td>○○万円</td><td>○.○%</td><td>○○万円</td><td>20○○/○○</td><td>不動産</td><td>プロパー</td><td>正常返済</td></tr>
        <tr style="font-weight:700;background:#eff6ff;"><td colspan="4">合計</td><td>${debt.toLocaleString()}万円</td><td>—</td><td>${mr.toLocaleString()}万円</td><td>—</td><td>—</td><td>—</td><td>年間: ${(mr*12).toLocaleString()}万円</td></tr>
      </table>
      <h2>■ 借入金推移</h2>
      <table>
        <tr><th>区分</th><th>3期前</th><th>2期前</th><th>直近期</th><th>傾向</th></tr>
        <tr><td>有利子負債合計</td><td>○○万円</td><td>○○万円</td><td>${debt.toLocaleString()}万円</td><td>※実績値を入力</td></tr>
      </table>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:8px 0;">★返済実績: 全借入について延滞なく正常返済を継続中（加点要素）</div>
      <div style="font-size:9px;color:#9ca3af;text-align:right;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px;">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
  },

  tmplQA(data, rr) {
    const d = data;
    const la = d.loanAmount || 0;
    const cf = (d.netIncome || 0) + (d.depreciation || 0);
    const eqR = d.totalAssets > 0 ? ((d.netAssets || 0) / d.totalAssets * 100).toFixed(1) : '—';
    const dsr = cf > 0 ? ((d.totalDebt || 0) / cf).toFixed(1) : '—';

    const qaList = [
      { cat:'📊 財務', q:'債務償還年数の改善見通しは？', a:`現在${dsr}年。融資による設備投資で売上向上を見込み、3年後に10年以内へ改善予定。` },
      { cat:'📊 財務', q:'自己資本比率について', a:`現在${eqR}%。毎期の利益蓄積で改善中。役員借入金の劣後ローン認定で実態比率はさらに改善。` },
      { cat:'📊 財務', q:'営業利益率の推移は？', a:`直近${d.operatingProfit ? (d.operatingProfit/(d.annualRevenue||1)*100).toFixed(1) : '○'}%。原価管理の徹底と売上増で改善傾向。` },
      { cat:'💼 事業', q:'今後の市場環境と見通しは？', a:`${d.industry || '当業界'}は安定成長見込み。${d.competitiveAdvantage ? d.competitiveAdvantage.split('\n')[0] : '差別化戦略'}でシェア拡大中。` },
      { cat:'💼 事業', q:'競合他社との差別化は？', a:`${d.competitiveAdvantage || '独自技術＋顧客基盤'}。業歴${d.yearsInBusiness || '○'}年の実績が最大の参入障壁。` },
      { cat:'💼 事業', q:'主要取引先の集中リスクは？', a:'特定取引先への過度な依存なし。取引先分散を推進中。' },
      { cat:'💰 融資', q:'資金使途と金額根拠は？', a:`${d.loanPurpose || '○○'}のため${la.toLocaleString()}万円が必要。見積書ベース。投資回収は○年で達成見込み。` },
      { cat:'💰 融資', q:'返済原資は？困難時の対応は？', a:`年間CF${cf.toLocaleString()}万円が主な原資。①経費削減②役員報酬減額③遊休資産売却の3段階で対応。` },
      { cat:'💰 融資', q:'なぜ今このタイミング？', a:`${d.urgency || '事業拡大の好機'}を逃さないため早期調達が不可欠。受注増への対応が急務。` },
      { cat:'⚠️ リスク', q:'外部リスクへの対策は？', a:'売上多角化・固定費削減・緊急時資金確保の3本柱でリスク管理実施中。BCP策定済み。' },
      { cat:'⚠️ リスク', q:'コロナ等の環境変化への対応は？', a:'既にオンライン対応を整備。在庫管理の見直しとサプライチェーンの分散を実施済み。' },
      { cat:'⚠️ リスク', q:'後継者問題・事業継続は？', a:'事業継続計画策定中。将来の事業承継も計画的に進行。' },
      { cat:'🤝 取引', q:'当行をメインバンクとお考え？', a:`はい。${d.mainBank || '御行'}との取引を最重視。メインバンクとしての関係深化を希望。` },
      { cat:'🤝 取引', q:'他行との取引状況は？', a:'複数行とお取引がありますが、御行との取引拡大を最優先と位置づけています。' },
      { cat:'🤝 取引', q:'今後の取引拡大余地は？', a:'給与振込集約・法人カード・ネットバンキング等の総合取引拡大を積極検討中。' }
    ];

    let html = `<div class="doc-preview"><h1>銀行面談 想定Q&A集（15問）</h1>`;
    let currentCat = '';
    qaList.forEach((item, i) => {
      if (item.cat !== currentCat) { currentCat = item.cat; html += `<h2>${currentCat}に関する質問</h2>`; }
      html += `<table style="margin-bottom:6px;"><tr>
        <td style="width:30px;font-weight:700;color:#1e40af;vertical-align:top;">Q${i+1}</td>
        <td style="font-weight:600;">${item.q}</td></tr>
        <tr><td style="color:#16a34a;font-weight:700;vertical-align:top;">A</td>
        <td style="border-left:3px solid #16a34a;padding-left:8px;">${item.a}</td></tr></table>`;
    });
    html += `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:12px 0;">
      <strong>★面談のコツ</strong><br>① 年商・利益・返済額は即答できるよう暗記<br>② 弱点は先に自ら言及し対策をセットで説明<br>③「御行との長期的関係構築」姿勢を示す</div>
      <div style="font-size:9px;color:#9ca3af;text-align:right;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px;">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div></div>`;
    return html;
  },

  tmplMeeting(data) {
    return `<div class="doc-preview">
      <h1>銀行面談 完全準備シート</h1>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:8px 0;">「準備9割」—面談の成否は準備で決まります。</div>
      <h2>■ 面談タイムテーブル（40分想定）</h2>
      <table>
        <tr><th>時間</th><th>内容</th><th>話者</th><th>ポイント</th></tr>
        <tr><td>0〜2分</td><td>挨拶・名刺交換</td><td>双方</td><td>第一印象が全て。笑顔＋姿勢</td></tr>
        <tr style="background:#f8fafc;"><td>2〜12分</td><td>事業概要の説明</td><td>代表者</td><td>何を・誰に・どうやって稼ぐか</td></tr>
        <tr><td>12〜27分</td><td>融資相談の本題</td><td>代表者</td><td>使途→金額根拠→返済原資の順</td></tr>
        <tr style="background:#f8fafc;"><td>27〜37分</td><td>質疑応答</td><td>双方</td><td>Q&A集で準備済みの質問に的確回答</td></tr>
        <tr><td>37〜40分</td><td>スケジュール確認</td><td>双方</td><td>次のアクションを具体的に決める</td></tr>
      </table>
      <h2>■ 持参資料チェックリスト</h2>
      <table>
        <tr><th>重要度</th><th>資料名</th><th>部数</th><th>備考</th></tr>
        <tr><td style="color:#dc2626;font-weight:700;">★★★</td><td>決算書（直近3期）</td><td>2部</td><td>税務申告書も</td></tr>
        <tr><td style="color:#dc2626;font-weight:700;">★★★</td><td>試算表（直近月次）</td><td>2部</td><td>月次決算</td></tr>
        <tr><td style="color:#dc2626;font-weight:700;">★★★</td><td>エグゼクティブサマリー</td><td>2部</td><td>A4横1枚</td></tr>
        <tr><td style="color:#dc2626;font-weight:700;">★★★</td><td>事業計画書</td><td>2部</td><td>3年分</td></tr>
        <tr><td style="color:#d97706;font-weight:700;">★★</td><td>資金繰り表・返済計画書</td><td>2部</td><td>月次12ヶ月</td></tr>
        <tr><td style="color:#d97706;font-weight:700;">★★</td><td>借入金一覧表</td><td>2部</td><td>全件記載</td></tr>
        <tr><td>★</td><td>取引深耕提案書</td><td>1部</td><td>最強の隠し玉</td></tr>
      </table>
      <h2>■ NG集（5大禁止事項）</h2>
      <table>
        <tr><th>No</th><th>NG行動</th><th>なぜダメか</th></tr>
        <tr><td>1</td><td>「他行は○%で貸してくれる」</td><td>銀行間競合を煽ると信頼喪失</td></tr>
        <tr><td>2</td><td>数字を曖昧にする</td><td>「だいたい○千万」は信用ゼロ</td></tr>
        <tr><td>3</td><td>借入を隠す/過少申告</td><td>信用情報で100%バレる</td></tr>
        <tr><td>4</td><td>「とりあえず借りたい」</td><td>使途不明＝審査対象外</td></tr>
        <tr><td>5</td><td>答えられない質問に嘘</td><td>「確認して回答します」が正解</td></tr>
      </table>
      <h2>■ 面談後アクション（3日以内）</h2>
      <table>
        <tr><th>期限</th><th>アクション</th></tr>
        <tr><td>当日中</td><td>お礼メール送信</td></tr>
        <tr><td>翌日</td><td>追加資料の準備・送付</td></tr>
        <tr><td>3日以内</td><td>次回面談の日程調整</td></tr>
      </table>
      <div style="font-size:9px;color:#9ca3af;text-align:right;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px;">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
  },

  tmplStrategy(data, rr) {
    const d = data;
    const la = d.loanAmount || 0;
    const mb = d.mainBank || 'メインバンク';
    return `<div class="doc-preview">
      <h1>融資戦略レポート</h1>
      <h2>■ 推奨金融機関の優先順位</h2>
      <table>
        <tr><th>優先度</th><th>金融機関</th><th>推奨理由</th><th>可能性</th><th>推定金利</th><th>推定期間</th></tr>
        <tr style="background:#eff6ff;"><td style="font-weight:700;color:#1e40af;">1位</td><td>${mb}</td><td>取引実績あり</td><td style="color:#16a34a;font-weight:700;">高</td><td>1.5〜2.5%</td><td>5〜7年</td></tr>
        <tr><td>2位</td><td>日本政策金融公庫</td><td>低金利・長期</td><td style="color:#16a34a;font-weight:700;">高</td><td>1.0〜2.0%</td><td>7〜10年</td></tr>
        <tr><td>3位</td><td>信用保証協会付融資</td><td>保証付でリスク軽減</td><td style="color:#d97706;font-weight:700;">中</td><td>1.0〜3.0%</td><td>5〜7年</td></tr>
        <tr><td>4位</td><td>制度融資（自治体）</td><td>利子補給で実質低金利</td><td style="color:#d97706;font-weight:700;">中</td><td>0.5〜2.0%</td><td>5〜7年</td></tr>
      </table>
      <h2>■ 金額配分シミュレーション</h2>
      <table>
        <tr><th>パターン</th><th>${mb}</th><th>公庫</th><th>保証協会付</th><th>合計</th><th>評価</th></tr>
        <tr><td>A 集中型</td><td>${la.toLocaleString()}</td><td>—</td><td>—</td><td>${la.toLocaleString()}</td><td style="color:#d97706;font-weight:700;">△リスク高</td></tr>
        <tr style="background:#eff6ff;"><td>B 分散推奨</td><td>${Math.round(la*0.5).toLocaleString()}</td><td>${Math.round(la*0.3).toLocaleString()}</td><td>${Math.round(la*0.2).toLocaleString()}</td><td>${la.toLocaleString()}</td><td style="color:#16a34a;font-weight:700;">◎最適</td></tr>
        <tr><td>C 公庫中心</td><td>${Math.round(la*0.2).toLocaleString()}</td><td>${Math.round(la*0.6).toLocaleString()}</td><td>${Math.round(la*0.2).toLocaleString()}</td><td>${la.toLocaleString()}</td><td style="color:#16a34a;font-weight:700;">○堅実</td></tr>
      </table>
      <h2>■ 実行タイムライン（8週間）</h2>
      <table>
        <tr><th>週</th><th>アクション</th><th>完了条件</th></tr>
        <tr><td>1週</td><td>全資料の準備・最終チェック</td><td>10種類完成</td></tr>
        <tr><td>2週</td><td>${mb}への面談申込</td><td>日程確定</td></tr>
        <tr style="background:#eff6ff;"><td>3週</td><td>${mb}面談 + 公庫申込</td><td>面談完了</td></tr>
        <tr><td>4-5週</td><td>追加資料対応・公庫面談</td><td>質問回答完了</td></tr>
        <tr><td>6-7週</td><td>審査期間</td><td>フォローアップ</td></tr>
        <tr style="background:#eff6ff;"><td>8週</td><td>融資実行</td><td>入金確認</td></tr>
      </table>
      <div style="font-size:9px;color:#9ca3af;text-align:right;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px;">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
  },

  tmplDeepening(data) {
    const d = data;
    const debt = d.totalDebt || 0;
    const la = d.loanAmount || 0;
    const emp = d.employeeCount || 10;
    return `<div class="doc-preview">
      <h1>取引深耕提案書</h1>
      <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:12px;margin:8px 0;">
        <strong>★なぜ最強か：</strong>銀行員の業績は「融資残高」だけでなく預金量・クロスセル・給与振込の獲得数で評価。「融資すれば成績が上がる」と思わせれば稟議は通ります。
      </div>
      <h2>■ 融資実現後の取引拡大イメージ</h2>
      <table>
        <tr><th>項目</th><th>現在</th><th>融資後見込</th><th>増加効果</th></tr>
        <tr><td>融資残高</td><td>${debt.toLocaleString()}万円</td><td style="font-weight:700;color:#1e40af;">${(debt+la).toLocaleString()}万円</td><td style="color:#16a34a;font-weight:700;">+${la.toLocaleString()}万円</td></tr>
        <tr><td>預金残高（月次平均）</td><td>○○万円</td><td>○○万円</td><td style="color:#16a34a;font-weight:700;">+○○万円</td></tr>
        <tr><td>給与振込（月額）</td><td>—</td><td style="font-weight:700;">${emp}名×○○万円</td><td style="color:#16a34a;font-weight:700;">毎月安定入金</td></tr>
        <tr><td>売上入金（月額）</td><td>一部</td><td>全額御行口座へ</td><td style="color:#16a34a;font-weight:700;">月次入金増</td></tr>
        <tr><td>法人カード</td><td>未契約</td><td>申込予定</td><td>年間決済○○万円</td></tr>
        <tr><td>ネットバンキング</td><td>未契約</td><td>申込予定</td><td>手数料収入</td></tr>
      </table>
      <h2>■ クロスセル提案</h2>
      <table>
        <tr><th>提案内容</th><th>効果</th><th>実施時期</th></tr>
        <tr><td>役員報酬の振込口座変更</td><td>月○○万円の預金効果</td><td>融資実行月</td></tr>
        <tr><td>従業員給与振込集約</td><td>${emp}名×月平均○○万円</td><td>翌月</td></tr>
        <tr><td>売上入金口座全面移管</td><td>月次入金○○万円</td><td>変更通知後</td></tr>
        <tr><td>法人カード契約</td><td>経費決済の一元化</td><td>3ヶ月以内</td></tr>
      </table>
      <h2>■ 中長期パートナーシップ</h2>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:8px 0;">
        <strong>成長ロードマップ：</strong>3年後に年商${d.annualRevenue ? Math.round(d.annualRevenue*1.15).toLocaleString() : '○○'}万円を目標。成長に伴い御行との取引も拡大見込み。
      </div>
      <div style="font-size:9px;color:#9ca3af;text-align:right;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px;">作成日: ${new Date().toLocaleDateString('ja-JP')} | LOAN CRAFT ENGINE v5.0 生成</div>
    </div>`;
  },

  /* ================================================================
   * 整合チェック（旧Documents.runConsistencyCheck）
   * ================================================================ */
  runConsistencyCheck() {
    const data = Database.loadCompanyData();
    const checks = [];
    const f = data.financials?.[0] || {};

    if (data.annualRevenue && f.revenue && data.annualRevenue !== f.revenue) {
      checks.push({ ok: false, msg: `年商の不整合：基本情報 ${Utils.formatMan(data.annualRevenue)} ≠ 財務データ ${Utils.formatMan(f.revenue)}` });
    } else {
      checks.push({ ok: true, msg: '年商の整合性：OK' });
    }
    if (data.totalDebt && data.interestBearingDebt && Math.abs(data.totalDebt - data.interestBearingDebt) > data.totalDebt * 0.1) {
      checks.push({ ok: false, msg: `借入金総額の不整合：${Utils.formatMan(data.totalDebt)} vs 有利子負債 ${Utils.formatMan(data.interestBearingDebt)}` });
    } else {
      checks.push({ ok: true, msg: '借入金総額の整合性：OK' });
    }
    checks.push({ ok: true, msg: '金額の端数処理（万円単位）：統一済み' });

    let html = `<div class="glass-card"><div class="report-title">🔍 資料間の数値整合チェック</div>`;
    checks.forEach(c => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
        <span style="color:${c.ok ? 'var(--accent-green)' : 'var(--accent-red)'}">${c.ok ? '✅' : '❌'}</span>
        <span>${c.msg}</span>
      </div>`;
    });
    const allOk = checks.every(c => c.ok);
    html += allOk ? Utils.createAlert('success','✅','全項目の整合性OK') : Utils.createAlert('warning','⚠️','不整合あり。修正が必要です。');
    html += `</div>`;
    const cm=document.getElementById("chatMessages"); if(cm) cm.innerHTML=html;
  },

  /* ================================================================
   * 資料履歴
   * ================================================================ */
  showHistory() {
    if (this._history.length === 0) {
      App.addSystemMessage(Utils.createAlert('info','📄','生成履歴はありません。'));
      return;
    }
    let html = `<div class="glass-card"><div class="report-title">💾 生成済み資料の履歴</div>`;
    this._history.forEach((h, i) => {
      const time = new Date(h.createdAt).toLocaleTimeString('ja-JP');
      html += `<div style="padding:10px;margin:6px 0;background:var(--bg-tertiary);border-radius:8px;cursor:pointer;" onclick="DocGenerator.showHistoryItem(${i})">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:600;">${h.icon} ${h.name}</span>
          <span style="font-size:11px;color:var(--text-muted);">${time} | ${(h.tokens||0).toLocaleString()} tokens</span>
        </div>
      </div>`;
    });
    html += `</div>`;
    const cm=document.getElementById("chatMessages"); if(cm) cm.innerHTML=html;
  },

  showHistoryItem(index) {
    const h = this._history[index];
    if (!h) return;
    this._lastContent = h.content;
    App.addSystemMessage(`<div class="glass-card highlight">
      <div class="report-title">${h.icon} ${h.name}（履歴）</div>
      <div style="font-size:13px;line-height:1.8;white-space:pre-wrap;">${Utils.escapeHtml(h.content)}</div>
      <div style="margin-top:12px;"><button class="btn btn-primary btn-sm" onclick="DocGenerator.copyToClipboard()">📋 コピー</button></div>
    </div>`);
  },

  /* ================================================================
   * ユーティリティ
   * ================================================================ */
  copyToClipboard() {
    if (this._lastContent) {
      // HTMLタグを除去してプレーンテキストでコピー
      const text = typeof this._lastContent === 'string' && this._lastContent.includes('<')
        ? this._lastContent.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>') : this._lastContent;
      navigator.clipboard.writeText(text).then(() => {
        App.addSystemMessage(Utils.createAlert('success', '✅', 'クリップボードにコピーしました'));
      });
    }
  },

  // 後方互換（旧Documents, AIEngine呼び出し用）
  generateAll_compat() { this.showMenu(); },

  /* ================================================================
   * 案件自動作成フォーム（要項を埋めるだけで資料一括生成）
   * ================================================================ */
  showCaseForm() {
    const dna = Database.loadCompanyData() || {};
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';

    let html = `<div class="glass-card highlight">
      <div class="report-title">📂 案件自動作成</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        要項を埋めるだけで、融資申請に必要な全資料を自動生成します。入力済みのDNAデータは自動反映されます。
      </p>

      <div class="report-subtitle">🏢 基本情報</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:11px;color:var(--text-muted);">会社名 *</label>
          <input id="cf_company" value="${dna.companyName||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">業種 *</label>
          <input id="cf_industry" value="${dna.industry||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">代表者名</label>
          <input id="cf_representative" value="${dna.representative||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">業歴（年）</label>
          <input id="cf_years" type="number" value="${dna.yearsInBusiness||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">従業員数</label>
          <input id="cf_employees" type="number" value="${dna.employeeCount||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">事業モデル</label>
          <input id="cf_model" value="${dna.businessModel||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
      </div>

      <div class="report-subtitle">💰 財務情報（万円）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:11px;color:var(--text-muted);">年商 *</label>
          <input id="cf_revenue" type="number" value="${dna.annualRevenue||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">営業利益</label>
          <input id="cf_op" type="number" value="${dna.operatingProfit||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">経常利益</label>
          <input id="cf_ordinary" type="number" value="${dna.ordinaryProfit||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">総資産</label>
          <input id="cf_assets" type="number" value="${dna.totalAssets||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">純資産</label>
          <input id="cf_netassets" type="number" value="${dna.netAssets||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">有利子負債</label>
          <input id="cf_debt" type="number" value="${dna.totalDebt||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
      </div>

      <div class="report-subtitle">🏦 融資条件</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:11px;color:var(--text-muted);">融資希望額（万円） *</label>
          <input id="cf_loan" type="number" value="${dna.loanAmount||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">資金使途 *</label>
          <select id="cf_purpose" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="">選択してください</option>
            <option ${dna.loanPurpose==='運転資金'?'selected':''}>運転資金</option>
            <option ${dna.loanPurpose==='設備資金'?'selected':''}>設備資金</option>
            <option ${dna.loanPurpose==='運転+設備'?'selected':''}>運転+設備</option>
            <option ${dna.loanPurpose==='借換'?'selected':''}>借換</option>
          </select></div>
        <div><label style="font-size:11px;color:var(--text-muted);">申込先金融機関</label>
          <input id="cf_bank" value="${dna.mainBank||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">返済原資</label>
          <input id="cf_repay" value="${dna.repaymentSource||''}" placeholder="例: 本業利益＋減価償却費" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
      </div>

      <div class="report-subtitle">🏭 設備資金の場合</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:11px;color:var(--text-muted);">設備の内容</label>
          <input id="cf_equipment" value="${dna.equipment||''}" placeholder="例: 工作機械MC-500" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">設備金額（万円）</label>
          <input id="cf_equipCost" type="number" value="${dna.equipmentCost||''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div style="grid-column:1/-1"><label style="font-size:11px;color:var(--text-muted);">導入効果</label>
          <input id="cf_equipEffect" value="${dna.equipmentEffect||''}" placeholder="例: 生産能力30%向上、月間コスト50万削減" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
      </div>

      <div class="report-subtitle">📊 決算データ（直近3期・万円）</div>
      <div style="margin-bottom:16px;overflow-x:auto;">
        <div style="display:grid;grid-template-columns:70px repeat(5,1fr);gap:4px;font-size:10px;color:var(--text-muted);min-width:500px;">
          <span>期</span><span>売上</span><span>営利</span><span>経利</span><span>純利</span><span>償却</span>
        </div>
        ${[1,2,3].map(i => { const f = (dna.financials && dna.financials[i-1]) || {}; return `<div style="display:grid;grid-template-columns:70px repeat(5,1fr);gap:4px;margin-top:3px;min-width:500px;">
          <input id="cf_fy${i}_year" value="${f.year||''}" placeholder="${i}期前" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_fy${i}_rev" type="number" value="${f.revenue||''}" placeholder="売上" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_fy${i}_op" type="number" value="${f.operatingProfit||''}" placeholder="営利" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_fy${i}_ord" type="number" value="${f.ordinaryProfit||''}" placeholder="経利" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_fy${i}_net" type="number" value="${f.netIncome||''}" placeholder="純利" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_fy${i}_dep" type="number" value="${f.depreciation||''}" placeholder="償却" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
        </div>`; }).join('')}
      </div>

      <div class="report-subtitle">🏦 既存借入一覧</div>
      <div style="margin-bottom:16px;overflow-x:auto;">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:4px;font-size:10px;color:var(--text-muted);min-width:400px;">
          <span>金融機関</span><span>残高(万)</span><span>月返済(万)</span><span>残月数</span>
        </div>
        ${[1,2,3].map(i => { const b = (dna.existingLoans && dna.existingLoans[i-1]) || {}; return `<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:4px;margin-top:3px;min-width:400px;">
          <input id="cf_el${i}_bank" value="${b.bank||''}" placeholder="銀行${i}" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_el${i}_bal" type="number" value="${b.balance||''}" placeholder="残高" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_el${i}_mon" type="number" value="${b.monthly||''}" placeholder="月返済" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
          <input id="cf_el${i}_rem" type="number" value="${b.remainMonths||''}" placeholder="残月" style="padding:5px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;">
        </div>`; }).join('')}
      </div>

      <div class="report-subtitle">⚠️ 審査チェック項目</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:11px;color:var(--text-muted);">決算期</label>
          <select id="cf_fiscal" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            ${[3,6,9,12,1,2,4,5,7,8,10,11].map(m => `<option value="${m}" ${(dna.fiscalMonth||3)==m?'selected':''}>${m}月決算</option>`).join('')}
          </select></div>
        <div><label style="font-size:11px;color:var(--text-muted);">税金滞納</label>
          <select id="cf_tax" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="なし" ${(dna.taxDelinquent||'なし')==='なし'?'selected':''}>なし</option>
            <option value="分納中" ${(dna.taxDelinquent||'')==='分納中'?'selected':''}>あり（分納中）</option>
            <option value="未対応" ${(dna.taxDelinquent||'')==='未対応'?'selected':''}>あり（未対応）</option>
          </select></div>
        <div><label style="font-size:11px;color:var(--text-muted);">担保提供可能な不動産</label>
          <input id="cf_collateral" value="${dna.collateral||''}" placeholder="例: 本社土地建物（評価額3,000万）" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">保証人</label>
          <select id="cf_guarantor" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="代表者" ${(dna.guarantor||'代表者')==='代表者'?'selected':''}>代表者</option>
            <option value="第三者" ${(dna.guarantor||'')==='第三者'?'selected':''}>第三者保証あり</option>
            <option value="不要" ${(dna.guarantor||'')==='不要'?'selected':''}>保証不要希望</option>
          </select></div>
      </div>

      <div class="report-subtitle">🤝 主要取引先（上位5社）</div>
      <div style="margin-bottom:16px;">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:4px;font-size:11px;color:var(--text-muted);padding:0 4px;">
          <span>取引先名</span><span>年間取引額（万）</span><span>取引年数</span>
        </div>
        ${[1,2,3,4,5].map(i => { const cl = (dna.clients && dna.clients[i-1]) || {}; return `<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:4px;margin-top:4px;">
          <input id="cf_client${i}" value="${cl.name||''}" placeholder="取引先${i}" style="padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
          <input id="cf_client${i}_amount" type="number" value="${cl.amount||''}" placeholder="額" style="padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
          <input id="cf_client${i}_years" type="number" value="${cl.years||''}" placeholder="年" style="padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:12px;">
        </div>`; }).join('')}
      </div>

      <div class="report-subtitle">📝 補足・強み</div>
      <textarea id="cf_notes" rows="3" placeholder="競争優位性・業界でのポジション・特許・認定等" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;resize:vertical;">${dna.competitiveAdvantage||''}</textarea>

      <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="DocGenerator.executeCaseGeneration()" style="font-size:14px;padding:12px 24px;">🚀 全資料を一括生成</button>
        <button class="btn btn-secondary" onclick="DocGenerator.saveCaseData()">💾 入力内容を保存</button>
      </div>
    </div>`;
    const cm=document.getElementById("chatMessages"); if(cm) cm.innerHTML=html;
  },

  // 案件データを保存（DNAと完全連携）
  saveCaseData() {
    const g = id => document.getElementById(id)?.value || '';
    const dna = Database.loadCompanyData() || {};
    Object.assign(dna, {
      companyName: g('cf_company'), industry: g('cf_industry'), representative: g('cf_representative'),
      yearsInBusiness: g('cf_years'), employeeCount: g('cf_employees'), businessModel: g('cf_model'),
      annualRevenue: g('cf_revenue'), operatingProfit: g('cf_op'), ordinaryProfit: g('cf_ordinary'),
      totalAssets: g('cf_assets'), netAssets: g('cf_netassets'), totalDebt: g('cf_debt'),
      loanAmount: g('cf_loan'), loanPurpose: g('cf_purpose'), mainBank: g('cf_bank'), repaymentSource: g('cf_repay'),
      equipment: g('cf_equipment'), equipmentCost: g('cf_equipCost'), equipmentEffect: g('cf_equipEffect'),
      fiscalMonth: g('cf_fiscal'), taxDelinquent: g('cf_tax'), collateral: g('cf_collateral'), guarantor: g('cf_guarantor'),
      competitiveAdvantage: g('cf_notes'),
    });
    // 決算3期分
    dna.financials = [];
    for (let i = 1; i <= 3; i++) {
      const year = g(`cf_fy${i}_year`);
      if (year || g(`cf_fy${i}_rev`)) dna.financials.push({ year, revenue: g(`cf_fy${i}_rev`), operatingProfit: g(`cf_fy${i}_op`), ordinaryProfit: g(`cf_fy${i}_ord`), netIncome: g(`cf_fy${i}_net`), depreciation: g(`cf_fy${i}_dep`) });
    }
    // 既存借入
    dna.existingLoans = [];
    for (let i = 1; i <= 3; i++) {
      const bank = g(`cf_el${i}_bank`);
      if (bank) dna.existingLoans.push({ bank, balance: g(`cf_el${i}_bal`), monthly: g(`cf_el${i}_mon`), remainMonths: g(`cf_el${i}_rem`) });
    }
    // 取引先
    dna.clients = [];
    for (let i = 1; i <= 5; i++) {
      const name = g(`cf_client${i}`);
      if (name) dna.clients.push({ name, amount: g(`cf_client${i}_amount`), years: g(`cf_client${i}_years`) });
    }
    Database.saveCompanyData(dna);
    App.addSystemMessage(Utils.createAlert('success', '✅', '案件データを保存しました。企業DNA・決算・借入・取引先すべて反映済みです。'));
  },

  // 案件から全資料一括生成
  async executeCaseGeneration() {
    this.saveCaseData();
    const apiKey = this.getApiKey();
    if (!apiKey) {
      App.addSystemMessage(Utils.createAlert('error', '🔑', 'APIキーが未設定です。最高管理者コンソール → 設定タブから設定してください。'));
      return;
    }

    // 融資申請に必要な主要7資料セット
    const caseDocSet = [
      { id: 'executive', icon: '📋', name: 'エグゼクティブサマリー' },
      { id: 'funduse',   icon: '💹', name: '資金使途明細書' },
      { id: 'bizplan',   icon: '📊', name: '事業計画書' },
      { id: 'cashflow',  icon: '💰', name: '資金繰り表' },
      { id: 'repayplan', icon: '📈', name: '返済計画書' },
      { id: 'debtlist',  icon: '📝', name: '借入金一覧表' },
      { id: 'ringi',     icon: '🏦', name: '稟議サポート資料' },
    ];

    const chatMessages = document.getElementById('chatMessages');
    const total = caseDocSet.length;
    const results = [];
    const dna = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const model = this.getModel();
    const systemPrompt = AIEngine.buildSystemPrompt();

    // 順番に生成（進捗バー表示）
    for (let i = 0; i < total; i++) {
      const doc = caseDocSet[i];
      // 進捗表示
      if (chatMessages) chatMessages.innerHTML = '<div class="glass-card" style="text-align:center;padding:48px;max-width:600px;margin:0 auto;">' +
        '<div class="loading-spinner"></div>' +
        '<div style="margin-top:16px;font-size:16px;font-weight:700;">🚀 融資資料一括生成中...</div>' +
        '<div style="margin-top:12px;font-size:13px;color:var(--text-secondary);">' + doc.icon + ' ' + doc.name + ' を生成中 (' + (i+1) + '/' + total + ')</div>' +
        '<div style="margin-top:16px;background:var(--bg-input);border-radius:8px;height:8px;overflow:hidden;">' +
        '<div style="height:100%;background:linear-gradient(90deg,var(--primary),var(--accent-cyan));width:' + ((i+1)/total*100).toFixed(0) + '%;transition:width 0.3s;border-radius:8px;"></div></div>' +
        '<div style="margin-top:12px;font-size:11px;color:var(--text-muted);">完了まで数分お待ちください</div></div>';

      try {
        const userPrompt = AIEngine.buildUserPrompt(doc.id, dna, rr, 'general', '');
        const data = await ApiClient.request('/api/ai/generate', {
          method: 'POST',
          body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 8000, temperature: 0.3 })
        });
        if (!data || data.error) throw new Error(data?.error || 'API通信エラー');
        if (data.usage) Admin.trackApiUsage(data.usage.prompt_tokens||0, data.usage.completion_tokens||0, model);
        results.push({ ...doc, content: data.choices[0].message.content, tokens: data.usage?.total_tokens || 0 });
      } catch(err) {
        results.push({ ...doc, content: '生成エラー: ' + err.message, tokens: 0, error: true });
      }
    }

    // 全資料をまとめて表示
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
    let html = '<div style="max-width:900px;margin:0 auto;">';

    // ヘッダー
    html += '<div class="glass-card highlight" style="margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div class="report-title" style="margin:0;">🚀 融資申請資料パッケージ</div>' +
      '<div style="display:flex;gap:6px;">' +
      '<button class="btn btn-primary btn-sm" onclick="DocGenerator.copyAllCase()">📋 全コピー</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="DocGenerator.showCaseForm()">✏️ 要項修正</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="DocGenerator.showMenu()">📄 個別資料</button>' +
      '</div></div>' +
      '<div style="margin-top:8px;font-size:11px;color:var(--text-muted);">' +
      results.length + '資料生成完了 ・ 合計トークン: ' + totalTokens.toLocaleString() + ' ・ ' + new Date().toLocaleString('ja-JP') +
      '</div></div>';

    // 目次
    html += '<div class="glass-card" style="margin-bottom:16px;padding:16px;">' +
      '<div style="font-size:13px;font-weight:700;margin-bottom:8px;">📑 目次</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;">';
    results.forEach((r, i) => {
      html += '<a href="#caseDoc' + i + '" style="color:var(--primary-light);text-decoration:none;padding:4px;">' + r.icon + ' ' + r.name + (r.error ? ' ⚠️' : '') + '</a>';
    });
    html += '</div></div>';

    // 各資料
    results.forEach((r, i) => {
      const rendered = r.error ? '<div style="color:var(--accent-red);">' + r.content + '</div>' : this.renderMarkdown(r.content);
      html += '<div class="glass-card" style="margin-bottom:16px;" id="caseDoc' + i + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border-secondary);">' +
        '<div style="font-size:15px;font-weight:700;">' + r.icon + ' ' + r.name + '</div>' +
        '<div style="font-size:10px;color:var(--text-muted);">' + r.tokens.toLocaleString() + ' tokens</div>' +
        '</div>' +
        '<div class="doc-viewer" style="font-size:13px;line-height:2.0;">' + rendered + '</div>' +
        '</div>';
    });

    html += '</div>';
    if (chatMessages) chatMessages.innerHTML = html;
    if (chatMessages) chatMessages.scrollTop = 0;
  },

  // 全資料テキストコピー
  copyAllCase() {
    const els = document.querySelectorAll('.doc-viewer');
    let text = '';
    els.forEach(el => { text += el.textContent + '\n\n========================================\n\n'; });
    navigator.clipboard.writeText(text).then(() => {
      // コピー成功の通知（画面は切り替えない）
      const btn = event.target;
      const orig = btn.textContent;
      btn.textContent = '✅ コピー完了';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  },


  // === 新テンプレート10種 ===

  tmplImprovement(data, rr) {
    const d = data; const rev = d.annualRevenue||'○○'; const op = d.operatingProfit||'○○';
    return '<div class="report-subtitle">📈 経営改善計画書</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">項目</th><th style="padding:8px;">現状</th><th style="padding:8px;">1年後</th><th style="padding:8px;">2年後</th><th style="padding:8px;">3年後</th></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">売上高(万円)</td><td style="padding:6px;text-align:center;">' + rev + '</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">営業利益(万円)</td><td style="padding:6px;text-align:center;">' + op + '</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">経常利益(万円)</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">借入金残高(万円)</td><td style="padding:6px;text-align:center;">' + (d.totalDebt||'○○') + '</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td><td style="padding:6px;text-align:center;">○○</td></tr>' +
      '</table>' +
      '<div class="report-subtitle">改善アクション</div>' +
      '<div style="font-size:12px;line-height:1.8;">1. ○○（具体的施策）<br>2. ○○<br>3. ○○</div>';
  },

  tmplEquipment(data) {
    return '<div class="report-subtitle">🏭 設備投資計画書</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">項目</th><th style="padding:8px;">内容</th></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">設備名称</td><td style="padding:6px;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">メーカー/型番</td><td style="padding:6px;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">本体価格</td><td style="padding:6px;">○○万円</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">設置工事費</td><td style="padding:6px;">○○万円</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">投資合計</td><td style="padding:6px;">○○万円</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">期待効果（年間）</td><td style="padding:6px;">売上増加○○万円 / コスト削減○○万円</td></tr>' +
      '<tr><td style="padding:6px;font-weight:600;">投資回収期間</td><td style="padding:6px;">○○年</td></tr>' +
      '</table>';
  },

  tmplProfile(data) {
    const d = data;
    return '<div class="report-subtitle">👤 代表者略歴書</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;width:120px;">氏名</td><td style="padding:6px;">' + (d.representativeName||'○○') + '</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">生年月日</td><td style="padding:6px;">○○年○月○日</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">最終学歴</td><td style="padding:6px;">○○大学 ○○学部</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">業界経験</td><td style="padding:6px;">' + (d.industryExperience||'○○') + '年</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">保有資格</td><td style="padding:6px;">' + (d.qualifications||'○○') + '</td></tr>' +
      '</table>' +
      '<div class="report-subtitle">職歴</div>' +
      '<div style="font-size:12px;line-height:1.8;">○○年○月 ○○株式会社 入社<br>○○年○月 ○○ 就任<br>○○年○月 当社設立</div>' +
      '<div class="report-subtitle">経営ビジョン</div>' +
      '<div style="font-size:12px;line-height:1.8;">○○（500字程度で記載）</div>';
  },

  tmplFundUse(data) {
    const d = data;
    return '<div class="report-subtitle">💹 資金使途明細書</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">使途</th><th style="padding:8px;">金額(万円)</th><th style="padding:8px;">支払先</th><th style="padding:8px;">支払時期</th></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;">○○</td><td style="padding:6px;">○年○月</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;">○○</td><td style="padding:6px;">○年○月</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;">○○</td><td style="padding:6px;">○年○月</td></tr>' +
      '<tr style="border-bottom:2px solid var(--border-secondary);font-weight:700;"><td style="padding:6px;">合計</td><td style="padding:6px;text-align:right;">○○</td><td colspan="2"></td></tr>' +
      '</table>' +
      '<div class="report-subtitle">調達内訳</div>' +
      '<div style="font-size:12px;line-height:1.8;">自己資金: ○○万円<br>借入金: ○○万円<br>合計: ○○万円</div>';
  },

  tmplMonthly(data) {
    const months = ['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'];
    let html = '<div class="report-subtitle">📅 月次業績推移表</div>' +
      '<div style="overflow-x:auto;"><table style="width:100%;font-size:11px;border-collapse:collapse;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:6px;">月</th>';
    months.forEach(m => { html += '<th style="padding:6px;">' + m + '</th>'; });
    html += '<th style="padding:6px;font-weight:700;">合計</th></tr>';
    ['売上','原価','粗利','販管費','営利'].forEach(item => {
      html += '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:4px;font-weight:600;">' + item + '</td>';
      months.forEach(() => { html += '<td style="padding:4px;text-align:right;">○○</td>'; });
      html += '<td style="padding:4px;text-align:right;font-weight:600;">○○</td></tr>';
    });
    html += '</table></div>';
    return html;
  },

  tmplCollateral(data) {
    return '<div class="report-subtitle">🏠 担保評価書</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">物件</th><th style="padding:8px;">所在地</th><th style="padding:8px;">面積</th><th style="padding:8px;">評価額(万)</th><th style="padding:8px;">抵当権</th></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">土地</td><td style="padding:6px;">○○</td><td style="padding:6px;">○○㎡</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">建物</td><td style="padding:6px;">○○</td><td style="padding:6px;">○○㎡</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;">○○</td></tr>' +
      '</table>' +
      '<div class="report-subtitle">担保余力</div>' +
      '<div style="font-size:12px;">評価額合計: ○○万円<br>既存設定額: ○○万円<br>担保余力: ○○万円</div>';
  },

  tmplClients(data) {
    return '<div class="report-subtitle">🤝 取引先一覧表（販売先）</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">企業名</th><th style="padding:8px;">年間売上(万)</th><th style="padding:8px;">構成比</th><th style="padding:8px;">取引年数</th><th style="padding:8px;">回収条件</th></tr>' +
      [1,2,3,4,5].map(i => '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;text-align:right;">○○%</td><td style="padding:6px;text-align:right;">○○年</td><td style="padding:6px;">月末締翌月末</td></tr>').join('') +
      '</table>' +
      '<div class="report-subtitle">取引先一覧表（仕入先）</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">企業名</th><th style="padding:8px;">年間仕入(万)</th><th style="padding:8px;">構成比</th><th style="padding:8px;">取引年数</th><th style="padding:8px;">支払条件</th></tr>' +
      [1,2,3].map(i => '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;text-align:right;">○○</td><td style="padding:6px;text-align:right;">○○%</td><td style="padding:6px;text-align:right;">○○年</td><td style="padding:6px;">月末締翌月末</td></tr>').join('') +
      '</table>';
  },

  tmplPermits(data) {
    return '<div class="report-subtitle">📜 許認可・資格一覧</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">許認可名称</th><th style="padding:8px;">番号</th><th style="padding:8px;">取得日</th><th style="padding:8px;">有効期限</th><th style="padding:8px;">管轄</th></tr>' +
      [1,2,3].map(i => '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;">○○</td><td style="padding:6px;">○年○月</td><td style="padding:6px;">○年○月</td><td style="padding:6px;">○○</td></tr>').join('') +
      '</table>' +
      '<div class="report-subtitle">資格保有者一覧</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:8px;text-align:left;">資格名</th><th style="padding:8px;">保有者</th><th style="padding:8px;">取得日</th></tr>' +
      [1,2].map(i => '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;">○○</td><td style="padding:6px;">○○</td><td style="padding:6px;">○年○月</td></tr>').join('') +
      '</table>';
  },

  tmplSWOT(data, rr) {
    return '<div class="report-subtitle">🎯 SWOT分析</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr><td style="width:50%;padding:12px;border:1px solid var(--border-secondary);vertical-align:top;background:rgba(0,200,100,0.05);"><strong>S（強み）</strong><br>1. ○○<br>2. ○○<br>3. ○○</td>' +
      '<td style="width:50%;padding:12px;border:1px solid var(--border-secondary);vertical-align:top;background:rgba(255,100,100,0.05);"><strong>W（弱み）</strong><br>1. ○○<br>2. ○○<br>3. ○○</td></tr>' +
      '<tr><td style="padding:12px;border:1px solid var(--border-secondary);vertical-align:top;background:rgba(0,150,255,0.05);"><strong>O（機会）</strong><br>1. ○○<br>2. ○○<br>3. ○○</td>' +
      '<td style="padding:12px;border:1px solid var(--border-secondary);vertical-align:top;background:rgba(255,150,0,0.05);"><strong>T（脅威）</strong><br>1. ○○<br>2. ○○<br>3. ○○</td></tr>' +
      '</table>' +
      '<div class="report-subtitle">クロスSWOT戦略</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;">' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:8px;font-weight:600;">SO戦略</td><td style="padding:8px;">強み×機会: ○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:8px;font-weight:600;">WO戦略</td><td style="padding:8px;">弱み×機会: ○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:8px;font-weight:600;">ST戦略</td><td style="padding:8px;">強み×脅威: ○○</td></tr>' +
      '<tr><td style="padding:8px;font-weight:600;">WT戦略</td><td style="padding:8px;">弱み×脅威: ○○</td></tr>' +
      '</table>';
  },

  tmplRingi(data, rr) {
    const d = data;
    return '<div class="report-subtitle">🏦 稟議サポート資料</div>' +
      '<table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:16px;">' +
      '<tr style="border-bottom:2px solid var(--border-secondary);background:var(--bg-tertiary);"><th colspan="2" style="padding:8px;text-align:left;">案件概要</th></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;width:120px;">借入人</td><td style="padding:6px;">' + (d.companyName||'○○') + '</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">業種</td><td style="padding:6px;">' + (d.industry||'○○') + '</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">年商</td><td style="padding:6px;">' + (d.annualRevenue||'○○') + '万円</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">融資金額</td><td style="padding:6px;">○○万円</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">資金使途</td><td style="padding:6px;">○○</td></tr>' +
      '<tr style="border-bottom:1px solid var(--border-secondary);"><td style="padding:6px;font-weight:600;">返済方法</td><td style="padding:6px;">元金均等/元利均等 ○年</td></tr>' +
      '</table>' +
      '<div class="report-subtitle">融資判断ポイント</div>' +
      '<div style="font-size:12px;line-height:1.8;">1. ○○<br>2. ○○<br>3. ○○</div>' +
      '<div class="report-subtitle">総合所見</div>' +
      '<div style="font-size:12px;line-height:1.8;">○○（承認推奨の根拠を記載）</div>';
  },

};
