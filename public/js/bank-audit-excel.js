/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - Excel読込モジュール
 * 決算書Excelファイルを読込んでPL/BS/CFフォームに自動マッピング
 * 依存: SheetJS (xlsx) CDN
 * ============================================================ */

Object.assign(BankAudit, {

  // Excel読込UI表示
  showExcelImport() {
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📁 Excel決算書読込</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        決算書のExcelファイル（.xlsx / .xls / .csv）をアップロードすると、PL・BS・CFのフォームに自動入力します。
      </p>

      <div style="border:2px dashed var(--border-secondary);border-radius:12px;padding:32px;text-align:center;margin-bottom:16px;cursor:pointer;transition:all 0.3s;" id="excel_dropzone"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent-primary)';this.style.background='rgba(108,99,255,0.06)'"
        ondragleave="this.style.borderColor='var(--border-secondary)';this.style.background='transparent'"
        ondrop="event.preventDefault();BankAudit.handleExcelDrop(event)"
        onclick="document.getElementById('excel_file').click()">
        <div style="font-size:32px;margin-bottom:8px;">📊</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">ここにExcelファイルをドロップ</div>
        <div style="font-size:11px;color:var(--text-muted);">またはクリックしてファイルを選択</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:8px;">対応形式: .xlsx / .xls / .csv</div>
        <input type="file" id="excel_file" accept=".xlsx,.xls,.csv" style="display:none" onchange="BankAudit.handleExcelFile(event)">
      </div>

      <div id="excel_preview" style="display:none;"></div>

      <div class="report-subtitle">📌 マッピングルール</div>
      <div style="font-size:11px;color:var(--text-secondary);line-height:1.8;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div>
            <strong>自動認識される勘定科目：</strong><br>
            売上高、売上原価、売上総利益、販管費、<br>
            営業利益、経常利益、当期純利益、<br>
            減価償却費、支払利息、受取利息 等
          </div>
          <div>
            <strong>BS項目：</strong><br>
            現預金、売掛金、受取手形、棚卸資産、<br>
            固定資産、借入金、買掛金、支払手形、<br>
            資本金、純資産 等
          </div>
        </div>
      </div>

      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="BankAudit.downloadTemplate()">📥 テンプレートExcel</button>
        <button class="btn btn-secondary" onclick="BankAudit.showOCRImport()">✏️ 手動入力に切替</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // ドラッグ&ドロップ処理
  handleExcelDrop(event) {
    const file = event.dataTransfer?.files?.[0];
    if (file) this._processExcelFile(file);
  },

  // ファイル選択処理
  handleExcelFile(event) {
    const file = event.target?.files?.[0];
    if (file) this._processExcelFile(file);
  },

  // Excelファイル解析
  _processExcelFile(file) {
    if (typeof XLSX === 'undefined') {
      App.addSystemMessage(Utils.createAlert('error', '❌', 'SheetJSライブラリが読み込まれていません。ページをリロードしてください。'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // シート一覧取得
        const sheetNames = workbook.SheetNames;
        App.addSystemMessage(`<div class="glass-card" style="max-width:960px;margin:0 auto;">
          <div class="report-title">📊 ${file.name} を読込みました</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
            シート数: ${sheetNames.length} ｜ ファイルサイズ: ${(file.size/1024).toFixed(1)} KB
          </div>
          <div class="report-subtitle">シート選択</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
            ${sheetNames.map((n, i) => `<button class="btn ${i===0?'btn-primary':'btn-secondary'} btn-sm" onclick="BankAudit._parseSheet('${n.replace(/'/g,"\\'")}',${i})">${n}</button>`).join('')}
          </div>
          <div id="excel_sheet_content"></div>
        </div>`);

        // 最初のシートを自動解析しようとする
        this._workbook = workbook;
        this._parseSheet(sheetNames[0], 0);

      } catch (err) {
        App.addSystemMessage(Utils.createAlert('error', '❌', 'Excelの読込に失敗しました: ' + err.message));
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // シート解析
  _parseSheet(sheetName, index) {
    const ws = this._workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (!jsonData || jsonData.length === 0) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'シートにデータがありません。'));
      return;
    }

    // プレビューテーブル（最大20行）
    const previewRows = jsonData.slice(0, 20);
    let previewHtml = `<div class="report-subtitle">📋 シート「${sheetName}」プレビュー（最大20行）</div>
    <div style="overflow-x:auto;margin-bottom:16px;">
      <table style="width:100%;font-size:11px;border-collapse:collapse;">`;
    previewRows.forEach((row, ri) => {
      previewHtml += `<tr style="border-bottom:1px solid var(--border-secondary);${ri===0?'font-weight:700;background:rgba(108,99,255,0.06);':''}">`;
      row.forEach(cell => {
        previewHtml += `<td style="padding:4px 6px;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;">${cell}</td>`;
      });
      previewHtml += `</tr>`;
    });
    previewHtml += `</table></div>`;

    // 自動マッピング実行
    const mapped = this._autoMapAccounts(jsonData);

    previewHtml += `<div class="report-subtitle">🔄 自動マッピング結果（${mapped.matchCount}/${mapped.totalKeys}項目一致）</div>`;
    if (mapped.matchCount > 0) {
      previewHtml += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">`;
      Object.entries(mapped.values).forEach(([key, info]) => {
        if (info.value !== null) {
          previewHtml += `<div style="padding:6px;background:rgba(76,175,80,0.08);border-radius:6px;font-size:11px;">
            <span style="color:var(--text-muted);">${info.label}</span><br>
            <strong>${Number(info.value).toLocaleString()}</strong>
            <span style="font-size:9px;color:var(--text-muted);"> ← ${info.source}</span>
          </div>`;
        }
      });
      previewHtml += `</div>`;
    }
    previewHtml += `<div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="BankAudit._applyExcelData()">✅ フォームに反映</button>
      <button class="btn btn-secondary" onclick="BankAudit.showExcelImport()">🔄 別ファイルを読込</button>
    </div>`;

    const el = document.getElementById('excel_sheet_content');
    if (el) el.innerHTML = previewHtml;
    else App.addSystemMessage(previewHtml);

    this._mappedData = mapped;
  },

  // 勘定科目の自動マッピング辞書
  _accountMap: {
    // PL項目
    revenue:        { label: '売上高', keywords: ['売上高','売上','revenue','sales','うりあげ'] },
    cogs:           { label: '売上原価', keywords: ['売上原価','原価','cost of','cogs','仕入'] },
    grossProfit:    { label: '売上総利益', keywords: ['売上総利益','粗利','gross profit'] },
    laborCost:      { label: '労務費（原価内）', keywords: ['労務費','原価人件費'] },
    deprecCost:     { label: '減価償却費（原価内）', keywords: ['原価償却','原価減価'] },
    sgaExp:         { label: '販管費合計', keywords: ['販売費及び一般管理費','販管費','管理費','SGA','sg&a'] },
    sgaLabor:       { label: '販管費・人件費', keywords: ['人件費','給料','給与','役員報酬'] },
    sgaDeprec:      { label: '販管費・減価償却', keywords: ['販管費減価','管理減価'] },
    opProfit:       { label: '営業利益', keywords: ['営業利益','operating profit','営業損益'] },
    nonOpIncome:    { label: '営業外収益', keywords: ['営業外収益','営業外収入'] },
    nonOpExp:       { label: '営業外費用', keywords: ['営業外費用'] },
    interestExp:    { label: '支払利息', keywords: ['支払利息','利息','借入利息','interest expense'] },
    interestIncome: { label: '受取利息', keywords: ['受取利息','interest income'] },
    ordProfit:      { label: '経常利益', keywords: ['経常利益','ordinary profit','経常損益'] },
    specialProfit:  { label: '特別利益', keywords: ['特別利益'] },
    specialLoss:    { label: '特別損失', keywords: ['特別損失'] },
    preTaxProfit:   { label: '税引前当期純利益', keywords: ['税引前','税前','pretax','pre-tax'] },
    netProfit:      { label: '当期純利益', keywords: ['当期純利益','純利益','net income','net profit','当期利益'] },
    deprecTotal:    { label: '減価償却費合計', keywords: ['減価償却費','depreciation','償却費'] },
    // BS資産
    cash:            { label: '現預金', keywords: ['現金及び預金','現預金','現金','預金','cash'] },
    notesRec:        { label: '受取手形', keywords: ['受取手形','notes receivable'] },
    accountsRec:     { label: '売掛金', keywords: ['売掛金','accounts receivable','未収'] },
    inventory:       { label: '棚卸資産', keywords: ['棚卸資産','在庫','商品','製品','仕掛品','inventory'] },
    otherCA:         { label: 'その他流動資産', keywords: ['その他流動','前払費用','短期貸付'] },
    currentAssets:   { label: '流動資産合計', keywords: ['流動資産合計','流動資産計','current assets'] },
    tangibleFA:      { label: '有形固定資産', keywords: ['有形固定資産','建物','土地','機械','tangible'] },
    intangibleFA:    { label: '無形固定資産', keywords: ['無形固定資産','ソフトウェア','のれん','intangible'] },
    investFA:        { label: '投資その他', keywords: ['投資その他','投資有価証券','関係会社'] },
    fixedAssets:     { label: '固定資産合計', keywords: ['固定資産合計','固定資産計','fixed assets'] },
    deferredAssets:  { label: '繰延資産', keywords: ['繰延資産','創立費','開業費','deferred'] },
    totalAssets:     { label: '資産合計', keywords: ['資産合計','資産の部合計','total assets','総資産'] },
    // BS負債
    notesPay:        { label: '支払手形', keywords: ['支払手形','notes payable'] },
    accountsPay:     { label: '買掛金', keywords: ['買掛金','accounts payable','未払'] },
    shortDebt:       { label: '短期借入金', keywords: ['短期借入金','short-term'] },
    otherCL:         { label: 'その他流動負債', keywords: ['その他流動負債','未払法人税','前受'] },
    currentLiab:     { label: '流動負債合計', keywords: ['流動負債合計','流動負債計','current liabilities'] },
    longDebt:        { label: '長期借入金', keywords: ['長期借入金','long-term'] },
    bonds:           { label: '社債', keywords: ['社債','bonds'] },
    otherFL:         { label: 'その他固定負債', keywords: ['その他固定負債','退職給付','引当金'] },
    fixedLiab:       { label: '固定負債合計', keywords: ['固定負債合計','固定負債計'] },
    totalLiab:       { label: '負債合計', keywords: ['負債合計','負債の部合計','total liabilities'] },
    // BS純資産
    capital:           { label: '資本金', keywords: ['資本金','capital stock'] },
    capitalSurplus:    { label: '資本剰余金', keywords: ['資本剰余金','capital surplus'] },
    retainedEarnings:  { label: '利益剰余金', keywords: ['利益剰余金','retained earnings'] },
    netAssets:         { label: '純資産合計', keywords: ['純資産合計','純資産の部合計','純資産計','net assets','自己資本'] },
    // CF
    opCF:       { label: '営業CF', keywords: ['営業活動','営業CF','operating cf'] },
    investCF:   { label: '投資CF', keywords: ['投資活動','投資CF','investing cf'] },
    fcf:        { label: 'FCF', keywords: ['フリーキャッシュフロー','FCF','free cash'] },
    financeCF:  { label: '財務CF', keywords: ['財務活動','財務CF','financing cf'] },
    beginCash:  { label: '期首現金', keywords: ['期首','現金期首','beginning cash'] },
    endCash:    { label: '期末現金', keywords: ['期末','現金期末','ending cash'] }
  },

  // Excelデータから勘定科目を自動マッピング
  _autoMapAccounts(jsonData) {
    const result = {};
    const totalKeys = Object.keys(this._accountMap).length;
    let matchCount = 0;

    // 各科目を初期化
    Object.entries(this._accountMap).forEach(([key, info]) => {
      result[key] = { label: info.label, value: null, source: '' };
    });

    // 全行をスキャンしてマッピング
    jsonData.forEach((row, rowIdx) => {
      if (!row || row.length < 2) return;
      row.forEach((cell, colIdx) => {
        if (typeof cell !== 'string' || !cell.trim()) return;
        const cellText = cell.trim().replace(/[\s　]/g, '');

        // 各勘定科目のキーワードとマッチング
        Object.entries(this._accountMap).forEach(([key, info]) => {
          if (result[key].value !== null) return; // 既にマッチ済み
          const matched = info.keywords.some(kw => {
            const kwNorm = kw.replace(/[\s　]/g, '');
            return cellText.includes(kwNorm) || kwNorm.includes(cellText);
          });
          if (matched) {
            // 同じ行の数値列を探す
            for (let c = colIdx + 1; c < row.length; c++) {
              const numVal = this._parseNumber(row[c]);
              if (numVal !== null) {
                result[key] = { label: info.label, value: numVal, source: `行${rowIdx+1} "${cell}" → ${row[c]}` };
                matchCount++;
                return;
              }
            }
            // 数値列が右にない場合、左の列も探す
            for (let c = colIdx - 1; c >= 0; c--) {
              const numVal = this._parseNumber(row[c]);
              if (numVal !== null) {
                result[key] = { label: info.label, value: numVal, source: `行${rowIdx+1} "${cell}" → ${row[c]}` };
                matchCount++;
                return;
              }
            }
          }
        });
      });
    });

    return { values: result, matchCount, totalKeys };
  },

  // 数値パース（カンマ区切り・括弧マイナス・△対応）
  _parseNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    let s = String(val).trim();
    // △や▲をマイナスに変換
    if (s.startsWith('△') || s.startsWith('▲')) {
      s = '-' + s.substring(1);
    }
    // 括弧表記のマイナス (1,234) → -1234
    if (s.startsWith('(') && s.endsWith(')')) {
      s = '-' + s.slice(1, -1);
    }
    // カンマ除去
    s = s.replace(/,/g, '').replace(/　/g, '').replace(/\s/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  },

  // マッピングデータをフォームに適用
  _applyExcelData() {
    if (!this._mappedData) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'マッピングデータがありません。Excelファイルを読み込んでください。'));
      return;
    }

    const mapped = this._mappedData.values;
    const applied = {};

    // currentFSにデータ設定
    Object.entries(mapped).forEach(([key, info]) => {
      if (info.value !== null) {
        applied[key] = info.value;
      }
    });

    this.currentFS = { ...this.currentFS, ...applied };

    // DNA反映用にサマリ作成
    const summary = [];
    const plKeys = ['revenue','cogs','grossProfit','opProfit','ordProfit','netProfit','deprecTotal','interestExp'];
    const bsKeys = ['totalAssets','netAssets','cash','currentAssets','fixedAssets','shortDebt','longDebt','bonds'];

    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">✅ Excelデータ反映完了</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
        ${this._mappedData.matchCount}件のデータを反映しました。
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <div class="report-subtitle">📄 PL項目</div>`;
    plKeys.forEach(k => {
      const v = applied[k];
      if (v !== undefined) {
        html += `<div class="report-row"><span class="label">${this._accountMap[k]?.label||k}</span><span class="value">${Number(v).toLocaleString()}</span></div>`;
      }
    });
    html += `</div><div>
          <div class="report-subtitle">📄 BS項目</div>`;
    bsKeys.forEach(k => {
      const v = applied[k];
      if (v !== undefined) {
        html += `<div class="report-row"><span class="label">${this._accountMap[k]?.label||k}</span><span class="value">${Number(v).toLocaleString()}</span></div>`;
      }
    });
    html += `</div></div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="BankAudit.showCaseJudgment()">🏦 格付判定へ</button>
        <button class="btn btn-secondary" onclick="BankAudit.syncToDNA()">🧬 DNAに反映</button>
        <button class="btn btn-secondary" onclick="BankAudit.showOCRImport()">✏️ 手動で修正</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  // テンプレートExcelダウンロード
  downloadTemplate() {
    if (typeof XLSX === 'undefined') {
      App.addSystemMessage(Utils.createAlert('error', '❌', 'SheetJSが読み込まれていません。'));
      return;
    }

    // PL/BS/CFの3シートテンプレート作成
    const wb = XLSX.utils.book_new();

    // PLシート
    const plData = [
      ['勘定科目', '当期（千円）', '前期（千円）', '備考'],
      ['売上高', '', '', ''],
      ['売上原価', '', '', ''],
      ['　労務費', '', '', '原価内の人件費'],
      ['　減価償却費', '', '', '原価内の償却'],
      ['　その他原価', '', '', ''],
      ['売上総利益', '', '', '= 売上高 − 売上原価'],
      ['販売費及び一般管理費', '', '', ''],
      ['　人件費', '', '', ''],
      ['　減価償却費', '', '', '販管費内の償却'],
      ['営業利益', '', '', '= 売上総利益 − 販管費'],
      ['営業外収益', '', '', ''],
      ['　受取利息', '', '', ''],
      ['営業外費用', '', '', ''],
      ['　支払利息', '', '', ''],
      ['経常利益', '', '', '= 営業利益 + 営業外収益 − 営業外費用'],
      ['特別利益', '', '', ''],
      ['特別損失', '', '', ''],
      ['税引前当期純利益', '', '', ''],
      ['当期純利益', '', '', ''],
      ['', '', '', ''],
      ['減価償却費合計', '', '', '原価内 + 販管費内']
    ];
    const wspl = XLSX.utils.aoa_to_sheet(plData);
    wspl['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wspl, '損益計算書');

    // BSシート
    const bsData = [
      ['勘定科目', '金額（千円）', '備考'],
      ['【資産の部】', '', ''],
      ['現金及び預金', '', ''],
      ['受取手形', '', ''],
      ['売掛金', '', ''],
      ['棚卸資産', '', '商品・製品・仕掛品'],
      ['その他流動資産', '', ''],
      ['流動資産合計', '', ''],
      ['有形固定資産', '', '建物・土地・機械等'],
      ['無形固定資産', '', 'ソフトウェア等'],
      ['投資その他の資産', '', ''],
      ['固定資産合計', '', ''],
      ['繰延資産', '', ''],
      ['資産合計', '', ''],
      ['', '', ''],
      ['【負債の部】', '', ''],
      ['支払手形', '', ''],
      ['買掛金', '', ''],
      ['短期借入金', '', ''],
      ['その他流動負債', '', ''],
      ['流動負債合計', '', ''],
      ['長期借入金', '', ''],
      ['社債', '', ''],
      ['その他固定負債', '', '退職給付引当金等'],
      ['固定負債合計', '', ''],
      ['負債合計', '', ''],
      ['', '', ''],
      ['【純資産の部】', '', ''],
      ['資本金', '', ''],
      ['資本剰余金', '', ''],
      ['利益剰余金', '', ''],
      ['純資産合計', '', '']
    ];
    const wsbs = XLSX.utils.aoa_to_sheet(bsData);
    wsbs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsbs, '貸借対照表');

    // CFシート
    const cfData = [
      ['勘定科目', '金額（千円）', '備考'],
      ['営業活動によるキャッシュフロー', '', ''],
      ['投資活動によるキャッシュフロー', '', ''],
      ['フリーキャッシュフロー', '', '= 営業CF + 投資CF'],
      ['財務活動によるキャッシュフロー', '', ''],
      ['期首現金残高', '', ''],
      ['期末現金残高', '', '']
    ];
    const wscf = XLSX.utils.aoa_to_sheet(cfData);
    wscf['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wscf, 'CF計算書');

    // ダウンロード
    XLSX.writeFile(wb, '決算書テンプレート_LOAN_CRAFT_ENGINE.xlsx');
    App.addSystemMessage(Utils.createAlert('success', '📥', 'テンプレートExcelをダウンロードしました。'));
  }
});
