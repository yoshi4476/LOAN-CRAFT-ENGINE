/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 融資方法最適選択エンジン
 * 保証協会・公庫・企業価値担保権・金融機関タイプ別攻略
 * ============================================================ */

const LoanSelector = {

  // 最適融資方法の選定
  execute() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const mr = Database.loadMatrixResult();
    const grade = rr?.grade || 'B';

    const recommendations = this.analyzeOptions(data, grade, rr);
    this.renderResult(data, grade, recommendations);
  },

  // 融資手段の分析
  analyzeOptions(data, grade, rr) {
    const results = [];
    const years = data.yearsInBusiness || 0;
    const rev = data.annualRevenue || 0;
    const loanAmt = data.loanAmount || 0;
    const hasCollateral = data.collateral && data.collateral !== 'なし' && data.collateral.length > 2;
    const hasTaxIssue = data.taxDelinquency;
    const hasReschedule = data.rescheduleHistory;
    const guaranteeBal = data.guaranteeBalance || 0;
    const isStartup = years < 5;

    // 1. 信用保証協会
    if (!hasTaxIssue) {
      // スタートアップ創出促進保証
      if (isStartup && loanAmt <= 3500) {
        results.push({
          priority: 1, type: '信用保証協会',
          name: 'スタートアップ創出促進保証(SSS)',
          limit: '3,500万円', rate: '保証料優遇', guarantee: '100%',
          detail: '経営者保証不要！自己資金1/10以上が必要。創業〜5年未満対象。',
          merit: '★ 経営者保証不要の創業融資として最有力',
          conditions: ['創業予定〜5年未満', '自己資金が借入額の1/10以上']
        });
      }

      // 協調支援型特別保証（v5.0新設）
      if (guaranteeBal < 28000 && !isStartup) {
        results.push({
          priority: 2, type: '信用保証協会',
          name: '協調支援型特別保証',
          limit: '2.8億円（別枠）', rate: '0.45〜1.90%（国が最大1/2補助）', guarantee: '80%',
          detail: 'プロパー融資1割以上併用、または経営行動計画策定で利用可能。2025年3月〜2028年3月。',
          merit: '★ 保証料補助あり・一般保証とは別枠の大型制度',
          conditions: ['プロパー融資1割以上併用 or 経営行動計画策定', '2028年3月まで']
        });
      }

      // 一般保証
      if (guaranteeBal < 28000) {
        const remain = 28000 - guaranteeBal;
        results.push({
          priority: 3, type: '信用保証協会',
          name: '一般保証（無担保保証＋普通保証）',
          limit: `残枠 約${Utils.formatMan(remain)}`, rate: '0.45〜1.90%', guarantee: '80%',
          detail: '無担保保証8,000万円＋普通保証2億円＝計2.8億円の範囲内。',
          merit: '最も汎用的な保証制度',
          conditions: ['中小企業者の要件を満たすこと', '対象業種であること']
        });
      }

      // 経営改善サポート保証
      if (grade === 'C' || grade === 'D') {
        results.push({
          priority: 2, type: '信用保証協会',
          name: '経営改善サポート保証（強化型）',
          limit: '2.8億円（別枠）', rate: '0.4%（国補助後）', guarantee: '80%',
          detail: '再生計画に基づく融資。保証料が大幅に優遇される。2027年3月末まで。',
          merit: '★ 要注意先でも利用可能な別枠・低保証料制度',
          conditions: ['認定支援機関連携', '再生計画策定']
        });
      }
    }

    // 2. 日本政策金融公庫
    if (isStartup) {
      results.push({
        priority: 1, type: '日本政策金融公庫',
        name: '新規開業・スタートアップ支援資金',
        limit: '7,200万円（運転4,800万円）', rate: '基準金利', guarantee: '—',
        detail: '創業〜7年以内。無担保・無保証枠あり。事業計画の完成度が最重要。',
        merit: '★ 民間が出しにくい創業融資の最有力候補',
        conditions: ['創業〜7年以内', '事業計画書の提出']
      });
    }

    if (grade === 'C' || grade === 'D' || grade === 'E') {
      results.push({
        priority: 2, type: '日本政策金融公庫',
        name: '資本性劣後ローン（挑戦支援資本強化特例）',
        limit: '7,200万円', rate: '業績連動', guarantee: '—',
        detail: '★最強ツール★ BSの自己資本に加算され、債務超過が実質解消。格付けが劇的に改善する可能性あり。',
        merit: '★★★ 自己資本とみなされ格付けが劇的改善',
        conditions: ['スタートアップ・再生企業等', '公庫の審査基準を満たすこと']
      });
    }

    // 経営環境変化対応資金
    results.push({
      priority: 4, type: '日本政策金融公庫',
      name: '経営環境変化対応資金（セーフティネット貸付）',
      limit: '4,800万円', rate: '基準金利', guarantee: '—',
      detail: '業況悪化企業が対象。幅広い対象で利用しやすい。',
      merit: '業況悪化時のセーフティネット',
      conditions: ['業況が悪化している中小企業']
    });

    // 3. 企業価値担保権（v5.0新制度）
    if (!hasCollateral && data.strengths && data.strengths.length > 5) {
      results.push({
        priority: 3, type: '企業価値担保権',
        name: '企業価値担保権融資（2026年5月施行）',
        limit: '事業価値に応じて', rate: '個別交渉', guarantee: '—',
        detail: '事業全体の価値を担保にする新制度。不動産不要。ブランド・顧客基盤・技術力を評価。',
        merit: '★ 不動産なしでも事業力で融資を引き出せる画期的制度',
        conditions: ['信託契約の締結', 'コベナンツ設定に同意', '定期モニタリング報告', '2026年5月25日以降']
      });
    }

    // 4. プロパー融資
    if (grade === 'S+' || grade === 'S' || grade === 'A') {
      results.push({
        priority: 1, type: 'プロパー融資',
        name: 'プロパー融資（民間銀行）',
        limit: '個別審査', rate: '格付け次第（0.5〜2.5%）', guarantee: '—',
        detail: '保証なし・担保条件交渉可。格付けS以上で好条件が期待できる。',
        merit: '★ 保証料不要・低金利・取引深化',
        conditions: ['正常先（上位）以上の格付け', '十分なCF']
      });
    }

    // ソートして返す
    return results.sort((a, b) => a.priority - b.priority);
  },

  // 結果表示
  renderResult(data, grade, recommendations) {
    let html = `<div class="glass-card highlight">
      <div class="report-title">🏦 融資方法の最適選択</div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">
        格付け ${Utils.createGradeBadge(grade)} に基づき、利用可能な融資手段を優先順位付きで提示します。
      </p>`;

    // 推奨スキーム
    recommendations.forEach((rec, idx) => {
      const isTop = idx === 0;
      html += `<div class="glass-card${isTop ? ' highlight' : ''}" style="margin:12px 0;position:relative;">
        ${isTop ? '<div style="position:absolute;top:-8px;right:16px;"><span class="tag tag-success">🏆 第1候補</span></div>' : `<span class="tag tag-primary" style="margin-bottom:8px;">第${idx + 1}候補</span>`}
        <div style="display:flex;align-items:center;gap:8px;margin:${isTop ? '4px' : '8px'} 0 8px;">
          <span style="font-size:11px;color:var(--text-muted);background:var(--bg-tertiary);padding:2px 8px;border-radius:4px;">${rec.type}</span>
          <span style="font-size:15px;font-weight:700;">${rec.name}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:12px 0;">
          <div><span style="font-size:11px;color:var(--text-muted);">限度額</span><div style="font-weight:600;font-size:13px;">${rec.limit}</div></div>
          <div><span style="font-size:11px;color:var(--text-muted);">保証料率/金利</span><div style="font-weight:600;font-size:13px;">${rec.rate}</div></div>
          <div><span style="font-size:11px;color:var(--text-muted);">保証割合</span><div style="font-weight:600;font-size:13px;">${rec.guarantee}</div></div>
        </div>
        <div style="font-size:13px;color:var(--text-secondary);margin:8px 0;">${rec.detail}</div>
        <div style="font-size:12px;color:var(--accent-gold);margin:4px 0;">💡 ${rec.merit}</div>
        <div style="margin-top:8px;">
          <span style="font-size:11px;color:var(--text-muted);">利用条件：</span>
          ${rec.conditions.map(c => `<span class="tag" style="margin:2px;background:rgba(255,255,255,0.05);color:var(--text-secondary);font-size:10px;">${c}</span>`).join('')}
        </div>
      </div>`;
    });

    // 金融機関タイプ別攻略
    html += `<div class="report-subtitle" style="margin-top:24px;">🎯 金融機関タイプ別攻略ポイント</div>`;

    const rev = data.annualRevenue || 0;
    let recommendedType = '';
    if (rev >= 100000) recommendedType = 'メガバンク';
    else if (rev >= 10000) recommendedType = '地方銀行';
    else if (rev >= 5000) recommendedType = '地方銀行 / 信用金庫';
    else recommendedType = '信用金庫 / 日本政策金融公庫';

    html += `<div class="alert-card info" style="margin-bottom:12px;">
      <span class="alert-icon">🎯</span>
      <div>年商 ${Utils.formatMan(rev)} の場合、<strong>${recommendedType}</strong> が最適な攻略先です。</div>
    </div>`;

    const bankTypes = [
      { name: 'メガバンク', target: '年商10億円以上', key: '定量重視', tip: '財務数値を徹底的に磨く。取引ボリュームの将来性を示す。' },
      { name: '地方銀行', target: '年商1〜30億円', key: '定量+定性バランス', tip: '地域雇用・社会性をアピール。事業計画の将来性を丁寧に説明。' },
      { name: '信用金庫', target: '年商5,000万〜5億円', key: '定性（人物）重視', tip: '経営者の人柄・情熱・誠実さで勝負。こまめなコミュニケーション。' },
      { name: '日本政策金融公庫', target: '創業・小規模企業', key: '事業計画重視', tip: '事業計画書の完成度が最重要。自己資金比率を高めておく。面談対策を入念に。' }
    ];

    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">`;
    bankTypes.forEach(bt => {
      const isRec = recommendedType.includes(bt.name);
      html += `<div class="glass-card${isRec ? ' highlight' : ''}" style="padding:16px;">
        ${isRec ? '<span class="tag tag-success" style="margin-bottom:6px;">推奨</span>' : ''}
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${bt.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">${bt.target} | ${bt.key}</div>
        <div style="font-size:12px;color:var(--text-secondary);">★ ${bt.tip}</div>
      </div>`;
    });
    html += `</div>`;

    // 協調融資戦略
    html += `<div class="report-subtitle" style="margin-top:20px;">🔗 協調融資戦略</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;">
        <strong>パターン①：公庫をテコに民間を引き出す</strong><br>
        公庫で先に融資を確定→「公庫が審査を通した」を材料に民間銀行に申込<br><br>
        <strong>パターン②：資本性劣後ローンで体質改善</strong><br>
        公庫の資本性劣後ローンで自己資本を実質強化→格付け改善→民間融資が通りやすくなる<br><br>
        <strong>パターン③：公庫＋保証協会＋民間のトリプル構成</strong><br>
        設備資金の一部を公庫、運転資金を保証付き＋プロパーMIX→リスク分散で各機関が出しやすい
      </div>`;

    html += `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="App.executeCommand('/資料ALL')">📄 資料一括作成</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/保証協会')">🛡️ 保証制度の詳細</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/企業価値担保')">🔑 企業価値担保権の詳細</button>
    </div></div>`;

    App.addSystemMessage(html);
  },

  // 保証協会制度の詳細表示
  showGuaranteeDetail() {
    const data = Database.loadCompanyData();
    let html = `<div class="glass-card">
      <div class="report-title">🛡️ 信用保証協会 — 全制度マスター</div>`;

    // 利用可否チェック
    html += `<div class="report-subtitle">✅ 利用可否チェックリスト</div>`;
    const checks = [
      { label: '中小企業者の要件', ok: true },
      { label: '対象業種', ok: true },
      { label: '税金滞納なし', ok: !data.taxDelinquency },
      { label: '代位弁済履歴なし', ok: true }
    ];
    checks.forEach(c => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;">
        <span style="color:${c.ok ? 'var(--accent-green)' : 'var(--accent-red)'}">${c.ok ? '✅' : '❌'}</span>
        <span>${c.label}</span>
      </div>`;
    });

    // 制度一覧テーブル
    html += `<div class="report-subtitle">📋 保証制度一覧（2026年3月最新版）</div>`;

    const guaranteeData = [
      ['一般保証（普通保証）', '2億円', '80%', '0.45〜1.90%', '汎用的'],
      ['一般保証（無担保）', '8,000万円', '80%', '0.45〜1.90%', '担保不要'],
      ['SN4号（突発的災害）', '別枠2.8億', '100%', '—', '売上20%↓'],
      ['SN5号（業況悪化業種）', '別枠2.8億', '80%', '—', '指定業種'],
      ['協調支援型特別保証 ★新', '別枠2.8億', '80%', '国1/2補助', 'プロパー1割併用'],
      ['モニタリング強化型 ★新', '別枠2.8億', '80%', '国1/2補助', '認定支援機関連携'],
      ['経営改善サポート ★強化', '別枠2.8億', '80%', '0.4%', '再生計画'],
      ['スタートアップ創出促進(SSS)', '3,500万円', '100%', '優遇', '経保不要'],
    ];

    html += Utils.createTable(
      ['制度名', '限度額', '保証割合', '保証料率', '特徴'],
      guaranteeData
    );

    html += `</div>`;
    App.addSystemMessage(html);
  },

  // 企業価値担保権の詳細
  showEnterpriseValueCollateral() {
    const data = Database.loadCompanyData();
    let html = `<div class="glass-card">
      <div class="report-title">🔑 企業価値担保権（2026年5月施行）</div>
      <div class="alert-card info"><span class="alert-icon">📢</span><div>
        事業性融資推進法に基づく画期的な新制度。従来の不動産担保に代わり、<strong>事業全体の価値</strong>を担保に融資を受けられます。
      </div></div>

      <div class="report-subtitle">📊 担保対象となる「企業価値」</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin:12px 0;">
        <div class="glass-card" style="padding:12px;text-align:center;"><span style="font-size:20px;">🏢</span><div style="font-size:12px;margin-top:4px;">有形資産</div><div style="font-size:11px;color:var(--text-muted);">不動産・機械設備・在庫</div></div>
        <div class="glass-card" style="padding:12px;text-align:center;"><span style="font-size:20px;">💡</span><div style="font-size:12px;margin-top:4px;">無形資産</div><div style="font-size:11px;color:var(--text-muted);">ブランド・技術力・知財・人材</div></div>
        <div class="glass-card" style="padding:12px;text-align:center;"><span style="font-size:20px;">📈</span><div style="font-size:12px;margin-top:4px;">将来CF</div><div style="font-size:11px;color:var(--text-muted);">将来のキャッシュフロー</div></div>
        <div class="glass-card" style="padding:12px;text-align:center;"><span style="font-size:20px;">⭐</span><div style="font-size:12px;margin-top:4px;">のれん</div><div style="font-size:11px;color:var(--text-muted);">事業の超過収益力</div></div>
      </div>

      <div class="report-subtitle">🎯 特にメリットが大きい企業</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
        ✅ 不動産を持たないIT/サービス業<br>
        ✅ スタートアップ<br>
        ✅ 知財・技術力が強みの企業<br>
        ✅ 事業再生フェーズの企業<br>
        ✅ 経営者保証を外したい企業
      </div>

      <div class="report-subtitle">⚠️ 注意点</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
        ・信託契約の締結が必要（担保権者は信託会社）<br>
        ・コベナンツ（財務制限条項）の設定が前提<br>
        ・定期的なモニタリング報告が必要<br>
        ・制度開始直後は金融機関の対応体制が未整備の可能性あり
      </div>
    </div>`;

    App.addSystemMessage(html);
  }
};
