/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 管理者コンソール（ローカル＋サーバー対応）
 * ============================================================ */

const Admin = {

  async show() {
    // API使用量
    let usage = { calls: 0, tokens: 0, cost: 0 };
    try {
      if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
        usage = await ApiClient.getApiUsage();
      }
    } catch(e) {}

    // ローカルデータ統計
    const dataKeys = Object.keys(localStorage);
    let totalSize = 0;
    dataKeys.forEach(k => { totalSize += (localStorage.getItem(k) || '').length * 2; });
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const localUsage = settings.apiUsage || { tokens: 0, cost: 0, calls: 0 };
    const totalCalls = (usage.calls || 0) + (localUsage.calls || 0);
    const totalCost = (usage.cost || 0) + (localUsage.cost || 0);

    let html = `<div>
      <div class="report-subtitle">🛡️ システム稼働状況 (System Status)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:24px;">
        <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--primary-light);">${dataKeys.length}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">ロコ・ストレージ項目数</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--accent-cyan);">${sizeMB} MB</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">データ使用量</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:var(--accent-green);">✅</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">エンジンステータス</div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:${totalCalls > 0 ? 'var(--accent-gold)' : 'var(--text-muted)'};">${totalCalls}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">累計API呼出回数</div>
        </div>
      </div>

      <div class="report-subtitle">🏢 SaaSテナント・ライセンス管理</div>
      <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
          クライアント企業に対し、環境ごとの専用テナントとライセンスキーを発行します。これによりデータが完全に分離保護されます。
        </p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
          <div style="flex:1;min-width:200px;">
            <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">新規テナント名 (企業名・組織名)</label>
            <input type="text" id="saasTenantName" placeholder="例: 株式会社サンプル" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
          </div>
          <div style="flex:1;min-width:200px;">
            <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">利用プラン</label>
            <select id="saasTenantPlan" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
              <option value="Free">Free (無料お試し)</option>
              <option value="Pro">Pro (スタンダード)</option>
              <option value="Enterprise" selected>Enterprise (最高峰プラン)</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
          <div style="flex:1;min-width:200px;">
            <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">管理者メールアドレス</label>
            <input type="email" id="saasAdminEmail" placeholder="admin@example.com" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
          </div>
          <div style="flex:1;min-width:200px;display:flex;align-items:flex-end;">
            <button class="btn btn-primary" onclick="Admin.issueLicense()" style="width:100%;padding:10px;font-weight:600;">🔑 テナント＆ライセンスを即時発行</button>
          </div>
        </div>
        <div id="saasLicenseResult" style="display:none;background:rgba(76,175,80,0.1);border:1px dashed var(--accent-green);padding:16px;border-radius:6px;font-size:13px;word-break:break-all;"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        <!-- バックアップ・データ管理 -->
        <div>
          <div class="report-subtitle">💾 バックアップ・データ管理</div>
          <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:20px;">
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">現在のシステムデータを暗号化ZIP形式で退避、または復元します。</p>
            <div style="display:flex;gap:12px;">
              <button class="btn btn-primary" onclick="Database.exportAll()">📥 エクスポート</button>
              <button class="btn btn-secondary" onclick="Database.importData()">📤 インポート</button>
            </div>
            
            <div style="margin-top:24px;border-top:1px solid var(--border-secondary);padding-top:16px;">
              <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">危険な操作 (DANGER ZONE)</div>
              <button class="btn btn-sm" style="background:var(--accent-red);color:white;width:100%;" onclick="App.confirmClear()">⚠️ 全データを強制初期化</button>
            </div>
          </div>
        </div>

        <!-- API設定と使用量 -->
        <div>
          <div class="report-subtitle">🔑 OpenAI API・課金状況</div>
          <div style="background:var(--bg-card);border:1px solid var(--border-secondary);border-radius:8px;padding:20px;">
            <div style="margin-bottom:16px;">
              <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">APIキー (システム全体へ影響)</label>
              <input id="adminApiKey" type="password" value="${settings.openaiApiKey || ''}" placeholder="sk-..." style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;font-family:var(--font-mono);">
            </div>
            <div style="margin-bottom:16px;">
              <label style="font-size:11px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">デフォルトAIモデル</label>
              <select id="adminApiModel" style="width:100%;padding:10px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
                <option value="gpt-4o-mini" ${(settings.openaiModel || 'gpt-4o-mini') === 'gpt-4o-mini' ? 'selected' : ''}>gpt-4o-mini（低コスト・高速）</option>
                <option value="gpt-4o" ${settings.openaiModel === 'gpt-4o' ? 'selected' : ''}>gpt-4o（高精度）</option>
                <option value="gpt-4-turbo" ${settings.openaiModel === 'gpt-4-turbo' ? 'selected' : ''}>gpt-4-turbo</option>
              </select>
            </div>
            <button class="btn btn-primary" onclick="Admin.saveApiSettings()" style="width:100%;margin-bottom:20px;">💾 API設定を適用</button>
            
            <div style="font-size:12px;font-weight:600;margin-bottom:8px;">課金シミュレーション実績</div>
            <div style="display:flex;justify-content:space-between;font-size:12px;border-bottom:1px solid var(--border-secondary);padding:4px 0;">
              <span>累計トークン:</span> <span>${((usage.tokens || 0) + (localUsage.tokens || 0)).toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;">
              <span>推定コスト:</span> <span style="font-weight:700;color:var(--accent-gold);">$${totalCost.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    document.getElementById('adminConsoleBody').innerHTML = html;
    document.getElementById('adminConsoleModal').style.display = 'flex';
  },

  saveApiSettings() {
    const apiKey = document.getElementById('adminApiKey').value.trim();
    const model = document.getElementById('adminApiModel').value;
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    settings.openaiApiKey = apiKey;
    settings.openaiModel = model;
    Database.save(Database.KEYS.SETTINGS, settings);

    // サーバーにも保存（接続時）
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      ApiClient.saveApiSettings({ apiKey, model }).catch(() => {});
    }

    App.addSystemMessage(Utils.createAlert('success', '✅', 'API設定を保存しました。<code>/AI資料</code> でAI資料生成が利用可能です。'));
  },

  // 後方互換
  trackApiUsage(inputTokens, outputTokens, model) {
    const settings = Database.load(Database.KEYS.SETTINGS) || {};
    const usage = settings.apiUsage || { tokens: 0, cost: 0, calls: 0 };
    const costPer1k = { 'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, 'gpt-4o': { input: 0.005, output: 0.015 }, 'gpt-4-turbo': { input: 0.01, output: 0.03 } };
    const rates = costPer1k[model] || costPer1k['gpt-4o-mini'];
    usage.tokens += inputTokens + outputTokens;
    usage.cost += (inputTokens / 1000 * rates.input) + (outputTokens / 1000 * rates.output);
    usage.calls += 1;
    settings.apiUsage = usage;
    Database.save(Database.KEYS.SETTINGS, settings);
  },

  // ライセンス発行ロジック（UIからの呼び出し）
  async issueLicense() {
    const tenantName = document.getElementById('saasTenantName')?.value.trim();
    const email = document.getElementById('saasAdminEmail')?.value.trim();
    const plan = document.getElementById('saasTenantPlan')?.value;

    if (!tenantName || !email) {
      App.addSystemMessage(Utils.createAlert('error', '❌', 'テナント名とメールアドレスは必須です'));
      return;
    }

    const resBox = document.getElementById('saasLicenseResult');
    resBox.style.display = 'block';
    resBox.innerHTML = '<div class="loading-spinner" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 発行中...';

    try {
      if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
        // バックエンド（本番環境）経由での発行
        const tenantRes = await ApiClient.request('/api/admin/tenants', {
          method: 'POST',
          body: JSON.stringify({ name: tenantName, plan: plan })
        });
        
        const userRes = await ApiClient.request('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify({ name: tenantName + '管理者', email: email, plan: plan, contractMonths: 12, memo: 'Console発行' })
        });

        resBox.innerHTML = `
          <div style="font-weight:700;color:var(--accent-green);margin-bottom:8px;">✅ ライセンス発行成功</div>
          <div><strong>テナント:</strong> ${tenantName} (${plan}プラン)</div>
          <div><strong>管理者メール:</strong> ${email}</div>
          <div style="margin-top:8px;font-family:var(--font-mono);background:var(--bg-card);padding:8px;border-radius:4px;color:var(--primary-light);">
            ライセンスキー: <br><span style="font-size:14px;">${userRes.licenseKey}</span>
          </div>
          <div style="margin-top:8px;font-size:10px;color:var(--text-muted);">※このライセンスキーをユーザーに通知してください。初期パスワードは「temppassword123」です。</div>
        `;
      } else {
        // ローカル環境（オフライン）向けモック発行
        setTimeout(() => {
          const mockKey = 'lce-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + plan.toUpperCase();
          resBox.innerHTML = `
            <div style="font-weight:700;color:var(--accent-green);margin-bottom:8px;">✅ (モック) ライセンス発行成功</div>
            <div><strong>テナント:</strong> ${tenantName} (${plan}プラン)</div>
            <div><strong>管理者メール:</strong> ${email}</div>
            <div style="margin-top:8px;font-family:var(--font-mono);background:var(--bg-card);padding:8px;border-radius:4px;color:var(--primary-light);">
              仮ライセンスキー: <br><span style="font-size:14px;">${mockKey}</span>
            </div>
            <div style="margin-top:8px;font-size:10px;color:var(--text-muted);">※バックエンドAPI未接続のためローカル発行シミュレーションです</div>
          `;
        }, 800);
      }
    } catch (err) {
      resBox.innerHTML = `<span style="color:var(--accent-red)">発行エラー: ${err.message}</span>`;
    }
  }
};
