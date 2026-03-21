/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 格付け自己査定エンジン
 * 5カテゴリ・20指標・100点満点 + 定性加減点 + 実態BS + 修正CF
 * ============================================================ */

const Rating = {

  // --- 定量評価 20指標の計算 ---
  calculateQuantitative(data) {
    const scores = {};
    const f = data.financials?.[0] || {};
    const rev = f.revenue || data.annualRevenue || 0;
    const op = f.operatingProfit || 0;
    const ord = f.ordinaryProfit || 0;
    const ni = f.netIncome || 0;
    const na = f.netAssets || data.netAssets || 0;
    const ta = data.totalAssets || 0;
    const ca = data.currentAssets || (ta * 0.5);
    const cl = data.currentLiabilities || (ta * 0.35);
    const fa = data.fixedAssets || (ta * 0.5);
    const fl = data.fixedLiabilities || (data.totalDebt ? data.totalDebt * 0.6 : 0);
    const ibd = data.interestBearingDebt || data.totalDebt || 0;
    const rec = data.receivables || (rev / 12 * 2);
    const inv = data.inventory || 0;
    const pay = data.payables || (rev / 12);
    const dep = data.depreciation || (fa * 0.05);
    const intExp = data.interestExpense || (ibd * 0.02);
    const intInc = data.interestIncome || 0;
    const gp = data.grossProfit || (rev * 0.3);
    const cos = data.costOfSales || (rev - gp);
    const cf = ni + dep;
    const mr = (data.monthlyRepayment || 0) * 12;
    const nwc = rec + inv - pay;

    // --- カテゴリ①：安全性（25点満点）---
    // 1. 自己資本比率
    const equityRatio = ta > 0 ? (na / ta) * 100 : 0;
    scores.equityRatio = { value: equityRatio, score: equityRatio >= 30 ? 5 : equityRatio >= 20 ? 4 : equityRatio >= 10 ? 3 : equityRatio >= 0 ? 2 : 1, label: '自己資本比率', unit: '%' };

    // 2. 流動比率
    const currentRatio = cl > 0 ? (ca / cl) * 100 : 999;
    scores.currentRatio = { value: currentRatio, score: currentRatio >= 200 ? 5 : currentRatio >= 150 ? 4 : currentRatio >= 120 ? 3 : currentRatio >= 100 ? 2 : 1, label: '流動比率', unit: '%' };

    // 3. 固定長期適合率
    const fixedRatio = (fl + na) > 0 ? (fa / (fl + na)) * 100 : 999;
    scores.fixedRatio = { value: fixedRatio, score: fixedRatio <= 80 ? 5 : fixedRatio <= 90 ? 4 : fixedRatio <= 100 ? 3 : fixedRatio <= 110 ? 2 : 1, label: '固定長期適合率', unit: '%' };

    // 4. ギアリング比率
    const gearing = na > 0 ? (ibd / na) * 100 : 999;
    scores.gearing = { value: gearing, score: gearing <= 100 ? 5 : gearing <= 200 ? 4 : gearing <= 300 ? 3 : gearing <= 500 ? 2 : 1, label: 'ギアリング比率', unit: '%' };

    // 5. 債務償還年数
    const dsr = cf > 0 ? Math.max(0, ibd - nwc) / cf : 999;
    scores.dsr = { value: dsr, score: dsr <= 5 ? 5 : dsr <= 10 ? 4 : dsr <= 15 ? 3 : dsr <= 20 ? 2 : 1, label: '債務償還年数', unit: '年' };

    // --- カテゴリ②：収益性（25点満点）---
    // 6. 売上高経常利益率
    const ordProfitRatio = rev > 0 ? (ord / rev) * 100 : 0;
    scores.ordProfitRatio = { value: ordProfitRatio, score: ordProfitRatio >= 5 ? 5 : ordProfitRatio >= 3 ? 4 : ordProfitRatio >= 1 ? 3 : ordProfitRatio >= 0 ? 2 : 1, label: '売上高経常利益率', unit: '%' };

    // 7. 総資本経常利益率(ROA)
    const roa = ta > 0 ? (ord / ta) * 100 : 0;
    scores.roa = { value: roa, score: roa >= 10 ? 5 : roa >= 5 ? 4 : roa >= 2 ? 3 : roa >= 0 ? 2 : 1, label: 'ROA', unit: '%' };

    // 8. 売上高CF比率
    const cfRatio = rev > 0 ? (cf / rev) * 100 : 0;
    scores.cfRatio = { value: cfRatio, score: cfRatio >= 10 ? 5 : cfRatio >= 5 ? 4 : cfRatio >= 3 ? 3 : cfRatio >= 1 ? 2 : 1, label: '売上高CF比率', unit: '%' };

    // 9. 売上総利益率
    const gpRatio = rev > 0 ? (gp / rev) * 100 : 0;
    scores.gpRatio = { value: gpRatio, score: gpRatio >= 40 ? 5 : gpRatio >= 30 ? 4 : gpRatio >= 20 ? 3 : gpRatio >= 10 ? 2 : 1, label: '売上総利益率', unit: '%' };

    // 10. インタレストカバレッジ
    const icr = intExp > 0 ? (op + intInc) / intExp : 999;
    scores.icr = { value: icr, score: icr >= 10 ? 5 : icr >= 5 ? 4 : icr >= 2 ? 3 : icr >= 1 ? 2 : 1, label: 'インタレストカバレッジ', unit: '倍' };

    // --- カテゴリ③：成長性（15点満点）---
    // 推定値（前期データなし場合はデフォルト3点）
    scores.revenueGrowth = { value: 0, score: 3, label: '売上高増加率', unit: '%', estimated: true };
    scores.profitGrowth = { value: 0, score: 3, label: '経常利益増加率', unit: '%', estimated: true };
    scores.netAssetsGrowth = { value: 0, score: 3, label: '純資産増加率', unit: '%', estimated: true };

    // --- カテゴリ④：返済能力（20点満点）---
    // 14. CF倍率
    const cfMultiple = mr > 0 ? cf / mr : 999;
    scores.cfMultiple = { value: cfMultiple, score: cfMultiple >= 2.0 ? 5 : cfMultiple >= 1.5 ? 4 : cfMultiple >= 1.0 ? 3 : cfMultiple >= 0.7 ? 2 : 1, label: 'CF倍率', unit: '倍' };

    // 15. 運転資金バランス
    const shortTermDebt = ibd * 0.4;
    const wcBalance = shortTermDebt > 0 && nwc > 0 ? shortTermDebt / nwc : 1;
    scores.wcBalance = { value: wcBalance, score: wcBalance <= 1.0 ? 5 : wcBalance <= 1.3 ? 4 : wcBalance <= 1.6 ? 3 : wcBalance <= 2.0 ? 2 : 1, label: '運転資金バランス', unit: '倍' };

    // 16. フリーCF
    const minCapex = data.minCapex || (dep * 0.8);
    const fcf = cf - minCapex;
    const fcfRatio = rev > 0 ? (fcf / rev) * 100 : 0;
    scores.fcf = { value: fcfRatio, score: fcfRatio >= 5 ? 5 : fcfRatio >= 2 ? 4 : fcfRatio >= 0 ? 3 : fcfRatio >= -3 ? 2 : 1, label: 'フリーCF', unit: '%' };

    // 17. 既存返済負担率
    const repayBurden = cf > 0 ? (mr / cf) * 100 : 999;
    scores.repayBurden = { value: repayBurden, score: repayBurden <= 30 ? 5 : repayBurden <= 50 ? 4 : repayBurden <= 70 ? 3 : repayBurden <= 90 ? 2 : 1, label: '既存返済負担率', unit: '%' };

    // --- カテゴリ⑤：効率性（15点満点）---
    // 18. 総資本回転率
    const assetTurnover = ta > 0 ? rev / ta : 0;
    scores.assetTurnover = { value: assetTurnover, score: assetTurnover >= 2.0 ? 5 : assetTurnover >= 1.5 ? 4 : assetTurnover >= 1.0 ? 3 : assetTurnover >= 0.7 ? 2 : 1, label: '総資本回転率', unit: '回' };

    // 19. 売上債権回転期間
    const recPeriod = rev > 0 ? rec / (rev / 12) : 0;
    scores.recPeriod = { value: recPeriod, score: recPeriod <= 1 ? 5 : recPeriod <= 2 ? 4 : recPeriod <= 3 ? 3 : recPeriod <= 4 ? 2 : 1, label: '売上債権回転期間', unit: 'ヶ月' };

    // 20. 棚卸資産回転期間
    const invPeriod = cos > 0 ? inv / (cos / 12) : 0;
    scores.invPeriod = { value: invPeriod, score: invPeriod <= 0.5 ? 5 : invPeriod <= 1 ? 4 : invPeriod <= 2 ? 3 : invPeriod <= 3 ? 2 : 1, label: '棚卸資産回転期間', unit: 'ヶ月' };

    // カテゴリ別集計（審査方式のウェイトを反映）
    const weights = typeof AssessmentModes !== 'undefined' ? AssessmentModes.getWeights() : { safety: 25, profitability: 25, growth: 15, repayment: 20, efficiency: 15 };
    const categories = {
      safety: { label: '安全性', max: weights.safety, items: ['equityRatio', 'currentRatio', 'fixedRatio', 'gearing', 'dsr'] },
      profitability: { label: '収益性', max: weights.profitability, items: ['ordProfitRatio', 'roa', 'cfRatio', 'gpRatio', 'icr'] },
      growth: { label: '成長性', max: weights.growth, items: ['revenueGrowth', 'profitGrowth', 'netAssetsGrowth'] },
      repayment: { label: '返済能力', max: weights.repayment, items: ['cfMultiple', 'wcBalance', 'fcf', 'repayBurden'] },
      efficiency: { label: '効率性', max: weights.efficiency, items: ['assetTurnover', 'recPeriod', 'invPeriod'] }
    };

    let totalScore = 0;
    Object.keys(categories).forEach(cat => {
      let rawScore = 0;
      categories[cat].items.forEach(key => { rawScore += scores[key].score; });
      // 各カテゴリの素点（各指標5点×指標数）を、審査方式のウェイトにスケーリング
      const maxRaw = categories[cat].items.length * 5;
      categories[cat].rawScore = rawScore;
      categories[cat].score = Math.round((rawScore / maxRaw) * categories[cat].max);
      totalScore += categories[cat].score;
    });

    return { scores, categories, totalScore, cf, nwc, mr };
  },

  // --- 定性評価 ---
  calculateQualitative(data) {
    let plusPoints = 0;
    let minusPoints = 0;
    const details = { plus: [], minus: [] };

    // 加点：業歴
    const years = data.yearsInBusiness || 0;
    if (years >= 100) { plusPoints += 5; details.plus.push('業歴100年以上 +5'); }
    else if (years >= 50) { plusPoints += 4; details.plus.push('業歴50年以上 +4'); }
    else if (years >= 30) { plusPoints += 3; details.plus.push('業歴30年以上 +3'); }
    else if (years >= 20) { plusPoints += 2; details.plus.push('業歴20年以上 +2'); }
    else if (years >= 10) { plusPoints += 1; details.plus.push('業歴10年以上 +1'); }

    // 加点：認定支援機関
    if (data.taxAdvisor === 'はい') { plusPoints += 2; details.plus.push('認定支援機関との連携 +2'); }

    // 加点：担保
    if (data.collateral && data.collateral !== 'なし' && data.collateral.length > 2) {
      plusPoints += 3; details.plus.push('担保資産あり +3');
    }

    // 加点：事業の強み記載
    if (data.strengths && data.strengths.length > 10) {
      plusPoints += 2; details.plus.push('事業の強み明確 +2');
    }

    // 加点：見通し良好
    if (data.outlook && data.outlook.length > 10) {
      plusPoints += 1; details.plus.push('事業見通し記載 +1');
    }

    // 減点：税金滞納
    if (data.taxDelinquency) { minusPoints += 10; details.minus.push('税金・社保滞納 -10'); }

    // 減点：リスケ
    if (data.rescheduleHistory) {
      const reschLabel = data.rescheduleHistory === true ? '履歴あり' : data.rescheduleHistory;
      if (reschLabel === '現在進行中' || reschLabel === true) {
        minusPoints += 20; details.minus.push('リスケ進行中 -20');
      } else {
        minusPoints += 7; details.minus.push('リスケ履歴（正常化済） -7');
      }
    }

    // 減点：債務超過
    if (data.negativeEquity) { minusPoints += 5; details.minus.push('債務超過 -5'); }

    // 減点：融資否決歴
    if (data.recentRejection) { minusPoints += 3; details.minus.push('直近融資否決歴 -3'); }

    // 減点：業歴3年未満
    if (years > 0 && years < 3) { minusPoints += 3; details.minus.push('設立3年未満 -3'); }

    return { plusPoints: Math.min(plusPoints, 30), minusPoints: Math.min(minusPoints, 50), details };
  },

  // --- 実態BS分析 ---
  calculateRealBS(data) {
    const na = data.netAssets || (data.financials?.[0]?.netAssets) || 0;
    let assetDecrease = 0;
    let assetIncrease = 0;
    let liabilityIncrease = 0;
    let officerAdjust = 0;
    const items = [];

    // 資産減額
    if (data.badReceivables) { assetDecrease += data.badReceivables; items.push(`不良売掛金 △${data.badReceivables}万円`); }
    if (data.obsoleteInventory) { assetDecrease += data.obsoleteInventory; items.push(`不良在庫 △${data.obsoleteInventory}万円`); }
    if (data.unrecoverableAdvances) { assetDecrease += data.unrecoverableAdvances; items.push(`回収不能貸付等 △${data.unrecoverableAdvances}万円`); }
    if (data.unrealizedLossSecurities) { assetDecrease += data.unrealizedLossSecurities; items.push(`有価証券含み損 △${data.unrealizedLossSecurities}万円`); }

    // 資産増額
    if (data.realEstateMarketValue && data.realEstateBookValue) {
      const diff = data.realEstateMarketValue - data.realEstateBookValue;
      if (diff > 0) { assetIncrease += diff; items.push(`不動産含み益 +${diff}万円`); }
      else if (diff < 0) { assetDecrease += Math.abs(diff); items.push(`不動産含み損 △${Math.abs(diff)}万円`); }
    }
    if (data.insuranceSurrenderValue) { assetIncrease += data.insuranceSurrenderValue * 0.1; items.push(`保険解約返戻金差額 +${Math.round(data.insuranceSurrenderValue * 0.1)}万円（推定）`); }

    // 負債増額
    if (data.retirementBenefitShortfall) { liabilityIncrease += data.retirementBenefitShortfall; items.push(`退職給付引当不足 +${data.retirementBenefitShortfall}万円`); }

    // 代表者勘定
    if (data.officerBorrowFromCompany) { officerAdjust += data.officerBorrowFromCompany; items.push(`役員借入金→資本振替 +${data.officerBorrowFromCompany}万円`); }
    if (data.officerLoanToCompany) { assetDecrease += data.officerLoanToCompany; items.push(`役員貸付金 △${data.officerLoanToCompany}万円（回収不能とみなす）`); }

    const realNA = na - assetDecrease + assetIncrease - liabilityIncrease + officerAdjust;
    const ta = data.totalAssets || 1;
    const realEquityRatio = (realNA / (ta - assetDecrease + assetIncrease)) * 100;

    return {
      bookNA: na, assetDecrease, assetIncrease, liabilityIncrease, officerAdjust,
      realNA, realEquityRatio: Math.round(realEquityRatio * 10) / 10,
      deviation: realNA - na, items
    };
  },

  // --- 修正CF分析 ---
  calculateModifiedCF(data) {
    const f = data.financials?.[0] || {};
    const ni = f.netIncome || 0;
    const dep = data.depreciation || 0;
    const simpleCF = ni + dep;

    const officerReduce = data.officerCompReducible || 0;
    const insuranceReduce = data.insuranceReducible || 0;
    const otherReduce = data.otherReducibleCosts || 0;
    const minCapex = data.minCapex || (dep * 0.5);
    const seasonal = data.seasonalWorkingCapital || 0;

    const modifiedCF = simpleCF + officerReduce + insuranceReduce + otherReduce - minCapex - seasonal;
    const annualRepay = (data.monthlyRepayment || 0) * 12;
    const repayCapacity = modifiedCF - annualRepay;

    return {
      simpleCF, officerReduce, insuranceReduce, otherReduce, minCapex, seasonal,
      modifiedCF, annualRepay, repayCapacity,
      maxBorrowable5y: Math.max(0, repayCapacity * 5),
      maxBorrowable7y: Math.max(0, repayCapacity * 7),
      maxBorrowable10y: Math.max(0, repayCapacity * 10)
    };
  },

  // --- 最終格付け判定 ---
  execute() {
    const data = Database.loadCompanyData();
    if (!data.annualRevenue && !data.financials?.[0]?.revenue) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'ヒアリングデータが不足しています。先に <code>/start</code> でヒアリングを実行してください。'));
      return;
    }

    const quant = this.calculateQuantitative(data);
    const qual = this.calculateQualitative(data);
    const realBS = this.calculateRealBS(data);
    const modCF = this.calculateModifiedCF(data);

    const finalScore = Math.max(0, Math.min(130, quant.totalScore + qual.plusPoints - qual.minusPoints));
    const effectiveScore = Math.min(100, finalScore);
    const grade = Utils.scoreToGrade(effectiveScore);
    const category = Utils.gradeToCategory(grade);
    const treatment = Utils.gradeToTreatment(grade);

    // 実態格付け
    let realScore = effectiveScore;
    if (realBS.deviation > 0) realScore = Math.min(100, realScore + Math.floor(realBS.deviation / 500));
    else realScore = Math.max(0, realScore + Math.floor(realBS.deviation / 500));
    const realGrade = Utils.scoreToGrade(Math.min(100, Math.max(0, realScore)));

    // ボトルネック指標TOP3
    const allScores = Object.entries(quant.scores).map(([key, v]) => ({ key, ...v }))
      .filter(v => !v.estimated).sort((a, b) => a.score - b.score);
    const bottlenecks = allScores.slice(0, 3);

    // 結果保存
    const result = { quant, qual, realBS, modCF, finalScore, effectiveScore, grade, realGrade, category, bottlenecks };
    Database.saveRatingResult(result);

    this.renderResult(result, data);
  },

  // --- 結果表示 ---
  renderResult(result, data) {
    const { quant, qual, realBS, modCF, effectiveScore, grade, realGrade, category } = result;
    const gradeColor = {
      'S+': 'var(--grade-sp)', 'S': 'var(--grade-s)', 'A': 'var(--grade-a)', 'B': 'var(--grade-b)',
      'C': 'var(--grade-c)', 'D': 'var(--grade-d)', 'E': 'var(--grade-e)', 'F': 'var(--grade-f)'
    }[grade] || 'var(--text-primary)';

    // ヘッダー
    const currentMode = typeof AssessmentModes !== 'undefined' ? AssessmentModes.getCurrentMode() : null;
    let html = `<div class="glass-card highlight">
      <div class="report-title">📊 自己査定シミュレーション結果 v5.0</div>
      ${currentMode ? `<div style="font-size:12px;color:var(--accent-cyan);margin-bottom:8px;">🔀 審査方式：<strong>${currentMode.icon} ${currentMode.name}</strong></div>` : ''}
      <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin:20px 0;">
        <div class="score-card" style="flex:1;min-width:140px;">
          <div class="score-value" style="color:${gradeColor}">${effectiveScore}</div>
          <div class="score-label">最終スコア / 100点</div>
          <div class="score-grade" style="color:${gradeColor};border:2px solid ${gradeColor}">${grade}</div>
        </div>
        <div style="flex:2;min-width:200px;">
          <div class="report-row"><span class="label">推定格付け</span><span class="value">${Utils.createGradeBadge(grade)}</span></div>
          <div class="report-row"><span class="label">推定債務者区分</span><span class="value">${category}</span></div>
          <div class="report-row"><span class="label">実態格付け（BS修正後）</span><span class="value">${Utils.createGradeBadge(realGrade)}</span></div>
          <div class="report-row"><span class="label">銀行内での扱い</span><span class="value" style="font-family:var(--font-primary);font-size:12px;">${Utils.gradeToTreatment(grade)}</span></div>
        </div>
      </div>`;

    // カテゴリ別スコアバー
    html += `<div class="report-subtitle">📈 カテゴリ別スコア</div>
      <div class="radar-container">`;
    Object.entries(quant.categories).forEach(([key, cat]) => {
      const pct = (cat.score / cat.max) * 100;
      html += `<div class="radar-item">
        <div class="radar-bar"><div class="radar-fill" style="height:${pct}%"><span class="radar-score">${cat.score}/${cat.max}</span></div></div>
        <div class="radar-item-label">${cat.label}</div>
      </div>`;
    });
    html += `</div>`;

    // 定量スコア詳細
    html += `<div class="report-subtitle">🔢 定量評価詳細（${quant.totalScore}点 / 100点）</div>`;
    const tableHeaders = ['#', '指標名', '数値', 'スコア', '評価'];
    const tableRows = [];
    let i = 1;
    Object.entries(quant.scores).forEach(([key, v]) => {
      const stars = '●'.repeat(v.score) + '○'.repeat(5 - v.score);
      const valStr = v.estimated ? '【推定値】' :
        (v.unit === '%' ? Utils.formatPercent(v.value) :
         v.unit === '倍' ? Utils.formatRatio(v.value) :
         v.unit === '年' ? Utils.formatYears(v.value) :
         v.unit === '回' ? `${v.value.toFixed(2)}回` :
         v.unit === 'ヶ月' ? Utils.formatMonths(v.value) : v.value);
      tableRows.push([i++, v.label, valStr, `${v.score}/5`, `<span style="color:${v.score >= 4 ? 'var(--accent-green)' : v.score >= 3 ? 'var(--accent-gold)' : 'var(--accent-red)'}">${stars}</span>`]);
    });
    html += Utils.createTable(tableHeaders, tableRows);

    // 定性評価
    html += `<div class="report-subtitle">📝 定性評価（加点 +${qual.plusPoints} / 減点 -${qual.minusPoints} = 純加減 ${qual.plusPoints - qual.minusPoints >= 0 ? '+' : ''}${qual.plusPoints - qual.minusPoints}点）</div>`;
    if (qual.details.plus.length > 0) {
      html += `<div style="margin:8px 0;">`;
      qual.details.plus.forEach(p => { html += Utils.createAlert('success', '✅', p); });
      html += `</div>`;
    }
    if (qual.details.minus.length > 0) {
      html += `<div style="margin:8px 0;">`;
      qual.details.minus.forEach(m => { html += Utils.createAlert('critical', '⛔', m); });
      html += `</div>`;
    }

    // 実態BS
    html += `<div class="report-subtitle">🏢 実態BS分析</div>
      <div class="report-row"><span class="label">帳簿上の純資産</span><span class="value">${Utils.formatMan(realBS.bookNA)}</span></div>
      <div class="report-row"><span class="label">資産サイド修正（減額）</span><span class="value" style="color:var(--accent-red)">△${Utils.formatMan(realBS.assetDecrease)}</span></div>
      <div class="report-row"><span class="label">資産サイド修正（増額）</span><span class="value" style="color:var(--accent-green)">+${Utils.formatMan(realBS.assetIncrease)}</span></div>
      <div class="report-row"><span class="label">負債サイド修正</span><span class="value" style="color:var(--accent-red)">+${Utils.formatMan(realBS.liabilityIncrease)}</span></div>
      <div class="report-row"><span class="label">代表者勘定修正</span><span class="value" style="color:var(--accent-green)">+${Utils.formatMan(realBS.officerAdjust)}</span></div>
      <div style="border-top:2px solid var(--border-primary);margin-top:8px;padding-top:8px;">
        <div class="report-row"><span class="label" style="font-weight:700;">実態純資産</span><span class="value" style="font-size:16px;">${Utils.formatMan(realBS.realNA)}</span></div>
        <div class="report-row"><span class="label">実態自己資本比率</span><span class="value">${Utils.formatPercent(realBS.realEquityRatio)}</span></div>
      </div>`;

    // 修正CF
    html += `<div class="report-subtitle">💰 修正CF分析</div>
      <div class="report-row"><span class="label">簡易CF（税引後利益+減価償却）</span><span class="value">${Utils.formatMan(modCF.simpleCF)}/年</span></div>
      <div class="report-row"><span class="label">修正CF</span><span class="value">${Utils.formatMan(modCF.modifiedCF)}/年</span></div>
      <div class="report-row"><span class="label">既存年間返済額</span><span class="value">${Utils.formatMan(modCF.annualRepay)}/年</span></div>
      <div class="report-row"><span class="label" style="font-weight:700;">返済余力</span><span class="value" style="color:${modCF.repayCapacity >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${Utils.formatMan(modCF.repayCapacity)}/年</span></div>
      <div class="report-row"><span class="label">理論上の最大借入可能額（5年）</span><span class="value">${Utils.formatMan(modCF.maxBorrowable5y)}</span></div>
      <div class="report-row"><span class="label">理論上の最大借入可能額（10年）</span><span class="value">${Utils.formatMan(modCF.maxBorrowable10y)}</span></div>`;

    // ボトルネック
    html += `<div class="report-subtitle">🎯 ボトルネック指標 TOP3</div>`;
    result.bottlenecks.forEach((b, idx) => {
      const targetScore = Math.min(5, b.score + 2);
      html += Utils.createAlert('warning', `${idx + 1}位`, `<strong>${b.label}</strong>（現在スコア：${b.score}/5 → 目標：${targetScore}/5）`);
    });

    // 格付け改善アドバイス
    html += `<div class="report-subtitle">📋 格付けを1ランク上げるために</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;">`;
    if (effectiveScore < 46) {
      html += `税金滞納の解消、リスケからの正常化、債務超過の解消が最優先です。公庫の資本性劣後ローンの活用を強く推奨します。`;
    } else if (effectiveScore < 56) {
      html += `保証協会の活用枠を最大化し、経営改善計画の策定が有効です。認定支援機関との連携で保証料優遇も狙えます。`;
    } else if (effectiveScore < 66) {
      html += `CFの改善（不採算事業の整理・粗利率改善）と、実態BS上の含み資産の洗い出しが効果的です。`;
    } else if (effectiveScore < 76) {
      html += `自己資本比率の改善と債務償還年数の短縮がカギです。役員報酬の最適化や保険の見直しも検討してください。`;
    } else {
      html += `現在の水準を維持しつつ、プロパー融資の拡大と経営者保証の解除を目指す段階です。`;
    }
    html += `</div>`;

    // アクションボタン
    html += `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="App.executeCommand('/マトリックス')">📊 審査マトリックス判定</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/融資方法')">🏦 最適融資方法の選定</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/戦略')">📋 総合戦略レポート</button>
    </div></div>`;

    App.addSystemMessage(html);
  }
};
