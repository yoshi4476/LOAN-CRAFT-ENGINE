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
        <button class="btn btn-secondary btn-sm" onclick="BankAudit.showGuideTab('repay')">📉 返済計画</button>
      </div>
      <div id="guide_content">${this._guideSystem()}</div>
    </div>`;
    App.addSystemMessage(html);
  },

  showGuideTab(tab) {
    const el = document.getElementById('guide_content');
    if (!el) { this.showLoanGuide(); return; }
    const tabs = { system: this._guideSystem, overview: this._guideOverview, debtor: this._guideDebtor, cf: this._guideCF, industry: this._guideIndustry, case: this._guideCase, bank: this._guideBank, pj: this._guidePJ, repay: this._guideRepay };
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
    <div class="report-subtitle" style="color:var(--accent-cyan);">1. 融資可否の判断フレームワーク（銀行はここを見ている）</div>
    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">銀行の融資審査は、大きく「債務者（会社そのもの）の評価」と「案件（今回の使い道）の評価」の2段階で行われます。どんなに良い案件でも、会社自体の評価が低ければ融資は通りません。</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
      <div class="glass-card" style="padding:16px;border-left:4px solid var(--accent-gold);">
        <div style="font-size:15px;font-weight:700;margin-bottom:8px;">🟡 ① 債務者判断（会社の体力測定）</div>
        <div style="font-size:12px;line-height:1.8;">
          年に1度、決算書が提出されたタイミングで金融機関が独自のスコアリングシートを用いて<strong>会社そのものを10段階程度で自動格付け</strong>します。<br>
          ・<strong>目的</strong>：「この会社はそもそもお金を貸しても大丈夫な信用力があるか？」<br>
          ・<strong>評価軸</strong>：過去期の「PL（収益力・成長性）」と「BS（安全性・資本力）」、および「CF（返済能力）」の総合判定<br>
          ★ <strong>結論</strong>：この債務者判断で「正常先」に入らなければ、メガバンクや地銀プロパーでの新規融資のハードルは極めて高くなります。
        </div>
      </div>
      <div class="glass-card" style="padding:16px;border-left:4px solid var(--accent-cyan);">
        <div style="font-size:15px;font-weight:700;margin-bottom:8px;">🔵 ② 案件判断（使い道と回収の妥当性）</div>
        <div style="font-size:12px;line-height:1.8;">
          債務者判断をクリアした上で、「今回の融資申込」の妥当性を審査します。<br>
          ・<strong>目的</strong>：「今回の使い道は前向きか？」「貸したお金は確実に回収できるか？」<br>
          ・<strong>評価軸</strong>：資金使途（運転・設備・PJ）、返済原資（将来CFや担保）、貸出条件（期間・金利・融資形態）<br>
          ★ <strong>結論</strong>：資金使途が不明瞭（赤字の穴埋め等）だと、会社が優良でも否決されることがあります（資金使途違反の警戒）。
        </div>
      </div>
    </div>

    <div class="report-subtitle" style="color:var(--accent-cyan);">2. 銀行の絶対ルール「債務者5区分」と自己資本比率</div>
    <div style="font-size:12px;line-height:1.8;color:var(--text-secondary);margin-bottom:12px;">すべての企業は決算書に基づいて以下の5つの区分に強制的に振り分けられます。銀行はこの区分ごとに「貸倒引当金（貸したお金が返ってこないリスクに備えて積むお金）」を積まねばならず、区分が低い企業に追加融資をすると銀行自身の利益が削られるため、融資を渋る構造になっています。</div>
    <div style="overflow-x:auto;">
      <table style="width:100%;font-size:12px;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:8px;">
        <tr style="border-bottom:2px solid var(--border-secondary);background:rgba(0,0,0,0.2);">
          <th style="padding:12px;text-align:left;">区分</th><th style="padding:12px;text-align:left;">主な判定基準と銀行の対応</th><th style="padding:12px;text-align:center;">引当率目安</th>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;color:var(--accent-green);font-weight:700;font-size:13px;">✅ 正常先</td>
          <td style="padding:10px;line-height:1.6;"><strong>【基準】資産超過 且つ 経常黒字 且つ 債務償還年数10年以内</strong><br>
          業績が安定しており、特段の財務上の課題がない企業。<br><span style="color:var(--accent-green);">【銀行の対応】プロパー融資（銀行の直接融資）で積極的に支援・金利競争が起きる層。</span></td>
          <td style="padding:10px;text-align:center;font-weight:700;">0.2〜0.5%</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;color:var(--accent-gold);font-weight:700;font-size:13px;">⚠️ 要注意先<br><span style="font-size:10px;font-weight:normal;">(要管理先含む)</span></td>
          <td style="padding:10px;line-height:1.6;"><strong>【基準】債務超過、または赤字継続、または債務償還年数が10〜15年超</strong><br>
          将来の元本返済に不安が残る企業。※3ヶ月以上延滞やリスケ中は「要管理先」に格下げ。<br><span style="color:var(--accent-gold);">【銀行の対応】プロパー融資は原則ストップ。信用保証協会付き融資や、不動産担保の範囲内でしか融資が出なくなる。</span></td>
          <td style="padding:10px;text-align:center;font-weight:700;">5〜15%</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;color:var(--accent-red);font-weight:700;font-size:13px;">⛔ 破綻懸念先</td>
          <td style="padding:10px;line-height:1.6;"><strong>【基準】大幅な債務超過 (数年以内に解消不可)、継続的な大幅赤字</strong><br>
          現状では倒産していないが、いずれ破綻する可能性が高い企業。<br><span style="color:var(--accent-red);">【銀行の対応】新規融資は絶対NG。既存債権の回収フェーズに入る。</span></td>
          <td style="padding:10px;text-align:center;font-weight:700;">30〜75%</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;color:var(--text-muted);font-weight:700;font-size:13px;">💀 実質破綻先</td>
          <td style="padding:10px;line-height:1.6;"><strong>【基準】法的破綻はしていないが、深刻な資金ショート状態</strong><br>金融機関がサービサー等に債権譲渡を実行。</td>
          <td style="padding:10px;text-align:center;font-weight:700;">100%</td>
        </tr>
        <tr>
          <td style="padding:10px;color:var(--text-muted);font-weight:700;font-size:13px;">☠️ 破綻先</td>
          <td style="padding:10px;line-height:1.6;">法的に破綻、清算、会社更生等</td>
          <td style="padding:10px;text-align:center;font-weight:700;">100%</td>
        </tr>
      </table>
    </div>
    <div style="margin-top:16px;padding:12px;background:rgba(255,193,7,0.06);border-radius:6px;font-size:12px;line-height:1.8;border-left:4px solid var(--accent-gold);">
      <strong>💡 【実践のコツ】ランクアップトリガーを活用せよ</strong><br>
      決算書上は「要注意先（債務超過）」であっても、以下のアクロバットで「正常先」に引き上げることが可能です（<strong>実力判定</strong>と呼ばれます）。<br>
      ① グループ企業がある場合、合算して黒字・資産超過に持ち込む（<strong>グループ合算</strong>）<br>
      ② 代表者個人の現預金や不動産（無担保）を会社の資産に合算評価する（<strong>代表者一体把握</strong>）<br>
      ③ 役員への貸付金を給与と相殺させる、役員借入金を「資本金」と見なす（<strong>DES的評価・劣後借入</strong>）
    </div>`;
  },

  // 2. 債務者判断（BS・PL）
  _guideDebtor() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">2. 債務者判断の核心（BS・PLからアラートを見抜く）</div>
    
    <div class="glass-card" style="padding:16px;margin-bottom:16px;border-left:4px solid var(--accent-primary);">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">📄 PL（損益計算書）の審査ポイント — 銀行は「2〜3期分のトレンド」を見る</div>
      <div style="font-size:12px;line-height:1.8;">
        銀行は当期だけの黒字化をそこまで信じません。<strong>「なぜ増益したのか？それは持続可能か？」</strong>というトレンド（傾向）を重視します。<br><br>
        <strong>銀行員の着目点:</strong><br>
        <ol style="padding-left:24px;margin-bottom:8px;">
          <li style="margin-bottom:6px;"><strong>営業利益が黒字か？</strong>：本業の儲けを示す営業利益が「赤字」だと、一時的な要因（コロナ等）を除き、根幹のビジネスモデルが崩れていると見なされます。</li>
          <li style="margin-bottom:6px;"><strong>売上原価はどう変動したか？</strong>：仕入れ価格の高騰を売上に転嫁できているか（粗利率が落ちていないか）。落ちている場合、下請けいじめに遭っていないか等を確認されます。</li>
          <li style="margin-bottom:6px;"><strong>一過性の損益除外（経常利益以下）</strong>：不動産を売って出した「特別利益（見せかけの黒字）」は審査において容赦無く除外されます。本質的な「営業利益」「経常利益」だけで評価します。</li>
          <li><strong>役員報酬の増減</strong>：赤字なのに社長の給料だけ上がっていると、経営者倫理を疑われ評価が急落します。逆に、社長の給料を極端に下げて黒字を「作って」いる場合も実態修正されます。</li>
        </ol>
      </div>
    </div>

    <div class="glass-card" style="padding:16px;margin-bottom:16px;border-left:4px solid var(--accent-green);">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">📊 BS（貸借対照表）の審査ポイント — 銀行の「裏の目線（実態修正）」</div>
      <div style="font-size:12px;line-height:1.8;">
        BSは経営者の顔です。決算書として提出されたBSを、銀行員は<strong>「もし明日この会社が潰れたら、資産はいくらお金に変わるか？」という超保守的な目線（実態修正）で再評価</strong>します。
        <br><br>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
          <div style="padding:12px;background:rgba(76,175,80,0.06);border-radius:8px;">
            <div style="font-size:13px;font-weight:600;color:var(--accent-green);margin-bottom:8px;">資産の部（本当に価値があるか？）</div>
            <strong>流動資産</strong>：回収不能な「不良売掛金」、売れない「不良在庫」は資産ゼロとして全額マイナス（減額）評価されます。<br>
            <strong>固定資産</strong>：買った値段ではなく「今の時価」に修正。また「回収不明の社長への貸付金」等は全額資産から除外されます。<br>
            <strong>繰延資産</strong>：実体のない資産なので評価ゼロになります。
          </div>
          <div style="padding:12px;background:rgba(244,67,54,0.06);border-radius:8px;">
            <div style="font-size:13px;font-weight:600;color:var(--accent-red);margin-bottom:8px;">負債・純資産の部（隠れ借金はないか？）</div>
            <strong>純資産（自己資本）</strong>：左記の厳しい資産減額を行った結果、<strong>実態純資産がマイナス（実質債務超過）にならないか</strong>が最大の鍵です。<br>
            <strong>簿外負債</strong>：退職金債務の未計上や、リース債務の未掲載など、「実は隠れている負債」がないかを面談で探りを入れてきます。
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding:20px;border:1px solid var(--accent-gold);">
      <div style="font-size:16px;font-weight:700;margin-bottom:12px;color:var(--accent-gold);">💡 銀行審査の「ラスボス」：債務償還年数の計算</div>
      <div style="font-size:13px;line-height:1.8;">
        「何年でいまの借入金を全額返せるか」を示す、<strong>日本の銀行審査で最強の権力を持つ指標</strong>です。<br>
        <div style="background:var(--bg-tertiary);padding:16px;border-radius:8px;margin:12px 0;font-family:monospace;font-size:14px;font-weight:bold;text-align:center;">
          債務償還年数 ＝ ( 有利子負債 − 現預金 ) ÷ 簡易営業キャッシュフロー
        </div>
        ・<strong>簡易営業CF</strong> ＝ 経常利益 × (1 - 法人税法30%強) ＋ 減価償却費<br>
        ・<strong>基準値</strong>：原則として「10年以内」に収まれば正常先（合格）。15年を超えると黄色信号、20年超えやCF赤字（マイナス）の場合は、新規融資はほぼ絶望的です（リスケを検討するレベル）。<br>
        <span style="display:inline-block;margin-top:12px;color:var(--accent-gold);font-weight:700;border-bottom:1px solid var(--accent-gold);">★ 対策：この年数が10年を超える場合は、「不要な固定資産の売却で借入を減らす」か「経費削減で利益（分母）を増やす」計画を必ずセットで提出する必要があります。</span>
      </div>
    </div>`;
  },

  // 3. 債務者判断（CF）
  _guideCF() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">3. 債務者判断の総仕上げ（CF：キャッシュフローから生存能力を測る）</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
      黒字倒産という言葉があるように、利益が出ていても手元に現金（CF）がなければ会社は倒産します。銀行は「この会社は自分たちの力でお金を生み出せているか？」を3つのCFから分析します。
    </div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;border-left:4px solid var(--accent-green);">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;">💰 お金が増減する3パターンの「質」を見極める</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div style="padding:16px;background:rgba(76,175,80,0.06);border-radius:8px;">
          <div style="font-size:14px;font-weight:700;color:var(--accent-green);margin-bottom:8px;">① 営業CF（本業の稼ぎ）<br><span style="font-size:10px;">★銀行が最も愛するCF</span></div>
          <div style="font-size:11px;line-height:1.8;">
            事業活動から直接生み出された現金。<br>
            <strong>ここがプラスであることが絶対条件。</strong>営業CFで「設備投資・納税・配当・借入金の元本返済」の全てを賄えている状態が【最強の企業】です。
          </div>
        </div>
        <div style="padding:16px;background:rgba(108,99,255,0.06);border-radius:8px;">
          <div style="font-size:14px;font-weight:700;color:var(--accent-primary);margin-bottom:8px;">② 投資CF（将来への種まき）</div>
          <div style="font-size:11px;line-height:1.8;">
            工場を建てたり、機械を買ったりするとマイナスになります。<br>
            <strong>マイナスであること自体は「成長投資」なので悪くありません</strong>が、営業CF以上に使いすぎている（身の丈に合っていない投資）場合は要注意とみなされます。
          </div>
        </div>
        <div style="padding:16px;background:rgba(244,67,54,0.06);border-radius:8px;">
          <div style="font-size:14px;font-weight:700;color:var(--accent-red);margin-bottom:8px;">③ 財務CF（借金と返済）</div>
          <div style="font-size:11px;line-height:1.8;">
            銀行からお金を借りるとプラスになり、返済するとマイナスになります。<br>
            営業CFが赤字なのに財務CFのプラス（借金）で生き延びている状態は「自転車操業」と呼ばれ、最も警戒されます。
          </div>
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding:20px;border:1px solid var(--accent-gold);">
      <div style="font-size:15px;font-weight:700;margin-bottom:12px;color:var(--accent-gold);">💡 フリーキャッシュフロー（FCF）の公式と「急拡大企業の罠」</div>
      <div style="font-size:13px;line-height:1.8;">
        銀行は<strong>「営業CF ＋ 投資CF ＝ フリーキャッシュフロー（FCF）」</strong>を注視します。<br>
        これがプラスであれば、借金を自力で減らしていく能力があるという証明になります。<br><br>
        <strong>⚠️ 急拡大企業はなぜ倒産しやすいのか？</strong><br>
        売上が急拡大すると、「先に仕入れ代金や人件費を払い、数ヶ月後に売上が入金される」というタイムラグにより、一時的に猛烈な資金ショートを起こします（これを<strong>運転資金の増加による営業CFの悪化</strong>と呼びます）。<br>
        銀行は「急拡大企業は突然死するリスクがある」と知っているため、売上が伸びているからといって手放しで融資はしません。「運転資金がいくら必要なのか」に対する精緻な資金繰り表をつけることが必須です。
      </div>
    </div>`;
  },

  // 4. 業種特化モード
  _guideIndustry() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">4. 業種特化モード（業界ごとの「融資のツボ」）</div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px;">📊 銀行は「業種」によって評価のモノサシを変える</div>
      <div style="font-size:12px;line-height:1.8;">
        本システムで <strong>/業種モード</strong> を設定すると、銀行が実際に使っている「業界別の審査基準」へ自動的に切り替わります。<br><br>
        <strong>業界別の審査基準の違い（例）:</strong><br>
        <ul style="padding-left:24px;">
          <li style="margin-bottom:6px;">🏢 <strong>不動産・医療・農業</strong>：<br>
          「初期投資が巨大で、回収に時間がかかる」という特性を銀行も理解しています。そのため、通常の基準である「債務償還年数10年以内」が、<strong>15年〜最長30年</strong>まで正常圏内として大幅に緩和されます。</li>
          <li style="margin-bottom:6px;">💻 <strong>IT・SaaS・人材派遣</strong>：<br>
          「設備（有形固定資産）が少なく、技術革新が早い」ため、銀行は非常にシビアになります。償還年数は<strong>7年以内</strong>と厳しめに見られ、「手元にどれだけ現金を残しているか（現預金比率）」で評価されます。</li>
          <li style="margin-bottom:6px;">🏪 <strong>飲食・小売業・建設業</strong>：<br>
          <strong>「黒字倒産」が頻発する業界</strong>です。飲食店等は日銭が入るため手元の現金がダブつきがちですが、建設業等は入金から支払いまでのサイクルが長いため、銀行は「流動比率（すぐ払えるお金があるか）」を最重要視します。</li>
          <li>🚀 <strong>スタートアップ特例</strong>：<br>
          赤字のJカーブを掘る特性があるため、従来の過去実績（PL/BS）ではなく、「事業計画の確からしさ」「VC等からのエクイティ調達（自己資本強化）」「資金ショートまでの猶予期間（CFランウェイ）」を軸とした審査に移行します。</li>
        </ul>
      </div>
    </div>`;
  },

  // 5. 案件判断
  _guideCase() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">5. 案件判断（この用途で、いくらま貸せるか）</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
      「全体評価（債務者区分）」をクリアしたら、次はいよいよ「今回申し込む融資案件」の個別審査です。資金の使い道（資金使途）によって、審査の焦点は全く異なります。
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="glass-card" style="padding:16px;border-top:4px solid var(--accent-primary);">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px;">🔄 運転資金（日常の血液）</div>
        <div style="font-size:12px;line-height:1.8;">
          <strong>【資金使途】</strong>：仕入代金の決済、人件費、家賃など、日々の商売を回すためのお金。<br><br>
          <strong>【銀行の審査ロジック】</strong><br>
          銀行は「<strong>正常運転資金（売上債権＋棚卸資産－買入債務）</strong>」の計算式で、会社が構造上「いくら立て替える必要があるか」を一発で見抜きます。この金額内での融資は「正常で前向きな借入」と見なされ、最も通りやすい部類に入ります。<br><br>
          <span style="color:var(--accent-red);font-weight:700;">⚠️ 警告シグナル</span><br>
          売上が増えていないのに運転資金の融資増額を求めた場合、「不良在庫の穴埋めではないか？」「回収不能な売掛金があるのではないか？（＝実質的には赤字補填）」と強烈に疑われません。
        </div>
      </div>
      
      <div class="glass-card" style="padding:16px;border-top:4px solid var(--accent-green);">
        <div style="font-size:14px;font-weight:700;margin-bottom:12px;">🏭 設備資金（未来への筋肉）</div>
        <div style="font-size:12px;line-height:1.8;">
          <strong>【資金使途】</strong>：工場の建設、機械の導入、システムの構築、店舗の内装など。<br><br>
          <strong>【銀行の審査ロジック】</strong><br>
          「<strong>その投資から生まれる新しい利益（将来CF）で、本当に借入を全額返還できるのか？</strong>」という投資対効果（ROI）だけを見ます。見積書の提出義務や、支払先への直接振込（プロパー融資の原則）が必須となります。<br><br>
          <span style="color:var(--accent-green);font-weight:700;">💡 稟議通過のコツ</span><br>
          「この機械を入れれば、残業代（人件費経費）が月間30万円減ります。だから月々20万円の返済は余裕で回ります」のように、<strong>CFの改善根拠を数字で証明した計画書</strong>を提出することが絶対条件です。
        </div>
      </div>
    </div>

    <div class="glass-card" style="padding:16px;background:rgba(108,99,255,0.05);">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:var(--accent-primary);">📌 銀行員に「最強の稟議書」を書かせるための心得</div>
      <div style="font-size:13px;line-height:1.8;">
        銀行の担当者は「あなたにお金を貸したい」と思っていますが、支店長や審査部を説得する「社内稟議書」を書けないと貸せません。<br>
        経営者がやるべきことは、<strong>「担当者が稟議書にそのままコピペできる『返済できる根拠（数字）』と『前向きな事業ストーリー』をセットにして渡してあげること」</strong>です（本システムの分析・計画出力機能がそれを担います）。
      </div>
    </div>`;
  },

  // 6. 金融機関特性
  _guideBank() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">6. 金融機関の特性（誰に、どうアプローチするか）</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
      金融機関にはそれぞれ明確な「ポジショニング（貸したい相手・得意な融資）」があります。自社の規模やフェーズに合わない金融機関に申し込むと、相手にされず時間だけを浪費します。階層（ピラミッド）を理解し、適切なパートナーを選んでください。
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;font-size:12px;border-collapse:collapse;background:rgba(255,255,255,0.02);border-radius:8px;">
        <tr style="border-bottom:2px solid var(--border-secondary);background:rgba(0,0,0,0.2);">
          <th style="padding:12px;text-align:left;">金融機関レイヤー</th>
          <th style="padding:12px;text-align:center;">審査ハードル</th>
          <th style="padding:12px;text-align:center;">金利水準</th>
          <th style="padding:12px;text-align:left;">特徴とターゲット企業層</th>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;font-weight:700;font-size:13px;color:var(--accent-primary);">🏛 メガバンク・信託（頂点）</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-red);">極めて高い</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-green);">最低</td>
          <td style="padding:10px;line-height:1.6;">【代表格】三菱UFJ、三井住友、みずほ<br>大企業・上場企業が中心。中小企業は<strong>最低でも年商10億円以上（できれば30億〜50億）</strong>で強固な黒字継続がないと同等の扱いを受けられません。</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;font-weight:700;font-size:13px;color:var(--accent-cyan);">🏦 上位地銀</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-gold);">高い</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-primary);">低い</td>
          <td style="padding:10px;line-height:1.6;">【代表格】横浜銀行、千葉銀行、静岡銀行など<br>地場の中堅企業をメインとする実力派。審査基準はメガバンクに次いで厳しく、業績安定企業には低利で大型のプロパー融資の相談に乗ってくれます。</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;font-weight:700;font-size:13px;color:var(--accent-green);">🏪 第二地銀・下位地銀</td>
          <td style="padding:10px;text-align:center;font-weight:700;">中程度</td>
          <td style="padding:10px;text-align:center;font-weight:700;">中程度</td>
          <td style="padding:10px;line-height:1.6;">地域の中小企業に最も密着。創業期を抜け、売上1億円〜数億円フェーズに到達した会社のメインバンク候補として最適です。「保証協会つき融資＋一部プロパー」という提案が多い層。</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;font-weight:700;font-size:13px;color:var(--accent-gold);">🤝 信用金庫・信用組合</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-green);">柔軟（伴走型）</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-gold);">やや高い</td>
          <td style="padding:10px;line-height:1.6;">創業直後〜小規模企業（売上数千万〜）の最強の味方。「利益や財務指標」だけでなく、「経営者の熱意や地元への貢献度（定性評価）」に重きを置くため、赤字期や業況悪化時にも見捨てずに親身になって支援してくれる防波堤です。</td>
        </tr>
        <tr style="border-bottom:1px solid var(--border-secondary);">
          <td style="padding:10px;font-weight:700;font-size:13px;color:var(--text-muted);">🛡 日本政策金融公庫・保証協会</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-primary);">創業融資◎</td>
          <td style="padding:10px;text-align:center;font-weight:700;color:var(--accent-green);">低い</td>
          <td style="padding:10px;line-height:1.6;">公的機関。民間銀行が貸し渋る創業フェーズや、担保・実績がない企業の救済措置的役割。<strong>「税金の未納が一切ないこと」が絶対条件</strong>。</td>
        </tr>
      </table>
    </div>`;
  },

  // 7. PJ資金
  _guidePJ() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">7. 案件判断（不動産プロジェクト・PJ資金）</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
      不動産業者（デベロッパー）が建売り、レジデンス、マンションなどを建てて売却するための短期開発資金。通常の企業融資（コーポレートローン）とは全く異なる特殊な審査ロジックが働きます。
    </div>
    <div class="glass-card" style="padding:16px;margin-bottom:16px;border-left:4px solid var(--accent-primary);">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">🏗 PJ資金：審査の3大ポイントと銀行の心理</div>
      <div style="font-size:12px;line-height:1.8;">
        PJ資金は「土地を買い、建物を建てて売る」までの<strong>超短期間（長くても1〜3年以内）</strong>の融資であり、全ては<strong>「計画通りに完成し、予定価格で売却でき、その売却代金で借金が返済されること（エグジットシナリオ）」</strong>に依存しています。<br><br>
        
        <strong style="color:var(--accent-primary);">① 開発業者の「過去の販売トラックレコード（実績）」</strong><br>
        「この地域で、この価格帯の物件を、過去に何棟売り切った実績があるか」。銀行は不確実な未来予想図よりも、デベロッパー自身の過去の「売り切り能力（＝販売力）」を最も信じます。<br><br>
        
        <strong style="color:var(--accent-primary);">② 粗利率による「値下げ耐久力」</strong><br>
        万が一、想定価格で売れ残った場合、金利負担で会社が倒れる前に「いくらまでなら値下げして投げ売りしても、銀行への返済分（原価相当）をカバーできるか」の余裕度（= 見込み粗利率）を計算します。通常15%〜20%等の利益バッファを求めます。<br><br>
        
        <strong style="color:var(--accent-primary);">③ 全体スケジュールと工事の進捗リスク</strong><br>
        土地決済 → 建築確認 → 着工 → 竣工 → 決済売却 までのタイムラインが1ヶ月でも遅れると、余分な金利（ブリッジローン等）が嵩みます。「信頼できるゼネコン/工務店に発注しているか（途中で倒産して工事が止まるリスクはないか）」も厳しく審査されます。
      </div>
    </div>

    <div style="padding:16px;background:rgba(108,99,255,0.06);border-radius:6px;font-size:12px;line-height:1.6;border:1px solid rgba(108,99,255,0.2);">
      <strong>💡 不動産PJ融資の裏話</strong><br>
      ・<strong>担保取得の絶対性</strong>：原則として、融資対象の土地と建物すべてに第1順位の抵当権（担保）を設定します。審査目線は物件価格の「評価額＝約10%〜15%割れ目線」等で保全率を見ます。<br>
      ・<strong>会社全体の体力（純資産とのバランス）</strong>：どんなに良いPJでも、「その1件のPJが失敗してコケたら、会社全体（純資産）が丸ごと吹き飛んで倒産する規模の『一発勝負』」の場合、銀行はリスク過大として融資を断ります（分散の原則）。
    </div>`;
  },

  // 8. 返済計画（借入金返済計画の極意）
  _guideRepay() {
    return `
    <div class="report-subtitle" style="color:var(--accent-cyan);">8. 借入金返済計画（審査に通る「返済シナリオ」の作り方）</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
      銀行が最も恐れるのは「貸したお金が返ってこないこと」です。そのため、稟議書において「どうやって返すのか（返済原資）」の論理的構築は、最も重要なパートとなります。返済計画は、単なるExcelの年表ではなく、「3つの防衛線」を持たせることが最強の戦略です。
    </div>
    
    <div class="glass-card" style="padding:16px;margin-bottom:16px;border-left:4px solid var(--accent-primary);">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">🛡️ 銀行を安心させる「返済原資の3層ディフェンス」</div>
      <div style="font-size:12px;line-height:1.8;">
        審査を通すための返済計画は、以下の3段階のシナリオで構築します。<br><br>
        
        <strong style="color:var(--accent-green);">第1の防衛線：本業の「営業キャッシュフロー（CF）」で返す</strong><br>
        基本中の基本です。「税引後利益 ＋ 減価償却費」で借入元金を返還できることを、具体的かつ保守的な事業計画（売上の根拠、利益率の推移）で証明します。予測には「楽観シナリオ」を見せず、<strong>「悲観シナリオ（売上が計画の10%未達でも返せる）」</strong>を示す方が圧倒的に信用されます。<br><br>
        
        <strong style="color:var(--accent-gold);">第2の防衛線：有事の際は「遊休資産・保険・積立金」で返す</strong><br>
        「万が一、売上目標が未達で赤字に転落した場合はどうしますか？」という銀行のツッコミへの解答です。<br>
        「その場合は、解約返戻金が1,500万円ある生命保険を解約します」「本業に関係のない〇〇所在の土地（評価額2,000万円）を売却し、現金化して返済に充てます」というバックアッププラン（第二の財布）を開示します。<br><br>
        
        <strong style="color:var(--accent-red);">第3の防衛線：「代表者」が身を削って返す（役員報酬の返上・私財投入）</strong><br>
        最終兵器です。「いざとなれば、社長の役員報酬（年間2,000万円）を半分の1,000万円にカットし、浮いた1,000万円を返済原資に回します」「社長個人で保有する定期預金（3,000万円）を会社に貸し付けます」という、<strong>経営者の覚悟と個人の資産余力</strong>を最後のリスクバッファとして提示します。
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div class="glass-card" style="padding:16px;background:rgba(255,255,255,0.02);border:1px solid var(--border-secondary);">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;">💡 借換（折り返し融資）という選択肢</div>
        <div style="font-size:11px;line-height:1.8;">
          全てを利益で返済するのは至難の業です。そのため、正常運転資金分（売掛＋在庫－買掛）の借入に関しては「常に借りておくべきお金（恒常的資金）」とみなし、返済が進んだ段階で再度借り直す（＝折り返し・借換え）計画を組み込むことも立派な戦略です。ただし、この戦略が使えるのは「正常先」の格付けを維持している企業のみです。
        </div>
      </div>
      <div class="glass-card" style="padding:16px;background:rgba(255,255,255,0.02);border:1px solid var(--border-secondary);">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;">⚠️ リスケ（条件変更）時の返済計画は？</div>
        <div style="font-size:11px;line-height:1.8;">
          元金返済を止めるリスケジュール中の場合は、「実抜計画（実現可能性の高い抜本的な経営再建計画）」の要件を満たす必要があります。「3〜5年以内に営業CFを黒字化し、債務償還年数を10年以内に正常化（または正常先へ復帰）させる」という明確なロードマップ（数値証明）が必須となります。
        </div>
      </div>
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
        <div style="font-size:15px;font-weight:700;margin-bottom:4px;">決算書のExcel/PDFファイルをお持ちですか？</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
          Excel/CSV/PDFファイルから財務データを自動取込すると、DNA登録がスムーズです
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="BankAudit.showExcelImportForDNA()" style="font-size:14px;padding:10px 24px;">
            📁 Excel/PDFから読込（推奨）
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
          <div style="font-size:10px;color:var(--text-muted);">決算書Excel/PDF読込</div>
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
        // 企業基本情報の反映
        if (parsed.companyName) dna.companyName = parsed.companyName;
        if (parsed.representativeName) dna.repName = parsed.representativeName;
        if (parsed.industry) dna.industry = parsed.industry;
        if (parsed.establishedDate) dna.establishedMonth = parsed.establishedDate;
        if (parsed.address) dna.address = parsed.address;
        if (parsed.phone) dna.phone = parsed.phone;
        if (parsed.employees) dna.employees = parsed.employees;
        if (parsed.fiscalPeriod) dna.fiscalPeriod = parsed.fiscalPeriod;
        // 財務データの反映
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
        if (parsed.grossProfit) dna.grossProfit = parsed.grossProfit;
        if (parsed.cogs) dna.costOfSales = parsed.cogs;
        
        const ibd = (parsed.shortDebt||0) + (parsed.longDebt||0) + (parsed.bonds||0);
        if (ibd > 0) dna.totalDebt = ibd;

        this.currentFS = { ...parsed };
        Database.saveCompanyData(dna);

        // 企業基本情報の表示
        const companyItems = [
          ['会社名', dna.companyName], ['代表者', dna.repName],
          ['業種', dna.industry], ['設立', dna.establishedMonth],
          ['住所', dna.address], ['決算期', dna.fiscalPeriod],
          ['従業員数', dna.employees ? dna.employees + '名' : null],
          ['電話番号', dna.phone]
        ].filter(([,v]) => v != null);

        // 財務データの表示
        const items = [
          ['売上高', dna.annualRevenue], ['経常利益', dna.ordinaryProfit],
          ['総資産', dna.totalAssets], ['純資産', dna.netAssets],
          ['現預金', dna.cashDeposits], ['売掛金', dna.receivables],
          ['有利子負債', dna.totalDebt], ['棚卸資産', dna.inventory]
        ].filter(([,v]) => v != null);

        let html = `<div class="glass-card highlight" style="max-width:960px;margin:0 auto;">
          <div class="report-title">✅ PDFのAI読込・DNA反映が完了しました</div>`;

        // 企業基本情報セクション
        if (companyItems.length > 0) {
          html += `<div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--accent-primary);">🏢 企業基本情報</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-bottom:16px;">`;
          companyItems.forEach(([label, value]) => {
            html += `<div style="padding:8px;background:rgba(108,99,255,0.06);border-radius:6px;">
              <div style="font-size:9px;color:var(--text-muted);">${label}</div>
              <div style="font-size:12px;font-weight:700;">${value}</div>
            </div>`;
          });
          html += `</div>`;
        }

        // 財務データセクション
        html += `<div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--accent-green);">💰 財務データ</div>
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
