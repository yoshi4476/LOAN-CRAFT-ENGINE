/* ============================================================
 * 過去資料学習モジュール
 * 成功/失敗した融資資料を保存・分析し、次回に活かす
 * ============================================================ */
const DocLearning = {
  STORAGE_KEY: 'lce_doc_learning',

  load() { return Database.load(this.STORAGE_KEY) || { cases: [] }; },
  save(data) { Database.save(this.STORAGE_KEY, data); },

  // 資料を学習データとして保存（ローカル＋サーバー同期）
  saveCase(result, docContents, tags) {
    const data = this.load();
    const newCase = {
      id: Date.now(),
      result,
      companyData: Database.loadCompanyData() || {},
      ratingResult: Database.loadRatingResult(),
      docContents,
      tags,
      failReason: result === 'fail' ? tags.failReason : null,
      createdAt: new Date().toISOString()
    };
    data.cases.push(newCase);
    this.save(data);

    // サーバー同期
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      ApiClient.saveLearningCase({
        result, bank: tags.bank, amount: tags.amount,
        fail_reason: tags.failReason, memo: tags.memo,
        company_snapshot: newCase.companyData, doc_snapshot: docContents
      }).catch(e => console.warn('学習データ同期失敗:', e));
    }
  },

  // 学習UI
  showLearningUI() {
    const data = this.load();
    const cases = data.cases || [];
    const successCount = cases.filter(c => c.result === 'success').length;
    const failCount = cases.filter(c => c.result === 'fail').length;

    let html = `<div class="glass-card highlight">
      <div class="report-title">🧠 融資資料 学習エンジン</div>
      <p style="font-size:13px;color:var(--text-secondary);">過去に提出した資料の結果を登録し、成功パターン・失敗要因を分析します。</p>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:16px 0;">
        <div class="glass-card" style="padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:var(--primary-light);">${cases.length}</div>
          <div style="font-size:11px;color:var(--text-muted);">登録済み</div>
        </div>
        <div class="glass-card" style="padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:var(--accent-green);">${successCount}</div>
          <div style="font-size:11px;color:var(--text-muted);">成功</div>
        </div>
        <div class="glass-card" style="padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:var(--accent-red);">${failCount}</div>
          <div style="font-size:11px;color:var(--text-muted);">不可</div>
        </div>
      </div>

      <h3 style="margin-top:20px;">📥 新しい結果を登録</h3>
      <div style="display:grid;gap:10px;margin-bottom:16px;">
        <div>
          <label style="font-size:12px;font-weight:600;">結果</label>
          <select id="learnResult" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="success">✅ 融資成功</option>
            <option value="fail">❌ 融資不可・見送り</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;">提出先金融機関</label>
          <input id="learnBank" type="text" placeholder="例: ○○銀行" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;">融資金額（万円）</label>
          <input id="learnAmount" type="number" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
        </div>
        <div id="learnFailReasonDiv" style="display:none;">
          <label style="font-size:12px;font-weight:600;">不可の理由（推察含む）</label>
          <textarea id="learnFailReason" rows="3" placeholder="例: 債務超過、事業計画の根拠不足 等" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;">メモ（任意）</label>
          <textarea id="learnMemo" rows="2" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="DocLearning.registerCase()">💾 結果を登録</button>
        ${cases.length > 0 ? '<button class="btn btn-secondary" onclick="DocLearning.showAnalysis()">📊 学習分析</button>' : ''}
      </div>`;

    // 過去一覧
    if (cases.length > 0) {
      html += `<h3 style="margin-top:20px;">📋 登録済み案件</h3>`;
      cases.slice().reverse().forEach(c => {
        const icon = c.result === 'success' ? '✅' : '❌';
        const color = c.result === 'success' ? 'var(--accent-green)' : 'var(--accent-red)';
        html += `<div style="display:flex;gap:8px;padding:8px;margin:4px 0;background:var(--bg-tertiary);border-radius:6px;border-left:3px solid ${color};">
          <span>${icon}</span>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">${c.tags?.bank || '—'} | ${c.tags?.amount ? c.tags.amount.toLocaleString() + '万円' : '—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${new Date(c.createdAt).toLocaleDateString('ja-JP')}</div>
            ${c.failReason ? `<div style="font-size:11px;color:var(--accent-red);">要因: ${c.failReason}</div>` : ''}
          </div>
        </div>`;
      });
    }

    html += `</div>`;
    App.addSystemMessage(html);

    // 失敗理由入力欄の表示制御
    setTimeout(() => {
      const sel = document.getElementById('learnResult');
      const div = document.getElementById('learnFailReasonDiv');
      if (sel && div) sel.addEventListener('change', () => div.style.display = sel.value === 'fail' ? 'block' : 'none');
    }, 100);
  },

  registerCase() {
    const result = document.getElementById('learnResult')?.value;
    const bank = document.getElementById('learnBank')?.value;
    const amount = parseFloat(document.getElementById('learnAmount')?.value) || 0;
    const failReason = document.getElementById('learnFailReason')?.value;
    const memo = document.getElementById('learnMemo')?.value;
    const savedDocs = Database.load('lce_saved_documents') || {};

    this.saveCase(result, savedDocs, { bank, amount, failReason, memo });
    App.addSystemMessage(Utils.createAlert('success', '✅', `${result === 'success' ? '融資成功' : '融資不可'}の結果を学習データに登録しました。`));
  },

  // 学習分析レポート（サーバーデータ優先）
  async showAnalysis() {
    let cases;
    // サーバーからデータ取得を試行
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      try {
        cases = await ApiClient.getLearningCases();
      } catch(e) { console.warn('サーバーから学習データ取得失敗:', e); }
    }
    if (!cases) {
      const data = this.load();
      cases = data.cases || [];
    }
    if (cases.length === 0) { App.addSystemMessage(Utils.createAlert('info', 'ℹ️', '学習データがありません')); return; }

    const successCases = cases.filter(c => c.result === 'success');
    const failCases = cases.filter(c => c.result === 'fail');
    const successRate = Math.round(successCases.length / cases.length * 100);

    let html = `<div class="glass-card highlight">
      <div class="report-title">📊 融資資料 学習分析レポート</div>
      <div style="text-align:center;margin:16px 0;">
        <div style="font-size:48px;font-weight:800;color:${successRate >= 70 ? 'var(--accent-green)' : 'var(--accent-gold)'};">${successRate}%</div>
        <div style="font-size:13px;color:var(--text-muted);">融資成功率（${successCases.length}/${cases.length}件）</div>
      </div>`;

    // 失敗要因の分析と改善提案
    if (failCases.length > 0) {
      html += `<div class="report-subtitle" style="color:var(--accent-red);">⚠️ 失敗要因の分析</div>`;
      failCases.forEach((c, i) => {
        html += `<div style="padding:10px;margin:6px 0;background:rgba(239,68,68,0.08);border-radius:8px;border-left:3px solid var(--accent-red);">
          <div style="font-size:12px;font-weight:600;">#${i+1} ${c.tags?.bank || '—'} | ${c.tags?.amount ? c.tags.amount.toLocaleString() + '万円' : '—'}</div>
          <div style="font-size:12px;margin-top:4px;"><strong>推察要因：</strong>${c.failReason || '未記入'}</div>
        </div>`;
      });

      // AI改善提案
      html += `<div class="report-subtitle" style="margin-top:16px;">💡 次回への改善提案</div>
        <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;">`;
      const reasons = failCases.map(c => c.failReason || '').join(' ');
      const suggestions = [];
      if (reasons.includes('債務超過') || reasons.includes('自己資本')) suggestions.push('役員借入金の資本性劣後ローン認定で実態自己資本比率を改善');
      if (reasons.includes('計画') || reasons.includes('根拠')) suggestions.push('売上計画を積み上げ方式で再構築、各数字に根拠を付記');
      if (reasons.includes('返済') || reasons.includes('CF')) suggestions.push('返済原資の多重防御（3段階バックアッププラン）を明示');
      if (reasons.includes('赤字') || reasons.includes('利益')) suggestions.push('経営改善計画を策定し黒字化のロードマップを提示');
      if (reasons.includes('滞納') || reasons.includes('税金')) suggestions.push('分納計画の履行実績を資料で証明');
      if (suggestions.length === 0) suggestions.push('エグゼクティブサマリーの完成度を高め、最初の30秒で好印象を与える');
      suggestions.forEach((s, i) => {
        html += `<div style="font-size:12px;padding:4px 0;"><span style="font-weight:700;color:var(--accent-cyan);">${i+1}.</span> ${s}</div>`;
      });
      html += `</div>`;
    }

    if (successCases.length > 0) {
      html += `<div class="report-subtitle" style="margin-top:16px;color:var(--accent-green);">✅ 成功パターンの特徴</div>
        <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;">
          <div style="font-size:12px;">成功した${successCases.length}件の共通点を分析し、次回の資料作成に自動反映します。</div>
        </div>`;
    }
    html += `</div>`;
    App.addSystemMessage(html);
  }
};
