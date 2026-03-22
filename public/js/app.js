/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - メインアプリケーション
 * 初期化・コマンドシステム・チャットUI管理
 * ============================================================ */

const App = {
  currentInputHandler: null,
  commandPaletteVisible: false,

  // コマンド定義
  commands: [
    { cmd: '/start', label: '/start', desc: '初回ヒアリング開始', fn: () => Interview.start() },
    { cmd: '/DNA', label: '/DNA', desc: '🧬 企業DNA登録', fn: () => CompanyDNA.start() },
    { cmd: '/DNAプロフィール', label: '/DNAプロフィール', desc: '🧬 企業DNAプロフィール表示', fn: () => CompanyDNA.showProfile() },
    { cmd: '/診断', label: '/診断', desc: '格付け自己査定実行', fn: () => Rating.execute() },
    { cmd: '/実態BS', label: '/実態BS', desc: '実態BS分析の詳細入力', fn: () => Interview.askDetailedFinancials() },
    { cmd: '/マトリックス', label: '/マトリックス', desc: '審査マトリックス判定', fn: () => Matrix.execute() },
    { cmd: '/融資方法', label: '/融資方法', desc: '最適融資手段の選定', fn: () => LoanSelector.execute() },
    { cmd: '/保証協会', label: '/保証協会', desc: '保証制度の最適選択', fn: () => LoanSelector.showGuaranteeDetail() },
    { cmd: '/企業価値担保', label: '/企業価値担保', desc: '企業価値担保権の活用検討', fn: () => LoanSelector.showEnterpriseValueCollateral() },
    { cmd: '/資料', label: '/資料', desc: '📄 AI資料生成エンジン', fn: () => DocGenerator.showMenu() },
    { cmd: '/学習', label: '/学習', desc: '🧠 融資資料 学習エンジン', fn: () => DocLearning.showLearningUI() },
    { cmd: '/整合チェック', label: '/整合チェック', desc: '資料間の数値整合確認', fn: () => DocGenerator.runConsistencyCheck() },
    { cmd: '/戦略', label: '/戦略', desc: '総合戦略レポート生成', fn: () => Strategy.generateFullReport() },
    { cmd: '/面談準備', label: '/面談準備', desc: '銀行面談の準備ガイド', fn: () => Strategy.showMeetingPrep() },
    { cmd: '/金利交渉', label: '/金利交渉', desc: '金利交渉の戦略提案', fn: () => Strategy.showInterestRateNegotiation() },
    { cmd: '/保証解除', label: '/保証解除', desc: '経営者保証解除の戦略', fn: () => Strategy.showGuaranteeRemoval() },
    { cmd: '/審査方式', label: '/審査方式', desc: '審査方式の切替（8方式対応）', fn: () => AssessmentModes.showModeSelector() },
    { cmd: '/比較', label: '/比較', desc: '融資方法の比較分析', fn: () => Extra.showComparison() },
    { cmd: '/レーダー', label: '/レーダー', desc: 'レーダーチャート分析', fn: () => Extra.renderRadarChart() },
    { cmd: '/劣後ローン', label: '/劣後ローン', desc: '資本性劣後ローン活用', fn: () => Extra.showSubordinatedLoan() },
    { cmd: '/リスケ復活', label: '/リスケ復活', desc: 'リスケからの新規融資戦略', fn: () => Extra.showRescheduleRecovery() },
    { cmd: '/記録', label: '/記録', desc: '案件を記録する', fn: () => Database.showRecordUI() },
    { cmd: '/類似', label: '/類似', desc: '類似過去案件の検索', fn: () => Database.showSimilarCases() },
    { cmd: '/チェック', label: '/チェック', desc: '提出前の最終チェックリスト', fn: () => Extra.showPreSubmitChecklist() },
    { cmd: '/スケジュール', label: '/スケジュール', desc: '📅 面談スケジュール管理', fn: () => Schedule.show() },
    { cmd: '/案件', label: '/案件', desc: '📂 複数案件管理（切替・作成・削除）', fn: () => Database.showProjectSelector() },
    { cmd: '/決算分析', label: '/決算分析', desc: '📊 決算書分析', fn: () => FinancialAnalysis.showUploadForm() },
    { cmd: '/金融機関', label: '/金融機関', desc: '🏦 金融機関DB', fn: () => BankDatabase.show() },
    { cmd: '/シナリオ', label: '/シナリオ', desc: '⚖️ シナリオ比較', fn: () => ScenarioCompare.show() },
    { cmd: '/保存資料', label: '/保存資料', desc: '💾 保存済み資料一覧', fn: () => DocGenerator.showSavedDocuments() },
    { cmd: '/ダッシュボード', label: '/ダッシュボード', desc: '📊 ダッシュボード表示', fn: () => App.showDashboard() },
    { cmd: '/用語', label: '/用語', desc: '融資用語辞典', fn: () => App.addSystemMessage(Glossary.showAll()) },
    { cmd: '/印刷', label: '/印刷', desc: '資料の印刷', fn: () => Extra.printDocuments() },
    { cmd: '/エクスポート', label: '/エクスポート', desc: 'データ保存', fn: () => Database.exportAll() },
    { cmd: '/インポート', label: '/インポート', desc: 'データ読込', fn: () => Database.importData() },
    { cmd: '/次へ', label: '/次へ', desc: '次のおすすめアクション', fn: () => Extra.suggestNextAction() },
    { cmd: '/ガイド', label: '/ガイド', desc: '📖 総合ガイド', fn: () => Guide.showIndex() },
    { cmd: '/管理', label: '/管理', desc: '⚙️ 管理コンソール', fn: () => Admin.show() },
    { cmd: '/最高管理者', label: '/最高管理者', desc: '📊 最高管理者コンソール', fn: () => SuperAdmin.show() },
    { cmd: '/ステータス', label: '/ステータス', desc: '進捗状況確認', fn: () => App.showStatus() },
    { cmd: '/AI戦略', label: '/AI戦略', desc: '🎯 AI総合戦略レポート', fn: () => Strategy.aiStrategyReport() },
    { cmd: '/AI保証', label: '/AI保証', desc: '🔓 AI経営者保証解除', fn: () => Strategy.aiGuaranteeAdvice() },
    { cmd: '/AI提出', label: '/AI提出', desc: '📋 AI提出前チェック', fn: () => Extra.aiPreSubmitCheck() },
    { cmd: '/AI格付け', label: '/AI格付け', desc: '🤖 AI格付け分析コメント', fn: () => Rating.aiAnalyzeRating() },
    { cmd: '/AI面談', label: '/AI面談', desc: '🏦 AI面談シミュレーション', fn: () => Interview.aiSimulateMeeting() },
    { cmd: '/AI決算', label: '/AI決算', desc: '📊 AI決算書分析レポート', fn: () => FinancialAnalysis.aiAnalyzeFinancials() },
    { cmd: '/AI交渉', label: '/AI交渉', desc: '💰 AI金利交渉戦略', fn: () => Strategy.aiNegotiationStrategy() },
    { cmd: '/AI整合', label: '/AI整合', desc: '✅ AI整合性チェック', fn: () => Extra.aiConsistencyCheck() },
    { cmd: '/help', label: '/help', desc: 'コマンド一覧表示', fn: () => App.showHelp() },
    { cmd: '/クリア', label: '/クリア', desc: 'データを初期化', fn: () => App.confirmClear() },
  ],

  // アプリ初期化
  init() {
    this.setupEventListeners();
    if (typeof AssessmentModes !== 'undefined') AssessmentModes.initFromSettings();
    this.initTheme();
    this.showBootMessage();
    if (typeof DocLearning !== "undefined") DocLearning.initDefaultKnowledge();
    this.updateSidebarProgress();
  },

  // サイドバー折りたたみ制御
  toggleStep(stepKey) {
    const step = document.querySelector(`.nav-step[data-step="${stepKey}"]`);
    if (!step) return;
    const body = step.querySelector('.nav-step-body');
    const arrow = step.querySelector('.step-arrow');
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open');
    if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
  },

  // サイドバーの進捗状態を更新
  updateSidebarProgress() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const hasDNA = !!(data.industry || data.annualRevenue || data.companyName);
    // ステップ1: DNA登録済み?
    const s1 = document.getElementById('stepCheck1');
    const h1 = document.querySelector('.nav-step[data-step="1"] .nav-step-header');
    if (hasDNA && s1) { s1.textContent = '✅'; if (h1) h1.classList.add('done'); }
    // ステップ2: 格付け完了?
    const s2 = document.getElementById('stepCheck2');
    const h2 = document.querySelector('.nav-step[data-step="2"] .nav-step-header');
    if (rr && s2) { s2.textContent = '✅'; if (h2) h2.classList.add('done'); }
  },

  // イベントリスナー設定
  setupEventListeners() {
    // チャット入力（要素が存在する場合のみ）
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserInput();
        }
      });
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      });
    }
    if (sendBtn) sendBtn.addEventListener('click', () => this.handleUserInput());

    // コマンドパレット
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeCommandPalette();
        this.closeSidebar();
      }
    });

    // コマンドパレットオーバーレイ
    const overlay = document.getElementById('commandPaletteOverlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeCommandPalette();
    });

    // コマンドパレット入力
    const paletteInput = document.getElementById('paletteInput');
    paletteInput.addEventListener('input', (e) => this.filterCommands(e.target.value));
    paletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const selected = document.querySelector('.palette-item.selected') || document.querySelector('.palette-item');
        if (selected) selected.click();
      }
    });

    // モバイルメニュー
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) menuBtn.addEventListener('click', () => this.toggleSidebar());
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => this.closeSidebar());

    // ナビゲーション（イベント委譲方式: 動的要素にも対応）
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
      sidebarNav.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-item[data-cmd]');
        if (!item) return;
        const cmd = item.dataset.cmd;
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) chatMessages.innerHTML = '';
        this.executeCommand(cmd);
        this.closeSidebar();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      });
    }
  },

  // ユーザー入力処理
  handleUserInput() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';

    // コマンド判定
    if (text.startsWith('/')) {
      this.addUserMessage(text);
      this.executeCommand(text);
      return;
    }

    // カスタムハンドラがある場合
    if (this.currentInputHandler) {
      this.currentInputHandler(text);
      return;
    }

    // デフォルト：ユーザーメッセージとして表示
    this.addUserMessage(text);
    this.addSystemMessage(`<div style="font-size:13px;color:var(--text-secondary);">
      コマンドをご利用ください。<code>/help</code> でコマンド一覧を確認できます。<br>
      まずは <code>/start</code> でヒアリングを開始しましょう。
    </div>`);
  },

  // コマンド実行（ページ切替方式：前の表示をクリアして新規表示）
  async executeCommand(cmdText) {
    const cmdBase = cmdText.split(' ')[0].toLowerCase();
    const matched = this.commands.find(c => c.cmd === cmdBase || c.cmd === cmdText.split(' ')[0]);
    if (matched) {
      // チャットエリアをクリアして切替表示
      const chatMessages = document.getElementById('chatMessages');
      if (chatMessages) chatMessages.innerHTML = '';
      try {
        await matched.fn();
      } catch(e) {
        console.error('コマンド実行エラー:', e);
        this.addSystemMessage(Utils.createAlert('error', '❌', `エラー: ${e.message}`));
      }
    } else {
      // 資料個別生成
      if (cmdText.startsWith('/資料 ') || cmdText.startsWith('/資料　')) {
        const docName = cmdText.replace(/^\/資料[\s　]+/, '');
        const docMap = {
          'エグゼクティブサマリー': 'executive', '企業概要書': 'company',
          '資金繰り表': 'cashflow', '事業計画書': 'bizplan',
          '借入金一覧': 'debtlist', '返済計画': 'repayplan',
          '業績推移': 'performance', '代表者プロフィール': 'profile',
          '取引深耕': 'deepening', 'Q&A': 'qa', 'QA': 'qa'
        };
        const id = Object.entries(docMap).find(([key]) => docName.includes(key));
        if (id) Documents.generate(id[1]);
        else this.addSystemMessage(Utils.createAlert('warning', '⚠️', `資料名「${docName}」が見つかりません。/資料ALL で一覧を表示できます。`));
        return;
      }
      // /用語 [用語名] の特殊ルーティング
      if (cmdText.startsWith('/用語 ') || cmdText.startsWith('/用語　')) {
        const term = cmdText.replace(/^\/用語[\s　]+/, '').trim();
        if (term) {
          this.addSystemMessage(Glossary.lookup(term));
        } else {
          this.addSystemMessage(Glossary.showAll());
        }
        return;
      }
      this.addSystemMessage(Utils.createAlert('warning', '⚠️', `コマンド「${Utils.escapeHtml(cmdText)}」は認識できません。<code>/help</code> で一覧を確認してください。`));
    }
  },

  // メッセージ表示（画面を置換して表示 - 積み重ねなし）
  addSystemMessage(html) {
    const container = document.getElementById('chatMessages');
    container.innerHTML = `<div class="message system fade-in"><div class="message-content">
      <div class="message-header">
        <div class="avatar system-avatar">🏦</div>
        <span class="name">LOAN CRAFT</span>
        <span class="time">${Utils.now()}</span>
      </div>
      ${html}
    </div></div>`;
    container.scrollTop = 0;
    Utils.scrollToBottom(container);
  },

  addUserMessage(text) {
    const container = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = 'message user fade-in';
    msg.innerHTML = `<div class="message-content">${Utils.escapeHtml(text)}</div>`;
    container.appendChild(msg);
    Utils.scrollToBottom(container);
  },

  // 起動メッセージ（ダッシュボード形式）
  showBootMessage() {
    this.showDashboard();
  },

  // ダッシュボード表示
  showDashboard() {
    const data = Database.loadCompanyData() || {};
    const hasDNA = !!(data.industry || data.annualRevenue || data.companyName);
    const rr = Database.loadRatingResult();
    const savedDocs = Object.keys(Database.load('lce_saved_documents') || {});
    const schedules = (typeof Schedule !== 'undefined') ? Schedule.loadAll().filter(s => new Date(s.date) >= new Date(new Date().setHours(0,0,0,0))).sort((a,b) => new Date(a.date) - new Date(b.date)) : [];
    const projects = Database.getProjects();
    const activeProject = Database.getActiveProjectId();

    // 進捗計算
    const steps = [hasDNA, !!rr, savedDocs.length > 0, false];
    const done = steps.filter(Boolean).length;
    const pct = Math.round(done / steps.length * 100);

    let html = `<div class="boot-message">
      <div class="boot-header">
        <div class="boot-title">LOAN CRAFT ENGINE</div>
        <div class="boot-subtitle">融資獲得を、もっとシンプルに。</div>
      </div>`;

    // 案件名表示（複数案件がある場合）
    if (projects.length > 0) {
      const projName = activeProject === 'default' ? 'デフォルト案件' : (projects.find(p => p.id === activeProject)?.name || 'デフォルト');
      html += `<div style="text-align:center;margin-bottom:8px;">
        <span style="font-size:11px;background:var(--bg-active);border:1px solid var(--primary);border-radius:20px;padding:3px 12px;color:var(--primary-light);">📌 ${projName}</span>
      </div>`;
    }

    // 進捗バー
    html += `<div style="margin:12px 0;">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
        <span style="color:var(--text-secondary);">全体の進捗</span>
        <span style="color:var(--primary-light);font-weight:600;">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div style="display:flex;gap:16px;margin-top:10px;font-size:11px;color:var(--text-muted);">
        <span>${hasDNA ? '✅' : '⬜'} DNA登録</span>
        <span>${rr ? '✅' : '⬜'} 格付け</span>
        <span>${savedDocs.length > 0 ? '✅' : '⬜'} 資料</span>
        <span>⬜ 戦略</span>
      </div>
    </div>`;

    // ダッシュボードカード群（格付け + 財務 + 予定）
    if (hasDNA || rr) {
      html += `<div style="display:grid;grid-template-columns:${rr ? '1fr 1fr 1fr' : '1fr 1fr'};gap:10px;margin:16px 0;">`;

      // 格付けスコアカード
      if (rr) {
        const gradeColor = { 'S+': '#FFD700', 'S': '#FFD700', 'A': '#22C55E', 'B': '#3B82F6', 'C': '#F59E0B', 'D': '#EF4444', 'E': '#DC2626', 'F': '#991B1B' }[rr.grade] || 'var(--text-primary)';
        html += `<div class="glass-card" style="padding:16px;text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);">格付けスコア</div>
          <div style="font-size:36px;font-weight:800;color:${gradeColor};margin:4px 0;">${rr.grade || '—'}</div>
          <div style="font-size:12px;color:var(--text-secondary);">${rr.score ? rr.score.toFixed(1) + '点' : ''}</div>
        </div>`;
      }

      // 財務サマリーカード
      if (hasDNA) {
        const rev = data.annualRevenue ? (data.annualRevenue / 10000).toFixed(0) + '億' : '—';
        const fin = (data.financials && data.financials[0]) || {};
        const op = fin.operatingProfit ? (fin.operatingProfit > 0 ? '+' : '') + fin.operatingProfit.toLocaleString() + '万' : '—';
        html += `<div class="glass-card" style="padding:16px;text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);">売上 / 営業利益</div>
          <div style="font-size:20px;font-weight:700;margin:8px 0;color:var(--text-primary);">${rev}</div>
          <div style="font-size:12px;color:${fin.operatingProfit > 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${op}</div>
        </div>`;
      }

      // 次の面談カード
      html += `<div class="glass-card" style="padding:16px;text-align:center;">
        <div style="font-size:11px;color:var(--text-muted);">次の面談</div>`;
      if (schedules.length > 0) {
        const next = schedules[0];
        const daysUntil = Math.ceil((new Date(next.date) - new Date()) / 86400000);
        html += `<div style="font-size:16px;font-weight:700;margin:8px 0;">${next.bank || '面談'}</div>
          <div style="font-size:12px;color:${daysUntil <= 3 ? 'var(--accent-red)' : 'var(--text-secondary)'};">${next.date} (${daysUntil > 0 ? daysUntil + '日後' : '今日'})</div>`;
      } else {
        html += `<div style="font-size:14px;margin:12px 0;color:var(--text-muted);">予定なし</div>
          <button class="btn btn-secondary btn-sm" onclick="Schedule.show()" style="font-size:11px;">追加する</button>`;
      }
      html += `</div></div>`;
    }

    // CTAカード（2列）
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
      <div class="glass-card" style="padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;"
        onclick="App.executeCommand('/DNA')" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor=''">
        <div style="font-size:28px;margin-bottom:6px;">🧬</div>
        <div style="font-size:13px;font-weight:600;">${hasDNA ? 'DNA情報を更新' : '企業情報を登録'}</div>
      </div>
      <div class="glass-card" style="padding:20px;text-align:center;cursor:pointer;transition:all 0.2s;"
        onclick="${hasDNA ? "App.executeCommand('/診断')" : "Database.importData()"}" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor=''">
        <div style="font-size:28px;margin-bottom:6px;">${hasDNA ? '📊' : '📂'}</div>
        <div style="font-size:13px;font-weight:600;">${hasDNA ? '格付け診断する' : 'データを読み込む'}</div>
      </div>
    </div>`;

    // 推奨フロー
    html += `<div style="margin-top:12px;padding:10px;background:rgba(108,99,255,0.06);border-radius:8px;text-align:center;">
      <div style="font-size:12px;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">
        <span style="color:${hasDNA ? 'var(--accent-green)' : 'var(--primary-light)'};font-weight:600;">DNA登録</span>
        <span style="color:var(--text-muted);">→</span>
        <span style="color:${rr ? 'var(--accent-green)' : 'var(--text-secondary)'};">格付け</span>
        <span style="color:var(--text-muted);">→</span>
        <span style="color:var(--text-secondary);">資料作成</span>
        <span style="color:var(--text-muted);">→</span>
        <span style="color:var(--text-secondary);">戦略</span>
      </div>
    </div>`;

    html += `</div>`;
    this.addSystemMessage(html);
  },

  // ヘルプ表示（カテゴリタブ形式）
  showHelp() {
    const categories = [
      { id: 'basic', label: '基本', cmds: ['/DNA', '/DNAプロフィール', '/start', '/診断', '/マトリックス', '/融資方法', '/資料'] },
      { id: 'strategy', label: '戦略', cmds: ['/戦略', '/面談準備', '/金利交渉', '/保証解除', '/チェック', '/スケジュール'] },
      { id: 'tools', label: 'ツール', cmds: ['/比較', '/レーダー', '/審査方式', '/保証協会', '/企業価値担保', '/劣後ローン', '/リスケ復活', '/案件', '/保存資料', '/記録', '/類似', '/用語'] },
      { id: 'system', label: 'システム', cmds: ['/管理', '/ガイド', '/ダッシュボード', '/エクスポート', '/インポート', '/ステータス', '/クリア'] },
    ];

    let html = `<div class="report-title">📖 コマンド一覧</div>
      <p style="color:var(--text-secondary);font-size:12px;margin-bottom:12px;">
        <kbd>Ctrl+K</kbd> でコマンドパレットを開くと素早く検索できます。
      </p>
      <div style="display:flex;gap:4px;margin-bottom:12px;flex-wrap:wrap;" id="helpTabBar">`;
    categories.forEach((cat, i) => {
      html += `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App.showHelpTab('${cat.id}')" data-tab="${cat.id}">${cat.label}</button>`;
    });
    html += `</div><div id="helpTabContent"></div>`;
    this.addSystemMessage(html);
    this.showHelpTab('basic');
  },

  showHelpTab(tabId) {
    const categories = [
      { id: 'basic', label: '基本', cmds: ['/DNA', '/DNAプロフィール', '/start', '/診断', '/マトリックス', '/融資方法', '/資料'] },
      { id: 'strategy', label: '戦略', cmds: ['/戦略', '/面談準備', '/金利交渉', '/保証解除', '/チェック'] },
      { id: 'tools', label: 'ツール', cmds: ['/比較', '/レーダー', '/審査方式', '/保証協会', '/企業価値担保', '/劣後ローン', '/リスケ復活', '/記録', '/類似', '/用語'] },
      { id: 'system', label: 'システム', cmds: ['/管理', '/ガイド', '/エクスポート', '/インポート', '/ステータス', '/クリア'] },
    ];
    const cat = categories.find(c => c.id === tabId);
    if (!cat) return;
    // タブボタンの状態更新
    document.querySelectorAll('#helpTabBar button').forEach(btn => {
      btn.className = btn.dataset.tab === tabId ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
    });
    // テーブル表示
    const items = cat.cmds.map(cmd => {
      const c = this.commands.find(x => x.cmd === cmd);
      return c ? [`<code style="color:var(--primary-light)">${c.cmd}</code>`, c.desc] : null;
    }).filter(Boolean);
    const container = document.getElementById('helpTabContent');
    if (container) container.innerHTML = Utils.createTable(['コマンド', '機能'], items);
  },

  // ステータス表示
  showStatus() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const mr = Database.loadMatrixResult();
    const items = [
      { label: 'ヒアリング', done: (data.interviewStep || 0) >= 3 },
      { label: '格付け診断', done: !!rr },
      { label: 'マトリックス判定', done: !!mr },
      { label: '融資方法選定', done: false },
      { label: '資料作成', done: false },
      { label: '戦略レポート', done: false }
    ];

    let html = `<div class="report-title">📊 進捗状況</div>`;
    items.forEach(item => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
        <span style="color:${item.done ? 'var(--accent-green)' : 'var(--text-muted)'}">${item.done ? '✅' : '⬜'}</span>
        <span style="color:${item.done ? 'var(--text-primary)' : 'var(--text-muted)'}">${item.label}</span>
      </div>`;
    });

    if (data.industry) {
      html += `<div class="section-divider">企業情報</div>
        <div class="report-row"><span class="label">業種</span><span class="value">${data.industry || '—'}</span></div>
        <div class="report-row"><span class="label">年商</span><span class="value">${Utils.formatMan(data.annualRevenue)}</span></div>
        <div class="report-row"><span class="label">希望金額</span><span class="value">${Utils.formatMan(data.loanAmount)}</span></div>`;
      if (rr) {
        html += `<div class="report-row"><span class="label">格付け</span><span class="value">${Utils.createGradeBadge(rr.grade)}</span></div>`;
      }
    }

    this.addSystemMessage(html);
  },

  // データクリア確認
  confirmClear() {
    const html = `<div class="alert-card warning">
      <span class="alert-icon">⚠️</span>
      <div>
        全データを初期化します。この操作は取り消せません。<br>
        <button class="btn btn-sm" style="margin-top:8px;background:var(--accent-red);color:white;" onclick="Database.clearAll();App.addSystemMessage('<div class=\\'alert-card success\\'><span class=\\'alert-icon\\'>✅</span><div>データを初期化しました。</div></div>');">初期化する</button>
        <button class="btn btn-sm btn-ghost" style="margin-top:8px;">キャンセル</button>
      </div>
    </div>`;
    this.addSystemMessage(html);
  },

  // コマンドパレット
  toggleCommandPalette() {
    const overlay = document.getElementById('commandPaletteOverlay');
    if (overlay.classList.contains('active')) {
      this.closeCommandPalette();
    } else {
      overlay.classList.add('active');
      const input = document.getElementById('paletteInput');
      input.value = '';
      input.focus();
      this.filterCommands('');
    }
  },

  closeCommandPalette() {
    document.getElementById('commandPaletteOverlay').classList.remove('active');
  },

  filterCommands(query) {
    const results = document.getElementById('paletteResults');
    const filtered = query
      ? this.commands.filter(c => c.cmd.includes(query) || c.desc.includes(query))
      : this.commands;

    results.innerHTML = filtered.map((c, i) =>
      `<div class="palette-item${i === 0 ? ' selected' : ''}" onclick="App.executePaletteCmd('${c.cmd}')">
        <span class="cmd-name">${c.cmd}</span>
        <span class="cmd-desc">${c.desc}</span>
      </div>`
    ).join('');
  },

  executePaletteCmd(cmd) {
    this.closeCommandPalette();
    this.addUserMessage(cmd);
    this.executeCommand(cmd);
  },

  // モバイルサイドバー
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
  },

  // テーマ切替
  initTheme() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    if (settings.theme === 'light') {
      document.body.classList.add('light-theme');
    }
  },

  toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    settings.theme = isLight ? 'light' : 'dark';
    Database.save(Database.KEYS.SETTINGS, settings);
    this.addSystemMessage(Utils.createAlert('success', isLight ? '☀️' : '🌙', `テーマを${isLight ? 'ライトモード' : 'ダークモード'}に切り替えました。`));
  }
};

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => App.init());
