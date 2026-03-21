/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - データベースモジュール
 * LocalStorageベースの案件データ永続化
 * ============================================================ */

const Database = {
  KEYS: {
    COMPANY_DATA: 'lce_company_data',
    RATING_RESULT: 'lce_rating_result',
    MATRIX_RESULT: 'lce_matrix_result',
    CASES: 'lce_cases',
    SETTINGS: 'lce_settings'
  },

  // --- 汎用 ---
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('保存エラー:', e);
      return false;
    }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('読込エラー:', e);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // --- 企業データ ---
  saveCompanyData(data) {
    const d = { ...data, updatedAt: new Date().toISOString() };
    this.save(this.KEYS.COMPANY_DATA, d);
    // サーバーにも非同期保存（API利用可能時）
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      ApiClient.saveCompanyData(d).catch(e => console.warn('API保存失敗:', e));
    }
    return true;
  },

  loadCompanyData() {
    return this.load(this.KEYS.COMPANY_DATA) || this.getDefaultCompanyData();
  },

  // サーバーからDNAを同期的に取得（初回ロード用）
  async syncFromServer() {
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      try {
        const serverData = await ApiClient.loadCompanyData();
        if (serverData && Object.keys(serverData).length > 0) {
          this.save(this.KEYS.COMPANY_DATA, serverData);
          return serverData;
        }
      } catch (e) { console.warn('サーバー同期失敗:', e); }
    }
    return this.loadCompanyData();
  },

  getDefaultCompanyData() {
    return {
      // STEP1：基本情報
      industry: '', yearsInBusiness: null, annualRevenue: null,
      loanAmount: null, loanPurpose: '', urgency: '',
      // STEP2：財務状況
      financials: [
        { year: '', revenue: null, operatingProfit: null, ordinaryProfit: null, netIncome: null, netAssets: null }
      ],
      totalDebt: null, lenders: [], monthlyRepayment: null,
      taxDelinquency: false, rescheduleHistory: false, negativeEquity: false,
      // STEP3：深掘り
      mainBank: '', mainBankYears: null, recentRejection: false,
      guaranteeAssocHistory: '', guaranteeBalance: null,
      collateral: '', strengths: '', outlook: '',
      ceoProfile: '', personalAssets: '',
      relatedCompanies: '', taxAdvisor: '', guaranteePreference: '',
      // 追加財務詳細
      totalAssets: null, currentAssets: null, currentLiabilities: null,
      fixedAssets: null, fixedLiabilities: null,
      interestBearingDebt: null, receivables: null, inventory: null, payables: null,
      depreciation: null, interestExpense: null, interestIncome: null,
      grossProfit: null, costOfSales: null,
      // 実態BS関連
      badReceivables: null, obsoleteInventory: null, unrecoverableAdvances: null,
      unrealizedLossSecurities: null, insuranceSurrenderValue: null,
      realEstateMarketValue: null, realEstateBookValue: null,
      officerLoanToCompany: null, officerBorrowFromCompany: null,
      retirementBenefitShortfall: null,
      // 修正CF関連
      officerCompReducible: null, insuranceReducible: null,
      otherReducibleCosts: null, minCapex: null, seasonalWorkingCapital: null,
      // ステータス
      interviewStep: 0,
      completedSteps: [],
      updatedAt: null
    };
  },

  // --- 格付け結果 ---
  saveRatingResult(result) {
    return this.save(this.KEYS.RATING_RESULT, { ...result, calculatedAt: new Date().toISOString() });
  },

  loadRatingResult() {
    return this.load(this.KEYS.RATING_RESULT);
  },

  // --- マトリックス結果 ---
  saveMatrixResult(result) {
    return this.save(this.KEYS.MATRIX_RESULT, { ...result, calculatedAt: new Date().toISOString() });
  },

  loadMatrixResult() {
    return this.load(this.KEYS.MATRIX_RESULT);
  },

  // --- 案件データベース ---
  saveCases(cases) {
    return this.save(this.KEYS.CASES, cases);
  },

  loadCases() {
    return this.load(this.KEYS.CASES) || [];
  },

  addCase(caseData) {
    const cases = this.loadCases();
    caseData.id = Utils.generateCaseId();
    caseData.createdAt = new Date().toISOString();
    cases.push(caseData);
    return this.saveCases(cases) ? caseData.id : null;
  },

  getCaseCount() {
    return this.loadCases().length;
  },

  findSimilarCases(criteria) {
    const cases = this.loadCases();
    return cases.filter(c => {
      let score = 0;
      if (c.industry === criteria.industry) score += 3;
      if (c.grade && criteria.grade) {
        const grades = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'S+'];
        const diff = Math.abs(grades.indexOf(c.grade) - grades.indexOf(criteria.grade));
        if (diff <= 1) score += 2;
      }
      if (c.annualRevenue && criteria.annualRevenue) {
        const ratio = c.annualRevenue / criteria.annualRevenue;
        if (ratio >= 0.5 && ratio <= 1.5) score += 1;
      }
      return score >= 2;
    }).sort((a, b) => (b.result === '承認' ? 1 : 0) - (a.result === '承認' ? 1 : 0));
  },

  // --- 複数案件管理（プロジェクト切替） ---
  PROJ_INDEX_KEY: 'lce_project_index',
  PROJ_ACTIVE_KEY: 'lce_active_project',

  // 案件一覧取得
  getProjects() {
    return JSON.parse(localStorage.getItem(this.PROJ_INDEX_KEY) || '[]');
  },

  // アクティブ案件ID
  getActiveProjectId() {
    return localStorage.getItem(this.PROJ_ACTIVE_KEY) || 'default';
  },

  // 案件作成
  createProject(name) {
    const projects = this.getProjects();
    const id = 'proj_' + Date.now().toString(36);
    projects.push({ id, name, createdAt: new Date().toISOString() });
    localStorage.setItem(this.PROJ_INDEX_KEY, JSON.stringify(projects));
    this.switchProject(id);
    return id;
  },

  // 案件切替
  switchProject(projectId) {
    // 現在のデータを現案件キーに保存
    const currentId = this.getActiveProjectId();
    this._saveCurrentToProject(currentId);
    // 新案件に切替
    localStorage.setItem(this.PROJ_ACTIVE_KEY, projectId);
    // 新案件のデータを読み込み
    this._loadProjectData(projectId);
  },

  // 案件削除
  deleteProject(projectId) {
    let projects = this.getProjects().filter(p => p.id !== projectId);
    localStorage.setItem(this.PROJ_INDEX_KEY, JSON.stringify(projects));
    // 案件データを削除
    ['_company', '_rating', '_matrix'].forEach(suffix => {
      localStorage.removeItem(projectId + suffix);
    });
    // defaultに戻す
    if (this.getActiveProjectId() === projectId) {
      localStorage.setItem(this.PROJ_ACTIVE_KEY, 'default');
      this._loadProjectData('default');
    }
  },

  // 内部: 現在のデータを案件に保存
  _saveCurrentToProject(projId) {
    const cd = localStorage.getItem(this.KEYS.COMPANY_DATA);
    const rr = localStorage.getItem(this.KEYS.RATING_RESULT);
    const mr = localStorage.getItem(this.KEYS.MATRIX_RESULT);
    if (cd) localStorage.setItem(projId + '_company', cd);
    if (rr) localStorage.setItem(projId + '_rating', rr);
    if (mr) localStorage.setItem(projId + '_matrix', mr);
  },

  // 内部: 案件データを読み込み
  _loadProjectData(projId) {
    const cd = localStorage.getItem(projId + '_company');
    const rr = localStorage.getItem(projId + '_rating');
    const mr = localStorage.getItem(projId + '_matrix');
    if (cd) localStorage.setItem(this.KEYS.COMPANY_DATA, cd);
    else localStorage.removeItem(this.KEYS.COMPANY_DATA);
    if (rr) localStorage.setItem(this.KEYS.RATING_RESULT, rr);
    else localStorage.removeItem(this.KEYS.RATING_RESULT);
    if (mr) localStorage.setItem(this.KEYS.MATRIX_RESULT, mr);
    else localStorage.removeItem(this.KEYS.MATRIX_RESULT);
  },

  // 案件セレクターUI表示
  showProjectSelector() {
    const projects = this.getProjects();
    const activeId = this.getActiveProjectId();

    let html = `<div class="glass-card highlight">
      <div class="report-title">📂 案件管理</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">複数の融資案件を管理できます。案件ごとにDNA・格付け・資料データが独立して保存されます。</p>`;

    // 現在の案件
    html += `<div style="margin-bottom:16px;">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">現在の案件</div>
      <div style="padding:10px;background:var(--bg-active);border:1px solid var(--primary);border-radius:8px;font-size:14px;font-weight:600;">
        📌 ${activeId === 'default' ? 'デフォルト案件' : (projects.find(p => p.id === activeId)?.name || 'デフォルト')}
      </div>
    </div>`;

    // 案件リスト
    if (projects.length > 0) {
      html += `<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">案件一覧</div>`;
      projects.forEach(p => {
        const isActive = p.id === activeId;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin-bottom:4px;background:${isActive ? 'var(--bg-active)' : 'var(--bg-secondary)'};border-radius:8px;">
          <div>
            <div style="font-size:13px;font-weight:${isActive ? '700' : '400'};">${isActive ? '📌 ' : ''}${p.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${new Date(p.createdAt).toLocaleDateString('ja-JP')}</div>
          </div>
          <div style="display:flex;gap:4px;">
            ${!isActive ? `<button class="btn btn-primary btn-sm" onclick="Database.switchProject('${p.id}');Database.showProjectSelector();">切替</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="if(confirm('案件「${p.name}」を削除しますか？')){Database.deleteProject('${p.id}');Database.showProjectSelector();}">🗑️</button>
          </div>
        </div>`;
      });
    }

    // デフォルト案件への切替
    if (activeId !== 'default') {
      html += `<button class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="Database.switchProject('default');Database.showProjectSelector();">デフォルト案件に戻す</button>`;
    }

    // 新規作成フォーム
    html += `<div style="margin-top:16px;border-top:1px solid var(--border-secondary);padding-top:12px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">➕ 新規案件作成</div>
      <div style="display:flex;gap:8px;">
        <input id="newProjectName" type="text" placeholder="案件名（例：運転資金融資 2026年Q2）" style="flex:1;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
        <button class="btn btn-primary" onclick="const n=document.getElementById('newProjectName').value;if(n){Database.createProject(n);Database.showProjectSelector();}else{App.addSystemMessage(Utils.createAlert('warning','⚠️','案件名を入力してください'));}">作成</button>
      </div>
    </div>`;

    html += `</div>`;
    App.addSystemMessage(html);
  },

  // --- 全データクリア ---
  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },

  // --- データエクスポート（JSON） ---
  exportAll() {
    const exportData = {
      version: '5.0',
      exportedAt: new Date().toISOString(),
      data: {}
    };
    Object.entries(this.KEYS).forEach(([name, key]) => {
      exportData.data[name] = this.load(key);
    });
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_craft_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.addSystemMessage(Utils.createAlert('success', '✅', 'データをJSONファイルとしてエクスポートしました。'));
  },

  // --- データインポート（JSON） ---
  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const importData = JSON.parse(ev.target.result);
          if (!importData.version || !importData.data) {
            App.addSystemMessage(Utils.createAlert('critical', '❌', '無効なファイル形式です。LOAN CRAFT ENGINEからエクスポートしたJSONファイルをお使いください。'));
            return;
          }
          Object.entries(importData.data).forEach(([name, value]) => {
            if (value !== null && this.KEYS[name]) {
              this.save(this.KEYS[name], value);
            }
          });
          App.addSystemMessage(Utils.createAlert('success', '✅', `データをインポートしました（エクスポート日時：${importData.exportedAt}）。ページをリロードすると完全に反映されます。`));
        } catch (err) {
          App.addSystemMessage(Utils.createAlert('critical', '❌', `インポートエラー：${err.message}`));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  // --- 案件記録UI ---
  showRecordUI() {
    const data = this.loadCompanyData();
    const rr = this.loadRatingResult();
    const mr = this.loadMatrixResult();

    const caseData = {
      industry: data.industry || '',
      annualRevenue: data.annualRevenue || 0,
      loanAmount: data.loanAmount || 0,
      loanPurpose: data.loanPurpose || '',
      grade: rr?.grade || '—',
      matrixResult: mr?.matrixResult?.result || '—',
      result: '',
      note: ''
    };

    let html = `<div class="glass-card highlight">
      <div class="report-title">💾 案件の記録</div>
      <p style="color:var(--text-secondary);font-size:12px;margin-bottom:16px;">現在のヒアリング・診断データを案件として記録します。</p>
      <div class="report-row"><span class="label">業種</span><span class="value">${caseData.industry || '—'}</span></div>
      <div class="report-row"><span class="label">年商</span><span class="value">${Utils.formatMan(caseData.annualRevenue)}</span></div>
      <div class="report-row"><span class="label">融資金額</span><span class="value">${Utils.formatMan(caseData.loanAmount)}</span></div>
      <div class="report-row"><span class="label">格付け</span><span class="value">${caseData.grade}</span></div>
      <div class="report-row"><span class="label">判定</span><span class="value">${caseData.matrixResult}</span></div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="Database.registerCase('承認')">✅ 承認として記録</button>
        <button class="btn btn-secondary" style="background:var(--accent-orange);" onclick="Database.registerCase('条件付承認')">△ 条件付承認</button>
        <button class="btn btn-secondary" style="background:var(--accent-red);" onclick="Database.registerCase('否決')">❌ 否決として記録</button>
        <button class="btn btn-secondary" onclick="Database.registerCase('進行中')">🔄 進行中として記録</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  registerCase(result) {
    const data = this.loadCompanyData();
    const rr = this.loadRatingResult();
    const mr = this.loadMatrixResult();
    const caseData = {
      industry: data.industry || '',
      annualRevenue: data.annualRevenue || 0,
      loanAmount: data.loanAmount || 0,
      loanPurpose: data.loanPurpose || '',
      grade: rr?.grade || '—',
      effectiveScore: rr?.effectiveScore || 0,
      matrixResult: mr?.matrixResult?.result || '—',
      result: result
    };
    const id = this.addCase(caseData);
    if (id) {
      App.addSystemMessage(Utils.createAlert('success', '✅', `案件を「${result}」として記録しました。（ID: ${id}）<br>記録件数：全${this.getCaseCount()}件`));
    }
  },

  // --- 類似案件検索UI ---
  showSimilarCases() {
    const data = this.loadCompanyData();
    const rr = this.loadRatingResult();
    const criteria = {
      industry: data.industry,
      grade: rr?.grade,
      annualRevenue: data.annualRevenue
    };
    const similar = this.findSimilarCases(criteria);
    const allCases = this.loadCases();

    let html = `<div class="glass-card">
      <div class="report-title">🔍 類似過去案件の検索</div>`;

    if (allCases.length === 0) {
      html += Utils.createAlert('info', 'ℹ️', '案件データがありません。<code>/記録</code> で案件を登録してください。');
    } else {
      html += `<p style="color:var(--text-secondary);font-size:12px;margin-bottom:12px;">登録済み ${allCases.length} 件中、類似案件 ${similar.length} 件</p>`;

      if (similar.length > 0) {
        const headers = ['ID', '業種', '年商', '融資額', '格付け', '結果', '登録日'];
        const rows = similar.map(c => [
          c.id?.substring(0, 8) || '—',
          c.industry || '—',
          Utils.formatMan(c.annualRevenue),
          Utils.formatMan(c.loanAmount),
          c.grade || '—',
          `<span style="color:${c.result === '承認' ? 'var(--accent-green)' : c.result === '否決' ? 'var(--accent-red)' : 'var(--accent-gold)'}">${c.result || '—'}</span>`,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('ja-JP') : '—'
        ]);
        html += Utils.createTable(headers, rows);
      } else {
        html += Utils.createAlert('warning', '⚠️', '類似する過去案件は見つかりませんでした。');
      }

      // 全案件表示（最大20件）
      if (allCases.length > 0 && similar.length < allCases.length) {
        html += `<div class="report-subtitle" style="margin-top:16px;">📋 全案件一覧（直近${Math.min(20, allCases.length)}件）</div>`;
        const recentCases = allCases.slice(-20).reverse();
        const allHeaders = ['業種', '年商', '格付け', '結果', '登録日'];
        const allRows = recentCases.map(c => [
          c.industry || '—',
          Utils.formatMan(c.annualRevenue),
          c.grade || '—',
          `<span style="color:${c.result === '承認' ? 'var(--accent-green)' : c.result === '否決' ? 'var(--accent-red)' : 'var(--accent-gold)'}">${c.result || '—'}</span>`,
          c.createdAt ? new Date(c.createdAt).toLocaleDateString('ja-JP') : '—'
        ]);
        html += Utils.createTable(allHeaders, allRows);
      }
    }

    html += `</div>`;
    App.addSystemMessage(html);
  }
};
