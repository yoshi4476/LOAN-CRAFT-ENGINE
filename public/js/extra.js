/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 追加機能モジュール
 * 比較分析・チェックリスト・リスケ戦略・劣後ローン・
 * レーダーチャート・印刷機能・自動フォロー
 * ============================================================ */

const Extra = {

  // --- /比較 コマンド：2つの融資案の比較分析 ---
  showComparison() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const rev = data.annualRevenue || 0;
    const grade = rr?.grade || 'B';
    const cf = rr?.modCF?.modifiedCF || 0;

    // パターンA：保証協会付き vs パターンB：プロパー
    const optionA = {
      name: '保証協会付き融資',
      rate: grade === 'A' || grade === 'S' || grade === 'S+' ? 1.5 : 2.0,
      guaranteeFee: 1.0,
      maxAmount: Math.min(data.loanAmount || 5000, 8000),
      period: 7,
      collateral: 'なし',
      approvalTime: '2〜4週間',
      successProb: 75
    };
    const optionB = {
      name: 'プロパー融資',
      rate: grade === 'S+' ? 0.8 : grade === 'S' ? 1.0 : grade === 'A' ? 1.3 : 2.0,
      guaranteeFee: 0,
      maxAmount: data.loanAmount || 5000,
      period: 5,
      collateral: '応相談',
      approvalTime: '3〜6週間',
      successProb: grade === 'S+' || grade === 'S' ? 80 : grade === 'A' ? 60 : 30
    };
    const optionC = {
      name: '日本政策金融公庫',
      rate: 1.8,
      guaranteeFee: 0,
      maxAmount: Math.min(data.loanAmount || 5000, 7200),
      period: 10,
      collateral: 'なし（原則）',
      approvalTime: '3〜5週間',
      successProb: 65
    };

    const options = [optionA, optionB, optionC];

    // 総コスト計算
    options.forEach(opt => {
      const amt = opt.maxAmount;
      const totalRate = opt.rate + opt.guaranteeFee;
      opt.annualCost = Math.round(amt * totalRate / 100);
      opt.totalCost = Math.round(opt.annualCost * opt.period);
      opt.monthlyRepay = Math.round(amt / opt.period / 12);
    });

    let html = `<div class="glass-card highlight">
      <div class="report-title">🔄 融資方法の比較分析</div>
      <p style="color:var(--text-secondary);font-size:12px;margin-bottom:16px;">
        主要な融資形態を並べて比較します。格付け ${Utils.createGradeBadge(grade)} 基準。
      </p>`;

    // 比較テーブル
    const headers = ['項目', ...options.map(o => `<strong>${o.name}</strong>`)];
    const rows = [
      ['適用金利', ...options.map(o => `${o.rate}%`)],
      ['保証料率', ...options.map(o => o.guaranteeFee > 0 ? `${o.guaranteeFee}%` : '—')],
      ['<strong>トータルコスト率</strong>', ...options.map(o => `<strong>${o.rate + o.guaranteeFee}%</strong>`)],
      ['最大融資額', ...options.map(o => Utils.formatMan(o.maxAmount))],
      ['融資期間', ...options.map(o => `${o.period}年`)],
      ['担保', ...options.map(o => o.collateral)],
      ['審査期間目安', ...options.map(o => o.approvalTime)],
      ['年間利息コスト', ...options.map(o => Utils.formatMan(o.annualCost))],
      [`<strong>${options[0].period}年間の総利息</strong>`, ...options.map(o => `<strong>${Utils.formatMan(o.totalCost)}</strong>`)],
      ['月返済額（元金のみ）', ...options.map(o => `${Utils.formatMan(o.monthlyRepay)}/月`)],
      ['成功確率（推定）', ...options.map(o => `<span style="color:${o.successProb >= 70 ? 'var(--accent-green)' : o.successProb >= 50 ? 'var(--accent-gold)' : 'var(--accent-red)'}">${o.successProb}%</span>`)]
    ];
    html += Utils.createTable(headers, rows);

    // 推奨
    const best = [...options].sort((a, b) => {
      const scoreA = a.successProb * 0.5 - (a.rate + a.guaranteeFee) * 10;
      const scoreB = b.successProb * 0.5 - (b.rate + b.guaranteeFee) * 10;
      return scoreB - scoreA;
    })[0];
    html += Utils.createAlert('success', '🏆', `総合推奨：<strong>${best.name}</strong> — 成功確率と総コストのバランスが最も優れています。`);

    html += `</div>`;
    App.addSystemMessage(html);
  },

  // --- /チェック コマンド：提出前最終チェックリスト ---
  showPreSubmitChecklist() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const f = data.financials?.[0] || {};

    const checks = [
      // 書類チェック
      { cat: '📋 必須書類', items: [
        { label: '決算書（直近3期分）', ok: true, critical: true },
        { label: '法人税申告書（別表含む）', ok: true, critical: true },
        { label: '直近の試算表', ok: !!data.financials?.[0]?.revenue, critical: true },
        { label: '商業登記簿謄本（3ヶ月以内）', ok: true, critical: true },
        { label: '代表者の本人確認書類', ok: true, critical: true },
        { label: '印鑑証明書', ok: true, critical: false },
      ]},
      { cat: '📄 作成書類', items: [
        { label: 'エグゼクティブサマリー', ok: !!rr, critical: true },
        { label: '企業概要書', ok: !!data.industry, critical: true },
        { label: '資金繰り表（12ヶ月）', ok: false, critical: true },
        { label: '借入金一覧表', ok: !!data.totalDebt, critical: true },
        { label: '事業計画書', ok: false, critical: false },
        { label: '取引深耕提案書', ok: false, critical: false },
        { label: '想定Q&A集', ok: !!rr, critical: false },
      ]},
      { cat: '🔍 数値チェック', items: [
        { label: '全資料の企業名が統一されている', ok: true, critical: true },
        { label: '売上高・利益が決算書と整合', ok: !!data.annualRevenue, critical: true },
        { label: '借入金額が借入金一覧と整合', ok: !!data.totalDebt, critical: true },
        { label: '金額の万円/千円の端数が統一', ok: true, critical: false },
        { label: '事業計画の数値が積み上げ方式', ok: false, critical: false },
      ]},
      { cat: '🤝 面談準備', items: [
        { label: '面談アポイント取得済み', ok: false, critical: true },
        { label: '資料を2部印刷済み（先方控えと自分用）', ok: false, critical: true },
        { label: '数字の質問にすぐ答えられる準備', ok: !!rr, critical: false },
        { label: '服装・身だしなみの確認', ok: false, critical: false },
      ]},
    ];

    let html = `<div class="glass-card highlight">
      <div class="report-title">✅ 提出前・面談前 最終チェックリスト</div>
      <p style="color:var(--text-secondary);font-size:12px;margin-bottom:16px;">銀行訪問前に全項目を確認してください。<span style="color:var(--accent-red);">★</span> は必須項目です。</p>`;

    let totalItems = 0, checkedItems = 0;
    checks.forEach(section => {
      html += `<div class="report-subtitle">${section.cat}</div>`;
      section.items.forEach(item => {
        totalItems++;
        if (item.ok) checkedItems++;
        html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
          <span style="color:${item.ok ? 'var(--accent-green)' : 'var(--text-muted)'};cursor:pointer;">${item.ok ? '☑️' : '⬜'}</span>
          <span style="color:${item.ok ? 'var(--text-primary)' : 'var(--text-muted)'}">${item.label}</span>
          ${item.critical ? '<span style="color:var(--accent-red);font-size:10px;">★必須</span>' : ''}
        </div>`;
      });
    });

    const pct = Math.round((checkedItems / totalItems) * 100);
    html += `<div style="margin-top:16px;">
      <div style="font-size:14px;font-weight:600;">準備度：${pct}%（${checkedItems}/${totalItems}項目）</div>
      ${Utils.createProgressBar(checkedItems, totalItems)}
    </div>`;

    html += pct >= 80
      ? Utils.createAlert('success', '🎉', '準備は概ね整っています！自信を持って面談に臨みましょう。')
      : Utils.createAlert('warning', '⚠️', '未完了の項目があります。特に★必須の項目は必ず完了させてください。');

    html += `</div>`;
    App.addSystemMessage(html);
  },

  // --- /リスケ復活 コマンド ---
  showRescheduleRecovery() {
    const data = Database.loadCompanyData();
    let html = `<div class="glass-card highlight">
      <div class="report-title">🔄 リスケからの新規融資復活ロードマップ</div>
      <div class="alert-card warning"><span class="alert-icon">⚠️</span><div>
        リスケ（条件変更）中は原則として新規融資は困難です。しかし、正しい手順を踏めば復活は可能です。
      </div></div>

      <div class="report-subtitle">📋 復活までの5ステップ</div>
      <div class="flow-chart">
        <div class="flow-node active">Step 1：経営改善計画の策定と金融機関への提出</div>
        <div class="flow-connector">↓ 3〜6ヶ月</div>
        <div class="flow-node">Step 2：計画の着実な実行（月次報告の継続）</div>
        <div class="flow-connector">↓ 6〜12ヶ月</div>
        <div class="flow-node">Step 3：約定返済の正常化（元金返済の再開）</div>
        <div class="flow-connector">↓ 12〜24ヶ月</div>
        <div class="flow-node">Step 4：正常化後の実績積み上げ（最低6ヶ月）</div>
        <div class="flow-connector">↓ 6ヶ月</div>
        <div class="flow-node result">Step 5：新規融資の申込み</div>
      </div>

      <div class="report-subtitle">🏦 リスケ中でも可能性がある融資手段</div>`;

    const options = [
      { name: '日本政策金融公庫（企業再建資金）', prob: 40, detail: '改善計画策定済みで、計画に沿った進捗がある場合。認定支援機関の支援が必須。' },
      { name: '信用保証協会（経営改善サポート保証）', prob: 30, detail: '再生計画に基づく正常化のための追加運転資金。認定支援機関連携が条件。' },
      { name: 'DDS（デット・デット・スワップ）', prob: 35, detail: '既存債務の一部を劣後ローンに転換。実質的な資本増強で格付け改善。' },
      { name: '中小企業再生支援協議会の活用', prob: 50, detail: '公的な再生支援スキーム。債権者間の調整を仲介してもらえる。' },
    ];

    options.forEach(opt => {
      html += `<div class="glass-card" style="margin:8px 0;padding:14px 18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:14px;">${opt.name}</span>
          <span class="tag ${opt.prob >= 40 ? 'tag-warning' : 'tag-danger'}">成功率 約${opt.prob}%</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">${opt.detail}</div>
      </div>`;
    });

    html += `<div class="report-subtitle">💡 核心アドバイス</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
        1. <strong>銀行との関係を切らない</strong> — 月次試算表を毎月提出し続ける<br>
        2. <strong>小さな約束を守り続ける</strong> — 約束した返済額は絶対に守る<br>
        3. <strong>公庫の資本性劣後ローン</strong>を活用して自己資本を増強<br>
        4. <strong>認定支援機関</strong>（税理士等）を味方につける<br>
        5. <strong>最初の新規融資は少額</strong>（数百万円）で実績を作る
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // --- /劣後ローン コマンド ---
  showSubordinatedLoan() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const na = data.netAssets || rr?.realBS?.bookNA || 0;
    const isNE = na < 0 || data.negativeEquity;

    let html = `<div class="glass-card highlight">
      <div class="report-title">📊 資本性劣後ローン活用シミュレーション</div>
      <div class="alert-card info"><span class="alert-icon">💎</span><div>
        資本性劣後ローンは「融資でありながら自己資本とみなされる」究極のツール。
        債務超過の解消、格付け改善に絶大な効果があります。
      </div></div>

      <div class="report-subtitle">📋 主な資本性劣後ローン制度</div>`;

    const products = [
      { name: '挑戦支援資本強化特例（公庫）', limit: '7,200万円', rate: '業績連動（0.9〜6.4%）', period: '5年1ヶ月・7年・10年・15年・20年', feature: '返済期限一括・期限前返済不可。自己資本にみなされる。', best: 'スタートアップ・再生企業' },
      { name: '新型コロナ対策資本性劣後ローン', limit: '7,200万円', rate: '業績連動', period: '5年1ヶ月〜20年', feature: '一定期間の据置あり。', best: 'コロナ影響を受けた企業' },
    ];

    products.forEach(p => {
      html += `<div class="glass-card" style="margin:8px 0;padding:16px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:8px;">${p.name}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:8px;">
          <div><span style="font-size:11px;color:var(--text-muted);">限度額</span><div style="font-size:13px;">${p.limit}</div></div>
          <div><span style="font-size:11px;color:var(--text-muted);">金利</span><div style="font-size:13px;">${p.rate}</div></div>
          <div><span style="font-size:11px;color:var(--text-muted);">期間</span><div style="font-size:13px;">${p.period}</div></div>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);">${p.feature}</div>
        <div style="font-size:11px;color:var(--accent-gold);margin-top:4px;">🎯 ${p.best}</div>
      </div>`;
    });

    // シミュレーション
    if (isNE || na < 3000) {
      html += `<div class="report-subtitle">📈 効果シミュレーション</div>`;
      const amounts = [1000, 3000, 5000, 7200];
      const headers = ['劣後ローン額', '実態純資産', '自己資本比率', '格付け変化'];
      const ta = data.totalAssets || (data.annualRevenue || 10000) * 0.5;
      const rows = amounts.map(amt => {
        const newNA = na + amt;
        const newRatio = ta > 0 ? ((newNA / ta) * 100).toFixed(1) : '—';
        const effectiveScore = rr?.effectiveScore || 50;
        const bonus = Math.min(20, Math.floor(amt / 500));
        const newGrade = Utils.scoreToGrade(Math.min(100, effectiveScore + bonus));
        return [
          Utils.formatMan(amt),
          `${Utils.formatMan(newNA)}${newNA >= 0 && na < 0 ? ' ✅債務超過解消' : ''}`,
          `${newRatio}%`,
          `${rr?.grade || '—'} → <strong style="color:var(--accent-green);">${newGrade}</strong>`
        ];
      });
      html += Utils.createTable(headers, rows);
    }

    html += `<div class="report-subtitle">⚠️ 注意点</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
        ・期限前返済ができない（最低5年1ヶ月は返済不可）<br>
        ・業績悪化時の金利負担が増加するリスク<br>
        ・金融検査で「資本とみなされる」条件を満たす必要がある<br>
        ・銀行への開示が必要（むしろ積極的に開示すべき）
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // --- Canvas レーダーチャート ---
  renderRadarChart() {
    const rr = Database.loadRatingResult();
    if (!rr) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '格付け診断が未実行です。先に <code>/診断</code> をご利用ください。'));
      return;
    }

    const cats = rr.quant.categories;
    const labels = Object.values(cats).map(c => c.label);
    const values = Object.values(cats).map(c => (c.score / c.max) * 100);

    let html = `<div class="glass-card">
      <div class="report-title">📊 レーダーチャート分析</div>
      <div style="display:flex;justify-content:center;padding:20px;">
        <canvas id="radarCanvas" width="400" height="400" style="max-width:100%;"></canvas>
      </div>
      <div style="text-align:center;font-size:12px;color:var(--text-muted);">※各カテゴリの達成率（%表示）</div>
    </div>`;

    App.addSystemMessage(html);

    // Canvasレーダー描画
    setTimeout(() => {
      const canvas = document.getElementById('radarCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const r = Math.min(w, h) * 0.35;
      const n = labels.length;

      // 背景クリア
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, w, h);

      // 同心円グリッド
      for (let level = 1; level <= 5; level++) {
        const lr = r * level / 5;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const x = cx + lr * Math.cos(angle);
          const y = cy + lr * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 軸線
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.stroke();
      }

      // データエリア
      ctx.beginPath();
      values.forEach((val, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const dr = r * val / 100;
        const x = cx + dr * Math.cos(angle);
        const y = cy + dr * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(123,97,255,0.25)';
      ctx.fill();
      ctx.strokeStyle = '#7b61ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // データポイント＋ラベル
      values.forEach((val, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const dr = r * val / 100;
        const x = cx + dr * Math.cos(angle);
        const y = cy + dr * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#7b61ff';
        ctx.fill();

        // ラベル
        const lx = cx + (r + 24) * Math.cos(angle);
        const ly = cy + (r + 24) * Math.sin(angle);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${labels[i]} ${Math.round(val)}%`, lx, ly);
      });
    }, 100);
  },

  // --- 印刷機能 ---
  printDocuments() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();

    // 印刷用のHTMLを生成
    let printHtml = `<!DOCTYPE html><html lang="ja"><head>
      <meta charset="UTF-8">
      <title>LOAN CRAFT ENGINE - 印刷用資料</title>
      <style>
        body { font-family: 'Yu Gothic', 'Hiragino Sans', sans-serif; color: #333; padding: 40px; font-size: 12px; line-height: 1.8; }
        h1 { font-size: 18px; border-bottom: 2px solid #333; padding-bottom: 8px; }
        h2 { font-size: 14px; margin-top: 20px; border-left: 4px solid #333; padding-left: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 11px; }
        th { background: #f5f5f5; }
        .page-break { page-break-before: always; }
        @media print { body { padding: 20px; } }
      </style>
    </head><body>`;

    // エグゼクティブサマリー
    printHtml += Documents.genExecutiveSummary(data, rr);
    printHtml += `<div class="page-break"></div>`;
    printHtml += Documents.genCompanyOverview(data);
    printHtml += `<div class="page-break"></div>`;
    printHtml += Documents.genDebtList(data);

    printHtml += `</body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.print();
    App.addSystemMessage(Utils.createAlert('success', '🖨️', '印刷ダイアログを開きました。'));
  },

  // --- 自動フォロー（次のおすすめアクション提示） ---
  suggestNextAction() {
    const data = Database.loadCompanyData();
    const rr = Database.loadRatingResult();
    const mr = Database.loadMatrixResult();

    let suggestion = '';
    let cmd = '';

    if (!data.industry && !data.annualRevenue) {
      suggestion = 'まずはヒアリングを開始しましょう。';
      cmd = '/start';
    } else if (data.interviewStep < 3) {
      suggestion = 'ヒアリングを続行して企業情報を充実させましょう。';
      cmd = '/start';
    } else if (!rr) {
      suggestion = 'ヒアリングが完了しています。格付け診断に進みましょう。';
      cmd = '/診断';
    } else if (!mr) {
      suggestion = '格付け診断が完了しました。審査マトリックス判定に進みましょう。';
      cmd = '/マトリックス';
    } else {
      suggestion = 'マトリックス判定が完了しました。融資方法の選定または資料作成に進みましょう。';
      cmd = '/融資方法';
    }

    const html = `<div class="glass-card" style="border-left:3px solid var(--primary);">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:20px;">💡</span>
        <div style="flex:1;">
          <div style="font-size:13px;color:var(--text-secondary);">${suggestion}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="App.executeCommand('${cmd}')">${cmd}</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  }
};
