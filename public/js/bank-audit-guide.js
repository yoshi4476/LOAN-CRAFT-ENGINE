/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 融資審査ガイド & DNA-OCR連携
 * セミナー資料「不動産融資セミナー」準拠
 * ① 銀行融資審査ガイド（セミナー内容表示）
 * ② DNA登録時にOCR/Excel読込を自動起動
 * ③ 読込データを財務DNAに自動反映
 * ============================================================ */

// ========== ① 融資審査ガイド ==========
Object.assign(BankAudit, {

  showLoanGuide() {
    let html = `<div class="glass-card highlight" style="max-width:1000px;margin:0 auto;">
      <div class="report-title">📚 銀行融資審査ガイド</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        ★セミナー資料「不動産融資セミナー」（イーストキャピタル）に基づく銀行融資審査の完全ガイドです。
      </p>
      <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="BankAudit.showGuideTab('system')" style="background:var(--accent-primary);">🚀 システム活用ガイド</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('overview')">📋 全体像</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('debtor')">🏦 債務者判断</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('cf')">💰 CF判断</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('industry')">🏢 業種モード</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('case')">📊 案件判断</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('bank')">🏛 金融機関特性</button>
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('pj')">🏗 PJ資金</button>
      </div>
      <div id="guide_content">${this._guideSystem()}</div>
    </div>`;
    App.addSystemMessage(html);
  },

  showGuideTab(tab) {
    const el = document.getElementById('guide_content');
    if (!el) { this.showLoanGuide(); return; }
    const tabs = { system: this._guideSystem, overview: this._guideOverview, debtor: this._guideDebtor, cf: this._guideCF, industry: this._guideIndustry, case: this._guideCase, bank: this._guideBank, pj: this._guidePJ };
    el.innerHTML = (tabs[tab] || tabs.system).call(this);
  },

  // 0. システム活用ガイド（搭載機能全解説）
  _guideSystem() {
    return `
    <div class="report-subtitle" style="color:var(--accent-primary);">🚀 LOAN CRAFT ENGINE v5 搭載機能と活用フロー</div>
    
    <div class="glass-card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--accent-primary);">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">1️⃣ データ入力・基盤構築</div>
      <div style="font-size:11px;line-height:1.8;">
        <strong>【 /DNA 】または【 /Excel読込 】</strong><br>
        企業の基本情報と財務状況をシステムに記憶させます。決算書のExcelファイル（TFS形式や汎用フォーマット等）をドラッグ＆ドロップするだけで、数秒で売上・利益・資産・負債などの主要勘定科目を自動抽出し、DNAプロファイルとして保存します。<br>
        <strong>【 /決算取込 】</strong><br>
        手入力で決算データ（PL/BS/CF、最大2期比較）を入れたい場合に使用します。
      </div>
    </div>

    <div class="glass-card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--accent-green);">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">2️⃣ 銀行目線での自動審査・シミュレーション（一番重要）</div>
      <div style="font-size:11px;line-height:1.8;">
        <strong>【 /格付判定 】（債務者区分のシミュレーション）</strong><br>
        入力されたデータをもとに、10種類以上の銀行指標（債務償還年数、EBITDA倍率、DSCR、実質債務超過等）を瞬時に計算し、「正常先」か「要注意先」かを自動判定します。<br><br>
        <span style="color:var(--accent-primary);font-weight:700;">🏢 業種特化モード切替（/業種モード）</span><br>
        不動産、IT、飲食、建設など計8種類の業種モードを搭載。業種を指定することで、「償還年数」「重視される指標（手元流動性やEBITDA等）」など、銀行の審査目線が実態に合わせて適正化（緩和・厳格化）されます。<br><br>
        <span style="color:var(--accent-primary);font-weight:700;">✨ 融資最適化シミュレーター（目標逆算）</span><br>
        格付判定画面のシミュレーターボタンを押すと、<strong>「融資に通る（正常先になる）ためには、あといくら利益が必要か（または負債を減らせばいいか）」をシステムが自動で逆算</strong>します。「ワンクリック反映」ボタンで、逆算された見込み数値を判定画面に一瞬でセットできます。<br><br>
        <span style="color:var(--accent-gold);font-weight:700;">✏️ 財務数値の直接シミュレーション</span><br>
        格付判定画面上で、売上高や現預金、減価償却費などの10項目を直接書き換えて「判定を更新」ボタンを押すだけで、何度でも即座に格付の変化（What-If分析）を確認できます。
      </div>
    </div>

    <div class="glass-card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--accent-gold);">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">3️⃣ BSのクレンジング（実態修正）</div>
      <div style="font-size:11px;line-height:1.8;">
        <strong>【 /実態修正 】および【 /個人資産緩和 】</strong><br>
        決算書通りでは債務超過（要注意先）でも、実態を反映させれば正常先になり得ます。<br>
        回収不能な売掛金や不良在庫をマイナスし、反対に「社長個人の現預金」や「社長への借入金（役員借入金）の資本振替（DES）」をシステム上でぶつけることで、実質的なBSを綺麗（資産超過状態）にするシミュレーションが行えます。
      </div>
    </div>

    <div class="glass-card" style="padding:16px;margin-bottom:12px;border-left:4px solid var(--accent-cyan);">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">4️⃣ 融資申請用のアウトプット作成</div>
      <div style="font-size:11px;line-height:1.8;">
        <strong>【 /事業計画 】および【 /Excel出力 】</strong><br>
        ここまでのシミュレーションで設定した「目指すべき売上・利益」をベースに、10年分の事業計画書を自動生成します。「事業計画サマリー」「単体PL」「連結PL（グループ企業がある場合）」「設備投資計画」「借入金返済計画」などのシートに一発出力できます。<br><br>
        <strong>【 /シナリオ 】</strong><br>
        計画に対して想定される「楽観・基本・悲観」の3パターンのストレスシナリオを生成し、「売上が15%ダウンしても返済は回るか？」の証明材料（キャッシュフロー感度分析）を提示できます。<br><br>
        <strong>【 /案件判断 】</strong><br>
        設備資金や運転資金として、今回の「借入希望額」と設定した「返済期間」が、キャッシュフローに対して適正かどうかをジャッジします。
      </div>
    </div>

    <div class="glass-card" style="padding:16px;margin-bottom:12px;border-left:4px solid #9c27b0;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">5️⃣ 特殊機能・応用編</div>
      <div style="font-size:11px;line-height:1.8;">
        <strong>【 /連結決算 】（グループ企業合算）</strong><br>
        最大5社までの子会社・関連会社の決算データを合算します。売上高規模が小さい（5%未満等）会社を自動で切り捨てる機能も備えており、銀行と同じ目線でのグループ全体評価が可能です。<br><br>
        <strong>【 /AIコメント 】（稟議書ドラフト）</strong><br>
        最新の生成AI（OpenAI）と連携し、銀行の審査担当者がそのまま稟議書にコピペできるレベルの「プロフェッショナルな定性評価コメント（強み・懸念点・結論）」を自動生成します。
      </div>
    </div>
    `;
  },


  // 1. 全体像
  _guideOverview() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">1. 融資可否の判断フレームワーク</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div class="glass-card" style="padding:16px;border-left:4px solid var(--accent-gold);">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🟡 債務者判断</div>
        <div style="font-size:12px;line-height:1.8;">
          年に1度、決算書をベースに金融機関が<strong>債務者</strong>について分析・格付する。<br>
          → 「<strong>貸しても大丈夫か？</strong>」の判断<br>
          → BS・PL・CFから総合判定
        </div>
      </div>
      <div class="glass-card" style="padding:16px;border-left:4px solid var(--accent-cyan);">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🔵 案件判断</div>
        <div style="font-size:12px;line-height:1.8;">
          直近の試算表などをベースに、案件ごとに判断。<br>
          → 「<strong>この融資案件は妥当か？</strong>」の判断<br>
          → 運転資金・設備資金・PJ資金
        </div>
      </div>
    </div>

    <div class="report-subtitle" style="color:var(--accent-cyan);">2. 債務者5区分</div>
    <div style="overflow-x:auto;">
      <table style="width:100%;font-size:12px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">区分</th><th style="text-align:left;">判定基準</th><th style="text-align:center;">引当率</th>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;color:var(--accent-green);font-weight:700;">✅ 正常先</td>
          <td style="padding:6px;">資産超過 且つ 黒字 且つ 債務償還年数基準値内</td>
          <td style="padding:6px;text-align:center;">0.2〜0.5%</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;color:var(--accent-gold);font-weight:700;">⚠️ 要注意先</td>
          <td style="padding:6px;">資産超過且つ債務償還年数基準値超<br>※ 要管理先: 3ヶ月以上延滞有、リスケジュール実施</td>
          <td style="padding:6px;text-align:center;">5〜15%</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;color:var(--accent-red);font-weight:700;">⛔ 破綻懸念先</td>
          <td style="padding:6px;">債務超過 (2年以内に解消不可)、もしくは債務償還年数基準値超</td>
          <td style="padding:6px;text-align:center;">30〜75%</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;color:var(--accent-red);font-weight:700;">💀 実質破綻先</td>
          <td style="padding:6px;">金融機関がサービサーに債権譲渡等 (法的に破綻していない)</td>
          <td style="padding:6px;text-align:center;">100%</td>
        </tr>
        <tr>
          <td style="padding:6px;color:var(--accent-red);font-weight:700;">☠️ 破綻先</td>
          <td style="padding:6px;">法的に破綻、清算、会社更生等</td>
          <td style="padding:6px;text-align:center;">100%</td>
        </tr>
      </table>
    </div>
    <div style="margin-top:12px;padding:10px;background:rgba(255,193,7,0.06);border-radius:6px;font-size:11px;color:var(--text-secondary);border-left:3px solid var(--accent-gold);">
      ※ <strong>ランクアップトリガー</strong>: GR企業の合算、代表者個人資産の合算、一過性赤字の考慮 等
    </div>`;
  },

  // 2. 債務者判断（BS・PL）
  _guideDebtor() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">2. 債務者判断（BS・PL）</div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">📊 BS（貸借対照表）の見方</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="padding:12px;background:rgba(76,175,80,0.06);border-radius:8px;">
          <div style="font-size:11px;font-weight:600;color:var(--accent-green);">資産の部</div>
          <div style="font-size:11px;line-height:1.8;margin-top:4px;">
            <strong>流動資産</strong>: 1yearルールに基づき、1年以内に現金化する資産<br>
            <strong>固定資産</strong>: 1year超、現金化に1年超の期間を要する資産<br>
            <strong>繰延資産</strong>: 固定化している流動資産は固定資産へ振替処理
          </div>
        </div>
        <div style="padding:12px;background:rgba(244,67,54,0.06);border-radius:8px;">
          <div style="font-size:11px;font-weight:600;color:var(--accent-red);">負債・純資産の部</div>
          <div style="font-size:11px;line-height:1.8;margin-top:4px;">
            <strong>流動負債</strong>: 1年以内に支払いする負債<br>
            <strong>固定負債</strong>: 支払いまでに1年超かかる負債<br>
            <strong>純資産</strong>: 自己資本（返済不要の部分）
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">📄 PL（損益計算書）の見方 — 銀行は2〜3期分を確認</div>
      <div style="font-size:11px;line-height:1.8;">
        銀行は<strong>PLを2期以上</strong>見ます。トレンド（増収増益/減収減益）が重要。<br><br>
        <strong>着目ポイント:</strong><br>
        ① 売上原価の内訳: 原材料費 / 労務費 / 減価償却費<br>
        ② 販管費の内訳: 人件費 / 減価償却費<br>
        ③ 営業利益 → 本業の収益力<br>
        ④ 経常利益 → 金融収支を含めた収益力<br>
        ⑤ 一過性損益の除外: 特別利益/損失は除外して判断
      </div>
    </div>

    <div class="glass-card" style="padding:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">💡 債務償還年数の計算（★最重要指標）</div>
      <div style="padding:12px;background:rgba(108,99,255,0.06);border-radius:8px;font-size:12px;font-family:monospace;line-height:2;">
        <strong>債務償還年数</strong> = (有利子負債 − 現預金) ÷ (営業利益 + 減価償却 − 法人税等)<br><br>
        ※ 償還年数を計算する分母のCFは、金融機関により定義が異なる<br>
        ※ 10年以内が「正常先」の目安（製造業・卸売業等）<br><br>
        <span style="color:var(--accent-gold);">★ 償還年数基準値オーバー → 軽微な水準であれば、調達余力と案件次第で検討可</span>
      </div>
    </div>`;
  },

  // 3. 債務者判断（CF）
  _guideCF() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">3. 債務者判断（CF：キャッシュフロー）</div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">💰 お金が増える企業の3パターン</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div style="padding:12px;background:rgba(76,175,80,0.06);border-radius:8px;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-green);">① 営業CF</div>
          <div style="font-size:10px;line-height:1.8;margin-top:4px;">
            売上、利益が安定していて、収支差に変化がなく、設備投資、納税、配当、借入金の返済以上のキャッシュインを生み出せた企業
          </div>
        </div>
        <div style="padding:12px;background:rgba(108,99,255,0.06);border-radius:8px;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-primary);">② 投資CF</div>
          <div style="font-size:10px;line-height:1.8;margin-top:4px;">
            固定資産を売却した企業。<br>
            遊休資産の売却は評価されるが、本業資産の売却は注意が必要
          </div>
        </div>
        <div style="padding:12px;background:rgba(244,67,54,0.06);border-radius:8px;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-red);">③ 財務CF</div>
          <div style="font-size:10px;line-height:1.8;margin-top:4px;">
            融資調達、増資等により、決算期で現預金に滞留している企業。<br>
            本質的な収益力ではない
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">⚡ 営業CF ≧ (設備投資 + 納税 + 配当 + 借入返済)</div>
      <div style="font-size:12px;line-height:1.8;">
        <strong>★ 銀行が最も重視するのは営業CF</strong><br>
        営業CFが返済原資（設備投資＋納税＋配当＋借入金返済）を上回っているかが本質。<br><br>
        <strong>急拡大企業の注意点:</strong><br>
        ・急拡大企業は資金繰りショート（貸倒負担増加、納税等）、急縮小する企業も多い<br>
        ・金融機関は融資が完済されて、初めて利息の累積額が利益確定できる → BS重視<br>
        ・BSは経営者のイメージを作るため「経営者の顔」とも言われる<br>
        ・BSを綺麗にし、事業拡大のスピードに適正な純資産の積上げが重要
      </div>
    </div>`;
  },

  // 4. 業種特化モード
  _guideIndustry() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">4. 業種特化モード（新機能）</div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">📊 各業界の商習慣に合わせた最適化判定</div>
      <div style="font-size:12px;line-height:1.8;">
        <strong>業種モードを選択（/業種モード）</strong>することで、銀行の審査基準が業種に応じた適正値へ自動変動します。<br><br>
        <strong>主な変動基準:</strong><br>
        ・🏢 <strong>不動産・医療・農業</strong>：安定収益/長期耐用のため「償還年数15〜30年」まで正常許容。<br>
        ・💻 <strong>IT・SaaS</strong>：技術変化・無形資産メインのため「償還年数7年以内」と厳しく判定。<br>
        ・🏪 <strong>飲食・小売業</strong>：日銭商売のため「手元流動性」を最重視し、売掛・在庫の回転期間を厳しく判定。<br>
        ・🚀 <strong>スタートアップ</strong>：特例扱いで赤字・債務超過を許容し、「CFランウェイ」中心の審査へ移行。<br>
      </div>
    </div>`;
  },

  // 5. 案件判断
  _guideCase() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">5. 案件判断（運転資金・設備資金）</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="glass-card" style="padding:16px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px;">🔄 運転資金</div>
        <div style="font-size:11px;line-height:1.8;">
          <strong>正常運転資金</strong> = 売掛金 + 在庫 − 買掛金<br><br>
          <strong>長期運転資金（プロパー）:</strong><br>
          使途: 年間返済額240、更新投資20、納税20、配当5 = <strong>合計285</strong><br>
          調達: 借入金200、経常利益60、減価償却費20、現預金減5 = <strong>合計285</strong><br><br>
          ※ プロパー融資で運転資金が許容されるのは優良もしくは中堅企業以上の規模<br><br>
          <strong>保証協会保証付き融資:</strong><br>
          無担保枠 = 80百万円を上限、前期決算平均月商×3〜4ヶ月分<br>
          有担保枠 = 200百万円を上限に、担保物件の担保価値まで
        </div>
      </div>
      <div class="glass-card" style="padding:16px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px;">🏭 設備資金</div>
        <div style="font-size:11px;line-height:1.8;">
          <strong>その投資が生み出すCFで返済可能か？</strong><br><br>
          ・投資利回り = 利益 ÷ 投資額<br>
          ・CF(利益＋減価償却)で投資額の回収を行う<br>
          ・返済原資は「将来の営業利益」<br><br>
          <strong>金融機関の着目点:</strong><br>
          ・他行と比較した金利条件<br>
          ・保全状況（不動産担保は第1順位設定）<br>
          ・振込指定口座（メイン化の判断材料）<br>
          ・業績と取引振りが前回融資時と比較してどうか
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">💡 担当者が融資を稟議に通すためのポイント</div>
      <div style="font-size:12px;line-height:1.8;">
        ・「何故融資して良いか」を<strong>数字で説明</strong>できるように、事業運営をしていく必要がある<br>
        ・融資担当者は<strong>稟議書</strong>を書いている → 数字で「返せる」根拠を提供する<br>
        ・業績と取引振りが<strong>前回融資時と比較</strong>の上、提案する
      </div>
    </div>`;
  },

  // 5. 金融機関特性
  _guideBank() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">5. 金融機関の特性</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
      銀行によってそれぞれ特性がありますが、全て理由があります。属性によって取引する金融機関を決めましょう！
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;font-size:11px;border-collapse:collapse;">
        <tr style="border-bottom:2px solid var(--border-secondary);">
          <th style="padding:8px;text-align:left;">金融機関</th>
          <th style="text-align:center;">審査基準</th><th style="text-align:center;">金利</th>
          <th style="text-align:left;">特徴</th>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-weight:700;">🏛 メガバンク・信託</td>
          <td style="text-align:center;">最高</td><td style="text-align:center;">最低</td>
          <td style="padding:6px;">MUFG, SMBC, みずほ。大企業・上場企業中心。中小企業は年商10億円〜</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-weight:700;">🏦 上位地銀・長信銀</td>
          <td style="text-align:center;">高</td><td style="text-align:center;">低</td>
          <td style="padding:6px;">横浜, 千葉, 静岡等。中堅企業〜。地域密着型</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-weight:700;">🏪 都銀・下位地銀</td>
          <td style="text-align:center;">中</td><td style="text-align:center;">中</td>
          <td style="padding:6px;">地方の中小企業と密接な関係</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-weight:700;">🤝 信金・信組</td>
          <td style="text-align:center;">低〜中</td><td style="text-align:center;">高</td>
          <td style="padding:6px;">小規模・零細企業向け。面的な取引関係重視</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-weight:700;">🏗 不動産に強い信金</td>
          <td style="text-align:center;">中</td><td style="text-align:center;">中〜高</td>
          <td style="padding:6px;">不動産融資に特化。事業性よりも物件評価重視</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:6px;font-weight:700;">🛡 信用保証協会</td>
          <td style="text-align:center;">低</td><td style="text-align:center;">低</td>
          <td style="padding:6px;">公的保証。保証料別途。中小企業向け。無担保枠80百万、有担保枠200百万</td>
        </tr>
        <tr>
          <td style="padding:6px;font-weight:700;">💼 信販・外資・ノンバンク</td>
          <td style="text-align:center;">最低</td><td style="text-align:center;">最高</td>
          <td style="padding:6px;">審査基準は緩いが金利が高い。ブリッジ利用が主</td>
        </tr>
      </table>
    </div>`;
  },

  // 6. PJ資金
  _guidePJ() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">7. 案件判断（PJ資金）</div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">🏗 PJ資金の審査ポイント</div>
      <div style="font-size:11px;line-height:1.8;">
        <strong>PJ資金は基本短期</strong>（どれだけ長くても3年程度）、提案しやすい融資形態。<br>
        以下のどのパターンでも融資対象物件を<strong>担保取得</strong>します。<br><br>
        <strong>PJスケジュール管理:</strong><br>
        金融機関は土地取得→建確申請→建設済済→着工→中間→竣工→検査済証のスケジュールを確認。<br>
        遅延が大きい場合、建設業者とトラブルがないか等、ヒアリングが入ります。<br><br>
        物件売却資金をもって返済となるので、<strong>物件が売れるかどうか</strong>、売れなかった場合返済できるか？<br>
        しか金融機関は見ていません。<br><br>
        <strong>戸建て／レジ・アパート建築／区分所有の審査基準:</strong><br>
        ・債務者のPJ実績（販売力）、粗利率（値下げ余力）<br>
        ・販売価格の妥当性（想定利回り合い）<br>
        ・融資対象物件の担保価値（物件価格の10%〜15%が目線）<br>
        ・他のPJの進捗状況、建設業者の信用力、調達余力<br>
        ・本件PJが債務者の純資産に占める割合
      </div>
    </div>
    <div style="padding:10px;background:rgba(108,99,255,0.06);border-radius:6px;font-size:11px;border-left:3px solid var(--accent-primary);">
      <strong>💡 レジやビル1棟のPJ:</strong> 合いで返済をつけることが多い。<br>
      <strong>💡 優良企業:</strong> コミットメントラインで融資提案がある場合も。利用条件として資料提出、軽い（スピーディな）審査を受けることが多い。
    </div>`;
  }
});


// ========== ② DNA登録時にOCR/Excel読込を自動起動 ==========
// CompanyDNA.start() を拡張して、最初にOCR/Excel読込バナーを表示

(function() {
  // 元のstart()を保存
  const _origStart = CompanyDNA.start.bind(CompanyDNA);

  // start()をオーバーライド
  CompanyDNA.start = function() {
    // まずOCR/Excel読込プロンプトを表示
    const html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">🧬 企業DNA登録</div>
      <div style="padding:20px;text-align:center;border:2px dashed var(--accent-primary);border-radius:12px;margin-bottom:16px;background:rgba(108,99,255,0.04);">
        <div style="font-size:28px;margin-bottom:8px;">📊</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:4px;">決算書のExcelファイルをお持ちですか？</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
          Excel/CSVファイルから財務データを自動取込すると、DNA登録がスムーズです
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="BankAudit.showExcelImportForDNA()" style="font-size:14px;padding:10px 24px;">
            📁 Excelから読込（推奨）
          </button>
          <button class="btn btn-secondary" onclick="CompanyDNA._proceedManualDNA()" style="font-size:14px;padding:10px 24px;">
            ✏️ 手入力で登録
          </button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div class="glass-card" style="padding:12px;text-align:center;">
          <div style="font-size:20px;">📄</div>
          <div style="font-size:11px;font-weight:600;margin-top:4px;">Step 1</div>
          <div style="font-size:10px;color:var(--text-muted);">決算書Excel読込</div>
        </div>
        <div class="glass-card" style="padding:12px;text-align:center;">
          <div style="font-size:20px;">🧬</div>
          <div style="font-size:11px;font-weight:600;margin-top:4px;">Step 2</div>
          <div style="font-size:10px;color:var(--text-muted);">企業DNA補完入力</div>
        </div>
        <div class="glass-card" style="padding:12px;text-align:center;">
          <div style="font-size:20px;">🏦</div>
          <div style="font-size:11px;font-weight:600;margin-top:4px;">Step 3</div>
          <div style="font-size:10px;color:var(--text-muted);">格付判定・審査</div>
        </div>
      </div>

      <div style="font-size:11px;color:var(--text-muted);text-align:center;">
        📚 <a href="javascript:void(0)" onclick="BankAudit.showLoanGuide()" style="color:var(--accent-primary);text-decoration:underline;">融資審査ガイドを見る</a>　|　
        📥 <a href="javascript:void(0)" onclick="BankAudit.downloadTemplate()" style="color:var(--accent-primary);text-decoration:underline;">テンプレートExcelダウンロード</a>
      </div>
    </div>`;
    App.addSystemMessage(html);
  };

  // 手入力時は元のstart()を呼ぶ
  CompanyDNA._proceedManualDNA = function() {
    const _orig = CompanyDNA.start;
    CompanyDNA.start = _origStart; // 一時的にオリジナルを復元
    CompanyDNA.start();
    CompanyDNA.start = _orig; // 戻す
  };
})();


