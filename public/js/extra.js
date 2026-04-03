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

  // --- /稟議書出力 コマンド：銀行稟議書フォーマット印刷 ---
  printRingiFormat() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const fs = data.financials || [];
    const mr = Database.loadMatrixResult();
    const docs = Database.load('lce_saved_docs') || [];

    if (!data.companyName || !rr) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '企業DNAと格付け診断が完了していません。稟議書を作成するには最低限これらのデータが必要です。'));
      return;
    }

    const today = new Date().toLocaleDateString('ja-JP');
    
    // AI作成資料から強みなどを抽出（あれば）
    let salesPoints = '登録なし';
    const strengthDoc = docs.find(d => d.type === 'エグゼクティブサマリー' || d.type === '企業概要書');
    if (strengthDoc) {
      salesPoints = (strengthDoc.content || '').substring(0, 300) + '...';
    }

    let printHtml = `<!DOCTYPE html><html lang="ja"><head>
      <meta charset="UTF-8">
      <title>【融資稟議書】${data.companyName}</title>
      <style>
        @page { size: A4 landscape; margin: 15mm; }
        body { font-family: 'Yu Mincho', 'MS Mincho', serif; color: #000; font-size: 11px; line-height: 1.5; margin: 0; padding: 0; }
        .sheet { width: 100%; height: 100%; box-sizing: border-box; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        .title { font-size: 20px; font-weight: bold; letter-spacing: 4px; text-align: center; flex: 1; }
        .meta { font-size: 10px; text-align: right; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .section-title { font-size: 13px; font-weight: bold; background: #eee; padding: 4px 8px; border: 1px solid #333; margin: 10px 0 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
        th, td { border: 1px solid #333; padding: 4px; }
        th { background: #f9f9f9; text-align: center; font-weight: normal; }
        .text-box { border: 1px solid #333; padding: 8px; min-height: 60px; white-space: pre-wrap; font-size: 10px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
    </head><body>
      <div class="sheet">
        <div class="header">
          <div style="width:100px;"></div>
          <div class="title">融　資　稟　議　書</div>
          <div class="meta">
            起案日: ${today}<br>
            起案者: 営業担当
          </div>
        </div>

        <div class="grid">
          <!-- 左カラム -->
          <div>
            <div class="section-title">1. 企業概要</div>
            <table>
              <tr><th style="width:25%">会社名</th><td colspan="3">${data.companyName || '未設定'}</td></tr>
              <tr><th>業種</th><td>${data.industry || '未設定'}</td><th>設立</th><td>${data.establishedMonth || '－'}</td></tr>
              <tr><th>代表者</th><td colspan="3">${data.repName || '未設定'}</td></tr>
            </table>

            <div class="section-title">2. 今回の申出内容</div>
            <table>
              <tr><th style="width:25%">資金使途</th><td colspan="3">${data.loanPurpose || '運転資金'}</td></tr>
              <tr><th>希望金額</th><td class="text-right">${Utils.formatMan(data.loanAmount || 0)}</td><th>期間</th><td class="text-right">${data.loanTerm || 5}年</td></tr>
              <tr><th>希望調達先</th><td colspan="3">プロパー / 保証協会付 / 公庫資金 等</td></tr>
              <tr><th>保全(担保)</th><td colspan="3">不動産担保: 無 / 経営者保証: 有</td></tr>
            </table>

            <div class="section-title">3. 定量評価・格付け実績</div>
            <table>
              <tr><th style="width:25%">債務者格付</th><td class="text-center" style="font-size:14px;font-weight:bold;">${rr.grade || '－'} (${rr.rank || '－'})</td><th>総合評点</th><td class="text-right">${rr.quant?.total || 0}点</td></tr>
              <tr><th>実態純資産</th><td class="text-right">${Utils.formatMan(rr.realBS?.bookNA || 0)}</td><th>自己資本比率</th><td class="text-right">${((rr.realBS?.bookNA || 0)/(fs[0]?.totalAssets || 1)*100).toFixed(1)}%</td></tr>
              <tr><th>債務償還年数</th><td class="text-right">${rr.quant?.categories?.safety?.items?.[3]?.value?.toFixed(1) || '0.0'}年</td><th>EBITDA</th><td class="text-right">${Utils.formatMan((fs[0]?.ordProfit||0) + (fs[0]?.interestExp||0) + (fs[0]?.deprecTotal||0))}</td></tr>
            </table>
          </div>

          <!-- 右カラム -->
          <div>
            <div class="section-title">4. 財務状況推移（単位：千円）</div>
            <table>
              <tr>
                <th>科目</th>
                <th>${fs[2] ? '前々期' : '－'}</th>
                <th>${fs[1] ? '前期' : '－'}</th>
                <th style="font-weight:bold;">${fs[0] ? '直近期' : '－'}</th>
              </tr>
              <tr>
                <td class="text-center">売上高</td>
                <td class="text-right">${(fs[2]?.revenue||0).toLocaleString()}</td>
                <td class="text-right">${(fs[1]?.revenue||0).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${(fs[0]?.revenue||(data.annualRevenue||0)).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">営業利益</td>
                <td class="text-right">${(fs[2]?.opProfit||0).toLocaleString()}</td>
                <td class="text-right">${(fs[1]?.opProfit||0).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${(fs[0]?.opProfit||(data.operatingProfit||0)).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">経常利益</td>
                <td class="text-right">${(fs[2]?.ordProfit||0).toLocaleString()}</td>
                <td class="text-right">${(fs[1]?.ordProfit||0).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${(fs[0]?.ordProfit||0).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">当期純利益</td>
                <td class="text-right">${(fs[2]?.netProfit||0).toLocaleString()}</td>
                <td class="text-right">${(fs[1]?.netProfit||0).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${(fs[0]?.netProfit||0).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">総資産</td>
                <td class="text-right">${(fs[2]?.totalAssets||0).toLocaleString()}</td>
                <td class="text-right">${(fs[1]?.totalAssets||0).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${(fs[0]?.totalAssets||0).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">純資産</td>
                <td class="text-right">${(fs[2]?.netAssets||0).toLocaleString()}</td>
                <td class="text-right">${(fs[1]?.netAssets||0).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${(fs[0]?.netAssets||0).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="text-center">有利子負債</td>
                <td class="text-right">${((fs[2]?.shortDebt||0)+(fs[2]?.longDebt||0)).toLocaleString()}</td>
                <td class="text-right">${((fs[1]?.shortDebt||0)+(fs[1]?.longDebt||0)).toLocaleString()}</td>
                <td class="text-right" style="font-weight:bold;">${((fs[0]?.shortDebt||0)+(fs[0]?.longDebt||0)||(data.totalDebt||0)).toLocaleString()}</td>
              </tr>
            </table>

            <div class="section-title">5. 企業実態・セールスポイント</div>
            <div class="text-box">${Utils.escapeHtml(salesPoints)}</div>

            <div class="section-title">6. 総合所見・結論</div>
            <div class="text-box">案件スコアリング結果: ${mr ? mr.score + '点 (' + mr.rank + ')' : '未判定'}
総合判定: 
${mr?.advice ? mr.advice.replace(/<[^>]+>/g, '') : '財務バランスおよび事業の将来性を鑑み、本件申出の通り進めてよろしいか伺います。'}</div>
          </div>
        </div>

        <div style="font-size:8px; color:#666; text-align:right; margin-top:20px;">
          Created by LOAN CRAFT ENGINE v5.0
        </div>
      </div>
    </body></html>`;

    // 印刷ウィンドウを開く
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    // 画像やフォントの読み込みを待つため少し遅延して印刷
    setTimeout(() => {
      printWindow.print();
    }, 500);

    App.addSystemMessage(Utils.createAlert('success', '📑', '稟議書フォーマットの印刷画面を開きました。<br>（用紙の向きを「横（Landscape）」に設定して印刷またはPDF保存してください）'));
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
  },

  // --- /ベンチマーク コマンド：業界平均との比較分析 ---
  showBenchmark() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const fs = data.financials?.[0] || {};
    
    if (!data.industry || !rr) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '業種の登録と格付け診断が完了していません。先に /DNA で業種を登録し、/診断 を実行してください。'));
      return;
    }

    // 簡易的な業界平均データ設定 (TKCや中小企業庁の目安)
    const indAverages = {
      '飲食・小売': { equity: 15, opMargin: 3.5, currentRatio: 120, repayYrs: 12 },
      'IT・サービス': { equity: 45, opMargin: 12.0, currentRatio: 200, repayYrs: 5 },
      '建設': { equity: 30, opMargin: 5.0, currentRatio: 150, repayYrs: 8 },
      '製造・卸': { equity: 35, opMargin: 4.5, currentRatio: 140, repayYrs: 10 },
      '不動産': { equity: 20, opMargin: 15.0, currentRatio: 100, repayYrs: 15 },
      '医療・福祉': { equity: 40, opMargin: 8.0, currentRatio: 180, repayYrs: 10 },
      '農業・林業': { equity: 25, opMargin: 10.0, currentRatio: 110, repayYrs: 15 },
      'スタートアップ': { equity: 50, opMargin: -5.0, currentRatio: 250, repayYrs: 99 },
      'その他・不明': { equity: 30, opMargin: 5.0, currentRatio: 150, repayYrs: 10 }
    };

    const avg = indAverages[data.industry] || indAverages['その他・不明'];

    // 実数値の計算（rr.quantから抽出）
    const cats = rr.quant.categories;
    const scores = {
      equity: cats.safety?.items?.find(i => i.label==='自己資本比率')?.value || 0,
      opMargin: cats.profitability?.items?.find(i => i.label==='売上高経常利益率')?.value || 0, // 便宜上代表で経常を採用
      currentRatio: cats.safety?.items?.find(i => i.label==='流動比率')?.value || 0,
      repayYrs: cats.safety?.items?.find(i => i.label==='債務償還年数')?.value || 0
    };

    // 自己資本比率は実態BSがあればそちらを優先
    if (rr.realBS && rr.realBS.bookNA !== undefined && fs.totalAssets) {
        scores.equity = (rr.realBS.bookNA / fs.totalAssets) * 100;
    }

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title" style="color:var(--accent-primary);">📊 業界平均（ベンチマーク）自動比較</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        銀行審査（特に信用保証協会など）で重視される同業種平均「TKC全国平均等」との乖離を診断します。<br>
        平均より劣っている指標は面談で必ず理由を聞かれます。
      </p>

      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">🏢 対象業種: ${data.industry}</div>

      <table class="fs-table" style="width:100%;font-size:12px;margin-bottom:20px;">
        <thead style="background:var(--bg-secondary);">
          <tr>
            <th style="padding:10px;text-align:left;">重要指標</th>
            <th style="padding:10px;text-align:right;">業界標準平均</th>
            <th style="padding:10px;text-align:right;">貴社の実態値</th>
            <th style="padding:10px;text-align:center;">判定</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px;font-weight:700;">自己資本比率</td>
            <td style="padding:10px;text-align:right;">${avg.equity}% 以上</td>
            <td style="padding:10px;text-align:right;">${scores.equity.toFixed(1)}%</td>
            <td style="padding:10px;text-align:center;">${scores.equity >= avg.equity ? '<span style="color:var(--accent-green)">✅ 優位</span>' : '<span style="color:var(--accent-red)">⚠️ 劣後</span>'}</td>
          </tr>
          <tr style="background:rgba(255,255,255,0.02);">
            <td style="padding:10px;font-weight:700;">流動比率（短期安全性）</td>
            <td style="padding:10px;text-align:right;">${avg.currentRatio}% 以上</td>
            <td style="padding:10px;text-align:right;">${scores.currentRatio.toFixed(1)}%</td>
            <td style="padding:10px;text-align:center;">${scores.currentRatio >= avg.currentRatio ? '<span style="color:var(--accent-green)">✅ 優位</span>' : '<span style="color:var(--accent-red)">⚠️ 劣後</span>'}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:700;">売上高利益率（収益性）</td>
            <td style="padding:10px;text-align:right;">${avg.opMargin}% 以上</td>
            <td style="padding:10px;text-align:right;">${scores.opMargin.toFixed(1)}%</td>
            <td style="padding:10px;text-align:center;">${scores.opMargin >= avg.opMargin ? '<span style="color:var(--accent-green)">✅ 優位</span>' : '<span style="color:var(--accent-red)">⚠️ 劣後</span>'}</td>
          </tr>
          <tr style="background:rgba(255,255,255,0.02);">
            <td style="padding:10px;font-weight:700;">債務償還年数</td>
            <td style="padding:10px;text-align:right;">${avg.repayYrs}年 以内</td>
            <td style="padding:10px;text-align:right;">${scores.repayYrs.toFixed(1)}年</td>
            <td style="padding:10px;text-align:center;">${scores.repayYrs <= avg.repayYrs ? '<span style="color:var(--accent-green)">✅ 優位</span>' : '<span style="color:var(--accent-red)">⚠️ 劣後</span>'}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-primary" onclick="Extra.aiBenchmarkAdvice()" style="width:100%;max-width:400px;">
          🤖 弱点の「AI説明トークスクリプト」を生成
        </button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // AIベンチマーク改善アドバイス
  async aiBenchmarkAdvice() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    
    if (!data.industry || !rr) return App.addSystemMessage(Utils.createAlert('warning', '⚠️', '先に /DNA および /診断 を実行してください。'));

    App.addSystemMessage(Utils.createAlert('info', '🤖', '業界平均と比較し、銀行面談での「最適な言い訳（説明シナリオ）」を生成中...'));
    const fs = data.financials?.[0] || {};
    const indAverages = {
      '飲食・小売': { equity: 15, opMargin: 3.5, currentRatio: 120, repayYrs: 12 },
      'IT・サービス': { equity: 45, opMargin: 12.0, currentRatio: 200, repayYrs: 5 },
      '建設': { equity: 30, opMargin: 5.0, currentRatio: 150, repayYrs: 8 },
      '製造・卸': { equity: 35, opMargin: 4.5, currentRatio: 140, repayYrs: 10 },
      '不動産': { equity: 20, opMargin: 15.0, currentRatio: 100, repayYrs: 15 },
      '医療・福祉': { equity: 40, opMargin: 8.0, currentRatio: 180, repayYrs: 10 },
      '農業・林業': { equity: 25, opMargin: 10.0, currentRatio: 110, repayYrs: 15 },
      'スタートアップ': { equity: 50, opMargin: -5.0, currentRatio: 250, repayYrs: 99 },
      'その他・不明': { equity: 30, opMargin: 5.0, currentRatio: 150, repayYrs: 10 }
    };
    const avg = indAverages[data.industry] || indAverages['その他・不明'];

    const systemPrompt = `あなたは銀行融資のプロです。企業の財務指標が業界平均を下回っている場合、銀行員から「なぜ他社より悪いのか」と突っ込まれます。
これに対して、面談でマイナス評価を避けるための「前向きで説得力のある説明（トークスクリプト）」を作成してください。
言い訳がましくならず、「意図的な投資である」「一時的な要因である」「実は〇〇という強みがあるから問題ない」といった実務的なロジックを提示してください。`;

    const userPrompt = `
以下の企業データと業界標準を比較し、劣っている指標について、銀行員への上手な説明トークスクリプトを作ってください。

【業種】${data.industry}
【業界平均（標準）】
- 自己資本比率: ${avg.equity}%
- 利益率: ${avg.opMargin}%
- 債務償還年数: ${avg.repayYrs}年

【この企業の実態】
- 自己資本比率: ${(rr.realBS?.bookNA/fs.totalAssets*100).toFixed(1)}%
- 利益率: ${((fs.ordProfit/fs.revenue)*100).toFixed(1)}%
- 債務償還年数: ${rr.quant.categories.safety?.items?.find(i=>i.label==='債務償還年数')?.value.toFixed(1)}年

解説の形式：
## 💡 銀行面談 想定問答スクリプト
### 劣後している指標1：〇〇について
👨‍💼 銀行員：「御社は同業他社と比べて〇〇が低いですが、どうしてですか？」
👤 経営者回答例：「〜〜〜〜」
💡 解説：（なぜこの回答が銀行員に刺さるのかの解説）`;

    try {
      const content = await this._callAI(systemPrompt, userPrompt);
      if(!content) { return App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'APIキーが設定されていません。')); }
      App.addSystemMessage(`<div class="glass-card highlight">
        <div style="font-size:13px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${Utils.escapeHtml(content)}</div>
      </div>`);
    } catch(e) { App.addSystemMessage(Utils.createAlert('error', '❌', e.message)); }
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

  // AI整合性チェック
  async aiConsistencyCheck() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const docs = Database.load('lce_saved_docs') || [];

    if (docs.length === 0 && !rr) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '先にDNA登録と資料生成を行ってください。'));
      return;
    }

    App.addSystemMessage(Utils.createAlert('info', '🤖', 'AIが資料間の整合性をチェック中...'));

    const docSummaries = docs.slice(0, 5).map(d => `【${d.type || '不明'}】${(d.content || '').substring(0, 300)}`).join('\n---\n');

    const systemPrompt = 'あなたは銀行審査書類の専門家です。提出資料間の整合性をチェックし、矛盾や不整合があれば指摘してください。日本語で回答してください。';
    const userPrompt = `以下の企業情報と作成済み資料の整合性をチェックしてください。

【企業DNA情報】
会社名: ${data.companyName || '未登録'}
業種: ${data.industry || '不明'}
年商: ${data.annualRevenue || '不明'}万円
従業員数: ${data.employees || '不明'}名
借入希望額: ${data.loanAmount || '不明'}万円
格付け: ${rr ? rr.rank : '未診断'}

【作成済み資料（一部抜粋）】
${docSummaries || 'なし'}

以下の形式で回答してください：
## ✅ AI整合性チェック結果

### チェック結果サマリー
全体の整合性評価（A/B/C）

### ⚠️ 不整合・矛盾の指摘
具体的な矛盾箇所と修正案

### 📝 追加が必要な情報
記載が不足している項目

### 💡 提出前の改善ポイント
3つの最終確認事項`;

    try {
      const content = await this._callAI(systemPrompt, userPrompt);
      if (!content) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'APIキーが未設定です。')); return; }
      App.addSystemMessage(`<div class="glass-card highlight">
        <div class="report-title">✅ AI整合性チェック結果</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${Utils.escapeHtml(content)}</div>
      </div>`);
    } catch(e) { App.addSystemMessage(Utils.createAlert('error', '❌', 'AIチェックエラー: ' + e.message)); }
  },


  // AI提出前チェック
  async aiPreSubmitCheck() {
    const data = Database.loadCompanyData() || {};
    const rr = Database.loadRatingResult();
    const docs = Database.load('lce_saved_docs') || [];

    App.addSystemMessage(Utils.createAlert('info', '🤖', 'AIが提出書類を最終チェック中...'));
    const systemPrompt = 'あなたは銀行融資審査の専門家です。提出前の書類を最終チェックし、合格率を上げるための改善点を指摘してください。日本語で回答してください。';
    const userPrompt = `以下の情報から融資申込の最終チェックを行ってください。

【企業】${data.companyName || '未登録'} / ${data.industry || '不明'} / 年商${data.annualRevenue || '不明'}万円
【格付け】${rr ? rr.rank + ' (' + rr.score + '点)' : '未診断'}
【作成済み資料数】${docs.length}件
【希望借入】${data.loanAmount || '不明'}万円 / 使途: ${data.loanPurpose || '不明'}

以下の形式で：
## 📋 AI提出前最終チェック

### 総合判定: [◎/○/△/✕]
一言での評価

### ✅ 準備OK項目
問題ない項目のリスト

### ⚠️ 要改善項目
修正すべき点（優先度順）

### 📝 不足書類の指摘
追加で必要な書類

### 💡 合格率を上げるヒント
3つの最終アドバイス`;

    try {
      const content = await this._callAI(systemPrompt, userPrompt);
      if (!content) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'APIキーが未設定です。')); return; }
      App.addSystemMessage(`<div class="glass-card highlight">
        <div class="report-title">📋 AI提出前最終チェック</div>
        <div style="font-size:13px;line-height:1.8;color:var(--text-primary);white-space:pre-wrap;">${Utils.escapeHtml(content)}</div>
      </div>`);
    } catch(e) { App.addSystemMessage(Utils.createAlert('error', '❌', e.message)); }
  },
};
