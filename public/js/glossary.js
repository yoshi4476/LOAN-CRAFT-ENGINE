/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 融資用語辞典モジュール
 * ============================================================ */

const Glossary = {
  terms: {
    'プロパー融資': { reading: 'ぷろぱーゆうし', desc: '信用保証協会の保証なしで、銀行が自らのリスクで行う融資。格付けが高い企業が対象。金利は低めだが審査は厳しい。', related: ['信用保証協会', '格付け'] },
    '信用保証協会': { reading: 'しんようほしょうきょうかい', desc: '中小企業の融資に対して公的に保証する機関。万が一返済できなくなった場合、銀行に代わって返済（代位弁済）する。保証料が必要。', related: ['代位弁済', '保証料'] },
    '代位弁済': { reading: 'だいいべんさい', desc: '信用保証協会が企業に代わって銀行に借入金を返済すること。代位弁済後は、協会が企業に対して求償権を行使する。事故情報として記録され、新規融資が極めて困難になる。', related: ['信用保証協会', '求償権'] },
    '稟議書': { reading: 'りんぎしょ', desc: '銀行の融資担当者が作成する内部文書。融資の可否を決裁するための判断材料をまとめたもの。企業概要・資金使途・返済能力・担保状況等を記載。', related: ['格付け', '自己査定'] },
    '格付け': { reading: 'かくづけ', desc: '銀行が企業の信用力を評価してランク付けすること。財務数値（定量評価）と定性評価を組み合わせてスコア化。格付けによって融資条件（金利・限度額）が変わる。', related: ['自己査定', '債務者区分'] },
    '自己査定': { reading: 'じこさてい', desc: '銀行が保有する融資債権の質を自ら評価する作業。金融庁の検査マニュアルに基づき、全融資先を「正常先」「要注意先」「破綻懸念先」「実質破綻先」「破綻先」に区分。', related: ['格付け', '債務者区分'] },
    '債務者区分': { reading: 'さいむしゃくぶん', desc: '自己査定の結果、企業を信用リスクの度合いで分類したもの。正常先→要注意先→要管理先→破綻懸念先→実質破綻先→破綻先の順にリスクが高い。', related: ['自己査定', '格付け'] },
    '債務償還年数': { reading: 'さいむしょうかんねんすう', desc: '有利子負債をキャッシュフロー（CF）で何年で返済できるかを示す指標。（有利子負債−正常運転資金）÷CFで算出。10年以内が目安、20年超は要注意。', related: ['キャッシュフロー', '有利子負債'] },
    'キャッシュフロー': { reading: 'きゃっしゅふろー', desc: '実際の現金の出入り。融資審査では「簡易CF＝税引後利益＋減価償却費」で計算することが多い。返済原資の根拠となる最重要指標。', related: ['債務償還年数', '返済原資'] },
    'リスケ': { reading: 'りすけ', desc: 'リスケジュールの略。返済条件の変更のこと。返済額の減額や返済期間の延長を金融機関に依頼する。リスケ実行中は新規融資が極めて困難。', related: ['条件変更', '経営改善計画'] },
    '経営者保証': { reading: 'けいえいしゃほしょう', desc: '法人の融資に対して代表者個人が連帯保証すること。「経営者保証ガイドライン」により、一定条件を満たせば不要にできる。法人と個人の資産分離、十分なCF、情報開示が条件。', related: ['連帯保証', '経営者保証ガイドライン'] },
    '経営者保証ガイドライン': { reading: 'けいえいしゃほしょうがいどらいん', desc: '2014年施行。3要件（①法人と個人の資産分離 ②法人のCFで返済可能 ③適時適切な情報開示）を満たせば、経営者保証なしの融資が可能。', related: ['経営者保証'] },
    '企業価値担保権': { reading: 'きぎょうかちたんぽけん', desc: '2026年5月施行の新制度。事業全体の価値（有形資産＋無形資産＋将来CF）を包括的に担保にできる。不動産なしでも事業力で融資が可能に。信託契約が必要。', related: ['事業性融資推進法', '無形資産'] },
    '事業性融資推進法': { reading: 'じぎょうせいゆうしすいしんほう', desc: '2026年5月施行。企業価値担保権を創設し、事業の将来性に着目した融資を促進する法律。不動産や経営者保証に過度に依存しない融資の実現を目指す。', related: ['企業価値担保権'] },
    'セーフティネット保証': { reading: 'せーふてぃねっとほしょう', desc: '売上減少等の外的要因で業況が悪化した中小企業を支援する保証制度。一般保証とは「別枠」で最大2.8億円の保証が利用可能。SN4号（災害）・SN5号（業況悪化業種）等がある。', related: ['信用保証協会', '別枠保証'] },
    '資本性劣後ローン': { reading: 'しほんせいれつごろーん', desc: '返済順位が劣後する融資。金融検査上、自己資本とみなされるため、BSの純資産が実質的に増加する。債務超過の解消に有効。公庫の「挑戦支援資本強化特例」が代表的。', related: ['自己資本', '債務超過'] },
    '正常運転資金': { reading: 'せいじょううんてんしきん', desc: '事業を営む上で恒常的に必要な運転資金。売掛金＋在庫−買掛金で算出。この範囲内の短期借入は「適正な借入」と評価される。', related: ['運転資金', '短期借入'] },
    'ABL': { reading: 'えーびーえる', desc: 'Asset Based Lending（動産・債権担保融資）の略。売掛金や在庫を担保にした融資。不動産担保が不足している場合の代替手段。担保管理コストが高いのが難点。', related: ['動産担保', '売掛金担保'] },
    'CRD': { reading: 'しーあーるでぃー', desc: '中小企業信用リスク情報データベース。全国の信用保証協会が保有する中小企業の財務データベース。保証審査のスコアリングに利用される。', related: ['信用保証協会', 'スコアリング'] },
    '掛目': { reading: 'かけめ', desc: '担保評価額に対して実際に融資可能とする割合。例：不動産評価額1億円×掛目70%＝融資可能額7,000万円。資産の種類やリスクに応じて設定される。', related: ['担保', '融資限度額'] },
    'コベナンツ': { reading: 'こべなんつ', desc: '財務制限条項。融資契約に付される特約で、「純資産○○万円以上を維持する」「自己資本比率○%以上」等の条件。違反すると期限の利益を喪失する可能性がある。', related: ['企業価値担保権', '財務制限条項'] },
    '認定支援機関': { reading: 'にんていしえんきかん', desc: '正式名称「認定経営革新等支援機関」。中小企業の経営支援に精通した税理士・会計士等を国が認定。連携すると保証料優遇等のメリットがある。', related: ['経営改善計画', '保証料優遇'] },
  },

  // 用語検索・表示
  lookup(term) {
    // 完全一致
    if (this.terms[term]) {
      return this.renderTerm(term, this.terms[term]);
    }
    // 部分一致検索
    const matches = Object.entries(this.terms).filter(([key, val]) =>
      key.includes(term) || val.reading?.includes(term) || val.desc.includes(term)
    );
    if (matches.length === 0) {
      return Utils.createAlert('warning', '⚠️', `「${Utils.escapeHtml(term)}」に該当する用語が見つかりませんでした。`);
    }
    if (matches.length === 1) {
      return this.renderTerm(matches[0][0], matches[0][1]);
    }
    // 複数候補
    let html = `<div class="report-title">📖 検索結果：${matches.length}件</div>`;
    matches.forEach(([key, val]) => {
      html += `<div class="glass-card" style="margin:8px 0;padding:12px 16px;cursor:pointer;" onclick="App.executeCommand('/用語 ${key}')">
        <div style="font-weight:600;font-size:14px;">${key}</div>
        <div style="font-size:12px;color:var(--text-muted);">${val.desc.substring(0, 60)}...</div>
      </div>`;
    });
    return html;
  },

  renderTerm(name, data) {
    let html = `<div class="glass-card">
      <div style="font-size:24px;font-weight:800;margin-bottom:4px;">${name}</div>
      ${data.reading ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">読み：${data.reading}</div>` : ''}
      <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;margin-bottom:16px;">${data.desc}</div>`;
    if (data.related?.length > 0) {
      html += `<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">関連用語：
        ${data.related.map(r => `<button class="btn btn-sm btn-ghost" onclick="App.executeCommand('/用語 ${r}')" style="font-size:11px;">${r}</button>`).join(' ')}
      </div>`;
    }
    html += `</div>`;
    return html;
  },

  // 全用語リスト表示
  showAll() {
    let html = `<div class="glass-card">
      <div class="report-title">📖 融資用語辞典（${Object.keys(this.terms).length}語）</div>
      <p style="color:var(--text-secondary);font-size:12px;margin-bottom:12px;">用語をクリックすると詳細説明が表示されます。<code>/用語 [用語名]</code> でも検索できます。</p>`;

    const sorted = Object.entries(this.terms).sort((a, b) => a[0].localeCompare(b[0], 'ja'));
    sorted.forEach(([key, val]) => {
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-secondary);cursor:pointer;" onclick="App.executeCommand('/用語 ${key}')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;font-size:13px;color:var(--primary-light);">${key}</span>
          <span style="font-size:11px;color:var(--text-muted);">${val.reading || ''}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${val.desc.substring(0, 80)}${val.desc.length > 80 ? '...' : ''}</div>
      </div>`;
    });

    html += `</div>`;
    return html;
  }
};
