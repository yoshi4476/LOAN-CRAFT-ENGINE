/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - APIクライアント
 * LocalStorage → サーバーAPI 通信ブリッジ
 * ============================================================ */

const ApiClient = {
  // APIベースURL（Vercelデプロイ時はRailwayのURLを設定）
  BASE: window.LCE_API_BASE || localStorage.getItem('lce_api_base') || '',

  // 認証チェック（ログイン不要モード：常にtrue）
  checkAuth() {
    return true;
  },

  getToken() {
    return localStorage.getItem('lce_token');
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('lce_user')); } catch { return null; }
  },

  async licenseLogin(license_key) {
    const res = await fetch(`${this.BASE}/api/auth/license-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.code === 'LICENSE_EXPIRED' && typeof App !== 'undefined' && App.showSubscriptionExpiredModal) {
        App.showSubscriptionExpiredModal(data.error);
      }
      throw new Error(data.error || 'APIエラー');
    }
    
    localStorage.setItem('lce_token', data.token);
    localStorage.setItem('lce_user', JSON.stringify(data.user));
    localStorage.setItem('lce_license_key', license_key); // 自動復旧用に保持
    return data;
  },

  logout() {
    localStorage.removeItem('lce_token');
    localStorage.removeItem('lce_user');
    localStorage.removeItem('lce_license_key');
    window.location.reload();
  },

  // 共通fetchメソッド（サーバー未稼働時はnullを返す）
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${this.BASE}${endpoint}`, { ...options, headers });
      // サーバー未稼働でHTMLが返る場合を検出
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn(`[API] ${endpoint}: サーバー未接続（HTML応答）`);
        return null;
      }

      if (res.status === 401) { 
        console.warn('[API] 認証エラー');
        
        // サイレント再認証（自動リフレッシュ）フロー
        const savedKey = localStorage.getItem('lce_license_key');
        if (savedKey && !options._isRetry) {
          try {
            console.log('[API] 自動セッション復旧を試行します...');
            const reAuth = await fetch(`${this.BASE}/api/auth/license-login`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ license_key: savedKey })
            });
            if (reAuth.ok) {
              const reData = await reAuth.json();
              localStorage.setItem('lce_token', reData.token);
              localStorage.setItem('lce_user', JSON.stringify(reData.user));
              // 復旧成功時は元のリクエストを再試行
              options._isRetry = true;
              return await this.request(endpoint, options);
            }
          } catch(e) { /* 失敗した場合は下の再ログインUIへ */ }
        }

        // 自動復旧不可の場合はデータ保持・再ログイン用モーダルを表示
        localStorage.removeItem('lce_token');
        if (typeof App !== 'undefined' && App.showReloginModal) {
          App.showReloginModal();
        } else if (typeof App !== 'undefined' && App.showLicenseScreen) {
          App.showLicenseScreen();
        }
        return null; 
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'APIエラー');
      return data;
    } catch (e) {
      console.warn(`[API] ${endpoint}: ${e.message}`);
      return null;
    }
  },

  // --- 企業DNA ---
  async loadCompanyData() {
    return await this.request('/api/company');
  },
  async saveCompanyData(data) {
    return await this.request('/api/company', { method: 'PUT', body: JSON.stringify(data) });
  },

  // --- 格付け ---
  async saveRating(result) {
    return await this.request('/api/data/rating', { method: 'POST', body: JSON.stringify(result) });
  },
  async getRatings() {
    return await this.request('/api/data/rating');
  },
  async getLatestRating() {
    return await this.request('/api/data/rating/latest');
  },

  // --- 案件 ---
  async getCases() {
    return await this.request('/api/data/cases');
  },
  async saveCase(data) {
    return await this.request('/api/data/cases', { method: 'POST', body: JSON.stringify(data) });
  },

  // --- AI ---
  async generateAI(body) {
    return await this.request('/api/ai/generate', { method: 'POST', body: JSON.stringify(body) });
  },
  async getApiUsage() {
    return await this.request('/api/ai/usage');
  },
  async saveApiSettings(settings) {
    return await this.request('/api/ai/settings', { method: 'PUT', body: JSON.stringify(settings) });
  },

  // --- 管理者 ---
  async getAdminDashboard() {
    return await this.request('/api/admin/dashboard');
  },
  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/admin/users?${query}`);
  },
  async addAdminUser(data) {
    return await this.request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateAdminUser(id, data) {
    return await this.request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteAdminUser(id) {
    return await this.request(`/api/admin/users/${id}`, { method: 'DELETE' });
  },
  async restoreAdminUser(id) {
    return await this.request(`/api/admin/users/${id}/restore`, { method: 'POST' });
  },
  async getAdminLogs() {
    return await this.request('/api/admin/logs');
  },
  async getAdminTenants() {
    return await this.request('/api/admin/tenants');
  },
  async addAdminTenant(data) {
    return await this.request('/api/admin/tenants', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateAdminTenant(id, data) {
    return await this.request(`/api/admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  // --- ドキュメント保存 ---
  async getDocuments() {
    return await this.request('/api/features/documents');
  },
  async getDocument(docId) {
    return await this.request(`/api/features/documents/${docId}`);
  },
  async saveDocument(docId, data) {
    return await this.request(`/api/features/documents/${docId}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteDocument(id) {
    return await this.request(`/api/features/documents/${id}`, { method: 'DELETE' });
  },

  // --- 学習データ ---
  async getLearningCases() {
    return await this.request('/api/features/learning');
  },
  async getLearningStats() {
    return await this.request('/api/features/learning/stats');
  },
  async saveLearningCase(data) {
    return await this.request('/api/features/learning', { method: 'POST', body: JSON.stringify(data) });
  },
  async deleteLearningCase(id) {
    return await this.request(`/api/features/learning/${id}`, { method: 'DELETE' });
  },

  // --- スケジュール ---
  async getSchedules(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/api/features/schedules?${query}`);
  },
  async addSchedule(data) {
    return await this.request('/api/features/schedules', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateSchedule(id, data) {
    return await this.request(`/api/features/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteSchedule(id) {
    return await this.request(`/api/features/schedules/${id}`, { method: 'DELETE' });
  },
  async toggleSchedule(id) {
    return await this.request(`/api/features/schedules/${id}/toggle`, { method: 'POST' });
  }
};
