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

    let html = `<div class="glass-card highlight">
      <div class="report-title">📊 最高管理者コンソール</div>
      <div style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;" id="superAdminTabs">
        ${['users', 'dashboard', 'license', 'protection', 'guide'].map(t => {
          const labels = { users:'👥 ユーザー', dashboard:'📋 加入状況', license:'🔑 ライセンス', protection:'🛡️ データ保護', guide:'📖 ガイド' };
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
        case 'guide': html += this.renderGuide(); break;
      }
    } catch(e) {
      html += Utils.createAlert('error', '❌', `データ取得エラー: ${e.message}`);
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
    </div>`;

    // ユーザーテーブル
    if (users.length > 0) {
      html += `<div style="overflow-x:auto;"><table class="data-table"><thead><tr>
        <th>ID</th><th>氏名</th><th>メール</th><th>プラン</th><th>ステータス</th>
        <th>加入日</th><th>更新期限</th><th>残日数</th><th>最終ログイン</th><th>操作</th>
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

        html += `<tr style="${remaining <= 7 ? 'background:rgba(239,68,68,0.08);' : remaining <= 30 ? 'background:rgba(245,158,14,0.08);' : ''}">
          <td style="font-size:11px;color:var(--text-muted);">${u.id}</td>
          <td style="font-weight:600;">${u.name || '—'}</td>
          <td style="font-size:12px;">${u.email}</td>
          <td><span style="padding:2px 8px;border-radius:12px;font-size:11px;background:var(--bg-tertiary);font-weight:600;">${u.plan || 'Free'}</span></td>
          <td>${statusBadge}</td>
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
      { label: '論理削除の徹底', status: '✅', detail: '全テーブルにdeleted_at/deleted_byカラム実装済み。物理削除禁止。' },
      { label: 'マイグレーション安全規約', status: '✅', detail: 'DROP TABLE/DROP COLUMN/TRUNCATE禁止。リネーム→90日保持→管理者承認後削除。' },
      { label: '監査ログ', status: '✅', detail: 'ユーザーの追加・更新・削除・ログインを全て記録。' },
      { label: 'トランザクション整合性', status: '✅', detail: 'ユーザー追加時にDBレコード＋ライセンスを同一トランザクションで作成。' },
      { label: '認証・認可チェック', status: '✅', detail: 'JWT認証＋最高管理者権限チェックをミドルウェアで適用。' },
      { label: 'バックアップ', status: '⚠️', detail: 'sql.jsファイルベース（server/data/lce.db）。定期バックアップはcron等で設定推奨。' },
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

    // 手動バックアップ
    html += `<div style="margin-top:16px;">
      <button class="btn btn-primary" onclick="SuperAdmin.manualBackup()">💾 手動バックアップ実行</button>
      <span style="font-size:11px;color:var(--text-muted);margin-left:8px;">DBファイルをダウンロードします</span>
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
    App.addSystemMessage(Utils.createAlert('info', 'ℹ️', 'バックアップ：サーバーの <code>server/data/lce.db</code> ファイルをコピーしてください。自動ダウンロードはサーバー側エンドポイントが必要です。'));
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

    // 最高管理者のみ：コンソールリンク追加
    if (this.isSuperAdmin()) {
      const divider = document.createElement('div');
      divider.className = 'nav-divider';
      nav.appendChild(divider);

      const item = document.createElement('div');
      item.className = 'nav-item';
      item.setAttribute('data-cmd', '/最高管理者');
      item.innerHTML = '<span class="icon">📊</span> 最高管理者コンソール';
      item.style.color = 'var(--accent-gold)';
      item.style.fontWeight = '600';
      nav.appendChild(item);
    }
  }
};
