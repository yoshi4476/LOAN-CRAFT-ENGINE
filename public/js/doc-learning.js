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
        <div>
          <label style="font-size:12px;font-weight:600;">📎 提出資料のアップロード（任意）</label>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">提出した資料をアップロードすると、内容をAI学習に反映します。PDF・テキスト・画像に対応。</div>
          <div id="learnUploadZone" style="border:2px dashed var(--border-primary);border-radius:8px;padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;" ondragover="event.preventDefault();this.style.borderColor='var(--primary)';this.style.background='var(--bg-active)'" ondragleave="this.style.borderColor='var(--border-primary)';this.style.background='transparent'" ondrop="DocLearning.handleDrop(event)" onclick="document.getElementById('learnFileInput').click()">
            <div style="font-size:24px;margin-bottom:8px;">📄</div>
            <div style="font-size:13px;color:var(--text-secondary);">クリックまたはドラッグ＆ドロップ</div>
            <div style="font-size:11px;color:var(--text-muted);">PDF / TXT / DOC / 画像（JPG, PNG）</div>
            <input id="learnFileInput" type="file" multiple accept=".pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.csv" style="display:none;" onchange="DocLearning.handleFiles(this.files)">
          </div>
          <div id="learnUploadedFiles" style="margin-top:8px;"></div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;">📝 テキストで学習（ノウハウ・メモなど直接入力）</label>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">融資のコツ、審査のポイント、交渉テクニックなど、テキストで直接学習データを入力できます。</div>
          <textarea id="learnTextInput" rows="4" placeholder="例: 信用保証協会付き融資の場合、保証料は融資額の0.5〜2.0%が目安。保証料を前払いする場合は融資額に上乗せ可能。" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:8px;color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;">🏷️ カテゴリ（任意）</label>
          <select id="learnCategory" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="">-- カテゴリを選択 --</option>
            <option value="審査基準">審査基準</option>
            <option value="交渉テクニック">交渉テクニック</option>
            <option value="書類作成">書類作成</option>
            <option value="制度融資">制度融資</option>
            <option value="保証協会">保証協会</option>
            <option value="金利・条件">金利・条件</option>
            <option value="面談対策">面談対策</option>
            <option value="経営改善">経営改善</option>
            <option value="財務指標">財務指標</option>
            <option value="その他">その他</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="DocLearning.registerCase()">💾 結果を登録</button>
        <button class="btn btn-secondary" onclick="DocLearning.registerTextKnowledge()">📝 テキスト知識を登録</button>
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

    // 知識ベース表示
    const knowledge = data.knowledge || [];
    if (knowledge.length > 0) {
      html += `<h3 style="margin-top:20px;">📚 知識ベース (${knowledge.length}件)</h3>
        <div style="max-height:300px;overflow-y:auto;">`;
      const categories = [...new Set(knowledge.map(k => k.category))];
      categories.forEach(cat => {
        const items = knowledge.filter(k => k.category === cat);
        html += `<div style="margin:8px 0;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);margin-bottom:4px;">🏷️ ${cat} (${items.length}件)</div>`;
        items.slice(-5).forEach(k => {
          html += `<div style="font-size:12px;padding:6px 10px;margin:3px 0;background:var(--bg-tertiary);border-radius:6px;line-height:1.6;border-left:3px solid var(--accent-cyan);">${k.text.substring(0, 150)}${k.text.length > 150 ? '...' : ''}</div>`;
        });
        if (items.length > 5) html += `<div style="font-size:11px;color:var(--text-muted);text-align:right;">他 ${items.length - 5}件</div>`;
        html += `</div>`;
      });
      html += `</div>`;
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
    const textInput = document.getElementById('learnTextInput')?.value?.trim();
    const category = document.getElementById('learnCategory')?.value;
    const savedDocs = Database.load('lce_saved_documents') || {};

    // アップロードファイルの内容をテキストとして追加
    const uploadedTexts = this._uploadedFiles
      .filter(f => f.type === 'text')
      .map(f => f.content)
      .join('\n---\n');

    const docContents = {
      ...savedDocs,
      uploadedFiles: this._uploadedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
      uploadedTexts: uploadedTexts || null,
      manualText: textInput || null,
      category: category || null
    };

    this.saveCase(result, docContents, { bank, amount, failReason, memo });
    this._uploadedFiles = []; // リセット
    App.addSystemMessage(Utils.createAlert('success', '✅',
      `${result === 'success' ? '融資成功' : '融資不可'}の結果を学習データに登録しました。` +
      (docContents.uploadedFiles.length > 0 ? `（添付資料 ${docContents.uploadedFiles.length}件を含む）` : '')
    ));
  },

  // 学習分析レポート（サーバーデータ優先）
  async showAnalysis() {
    let cases;
    // サーバーからデータ取得を試行
    if (typeof ApiClient !== 'undefined') {
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
          <div style="font-size:12px;font-weight:600;">#${i+1} ${c.tags?.bank || c.bank || '—'} | ${(c.tags?.amount || c.amount) ? (c.tags?.amount || c.amount).toLocaleString() + '万円' : '—'}</div>
          <div style="font-size:12px;margin-top:4px;"><strong>推察要因：</strong>${c.failReason || c.fail_reason || '未記入'}</div>
          ${c.uploadedFiles && c.uploadedFiles.length > 0 ? `<div style="font-size:11px;margin-top:4px;color:var(--text-muted);">📎 添付資料: ${c.uploadedFiles.length}件</div>` : ''}
        </div>`;
      });

      // AI改善提案
      html += `<div class="report-subtitle" style="margin-top:16px;">💡 次回への改善提案</div>
        <div style="padding:12px;background:var(--bg-tertiary);border-radius:8px;">`;
      const reasons = failCases.map(c => c.failReason || c.fail_reason || '').join(' ');
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
  },

  /* ================================================================
   * ファイルアップロード機能
   * ================================================================ */
  _uploadedFiles: [],

  // ドラッグ＆ドロップ処理
  handleDrop(e) {
    e.preventDefault();
    const zone = document.getElementById('learnUploadZone');
    if (zone) { zone.style.borderColor = 'var(--border-primary)'; zone.style.background = 'transparent'; }
    this.handleFiles(e.dataTransfer.files);
  },

  // ファイル読み込み
  handleFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const maxSize = 5 * 1024 * 1024; // 5MB制限

      if (file.size > maxSize) {
        App.addSystemMessage(Utils.createAlert('warning', '⚠️', `${file.name} はサイズが大きすぎます（5MB以下）`));
        return;
      }

      // テキスト系ファイル
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        reader.onload = (e) => {
          this._uploadedFiles.push({ name: file.name, type: 'text', content: e.target.result, size: file.size });
          this._renderUploadedFiles();
        };
        reader.readAsText(file, 'UTF-8');
      }
      // PDF
      else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        reader.onload = (e) => {
          this._uploadedFiles.push({ name: file.name, type: 'pdf', content: `[PDF: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]`, size: file.size });
          this._renderUploadedFiles();
        };
        reader.readAsArrayBuffer(file);
      }
      // 画像
      else if (file.type.startsWith('image/')) {
        reader.onload = (e) => {
          this._uploadedFiles.push({ name: file.name, type: 'image', content: e.target.result, size: file.size });
          this._renderUploadedFiles();
        };
        reader.readAsDataURL(file);
      }
      // その他
      else {
        this._uploadedFiles.push({ name: file.name, type: 'other', content: `[ファイル: ${file.name}]`, size: file.size });
        this._renderUploadedFiles();
      }
    });
  },

  // アップロード済みファイルの表示
  _renderUploadedFiles() {
    const container = document.getElementById('learnUploadedFiles');
    if (!container) return;
    let html = '';
    this._uploadedFiles.forEach((f, i) => {
      const icon = f.type === 'pdf' ? '📄' : f.type === 'image' ? '🖼️' : f.type === 'text' ? '📝' : '📎';
      const size = f.size < 1024 ? f.size + 'B' : (f.size / 1024).toFixed(1) + 'KB';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin:4px 0;background:var(--bg-tertiary);border-radius:6px;">
        <span>${icon}</span>
        <span style="flex:1;font-size:12px;font-weight:500;">${f.name}</span>
        <span style="font-size:11px;color:var(--text-muted);">${size}</span>
        <button style="background:none;border:none;color:var(--accent-red);cursor:pointer;font-size:14px;" onclick="DocLearning.removeFile(${i})">✕</button>
      </div>`;
    });
    container.innerHTML = html;
  },

  // ファイル削除
  removeFile(index) {
    this._uploadedFiles.splice(index, 1);
    this._renderUploadedFiles();
  },

  // テキスト知識の直接登録（融資ノウハウ等）
  saveKnowledge(text, category, source) {
    const data = this.load();
    if (!data.knowledge) data.knowledge = [];
    data.knowledge.push({
      id: Date.now() + Math.random(),
      text,
      category: category || 'その他',
      source: source || 'manual',
      createdAt: new Date().toISOString()
    });
    this.save(data);
  },

  // テキスト知識を登録（UI用）
  registerTextKnowledge() {
    const text = document.getElementById('learnTextInput')?.value?.trim();
    const category = document.getElementById('learnCategory')?.value || 'その他';
    if (!text) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'テキストを入力してください。')); return; }
    this.saveKnowledge(text, category, 'manual');
    App.addSystemMessage(Utils.createAlert('success', '✅', `知識ベースに登録しました（カテゴリ: ${category}）`));
    this.showLearningUI(); // 再表示
  },

  // 知識ベースの検索
  searchKnowledge(query) {
    const data = this.load();
    const knowledge = data.knowledge || [];
    if (!query) return knowledge;
    const q = query.toLowerCase();
    return knowledge.filter(k => k.text.toLowerCase().includes(q) || k.category.toLowerCase().includes(q));
  },

  // 初期学習データの投入（初回のみ）
  initDefaultKnowledge() {
    const data = this.load();
    if (data.knowledge && data.knowledge.length > 0) return;
    const defaults = [{"text":"銀行融資の審査では「返済能力」が最重要。返済原資は①営業キャッシュフロー（経常利益＋減価償却費）②資産売却③借換の3段階で説明する。","category":"審査基準"},{"text":"自己資本比率は最低10%以上を目指す。20%以上あれば「優良」評価。債務超過は即レッドフラグだが、役員借入金を資本性劣後ローンに認定してもらえば実態自己資本が改善する。","category":"財務指標"},{"text":"信用格付けは定量評価（財務）70%＋定性評価（経営力等）30%が一般的。定量は「安全性」「収益性」「成長性」「返済能力」の4軸。","category":"審査基準"},{"text":"借入金月商倍率（借入÷月商）は6ヶ月以内が優良、12ヶ月超は要注意。業種により基準は異なるが、銀行はこの指標を必ず見る。","category":"財務指標"},{"text":"債務償還年数（有利子負債÷営業CF）は10年以内が目安。20年超は「正常先」から「要注意先」に格下げされるリスクがある。","category":"財務指標"},{"text":"経営者保証ガイドラインに基づく無保証融資の条件：①法人と経営者の資産分離②法人のみの資産・収益力で返済可能③適時適切な情報開示。","category":"審査基準"},{"text":"事業計画書の最重要ポイントは「売上の根拠」。積み上げ方式（顧客数×単価×頻度）で、見込み顧客名まで記載できると説得力が高い。","category":"書類作成"},{"text":"金利交渉のベストタイミングは①決算後（好業績時）②他行からの融資提案があった時③借換時。「御行との関係を深めたい」という姿勢が重要。","category":"交渉テクニック"},{"text":"面談の最初の30秒で決まる。冒頭で「本日は○○のためにお時間をいただきありがとうございます。△分で簡潔にご説明します」と時間を区切る。","category":"面談対策"},{"text":"銀行担当者が最も嫌うのは「嘘」と「隠し事」。悪い情報こそ先に開示し、対策と一緒に説明する。後から発覚すると信用が崩壊する。","category":"面談対策"},{"text":"信用保証協会の保証限度額は一般保証2.8億円＋セーフティネット保証2.8億円＝最大5.6億円。ただし無担保保証は8,000万円まで。","category":"保証協会"},{"text":"マル経融資（小規模事業者経営改善資金）は無担保・無保証・低金利（約1.2%）で2,000万円まで。商工会議所の経営指導を6ヶ月以上受けることが条件。","category":"制度融資"},{"text":"日本政策金融公庫の新創業融資制度は、自己資金要件が「創業資金総額の10分の1以上」。開業前でも利用可能。","category":"制度融資"},{"text":"銀行は「メイン行」を重視。預金取引・給与振込・各種手数料を集中させることでメイン行としての関係を構築し、融資の優先度を上げる。","category":"交渉テクニック"},{"text":"試算表（月次決算書）を毎月提出している企業は銀行評価が高い。3ヶ月以上遅れると「管理体制に問題あり」と見られる。","category":"審査基準"},{"text":"融資申込時に複数行に同時申込する場合、各行に「他行にも相談中」と正直に伝える。隠すと後でCIC（信用情報）で発覚し信頼を失う。","category":"交渉テクニック"},{"text":"資金繰り表は最低12ヶ月分を作成。「いつ」「いくら」資金が必要かを月次で示す。季節変動がある業種は特に重要。","category":"書類作成"},{"text":"エグゼクティブサマリーは1ページ以内。「何を」「いくら」「なぜ」「どう返す」の4点を簡潔に。忙しい審査役がこれだけ読んでYes/Noを判断する。","category":"書類作成"},{"text":"担保評価は時価の50〜70%（掛け目）が一般的。不動産の場合、路線価ベース×70%程度。担保があると金利0.5〜1.0%下がることが多い。","category":"金利・条件"},{"text":"リスケ（返済条件変更）した場合、最低1年間は正常返済の実績を積むこと。正常返済に復帰した実績が、次の融資審査で最大の説得材料になる。","category":"経営改善"},{"text":"赤字決算でも融資は可能。ポイントは①一過性の赤字か②営業CFがプラスか③来期の黒字化計画があるか。「営業利益は黒字」が最低ライン。","category":"審査基準"},{"text":"融資の5原則：①安全性（返せるか）②収益性（銀行が儲かるか）③公共性（社会に役立つか）④成長性（将来性）⑤流動性（すぐ回収できるか）。","category":"審査基準"},{"text":"プロパー融資（保証なし）を引き出すコツ：保証協会付きで実績を積む→3〜5年の正常返済実績→プロパーへの切替を提案。段階的なアプローチが有効。","category":"交渉テクニック"},{"text":"決算書の「別表」まで見られることを前提に。特に別表4（所得計算）と別表16（減価償却）。節税のやりすぎは融資に不利になる場合がある。","category":"審査基準"},{"text":"中小企業のCRD格付け（クレジット・リスク・データベース）を意識する。年商・業種・財務指標でデフォルト確率が算出され、保証料率に反映される。","category":"審査基準"},{"text":"銀行のノルマは3月・9月（半期末）に集中。この時期は融資が通りやすい傾向がある。逆に決算直後の4月・10月はハードルが上がりやすい。","category":"交渉テクニック"},{"text":"経営力向上計画の認定を受けると、信用保証料0.1%引下げ・固定資産税の特例・金融支援が受けられる。認定は中小企業庁に申請。","category":"制度融資"},{"text":"面談で聞かれる定番3問：①なぜこの金額が必要か②どう返済するか③最悪のシナリオでどうなるか。この3つに即答できれば合格率は大幅に上がる。","category":"面談対策"},{"text":"売上高営業利益率：製造業5%以上、小売業2%以上、卸売業1%以上、建設業5%以上、IT業10%以上が銀行の「正常先」の目安。","category":"財務指標"},{"text":"資金使途は「運転資金」より「設備投資」の方が通りやすい。設備が担保になり得るし、投資→売上増→返済の流れが描きやすい。見積書・カタログ必須。","category":"審査基準"}];
    defaults.forEach(d => {
      this.saveKnowledge(d.text, d.category, 'system_default');
    });
    console.log('学習エンジン: 初期ノウハウ' + defaults.length + '件を登録');
  }
};
