/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 審査方式マルチモードエンジン
 * スコアリング審査・リレーションシップ審査・ABL審査・
 * 政策金融審査・創業審査・不動産担保審査に対応
 * ============================================================ */

const AssessmentModes = {
  // 審査方式の定義
  modes: {
    standard: {
      id: 'standard',
      name: '標準審査（銀行格付型）',
      icon: '🏦',
      desc: 'メガバンク・地銀の一般的な審査方式。定量スコア（財務指標）を中心に、定性評価を加味。',
      weights: { safety: 25, profitability: 25, growth: 15, repayment: 20, efficiency: 15 },
      focus: '財務数値の健全性とCF（キャッシュフロー）による返済能力',
      bestFor: '年商1億円以上の中小企業、正常先〜正常先下位'
    },
    scoring: {
      id: 'scoring',
      name: 'スコアリング審査（自動審査型）',
      icon: '🤖',
      desc: 'メガバンク・一部地銀が小口融資で使用。CRDスコア等の統計モデルで自動判定。人的判断の余地が少ない。',
      weights: { safety: 20, profitability: 20, growth: 10, repayment: 30, efficiency: 20 },
      focus: '返済能力と効率性のスコアが最重要。定性評価はほぼ反映されない',
      bestFor: '小口融資（500万円〜3,000万円）、決算書の数値が良好な企業',
      tips: [
        '決算書の数値が全て。人物評価・事業計画は殆ど考慮されない',
        '営業利益が黒字であることが最低条件',
        '自己資本比率15%以上が一つの目安',
        '税金滞納は即NG',
        '申込金額を抑えるとスコアが改善する可能性あり'
      ]
    },
    relationship: {
      id: 'relationship',
      name: 'リレーションシップ審査（信金・信組型）',
      icon: '🤝',
      desc: '信用金庫・信用組合の主な審査方式。経営者の人物評価、地域貢献、取引関係を重視。数字だけでは見えない企業の実力を評価。',
      weights: { safety: 15, profitability: 15, growth: 15, repayment: 20, efficiency: 10 },
      qualitativeWeight: 25,
      focus: '経営者の人柄・誠実さ・事業への情熱、地域経済への貢献度',
      bestFor: '年商5,000万円〜5億円の地域密着企業、信金・信組との取引',
      tips: [
        '経営者の人物評価が非常に大きなウェイトを占める',
        '定期的な訪問・報告でコミュニケーションを密にする',
        '地域の雇用・経済への貢献をアピール',
        '理事長・支店長との面談機会を大切にする',
        '赤字でも「この人なら」で通ることがある',
        '逆に黒字でも信頼関係が薄いと通らないこともある'
      ]
    },
    abl: {
      id: 'abl',
      name: 'ABL審査（動産・債権担保型）',
      icon: '📦',
      desc: '売掛金・在庫等の流動資産を担保にする融資の審査方式。担保対象資産の質と管理体制を重視。',
      weights: { safety: 10, profitability: 15, growth: 10, repayment: 20, efficiency: 20 },
      ablWeight: 25,
      focus: '売掛金の質（取引先の信用力）、在庫の流動性、担保管理体制',
      bestFor: '売掛金・在庫が多い企業、不動産担保が不足している企業',
      tips: [
        '売掛先の信用力が担保価値に直結する',
        '在庫は種類・保管状況・陳腐化リスクで評価が大きく変わる',
        '在庫管理システムの整備が求められる',
        '掛目：売掛金70〜90%、在庫30〜70%が一般的',
        '月次での担保明細報告が必要'
      ]
    },
    policy: {
      id: 'policy',
      name: '政策金融審査（公庫・商工中金型）',
      icon: '🏛️',
      desc: '日本政策金融公庫・商工中金の審査方式。事業の社会性・公共性、計画の合理性を重視。民間では通りにくい案件もカバー。',
      weights: { safety: 15, profitability: 15, growth: 20, repayment: 25, efficiency: 10 },
      policyWeight: 15,
      focus: '事業計画の合理性と実現可能性、事業の社会的意義、自己資金比率',
      bestFor: '創業企業、業況悪化企業、民間で断られた企業、設備投資案件',
      tips: [
        '事業計画書の完成度が審査の最重要ポイント',
        '面談で事業への理解度・情熱を伝えることが重要',
        '自己資金比率は融資額の1/3以上が理想（最低1/10）',
        '業種経験・関連資格があると大幅プラス',
        '民間銀行との協調融資を提案すると好印象',
        '否決されても理由を聞いて再チャレンジ可能'
      ]
    },
    startup: {
      id: 'startup',
      name: '創業審査',
      icon: '🚀',
      desc: '創業〜5年未満の企業向け審査方式。実績がないため、経営者の経験・能力と事業計画の質で判断。',
      weights: { safety: 5, profitability: 10, growth: 25, repayment: 15, efficiency: 5 },
      startupWeight: 40,
      focus: '経営者の業界経験、事業計画の実現可能性、自己資金の充実度、市場性',
      bestFor: '創業予定〜創業5年未満、初めての融資',
      tips: [
        '自己資金は融資希望額の1/3以上用意するのが理想',
        '業界経験年数が長いほど有利（5年以上推奨）',
        '創業の動機を明確に説明できること',
        '売上の根拠を具体的に積み上げ方式で',
        '初年度は保守的な計画、2〜3年目で成長を描く',
        '既に顧客候補・受注見込みがあると大幅有利',
        '公庫の新規開業資金 or スタートアップ創出促進保証が第一候補'
      ]
    },
    realEstate: {
      id: 'realEstate',
      name: '不動産担保審査',
      icon: '🏠',
      desc: '不動産を担保にした融資の審査方式。担保不動産の評価額と掛目が融資額の上限を決める。企業の信用力よりも担保価値を重視。',
      weights: { safety: 20, profitability: 10, growth: 5, repayment: 15, efficiency: 10 },
      collateralWeight: 40,
      focus: '担保不動産の評価額（路線価・固定資産税評価・市場価格）、掛目、先順位の有無',
      bestFor: '不動産を保有する企業、格付けが低いが担保余力がある場合',
      tips: [
        '評価方法：路線価×面積が基本（市場価格の80%程度）',
        '掛目：住宅地70%、商業地60%、工業地50%が目安',
        '先順位（住宅ローン等）の残高を控除した余力が融資限度',
        '複数筆の不動産を組み合わせて担保力を最大化',
        '固定資産税評価証明書・登記簿謄本を事前に取得',
        '不動産鑑定士の評価書があると銀行評価UP'
      ]
    },
    enterpriseValue: {
      id: 'enterpriseValue',
      name: '企業価値担保審査（2026年新制度）',
      icon: '💎',
      desc: '事業性融資推進法（2026年5月施行）に基づく新しい審査方式。事業全体の価値（有形＋無形資産＋将来CF）を包括的に担保評価。',
      weights: { safety: 10, profitability: 20, growth: 25, repayment: 20, efficiency: 10 },
      evWeight: 15,
      focus: '事業の将来キャッシュフロー、無形資産（技術力・ブランド・顧客基盤）の価値',
      bestFor: 'IT/サービス業、スタートアップ、知財を持つ企業、不動産を持たない企業',
      tips: [
        '将来CF予測の合理性が最重要',
        '無形資産の価値を定量的に説明できること',
        '特許・商標・顧客契約等の知的財産リストを充実させる',
        'コベナンツ（財務制限条項）の設定に同意が必要',
        '月次のモニタリング報告が義務付けられる',
        '信託契約の締結が前提',
        '制度開始初期は金融機関の対応体制に差がある'
      ]
    }
  },

  currentMode: 'standard',

  // 審査方式選択UI
  showModeSelector() {
    let html = `<div class="glass-card highlight">
      <div class="report-title">🔀 審査方式の選択</div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">
        対象の金融機関や状況に合わせて、最適な審査方式を選択してください。<br>
        審査方式によって評価のウェイトや重視ポイントが変わります。
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">`;

    Object.values(this.modes).forEach(mode => {
      const isActive = mode.id === this.currentMode;
      html += `<div class="glass-card${isActive ? ' highlight' : ''}" style="padding:16px;cursor:pointer;position:relative;"
        onclick="AssessmentModes.selectMode('${mode.id}')">
        ${isActive ? '<span class="tag tag-success" style="position:absolute;top:8px;right:8px;">選択中</span>' : ''}
        <div style="font-size:24px;margin-bottom:8px;">${mode.icon}</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${mode.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">${mode.bestFor}</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${mode.desc}</div>
      </div>`;
    });

    html += `</div></div>`;
    App.addSystemMessage(html);
  },

  // 審査方式を選択
  selectMode(modeId) {
    if (!this.modes[modeId]) return;
    this.currentMode = modeId;
    const mode = this.modes[modeId];

    // 設定を保存
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    settings.assessmentMode = modeId;
    Database.save(Database.KEYS.SETTINGS, settings);

    let html = `<div class="glass-card highlight">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:32px;">${mode.icon}</span>
        <div>
          <div style="font-size:16px;font-weight:700;">${mode.name}</div>
          <div style="font-size:12px;color:var(--accent-green);">✅ 選択されました</div>
        </div>
      </div>

      <div class="report-subtitle" style="margin-top:16px;">📊 評価ウェイト配分</div>
      <div style="margin:12px 0;">`;

    const labels = { safety: '安全性', profitability: '収益性', growth: '成長性', repayment: '返済能力', efficiency: '効率性' };
    const totalBase = Object.values(mode.weights).reduce((a, b) => a + b, 0);
    const extraKeys = {
      qualitativeWeight: '定性評価（人物）',
      ablWeight: '担保資産評価',
      policyWeight: '事業計画・社会性',
      startupWeight: '創業者評価',
      collateralWeight: '担保不動産評価',
      evWeight: '無形資産・将来CF'
    };

    Object.entries(mode.weights).forEach(([key, val]) => {
      html += `<div style="margin:6px 0;">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
          <span>${labels[key] || key}</span><span style="font-weight:600;">${val}%</span>
        </div>
        ${Utils.createProgressBar(val, 40)}
      </div>`;
    });

    // 追加ウェイト
    Object.entries(extraKeys).forEach(([key, label]) => {
      if (mode[key]) {
        html += `<div style="margin:6px 0;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
            <span style="color:var(--accent-gold);">★ ${label}</span><span style="font-weight:600;color:var(--accent-gold);">${mode[key]}%</span>
          </div>
          ${Utils.createProgressBar(mode[key], 40, 'warning')}
        </div>`;
      }
    });

    html += `</div>
      <div class="report-subtitle">🎯 重視ポイント</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${mode.focus}</div>`;

    if (mode.tips) {
      html += `<div class="report-subtitle">💡 攻略のコツ</div>`;
      mode.tips.forEach(tip => {
        html += `<div style="display:flex;gap:8px;padding:4px 0;font-size:12px;color:var(--text-secondary);">
          <span style="color:var(--accent-cyan);flex-shrink:0;">▸</span><span>${tip}</span>
        </div>`;
      });
    }

    html += `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="App.executeCommand('/診断')">🔍 この方式で診断する</button>
      <button class="btn btn-secondary" onclick="AssessmentModes.showModeSelector()">🔀 方式を変更する</button>
    </div></div>`;

    App.addSystemMessage(html);
  },

  // 現在の審査方式のウェイトを取得
  getWeights() {
    const mode = this.modes[this.currentMode];
    return mode ? mode.weights : this.modes.standard.weights;
  },

  // 現在の審査方式情報
  getCurrentMode() {
    return this.modes[this.currentMode];
  },

  // 初期化（保存済み設定を読み込む）
  initFromSettings() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    if (settings.assessmentMode && this.modes[settings.assessmentMode]) {
      this.currentMode = settings.assessmentMode;
    }
  }
};
