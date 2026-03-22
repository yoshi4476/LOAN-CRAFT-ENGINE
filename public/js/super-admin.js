/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 最高管理者コンソール
 * ユーザー管理／ライセンス管理／データ保護状況／管理者ガイド
 * ============================================================ */

const SuperAdmin = {
  SUPER_EMAIL: 'y.wakata.linkdesign@gmail.com',

  // 最高管理者判定（ログイン不要モード対応）
  isSuperAdmin() {
    const user = ApiClient.getUser();
    // ログイン不要モード（userがnull）の場合は最高管理者として動作
    if (!user) return true;
    return user.email === this.SUPER_EMAIL;
  },

  /* ================================================================
   * メインコンソール表示（タブ形式）
   * ================================================================ */
  async show(tab = 'users') {
    if (!this.isSuperAdmin()) {
      App.addSystemMessage(Utils.createAlert('error', '🚫', '最高管理者権限が必要です。'));
      return;
    }

    // チャットエリアをクリア（タブ切替時の連なり防止）
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) chatMessages.innerHTML = '';

    let html = `<div class="glass-card highlight">
      <div class="report-title">📊 最高管理者コンソール</div>
      <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;" id="superAdminTabs">
        ${['users', 'dashboard', 'license', 'protection', 'settings', 'guide', 'saas'].map(t => {
          const labels = { users:'👥 ユーザー', dashboard:'📋 加入状況', license:'🔑 ライセンス', protection:'🛡️ データ保護', settings:'⚙️ 設定', guide:'📖 ガイド', saas:'🚀 SaaS管理' };
          return `<button class="btn ${tab === t ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="SuperAdmin.show('${t}')">${labels[t]}</button>`;
        }).join('')}
      </div>
      <div id="superAdminContent">`;

    try {
      switch(tab) {
        case 'users': html += await this.renderUsers(); break;
        case 'dashboard': html += await this.renderDashboard(); break;
        case 'license': html += await this.renderLicense(); break;
        case 'protection': html += this.renderProtection(); break;
        case 'settings': html += this.renderSettings(); break;
        case 'guide': html += this.renderGuide(); break;
        case 'saas': html += this.renderSaaS(); break;
      }
    } catch(e) {
      html += Utils.createAlert('info', 'ℹ️', 'サーバー未接続のためローカルモードで動作中です。データはブラウザに保存されます。');
    }

    html += `</div></div>`;
    App.addSystemMessage(html);
  },

  /* ================================================================
   * ユーザー管理タブ
   * ================================================================ */
  async renderUsers() {
    const data = await ApiClient.getAdminUsers({ limit: 20 });
    const users = data.users || [];

    let html = `<div class="report-subtitle">👥 ユーザー一覧 (${data.total || 0}件)</div>`;

    // 検索バー
    html += `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <input id="saUserSearch" type="text" placeholder="氏名・メールで検索" style="flex:1;min-width:180px;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
      <select id="saUserPlan" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
        <option value="">全プラン</option>
        <option value="Free">Free</option><option value="Basic">Basic</option>
        <option value="Pro">Pro</option><option value="Enterprise">Enterprise</option>
      </select>
      <select id="saUserStatus" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
        <option value="">全ステータス</option>
        <option value="Active">Active</option><option value="Suspended">Suspended</option>
        <option value="Expired">Expired</option><option value="Deleted">Deleted</option>
      </select>
      <button class="btn btn-primary btn-sm" onclick="SuperAdmin.searchUsers()">🔍 検索</button>
      <button class="btn btn-secondary btn-sm" onclick="SuperAdmin.showAddUserForm()">➕ 新規追加</button>
      <button class="btn btn-secondary btn-sm" onclick="SuperAdmin.exportCSV()">📥 CSV出力</button>
      <button class="btn btn-secondary btn-sm" onclick="SuperAdmin.bulkRenewSelected()">📅 一括延長</button>
    </div>`;

    // ユーザーテーブル
    if (users.length > 0) {
      html += `<div style="overflow-x:auto;"><table class="data-table"><thead><tr>
        <th style="width:30px;"><input type="checkbox" id="saSelectAll" onchange="SuperAdmin.toggleSelectAll(this)" title="全選択"></th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('id')">ID ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('name')">氏名 ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('email')">メール ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('plan')">プラン ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('status')">ステータス ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('joined_at')">加入日 ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('renewal_date')">更新期限 ⇅</th>
        <th style="cursor:pointer;" onclick="SuperAdmin.sortBy('remaining_days')">残日数 ⇅</th>
        <th>最終ログイン</th><th>操作</th>
      </tr></thead><tbody>`;

      users.forEach(u => {
        const remaining = u.remaining_days;
        const renewalColor = remaining <= 7 ? 'var(--accent-red)' : remaining <= 30 ? 'var(--accent-gold)' : 'var(--accent-green)';
        const statusBadge = {
          Active: '<span style="color:var(--accent-green);font-weight:600;">●Active</span>',
          Suspended: '<span style="color:var(--accent-gold);font-weight:600;">⏸Suspended</span>',
          Expired: '<span style="color:var(--accent-red);font-weight:600;">✕Expired</span>',
          Deleted: '<span style="color:var(--text-muted);font-weight:600;">🗑Deleted</span>',
        }[u.status] || u.status;

        const expiredBadge = remaining != null && remaining <= 0 ? '<span style="background:var(--accent-red);color:#fff;padding:1px 6px;border-radius:8px;font-size:10px;margin-left:4px;">期限切れ</span>' : '';
        html += `<tr style="${remaining <= 7 ? 'background:rgba(239,68,68,0.08);' : remaining <= 30 ? 'background:rgba(245,158,14,0.08);' : ''}">
          <td><input type="checkbox" class="sa-user-check" data-uid="${u.id}" data-uname="${u.name || ''}"></td>
          <td style="font-size:11px;color:var(--text-muted);">${u.id}</td>
          <td style="font-weight:600;">${u.name || '—'}</td>
          <td style="font-size:12px;">${u.email}</td>
          <td><span style="padding:2px 8px;border-radius:12px;font-size:11px;background:var(--bg-tertiary);font-weight:600;">${u.plan || 'Free'}</span></td>
          <td>${statusBadge}${expiredBadge}</td>
          <td style="font-size:11px;">${u.joined_at ? new Date(u.joined_at).toLocaleDateString('ja-JP') : '—'}</td>
          <td style="font-size:11px;">${u.renewal_date ? new Date(u.renewal_date).toLocaleDateString('ja-JP') : '—'}</td>
          <td style="font-weight:700;color:${renewalColor};">${remaining != null ? remaining + '日' : '—'}</td>
          <td style="font-size:11px;">${u.last_login ? new Date(u.last_login).toLocaleDateString('ja-JP') : '—'}</td>
          <td style="white-space:nowrap;">
            <button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:11px;" onclick="SuperAdmin.showEditUserForm(${u.id})">✏️</button>
            ${u.deleted_at
              ? `<button class="btn btn-sm" style="padding:2px 6px;font-size:11px;background:var(--accent-green);color:#fff;" onclick="SuperAdmin.restoreUser(${u.id})">↩️</button>`
              : `<button class="btn btn-sm" style="padding:2px 6px;font-size:11px;background:var(--accent-red);color:#fff;" onclick="SuperAdmin.confirmDeleteUser(${u.id}, '${u.name}')">🗑️</button>`
            }
          </td>
        </tr>`;
      });
      html += `</tbody></table></div>`;

      // ページネーション
      const totalPages = Math.ceil((data.total || 0) / (data.limit || 20));
      if (totalPages > 1) {
        html += `<div style="display:flex;justify-content:center;gap:4px;margin-top:12px;">`;
        for (let i = 1; i <= totalPages; i++) {
          const isActive = i === (data.page || 1);
          html += `<button class="btn ${isActive ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="SuperAdmin.loadPage(${i})">${i}</button>`;
        }
        html += `</div>`;
      }
    } else {
      html += `<div style="text-align:center;padding:24px;color:var(--text-muted);">ユーザーが見つかりません</div>`;
    }

    return html;
  },

  /* ================================================================
   * 加入状況ダッシュボード
   * ================================================================ */
  async renderDashboard() {
    const data = await ApiClient.getAdminDashboard();

    let html = `<div class="report-subtitle">📋 加入状況ダッシュボード</div>`;

    // サマリーカード
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--primary-light);">${data.totalUsers || 0}</div>
        <div style="font-size:11px;color:var(--text-muted);">総ユーザー</div>
      </div>
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--accent-green);">${data.activeUsers || 0}</div>
        <div style="font-size:11px;color:var(--text-muted);">アクティブ</div>
      </div>
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--accent-gold);">${data.expiringSoon || 0}</div>
        <div style="font-size:11px;color:var(--text-muted);">期限30日以内</div>
      </div>
      <div class="glass-card" style="padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:var(--accent-cyan);">$${(data.apiStats?.totalCost || 0).toFixed(2)}</div>
        <div style="font-size:11px;color:var(--text-muted);">API総コスト</div>
      </div>
    </div>`;

    // プラン別分布
    if (data.planDist && data.planDist.length > 0) {
      html += `<div style="font-size:13px;font-weight:600;margin:12px 0 8px;">プラン別分布</div>`;
      const colors = { Free:'var(--text-muted)', Basic:'var(--accent-cyan)', Pro:'var(--accent-gold)', Enterprise:'var(--primary-light)' };
      data.planDist.forEach(p => {
        const pct = data.totalUsers > 0 ? Math.round(p.count / data.totalUsers * 100) : 0;
        html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="width:80px;font-size:12px;font-weight:600;color:${colors[p.plan] || 'var(--text-secondary)'};">${p.plan}</span>
          <div style="flex:1;height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${colors[p.plan] || 'var(--text-muted)'};border-radius:4px;"></div>
          </div>
          <span style="font-size:12px;font-weight:600;width:60px;text-align:right;">${p.count}名 (${pct}%)</span>
        </div>`;
      });
    }

    // 最近の監査ログ
    if (data.recentLogs && data.recentLogs.length > 0) {
      html += `<div style="font-size:13px;font-weight:600;margin:16px 0 8px;">📋 最近の監査ログ</div>`;
      html += `<div style="max-height:300px;overflow-y:auto;">`;
      data.recentLogs.slice(0, 15).forEach(l => {
        html += `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-secondary);font-size:12px;">
          <span style="min-width:120px;color:var(--text-muted);">${l.created_at ? new Date(l.created_at).toLocaleString('ja-JP') : ''}</span>
          <span style="font-weight:600;">${l.user_name || '—'}</span>
          <span style="color:var(--text-secondary);">${l.action} ${l.detail || ''}</span>
        </div>`;
      });
      html += `</div>`;
    }

    return html;
  },

  /* ================================================================
   * ライセンス管理
   * ================================================================ */
  async renderLicense() {
    const data = await ApiClient.getAdminUsers({ limit: 100 });
    const users = (data.users || []).filter(u => !u.deleted_at);

    let html = `<div class="report-subtitle">🔑 ライセンス・契約管理</div>`;

    // 期限が近いユーザー一覧
    const expiring = users.filter(u => u.remaining_days != null && u.remaining_days <= 30).sort((a, b) => a.remaining_days - b.remaining_days);

    if (expiring.length > 0) {
      html += `<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--accent-gold);">⚠️ 契約更新期限が近いユーザー (${expiring.length}名)</div>`;
      html += `<table class="data-table"><thead><tr>
        <th>氏名</th><th>メール</th><th>プラン</th><th>更新期限</th><th>残日数</th><th>操作</th>
      </tr></thead><tbody>`;
      expiring.forEach(u => {
        const color = u.remaining_days <= 7 ? 'var(--accent-red)' : 'var(--accent-gold)';
        html += `<tr>
          <td style="font-weight:600;">${u.name}</td>
          <td style="font-size:12px;">${u.email}</td>
          <td>${u.plan || 'Free'}</td>
          <td>${u.renewal_date ? new Date(u.renewal_date).toLocaleDateString('ja-JP') : '—'}</td>
          <td style="font-weight:700;color:${color};">${u.remaining_days}日</td>
          <td><button class="btn btn-primary btn-sm" style="font-size:11px;" onclick="SuperAdmin.showRenewForm(${u.id}, '${u.name}', '${u.renewal_date}')">📅 延長</button></td>
        </tr>`;
      });
      html += `</tbody></table>`;
    } else {
      html += `<div style="text-align:center;padding:16px;color:var(--accent-green);">✅ 30日以内に更新期限のあるユーザーはいません</div>`;
    }

    // 新規ライセンス発行ボタン
    html += `<div style="margin-top:16px;">
      <button class="btn btn-primary" onclick="SuperAdmin.showAddUserForm()">➕ 新規ライセンス発行</button>
    </div>`;

    return html;
  },

  /* ================================================================
   * データ保護状況
   * ================================================================ */
  renderProtection() {
    let html = `<div class="report-subtitle">🛡️ データ保護状況</div>`;

    const checks = [
      { label: 'ソフトデリート（論理削除）', status: '✅', detail: '全テーブルにdeleted_at/deleted_byカラム実装済み。DELETE文の使用を全面禁止。全クエリにWHERE deleted_at IS NULLを自動付与。' },
      { label: 'マイグレーション安全規約', status: '✅', detail: 'DROP TABLE/DROP COLUMN/TRUNCATE禁止。カラム名に_deprecated_YYYYMMDDサフィックスでリネーム→90日保持→最高管理者承認後削除。' },
      { label: '監査ログシステム', status: '✅', detail: 'ユーザーの追加・編集・削除・ログイン・設定変更を全て記録。変更前後の値を保持。' },
      { label: 'トランザクション整合性', status: '✅', detail: 'ユーザー追加時にDBレコード＋ライセンスを同一トランザクションで作成。障害時は自動ロールバック。' },
      { label: '認証・認可チェック', status: '✅', detail: 'JWT認証＋最高管理者権限チェックをミドルウェアで適用。全APIエンドポイントに同一権限チェック。' },
      { label: 'データベースバックアップ', status: '✅', detail: 'PostgreSQL（Railway）のマネージドバックアップ。自動日次バックアップ＋手動スナップショット対応。' },
      { label: 'ファイルバージョニング', status: '✅', detail: 'アップロード時はバージョン管理。上書き時も旧バージョンを保持。バージョンの物理削除禁止。' },
      { label: '暗号化', status: '✅', detail: 'パスワードはbcryptハッシュ。JWTトークンはHS256署名。DB接続はSSL/TLS暗号化。' },
    ];

    checks.forEach(c => {
      html += `<div style="display:flex;gap:8px;padding:10px;margin-bottom:4px;background:var(--bg-secondary);border-radius:8px;">
        <span style="font-size:16px;">${c.status}</span>
        <div>
          <div style="font-size:13px;font-weight:600;">${c.label}</div>
          <div style="font-size:11px;color:var(--text-muted);">${c.detail}</div>
        </div>
      </div>`;
    });

    // 保護ポリシー概要
    html += `<div style="margin-top:16px;padding:12px;background:var(--bg-tertiary);border-radius:8px;border-left:3px solid var(--primary);">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">📋 データ保護ポリシー</div>
      <div style="font-size:12px;line-height:1.8;color:var(--text-secondary);">
        <strong>保護対象：</strong>ユーザーがアップロード・作成した全データ（ファイル・設定・コンテンツ・操作履歴）<br>
        <strong>絶対原則：</strong>いかなるシステム修正・アップデート・マイグレーションにおいてもユーザーデータの削除・破壊・上書きは禁止<br>
        <strong>削除復元：</strong>論理削除後90日間は復元可能。「ユーザー管理」タブから復元ボタンで即座に復旧<br>
        <strong>バックアップ保持：</strong>PostgreSQL日次自動バックアップ（Railway管理）
      </div>
    </div>`;

    // 手動バックアップ
    html += `<div style="margin-top:16px;">
      <button class="btn btn-primary" onclick="SuperAdmin.manualBackup()">💾 手動バックアップ実行</button>
      <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">PostgreSQLデータのスナップショットを取得</span>
    </div>`;

    return html;
  },

  /* ================================================================
   * 管理者専用ガイド
   * ================================================================ */
  renderGuide() {
    return `<div class="report-subtitle">📖 管理者専用ガイド</div>
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🔧 トラブルシューティング</div>
      <div style="font-size:12px;line-height:1.8;color:var(--text-secondary);">
        <strong>Q: ユーザーがログインできない</strong><br>
        A: ①パスワードリセット ②ステータスがActive確認 ③deleted_atがNULL確認<br><br>
        <strong>Q: APIエラーが発生する</strong><br>
        A: ①OpenAI APIキーの有効性確認 ②レート制限の有無確認 ③サーバーログ確認<br><br>
        <strong>Q: データが消えた</strong><br>
        A: 物理削除は行っていません。deleted_atがセットされていればユーザー一覧の「Deleted」フィルタで復元可能
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🔄 データ復旧手順</div>
      <div style="font-size:12px;line-height:1.8;color:var(--text-secondary);">
        1. バックアップDBファイル（lce.db）をserver/data/に配置<br>
        2. サーバーを再起動: <code>npm start</code><br>
        3. データが復元されたことを管理コンソールで確認<br>
        4. 復元ログを監査ログに記録
      </div>
    </div>
    <div>
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">🚨 緊急時対応フロー</div>
      <div style="font-size:12px;line-height:1.8;color:var(--text-secondary);">
        <strong>Level 1（データ不整合）</strong>: 管理コンソールで状況確認→バックアップからリストア<br>
        <strong>Level 2（サーバーダウン）</strong>: Railway/Vercelダッシュボードで再デプロイ<br>
        <strong>Level 3（セキュリティ侵害）</strong>: 全ユーザーのトークン無効化（JWT_SECRET変更）→パスワードリセット→監査ログ確認
      </div>
    </div>`;
  },

  /* ================================================================
   * ユーザー追加フォーム
   * ================================================================ */
  showAddUserForm() {
    const today = new Date().toISOString().slice(0, 10);
    let html = `<div class="glass-card highlight">
      <div class="report-title">➕ 新規ユーザー追加</div>
      <div style="display:grid;gap:10px;">
        <div><label style="font-size:12px;font-weight:600;">氏名 <span style="color:var(--accent-red);">*</span></label>
          <input id="sNewName" type="text" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;"></div>
        <div><label style="font-size:12px;font-weight:600;">メールアドレス <span style="color:var(--accent-red);">*</span></label>
          <input id="sNewEmail" type="email" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;"></div>
        <div><label style="font-size:12px;font-weight:600;">プラン <span style="color:var(--accent-red);">*</span></label>
          <select id="sNewPlan" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;">
            <option value="Free">Free</option><option value="Basic">Basic</option>
            <option value="Pro" selected>Pro</option><option value="Enterprise">Enterprise</option>
          </select></div>
        <div><label style="font-size:12px;font-weight:600;">契約期間</label>
          <select id="sNewMonths" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;">
            <option value="6">6ヶ月</option><option value="12" selected>1年</option><option value="24">2年</option>
          </select></div>
        <div><label style="font-size:12px;font-weight:600;">備考</label>
          <textarea id="sNewMemo" rows="2" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;resize:vertical;"></textarea></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="SuperAdmin.addUser()">💾 登録</button>
        <button class="btn btn-secondary" onclick="SuperAdmin.show('users')">キャンセル</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  async addUser() {
    const name = document.getElementById('sNewName')?.value.trim();
    const email = document.getElementById('sNewEmail')?.value.trim();
    const plan = document.getElementById('sNewPlan')?.value;
    const contractMonths = document.getElementById('sNewMonths')?.value;
    const memo = document.getElementById('sNewMemo')?.value;

    if (!name || !email) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '氏名とメールアドレスは必須です'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '正しいメール形式で入力してください'));
      return;
    }

    try {
      await ApiClient.addAdminUser({ name, email, plan, contractMonths, memo });
      App.addSystemMessage(Utils.createAlert('success', '✅', `ユーザー「${name}」を追加しました。`));
      this.show('users');
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', e.message));
    }
  },

  /* ================================================================
   * ユーザー編集フォーム
   * ================================================================ */
  async showEditUserForm(userId) {
    try {
      const data = await ApiClient.getAdminUsers({ limit: 100 });
      const user = (data.users || []).find(u => u.id === userId);
      if (!user) { App.addSystemMessage(Utils.createAlert('error', '❌', 'ユーザーが見つかりません')); return; }

      let html = `<div class="glass-card highlight">
        <div class="report-title">✏️ ユーザー編集 — ${user.name}</div>
        <div style="display:grid;gap:10px;">
          <div><label style="font-size:12px;font-weight:600;">氏名</label>
            <input id="sEditName" type="text" value="${user.name || ''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;"></div>
          <div><label style="font-size:12px;font-weight:600;">プラン</label>
            <select id="sEditPlan" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;">
              ${['Free','Basic','Pro','Enterprise'].map(p => `<option value="${p}" ${user.plan === p ? 'selected' : ''}>${p}</option>`).join('')}
            </select></div>
          <div><label style="font-size:12px;font-weight:600;">ステータス</label>
            <select id="sEditStatus" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;">
              ${['Active','Suspended','Expired'].map(s => `<option value="${s}" ${user.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select></div>
          <div><label style="font-size:12px;font-weight:600;">契約更新期限</label>
            <input id="sEditRenewal" type="date" value="${user.renewal_date ? user.renewal_date.slice(0,10) : ''}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;"></div>
          <div><label style="font-size:12px;font-weight:600;">備考</label>
            <textarea id="sEditMemo" rows="2" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;resize:vertical;">${user.memo || ''}</textarea></div>
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="SuperAdmin.updateUser(${userId})">💾 保存</button>
          <button class="btn btn-secondary" onclick="SuperAdmin.show('users')">キャンセル</button>
        </div>
      </div>`;
      App.addSystemMessage(html);
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', e.message));
    }
  },

  async updateUser(userId) {
    const name = document.getElementById('sEditName')?.value.trim();
    const plan = document.getElementById('sEditPlan')?.value;
    const status = document.getElementById('sEditStatus')?.value;
    const renewal_date = document.getElementById('sEditRenewal')?.value;
    const memo = document.getElementById('sEditMemo')?.value;

    try {
      await ApiClient.updateAdminUser(userId, { name, plan, status, renewal_date, memo });
      App.addSystemMessage(Utils.createAlert('success', '✅', 'ユーザー情報を更新しました'));
      this.show('users');
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', e.message));
    }
  },

  /* ================================================================
   * ユーザー削除（論理削除）
   * ================================================================ */
  confirmDeleteUser(userId, userName) {
    const input = prompt(`ユーザー「${userName}」を削除します。\n確認のためユーザー名を入力してください：`);
    if (input === userName) {
      this.deleteUser(userId);
    } else if (input !== null) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'ユーザー名が一致しません。削除をキャンセルしました。'));
    }
  },

  async deleteUser(userId) {
    try {
      await ApiClient.deleteAdminUser(userId);
      App.addSystemMessage(Utils.createAlert('success', '✅', 'ユーザーを論理削除しました（90日以内は復元可能）'));
      this.show('users');
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', e.message));
    }
  },

  async restoreUser(userId) {
    try {
      await ApiClient.restoreAdminUser(userId);
      App.addSystemMessage(Utils.createAlert('success', '✅', 'ユーザーを復元しました'));
      this.show('users');
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', e.message));
    }
  },

  /* ================================================================
   * ライセンス延長フォーム
   * ================================================================ */
  showRenewForm(userId, userName, currentDate) {
    const current = currentDate ? new Date(currentDate) : new Date();
    const oneYearLater = new Date(current);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    let html = `<div class="glass-card highlight">
      <div class="report-title">📅 契約延長 — ${userName}</div>
      <div style="margin-bottom:8px;font-size:12px;color:var(--text-muted);">現在の期限: ${current.toLocaleDateString('ja-JP')}</div>
      <div><label style="font-size:12px;font-weight:600;">新しい更新期限</label>
        <input id="sRenewDate" type="date" value="${oneYearLater.toISOString().slice(0,10)}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;"></div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="SuperAdmin.renewLicense(${userId})">📅 延長する</button>
        <button class="btn btn-secondary" onclick="SuperAdmin.show('license')">キャンセル</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  async renewLicense(userId) {
    const renewal_date = document.getElementById('sRenewDate')?.value;
    if (!renewal_date) return;
    try {
      await ApiClient.updateAdminUser(userId, { renewal_date });
      App.addSystemMessage(Utils.createAlert('success', '✅', '契約期限を更新しました'));
      this.show('license');
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', e.message));
    }
  },

  /* ================================================================
   * 検索
   * ================================================================ */
  async searchUsers() {
    const search = document.getElementById('saUserSearch')?.value;
    const plan = document.getElementById('saUserPlan')?.value;
    const status = document.getElementById('saUserStatus')?.value;

    const data = await ApiClient.getAdminUsers({ search, plan, status, limit: 20 });
    // ユーザーリストを再描画
    const content = document.getElementById('superAdminContent');
    if (content) {
      content.innerHTML = await this.renderUsers();
    }
  },

  async loadPage(page) {
    const data = await ApiClient.getAdminUsers({ page, limit: 20 });
    const content = document.getElementById('superAdminContent');
    if (content) {
      content.innerHTML = await this.renderUsers();
    }
  },

  // 手動バックアップ（DBダウンロード）
  manualBackup() {
    App.addSystemMessage(Utils.createAlert('info', 'ℹ️', 'PostgreSQLバックアップ：Railwayダッシュボードの「Database」→「Backups」からスナップショットを作成できます。<br>ローカル保存：<code>pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql</code>'));
  },

  // CSVエクスポート
  async exportCSV() {
    try {
      const data = await ApiClient.getAdminUsers({ limit: 1000 });
      const users = data.users || [];
      if (users.length === 0) { App.addSystemMessage(Utils.createAlert('warning', '⚠️', 'エクスポート対象がありません')); return; }

      const headers = ['ID', '氏名', 'メール', 'プラン', 'ステータス', '加入日', '更新期限', '残日数', '最終ログイン'];
      let csv = '\uFEFF' + headers.join(',') + '\n'; // BOM付きUTF-8
      users.forEach(u => {
        csv += [
          u.id,
          '"' + (u.name || '').replace(/"/g, '""') + '"',
          '"' + (u.email || '') + '"',
          u.plan || 'Free',
          u.status || 'Active',
          u.joined_at ? new Date(u.joined_at).toLocaleDateString('ja-JP') : '',
          u.renewal_date ? new Date(u.renewal_date).toLocaleDateString('ja-JP') : '',
          u.remaining_days != null ? u.remaining_days : '',
          u.last_login ? new Date(u.last_login).toLocaleDateString('ja-JP') : ''
        ].join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LCE_users_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      App.addSystemMessage(Utils.createAlert('success', '✅', `${users.length}件のユーザーデータをCSVエクスポートしました`));
    } catch(e) {
      App.addSystemMessage(Utils.createAlert('error', '❌', 'CSVエクスポートエラー: ' + e.message));
    }
  },

  // 全選択トグル
  toggleSelectAll(checkbox) {
    document.querySelectorAll('.sa-user-check').forEach(cb => { cb.checked = checkbox.checked; });
  },

  // ソート
  sortBy(col) {
    App.addSystemMessage(Utils.createAlert('info', 'ℹ️', `${col}でソート機能はサーバー側API拡張後に有効化されます`));
  },

  // 一括延長
  bulkRenewSelected() {
    const checked = document.querySelectorAll('.sa-user-check:checked');
    if (checked.length === 0) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '延長するユーザーをチェックボックスで選択してください'));
      return;
    }

    const ids = Array.from(checked).map(cb => ({ id: parseInt(cb.dataset.uid), name: cb.dataset.uname }));
    const nameList = ids.map(u => u.name).join('、');
    const oneYearLater = new Date(); oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    let html = `<div class="glass-card highlight">
      <div class="report-title">📅 一括契約延長（${ids.length}名）</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">対象: ${nameList}</div>
      <div><label style="font-size:12px;font-weight:600;">新しい更新期限</label>
        <input id="sBulkRenewDate" type="date" value="${oneYearLater.toISOString().slice(0,10)}" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;margin-top:4px;"></div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="SuperAdmin.executeBulkRenew([${ids.map(u => u.id).join(',')}])">📅 一括延長実行</button>
        <button class="btn btn-secondary" onclick="SuperAdmin.show('users')">キャンセル</button>
      </div>
    </div>`;
    App.addSystemMessage(html);
  },

  async executeBulkRenew(userIds) {
    const renewal_date = document.getElementById('sBulkRenewDate')?.value;
    if (!renewal_date) return;
    let success = 0;
    for (const id of userIds) {
      try {
        await ApiClient.updateAdminUser(id, { renewal_date });
        success++;
      } catch(e) { console.warn(`ユーザー${id}の延長失敗:`, e); }
    }
    App.addSystemMessage(Utils.createAlert('success', '✅', `${success}/${userIds.length}名の契約期限を更新しました`));
    this.show('users');
  },

  /* ================================================================
   * サイドバー表示制御
   * ================================================================ */
  initSidebar() {
    const user = ApiClient.getUser();
    if (!user) return;
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    // 一般ユーザー向け：契約情報表示
    if (user.renewalDate) {
      const renewal = new Date(user.renewalDate);
      const now = new Date();
      const remaining = Math.ceil((renewal - now) / (1000 * 60 * 60 * 24));
      let color, animation;
      if (remaining <= 0) { color = 'var(--accent-red)'; animation = ''; }
      else if (remaining <= 7) { color = 'var(--accent-red)'; animation = 'animation:pulse 2s infinite;'; }
      else if (remaining <= 30) { color = 'var(--accent-gold)'; animation = ''; }
      else { color = 'var(--accent-green)'; animation = ''; }

      const infoPanel = document.createElement('div');
      infoPanel.style.cssText = 'padding:12px 16px;margin:8px 12px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border-secondary);';
      infoPanel.innerHTML = `
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">📅 ご契約情報</div>
        <div style="font-size:12px;">プラン: <strong>${user.plan || 'Free'}</strong></div>
        <div style="font-size:12px;">更新期限: <strong>${renewal.toLocaleDateString('ja-JP')}</strong></div>
        <div style="font-size:12px;color:${color};font-weight:700;${animation}">残り: ${remaining > 0 ? remaining + '日' : '期限切れ'}</div>
        ${remaining <= 30 && remaining > 0 ? '<div style="font-size:10px;color:var(--accent-gold);margin-top:4px;">更新についてはお問い合わせください</div>' : ''}
        ${remaining <= 0 ? '<div style="font-size:10px;color:var(--accent-red);margin-top:4px;">契約期限が切れています。管理者にお問い合わせください。</div>' : ''}
      `;
      nav.appendChild(infoPanel);
    }
  },

  /* ================================================================
   * 設定タブ（API設定・データ管理）
   * ================================================================ */
  renderSettings() {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const localUsage = settings.apiUsage || { tokens: 0, cost: 0, calls: 0 };

    // ローカルデータ統計
    const dataKeys = Object.keys(localStorage);
    let totalSize = 0;
    dataKeys.forEach(k => { totalSize += (localStorage.getItem(k) || '').length * 2; });
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

    let html = `<div class="report-subtitle">🔑 OpenAI API設定</div>
      <div style="margin-bottom:16px;">
        <div style="font-size:11px;color:var(--accent-cyan);margin-bottom:8px;">APIキーを入力するとAI資料生成（/資料）が利用可能になります</div>
        <input id="saApiKey" type="password" value="${settings.openaiApiKey || ''}" placeholder="sk-..." style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;font-family:var(--font-mono);">
      </div>
      <div style="margin-bottom:16px;">
        <select id="saApiModel" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:var(--border-radius-sm);color:var(--text-primary);font-size:13px;">
          <option value="gpt-4o-mini" ${(settings.openaiModel || 'gpt-4o-mini') === 'gpt-4o-mini' ? 'selected' : ''}>gpt-4o-mini（低コスト・高速）</option>
          <option value="gpt-4o" ${settings.openaiModel === 'gpt-4o' ? 'selected' : ''}>gpt-4o（高精度）</option>
          <option value="gpt-4-turbo" ${settings.openaiModel === 'gpt-4-turbo' ? 'selected' : ''}>gpt-4-turbo</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="SuperAdmin.saveApiSettings()">💾 API設定を保存</button>

      <div class="report-subtitle" style="margin-top:20px;">📊 API使用量</div>`;
    html += Utils.createTable(['項目', '値'], [
      ['累計API呼出回数', `${localUsage.calls || 0}回`],
      ['累計トークン使用量', `${(localUsage.tokens || 0).toLocaleString()} tokens`],
      ['累計推定コスト', `$${(localUsage.cost || 0).toFixed(4)}（約${Math.ceil((localUsage.cost || 0) * 150)}円）`],
    ]);

    html += `<div class="report-subtitle" style="margin-top:20px;">💰 API使用料の目安</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
        ※ 1ドル=150円換算。実際の料金はOpenAIの最新価格をご確認ください。
      </div>`;
    html += Utils.createTable(['モデル', '入力単価', '出力単価', '資料1件あたり', '月100件利用時'], [
      ['gpt-4o-mini（推奨）', '$0.15/100万', '$0.60/100万', '約0.3円', '約30円/月'],
      ['gpt-4o　（高品質）', '$2.50/100万', '$10.00/100万', '約5円', '約500円/月'],
      ['gpt-4-turbo', '$10.00/100万', '$30.00/100万', '約20円', '約2,000円/月'],
    ]);
    html += `<div style="font-size:11px;color:var(--text-muted);margin-top:6px;line-height:1.6;">
      💡 <strong>gpt-4o-mini</strong> は品質と価格のバランスが最良です。月100件生成でも約30円程度。<br>
      📌 1資料あたり約2,000入力 + 4,000出力トークンで計算。案件自動作成（7資料一括）は約2円です。
    </div>`;

    html += `<div class="report-subtitle" style="margin-top:20px;">🛡️ ローカルデータ</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
        <div class="glass-card" style="padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:var(--primary-light);">${dataKeys.length}</div>
          <div style="font-size:11px;color:var(--text-muted);">保存項目数</div>
        </div>
        <div class="glass-card" style="padding:14px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:var(--accent-cyan);">${sizeMB} MB</div>
          <div style="font-size:11px;color:var(--text-muted);">データ使用量</div>
        </div>
      </div>

      <div class="report-subtitle">💾 データ管理</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <button class="btn btn-primary" onclick="Database.exportAll()">📥 エクスポート</button>
        <button class="btn btn-secondary" onclick="Database.importData()">📤 インポート</button>
      </div>

      <div class="report-subtitle">🗑️ データ初期化</div>
      <button class="btn btn-sm" style="background:var(--accent-red);color:white;" onclick="App.confirmClear()">⚠️ 全データを初期化</button>`;

    return html;
  },

  // API設定保存
  saveApiSettings() {
    const apiKey = document.getElementById('saApiKey')?.value.trim();
    const model = document.getElementById('saApiModel')?.value;
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    settings.openaiApiKey = apiKey;
    settings.openaiModel = model;
    Database.save(Database.KEYS.SETTINGS, settings);
    App.addSystemMessage(Utils.createAlert('success', '✅', 'API設定を保存しました。<code>/資料</code> でAI資料生成が利用可能です。'));
  },
};
