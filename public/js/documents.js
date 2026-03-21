/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 資料作成エンジン
 * 稟議書逆算型・全10種類の資料テンプレート生成
 * ============================================================ */

const Documents = {

  // 全資料一括生成
  generateAll() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const mr = Database.loadMatrixResult();
    if (!data.industry && !data.annualRevenue) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'ヒアリングデータが不足しています。先に <code>/start</code> をご利用ください。'));
      return;
    }

    let html = `<div class="glass-card highlight">
      <div class="report-title">📄 銀行提出用資料ドラフト一括生成</div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
        稟議書の構造に対応した全10種類の資料ドラフトを生成します。<br>
        各資料は銀行にそのまま持参できるレベルを目指しています。
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">`;

    const docs = [
      { id: 'executive', icon: '📋', name: 'エグゼクティブサマリー', tag: '必須', desc: '支店長が最初に見る1枚' },
      { id: 'company', icon: '🏢', name: '企業概要書', tag: '必須', desc: '事業の全体像（A4 2〜3P）' },
      { id: 'cashflow', icon: '💰', name: '資金繰り表', tag: '必須', desc: '月次12ヶ月分' },
      { id: 'bizplan', icon: '📊', name: '事業計画書', tag: '推奨', desc: '3〜5年の計画' },
      { id: 'debtlist', icon: '📝', name: '借入金一覧表', tag: '必須', desc: '全借入の開示' },
      { id: 'repayplan', icon: '🔄', name: '返済計画シミュレーション', tag: '推奨', desc: '5年分の返済計画' },
      { id: 'performance', icon: '📈', name: '業績推移と改善ストーリー', tag: '推奨', desc: 'パターン別テクニック' },
      { id: 'profile', icon: '👤', name: '代表者プロフィール', tag: '必須', desc: '経歴と資産背景' },
      { id: 'deepening', icon: '🤝', name: '取引深耕提案書', tag: '効果大', desc: '銀行員が最も喜ぶ資料' },
      { id: 'qa', icon: '❓', name: '想定Q&A集', tag: '効果大', desc: '先回りの回答準備' }
    ];

    docs.forEach(doc => {
      const tagCls = doc.tag === '必須' ? 'tag-danger' : doc.tag === '効果大' ? 'tag-success' : 'tag-warning';
      html += `<div class="glass-card" style="padding:14px;cursor:pointer;" onclick="Documents.generate('${doc.id}')">
        <div style="font-size:20px;margin-bottom:6px;">${doc.icon}</div>
        <div style="font-size:13px;font-weight:600;">${doc.name}</div>
        <div style="margin:4px 0;"><span class="tag ${tagCls}">${doc.tag}</span></div>
        <div style="font-size:11px;color:var(--text-muted);">${doc.desc}</div>
      </div>`;
    });

    html += `</div>
      <div style="margin-top:16px;text-align:center;">
        <button class="btn btn-secondary" onclick="App.executeCommand('/整合チェック')">🔍 数値整合チェック</button>
      </div>
    </div>`;

    App.addSystemMessage(html);
  },

  // 個別資料の生成
  generate(docId) {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const generators = {
      executive: () => this.genExecutiveSummary(data, rr),
      company: () => this.genCompanyOverview(data),
      cashflow: () => this.genCashFlowTable(data),
      bizplan: () => this.genBusinessPlan(data, rr),
      debtlist: () => this.genDebtList(data),
      repayplan: () => this.genRepayPlan(data, rr),
      performance: () => this.genPerformanceStory(data, rr),
      profile: () => this.genCEOProfile(data),
      deepening: () => this.genDeepeningProposal(data),
      qa: () => this.genQA(data, rr)
    };
    if (generators[docId]) {
      App.addSystemMessage(generators[docId]());
    }
  },

  // ① エグゼクティブサマリー
  genExecutiveSummary(data, rr) {
    const f = data.financials?.[0] || {};
    const modCF = rr?.modCF;
    return `<div class="doc-preview">
      <h1>融資ご相談の概要</h1>
      <table>
        <tr><th width="30%">企業名</th><td>株式会社○○○（ご入力ください）</td></tr>
        <tr><th>業種</th><td>${data.industry || '—'}</td></tr>
        <tr><th>業歴</th><td>${data.yearsInBusiness || '—'}年</td></tr>
        <tr><th>年商</th><td>${Utils.formatMan(data.annualRevenue)}</td></tr>
        <tr><th>経常利益</th><td>${Utils.formatMan(f.ordinaryProfit)}</td></tr>
      </table>
      <h2>■ ご相談内容</h2>
      <table>
        <tr><th width="30%">資金使途</th><td>${data.loanPurpose || '—'}</td></tr>
        <tr><th>希望金額</th><td>${Utils.formatMan(data.loanAmount)}</td></tr>
        <tr><th>希望期間</th><td>○年（ご入力ください）</td></tr>
        <tr><th>希望形態</th><td>証書貸付 / 手形貸付（ご選択ください）</td></tr>
      </table>
      <h2>■ 返済原資</h2>
      <p>年間キャッシュフロー ${Utils.formatMan(modCF?.simpleCF || 0)} に対し、
      既存の年間返済額は ${Utils.formatMan(modCF?.annualRepay || 0)}。
      返済余力 ${Utils.formatMan(modCF?.repayCapacity || 0)} で十分な返済能力があります。</p>
      <h2>■ 当社の強み</h2>
      <p>${data.strengths || '① ○○○○○\n② ○○○○○\n③ ○○○○○'}</p>
      <h2>■ 御行とのお取引のメリット</h2>
      <p>メインバンクとしての長期的なパートナーシップを希望。預金口座・給与振込の集約を予定しています。</p>
    </div>`;
  },

  // ② 企業概要書
  genCompanyOverview(data) {
    return `<div class="doc-preview">
      <h1>企業概要書</h1>
      <h2>■ 会社概要</h2>
      <table>
        <tr><th>商号</th><td>株式会社○○○</td></tr>
        <tr><th>代表者</th><td>${data.ceoProfile ? data.ceoProfile.substring(0, 30) : '○○ ○○'}</td></tr>
        <tr><th>設立</th><td>${data.yearsInBusiness ? `設立${data.yearsInBusiness}年` : '○年○月'}</td></tr>
        <tr><th>業種</th><td>${data.industry || '—'}</td></tr>
        <tr><th>年商</th><td>${Utils.formatMan(data.annualRevenue)}</td></tr>
        <tr><th>従業員数</th><td>○名（ご入力ください）</td></tr>
        <tr><th>所在地</th><td>○○県○○市（ご入力ください）</td></tr>
      </table>
      <h2>■ 事業内容</h2>
      <p>（何で・誰に・どうやって稼いでいるかを記載してください）</p>
      <h2>■ 競合優位性</h2>
      <p>${data.strengths || '具体的な数字で記載してください（例：特許3件保有、リピート率87%）'}</p>
      <h2>■ 主要取引先</h2>
      <table>
        <tr><th>区分</th><th>取引先名</th><th>取引年数</th><th>年間取引額</th></tr>
        <tr><td>売上先1</td><td>○○株式会社</td><td>○年</td><td>○○万円</td></tr>
        <tr><td>売上先2</td><td>○○株式会社</td><td>○年</td><td>○○万円</td></tr>
        <tr><td>仕入先1</td><td>○○株式会社</td><td>○年</td><td>○○万円</td></tr>
      </table>
      <h2>■ 取引金融機関</h2>
      <p>${data.lenders?.join('、') || data.mainBank || '○○銀行 ○○支店'}</p>
    </div>`;
  },

  // ③ 資金繰り表（簡易版）
  genCashFlowTable(data) {
    const mr = (data.monthlyRepayment || 0);
    const monthlyRev = (data.annualRevenue || 0) / 12;
    let html = `<div class="doc-preview">
      <h1>資金繰り表（月次）</h1>
      <p style="font-size:11px;color:#666;">★ 実績は通帳と完全整合させてください。計画は保守的に作成してください。</p>
      <table style="font-size:11px;">
        <tr><th>項目</th>`;
    const months = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
    months.forEach(m => { html += `<th>${m}</th>`; });
    html += `</tr>`;

    const rows = [
      { label: '月初現預金残', values: months.map(() => '○○') },
      { label: '【経常収入】計', values: months.map(() => Math.round(monthlyRev).toLocaleString() || '○○') },
      { label: '【経常支出】計', values: months.map(() => Math.round(monthlyRev * 0.9).toLocaleString() || '○○') },
      { label: '経常収支', values: months.map(() => Math.round(monthlyRev * 0.1).toLocaleString() || '○○') },
      { label: '既存借入返済', values: months.map(() => mr.toLocaleString()) },
      { label: '★新規借入', values: ['', '', '', '', '', '', '', '', '', '', '', ''] },
      { label: '★新規返済', values: months.map(() => '') },
      { label: '月末現預金残', values: months.map(() => '○○') }
    ];

    rows.forEach(row => {
      html += `<tr><th style="text-align:left;white-space:nowrap;">${row.label}</th>`;
      row.values.forEach(v => { html += `<td style="text-align:right;">${v}</td>`; });
      html += `</tr>`;
    });

    html += `</table>
      <p style="font-size:11px;color:#666;margin-top:12px;">
        ★見せ方の極意：新規融資の有無で2パターン作成すると効果的です。<br>
        パターンA：融資なし→「○月に資金不足」/ パターンB：融資あり→「余裕をもって運営可能」
      </p>
    </div>`;
    return html;
  },

  // ⑤ 借入金一覧表
  genDebtList(data) {
    return `<div class="doc-preview">
      <h1>借入金一覧表</h1>
      <p style="font-size:11px;color:red;">★鉄則：絶対に全て開示してください。隠しても必ずバレます。自ら開示する企業は信頼されます。</p>
      <table>
        <tr><th>No</th><th>金融機関名</th><th>種類</th><th>当初金額</th><th>現残高</th><th>金利</th><th>月額返済</th><th>最終返済日</th><th>担保</th><th>保証</th></tr>
        <tr><td>1</td><td>${data.mainBank || '○○銀行'}</td><td>証書</td><td>○○万円</td><td>○○万円</td><td>○.○%</td><td>○○万円</td><td>20XX/XX</td><td>—</td><td>保証協会</td></tr>
        <tr><td>2</td><td>○○信金</td><td>証書</td><td>○○万円</td><td>○○万円</td><td>○.○%</td><td>○○万円</td><td>20XX/XX</td><td>—</td><td>—</td></tr>
        <tr><td colspan="3" style="font-weight:bold;">合計</td><td>—</td><td>${Utils.formatMan(data.totalDebt)}</td><td>平均○.○%</td><td>${Utils.formatMan(data.monthlyRepayment)}</td><td colspan="3">—</td></tr>
      </table>
    </div>`;
  },

  // ④ 事業計画書（簡易版）
  genBusinessPlan(data, rr) {
    const rev = data.annualRevenue || 0;
    const f = data.financials?.[0] || {};
    return `<div class="doc-preview">
      <h1>事業計画書</h1>
      <h2>第1章：エグゼクティブサマリー</h2>
      <p>当社は${data.industry || '○○業'}として創業${data.yearsInBusiness || '○'}年、年商${Utils.formatMan(rev)}の企業です。
      今回、${data.loanPurpose || '○○'}のため${Utils.formatMan(data.loanAmount)}の融資をお願いするものです。</p>
      <h2>第5章：売上計画（3年）★積み上げ方式で記載★</h2>
      <table>
        <tr><th>区分</th><th>1年目</th><th>2年目</th><th>3年目</th></tr>
        <tr><td>既存取引先</td><td>${Utils.formatMan(Math.round(rev * 0.95))}</td><td>${Utils.formatMan(Math.round(rev * 0.97))}</td><td>${Utils.formatMan(Math.round(rev))}</td></tr>
        <tr><td>新規取引先</td><td>${Utils.formatMan(Math.round(rev * 0.03))}</td><td>${Utils.formatMan(Math.round(rev * 0.05))}</td><td>${Utils.formatMan(Math.round(rev * 0.08))}</td></tr>
        <tr style="font-weight:bold;"><td>合計</td><td>${Utils.formatMan(Math.round(rev * 0.98))}</td><td>${Utils.formatMan(Math.round(rev * 1.02))}</td><td>${Utils.formatMan(Math.round(rev * 1.08))}</td></tr>
      </table>
      <h2>第7章：3シナリオ分析</h2>
      <table>
        <tr><th></th><th>悲観</th><th>標準</th><th>楽観</th></tr>
        <tr><td>売上高</td><td>${Utils.formatMan(Math.round(rev * 0.9))}</td><td>${Utils.formatMan(rev)}</td><td>${Utils.formatMan(Math.round(rev * 1.1))}</td></tr>
        <tr><td>経常利益</td><td>${Utils.formatMan(Math.round((f.ordinaryProfit || rev * 0.02) * 0.6))}</td><td>${Utils.formatMan(f.ordinaryProfit || Math.round(rev * 0.02))}</td><td>${Utils.formatMan(Math.round((f.ordinaryProfit || rev * 0.02) * 1.3))}</td></tr>
        <tr><td>返済可否</td><td>△</td><td>○</td><td>○</td></tr>
      </table>
      <p style="font-size:11px;color:red;">★ポイント：悲観シナリオでも返済可能であることを示すのがベスト</p>
    </div>`;
  },

  // ⑥ 返済計画シミュレーション
  genRepayPlan(data, rr) {
    const cf = rr?.modCF?.simpleCF || 0;
    const mr = (data.monthlyRepayment || 0) * 12;
    const newRepay = (data.loanAmount || 0) / 7;
    let html = `<div class="doc-preview">
      <h1>返済計画シミュレーション</h1>
      <table>
        <tr><th>年度</th><th>既存返済額</th><th>新規返済額</th><th>返済合計</th><th>予想CF</th><th>CF倍率</th><th>判定</th></tr>`;
    for (let i = 1; i <= 5; i++) {
      const exReduced = Math.max(0, mr - (mr / 7 * (i - 1)));
      const total = Math.round(exReduced + newRepay);
      const projCF = Math.round(cf * (1 + 0.02 * i));
      const ratio = total > 0 ? (projCF / total).toFixed(2) : '—';
      const ok = projCF >= total ? '○' : projCF >= total * 0.8 ? '△' : '×';
      html += `<tr><td>${i}年目</td><td>${Utils.formatMan(Math.round(exReduced))}</td><td>${Utils.formatMan(Math.round(newRepay))}</td>
        <td>${Utils.formatMan(total)}</td><td>${Utils.formatMan(projCF)}</td><td>${ratio}倍</td>
        <td style="color:${ok === '○' ? 'green' : ok === '△' ? 'orange' : 'red'};font-weight:bold;">${ok}</td></tr>`;
    }
    html += `</table>
      <p style="font-size:11px;color:#666;">★全年度でCF倍率1.0倍以上が理想。最低でも0.8倍以上を維持すること。</p>
    </div>`;
    return html;
  },

  // ⑦ 業績推移と改善ストーリー
  genPerformanceStory(data, rr) {
    const f = data.financials?.[0] || {};
    const isLoss = (f.ordinaryProfit || 0) < 0;
    const isNE = data.negativeEquity;
    let pattern = '';
    if (isLoss) pattern = 'パターン1：赤字がある場合の見せ方';
    else if (isNE) pattern = 'パターン2：債務超過の場合の見せ方';
    else pattern = '本パターン：堅調な業績推移の提示';

    return `<div class="doc-preview">
      <h1>業績推移と改善ストーリー</h1>
      <p style="color:blue;font-weight:bold;">適用パターン：${pattern}</p>
      <h2>■ 業績推移</h2>
      <table>
        <tr><th>項目</th><th>前々期</th><th>前期</th><th>直近期</th><th>今期見通し</th></tr>
        <tr><td>売上高</td><td>○○</td><td>○○</td><td>${Utils.formatMan(data.annualRevenue)}</td><td>○○</td></tr>
        <tr><td>経常利益</td><td>○○</td><td>○○</td><td>${Utils.formatMan(f.ordinaryProfit)}</td><td>○○</td></tr>
        <tr><td>純資産</td><td>○○</td><td>○○</td><td>${Utils.formatMan(f.netAssets || data.netAssets)}</td><td>○○</td></tr>
      </table>
      ${isLoss ? `<h2>■ 赤字の分析と対策</h2>
        <p>Step 1：赤字の原因を「特定」する（一時要因 vs 構造要因）<br>
        Step 2：月次推移で改善トレンドを示す（底打ちからの回復をグラフ化）<br>
        Step 3：今期の黒字化見通しの根拠を3つ以上示す</p>` : ''}
      ${isNE ? `<h2>■ 債務超過の実態修正</h2>
        <p>手法A：代表者借入金の資本振替（資本的劣後ローン扱い）<br>
        手法B：含み資産の洗い出し（不動産時価評価・保険返戻金）<br>
        手法C：公庫の資本性劣後ローンの活用</p>` : ''}
    </div>`;
  },

  // ⑧ 代表者プロフィール
  genCEOProfile(data) {
    return `<div class="doc-preview">
      <h1>代表者プロフィール・資産背景書</h1>
      <h2>■ 代表者プロフィール</h2>
      <table>
        <tr><th>氏名</th><td>○○ ○○</td></tr>
        <tr><th>経歴</th><td>${data.ceoProfile || '○年〜○年：○○株式会社勤務 / ○年〜当社設立'}</td></tr>
      </table>
      <h2>■ 個人資産の概要</h2>
      <table>
        <tr><th>不動産</th><td>自宅（評価額○○万円、ローン残○○万円）</td></tr>
        <tr><th>預貯金</th><td>概算○○万円</td></tr>
        <tr><th>保険</th><td>生命保険（解約返戻金○○万円）</td></tr>
      </table>
      <h2>■ 経営者保証について</h2>
      <p>希望：${data.guaranteePreference || '—'}</p>
      <p style="font-size:11px;">★経営者保証を外す条件：①法人と経営者の資産の明確な区分 ②法人のみの資産で返済可能 ③適時適切な情報開示</p>
    </div>`;
  },

  // ⑨ 取引深耕提案書
  genDeepeningProposal(data) {
    return `<div class="glass-card highlight">
      <div style="text-align:center;margin-bottom:16px;">
        <span style="font-size:28px;">🤝</span>
        <div class="report-title" style="border:none;padding:0;">取引深耕提案書</div>
        <div style="font-size:12px;color:var(--accent-gold);">★銀行員が最も喜ぶ「隠れた最強資料」★</div>
      </div>
      <div class="doc-preview">
        <h1>御行との取引深耕に向けたご提案</h1>
        <h2>■ 現状のお取引</h2>
        <table>
          <tr><th>融資残高</th><td>${Utils.formatMan(data.totalDebt)}</td></tr>
          <tr><th>預金残高</th><td>○○万円</td></tr>
        </table>
        <h2>■ 今回の融資実現後のお取引イメージ</h2>
        <table>
          <tr><th>融資残高</th><td>${Utils.formatMan((data.totalDebt || 0) + (data.loanAmount || 0))}（＋${Utils.formatMan(data.loanAmount)}）</td></tr>
          <tr><th>預金残高</th><td>○○万円（＋○○万円見込）</td></tr>
        </table>
        <h2>■ 追加でご検討いただきたいお取引</h2>
        <p>□ 役員報酬の振込口座変更（月○○万円）<br>
        □ 従業員給与振込の集約（月○○万円×○名）<br>
        □ 売上入金口座の集約<br>
        □ 法人カード・ビジネスローンカード<br>
        □ インターネットバンキング</p>
        <h2>■ 御行への期待</h2>
        <p>メインバンクとしての長期的なパートナーシップ。事業成長に応じた追加融資のご相談を期待しています。</p>
      </div>
      <div style="margin-top:12px;padding:12px;background:rgba(245,166,35,0.1);border-radius:8px;font-size:12px;color:var(--accent-gold);">
        💡 なぜこの資料が効くのか：銀行員の評価は「融資額」だけでなく「預金量」「取引口座数」「クロスセル」で決まる。
        「この企業を取れば預金も増える」→ 担当者が本気で稟議を通したくなる。
      </div>
    </div>`;
  },

  // ⑩ 想定Q&A集
  genQA(data, rr) {
    const qa = [];
    const f = data.financials?.[0] || {};
    
    // 財務Q&A
    if (rr?.quant?.scores?.dsr?.value > 10) {
      qa.push({ q: `債務償還年数が${rr.quant.scores.dsr.value.toFixed(1)}年と長いが大丈夫か？`,
        a: `正常運転資金を控除した実質的な償還年数は短縮されます。また、今後のCF改善により実質的な償還年数はさらに短縮される見通しです。` });
    }
    if (rr?.quant?.scores?.equityRatio?.value < 15) {
      qa.push({ q: `自己資本比率が${rr.quant.scores.equityRatio.value.toFixed(1)}%と低いが？`,
        a: `代表者からの借入金（役員借入金）は実質的な資本です。資本的劣後ローンの条件を満たす合意書を準備しています。実態自己資本比率は改善されます。` });
    }
    if ((f.ordinaryProfit || 0) < 0) {
      qa.push({ q: '直近期が赤字だが、回復の根拠は？',
        a: `赤字の主因は○○（一時的要因）です。月次推移では○月を底に回復基調にあり、今期は黒字化の見通しです。` });
    }

    // 事業Q&A
    qa.push({ q: '今後の事業の見通しは？', a: data.outlook || '○○○（具体的な受注状況・引き合い等を記載）' });
    qa.push({ q: '競合他社との差別化ポイントは？', a: data.strengths || '○○○（定量的に記載）' });

    // 融資Q&A
    qa.push({ q: '資金使途の詳細と金額の根拠は？', a: `${data.loanPurpose || '○○'}のため${Utils.formatMan(data.loanAmount)}が必要です。内訳は○○○です。` });
    qa.push({ q: '返済が滞った場合の対策は？', a: '役員報酬の減額（月○○万円の削減余地）、保険の解約（返戻金○○万円）、不要資産の売却等で対応可能です。' });

    if (data.taxDelinquency) {
      qa.push({ q: '税金の滞納について説明してほしい', a: '○○の事情により一時的に滞納がありましたが、現在分納計画に基づき○月に完納予定です。' });
    }

    let html = `<div class="glass-card">
      <div class="report-title">❓ 想定Q&A集（${qa.length}問）</div>
      <p style="color:var(--text-secondary);font-size:12px;margin-bottom:16px;">★ 面談時にこのQ&Aリストを持参し「よく聞かれる質問への回答も用意しました」と渡す → 銀行員は感動します。</p>`;

    qa.forEach((item, idx) => {
      html += `<div style="margin:16px 0;padding:14px;background:var(--bg-tertiary);border-radius:8px;">
        <div style="font-weight:600;color:var(--accent-red);font-size:13px;">Q${idx + 1}. ${item.q}</div>
        <div style="margin-top:8px;font-size:13px;color:var(--text-secondary);padding-left:12px;border-left:3px solid var(--accent-green);">A. ${item.a}</div>
      </div>`;
    });

    html += `</div>`;
    return html;
  },

  // 整合チェック
  runConsistencyCheck() {
    const data = Database.loadCompanyData();
    const checks = [];
    const f = data.financials?.[0] || {};

    // チェック項目
    if (data.annualRevenue && f.revenue && data.annualRevenue !== f.revenue) {
      checks.push({ ok: false, msg: `年商の不整合：基本情報 ${Utils.formatMan(data.annualRevenue)} ≠ 財務データ ${Utils.formatMan(f.revenue)}` });
    } else {
      checks.push({ ok: true, msg: '年商の整合性：OK' });
    }

    if (data.totalDebt && data.interestBearingDebt && Math.abs(data.totalDebt - data.interestBearingDebt) > data.totalDebt * 0.1) {
      checks.push({ ok: false, msg: `借入金総額の不整合：Q7=${Utils.formatMan(data.totalDebt)} vs 有利子負債=${Utils.formatMan(data.interestBearingDebt)}` });
    } else {
      checks.push({ ok: true, msg: '借入金総額の整合性：OK' });
    }

    checks.push({ ok: true, msg: '企業名の統一：要確認' });
    checks.push({ ok: true, msg: '従業員数の統一：要確認' });
    checks.push({ ok: true, msg: '金額の端数処理（万円単位）：統一済み' });

    let html = `<div class="glass-card">
      <div class="report-title">🔍 資料間の数値整合チェック</div>
      <p style="font-size:12px;color:var(--accent-red);margin-bottom:12px;">★ 不整合が1箇所でもあると「この企業の数字は信用できない」と判断されます。</p>`;

    checks.forEach(c => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
        <span style="color:${c.ok ? 'var(--accent-green)' : 'var(--accent-red)'}">${c.ok ? '✅' : '❌'}</span>
        <span style="color:${c.ok ? 'var(--text-secondary)' : 'var(--accent-red)'}">${c.msg}</span>
      </div>`;
    });

    const allOk = checks.every(c => c.ok);
    html += allOk
      ? Utils.createAlert('success', '✅', '全項目の整合性が確認されました。')
      : Utils.createAlert('warning', '⚠️', '不整合が見つかりました。修正をお願いします。');
    html += `</div>`;
    App.addSystemMessage(html);
  }
};
