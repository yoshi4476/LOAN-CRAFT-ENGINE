/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 総合戦略レポート・保証解除・金利交渉
 * ============================================================ */

const Strategy = {

  // 総合戦略レポート生成
  generateFullReport() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const mr = Database.loadMatrixResult();
    if (!rr) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '格付け診断が未実行です。先に <code>/診断</code> をご利用ください。'));
      return;
    }

    const grade = rr.grade;
    const matrixResult = mr?.matrixResult || { result: '—', color: 'marginal' };
    const probMap = { 'sure': 90, 'likely': 75, 'marginal': 50, 'difficult': 25, 'impossible': 5 };
    const prob = probMap[matrixResult.color] || 50;
    const stars = Math.round(prob / 20);
    const recommendations = LoanSelector.analyzeOptions(data, grade, rr);

    let html = `<div class="glass-card highlight">
      <div class="report-title" style="font-size:18px;">📋 融資獲得戦略レポート v5.0</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:20px;">作成日：${Utils.formatDate(new Date())}</div>

      <!-- 1. 総合判定 -->
      <div class="report-subtitle">■ 1. 総合判定</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:12px 0;">
        <div class="glass-card" style="text-align:center;padding:16px;">
          <div style="font-size:11px;color:var(--text-muted);">融資成功確率</div>
          <div style="font-size:32px;font-weight:800;color:var(--primary)">${prob}%</div>
        </div>
        <div class="glass-card" style="text-align:center;padding:16px;">
          <div style="font-size:11px;color:var(--text-muted);">推定格付け</div>
          <div style="margin-top:4px;">${Utils.createGradeBadge(grade)}</div>
        </div>
        <div class="glass-card" style="text-align:center;padding:16px;">
          <div style="font-size:11px;color:var(--text-muted);">総合難易度</div>
          <div style="font-size:20px;margin-top:4px;">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
        </div>
      </div>

      <!-- 2. 推奨融資スキーム -->
      <div class="report-subtitle">■ 2. 推奨融資スキーム（TOP3）</div>`;

    recommendations.slice(0, 3).forEach((rec, idx) => {
      html += `<div class="glass-card" style="margin:8px 0;padding:14px;">
        <span class="tag tag-primary">第${idx + 1}候補</span>
        <span style="font-weight:700;margin-left:8px;">${rec.name}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">${rec.type}</span>
        <div style="margin-top:8px;font-size:12px;color:var(--text-secondary);">
          限度額：${rec.limit} / 金利目安：${rec.rate}
        </div>
      </div>`;
    });

    // 3. 格付け改善プラン
    html += `<div class="report-subtitle">■ 3. 格付け改善プラン</div>`;
    const improvements = [];
    if (rr.bottlenecks?.length > 0) {
      rr.bottlenecks.forEach(b => {
        improvements.push(`${b.label}の改善（現在スコア ${b.score}/5）`);
      });
    }
    if (data.negativeEquity) improvements.push('代表者借入金の資本振替で実態債務超過を解消');
    if (data.taxDelinquency) improvements.push('税金滞納の解消（最優先）');
    improvements.push('月次試算表の定期提出を開始（情報開示の実績作り）');

    const timeframes = ['即時実行可能', '3ヶ月以内', '次期決算まで'];
    improvements.forEach((imp, idx) => {
      const tf = timeframes[Math.min(idx, 2)];
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
        <span class="tag tag-${idx === 0 ? 'danger' : idx === 1 ? 'warning' : 'primary'}" style="min-width:100px;justify-content:center;">${tf}</span>
        <span>${imp}</span>
      </div>`;
    });

    // 4. 必要資料リスト
    html += `<div class="report-subtitle">■ 4. 必要資料リスト</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
        <span class="tag tag-danger" style="margin-right:4px;">必須</span> エグゼクティブサマリー<br>
        <span class="tag tag-danger" style="margin-right:4px;">必須</span> 企業概要書<br>
        <span class="tag tag-danger" style="margin-right:4px;">必須</span> 資金繰り表（12ヶ月）<br>
        <span class="tag tag-danger" style="margin-right:4px;">必須</span> 借入金一覧表<br>
        <span class="tag tag-warning" style="margin-right:4px;">推奨</span> 事業計画書<br>
        <span class="tag tag-warning" style="margin-right:4px;">推奨</span> 返済計画シミュレーション<br>
        <span class="tag tag-success" style="margin-right:4px;">効果大</span> 取引深耕提案書<br>
        <span class="tag tag-success" style="margin-right:4px;">効果大</span> 想定Q&A集
      </div>`;

    // 6. 銀行面談シナリオ
    html += `<div class="report-subtitle">■ 6. 銀行面談シナリオ</div>
      <div class="flow-chart">
        <div class="flow-node">① 挨拶・自己紹介（2分）</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">② 事業概要の説明（5分）→ 企業概要書を渡す</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">③ 融資のお願い（3分）→ エグゼクティブサマリーを渡す</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">④ 資金使途と返済計画の説明（10分）</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">⑤ 質疑応答（10分）→ Q&A集を渡す</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">⑥ 取引メリットの提示（5分）→ 取引深耕提案書を渡す</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0;">
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--accent-red);margin-bottom:6px;">✗ NGワード</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;">
            「急いでいるのですぐ出してほしい」<br>
            「他行は出すと言っている」（嘘）<br>
            「とりあえず○○万円」（根拠なし）
          </div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--accent-green);margin-bottom:6px;">✓ 効果的ワード</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;">
            「メインバンクとしてお付き合いを」<br>
            「計画書と資金繰り表を作成しました」<br>
            「月次試算表は毎月ご提出します」
          </div>
        </div>
      </div>`;

    // 8. アクションプラン
    html += `<div class="report-subtitle">■ 8. アクションプラン</div>
      <div style="font-size:13px;color:var(--text-secondary);">`;
    const actions = [
      { day: 'Day 1-3', task: '不足資料の準備・決算書等の整理' },
      { day: 'Day 4-7', task: '資料ドラフトの完成・数値の最終確認' },
      { day: 'Day 8-10', task: '税理士・支援機関との内容確認' },
      { day: 'Day 11', task: '銀行アポイント取得' },
      { day: 'Day 14', task: '★ 銀行面談・融資申込 ★' },
      { day: 'Day 14-28', task: '審査期間（追加資料要請に即対応）' },
      { day: 'Day 28-35', task: '融資実行（目安）' }
    ];
    actions.forEach(a => {
      html += `<div class="report-row"><span class="label">${a.day}</span><span class="value" style="font-family:var(--font-primary);font-size:12px;">${a.task}</span></div>`;
    });
    html += `</div>`;

    // 9. 経営者保証
    html += `<div class="report-subtitle">■ 9. 経営者保証戦略</div>
      <div style="font-size:13px;color:var(--text-secondary);">
        希望：${data.guaranteePreference || '—'}<br>
        現時点での保証解除可能性：${grade === 'S+' || grade === 'S' ? '★可能性高い' : grade === 'A' || grade === 'B' ? '△条件付きで可能' : '✗ 現時点では困難'}<br>
        企業価値担保権の活用可能性：${data.strengths && data.strengths.length > 5 ? '★検討価値あり' : '△要検討'}
      </div>`;

    html += `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="App.executeCommand('/資料ALL')">📄 資料作成に進む</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/面談準備')">🤝 面談準備ガイド</button>
    </div></div>`;

    App.addSystemMessage(html);
  },

  // 面談準備ガイド
  showMeetingPrep() {
    const data = Database.loadCompanyData();
    let html = `<div class="glass-card">
      <div class="report-title">🤝 銀行面談準備ガイド</div>

      <div class="report-subtitle">📋 持参物チェックリスト</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2.2;">
        □ 決算書（直近3期分）原本<br>
        □ 法人税申告書（直近3期分）<br>
        □ 試算表（直近月分）<br>
        □ エグゼクティブサマリー ★<br>
        □ 企業概要書<br>
        □ 資金繰り表<br>
        □ 借入金一覧表<br>
        □ 事業計画書<br>
        □ 取引深耕提案書 ★<br>
        □ 想定Q&A集<br>
        □ 商業登記簿謄本<br>
        □ 印鑑証明書<br>
        □ 代表者の本人確認書類<br>
        ${data.collateral ? '□ 不動産登記簿謄本（担保物件）<br>' : ''}
        ${data.loanPurpose?.includes('設備') ? '□ 見積書・契約書（設備関連）<br>' : ''}
      </div>

      <div class="report-subtitle">⏰ 面談当日のポイント</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
        ✅ 予約時間の10分前に到着<br>
        ✅ 清潔感のある服装（スーツ推奨）<br>
        ✅ 名刺を多めに持参<br>
        ✅ 資料はファイリングして渡す（相手用の控えも用意）<br>
        ✅ メモを取る姿勢を見せる<br>
        ✅ 数字の質問にはすぐ答えられるように準備
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // 金利交渉シミュレーター
  showInterestRateNegotiation() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const grade = rr?.grade || 'B';

    const rateRange = {
      'S+': '0.5〜1.0%', 'S': '0.8〜1.3%', 'A': '1.0〜1.8%', 'B': '1.3〜2.2%',
      'C': '1.8〜3.0%', 'D': '2.5〜4.0%', 'E': '3.0%以上', 'F': '—'
    };

    let html = `<div class="glass-card">
      <div class="report-title">💰 金利交渉シミュレーター</div>

      <div class="report-subtitle">📊 金利の決定ロジック</div>
      <div style="font-size:12px;color:var(--text-secondary);padding:12px;background:var(--bg-tertiary);border-radius:8px;font-family:var(--font-mono);line-height:2;">
        融資金利 = ベースレート（調達コスト）<br>
        　　　　+ 信用コスト（格付けに応じた引当率）<br>
        　　　　+ 経費率（事務コスト）<br>
        　　　　+ 利益率（銀行の取り分）
      </div>

      <div class="report-subtitle" style="margin-top:16px;">🎯 格付け ${Utils.createGradeBadge(grade)} での想定金利レンジ</div>
      <div style="text-align:center;font-size:24px;font-weight:800;color:var(--primary);margin:12px 0;">${rateRange[grade] || '—'}</div>

      <div class="report-subtitle">🛠️ 金利引き下げテクニック</div>`;

    const techniques = [
      { icon: '🏦', title: '複数行からの見積もり取得', desc: '2〜3行に同時に相談し、「○○銀行さんは○%でご提示いただいています」', effect: '▲0.2〜0.5%' },
      { icon: '🤝', title: '取引量の拡大をバーター', desc: 'メイン口座移管・預金集約と引き換えに金利交渉', effect: '▲0.1〜0.3%' },
      { icon: '💎', title: '保証料との合算交渉', desc: '保証料+金利の「総コスト」で比較し、金利部分の圧縮を依頼', effect: '▲0.1〜0.3%' },
      { icon: '📅', title: '据置期間の交渉', desc: '金利を受け入れる代わりに据置期間を延長（設備資金は特に有効）', effect: 'CF改善効果' },
      { icon: '🏷️', title: '保証料補助制度の活用', desc: '協調支援型特別保証（保証料最大1/2補助）でトータルコスト圧縮', effect: '保証料▲50%' }
    ];

    techniques.forEach(t => {
      html += `<div class="glass-card" style="margin:8px 0;padding:12px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:13px;">${t.icon} ${t.title}</span>
          <span class="tag tag-success">${t.effect}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${t.desc}</div>
      </div>`;
    });

    html += `</div>`;
    App.addSystemMessage(html);
  },

  // 経営者保証解除戦略
  showGuaranteeRemoval() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();

    let html = `<div class="glass-card">
      <div class="report-title">🔓 経営者保証解除戦略</div>

      <div class="report-subtitle">📋 経営者保証ガイドライン3要件チェック</div>`;

    const req1 = !data.officerLoanToCompany;
    const req2 = rr && rr.effectiveScore >= 56;
    const req3 = data.taxAdvisor === 'はい';

    const reqs = [
      { label: '要件①：法人と経営者の資産の明確な区分', ok: req1, detail: req1 ? '役員貸付金なし → OK' : '★ 役員貸付金の解消が必要', fix: '役員貸付金を完済する' },
      { label: '要件②：法人のみの資産・収益力で返済可能', ok: req2, detail: req2 ? 'CF > 返済額 → OK' : '★ CFの改善または格付け向上が必要', fix: '格付けB以上を確保する' },
      { label: '要件③：適時適切な情報開示', ok: req3, detail: req3 ? '認定支援機関連携 → OK' : '月次試算表の定期提出を開始する', fix: '月次試算表の提出を開始する' }
    ];

    reqs.forEach(r => {
      html += `<div class="alert-card ${r.ok ? 'success' : 'warning'}" style="margin:8px 0;">
        <span class="alert-icon">${r.ok ? '✅' : '⚠️'}</span>
        <div><strong>${r.label}</strong><br><span style="font-size:12px;">${r.detail}</span></div>
      </div>`;
    });

    const canRemove = reqs.filter(r => r.ok).length;
    html += `<div style="text-align:center;margin:16px 0;">
      <div style="font-size:14px;color:var(--text-secondary);">保証解除の可能性</div>
      <div style="font-size:28px;font-weight:800;color:${canRemove >= 3 ? 'var(--accent-green)' : canRemove >= 2 ? 'var(--accent-gold)' : 'var(--accent-red)'}">
        ${canRemove >= 3 ? '★ 高い' : canRemove >= 2 ? '△ 条件付き' : '✗ 現時点では困難'}
      </div>
    </div>`;

    html += `<div class="report-subtitle">📅 保証解除ロードマップ</div>
      <div class="flow-chart">
        <div class="flow-node${req1 ? ' result' : ' active'}">Step 1：役員貸付金を完済する（最優先）</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">Step 2：法人と個人の経費を完全分離</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node${req3 ? ' result' : ''}">Step 3：月次試算表の提出を開始（実績作り）</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node${req2 ? ' result' : ''}">Step 4：格付けB以上を確保</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">Step 5：保証付き融資で実績を積む</div>
        <div class="flow-connector">↓</div>
        <div class="flow-node">Step 6：次回借換時に「保証なし」を打診</div>
      </div>

      <div class="report-subtitle">🔑 企業価値担保権の活用（2026年5月〜）</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;">
        企業価値担保権を活用すれば、不動産担保も経営者保証も不要になる可能性があります。<br>
        ただし、コベナンツの設定と定期モニタリングが必要です。
      </div>
    </div>`;

    App.addSystemMessage(html);
  }
};
