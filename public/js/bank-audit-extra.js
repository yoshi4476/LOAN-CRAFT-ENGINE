/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 追加審査機能
 * ① 案件判断（資金使途・返済能力・担保）
 * ② 連結決算（少額切捨て・合算ロジック）
 * ③ AI格付コメント生成
 * ④ 格付履歴・比較
 * ⑤ シナリオシミュレーション
 * ============================================================ */

Object.assign(BankAudit, {

  // ===== ① 案件判断（銀行が見る3つの柱）=====
  showLoanAssessment() {
    const dna = Database.loadCompanyData() || {};
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">🏦 案件判断（融資審査の3つの柱）</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        銀行融資審査では「資金使途」「返済能力」「保全（担保）」の3つの柱でジャッジされます。
      </p>

      <div class="report-subtitle" style="color:var(--accent-cyan);">📌 第1の柱：資金使途の妥当性</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:10px;color:var(--text-muted);">資金使途</label>
          <select id="la_purpose" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
            <option value="operating">運転資金</option>
            <option value="equipment">設備資金</option>
            <option value="refinance">借換資金</option>
            <option value="seasonal">季節資金</option>
            <option value="emergency">緊急資金</option>
            <option value="other">その他</option>
          </select></div>
        ${this._inp('la_amount','融資希望額',0)}
        ${this._inp('la_period','融資期間（年）',5)}
        <div><label style="font-size:10px;color:var(--text-muted);">資金使途の具体的説明</label>
          <textarea id="la_purposeDetail" rows="2" placeholder="例: 原材料仕入れの増加に伴う運転資金" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;"></textarea></div>
      </div>

      <div class="report-subtitle" style="color:var(--accent-cyan);">📌 第2の柱：返済能力</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        ${this._inp('la_annualCF','年間返済原資（簡易営業CF）',0)}
        ${this._inp('la_existingDebt','既存借入金残高',dna.totalDebt||0)}
        ${this._inp('la_annualRepay','既存の年間返済額',0)}
      </div>

      <div class="report-subtitle" style="color:var(--accent-cyan);">📌 第3の柱：保全（担保・保証）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
        <div><label style="font-size:10px;color:var(--text-muted);">担保の種類</label>
          <select id="la_collateralType" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
            <option value="none">無担保</option>
            <option value="real_estate">不動産担保</option>
            <option value="deposit">預金担保</option>
            <option value="guarantee">信用保証協会</option>
            <option value="policy">保険質権</option>
          </select></div>
        ${this._inp('la_collateralValue','担保評価額',0)}
        <div><label style="font-size:10px;color:var(--text-muted);">経営者保証</label>
          <select id="la_personalGuarantee" style="width:100%;padding:6px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:12px;">
            <option value="yes">あり（代表者連帯保証）</option>
            <option value="no">なし（解除済み）</option>
            <option value="partial">第三者保証のみ</option>
          </select></div>
        ${this._inp('la_guaranteeAmount','保証額',0)}
      </div>
      <button class="btn btn-primary" onclick="BankAudit.judgeLoan()">📊 案件判断実行</button>
    </div>`;
    App.addSystemMessage(html);
  },

  judgeLoan() {
    const amount = this._g('la_amount');
    const period = this._g('la_period') || 5;
    const annualCF = this._g('la_annualCF');
    const existingDebt = this._g('la_existingDebt');
    const annualRepay = this._g('la_annualRepay');
    const collateralValue = this._g('la_collateralValue');
    const guaranteeAmount = this._g('la_guaranteeAmount');
    const purpose = document.getElementById('la_purpose')?.value || 'operating';
    const collateralType = document.getElementById('la_collateralType')?.value || 'none';

    // 返済能力判定
    const newAnnualRepay = amount / period;
    const totalAnnualRepay = annualRepay + newAnnualRepay;
    const repayCoverage = annualCF > 0 ? (annualCF / totalAnnualRepay) : 0;
    const totalDebtAfter = existingDebt + amount;
    const totalRepayYears = annualCF > 0 ? totalDebtAfter / annualCF : -1;

    // 保全カバー率
    const totalCollateral = collateralValue + guaranteeAmount;
    const coverageRatio = amount > 0 ? (totalCollateral / amount * 100) : 0;
    const unsecured = Math.max(0, amount - totalCollateral);

    // 総合判定
    let verdict = '◎ 融資可能性：高い';
    let verdictColor = 'var(--accent-green)';
    const warnings = [];

    if (repayCoverage < 1) { verdict = '× 融資困難'; verdictColor = 'var(--accent-red)'; warnings.push('返済原資が返済額を下回っています'); }
    else if (repayCoverage < 1.3) { verdict = '△ 要検討'; verdictColor = 'var(--accent-gold)'; warnings.push('返済余力が薄い（カバー率1.3倍未満）'); }
    if (totalRepayYears > 10) warnings.push('総借入金の償還年数が10年超');
    if (coverageRatio < 50 && collateralType !== 'none') warnings.push('担保カバー率が50%未満');
    if (purpose === 'emergency') warnings.push('緊急資金は銀行の警戒ポイント');
    if (warnings.length >= 3) { verdict = '× 融資困難'; verdictColor = 'var(--accent-red)'; }
    else if (warnings.length >= 2 && verdictColor !== 'var(--accent-red)') { verdict = '△ 要検討'; verdictColor = 'var(--accent-gold)'; }

    const purposeLabel = {operating:'運転資金',equipment:'設備資金',refinance:'借換資金',seasonal:'季節資金',emergency:'緊急資金',other:'その他'}[purpose];

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 案件判断結果</div>
      <div class="glass-card" style="padding:20px;text-align:center;margin-bottom:16px;">
        <div style="font-size:12px;color:var(--text-muted);">総合判定</div>
        <div style="font-size:22px;font-weight:800;color:${verdictColor};margin:8px 0;">${verdict}</div>
        <div style="font-size:11px;color:var(--text-muted);">${purposeLabel} / 希望額 ${amount.toLocaleString()} / ${period}年</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="glass-card" style="padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-muted);">返済カバー率</div>
          <div style="font-size:16px;font-weight:700;color:${repayCoverage>=1.3?'var(--accent-green)':repayCoverage>=1?'var(--accent-gold)':'var(--accent-red)'};">${repayCoverage > 0 ? repayCoverage.toFixed(2) + '倍' : '算定不能'}</div>
        </div>
        <div class="glass-card" style="padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-muted);">融資後総償還年数</div>
          <div style="font-size:16px;font-weight:700;color:${totalRepayYears<=10?'var(--accent-green)':'var(--accent-red)'};">${totalRepayYears > 0 ? totalRepayYears.toFixed(1) + '年' : '算定不能'}</div>
        </div>
        <div class="glass-card" style="padding:12px;text-align:center;">
          <div style="font-size:10px;color:var(--text-muted);">担保カバー率</div>
          <div style="font-size:16px;font-weight:700;">${coverageRatio.toFixed(0)}%</div>
          <div style="font-size:9px;color:var(--text-muted);">非保全: ${unsecured.toLocaleString()}</div>
        </div>
      </div>`;
    if (warnings.length > 0) {
      html += '<div class="report-subtitle">⚠️ リスクポイント</div>';
      warnings.forEach(w => { html += Utils.createAlert('warning', '⚠️', w); });
    }
    html += `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-secondary" onclick="BankAudit.showCaseJudgment()">🏦 格付判定へ</button>
      <button class="btn btn-secondary" onclick="BankAudit.showScenarioSim()">🔄 シナリオ比較</button>
    </div></div>`;
    App.addSystemMessage(html);
  },

  // ===== ② 連結決算（少額切捨て）=====
  showConsolidated() {
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 連結決算（子会社合算）</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        連結決算では少額子会社の数値はゼロに切り下げて簡素化します。シナジー効果は計上しません。
      </p>
      <div class="report-subtitle">親会社数値（現在の入力値を使用）</div>
      <div style="margin-bottom:16px;padding:8px;background:rgba(108,99,255,0.05);border-radius:6px;font-size:12px;">
        ※ /決算取込 で入力した当期PL/BSが親会社データとして使用されます
      </div>
      <div class="report-subtitle">子会社データ（最大5社）</div>`;
    for (let i = 1; i <= 5; i++) {
      html += `<div style="margin-bottom:12px;padding:12px;background:rgba(108,99,255,0.04);border-radius:8px;">
        <div style="font-size:11px;font-weight:600;margin-bottom:6px;">子会社 ${i}</div>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:6px;">
          <div><label style="font-size:9px;color:var(--text-muted);">会社名</label>
            <input id="con_name_${i}" placeholder="子会社名" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;"></div>
          ${this._inp(`con_rev_${i}`,'売上高',0)}
          ${this._inp(`con_op_${i}`,'営業利益',0)}
          ${this._inp(`con_ta_${i}`,'総資産',0)}
          ${this._inp(`con_na_${i}`,'純資産',0)}
        </div>
      </div>`;
    }
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
      ${this._inp('con_threshold','少額切捨て閾値（売上高基準）',10000)}
      <div><label style="font-size:10px;color:var(--text-muted);">閾値の単位</label>
        <div style="padding:8px;font-size:11px;color:var(--text-secondary);">親会社売上高の5%未満 or 入力値未満の子会社はゼロ処理</div></div>
    </div>
    <button class="btn btn-primary" onclick="BankAudit.calcConsolidated()">📊 連結計算実行</button>
    </div>`;
    App.addSystemMessage(html);
  },

  calcConsolidated() {
    const parent = this.currentFS || this._collectFS();
    const threshold = this._g('con_threshold');
    const parentRevThreshold = (parent.revenue || 0) * 0.05;
    let totalRev = parent.revenue || 0;
    let totalOp = parent.opProfit || 0;
    let totalTA = parent.totalAssets || 0;
    let totalNA = parent.netAssets || 0;
    const details = [];
    for (let i = 1; i <= 5; i++) {
      const name = document.getElementById(`con_name_${i}`)?.value || '';
      if (!name) continue;
      const rev = this._g(`con_rev_${i}`);
      const op = this._g(`con_op_${i}`);
      const ta = this._g(`con_ta_${i}`);
      const na = this._g(`con_na_${i}`);
      // 少額切捨て判定
      const isMinor = rev < threshold || rev < parentRevThreshold;
      if (isMinor) {
        details.push({ name, rev, op, ta, na, status: '🔻 切捨て（少額）', added: false });
      } else {
        totalRev += rev; totalOp += op; totalTA += ta; totalNA += na;
        details.push({ name, rev, op, ta, na, status: '✅ 合算', added: true });
      }
    }
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 連結決算結果</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);"><th style="padding:6px;text-align:left;">会社名</th><th style="text-align:right;">売上高</th><th style="text-align:right;">営業利益</th><th style="text-align:center;">状態</th></tr>
        <tr style="border-bottom:1px solid var(--border-secondary);background:rgba(108,99,255,0.06);"><td style="padding:6px;font-weight:700;">親会社</td><td style="text-align:right;">${(parent.revenue||0).toLocaleString()}</td><td style="text-align:right;">${(parent.opProfit||0).toLocaleString()}</td><td style="text-align:center;">✅ 基準</td></tr>`;
    details.forEach(d => {
      html += `<tr style="border-bottom:1px solid var(--border-secondary);${d.added?'':'opacity:0.5;'}"><td style="padding:6px;">${d.name}</td><td style="text-align:right;">${d.rev.toLocaleString()}</td><td style="text-align:right;">${d.op.toLocaleString()}</td><td style="text-align:center;">${d.status}</td></tr>`;
    });
    html += `<tr style="border-top:2px solid var(--border-primary);font-weight:700;"><td style="padding:6px;">連結合計</td><td style="text-align:right;">${totalRev.toLocaleString()}</td><td style="text-align:right;">${totalOp.toLocaleString()}</td><td style="text-align:center;">—</td></tr>`;
    html += `</table>
      <div style="margin:12px 0;font-size:11px;color:var(--text-muted);">※ シナジー効果は計上していません。少額切捨て基準: 売上高 ${threshold.toLocaleString()} or 親会社売上の5%未満</div>
    </div>`;
    App.addSystemMessage(html);
  },

  // ===== ③ AI格付コメント生成 =====
  async aiRatingComment() {
    const d = this.currentFS || this._collectFS();
    const dna = Database.loadCompanyData() || {};
    const fs = d.revenue > 0 ? d : {
      revenue: dna.annualRevenue||0, opProfit: dna.operatingProfit||0,
      ordProfit: dna.ordinaryProfit||0, netProfit: dna.netIncome||0,
      totalAssets: dna.totalAssets||0, netAssets: dna.netAssets||0,
      deprecTotal: dna.depreciation||0, interestExp: dna.interestExpense||0,
      shortDebt: dna.totalDebt*0.4||0, longDebt: dna.totalDebt*0.6||0,
      bonds: 0, notesRec: 0, accountsRec: dna.receivables||0,
      inventory: dna.inventory||0, notesPay: 0, accountsPay: dna.payables||0,
      currentAssets: dna.currentAssets||0, fixedAssets: dna.fixedAssets||0,
      deferredAssets: 0, currentLiab: dna.currentLiabilities||0
    };
    if (!fs.revenue) { App.addSystemMessage(Utils.createAlert('warning','⚠️','決算データがありません。')); return; }

    const indicators = this._calcIndicators(fs);
    const simpleCF = this._calcSimpleCF(fs);
    const category = this._determineCategory(indicators, simpleCF);
    const ebitda = (fs.opProfit||0) + (fs.deprecTotal||0);

    const prompt = `あなたは銀行融資審査の専門家です。以下の財務データに基づき、銀行審査官向けの格付コメントを日本語で作成してください。

【企業情報】
会社名: ${dna.companyName || '不明'}
業種: ${this.industry}
債務者区分判定: ${category.label}

【主要指標】
${indicators.list.map(i => `${i.label}: ${i.value} → ${i.verdict}`).join('\n')}

【営業CF簡易査定】
簡易営業CF: ${simpleCF.value.toLocaleString()}
EBITDA: ${ebitda.toLocaleString()}

以下の形式で出力してください:
1. 総合評価（2行）
2. 強み（3点）
3. リスク要因（3点）
4. 銀行への提案ポイント（融資を通すためのアドバイス）
5. 改善提案（企業が取るべきアクション）`;

    App.addSystemMessage(`<div class="glass-card"><div class="report-title">🤖 AI格付コメント生成中...</div><div class="loading-dots"><span>.</span><span>.</span><span>.</span></div></div>`);

    try {
      const result = await ApiClient.request('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, type: 'rating_comment' })
      });
      const content = result.content || result.choices?.[0]?.message?.content || 'AIからの応答を取得できませんでした。';
      App.addSystemMessage(`<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
        <div class="report-title">🤖 AI格付コメント</div>
        <div style="white-space:pre-wrap;font-size:13px;line-height:1.8;">${content.replace(/\n/g,'<br>')}</div>
      </div>`);
    } catch(e) {
      // AI非接続時はルールベースでコメント生成
      const comments = [];
      const ibd = (fs.shortDebt||0) + (fs.longDebt||0) + (fs.bonds||0);
      const repay = simpleCF.value > 0 ? ibd / simpleCF.value : -1;

      comments.push(`【総合評価】債務者区分: ${category.label}`);
      if (repay > 0 && repay <= 10) comments.push('✅ 有利子負債償還年数は10年以内で良好。正常先の基準を満たしています。');
      else if (repay > 10) comments.push('⚠️ 有利子負債償還年数が10年を超過。返済計画の明確化が必要です。');
      if (fs.netAssets > 0 && fs.totalAssets > 0) {
        const eq = fs.netAssets / fs.totalAssets * 100;
        if (eq >= 30) comments.push(`✅ 自己資本比率${eq.toFixed(1)}%は良好。財務基盤が安定しています。`);
        else if (eq < 10) comments.push(`⚠️ 自己資本比率${eq.toFixed(1)}%は低水準。増資や利益蓄積による改善が必要です。`);
      }
      if (ebitda > 0 && ibd > 0) {
        const em = ibd / ebitda;
        if (em <= 5) comments.push(`✅ EBITDA倍率${em.toFixed(1)}倍は健全。新規融資の余力があります。`);
        else if (em > 10) comments.push(`⚠️ EBITDA倍率${em.toFixed(1)}倍は高水準。借入過多の可能性があります。`);
      }
      comments.push(`【改善提案】${repay > 10 ? '不採算事業の見直し、固定費削減、遊休資産売却による有利子負債の圧縮を推奨します。' : '現状の財務基盤を維持しつつ、内部留保の蓄積を継続してください。'}`);

      App.addSystemMessage(`<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
        <div class="report-title">📋 格付コメント（ルールベース）</div>
        <div style="font-size:11px;color:var(--accent-gold);margin-bottom:8px;">※ AI未接続のためルールベースで生成</div>
        <div style="white-space:pre-wrap;font-size:13px;line-height:1.8;">${comments.join('\n')}</div>
      </div>`);
    }
  },

  // ===== ④ 格付履歴一覧 =====
  async showRatingHistory() {
    let ratings = [];
    try { ratings = await ApiClient.request('/api/financial/ratings'); } catch(e) {}
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 格付履歴一覧</div>`;
    if (ratings.length === 0) {
      html += `<p style="color:var(--text-muted);text-align:center;padding:32px;">格付履歴がありません。<br>
        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="BankAudit.showCaseJudgment()">🏦 格付判定を実行</button></p>`;
    } else {
      html += `<table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">日付</th><th style="text-align:left;">会社名</th>
          <th style="text-align:center;">債務者区分</th><th style="text-align:right;">営業CF</th><th style="text-align:right;">償還年数</th>
        </tr>`;
      ratings.forEach(r => {
        const catColor = r.debtor_category?.includes('正常') ? 'var(--accent-green)' : r.debtor_category?.includes('注意') ? 'var(--accent-gold)' : 'var(--accent-red)';
        html += `<tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-size:11px;">${new Date(r.created_at).toLocaleDateString('ja-JP')}</td>
          <td style="padding:6px;">${r.company_name||'—'}</td>
          <td style="padding:6px;text-align:center;color:${catColor};font-weight:600;">${r.debtor_category||'—'}</td>
          <td style="padding:6px;text-align:right;">${r.operating_cf ? Math.round(r.operating_cf).toLocaleString() : '—'}</td>
          <td style="padding:6px;text-align:right;">${r.repayment_years > 0 ? r.repayment_years.toFixed(1) + '年' : '—'}</td>
        </tr>`;
      });
      html += `</table>`;
    }
    html += `</div>`;
    App.addSystemMessage(html);
  },

  // ===== ⑤ シナリオシミュレーション =====
  showScenarioSim() {
    const dna = Database.loadCompanyData() || {};
    const d = this.currentFS || {};
    const rev = d.revenue || dna.annualRevenue || 0;
    const ord = d.ordProfit || dna.ordinaryProfit || 0;
    const dep = d.deprecTotal || dna.depreciation || 0;
    const ibd = (d.shortDebt||0) + (d.longDebt||0) + (d.bonds||0) || dna.totalDebt || 0;

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">🔄 シナリオシミュレーション</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        楽観・基本・悲観の3シナリオで格付変動をシミュレーションします。基準となる財務数値を直接いじることも可能です。
      </p>

      <div class="report-subtitle">1️⃣ 基準財務数値（手入力で直接変更可能）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px;background:rgba(108,99,255,0.04);padding:12px;border-radius:8px;">
        ${this._inp('sc_base_rev', '基準 売上高', rev)}
        ${this._inp('sc_base_ord', '基準 経常利益', ord)}
        ${this._inp('sc_base_dep', '減価償却費', dep)}
        ${this._inp('sc_base_ibd', '有利子負債', ibd)}
      </div>

      <div class="report-subtitle">2️⃣ シナリオ変動率設定</div>
      <div style="overflow-x:auto;"><table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">項目</th>
          <th style="text-align:center;background:rgba(76,175,80,0.1);">🟢 楽観</th>
          <th style="text-align:center;background:rgba(108,99,255,0.08);">🔵 基本</th>
          <th style="text-align:center;background:rgba(244,67,54,0.08);">🔴 悲観</th>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;">売上高変動率(%)</td>
          <td style="padding:4px;background:rgba(76,175,80,0.05);"><input id="sc_rev_up" type="number" value="10" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:center;"></td>
          <td style="padding:4px;background:rgba(108,99,255,0.04);"><input id="sc_rev_base" type="number" value="0" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:center;"></td>
          <td style="padding:4px;background:rgba(244,67,54,0.04);"><input id="sc_rev_down" type="number" value="-15" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:center;"></td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;">経常利益変動率(%)</td>
          <td style="padding:4px;background:rgba(76,175,80,0.05);"><input id="sc_ord_up" type="number" value="15" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:center;"></td>
          <td style="padding:4px;background:rgba(108,99,255,0.04);"><input id="sc_ord_base" type="number" value="0" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:center;"></td>
          <td style="padding:4px;background:rgba(244,67,54,0.04);"><input id="sc_ord_down" type="number" value="-30" style="width:100%;padding:4px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:4px;color:var(--text-primary);font-size:11px;text-align:center;"></td>
        </tr>
      </table></div>
      <div style="margin-top:12px;"><button class="btn btn-primary" onclick="BankAudit.runScenario()">📊 シミュレーション実行</button></div>
    </div>`;
    App.addSystemMessage(html);
  },

  runScenario() {
    const baseRev = this._g('sc_base_rev');
    const baseOrd = this._g('sc_base_ord');
    const dep = this._g('sc_base_dep');
    const ibd = this._g('sc_base_ibd');

    const scenarios = [
      { label: '🟢 楽観', revPct: this._g('sc_rev_up'), ordPct: this._g('sc_ord_up'), bg: 'rgba(76,175,80,0.08)' },
      { label: '🔵 基本', revPct: this._g('sc_rev_base'), ordPct: this._g('sc_ord_base'), bg: 'rgba(108,99,255,0.06)' },
      { label: '🔴 悲観', revPct: this._g('sc_rev_down'), ordPct: this._g('sc_ord_down'), bg: 'rgba(244,67,54,0.06)' }
    ];

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📊 シナリオ比較結果</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">`;

    scenarios.forEach(sc => {
      const rev = Math.round(baseRev * (1 + sc.revPct / 100));
      const ord = Math.round(baseOrd * (1 + sc.ordPct / 100));
      const cf = Math.round(ord * (1 - this.taxRate) + dep);
      const repay = cf > 0 ? (ibd / cf) : -1;
      const cat = this._getCategoryLabel(repay);

      html += `<div class="glass-card" style="padding:16px;background:${sc.bg};">
        <div style="font-size:14px;font-weight:700;text-align:center;margin-bottom:12px;">${sc.label}</div>
        <div class="report-row"><span class="label">売上高</span><span class="value">${rev.toLocaleString()}</span></div>
        <div class="report-row"><span class="label">経常利益</span><span class="value">${ord.toLocaleString()}</span></div>
        <div class="report-row"><span class="label">簡易営業CF</span><span class="value">${cf.toLocaleString()}</span></div>
        <div class="report-row"><span class="label">償還年数</span><span class="value">${repay > 0 ? repay.toFixed(1) + '年' : '算定不能'}</span></div>
        <div style="text-align:center;margin-top:12px;padding:8px;border-radius:6px;background:rgba(0,0,0,0.1);">
          <div style="font-size:10px;color:var(--text-muted);">債務者区分</div>
          <div style="font-size:16px;font-weight:800;color:${cat.color};">${cat.label}</div>
        </div>
      </div>`;
    });

    html += `</div></div>`;
    App.addSystemMessage(html);
  },

  // ===== ⑥ 融資最適化シミュレーター（目標逆算） =====
  showOptimizationSimulator() {
    const fs = this.currentFS || {};
    if (!fs.revenue) { App.addSystemMessage(Utils.createAlert('warning','⚠️','決算データがありません。')); return; }

    const ibd = (fs.shortDebt||0) + (fs.longDebt||0) + (fs.bonds||0);
    const opCF = (fs.ordProfit||0) * (1 - this.taxRate) + (fs.deprecTotal||0);
    const currentRepay = opCF > 0 ? ibd / opCF : -1;
    
    const realDebt = (fs.fixedAssets||0) + (fs.deferredAssets||0) - (fs.netAssets||0);
    const isExcessDebt = realDebt > 0;

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">✨ 融資最適化シミュレーター（目標逆算）</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        銀行融資の基本条件である「正常先（償還年数10年以内 ＆ 資産超過）」になるための必要数値を自動逆算します。
      </p>

      <div class="report-subtitle">📊 現状の課題（正常先とのギャップ）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div class="glass-card" style="padding:12px;border-left:4px solid ${currentRepay>0 && currentRepay<=10 ? 'var(--accent-green)' : 'var(--accent-red)'};">
          <div style="font-size:11px;color:var(--text-muted);">債務償還年数（目標: 10年以内）</div>
          <div style="font-size:16px;font-weight:700;">現状: ${currentRepay>0 ? currentRepay.toFixed(1)+'年' : 'CF赤字'}</div>
        </div>
        <div class="glass-card" style="padding:12px;border-left:4px solid ${!isExcessDebt ? 'var(--accent-green)' : 'var(--accent-red)'};">
          <div style="font-size:11px;color:var(--text-muted);">実質BS（目標: 資産超過）</div>
          <div style="font-size:16px;font-weight:700;">現状: ${isExcessDebt ? '債務超過 '+realDebt.toLocaleString() : '資産超過（クリア）'}</div>
        </div>
      </div>`;

    if (currentRepay > 0 && currentRepay <= 10 && !isExcessDebt) {
      html += `<div style="padding:16px;background:rgba(76,175,80,0.1);border-radius:8px;text-align:center;">
        <div style="font-size:20px;margin-bottom:8px;">✅</div>
        <div style="font-weight:700;color:var(--accent-green);">すでに正常先の基準をクリアしています</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">そのまま案件判断や事業計画の作成に進んでください。</div>
      </div></div>`;
      App.addSystemMessage(html);
      return;
    }

    // プランA: 収益力アップ（経常利益の増加）でカバー
    // 目標opCF = ibd / 10
    // 足りないopCF = (ibd / 10) - opCF
    // 必要な経常利益増加額 = 足りないopCF / (1 - taxRate)
    let planA_HTML = '';
    let planA_TargetOrd = fs.ordProfit;
    let planA_TargetNetAssets = fs.netAssets;

    if (currentRepay > 10 || currentRepay < 0) {
      const targetOpCF = ibd / 10;
      const shortfallOpCF = targetOpCF - opCF;
      const reqOrdProfitInc = Math.ceil(shortfallOpCF / (1 - this.taxRate));
      planA_TargetOrd = (fs.ordProfit||0) + reqOrdProfitInc;
      planA_HTML += `<li style="margin-bottom:6px;">償還10年を達成するための<strong style="color:var(--accent-primary);">経常利益目標: ${planA_TargetOrd.toLocaleString()}</strong>（現状比 +${reqOrdProfitInc.toLocaleString()}）</li>`;
    } else {
      planA_HTML += `<li style="margin-bottom:6px;"><strong style="color:var(--accent-green);">収益力（償還年数）は既にクリア</strong>しています。</li>`;
    }
    if (isExcessDebt) {
      planA_TargetNetAssets = fs.netAssets + realDebt;
      planA_HTML += `<li>債務超過を解消するための<strong style="color:var(--accent-primary);">純資産目標: ${planA_TargetNetAssets.toLocaleString()}</strong>（現状比 +${realDebt.toLocaleString()}）</li>`;
    }

    // プランB: 負債圧縮（役員借入金のDES等）でカバー
    // 目標ibd = opCF * 10
    // 削減すべきibd = ibd - (opCF * 10)
    let planB_HTML = '';
    let planB_TargetIbd = ibd;
    let planB_TargetNetAssets = fs.netAssets;

    if (currentRepay > 10 || currentRepay < 0) {
      if (opCF <= 0) {
        planB_HTML += `<li style="margin-bottom:6px;color:var(--accent-red);">※現在のCFが赤字のため、負債圧縮のみでは償還年数をクリアできません（黒字化必須）。</li>`;
      } else {
        const targetIbd = opCF * 10;
        const reqIbdDec = ibd - targetIbd;
        planB_TargetIbd = targetIbd;
        planB_HTML += `<li style="margin-bottom:6px;">償還10年を達成するための<strong style="color:var(--accent-primary);">有利子負債目標: ${planB_TargetIbd.toLocaleString()}</strong>（現状比 -${reqIbdDec.toLocaleString()}）<br>
        <span style="font-size:10px;color:var(--text-muted);">※社長個人の役員借入金との相殺（DES）や遊休資産の売却で圧縮を検討してください。</span></li>`;
      }
    } else {
      planB_HTML += `<li style="margin-bottom:6px;"><strong style="color:var(--accent-green);">負債水準（償還年数）は既にクリア</strong>しています。</li>`;
    }
    if (isExcessDebt) {
      planB_TargetNetAssets = fs.netAssets + realDebt;
      planB_HTML += `<li>債務超過を解消するための<strong style="color:var(--accent-primary);">純資産目標: ${planB_TargetNetAssets.toLocaleString()}</strong>（現状比 +${realDebt.toLocaleString()}）<br>
        <span style="font-size:10px;color:var(--text-muted);">※役員借入金の資本振替等により、純資産を増加させる必要があります。</span></li>`;
    }

    html += `<div class="report-subtitle">💡 最適化アクションプラン</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        
        <div class="glass-card" style="padding:16px;background:rgba(108,99,255,0.04);">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--accent-primary);">プランA: 収益力アップ（V字回復）</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6;">負債はそのままで、利益を伸ばして返済能力をクリアする王道シナリオ。</div>
          <ul style="font-size:12px;line-height:1.6;padding-left:16px;margin:0 0 16px 0;">
            ${planA_HTML}
          </ul>
          <button class="btn btn-primary btn-sm" style="width:100%;" onclick="BankAudit.applyOptimization('A', ${planA_TargetOrd}, ${planA_TargetNetAssets}, ${ibd})">🔄 プランAの数値で判定画面へ</button>
        </div>

        <div class="glass-card" style="padding:16px;background:rgba(244,67,54,0.04);">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--accent-red);">プランB: 負債圧縮・BSスリム化</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6;">利益はそのままで、役員借入金の振替や遊休資産売却で負債を減らすシナリオ。</div>
          <ul style="font-size:12px;line-height:1.6;padding-left:16px;margin:0 0 16px 0;">
            ${planB_HTML}
          </ul>
          <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="BankAudit.applyOptimization('B', ${fs.ordProfit}, ${planB_TargetNetAssets}, ${planB_TargetIbd})">🔄 プランBの数値で判定画面へ</button>
        </div>
      </div>
    </div>`;

    App.addSystemMessage(html);
  },

  applyOptimization(plan, targetOrd, targetNetAssets, targetIbd) {
    if (!this.currentFS) return;
    
    // 現在の判定制御用入力欄（rj_xxx）が存在すれば更新、なければ画面を遷移してセット
    const openJudgmentAndSet = () => {
      this.showCaseJudgment(false); // まず画面を開く
      setTimeout(() => {
        if (document.getElementById('rj_ordProfit')) {
          if (plan === 'A') {
            document.getElementById('rj_ordProfit').value = targetOrd;
            document.getElementById('rj_netAssets').value = targetNetAssets;
            // 営業利益も経常利益の増加分だけ増やす（仮）
            const diff = targetOrd - (this.currentFS.ordProfit||0);
            document.getElementById('rj_opProfit').value = (this.currentFS.opProfit||0) + diff;
            // 純利益も追従（仮）
            document.getElementById('rj_netProfit').value = targetOrd;
          } else {
            document.getElementById('rj_ibd').value = targetIbd;
            document.getElementById('rj_netAssets').value = targetNetAssets;
          }
          App.addSystemMessage(Utils.createAlert('success', '✅', `【プラン${plan}】の最適化数値を入力欄にセットしました。「判定を更新」ボタンを押してください。`));
        }
      }, 300);
    };

    openJudgmentAndSet();
  }

});
