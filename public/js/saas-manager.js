/* ============================================================
 * LOAN CRAFT ENGINE - SaaS拡張（ライセンス・テナント管理）
 * super-admin.jsのSuperAdminオブジェクトに関数を追加
 * ============================================================ */

// SaaS管理タブの描画
SuperAdmin.renderSaaS = function() {
  return `<div class="report-subtitle">\u{1F680} SaaS管理機能</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
    <div class="glass-card" style="padding:16px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">\u{1F511} ライセンス発行</div>
      <div style="display:grid;gap:8px;">
        <div><label style="font-size:11px;color:var(--text-muted);">対象ユーザーメール</label>
          <input id="saasLicEmail" type="email" placeholder="user@example.com" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">プラン</label>
          <select id="saasLicPlan" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="Free">Free</option>
            <option value="Basic">Basic (\u00A53,980/月)</option>
            <option value="Pro" selected>Pro (\u00A59,800/月)</option>
            <option value="Enterprise">Enterprise (\u00A529,800/月)</option>
          </select></div>
        <div><label style="font-size:11px;color:var(--text-muted);">有効期間</label>
          <select id="saasLicMonths" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="1">1ヶ月</option><option value="6">6ヶ月</option>
            <option value="12" selected>1年</option><option value="24">2年</option>
          </select></div>
        <button class="btn btn-primary btn-sm" onclick="SuperAdmin.issueLicense()">\u{1F511} ライセンス発行</button>
      </div>
    </div>

    <div class="glass-card" style="padding:16px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:12px;">\u{1F3E2} テナント発行</div>
      <div style="display:grid;gap:8px;">
        <div><label style="font-size:11px;color:var(--text-muted);">テナント名（会社名）</label>
          <input id="saasTenantName" placeholder="株式会社○○" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">管理者メール</label>
          <input id="saasTenantEmail" type="email" placeholder="admin@company.com" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;"></div>
        <div><label style="font-size:11px;color:var(--text-muted);">プラン</label>
          <select id="saasTenantPlan" style="width:100%;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
            <option value="Basic">Basic (1ユーザー)</option>
            <option value="Pro" selected>Pro (5ユーザー)</option>
            <option value="Enterprise">Enterprise (無制限)</option>
          </select></div>
        <button class="btn btn-primary btn-sm" onclick="SuperAdmin.issueTenant()">\u{1F3E2} テナント発行</button>
      </div>
    </div>
  </div>

  <div class="report-subtitle">\u{1F4CA} 発行済みライセンス</div>
  <div id="saasLicenseList" style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">${SuperAdmin._renderLicenseList()}</div>

  <div class="report-subtitle">\u{1F3E2} テナント一覧</div>
  <div id="saasTenantList" style="font-size:12px;color:var(--text-secondary);">${SuperAdmin._renderTenantList()}</div>`;
};

// ライセンス一覧表示
SuperAdmin._renderLicenseList = function() {
  const licenses = Database.load('licenses') || [];
  if (licenses.length === 0) return '<div style="padding:8px;color:var(--text-muted);">発行済みライセンスはありません</div>';
  let html = '<table style="width:100%;font-size:11px;border-collapse:collapse;">';
  html += '<tr style="border-bottom:1px solid var(--border-secondary);"><th style="text-align:left;padding:6px;">キー</th><th style="text-align:left;padding:6px;">メール</th><th style="text-align:left;padding:6px;">プラン</th><th style="text-align:left;padding:6px;">有効期限</th></tr>';
  licenses.forEach(l => {
    html += `<tr style="border-bottom:1px solid var(--border-secondary);">
      <td style="padding:6px;"><code style="font-size:10px;">${l.key}</code></td>
      <td style="padding:6px;">${l.email}</td>
      <td style="padding:6px;">${l.plan}</td>
      <td style="padding:6px;">${l.expiresAt ? new Date(l.expiresAt).toLocaleDateString('ja-JP') : '-'}</td>
    </tr>`;
  });
  return html + '</table>';
};

// テナント一覧表示
SuperAdmin._renderTenantList = function() {
  const tenants = Database.load('tenants') || [];
  if (tenants.length === 0) return '<div style="padding:8px;color:var(--text-muted);">発行済みテナントはありません</div>';
  let html = '<table style="width:100%;font-size:11px;border-collapse:collapse;">';
  html += '<tr style="border-bottom:1px solid var(--border-secondary);"><th style="text-align:left;padding:6px;">ID</th><th style="text-align:left;padding:6px;">テナント名</th><th style="text-align:left;padding:6px;">管理者</th><th style="text-align:left;padding:6px;">プラン</th></tr>';
  tenants.forEach(t => {
    html += `<tr style="border-bottom:1px solid var(--border-secondary);">
      <td style="padding:6px;"><code style="font-size:10px;">${t.tenantId}</code></td>
      <td style="padding:6px;">${t.name}</td>
      <td style="padding:6px;">${t.email}</td>
      <td style="padding:6px;">${t.plan}</td>
    </tr>`;
  });
  return html + '</table>';
};

// ライセンス発行
SuperAdmin.issueLicense = function() {
  const email = document.getElementById('saasLicEmail')?.value.trim();
  const plan = document.getElementById('saasLicPlan')?.value;
  const months = parseInt(document.getElementById('saasLicMonths')?.value || '12');
  if (!email) { App.addSystemMessage(Utils.createAlert('warning', '\u26A0\uFE0F', 'メールアドレスを入力してください')); return; }
  const key = 'LCE-' + plan.toUpperCase() + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,6).toUpperCase();
  const licenses = Database.load('licenses') || [];
  licenses.push({ key, email, plan, months, issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + months * 30 * 86400000).toISOString() });
  Database.save('licenses', licenses);
  App.addSystemMessage(Utils.createAlert('success', '\u2705', `ライセンス発行完了: <code>${key}</code><br>対象: ${email} / プラン: ${plan} / 有効: ${months}ヶ月`));
  SuperAdmin.show('saas');
};

// テナント発行
SuperAdmin.issueTenant = function() {
  const name = document.getElementById('saasTenantName')?.value.trim();
  const email = document.getElementById('saasTenantEmail')?.value.trim();
  const plan = document.getElementById('saasTenantPlan')?.value;
  if (!name || !email) { App.addSystemMessage(Utils.createAlert('warning', '\u26A0\uFE0F', 'テナント名と管理者メールを入力してください')); return; }
  const tenantId = 'TNT-' + Date.now().toString(36).toUpperCase();
  const tenants = Database.load('tenants') || [];
  tenants.push({ tenantId, name, email, plan, createdAt: new Date().toISOString() });
  Database.save('tenants', tenants);
  App.addSystemMessage(Utils.createAlert('success', '\u2705', `テナント発行完了: <code>${tenantId}</code><br>名称: ${name} / 管理者: ${email} / プラン: ${plan}`));
  SuperAdmin.show('saas');
};
