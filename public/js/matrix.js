/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 審査マトリックスエンジン
 * 債務者区分×案件評価の判定 + ギリギリ攻略戦略
 * ============================================================ */

const Matrix = {
  // 案件評価の計算
  calculateCaseScore(data) {
    let fundUse = 0, repaySource = 0, collateralScore = 0, merit = 0;

    // 資金使途スコア（30点満点）
    const purposeMap = {
      '設備投資（新規・増産）': 28, '運転資金（経常運転資金）': 22,
      '運転資金（季節資金・つなぎ）': 17, '借換（条件改善）': 15,
      '設備投資（更新・改修）': 22, '借入一本化': 12,
      '納税資金': 7, 'その他': 10
    };
    fundUse = purposeMap[data.loanPurpose] || 10;

    // 返済原資スコア（30点満点）
    const rr = Database.loadRatingResult();
    if (rr) {
      const cfm = rr.quant.scores.cfMultiple?.value || 0;
      if (cfm >= 2.0) repaySource = 28;
      else if (cfm >= 1.5) repaySource = 23;
      else if (cfm >= 1.0) repaySource = 18;
      else if (cfm >= 0.7) repaySource = 10;
      else repaySource = 3;
    } else {
      repaySource = 15;
    }

    // 保全スコア（20点満点）
    if (data.collateral && data.collateral.length > 5 && data.collateral !== 'なし') {
      collateralScore = 16;
    } else if (data.guaranteeBalance !== null && data.guaranteeBalance >= 0) {
      collateralScore = 12;
    } else {
      collateralScore = 5;
    }

    // 取引メリットスコア（20点満点）
    if (data.mainBankYears && data.mainBankYears >= 10) merit += 5;
    else if (data.mainBankYears && data.mainBankYears >= 5) merit += 3;
    if (data.annualRevenue && data.annualRevenue >= 10000) merit += 5;
    else if (data.annualRevenue && data.annualRevenue >= 5000) merit += 3;
    merit += 5; // 基本ポイント

    const total = fundUse + repaySource + collateralScore + merit;
    const rating = total >= 80 ? '◎' : total >= 60 ? '○' : total >= 40 ? '△' : '×';
    const ratingLabel = { '◎': '優良案件', '○': '良好案件', '△': '微妙な案件', '×': '不良案件' }[rating];

    return { fundUse, repaySource, collateralScore, merit, total, rating, ratingLabel };
  },

  // マトリックス判定
  getMatrixResult(debtorGrade, caseRating) {
    const matrix = {
      'S+': { '◎': { result: '確実に通る', color: 'sure', detail: 'プロパー融資可能。金利優遇の交渉余地あり。' },
              '○': { result: 'ほぼ通る', color: 'sure', detail: 'プロパー融資可能。標準金利。' },
              '△': { result: '条件次第', color: 'likely', detail: '保証付き推奨。やや高めの金利。' },
              '×': { result: '要交渉', color: 'marginal', detail: '保証付き必須。高めの金利。' } },
      'S':  { '◎': { result: '確実に通る', color: 'sure', detail: 'プロパー融資可能。金利優遇の交渉余地あり。' },
              '○': { result: 'ほぼ通る', color: 'sure', detail: 'プロパー融資可能。標準金利。' },
              '△': { result: '条件次第', color: 'likely', detail: '保証付き推奨。やや高めの金利。' },
              '×': { result: '要交渉', color: 'marginal', detail: '保証付き。高めの金利。' } },
      'A':  { '◎': { result: 'ほぼ通る', color: 'sure', detail: 'プロパー融資可能。標準金利。' },
              '○': { result: '通る可能性高', color: 'likely', detail: 'MIX（プロパー+保証付き）推奨。' },
              '△': { result: 'ギリギリ', color: 'marginal', detail: '保証付き必須。やや高めの金利。' },
              '×': { result: '厳しい', color: 'difficult', detail: '案件内容の再検討が必要。' } },
      'B':  { '◎': { result: '通る可能性高', color: 'likely', detail: '保証付き推奨。やや高め金利。' },
              '○': { result: 'ギリギリ', color: 'marginal', detail: '保証付き必須。やや高め金利。' },
              '△': { result: '通らない', color: 'difficult', detail: '案件内容の改善が必要。' },
              '×': { result: '通らない', color: 'impossible', detail: '戦略全体の見直しが必要。' } },
      'C':  { '◎': { result: '条件次第', color: 'marginal', detail: '保証付き必須。高め金利。' },
              '○': { result: '厳しい', color: 'difficult', detail: '保証付き＋追加保全が必要。' },
              '△': { result: '通らない', color: 'impossible', detail: '公庫の活用を検討。' },
              '×': { result: '通らない', color: 'impossible', detail: '経営再建が優先。' } },
      'D':  { '◎': { result: '公庫/保証協会に特化', color: 'difficult', detail: '制度活用で可能性あり。' },
              '○': { result: '通らない', color: 'impossible', detail: '再生検討。' },
              '△': { result: '通らない', color: 'impossible', detail: '再生検討。' },
              '×': { result: '通らない', color: 'impossible', detail: '法的整理検討。' } },
      'E':  { '◎': { result: '原則不可', color: 'impossible', detail: '特別な制度活用のみ。' },
              '○': { result: '通らない', color: 'impossible', detail: '再生専門家への相談。' },
              '△': { result: '通らない', color: 'impossible', detail: '法的整理検討。' },
              '×': { result: '通らない', color: 'impossible', detail: '法的整理検討。' } },
      'F':  { '◎': { result: '通らない', color: 'impossible', detail: '法的整理検討。' },
              '○': { result: '通らない', color: 'impossible', detail: '法的整理検討。' },
              '△': { result: '通らない', color: 'impossible', detail: '法的整理検討。' },
              '×': { result: '通らない', color: 'impossible', detail: '法的整理検討。' } }
    };
    const gradeKey = (debtorGrade === 'S+') ? 'S+' : debtorGrade;
    return matrix[gradeKey]?.[caseRating] || { result: '判定不能', color: 'marginal', detail: '' };
  },

  // 実行
  execute() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const grade = rr?.grade || 'B';

    const caseScore = this.calculateCaseScore(data);
    const matrixResult = this.getMatrixResult(grade, caseScore.rating);

    Database.saveMatrixResult({ caseScore, matrixResult, grade });

    this.renderResult(grade, caseScore, matrixResult, data);
  },

  // 表示
  renderResult(grade, caseScore, matrixResult, data) {
    // 成功確率推定
    const probMap = { 'sure': '85〜95%', 'likely': '65〜85%', 'marginal': '40〜65%', 'difficult': '15〜40%', 'impossible': '0〜15%' };
    const colorMap = { 'sure': 'var(--accent-green)', 'likely': 'var(--accent-blue)', 'marginal': 'var(--accent-gold)', 'difficult': 'var(--accent-orange)', 'impossible': 'var(--accent-red)' };

    let html = `<div class="glass-card highlight">
      <div class="report-title">📊 融資審査マトリックス判定</div>

      <div style="text-align:center;margin:20px 0;">
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px;">判定結果</div>
        <div style="font-size:32px;font-weight:800;color:${colorMap[matrixResult.color]}">${matrixResult.result}</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">推定成功確率：<strong style="color:${colorMap[matrixResult.color]}">${probMap[matrixResult.color]}</strong></div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:8px;">${matrixResult.detail}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;">
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">債務者格付け</div>
          <div style="margin-top:8px;">${Utils.createGradeBadge(grade)}</div>
        </div>
        <div class="glass-card" style="text-align:center;">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">案件評価</div>
          <div style="font-size:28px;font-weight:800;margin-top:4px;color:${caseScore.rating === '◎' ? 'var(--accent-green)' : caseScore.rating === '○' ? 'var(--accent-blue)' : caseScore.rating === '△' ? 'var(--accent-gold)' : 'var(--accent-red)'}">${caseScore.rating}</div>
          <div style="font-size:12px;color:var(--text-secondary);">${caseScore.ratingLabel}（${caseScore.total}点/100点）</div>
        </div>
      </div>`;

    // 案件スコア内訳
    html += `<div class="report-subtitle">📋 案件評価の内訳</div>`;
    const items = [
      { label: '資金使途', score: caseScore.fundUse, max: 30 },
      { label: '返済原資', score: caseScore.repaySource, max: 30 },
      { label: '保全', score: caseScore.collateralScore, max: 20 },
      { label: '取引メリット', score: caseScore.merit, max: 20 }
    ];
    items.forEach(item => {
      const color = Utils.scoreColor(item.score, item.max);
      html += `<div style="margin:8px 0;">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
          <span>${item.label}</span><span style="font-weight:600;">${item.score}/${item.max}</span>
        </div>
        ${Utils.createProgressBar(item.score, item.max, color)}
      </div>`;
    });

    // マトリックスビジュアル
    html += `<div class="report-subtitle">🗂️ 審査マトリックス</div>
      <div class="matrix-grid" style="grid-template-columns:repeat(5,1fr);">
        <div class="matrix-cell header"></div>
        <div class="matrix-cell header">案件◎</div>
        <div class="matrix-cell header">案件○</div>
        <div class="matrix-cell header">案件△</div>
        <div class="matrix-cell header">案件×</div>`;

    ['S+', 'S', 'A', 'B', 'C', 'D'].forEach(g => {
      html += `<div class="matrix-cell header">${g}</div>`;
      ['◎', '○', '△', '×'].forEach(r => {
        const cell = this.getMatrixResult(g, r);
        const isActive = g === grade && r === caseScore.rating;
        html += `<div class="matrix-cell ${cell.color}${isActive ? ' active-result' : ''}" title="${cell.detail}">${cell.result}</div>`;
      });
    });
    html += `</div>`;

    // ギリギリ攻略（該当する場合）
    if (matrixResult.color === 'marginal') {
      html += this.renderAttackStrategies(data, caseScore);
    }

    html += `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="App.executeCommand('/融資方法')">🏦 最適融資方法の選定</button>
      <button class="btn btn-secondary" onclick="App.executeCommand('/資料ALL')">📄 資料一括作成</button>
    </div></div>`;

    App.addSystemMessage(html);
  },

  // ギリギリ攻略戦略
  renderAttackStrategies(data, caseScore) {
    let html = `<div class="report-subtitle">⚔️ 「ギリギリ通る」を「通る」に変える戦略</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">
        現在の判定は「ギリギリ」です。以下の戦略で成功確率を高められます。
      </div>`;

    const strategies = [
      { icon: '📝', title: '手法①：案件のアップグレード',
        desc: '資金使途をより前向きに再定義する',
        example: data.loanPurpose?.includes('運転') ? '「運転資金」→「新規取引先開拓に伴う仕入資金」に変更' : '資金使途の説明に具体的な効果を追加' },
      { icon: '🛡️', title: '手法②：保全の強化',
        desc: '担保・保証を追加して保全スコアを上げる',
        example: '信用保証協会の付保を追加、不動産の追加担保提供' },
      { icon: '🤝', title: '手法③：取引メリットの提示',
        desc: '銀行にとっての旨みを明確にする',
        example: 'メイン口座の移管、役員報酬の振込口座変更、法人カードの集約を提案' },
      { icon: '✂️', title: '手法④：金額の分割',
        desc: '一度に大口で通すのではなく分割申込',
        example: data.loanAmount ? `${Utils.formatMan(data.loanAmount)}を${Utils.formatMan(data.loanAmount / 2)}×2本に分割` : '証書貸付＋当座貸越のMIXに' },
      { icon: '📅', title: '手法⑤：時期の調整',
        desc: '決算直後の良いタイミングで申込む',
        example: '黒字決算の確定直後、大型受注確定直後が最適' },
      { icon: '🔄', title: '手法⑥：融資形態の変更',
        desc: '通りやすい形態に切り替える',
        example: '長期証書貸付→短期手形貸付（更新前提）、プロパー→保証協会付き' },
      { icon: '🏦', title: '手法⑦：銀行の変更・追加',
        desc: 'より通りやすい金融機関を選ぶ',
        example: 'メガバンク→地銀・信金に変更（中小企業向き）、公庫の並行申込み' }
    ];

    strategies.forEach(s => {
      html += `<div class="glass-card" style="margin:8px 0;padding:14px 18px;">
        <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${s.icon} ${s.title}</div>
        <div style="font-size:13px;color:var(--text-secondary);">${s.desc}</div>
        <div style="font-size:12px;color:var(--accent-gold);margin-top:6px;">💡 ${s.example}</div>
      </div>`;
    });

    return html;
  }
};
