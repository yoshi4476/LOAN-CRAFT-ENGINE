/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - 面談スケジュール管理
 * カレンダーUI + タスクリスト。LocalStorage保存。
 * ============================================================ */

const Schedule = {
  STORAGE_KEY: 'lce_schedules',

  // スケジュール一覧を取得
  loadAll() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  },

  // 保存
  saveAll(schedules) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schedules));
  },

  // サーバーから同期読み込み
  async syncFromServer() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getToken()) return;
    try {
      const serverSchedules = await ApiClient.getSchedules();
      if (serverSchedules && serverSchedules.length > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serverSchedules));
      }
    } catch(e) { console.warn('スケジュール同期失敗:', e); }
  },

  // 追加
  add(item) {
    const all = this.loadAll();
    item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    item.createdAt = new Date().toISOString();
    all.push(item);
    this.saveAll(all);
    // サーバー同期
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      ApiClient.addSchedule({ title: item.bank || item.title || '面談', date: item.date, time: item.time, type: 'meeting', bank: item.bank, memo: item.memo })
        .catch(e => console.warn('スケジュール同期失敗:', e));
    }
    return item;
  },

  // 削除
  remove(id) {
    const all = this.loadAll().filter(s => s.id !== id);
    this.saveAll(all);
    // サーバー同期
    if (typeof ApiClient !== 'undefined' && ApiClient.getToken()) {
      ApiClient.deleteSchedule(id).catch(e => console.warn('スケジュール削除同期失敗:', e));
    }
  },

  // 更新
  update(id, updates) {
    const all = this.loadAll();
    const idx = all.findIndex(s => s.id === id);
    if (idx >= 0) { Object.assign(all[idx], updates); this.saveAll(all); }
  },

  /* ================================================================
   * メインUI表示
   * ================================================================ */
  show() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    let html = `<div class="glass-card highlight">
      <div class="report-title">📅 面談スケジュール管理</div>`;

    // カレンダーヘッダー
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <button class="btn btn-secondary btn-sm" onclick="Schedule.showMonth(${y},${m - 1})">◀</button>
      <div style="font-size:16px;font-weight:700;">${y}年 ${m + 1}月</div>
      <button class="btn btn-secondary btn-sm" onclick="Schedule.showMonth(${y},${m + 1})">▶</button>
    </div>`;

    // カレンダーグリッド
    html += this.buildCalendarGrid(y, m);

    // 新規追加フォーム
    html += `<div style="margin-top:20px;border-top:1px solid var(--border-secondary);padding-top:16px;">
      <div style="font-size:14px;font-weight:600;margin-bottom:12px;">➕ 予定を追加</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input id="schedDate" type="date" value="${now.toISOString().slice(0,10)}" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
        <input id="schedTime" type="time" value="10:00" style="padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
      </div>
      <input id="schedBank" type="text" placeholder="銀行名（例：三井住友銀行 ○○支店）" style="width:100%;margin-top:8px;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;">
      <textarea id="schedMemo" rows="2" placeholder="メモ（持参物・注意事項など）" style="width:100%;margin-top:8px;padding:8px;background:var(--bg-input);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);font-size:13px;resize:vertical;"></textarea>
      <button class="btn btn-primary" style="margin-top:8px;" onclick="Schedule.addFromUI()">📅 追加する</button>
    </div>`;

    // 今後の予定リスト
    html += this.buildUpcomingList();

    html += `</div>`;
    App.addSystemMessage(html);
  },

  // 月の表示
  showMonth(y, m) {
    if (m < 0) { y--; m = 11; }
    if (m > 11) { y++; m = 0; }
    const schedules = this.loadAll();

    let html = `<div class="glass-card highlight">
      <div class="report-title">📅 面談スケジュール管理</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <button class="btn btn-secondary btn-sm" onclick="Schedule.showMonth(${y},${m - 1})">◀</button>
        <div style="font-size:16px;font-weight:700;">${y}年 ${m + 1}月</div>
        <button class="btn btn-secondary btn-sm" onclick="Schedule.showMonth(${y},${m + 1})">▶</button>
      </div>`;
    html += this.buildCalendarGrid(y, m);
    html += this.buildUpcomingList();
    html += `</div>`;
    App.addSystemMessage(html);
  },

  // カレンダーグリッド生成
  buildCalendarGrid(y, m) {
    const schedules = this.loadAll();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();

    let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:12px;">`;
    // 曜日ヘッダー
    ['日','月','火','水','木','金','土'].forEach((d, i) => {
      const color = i === 0 ? 'var(--accent-red)' : i === 6 ? 'var(--primary-light)' : 'var(--text-muted)';
      html += `<div style="padding:6px;color:${color};font-weight:600;">${d}</div>`;
    });
    // 空白セル
    for (let i = 0; i < firstDay; i++) html += `<div style="padding:6px;"></div>`;
    // 日付セル
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const hasEvent = schedules.some(s => s.date === dateStr);
      const isToday = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
      let style = 'padding:6px;border-radius:6px;';
      if (isToday) style += 'background:var(--primary);color:#fff;font-weight:700;';
      else if (hasEvent) style += 'background:rgba(108,99,255,0.15);color:var(--primary-light);font-weight:600;';
      html += `<div style="${style}">${d}${hasEvent ? '<div style="width:4px;height:4px;background:var(--accent-green);border-radius:50%;margin:2px auto 0;"></div>' : ''}</div>`;
    }
    html += `</div>`;
    return html;
  },

  // 今後の予定リスト
  buildUpcomingList() {
    const schedules = this.loadAll()
      .filter(s => new Date(s.date + 'T' + (s.time || '00:00')) >= new Date(new Date().setHours(0,0,0,0)))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (schedules.length === 0) {
      return `<div style="margin-top:16px;padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">今後の予定はありません</div>`;
    }

    let html = `<div style="margin-top:16px;border-top:1px solid var(--border-secondary);padding-top:12px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📋 今後の予定</div>`;
    schedules.forEach(s => {
      const dt = new Date(s.date + 'T' + (s.time || '00:00'));
      const daysUntil = Math.ceil((dt - new Date()) / 86400000);
      const urgColor = daysUntil <= 3 ? 'var(--accent-red)' : daysUntil <= 7 ? 'var(--accent-gold)' : 'var(--text-muted)';
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;margin-bottom:4px;background:var(--bg-secondary);border-radius:8px;">
        <div>
          <div style="font-size:13px;font-weight:600;">${s.bank || '（名称なし）'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${s.date} ${s.time || ''} ${s.memo ? '— ' + s.memo.slice(0, 30) : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;color:${urgColor};font-weight:600;">${daysUntil > 0 ? daysUntil + '日後' : '今日'}</span>
          <button class="btn btn-secondary btn-sm" onclick="Schedule.remove('${s.id}');Schedule.show();" style="padding:2px 8px;font-size:11px;">✕</button>
        </div>
      </div>`;
    });
    html += `</div>`;
    return html;
  },

  // UIから予定を追加
  addFromUI() {
    const date = document.getElementById('schedDate')?.value;
    const time = document.getElementById('schedTime')?.value;
    const bank = document.getElementById('schedBank')?.value;
    const memo = document.getElementById('schedMemo')?.value;

    if (!date || !bank) {
      App.addSystemMessage(Utils.createAlert('warning', '⚠️', '日付と銀行名は必須です'));
      return;
    }

    this.add({ date, time, bank, memo });
    App.addSystemMessage(Utils.createAlert('success', '✅', `${bank}の予定を追加しました`));
    this.show();
  }
};
