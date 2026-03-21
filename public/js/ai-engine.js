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
      // サーバーAPI可能ならプロキシ経由
      let data;
      if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
        data = await ApiClient.generateAI({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 4000, temperature: 0.4 });
      } else {
        // ローカルから直接API呼出
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 4000, temperature: 0.4 })
        });
        data = await response.json();
        if (data.error) throw new Error(data.error.message);
        // ローカル使用量記録
        if (data.usage) Admin.trackApiUsage(data.usage.prompt_tokens || 0, data.usage.completion_tokens || 0, model);
      }

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
    return `あなたは中小企業融資の専門家です。20年以上の実務経験を持つ5名の知見を統合しています。生成する資料は銀行審査者向けにプロフェッショナルかつ実務的な内容にしてください。日本語で回答。`;
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

    const prompts = {
      summary: `以下の企業情報を基に、銀行提出用「エグゼクティブサマリー」を作成（A4 1枚）。\n\n${context}`,
      plan: `以下の企業情報を基に「事業計画書」ドラフトを作成。事業概要・市場分析・収支計画・資金計画を含む。\n\n${context}`,
      qa: `以下の企業情報を基に、銀行面談の「想定Q&A集」を15問作成。\n\n${context}`,
      meeting: `以下の企業情報を基に「銀行面談準備シート」を作成。流れ・持ち物・NG集・シナリオ含む。\n\n${context}`,
      repayment: `以下の企業情報を基に「返済計画書」を作成。返済原資・月次シミュレーション含む。\n\n${context}`,
      strategy: `以下の企業情報を基に「融資戦略レポート」を作成。金融機関の優先順・金額配分・タイムライン含む。\n\n${context}`,
    };
    let prompt = prompts[docType] || `以下の企業情報を基に融資関連資料を作成。\n\n${context}`;
    if (customPrompt) prompt += `\n\n【追加指示】\n${customPrompt}`;
    return prompt;
  },

  _lastContent: ''
};