// ========== ③ Excel読込→DNA自動反映 ==========
Object.assign(BankAudit, {

  // DNA用Excel/PDF読込（読込後に自動的にDNA反映）
  showExcelImportForDNA() {
    let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
      <div class="report-title">📁 決算書読込 (Excel / PDF) → DNA自動登録</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        決算書（ExcelまたはPDF）をアップロードすると、AIが財務データを自動抽出し企業DNAに反映します。
      </p>
      <div style="border:2px dashed var(--accent-primary);border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all 0.3s;background:rgba(108,99,255,0.03);"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent-green)';this.style.background='rgba(76,175,80,0.06)'"
        ondragleave="this.style.borderColor='var(--accent-primary)';this.style.background='rgba(108,99,255,0.03)'"
        ondrop="event.preventDefault();BankAudit.handleExcelForDNA(event.dataTransfer.files[0])"
        onclick="document.getElementById('dna_excel_file').click()">
        <div style="font-size:40px;margin-bottom:8px;">📊</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:4px;">決算書ファイルをここにドロップ</div>
        <div style="font-size:12px;color:var(--text-muted);">またはクリックしてファイルを選択</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:8px;">.xlsx / .xls / .csv / .pdf 対応</div>
        <input type="file" id="dna_excel_file" accept=".xlsx,.xls,.csv,.pdf" style="display:none" onchange="BankAudit.handleExcelForDNA(this.files[0])">
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  async handleExcelForDNA(file) {
    if (!file) return;

    // PDFの場合はAI解析エンドポイントへ送信
    if (file.name.toLowerCase().endsWith('.pdf')) {
      App.addSystemMessage(Utils.createAlert('info','⏳','PDFをAIコンサルタントが解析して数値を抽出しています。数秒〜十数秒お待ちください...'));
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch((window.LCE_API_BASE||'') + '/api/ai/parse-pdf', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + App.token },
          body: fd
        });
        const parsed = await res.json();
        if (parsed.error) throw new Error(parsed.error);

        const dna = Database.loadCompanyData() || {};
        if (parsed.revenue) dna.annualRevenue = parsed.revenue;
        if (parsed.opProfit) dna.operatingProfit = parsed.opProfit;
        if (parsed.ordProfit) dna.ordinaryProfit = parsed.ordProfit;
        if (parsed.netProfit) dna.netIncome = parsed.netProfit;
        if (parsed.totalAssets) dna.totalAssets = parsed.totalAssets;
        if (parsed.netAssets) dna.netAssets = parsed.netAssets;
        if (parsed.deprecTotal) dna.depreciation = parsed.deprecTotal;
        if (parsed.interestExp) dna.interestExpense = parsed.interestExp;
        if (parsed.cash) dna.cashDeposits = parsed.cash;
        if (parsed.inventory) dna.inventory = parsed.inventory;
        if (parsed.accountsRec) dna.receivables = parsed.accountsRec;
        if (parsed.accountsPay) dna.payables = parsed.accountsPay;
        if (parsed.currentAssets) dna.currentAssets = parsed.currentAssets;
        if (parsed.fixedAssets) dna.fixedAssets = parsed.fixedAssets;
        if (parsed.currentLiab) dna.currentLiabilities = parsed.currentLiab;
        if (parsed.capital) dna.capitalAmount = Math.round(parsed.capital / 10000);
        
        const ibd = (parsed.shortDebt||0) + (parsed.longDebt||0) + (parsed.bonds||0);
        if (ibd > 0) dna.totalDebt = ibd;

        this.currentFS = { ...parsed };
        Database.saveCompanyData(dna);

        const items = [
          ['売上高', dna.annualRevenue], ['経常利益', dna.ordinaryProfit],
          ['総資産', dna.totalAssets], ['純資産', dna.netAssets],
          ['現預金', dna.cashDeposits], ['売掛金', dna.receivables],
          ['有利子負債', dna.totalDebt], ['棚卸資産', dna.inventory]
        ].filter(([,v]) => v != null);

        let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
          <div class="report-title">✅ PDFのAI読込・DNA反映が完了しました</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">抽出された主な財務データ:</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px;">`;
        items.forEach(([label, value]) => {
          html += `<div style="padding:8px;background:rgba(76,175,80,0.06);border-radius:6px;text-align:center;">
            <div style="font-size:9px;color:var(--text-muted);">${label}</div>
            <div style="font-size:12px;font-weight:700;">${Number(value).toLocaleString()}</div>
          </div>`;
        });
        html += `</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="CompanyDNA._proceedManualDNA()">🧬 DNA補完入力へ</button>
            <button class="btn btn-secondary" onclick="BankAudit.showCaseJudgment()">🏦 格付判定へ</button>
          </div>
        </div>`;
        App.addSystemMessage(html);
        return;
      } catch (err) {
        App.addSystemMessage(Utils.createAlert('error','❌','PDF解析失敗: ' + err.message));
        return;
      }
    }

    if (typeof XLSX === 'undefined') {
      App.addSystemMessage(Utils.createAlert('error','❌','SheetJSが未読込です。'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // 勘定科目マッピング（bank-audit-excel.jsの辞書を利用）
        const mapped = this._autoMapAccounts(json);
        const vals = mapped.values;

        // DNAデータに反映
        const dna = Database.loadCompanyData() || {};

        // 財務データのマッピング
        if (vals.revenue?.value) dna.annualRevenue = vals.revenue.value;
        if (vals.opProfit?.value) dna.operatingProfit = vals.opProfit.value;
        if (vals.ordProfit?.value) dna.ordinaryProfit = vals.ordProfit.value;
        if (vals.netProfit?.value) dna.netIncome = vals.netProfit.value;
        if (vals.totalAssets?.value) dna.totalAssets = vals.totalAssets.value;
        if (vals.netAssets?.value) dna.netAssets = vals.netAssets.value;
        if (vals.deprecTotal?.value) dna.depreciation = vals.deprecTotal.value;
        if (vals.interestExp?.value) dna.interestExpense = vals.interestExp.value;
        if (vals.cash?.value) dna.cashDeposits = vals.cash.value;
        if (vals.inventory?.value) dna.inventory = vals.inventory.value;
        if (vals.accountsRec?.value) dna.receivables = vals.accountsRec.value;
        if (vals.accountsPay?.value) dna.payables = vals.accountsPay.value;
        if (vals.currentAssets?.value) dna.currentAssets = vals.currentAssets.value;
        if (vals.fixedAssets?.value) dna.fixedAssets = vals.fixedAssets.value;
        if (vals.currentLiab?.value) dna.currentLiabilities = vals.currentLiab.value;
        if (vals.capital?.value) dna.capitalAmount = vals.capital.value / 10000; // 千円→万円
        // 有利子負債
        const ibd = (vals.shortDebt?.value||0) + (vals.longDebt?.value||0) + (vals.bonds?.value||0);
        if (ibd > 0) dna.totalDebt = ibd;

        // currentFSにも保存
        this.currentFS = {};
        Object.entries(vals).forEach(([k, info]) => {
          if (info.value !== null) this.currentFS[k] = info.value;
        });

        Database.saveCompanyData(dna);

        // 反映結果表示
        const items = [
          ['売上高', dna.annualRevenue], ['営業利益', dna.operatingProfit],
          ['経常利益', dna.ordinaryProfit], ['当期純利益', dna.netIncome],
          ['総資産', dna.totalAssets], ['純資産', dna.netAssets],
          ['有利子負債', dna.totalDebt], ['減価償却費', dna.depreciation],
          ['現預金', dna.cashDeposits], ['売掛金', dna.receivables]
        ].filter(([,v]) => v);

        let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
          <div class="report-title">✅ 財務データをDNAに自動反映しました</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">
            ${mapped.matchCount}件の勘定科目を自動認識・反映
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px;">`;
        items.forEach(([label, value]) => {
          html += `<div style="padding:8px;background:rgba(76,175,80,0.06);border-radius:6px;text-align:center;">
            <div style="font-size:9px;color:var(--text-muted);">${label}</div>
            <div style="font-size:12px;font-weight:700;">${Number(value).toLocaleString()}</div>
          </div>`;
        });
        html += `</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="CompanyDNA._proceedManualDNA()">🧬 DNA補完入力へ</button>
            <button class="btn btn-secondary" onclick="BankAudit.showCaseJudgment()">🏦 格付判定へ</button>
            <button class="btn btn-secondary" onclick="BankAudit.showLoanGuide()">📚 融資審査ガイド</button>
          </div>
        </div>`;
        App.addSystemMessage(html);

      } catch(err) {
        App.addSystemMessage(Utils.createAlert('error','❌','読込失敗: ' + err.message));
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // DNAからcurrentFSに同期
  syncFromDNA() {
    const dna = Database.loadCompanyData() || {};
    if (dna.annualRevenue) {
      this.currentFS = {
        revenue: dna.annualRevenue||0, opProfit: dna.operatingProfit||0,
        ordProfit: dna.ordinaryProfit||0, netProfit: dna.netIncome||0,
        totalAssets: dna.totalAssets||0, netAssets: dna.netAssets||0,
        deprecTotal: dna.depreciation||0, interestExp: dna.interestExpense||0,
        shortDebt: (dna.totalDebt||0)*0.4, longDebt: (dna.totalDebt||0)*0.6,
        bonds: 0, notesRec: 0, accountsRec: dna.receivables||0,
        inventory: dna.inventory||0, notesPay: 0, accountsPay: dna.payables||0,
        currentAssets: dna.currentAssets||0, fixedAssets: dna.fixedAssets||0,
        deferredAssets: 0, currentLiab: dna.currentLiabilities||0, cash: dna.cashDeposits||0
      };
    }
  },

  // currentFSからDNAに同期
  syncToDNA() {
    const fs = this.currentFS || {};
    if (!fs.revenue) { App.addSystemMessage(Utils.createAlert('warning','⚠️','決算データがありません。')); return; }
    const dna = Database.loadCompanyData() || {};
    dna.annualRevenue = fs.revenue;
    dna.operatingProfit = fs.opProfit;
    dna.ordinaryProfit = fs.ordProfit;
    dna.netIncome = fs.netProfit;
    dna.totalAssets = fs.totalAssets;
    dna.netAssets = fs.netAssets;
    dna.depreciation = fs.deprecTotal;
    dna.interestExpense = fs.interestExp;
    dna.totalDebt = (fs.shortDebt||0) + (fs.longDebt||0) + (fs.bonds||0);
    dna.receivables = (fs.notesRec||0) + (fs.accountsRec||0);
    dna.inventory = fs.inventory;
    dna.payables = (fs.notesPay||0) + (fs.accountsPay||0);
    dna.currentAssets = fs.currentAssets;
    dna.fixedAssets = fs.fixedAssets;
    dna.currentLiabilities = fs.currentLiab;
    dna.cashDeposits = fs.cash;
    Database.saveCompanyData(dna);
    App.addSystemMessage(Utils.createAlert('success','✅','決算データを企業DNAに反映しました。'));
  }
});
