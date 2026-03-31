/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - DB初期化（PostgreSQL対応・async版）
 * deasync不要 — 全て async/await で動作
 * ============================================================ */
const { Pool } = require('pg');

// レイウェイが自動設定する DATABASE_URL を使用
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// DB初期化（テーブル作成）
async function getDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        plan TEXT DEFAULT 'Free',
        status TEXT DEFAULT 'Active',
        role TEXT DEFAULT 'user',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        renewal_date TIMESTAMPTZ,
        memo TEXT,
        deleted_at TIMESTAMPTZ,
        deleted_by INTEGER,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS company_data (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS rating_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        score REAL,
        grade TEXT,
        mode TEXT,
        detail TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS cases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        case_id TEXT,
        institution TEXT,
        amount REAL,
        purpose TEXT,
        result TEXT,
        detail TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action TEXT NOT NULL,
        detail TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS api_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        model TEXT,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS license_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        license_key TEXT UNIQUE NOT NULL,
        plan TEXT DEFAULT 'Free',
        issued_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS file_versions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        content TEXT,
        size INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS saved_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        doc_id TEXT NOT NULL,
        doc_name TEXT,
        content TEXT,
        mode TEXT DEFAULT 'template',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS learning_cases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        result TEXT NOT NULL,
        bank TEXT,
        amount REAL,
        fail_reason TEXT,
        memo TEXT,
        company_snapshot TEXT,
        doc_snapshot TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        type TEXT DEFAULT 'meeting',
        bank TEXT,
        memo TEXT,
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS financial_statements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        company_name TEXT,
        statement_type TEXT DEFAULT 'standalone',
        period_label TEXT,
        period_months INTEGER DEFAULT 12,
        unit TEXT DEFAULT 'thousand',
        pl_data TEXT,
        bs_data TEXT,
        cf_data TEXT,
        adjustments TEXT,
        validation_errors TEXT,
        is_consolidated INTEGER DEFAULT 0,
        subsidiaries TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS business_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        version_name TEXT NOT NULL,
        company_name TEXT,
        plan_years INTEGER DEFAULT 10,
        actual_periods INTEGER DEFAULT 3,
        stress_factor REAL DEFAULT 1.03,
        corporate_tax_rate REAL DEFAULT 0.35,
        pl_plan TEXT,
        bs_plan TEXT,
        cf_plan TEXT,
        fixed_assets TEXT,
        debt_schedule TEXT,
        segment_details TEXT,
        is_locked INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS credit_ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tenant_id INTEGER DEFAULT 1,
        company_name TEXT,
        rating_date TIMESTAMPTZ DEFAULT NOW(),
        quantitative_scores TEXT,
        qualitative_scores TEXT,
        real_bs_adj TEXT,
        real_pl_adj TEXT,
        operating_cf REAL,
        repayment_years REAL,
        debtor_category TEXT,
        personal_assets TEXT,
        adjusted_category TEXT,
        report_html TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        plan TEXT DEFAULT 'Free',
        status TEXT DEFAULT 'Active',
        api_token_usage INTEGER DEFAULT 0,
        openai_api_key TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // ▼ 既存環境へのマイグレーション（tenant_id カラムの追加）
    const tables = [
      'users', 'company_data', 'rating_results', 'cases', 'audit_logs', 'api_usage',
      'license_keys', 'file_versions', 'saved_documents', 'learning_cases', 'schedules',
      'financial_statements', 'business_plans', 'credit_ratings'
    ];
    for (const t of tables) {
      try {
        await client.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS tenant_id INTEGER DEFAULT 1;`);
      } catch (e) {
        console.warn(\`⚠️ \${t} テーブルへの tenant_id 追加スキップ: \`, e.message);
      }
    }
    
    // ▼ デフォルトテナント（ID=1）の確保
    try {
      await client.query(\`INSERT INTO tenants (id, name, plan) VALUES (1, 'Default Tenant', 'Pro') ON CONFLICT DO NOTHING;\`);
    } catch(e) {}
    
    console.log('  ✅ PostgreSQLテーブル初期化＆マイグレーション完了');
  } finally {
    client.release();
  }
  return pool;
}

// saveDb は PostgreSQL では不要（自動永続化）
function saveDb() {}

// SQLite ? → PostgreSQL $1 $2 変換ヘルパー
function convertSql(sql) {
  let pgSql = sql;
  let idx = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++idx}`);
  pgSql = pgSql.replace(/datetime\(['"]now['"]\)/gi, 'NOW()');
  pgSql = pgSql.replace(/datetime\(['"]now['"],\s*['"]\+(\d+)\s+days['"]\)/gi, "NOW() + INTERVAL '$1 days'");
  return pgSql;
}

// async版: INSERT/UPDATE/DELETE
async function dbRun(sql, params = []) {
  let pgSql = convertSql(sql);
  const hasInsert = /^\s*INSERT/i.test(pgSql);
  if (hasInsert && !/RETURNING/i.test(pgSql)) {
    pgSql = pgSql.replace(/\)\s*$/, ') RETURNING id');
    if (!/RETURNING/i.test(pgSql)) pgSql += ' RETURNING id';
  }
  try {
    const res = await pool.query(pgSql, params);
    return { lastInsertRowid: (res.rows && res.rows.length > 0 && res.rows[0].id !== undefined) ? res.rows[0].id : 0 };
  } catch(err) {
    console.error('[DB ERROR] dbRun:', err.message, '\nSQL:', pgSql);
    return { lastInsertRowid: 0 };
  }
}

// async版: SELECT 1行
async function dbGet(sql, params = []) {
  const pgSql = convertSql(sql);
  try {
    const res = await pool.query(pgSql, params);
    return res.rows.length > 0 ? res.rows[0] : null;
  } catch(err) {
    console.error('[DB ERROR] dbGet:', err.message, '\nSQL:', pgSql);
    return null;
  }
}

// async版: SELECT 全行
async function dbAll(sql, params = []) {
  const pgSql = convertSql(sql);
  try {
    const res = await pool.query(pgSql, params);
    return res.rows;
  } catch(err) {
    console.error('[DB ERROR] dbAll:', err.message, '\nSQL:', pgSql);
    return [];
  }
}

module.exports = { getDb, saveDb, dbRun, dbGet, dbAll, pool };
