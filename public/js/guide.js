/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 総合ガイドモジュール
 * カテゴリ別の使い方ガイド＋おすすめの使い方
 * ============================================================ */

const Guide = {

  categories: [
    { id: 'overview', icon: '🚀', title: 'はじめに', desc: 'システムの概要と推奨フロー' },
    { id: 'dna', icon: '🧬', title: '企業DNA登録', desc: '企業情報の入力方法と審査基準の解説' },
    { id: 'rating', icon: '📊', title: '格付け診断', desc: '自己査定の読み方と改善方法' },
    { id: 'matrix', icon: '🎯', title: '審査マトリックス', desc: '通過確率の見方と対策' },
    { id: 'loan', icon: '🏦', title: '融資方法選定', desc: '最適な融資スキームの選び方' },
    { id: 'docs', icon: '📄', title: '資料作成', desc: 'AI活用のコツと銀行提出の注意点' },
    { id: 'strategy', icon: '🤝', title: '戦略・交渉', desc: '金利交渉・保証解除の実践手順' },
    { id: 'admin', icon: '⚙️', title: '管理・設定', desc: 'データ管理・API設定・バックアップ' },
    { id: 'financial', icon: '📊', title: '決算書分析', desc: '3期分の決算書入力と自動財務分析' },
    { id: 'bankdb', icon: '🏦', title: '金融機関DB', desc: '金融機関の融資条件・適格性判定' },
    { id: 'scenario', icon: '⚖️', title: 'シナリオ比較', desc: '複数融資パターンの比較検討' },
  ],

  // ガイド一覧表示
  showIndex() {
    let html = `<div class="glass-card highlight">
      <div class="report-title">📖 LOAN CRAFT ENGINE 総合ガイド</div>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px;">
        各カテゴリをクリックすると詳細ガイドが表示されます。
      </p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">`;

    this.categories.forEach(c => {
      html += `<div class="glass-card" style="padding:16px;cursor:pointer;" onclick="Guide.showCategory('${c.id}')">
        <div style="font-size:24px;margin-bottom:8px;">${c.icon}</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${c.title}</div>
        <div style="font-size:12px;color:var(--text-secondary);">${c.desc}</div>
      </div>`;
    });

    html += `</div></div>`;
    App.addSystemMessage(html);
  },

  showCategory(id) {
    const content = this.content[id];
    if (!content) return;
    let html = `<div class="glass-card highlight">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <button class="btn btn-sm btn-ghost" onclick="Guide.showIndex()">← 一覧へ</button>
        <div class="report-title" style="margin:0;">${content.icon} ${content.title}</div>
      </div>`;
    // 各セクション
    content.sections.forEach(sec => {
      html += `<div style="margin-bottom:20px;">
        <div style="font-size:14px;font-weight:700;color:var(--primary-light);margin-bottom:8px;border-left:3px solid var(--primary);padding-left:10px;">${sec.heading}</div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;">${sec.body}</div>
      </div>`;
    });
    // おすすめの使い方
    if (content.tips) {
      html += `<div style="background:linear-gradient(135deg,rgba(108,99,255,0.08),rgba(0,210,255,0.05));border:1px solid var(--border-primary);border-radius:var(--border-radius-md);padding:16px;margin-top:12px;">
        <div style="font-size:13px;font-weight:700;color:var(--accent-gold);margin-bottom:8px;">💡 おすすめの使い方</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;">${content.tips}</div>
      </div>`;
    }
    html += `</div>`;
    App.addSystemMessage(html);
  },

  // ガイドコンテンツ
  content: {
    overview: {
      icon: '🚀', title: 'はじめに — システム概要と推奨フロー',
      sections: [
        { heading: 'LOAN CRAFT ENGINEとは', body: '銀行・信用保証協会・日本政策金融公庫の3機関の審査ロジックを逆算し、<strong>融資獲得の確率を最大化</strong>する包括支援システムです。20年以上の融資実務経験を持つ5名の専門家の知見を統合しています。' },
        { heading: '推奨フロー', body: `
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div>① <code>/DNA</code> → 企業DNAを登録（自動格付け・成功率が即表示）</div>
            <div>② <code>/DNAプロフィール</code> → 自動格付け・融資成功率を確認</div>
            <div>③ <code>/診断</code> → 詳細な格付け自己査定</div>
            <div>④ <code>/マトリックス</code> → 審査通過確率の判定</div>
            <div>⑤ <code>/融資方法</code> → 最適な融資スキーム選定</div>
            <div>⑥ <code>/資料ALL</code> or <code>/AI資料</code> → 資料一括作成</div>
            <div>⑦ <code>/戦略</code> → 総合戦略レポート</div>
            <div>⑧ <code>/面談準備</code> → 銀行面談のシナリオ準備</div>
          </div>` },
        { heading: '全コマンド一覧', body: '<code>/help</code> で全コマンドの一覧を表示できます。<code>Ctrl+K</code> でコマンドパレットを開くと検索可能です。' },
      ],
      tips: '初めての方は <strong>/DNA</strong> から始めましょう。企業DNAを入力するだけで自動格付けが算出され、各融資方法の成功率がわかります。ヒアリング（/start）は省略可能です。',
    },
    dna: {
      icon: '🧬', title: '企業DNA登録 — 3機関の審査基準を網羅',
      sections: [
        { heading: '企業DNAとは', body: '銀行・保証協会・公庫の3機関が審査で確認する全項目を8セクションにまとめた包括的な企業プロフィールです。<br>入力すると<strong>自動格付け</strong>と<strong>6種類の融資方法の成功率</strong>が即座に表示されます。' },
        { heading: '8つのセクション', body: `
          <div>🏢 <strong>企業アイデンティティ</strong> — 会社名・業種・所在地・許認可</div>
          <div>👤 <strong>経営者DNA</strong> — 経歴・資格・自己資金・信用情報</div>
          <div>💼 <strong>事業DNA</strong> — 事業モデル・競争優位性・市場</div>
          <div>📊 <strong>財務DNA</strong> — 決算書の主要数値（★最も重要）</div>
          <div>🔐 <strong>信用・取引DNA</strong> — 取引銀行・保証協会・返済状況</div>
          <div>🏠 <strong>担保・保全DNA</strong> — 不動産・ABL対象資産</div>
          <div>⚠️ <strong>リスクDNA</strong> — 税金滞納・リスケ・信用事故</div>
          <div>🚀 <strong>成長・将来性DNA</strong> — 事業計画・資金使途・返済原資</div>` },
        { heading: '重要度インジケーターの見方', body: '各フィールドの右に🏦🛡️🏛️（銀行・保証協会・公庫）の重要度が表示されています。<br>🔴 = 最重要（この項目が審査の合否を分ける）<br>🟡 = 重要<br>⚪ = 参考項目' },
        { heading: '3機関の審査の違い', body: `
          <strong>🏦 銀行</strong>：格付け（定量80%）で9割決まる。財務DNA重視。<br>
          <strong>🛡️ 保証協会</strong>：CRDスコアが核心。税金完納が絶対条件。<br>
          <strong>🏛️ 公庫</strong>：面談が最重要。経営者DNA・事業計画重視。` },
      ],
      tips: '全セクションを埋める必要はありません。まず<strong>📊 財務DNA</strong>と<strong>⚠️ リスクDNA</strong>を埋めれば自動格付けが表示されます。そこから弱い指標を改善していく使い方がおすすめです。',
    },
    rating: {
      icon: '📊', title: '格付け診断 — 自己査定の読み方と改善',
      sections: [
        { heading: '格付けとは', body: '銀行が融資先企業を10段階のランクに分類するシステムです。<strong>格付けが全て</strong>と言って過言ではなく、格付けが低ければどんなに良い計画を持っていっても否決されます。' },
        { heading: '5カテゴリの評価配分', body: `
          <strong>安全性（25点）</strong>：自己資本比率・流動比率・ギアリング比率・債務償還年数<br>
          <strong>収益性（25点）</strong>：経常利益率・ROA・営業利益の黒字/赤字・ICR<br>
          <strong>成長性（15点）</strong>：売上増加率・利益増加率<br>
          <strong>返済能力（20点）</strong>：CF倍率・運転資金・FCF<br>
          <strong>効率性（15点）</strong>：総資本回転率・売上債権回転期間` },
        { heading: '格付け改善のポイント', body: `
          ① <strong>営業利益を黒字に</strong>（赤字は本業で稼げないと判断）<br>
          ② <strong>債務償還年数を10年以内に</strong>（銀行が最重視する指標）<br>
          ③ <strong>自己資本比率20%以上を目指す</strong>（債務超過は一発アウト）<br>
          ④ <strong>月次決算の導入</strong>（銀行の定性評価で高評価）` },
      ],
      tips: '審査方式によって各カテゴリのウェイトが変わります。まず <code>/審査方式</code> で対象金融機関に合った方式を選び、その後 <code>/診断</code> すると最適化された結果が出ます。',
    },
    matrix: {
      icon: '🎯', title: '審査マトリックス — 通過確率の読み方',
      sections: [
        { heading: '審査マトリックスとは', body: '「債務者格付け」×「案件スコア」の2軸で融資の通過確率を判定するシステムです。格付けが良くても案件が悪ければ通りません。' },
        { heading: '案件スコアの4大要素', body: `
          ① <strong>資金使途</strong>：前向き資金◎、運転資金○、赤字補填×<br>
          ② <strong>返済原資</strong>：CFから返済可能◎、計画ベース△、不明×<br>
          ③ <strong>担保・保証</strong>：不動産◎、預金◎、保証協会○<br>
          ④ <strong>融資条件</strong>：金額・期間が年商/CFに対して妥当か` },
      ],
      tips: '格付けが良くない場合は、案件スコアを上げることで通過確率を改善できます。特に<strong>資金使途の明確化</strong>と<strong>返済原資の説明</strong>が鍵です。',
    },
    loan: {
      icon: '🏦', title: '融資方法選定 — 最適スキームの選び方',
      sections: [
        { heading: '6つの融資方法', body: `
          🏦 <strong>プロパー融資</strong> — 銀行直接融資。金利最低だが審査最厳格<br>
          🛡️ <strong>保証協会付融資</strong> — 中小企業の標準的選択肢。審査は比較的通りやすい<br>
          🏛️ <strong>公庫融資</strong> — 創業・赤字企業にも門戸。面談重視<br>
          🏫 <strong>制度融資</strong> — 自治体＋保証協会。利子補給で実質低利<br>
          📦 <strong>ABL</strong> — 売掛金・在庫を担保。不動産がなくても可能<br>
          🏠 <strong>不動産担保</strong> — 格付けが低くても担保でカバー可能` },
        { heading: '選び方の基準', body: `
          格付けA以上 → プロパーを第一に交渉<br>
          格付けB〜C → 保証付き or 公庫融資<br>
          格付けD以下 → 公庫のセーフティネット or ABL<br>
          創業 → 公庫の新規開業資金 + 制度融資の併用` },
      ],
      tips: 'DNAプロフィール（<code>/DNAプロフィール</code>）の融資成功率マトリックスを見て、<strong>成功率70%以上の方法</strong>を優先的に検討しましょう。複数の方法を組み合わせるのも有効です。',
    },
    docs: {
      icon: '📄', title: '資料作成 — AI活用と銀行提出の注意点',
      sections: [
        { heading: '生成できる10種類の資料', body: `
          エグゼクティブサマリー / 企業概要書 / 資金繰り表 / 事業計画書 / 借入金一覧 / 返済計画 / 業績推移 / 代表者プロフィール / 取引深耕提案 / 想定Q&A` },
        { heading: 'AI資料生成', body: '<code>/AI資料</code> でOpenAI APIを使った高品質な資料を自動生成できます。事前に <code>/管理</code> からAPIキーを設定してください。' },
        { heading: '銀行提出の注意点', body: `
          ① <strong>数値の整合性</strong>：<code>/整合チェック</code>で必ず確認<br>
          ② <strong>手書き修正は避ける</strong>：印刷してそのまま提出<br>
          ③ <strong>代表者が内容を全て理解していること</strong>：特に公庫面談で必要` },
      ],
      tips: 'まず <code>/資料ALL</code> でテンプレートを一括生成し、<code>/整合チェック</code> で矛盾がないか確認。その後、AI資料（<code>/AI資料</code>）で磨き上げるのが最も効率的です。',
    },
    strategy: {
      icon: '🤝', title: '戦略・交渉 — 金利交渉と保証解除の実践',
      sections: [
        { heading: '銀行面談の準備', body: '<code>/面談準備</code> で面談シナリオが生成されます。想定Q&Aは <code>/Q&A</code> で確認。公庫面談では「自分の言葉で説明できるか」が最重要です。' },
        { heading: '金利交渉のポイント', body: `
          ① 格付けが良いことが前提（B+以上が理想）<br>
          ② 他行の条件提示を活用（相見積もり）<br>
          ③ メイン口座の集約を交渉材料に<br>
          ④ <code>/金利交渉</code> で交渉シナリオを確認` },
        { heading: '経営者保証解除', body: '<code>/保証解除</code> で4条件を確認。2023年からの経営者保証改革で解除のハードルは下がっています。' },
      ],
      tips: '担当者は「味方」にしましょう。稟議書を書くのは担当者です。<strong>書きやすい材料を全て渡す</strong>ことが最大の戦略です。<code>/資料ALL</code> の出力をそのまま渡せます。',
    },
    admin: {
      icon: '⚙️', title: '管理・設定 — データ管理とAPI設定',
      sections: [
        { heading: 'データ管理', body: `
          <code>/エクスポート</code> — 全データをJSONファイルに保存<br>
          <code>/インポート</code> — JSONファイルからデータを復元<br>
          <code>/クリア</code> — データを初期化（確認ステップあり）<br>
          データはブラウザのLocalStorageに保存されます。定期的なエクスポートを推奨します。` },
        { heading: 'OpenAI API設定', body: '<code>/管理</code> を開き「🔑 API設定」タブからOpenAI APIキーを登録すると、AI資料生成（<code>/AI資料</code>）が利用可能になります。' },
        { heading: 'テーマ切替', body: 'ヘッダーの「🌓 テーマ」ボタンでダーク/ライトモードを切り替えられます。設定は自動保存されます。' },
      ],
      tips: '週に1回は <code>/エクスポート</code> でバックアップを取りましょう。ブラウザのキャッシュクリアでデータが消える場合があります。',
    },
  },
    financial: {
      icon: '📊', title: '決算書分析 — 3期分の自動財務分析',
      sections: [
        { heading: '使い方', body: '<code>/決算分析</code> で決算書入力フォームが開きます。第1期（直近）〜第3期（前々期）の<strong>P/L（損益計算書）</strong>と<strong>B/S（貸借対照表）</strong>の数値を入力してください。' },
        { heading: '自動分析される12指標', body: '自己資本比率・流動比率・ギアリング比率・債務償還年数・営業利益率・経常利益率・ROA・ICR（利払倍率）・総資本回転率・売掛回転日数・年間CF・月返済可能額' },
        { heading: 'DNAへの反映', body: '分析後に「🧬 DNAに反映」ボタンを押すと、直近期の決算データが企業DNAに自動転記されます。格付け診断・資料生成の精度が大幅に向上します。' },
      ],
      tips: '決算書は<strong>直近3期分</strong>を入力すると、推移の傾向が見えます。銀行は「改善傾向」を重視するため、赤字→黒字転換などのトレンドが重要です。',
    },
    bankdb: {
      icon: '🏦', title: '金融機関DB — 融資条件と適格性判定',
      sections: [
        { heading: '使い方', body: '<code>/金融機関</code> で12機関の融資条件が一覧表示されます。フィルターボタンで種別（メガバンク/地銀/信金/公庫/保証協会/制度融資）を絞り込めます。' },
        { heading: '適格性判定', body: '企業DNAに格付けが設定されていると、各機関に✅申込可能 / 🟡条件付き / 🔴困難の適格性が自動表示されます。' },
        { heading: '掲載機関', body: '三菱UFJ・みずほ・三井住友（メガバンク）／地方銀行・信用金庫／公庫（一般・新創業・経営力強化）／保証協会（一般・セーフティネット4号/5号）／制度融資' },
      ],
      tips: '格付けが低い場合は<strong>信用金庫</strong>や<strong>日本政策金融公庫</strong>から始めましょう。メインバンクを作ってから、プロパー融資にステップアップするのが王道です。',
    },
    scenario: {
      icon: '⚖️', title: 'シナリオ比較 — 最適な融資パターンを見つける',
      sections: [
        { heading: '使い方', body: '<code>/シナリオ</code> で比較画面が開きます。シナリオA/B/C...に金融機関・金額・金利・期間・保証・担保を入力し「📊 比較分析」ボタンで結果を表示。' },
        { heading: '分析項目', body: '月額返済額・総返済額・利息総額・保証料概算・総コスト・CF返済比率（月間CFに対する返済額の比率）を自動計算。最もコストが低いシナリオに⭐が付きます。' },
        { heading: '活用例', body: '「A銀行プロパー3000万 金利1.5%」vs「B公庫2000万 金利2.0% + C保証協会1000万」のような組み合わせを比較して最適な調達戦略を策定できます。' },
      ],
      tips: 'CF返済比率は<strong>50%以下</strong>が理想です。70%を超えると資金繰りが厳しくなるリスクがあります。複数のシナリオで最も余裕のあるパターンを選びましょう。',
    },
  }
};
