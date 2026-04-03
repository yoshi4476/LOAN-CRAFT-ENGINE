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
    { cmd: '/稟議書出力', label: '/稟議書出力', desc: '📑 銀行稟議書フォーマット印刷', fn: () => Extra.printRingiFormat() },
    { cmd: '/エクスポート', label: '/エクスポート', desc: 'データ保存', fn: () => Database.exportAll() },
    { cmd: '/インポート', label: '/インポート', desc: 'データ読込', fn: () => Database.importData() },
    { cmd: '/次へ', label: '/次へ', desc: '次のおすすめアクション', fn: () => Extra.suggestNextAction() },
    { cmd: '/ガイド', label: '/ガイド', desc: '📖 総合ガイド', fn: () => Guide.showIndex() },
    { cmd: '/使い方', label: '/使い方', desc: '🧭 カテゴリ別おすすめの使い方', fn: () => Guide.showUsageAdvice() },
    { cmd: '/初心者ガイド', label: '/初心者ガイド', desc: '👶 初心者向け財務ガイド', fn: () => Guide.showBeginnerGuide() },
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
    { cmd: '/資金繰り表', label: '/資金繰り表', desc: '📅 短期資金繰り予測作成', fn: () => BankAudit.showCashFlowTable() },
    { cmd: '/ベンチマーク', label: '/ベンチマーク', desc: '📊 業界平均との比較分析', fn: () => Extra.showBenchmark() },
    { cmd: '/help', label: '/help', desc: 'コマンド一覧表示', fn: () => App.showHelp() },
    { cmd: '/クリア', label: '/クリア', desc: 'データを初期化', fn: () => App.confirmClear() },
    { cmd: '/決算取込', label: '/決算取込', desc: '📊 決算書OCR取込・財務反映', fn: () => BankAudit.showOCRImport() },
    { cmd: '/事業計画', label: '/事業計画', desc: '📈 事業計画策定（10年）', fn: () => BankAudit.showPlanEditor() },
    { cmd: '/格付判定', label: '/格付判定', desc: '🏦 債務者格付・銀行審査', fn: () => BankAudit.showCaseJudgment() },
    { cmd: '/実態修正', label: '/実態修正', desc: '🔧 実態BS/PL修正', fn: () => BankAudit.showRealBSAdjustments() },
    { cmd: '/個人資産', label: '/個人資産', desc: '💎 個人資産による格付緩和', fn: () => BankAudit.showPersonalAssets() },
    { cmd: '/審査レポート', label: '/審査レポート', desc: '📋 財務・融資審査レポート', fn: () => BankAudit.showCaseJudgment() },
    { cmd: '/計画一覧', label: '/計画一覧', desc: '📁 事業計画一覧・比較', fn: () => BankAudit.showPlanList() },
    { cmd: '/乖離分析', label: '/乖離分析', desc: '📊 計画vs実績の乖離分析', fn: () => BankAudit.showVarianceAnalysis() },
    { cmd: '/案件判断', label: '/案件判断', desc: '🏦 融資案件判断（3つの柱）', fn: () => BankAudit.showLoanAssessment() },
    { cmd: '/連結決算', label: '/連結決算', desc: '📊 連結決算（少額切捨て）', fn: () => BankAudit.showConsolidated() },
    { cmd: '/AI格付', label: '/AI格付', desc: '🤖 AI格付コメント生成', fn: () => BankAudit.aiRatingComment() },
    { cmd: '/格付履歴', label: '/格付履歴', desc: '📊 格付履歴一覧', fn: () => BankAudit.showRatingHistory() },
    { cmd: '/シナリオ', label: '/シナリオ', desc: '🔄 シナリオシミュレーション', fn: () => BankAudit.showScenarioSim() },
    { cmd: '/Excel読込', label: '/Excel読込', desc: '📁 Excel決算書読込', fn: () => BankAudit.showExcelImport() },
    { cmd: '/テンプレート', label: '/テンプレート', desc: '📥 決算書テンプレートDL', fn: () => BankAudit.downloadTemplate() },
    { cmd: '/融資ガイド', label: '/融資ガイド', desc: '📚 銀行融資審査ガイド', fn: () => BankAudit.showLoanGuide() },
  ],

  // アプリ初期化
  init() {
    // 認証ガード：SaaS版 ライセンス認証
    if (typeof ApiClient !== 'undefined' && !ApiClient.getToken()) {
      this.showLicenseScreen();
      return;
    }

    // コンプライアンスガード：利用規約への同意チェック
    if (typeof ApiClient !== 'undefined') {
      const user = ApiClient.getUser();
      if (user && user.role !== 'super_admin' && !user.terms_agreed_at) {
        this.showTermsAgreementModal();
        return;
      }
    }

    // ユーザー設定値の復元
    if (typeof UserSettings !== 'undefined') UserSettings.load();

    this.setupEventListeners();
    if (typeof AssessmentModes !== 'undefined') AssessmentModes.initFromSettings();
    this.initTheme();
    this.showBootMessage();
    if (typeof DocLearning !== "undefined") DocLearning.initDefaultKnowledge();
    this.updateSidebarProgress();
    this.updateSidebarProfile();
  },

  // ライセンス認証画面
  showLicenseScreen() {
    const overlay = document.createElement('div');
    overlay.id = 'licenseOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;';

    overlay.innerHTML = `
      <div class="glass-card highlight" style="max-width:400px;width:90%;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🏦</div>
        <div class="report-title">SaaS ライセンス認証</div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;">
          システムを利用するには、管理者から提供されたライセンスキーを入力してください。<br>
          <span style="font-size:10px;color:var(--text-muted);">※未契約の場合は「SUPER-ADMIN-MASTER-KEY」で管理者として入れます</span>
        </p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
          <input id="saasLicenseKey" type="password" placeholder="XXXX-XXXX-XXXX-XXXX" style="width:100%;padding:12px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:16px;text-align:center;letter-spacing:2px;font-family:var(--font-mono);">
          <button id="saasActivateBtn" class="btn btn-primary" style="padding:10px;font-size:14px;font-weight:700;">認証して開始</button>
        </div>
        <div id="saasLicenseError" style="color:var(--accent-red);font-size:12px;display:none;"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('saasActivateBtn').addEventListener('click', async () => {
      const key = document.getElementById('saasLicenseKey').value.trim();
      const errEl = document.getElementById('saasLicenseError');
      if (!key) {
        errEl.innerText = 'ライセンスキーを入力してください';
        errEl.style.display = 'block';
        return;
      }
      try {
        errEl.style.display = 'none';
        document.getElementById('saasActivateBtn').innerText = '認証中...';
        await ApiClient.licenseLogin(key);
        // 成功したらリロードしてUI起動
        window.location.reload();
      } catch (e) {
        errEl.innerText = e.message;
        errEl.style.display = 'block';
        document.getElementById('saasActivateBtn').innerText = '認証して開始';
      }
    });

    const bodyStyle = document.createElement('style');
    bodyStyle.innerHTML = 'body { overflow: hidden; }';
    document.head.appendChild(bodyStyle);
  },

  // 再ログイン・セッション復旧モーダル（入力状態を保持）
  showReloginModal() {
    // 既存のモーダルがあれば表示しない（二重表示防止）
    if (document.getElementById('reloginOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'reloginOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;';

    overlay.innerHTML = `
      <div class="glass-card" style="max-width:400px;width:90%;text-align:center;padding:30px;box-shadow:0 10px 40px rgba(0,0,0,0.5);border-color:var(--accent-red);">
        <div style="font-size:32px;margin-bottom:8px;">⏱️</div>
        <div style="font-size:18px;font-weight:bold;color:var(--accent-red);margin-bottom:10px;">セッション有効期限切れ</div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:20px;text-align:left;">
          長時間のアクセスがない、もしくは別の端末でライセンスが使用されたため、通信を切断しました。<br><br>
          <span style="color:var(--primary-light);font-weight:bold;">安心してください：入力中のデータは保持されています。</span><br>
          作業を再開するには再度ライセンスキーを入力してください。
        </p>
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
          <input id="reloginKey" type="password" placeholder="ライセンスキー (XXXX-XXXX-XXXX)" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:16px;text-align:center;">
          <button id="reloginBtn" class="btn btn-primary" style="padding:10px;font-size:14px;background:var(--accent-red);">認証して再開</button>
        </div>
        <div id="reloginError" style="color:var(--accent-red);font-size:12px;display:none;"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 以前のキーがあればプレフィル
    const savedKey = localStorage.getItem('lce_license_key');
    if (savedKey) document.getElementById('reloginKey').value = savedKey;

    document.getElementById('reloginBtn').addEventListener('click', async () => {
      const key = document.getElementById('reloginKey').value.trim();
      const errEl = document.getElementById('reloginError');
      if (!key) { errEl.innerText = 'ライセンスキーを入力してください'; errEl.style.display = 'block'; return; }
      
      errEl.style.display = 'none';
      document.getElementById('reloginBtn').innerText = '認証中...';
      try {
        await ApiClient.licenseLogin(key);
        overlay.remove(); // 成功したらモーダルを消す（DOMも入力を保持したまま再開）
        App.addSystemMessage(Utils.createAlert('success', '🔐', 'セッションを復旧しました。未保存のデータは失われていません。作業を再開できます。'));
      } catch (e) {
        errEl.innerText = e.message;
        errEl.style.display = 'block';
        document.getElementById('reloginBtn').innerText = '認証して再開';
      }
    });

    // 背景スクロールを即座にブロック
    document.body.style.overflow = 'hidden';
  },

  // サブスクリプション期限切れ・無効化ロック画面（ハードブロック）
  showSubscriptionExpiredModal(message) {
    // 他のモーダルがあれば削除
    const old1 = document.getElementById('reloginOverlay');
    if (old1) old1.remove();
    const old2 = document.getElementById('licenseOverlay');
    if (old2) old2.remove();
    if (document.getElementById('expiredOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'expiredOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999999;backdrop-filter:blur(10px);';

    overlay.innerHTML = `
      <div class="glass-card" style="max-width:500px;width:90%;text-align:center;padding:40px 30px;border-top:4px solid var(--accent-red);box-shadow:0 10px 50px rgba(255,50,50,0.2);">
        <div style="font-size:40px;margin-bottom:12px;">🔒</div>
        <div style="font-size:22px;font-weight:bold;color:var(--text-primary);margin-bottom:12px;">サブスクリプション有効期限終了</div>
        <p style="font-size:14px;color:var(--text-secondary);margin-bottom:24px;line-height:1.6;text-align:left;">
          <b style="color:var(--accent-red);">${message || '現在ご利用のライセンスは有効期限が終了したか、無効化されています。'}</b><br><br>
          <span style="color:var(--text-muted);font-size:13px;">
          システムを継続して利用するには、管理者（SaaS運営）に更新をご連絡いただき、新たなライセンスキーを適用してください。<br>
          ※入力済みのデータは安全に保管されています。
          </span>
        </p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <input id="renewKey" type="password" placeholder="新しいライセンスキー (XXXX-XXXX-XXXX)" style="width:100%;padding:14px;background:rgba(255,255,255,0.05);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:16px;text-align:center;letter-spacing:1px;font-family:var(--font-mono);">
          <button id="renewBtn" class="btn btn-primary" style="padding:12px;font-size:15px;background:var(--primary);">更新ライセンスを適用して開錠</button>
        </div>
        <div id="renewError" style="color:var(--accent-red);font-size:13px;display:none;margin-top:12px;"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('renewBtn').addEventListener('click', async () => {
      const key = document.getElementById('renewKey').value.trim();
      const errEl = document.getElementById('renewError');
      if (!key) { errEl.innerText = '新しいライセンスキーを入力してください'; errEl.style.display = 'block'; return; }
      
      errEl.style.display = 'none';
      document.getElementById('renewBtn').innerText = '確認中...';
      try {
        await ApiClient.licenseLogin(key);
        // 新しいライセンスで成功！
        overlay.remove();
        document.body.style.overflow = '';
        App.addSystemMessage(Utils.createAlert('success', '✨', 'ライセンスが更新されました。引き続きご利用いただけます。'));
      } catch (e) {
        errEl.innerText = e.message;
        errEl.style.display = 'block';
        document.getElementById('renewBtn').innerText = '更新ライセンスを適用して開錠';
      }
    });

    document.body.style.overflow = 'hidden';
  },

  // 利用規約・プライバシーポリシー同意画面
  showTermsAgreementModal() {
    if (document.getElementById('termsOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'termsOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999999;backdrop-filter:blur(5px);';

    overlay.innerHTML = `
      <div class="glass-card" style="max-width:600px;width:90%;padding:40px 30px;border-top:4px solid var(--primary);">
        <div style="font-size:32px;margin-bottom:12px;text-align:center;">📜</div>
        <div style="font-size:20px;font-weight:bold;color:var(--text-primary);margin-bottom:20px;text-align:center;">利用規約とプライバシーポリシーの同意</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:24px;line-height:1.6;background:var(--bg-input);padding:20px;border-radius:8px;max-height:300px;overflow-y:auto;text-align:left;">
          <p>LOAN CRAFT ENGINE をご利用いただきありがとうございます。</p>
          <p>本システムは、企業の財務および融資に関する機密性の高い情報を取り扱います。ご入力いただいた情報は、テナント（ご契約者様）単位で厳重に分離され、安全に保管されます。</p>
          <h4 style="margin:16px 0 8px;color:var(--text-primary);">第1条（情報の取り扱いについて）</h4>
          <p>ユーザーによって入力・アップロードされた財務情報、事業計画、その他のデータは、分析および資料作成機能のために安全な環境下において一時的に学習用データまたはAI（OpenAI等）を通じた解析へ使用される場合があります。システム内に記録される操作ログおよび入力データは、システム保護・保守を目的として取得されます。</p>
          <h4 style="margin:16px 0 8px;color:var(--text-primary);">第2条（免責事項）</h4>
          <p>本システムが生成する事業計画書・診断結果・資金繰り表などは、融資獲得の成功を保証するものではありません。生成されたデータは必ず専門家等による確認を行い、自己責任の下で提出・利用を行ってください。</p>
          <p style="margin-top:20px;text-align:center;color:var(--primary-light);">システムを利用開始することで、上記の利用規約およびプライバシーポリシーに同意したものとみなされます。</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;align-items:center;">
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin-bottom:12px;">
            <input type="checkbox" id="agreeTermsCheck" style="width:18px;height:18px;accent-color:var(--primary);">
            <span style="user-select:none;">上記のすべての規約に同意します</span>
          </label>
          <button id="agreeTermsBtn" class="btn btn-primary" style="padding:12px 30px;font-size:15px;" disabled>同意してシステムを利用開始する</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const check = document.getElementById('agreeTermsCheck');
    const btn = document.getElementById('agreeTermsBtn');

    check.addEventListener('change', () => {
      btn.disabled = !check.checked;
    });

    btn.addEventListener('click', async () => {
      if (!check.checked) return;
      btn.innerText = '処理中...';
      btn.disabled = true;
      try {
        await ApiClient.request('/api/auth/agree-terms', { method: 'POST' });
        // LocalStorageのユーザー情報を手動で更新
        const u = ApiClient.getUser();
        if (u) {
          u.terms_agreed_at = new Date().toISOString();
          localStorage.setItem('lce_user', JSON.stringify(u));
        }
        overlay.remove();
        document.body.style.overflow = '';
        App.init(); // 規約同意完了後に本体の初期化処理を再開
      } catch (e) {
        alert('エラーが発生しました: ' + e.message);
        btn.innerText = '同意してシステムを利用開始する';
        btn.disabled = false;
      }
    });

    document.body.style.overflow = 'hidden';
  },

  // サイドバーのユーザープロフィール更新
  updateSidebarProfile() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const nameEl = document.getElementById('sidebarUserName');
    const tenantEl = document.getElementById('sidebarTenantName');
    
    if (nameEl) nameEl.textContent = settings.userName || '山田太郎 (Admin)';
    if (tenantEl) {
      // 登録プロファイルから取得するか、デフォルトを入れる
      const profiles = Database.load(Database.KEYS.PROFILES) || [];
      tenantEl.textContent = profiles.length > 0 ? profiles[profiles.length - 1].name : '株式会社サンプル';
    }
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
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const headerActions = document.querySelector('.header-actions');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
    // サイドバー展開時はヘッダーボタンを隠す（z-index/stacking context問題の回避）
    if (headerActions) {
      headerActions.style.visibility = sidebar.classList.contains('open') ? 'hidden' : '';
    }
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) headerActions.style.visibility = '';
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

/* ============================================================
 * ユーザー設定管理 (UserSettings)
 * ============================================================ */
const UserSettings = {
  // 設定モーダルの表示
  show() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    
    // API設定
    const apiKeyInput = document.getElementById('userSettingsApiKey');
    const aiModelSelect = document.getElementById('userSettingsAiModel');
    if (apiKeyInput) apiKeyInput.value = settings.openaiApiKey || '';
    if (aiModelSelect) aiModelSelect.value = settings.openaiModel || 'gpt-4o-mini';

    // アカウント情報
    const nameInput = document.getElementById('userSettingsName');
    const emailInput = document.getElementById('userSettingsEmail');
    if (nameInput) nameInput.value = settings.userName || '山田太郎 (Admin)';
    if (emailInput) emailInput.value = settings.userEmail || 'admin@example.com';

    // テーマ設定
    const themeRadios = document.querySelectorAll('input[name="ui_theme"]');
    const currentTheme = settings.theme || (document.body.classList.contains('light-theme') ? 'light' : 'dark');
    themeRadios.forEach(r => {
      r.checked = (r.value === currentTheme);
    });
    
    this.renderProfilesList();
    document.getElementById('userSettingsModal').style.display = 'flex';
  },

  // 基本設定の保存
  saveSettings() {
    // API設定
    const apiKey = document.getElementById('userSettingsApiKey')?.value.trim() || '';
    const aiModel = document.getElementById('userSettingsAiModel')?.value || 'gpt-4o-mini';
    
    // アカウント設定
    const userName = document.getElementById('userSettingsName')?.value.trim() || '山田太郎 (Admin)';
    const userEmail = document.getElementById('userSettingsEmail')?.value.trim() || 'admin@example.com';

    // テーマ設定
    const themeStr = document.querySelector('input[name="ui_theme"]:checked')?.value || 'dark';
    
    let settings = Database.load(Database.KEYS.SETTINGS) || {};
    settings.openaiApiKey = apiKey;
    settings.openaiModel = aiModel;
    settings.userName = userName;
    settings.userEmail = userEmail;
    settings.theme = themeStr;
    
    Database.save(Database.KEYS.SETTINGS, settings);

    // テーマ即時適用
    if(themeStr === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    
    // サイドバーのプロフィール即時反映
    App.updateSidebarProfile();

    document.getElementById('userSettingsModal').style.display = 'none';
    App.addSystemMessage(Utils.createAlert('success', '✅', 'システム・アカウント設定を保存しました。'));
  },

  // 現在の企業データを新規プロファイルとして保存
  saveCurrentProfile() {
    const nameInput = document.getElementById('newProfileName');
    const name = nameInput?.value.trim() || `無名の企業 (${new Date().toLocaleDateString()})`;
    
    const currentData = Database.loadCompanyData();
    const profiles = Database.load('lce_company_profiles') || [];
    
    const newProfile = {
      id: 'prof_' + Date.now(),
      name: name,
      savedAt: new Date().toISOString(),
      industry: currentData.industry || '未設定',
      data: currentData
    };
    
    profiles.push(newProfile);
    Database.save('lce_company_profiles', profiles);
    
    if(nameInput) nameInput.value = '';
    this.renderProfilesList();
    App.addSystemMessage(Utils.createAlert('success', '🏢', `企業プロファイル「${name}」を保存しました。`));
  },

  // 選択したプロファイルを削除
  deleteProfile(id) {
    if(!confirm('本当にこの企業プロファイルを削除しますか？')) return;
    let profiles = Database.load('lce_company_profiles') || [];
    profiles = profiles.filter(p => p.id !== id);
    Database.save('lce_company_profiles', profiles);
    this.renderProfilesList();
  },

  // 選択したプロファイルをロード（切り替え）
  loadProfile(id) {
    if(!confirm('現在の未保存の変更は失われます。プロファイルを切り替えますか？')) return;
    const profiles = Database.load('lce_company_profiles') || [];
    const target = profiles.find(p => p.id === id);
    if(target && target.data) {
      Database.saveCompanyData(target.data);
      // 再読み込みして画面全体を更新
      window.location.reload();
    }
  },

  // 保存済みプロファイル一覧の描画
  renderProfilesList() {
    const profiles = Database.load('lce_company_profiles') || [];
    const container = document.getElementById('profilesList');
    if(!container) return;

    if(profiles.length === 0) {
      container.innerHTML = '<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:10px;">保存されたプロファイルはありません</div>';
      return;
    }

    container.innerHTML = profiles.reverse().map(p => {
      const dateStr = new Date(p.savedAt).toLocaleDateString();
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-card);padding:8px 12px;border-radius:4px;margin-bottom:6px;border:1px solid var(--border-secondary);">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${Utils.escapeHtml(p.name)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${p.industry} | 保存日: ${dateStr}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="UserSettings.loadProfile('${p.id}')" style="padding:4px 8px;font-size:11px;">切替</button>
            <button class="btn btn-danger btn-sm" onclick="UserSettings.deleteProfile('${p.id}')" style="padding:4px 8px;font-size:11px;">削除</button>
          </div>
        </div>
      `;
    }).join('');
  },

  // アプリ起動時の設定読み込み
  load() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const globalModeSelect = document.getElementById('globalIndustryMode');
    if (globalModeSelect && settings.industryMode) {
      globalModeSelect.value = settings.industryMode;
    }
  }
};

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
