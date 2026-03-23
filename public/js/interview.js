/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - ヒアリングエンジン
 * チャット形式の対話型インテリジェンス収集
 * ============================================================ */

const Interview = {
  // ヒアリング定義（3ステップ）
  steps: [
    {
      title: 'STEP 1：基本情報と今回の目的',
      questions: [
        { id: 'industry', label: 'Q1. 業種は何ですか？', type: 'select',
          options: ['製造業','建設業','卸売業','小売業','飲食業','IT・ソフトウェア','不動産業','運輸業','医療・福祉','サービス業','その他'] },
        { id: 'yearsInBusiness', label: 'Q2. 設立から何年ですか？', type: 'number', unit: '年', placeholder: '例：15' },
        { id: 'annualRevenue', label: 'Q3. 年商はどのくらいですか？', type: 'number', unit: '万円', placeholder: '例：50000' },
        { id: 'loanAmount', label: 'Q4. 融資の希望金額は？', type: 'number', unit: '万円', placeholder: '例：5000' },
        { id: 'loanPurpose', label: 'Q4b. 資金使途は？', type: 'select',
          options: ['運転資金（経常運転資金）','運転資金（季節資金・つなぎ）','設備投資（新規・増産）','設備投資（更新・改修）','借換（条件改善）','借入一本化','納税資金','その他'] },
        { id: 'urgency', label: 'Q5. 希望時期は？（急ぎですか？）', type: 'select',
          options: ['1ヶ月以内（急ぎ）','2〜3ヶ月以内','半年以内','特に急がない'] }
      ]
    },
    {
      title: 'STEP 2：財務状況の把握',
      questions: [
        { id: 'revenue_latest', label: 'Q6a. 直近期の売上高', type: 'number', unit: '万円', placeholder: '例：50000' },
        { id: 'operatingProfit_latest', label: 'Q6b. 直近期の営業利益', type: 'number', unit: '万円', placeholder: '例：2000（赤字なら-2000）' },
        { id: 'ordinaryProfit_latest', label: 'Q6c. 直近期の経常利益', type: 'number', unit: '万円', placeholder: '例：1800' },
        { id: 'netIncome_latest', label: 'Q6d. 直近期の最終利益', type: 'number', unit: '万円', placeholder: '例：1200' },
        { id: 'netAssets', label: 'Q6e. 直近期の純資産', type: 'number', unit: '万円', placeholder: '例：8000（債務超過なら-500）' },
        { id: 'totalAssets', label: 'Q6f. 直近期の総資産', type: 'number', unit: '万円', placeholder: '例：30000' },
        { id: 'totalDebt', label: 'Q7. 現在の借入金の総額', type: 'number', unit: '万円', placeholder: '例：20000' },
        { id: 'lenders_text', label: 'Q8. 借入先の金融機関（複数あれば全て）', type: 'text', placeholder: '例：○○銀行、△△信金' },
        { id: 'monthlyRepayment', label: 'Q9. 毎月の返済額の合計', type: 'number', unit: '万円', placeholder: '例：150' },
        { id: 'taxDelinquency', label: 'Q10. 税金・社会保険の滞納はありますか？', type: 'select', options: ['なし','あり（消費税）','あり（源泉税）','あり（社会保険）','あり（分納中）'] },
        { id: 'rescheduleHistory', label: 'Q11. リスケ（返済条件の変更）をしたことは？', type: 'select', options: ['なし','過去にあり（正常化済）','現在進行中'] },
        { id: 'negativeEquity', label: 'Q12. 債務超過ですか？', type: 'select', options: ['いいえ','はい（軽微）','はい（大幅）'] }
      ]
    },
    {
      title: 'STEP 3：深掘り情報',
      questions: [
        { id: 'mainBank', label: 'Q13a. メインバンクはどこですか？', type: 'text', placeholder: '例：○○銀行 △△支店' },
        { id: 'mainBankYears', label: 'Q13b. メインバンクとの取引年数', type: 'number', unit: '年', placeholder: '例：10' },
        { id: 'recentRejection', label: 'Q14. 直近で融資を断られたことは？', type: 'select', options: ['なし','あり'] },
        { id: 'guaranteeBalance', label: 'Q15. 信用保証協会の現在の保証残高', type: 'number', unit: '万円', placeholder: '例：5000（利用なしは0）' },
        { id: 'collateral', label: 'Q16. 担保に出せる不動産・資産は？', type: 'text', placeholder: '例：本社土地建物（簿価3000万円）' },
        { id: 'strengths', label: 'Q17. 事業の強み・差別化ポイントは？', type: 'textarea', placeholder: '例：特許技術3件保有、リピート率85%' },
        { id: 'outlook', label: 'Q18. 今後の事業の見通しは？', type: 'textarea', placeholder: '例：新規取引先2社と商談中、来期売上10%増見込' },
        { id: 'ceoProfile', label: 'Q19. 代表者の経歴（簡潔に）', type: 'textarea', placeholder: '例：業界20年、大手メーカー出身、50歳' },
        { id: 'relatedCompanies', label: 'Q20. 関連会社・グループ会社は？', type: 'text', placeholder: '例：なし / 子会社1社' },
        { id: 'taxAdvisor', label: 'Q21. 顧問税理士は認定支援機関ですか？', type: 'select', options: ['はい','いいえ','顧問税理士なし','不明'] },
        { id: 'guaranteePreference', label: 'Q22. 経営者保証の希望は？', type: 'select',
          options: ['保証あり前提','できれば外したい','絶対外したい'] }
      ]
    }
  ],

  // 決算書・DNAで分かる項目 → ヒアリングでは聞かない
  dnaAutoFields: new Set([
    'industry', 'yearsInBusiness', 'annualRevenue',
    'revenue_latest', 'operatingProfit_latest', 'ordinaryProfit_latest', 'netIncome_latest',
    'netAssets', 'totalAssets', 'totalDebt', 'monthlyRepayment',
    'lenders_text', 'mainBank', 'mainBankYears', 'guaranteeBalance',
    'relatedCompanies', 'taxAdvisor'
  ]),

  // DNAデータにマッピング（ID→DNAフィールド名）
  dnaFieldMap: {
    industry: 'industry', yearsInBusiness: 'yearsInBusiness', annualRevenue: 'annualRevenue',
    revenue_latest: 'annualRevenue', operatingProfit_latest: 'operatingProfit',
    ordinaryProfit_latest: 'ordinaryProfit', netIncome_latest: 'netIncome',
    netAssets: 'netAssets', totalAssets: 'totalAssets', totalDebt: 'totalDebt',
    monthlyRepayment: 'monthlyRepayment', lenders_text: 'lenders',
    mainBank: 'mainBank', mainBankYears: 'mainBankYears',
    guaranteeBalance: 'guaranteeBalance', relatedCompanies: 'relatedCompanies',
    taxAdvisor: 'taxAdvisor'
  },

  currentStep: 0,
  currentQuestionIndex: 0,
  answers: {},
  isActive: false,            // ヒアリング中フラグ
  currentQuestionId: null,    // 現在の質問ID
  currentQuestionType: null,  // 現在の質問タイプ

  /* =============================================
   * チャットUI生成・管理
   * ============================================= */

  // ヒアリング専用のチャットUIを生成
  createChatUI() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = `
      <div class="interview-chat" id="interviewChat">
        <div class="interview-chat-messages" id="interviewMessages">
          <!-- チャットメッセージがここに積み重なる -->
        </div>
        <div class="interview-chat-input" id="interviewInputBar">
          <div class="interview-quick-options" id="interviewQuickOptions" style="display:none;"></div>
          <div class="interview-input-row">
            <textarea
              id="interviewChatInput"
              placeholder="メッセージを入力..."
              rows="1"
              autocomplete="off"
            ></textarea>
            <button class="interview-send-btn" id="interviewSendBtn" title="送信">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // イベントリスナー設定
    const input = document.getElementById('interviewChatInput');
    const sendBtn = document.getElementById('interviewSendBtn');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleChatSend();
      }
    });
    // 自動リサイズ
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
    sendBtn.addEventListener('click', () => this.handleChatSend());
  },

  // システムメッセージを追加（積み重ね方式）
  addBotMessage(html, isCard = false) {
    const msgArea = document.getElementById('interviewMessages');
    if (!msgArea) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'iv-msg iv-msg-bot fade-in';
    wrapper.innerHTML = `
      <div class="iv-msg-avatar">🏦</div>
      <div class="iv-msg-bubble ${isCard ? 'iv-msg-card' : ''}">
        ${html}
      </div>
    `;
    msgArea.appendChild(wrapper);
    this.scrollToBottom();
  },

  // ユーザーメッセージを追加
  addChatUserMessage(text) {
    const msgArea = document.getElementById('interviewMessages');
    if (!msgArea) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'iv-msg iv-msg-user fade-in';
    wrapper.innerHTML = `<div class="iv-msg-bubble">${Utils.escapeHtml(text)}</div>`;
    msgArea.appendChild(wrapper);
    this.scrollToBottom();
  },

  // アラートメッセージ
  addAlertMessage(type, icon, text) {
    const msgArea = document.getElementById('interviewMessages');
    if (!msgArea) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'iv-msg iv-msg-alert fade-in';
    wrapper.innerHTML = `<div class="iv-alert iv-alert-${type}">${icon} ${text}</div>`;
    msgArea.appendChild(wrapper);
    this.scrollToBottom();
  },

  // 選択肢ボタン表示（入力バー上のエリア）
  showQuickOptions(options, questionId) {
    const qo = document.getElementById('interviewQuickOptions');
    if (!qo) return;
    qo.innerHTML = options.map(opt =>
      `<button class="iv-quick-btn" onclick="Interview.selectOption('${questionId}','${opt.replace(/'/g, "\\'")}')">${opt}</button>`
    ).join('');
    qo.style.display = 'flex';
    // テキスト入力は非表示
    this.toggleInputRow(false);
  },

  // 選択肢を非表示にしてテキスト入力を表示
  hideQuickOptions() {
    const qo = document.getElementById('interviewQuickOptions');
    if (qo) { qo.innerHTML = ''; qo.style.display = 'none'; }
    this.toggleInputRow(true);
  },

  // テキスト入力行の表示/非表示
  toggleInputRow(show) {
    const row = document.querySelector('.interview-input-row');
    if (row) row.style.display = show ? 'flex' : 'none';
  },

  // チャット入力のplaceholder更新
  setInputPlaceholder(text) {
    const input = document.getElementById('interviewChatInput');
    if (input) input.placeholder = text;
  },

  // スクロール
  scrollToBottom() {
    const msgArea = document.getElementById('interviewMessages');
    if (msgArea) {
      setTimeout(() => { msgArea.scrollTop = msgArea.scrollHeight; }, 50);
    }
  },

  /* =============================================
   * ヒアリングフロー
   * ============================================= */

  // ヒアリング開始
  start() {
    this.currentStep = 0;
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.isActive = true;
    this.currentQuestionId = null;
    this.currentQuestionType = null;

    // チャットUI構築
    this.createChatUI();

    // DNAデータがあれば自動抜粋
    const dna = Database.loadCompanyData();
    const autoFilled = [];

    this.steps.forEach(step => {
      step.questions.forEach(q => {
        if (this.dnaAutoFields.has(q.id)) {
          const dnaKey = this.dnaFieldMap[q.id];
          const val = dna[dnaKey];
          if (val !== null && val !== undefined && val !== '' && val !== 0) {
            if (q.id === 'revenue_latest' && dna.financials && dna.financials[0]?.revenue) {
              this.answers[q.id] = dna.financials[0].revenue;
              autoFilled.push(`${q.label.replace(/Q\d+[a-z]?\.\s*/, '')}: ${dna.financials[0].revenue.toLocaleString()}万円`);
            } else if (q.id === 'operatingProfit_latest' && dna.financials && dna.financials[0]?.operatingProfit) {
              this.answers[q.id] = dna.financials[0].operatingProfit;
              autoFilled.push(`${q.label.replace(/Q\d+[a-z]?\.\s*/, '')}: ${dna.financials[0].operatingProfit.toLocaleString()}万円`);
            } else if (q.id === 'ordinaryProfit_latest' && dna.financials && dna.financials[0]?.ordinaryProfit) {
              this.answers[q.id] = dna.financials[0].ordinaryProfit;
              autoFilled.push(`${q.label.replace(/Q\d+[a-z]?\.\s*/, '')}: ${dna.financials[0].ordinaryProfit.toLocaleString()}万円`);
            } else if (q.id === 'netIncome_latest' && dna.financials && dna.financials[0]?.netIncome) {
              this.answers[q.id] = dna.financials[0].netIncome;
              autoFilled.push(`${q.label.replace(/Q\d+[a-z]?\.\s*/, '')}: ${dna.financials[0].netIncome.toLocaleString()}万円`);
            } else if (q.id === 'lenders_text' && Array.isArray(val)) {
              this.answers[q.id] = val.join('、');
              autoFilled.push(`借入先: ${val.join('、')}`);
            } else {
              this.answers[q.id] = val;
              const unit = q.unit ? q.unit : '';
              autoFilled.push(`${q.label.replace(/Q\d+[a-z]?\.\s*/, '')}: ${typeof val === 'number' ? val.toLocaleString() + unit : val}`);
            }
          }
        }
      });
    });

    // ウェルカム
    this.addBotMessage(`
      <div style="font-size:15px;font-weight:700;margin-bottom:8px;">💬 ヒアリングを開始します</div>
      <p style="font-size:13px;color:var(--text-secondary);margin:0;">
        チャット形式で質問にお答えください。<br>
        3ステップで必要な情報を収集します。
      </p>
    `);

    // 自動抜粋結果を表示
    if (autoFilled.length > 0) {
      let autoHtml = `<div style="font-size:12px;font-weight:600;margin-bottom:6px;">🧬 DNAデータから自動取得済み</div>`;
      autoHtml += `<div style="font-size:11px;line-height:1.7;color:var(--text-secondary);">`;
      autoFilled.forEach(f => { autoHtml += `<div>✅ ${f}</div>`; });
      autoHtml += `</div>`;
      this.addBotMessage(autoHtml, true);
    }

    // 少し遅延してステップ開始
    setTimeout(() => this.showStepIntro(), 500);
  },

  // ステップ紹介メッセージ
  showStepIntro() {
    const step = this.steps[this.currentStep];

    // このステップでスキップしない質問数をカウント
    const remaining = step.questions.filter(q => !this.answers[q.id]).length;
    if (remaining === 0) {
      // 全質問がDNAで回答済み → ステップスキップ
      this.addAlertMessage('success', '✅', `STEP ${this.currentStep + 1}: DNAデータで全項目取得済み — スキップ`);
      this.saveAnswersToCompanyData();
      if (this.currentStep < 2) {
        this.currentStep++;
        this.currentQuestionIndex = 0;
        setTimeout(() => this.showStepIntro(), 300);
      } else {
        this.completeInterview();
      }
      return;
    }

    const stepNames = ['基本情報と今回の目的', '財務状況の把握', '深掘り情報'];
    const stepDescs = [
      '案件固有の情報をお聞かせください。',
      'DNAに含まれない財務情報を確認します。',
      '最後に、いくつか詳細をお聞きします。'
    ];

    let html = `
      <div class="iv-step-header">
        <div class="iv-step-badges">
          ${[1,2,3].map(i => `<span class="iv-step-badge ${i < this.currentStep + 1 ? 'done' : i === this.currentStep + 1 ? 'active' : ''}">${i < this.currentStep + 1 ? '✓' : i}</span>`).join('<span class="iv-step-line"></span>')}
        </div>
        <div style="font-size:14px;font-weight:700;margin-top:8px;">📋 ${step.title}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
          ${stepDescs[this.currentStep]}
          ${remaining < step.questions.length ? `<br><span style="color:var(--accent-green);">DNA自動取得 ${step.questions.length - remaining}件 / 残り${remaining}問</span>` : `全${remaining}問`}
        </div>
      </div>
    `;
    this.addBotMessage(html, true);

    // 最初の質問を表示
    setTimeout(() => this.askNextQuestion(), 400);
  },

  // 次の質問を表示（DNA回答済みはスキップ）
  askNextQuestion() {
    const step = this.steps[this.currentStep];

    // DNA回答済みの質問をスキップ
    while (this.currentQuestionIndex < step.questions.length && this.answers[step.questions[this.currentQuestionIndex].id] !== undefined) {
      this.currentQuestionIndex++;
    }

    if (this.currentQuestionIndex >= step.questions.length) {
      this.completeStep();
      return;
    }

    const q = step.questions[this.currentQuestionIndex];
    this.currentQuestionId = q.id;
    this.currentQuestionType = q.type;

    // 質問をボットメッセージとして表示
    let questionHtml = `<div style="font-size:14px;font-weight:600;">${q.label}</div>`;

    if (q.type === 'select') {
      // 選択肢はクイックオプションボタンで表示
      this.addBotMessage(questionHtml);
      this.showQuickOptions(q.options, q.id);
    } else {
      // テキスト/数値はチャット入力で回答
      if (q.unit) {
        questionHtml += `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">単位: ${q.unit}</div>`;
      }
      this.addBotMessage(questionHtml);
      this.hideQuickOptions();
      this.setInputPlaceholder(q.placeholder || 'ここに入力...');

      // フォーカス
      setTimeout(() => {
        const input = document.getElementById('interviewChatInput');
        if (input) input.focus();
      }, 100);
    }
  },

  // チャット入力からの送信
  handleChatSend() {
    const input = document.getElementById('interviewChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text || !this.currentQuestionId) return;

    // 入力クリア
    input.value = '';
    input.style.height = 'auto';

    // 質問定義を取得
    let question = null;
    this.steps.forEach(step => {
      step.questions.forEach(q => { if (q.id === this.currentQuestionId) question = q; });
    });
    if (!question) return;

    // 数値チェック
    if (question.type === 'number') {
      const num = parseFloat(text.replace(/[,，]/g, ''));
      if (isNaN(num)) {
        this.addAlertMessage('warning', '⚠️', '数値を入力してください。');
        return;
      }
      this.submitAnswer(question.id, num, text);
    } else {
      this.submitAnswer(question.id, text, text);
    }
  },

  // 選択肢ボタン押下
  selectOption(questionId, value) {
    this.hideQuickOptions();
    this.submitAnswer(questionId, value, value);
  },

  // 回答を送信
  submitAnswer(id, value, displayText) {
    this.answers[id] = value;
    this.currentQuestionId = null;
    this.currentQuestionType = null;

    // ユーザーメッセージ表示
    const displayVal = displayText || (typeof value === 'number' ? value.toLocaleString() : value);
    this.addChatUserMessage(displayVal);

    // レッドフラグチェック
    this.checkRedFlags(id, value);

    this.currentQuestionIndex++;
    // 少し遅延して次の質問
    setTimeout(() => this.askNextQuestion(), 400);
  },

  // レッドフラグ検知
  checkRedFlags(id, value) {
    const flags = [];

    if (id === 'taxDelinquency' && value !== 'なし') {
      flags.push({ level: 'critical', msg: `税金・社会保険の滞納検知：「${value}」— 融資審査の重大障害です。滞納解消または分納計画が必須です。` });
    }
    if (id === 'rescheduleHistory' && value === '現在進行中') {
      flags.push({ level: 'critical', msg: 'リスケ実行中 — 新規融資は極めて困難です。まず正常返済への復帰が必要です。' });
    }
    if (id === 'rescheduleHistory' && value === '過去にあり（正常化済）') {
      flags.push({ level: 'warning', msg: 'リスケ履歴あり — 正常化済みですが、審査では必ず確認されます。正常返済の実績期間が重要です。' });
    }
    if (id === 'negativeEquity' && value === 'はい（大幅）') {
      flags.push({ level: 'critical', msg: '大幅な債務超過 — 実態BS分析で改善策を検討します（代表者借入金の資本振替・含み資産の洗い出し等）。' });
    }
    if (id === 'negativeEquity' && value === 'はい（軽微）') {
      flags.push({ level: 'warning', msg: '軽微な債務超過 — 実態BS修正で解消できる可能性があります。' });
    }
    if (id === 'yearsInBusiness') {
      const years = Number(value);
      if (years < 3) flags.push({ level: 'warning', msg: '設立3年未満 — 創業関連保証やスタートアップ創出促進保証(SSS)の活用を検討します。' });
    }
    if (id === 'recentRejection' && value === 'あり') {
      flags.push({ level: 'warning', msg: '直近の融資否決歴あり — 否決理由の分析と対策が必要です。別の金融機関・制度での再チャレンジを検討します。' });
    }

    flags.forEach(f => {
      this.addAlertMessage(f.level, f.level === 'critical' ? '🚨' : '⚠️', f.msg);
    });
  },

  // ステップ完了
  completeStep() {
    this.saveAnswersToCompanyData();

    if (this.currentStep < 2) {
      this.currentStep++;
      this.currentQuestionIndex = 0;
      this.addAlertMessage('success', '✅', `STEP ${this.currentStep} 完了！次のステップに進みます。`);
      setTimeout(() => this.showStepIntro(), 600);
    } else {
      this.completeInterview();
    }
  },

  // ヒアリングデータを企業データに変換・保存
  saveAnswersToCompanyData() {
    const data = Database.loadCompanyData();
    const a = this.answers;

    // STEP1
    if (a.industry) data.industry = a.industry;
    if (a.yearsInBusiness !== undefined) data.yearsInBusiness = Number(a.yearsInBusiness);
    if (a.annualRevenue !== undefined) data.annualRevenue = Number(a.annualRevenue);
    if (a.loanAmount !== undefined) data.loanAmount = Number(a.loanAmount);
    if (a.loanPurpose) data.loanPurpose = a.loanPurpose;
    if (a.urgency) data.urgency = a.urgency;

    // STEP2
    if (a.revenue_latest !== undefined) {
      data.financials = [{
        year: '直近期',
        revenue: Number(a.revenue_latest),
        operatingProfit: Number(a.operatingProfit_latest) || 0,
        ordinaryProfit: Number(a.ordinaryProfit_latest) || 0,
        netIncome: Number(a.netIncome_latest) || 0,
        netAssets: Number(a.netAssets) || 0
      }];
      data.annualRevenue = Number(a.revenue_latest);
    }
    if (a.totalAssets !== undefined) data.totalAssets = Number(a.totalAssets);
    if (a.netAssets !== undefined) data.netAssets = Number(a.netAssets);
    if (a.totalDebt !== undefined) data.totalDebt = Number(a.totalDebt);
    if (a.lenders_text) data.lenders = a.lenders_text.split(/[、,，]/).map(s => s.trim());
    if (a.monthlyRepayment !== undefined) data.monthlyRepayment = Number(a.monthlyRepayment);
    if (a.taxDelinquency) data.taxDelinquency = a.taxDelinquency !== 'なし';
    if (a.rescheduleHistory) data.rescheduleHistory = a.rescheduleHistory !== 'なし';
    if (a.negativeEquity) data.negativeEquity = a.negativeEquity !== 'いいえ';

    // STEP3
    if (a.mainBank) data.mainBank = a.mainBank;
    if (a.mainBankYears !== undefined) data.mainBankYears = Number(a.mainBankYears);
    if (a.recentRejection) data.recentRejection = a.recentRejection === 'あり';
    if (a.guaranteeBalance !== undefined) data.guaranteeBalance = Number(a.guaranteeBalance);
    if (a.collateral) data.collateral = a.collateral;
    if (a.strengths) data.strengths = a.strengths;
    if (a.outlook) data.outlook = a.outlook;
    if (a.ceoProfile) data.ceoProfile = a.ceoProfile;
    if (a.relatedCompanies) data.relatedCompanies = a.relatedCompanies;
    if (a.taxAdvisor) data.taxAdvisor = a.taxAdvisor;
    if (a.guaranteePreference) data.guaranteePreference = a.guaranteePreference;

    data.interviewStep = this.currentStep + 1;
    data.completedSteps.push(this.currentStep);

    Database.saveCompanyData(data);
  },

  // ヒアリング完了
  completeInterview() {
    this.isActive = false;
    const data = Database.loadCompanyData();

    // 入力バーを非表示にする
    const inputBar = document.getElementById('interviewInputBar');
    if (inputBar) inputBar.style.display = 'none';

    const html = `
      <div style="text-align:center;margin-bottom:12px;">
        <span style="font-size:32px;">🎉</span>
      </div>
      <div style="font-size:16px;font-weight:700;text-align:center;margin-bottom:12px;">ヒアリング完了！</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;text-align:center;">
        全ステップの情報収集が完了しました。
      </div>
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📊 収集情報サマリー</div>
      <div style="font-size:12px;line-height:1.8;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">業種</span><span>${data.industry || '—'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">業歴</span><span>${data.yearsInBusiness ? data.yearsInBusiness + '年' : '—'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">年商</span><span>${Utils.formatMan(data.annualRevenue)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">希望金額</span><span>${Utils.formatMan(data.loanAmount)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">資金使途</span><span>${data.loanPurpose || '—'}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">借入総額</span><span>${Utils.formatMan(data.totalDebt)}</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">メインバンク</span><span>${data.mainBank || '—'}</span></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="App.executeCommand('/診断')">🔍 格付け診断を実行</button>
        <button class="btn btn-secondary" onclick="App.executeCommand('/マトリックス')">📊 審査マトリックス</button>
      </div>
    `;
    this.addBotMessage(html, true);
    App.currentInputHandler = null;
  },

  // 追加財務データ入力（格付けで必要な詳細データ）
  askDetailedFinancials() {
    const data = Database.loadCompanyData();
    const html = `
      <div class="glass-card">
        <div class="report-title">📈 詳細財務データ入力</div>
        <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
          より精密な格付け計算のため、以下の追加データをご入力ください。<br>
          不明な項目はスキップ可能です（業種平均値で推定します）。
        </p>
        <form id="detailed-financials-form" onsubmit="Interview.submitDetailedFinancials(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">流動資産（万円）</label>
              <input class="form-input" type="number" name="currentAssets" value="${data.currentAssets || ''}" placeholder="例：15000">
            </div>
            <div class="form-group">
              <label class="form-label">流動負債（万円）</label>
              <input class="form-input" type="number" name="currentLiabilities" value="${data.currentLiabilities || ''}" placeholder="例：12000">
            </div>
            <div class="form-group">
              <label class="form-label">固定資産（万円）</label>
              <input class="form-input" type="number" name="fixedAssets" value="${data.fixedAssets || ''}" placeholder="例：15000">
            </div>
            <div class="form-group">
              <label class="form-label">固定負債（万円）</label>
              <input class="form-input" type="number" name="fixedLiabilities" value="${data.fixedLiabilities || ''}" placeholder="例：10000">
            </div>
            <div class="form-group">
              <label class="form-label">有利子負債（万円）</label>
              <input class="form-input" type="number" name="interestBearingDebt" value="${data.interestBearingDebt || data.totalDebt || ''}" placeholder="例：18000">
            </div>
            <div class="form-group">
              <label class="form-label">売掛金（万円）</label>
              <input class="form-input" type="number" name="receivables" value="${data.receivables || ''}" placeholder="例：5000">
            </div>
            <div class="form-group">
              <label class="form-label">棚卸資産（在庫）（万円）</label>
              <input class="form-input" type="number" name="inventory" value="${data.inventory || ''}" placeholder="例：3000">
            </div>
            <div class="form-group">
              <label class="form-label">買掛金（万円）</label>
              <input class="form-input" type="number" name="payables" value="${data.payables || ''}" placeholder="例：4000">
            </div>
            <div class="form-group">
              <label class="form-label">減価償却費（万円/年）</label>
              <input class="form-input" type="number" name="depreciation" value="${data.depreciation || ''}" placeholder="例：1000">
            </div>
            <div class="form-group">
              <label class="form-label">支払利息（万円/年）</label>
              <input class="form-input" type="number" name="interestExpense" value="${data.interestExpense || ''}" placeholder="例：200">
            </div>
            <div class="form-group">
              <label class="form-label">売上原価（万円）</label>
              <input class="form-input" type="number" name="costOfSales" value="${data.costOfSales || ''}" placeholder="例：35000">
            </div>
            <div class="form-group">
              <label class="form-label">売上総利益（粗利）（万円）</label>
              <input class="form-input" type="number" name="grossProfit" value="${data.grossProfit || ''}" placeholder="例：15000">
            </div>
          </div>
          <div style="margin-top:16px;display:flex;gap:8px;">
            <button type="submit" class="btn btn-primary">💾 保存して診断へ</button>
            <button type="button" class="btn btn-secondary" onclick="App.executeCommand('/診断')">⏩ スキップして診断</button>
          </div>
        </form>
      </div>
    `;
    App.addSystemMessage(html);
  },

  // 詳細財務データ送信
  submitDetailedFinancials(event) {
    event.preventDefault();
    const form = event.target;
    const data = Database.loadCompanyData();
    const fields = ['currentAssets','currentLiabilities','fixedAssets','fixedLiabilities',
                    'interestBearingDebt','receivables','inventory','payables',
                    'depreciation','interestExpense','costOfSales','grossProfit'];
    fields.forEach(f => {
      const val = form.elements[f]?.value;
      if (val !== '' && val !== undefined) data[f] = Number(val);
    });
    Database.saveCompanyData(data);
    App.addSystemMessage(Utils.createAlert('success', '✅', '詳細財務データを保存しました。格付け診断を開始します。'));
    setTimeout(() => App.executeCommand('/診断'), 500);
  },


  
  // AI呼出共通ヘルパー
  async _callAI(systemPrompt, userPrompt) {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const apiKey = settings.openaiApiKey;
    const model = settings.openaiModel || 'gpt-4o-mini';
    
    // サーバー経由を優先
    try {
      const data = await ApiClient.request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 4000, temperature: 0.4 })
      });
      if (data && data.choices) return data.choices[0].message.content;
    } catch(e) {}
    
    // フォールバック: ローカル直接呼出
    if (!apiKey) return null;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 4000, temperature: 0.4 })
    });
    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  },

  // AI面談シミュレーション
  async aiSimulateMeeting() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();

    App.addSystemMessage(Utils.createAlert('info', '🤖', 'AI銀行面談シミュレーションを生成中...'));

    const systemPrompt = 'あなたは日本の銀行融資担当者です。融資申込企業に対して面談を行います。厳しめの質問も含めてリアルな面談をシミュレーションしてください。日本語で回答してください。';
    const userPrompt = `以下の企業情報をもとに、銀行融資面談のシミュレーションを作成してください。

【企業情報】
会社名: ${data.companyName || '未登録'}
業種: ${data.industry || '不明'}
年商: ${data.annualRevenue || '不明'}万円
従業員数: ${data.employees || '不明'}名
設立年数: ${data.yearsInBusiness || '不明'}年
希望借入額: ${data.loanAmount || '不明'}万円
資金使途: ${data.loanPurpose || '不明'}
格付け: ${rr ? rr.rank : '未診断'}

以下の形式で回答してください：
## 🏦 面談シミュレーション

### 想定質問と模範回答（8問）
各質問に対して：
- 🏦 **銀行担当者の質問**
- ✅ **模範回答**（具体的な数字を含めて）
- ⚠️ **NGワード/避けるべき回答**

### 💡 面談成功のポイント
3つのアドバイス`;

    try {
      const content = await this._callAI(systemPrompt, userPrompt);
      if (!content) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'APIキーが未設定です。')); return; }
      App.addSystemMessage(`<div class="glass-card highlight">
        <div class="report-title">🏦 AI面談シミュレーション</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${Utils.escapeHtml(content)}</div>
      </div>`);
    } catch(e) { App.addSystemMessage(Utils.createAlert('error', '❌', 'AI面談エラー: ' + e.message)); }
  },
};
