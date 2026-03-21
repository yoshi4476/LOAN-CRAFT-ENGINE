/* ============================================================
 * LOAN CRAFT ENGINE v5.0 - DB初期化（PostgreSQL対応）
 * レイウェイのPostgreSQLアドオンに接続
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
    `);
    console.log('  ✅ PostgreSQLテーブル初期化完了');
  } finally {
    client.release();
  }
  return pool;
}

// saveDb は PostgreSQL では不要（自動永続化）
function saveDb() {}

// ヘルパー: INSERT/UPDATE/DELETE 実行
function dbRun(sql, params = []) {
  // SQLiteの ? パラメータを PostgreSQLの $1 $2 に変換
  let pgSql = sql;
  let idx = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++idx}`);

  // datetime("now") を NOW() に変換
  pgSql = pgSql.replace(/datetime\(['"]now['"]\)/gi, 'NOW()');

  // 同期的に呼ばれるため、内部でPromiseを使いつつ結果を返す
  // RETURNING id で lastInsertRowid を取得
  const hasInsert = /^\s*INSERT/i.test(pgSql);
  if (hasInsert && !/RETURNING/i.test(pgSql)) {
    pgSql = pgSql.replace(/\)\s*$/, ') RETURNING id');
    // VALUES (...) の後に RETURNING id を付ける
    if (!/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING id';
    }
  }

  // 同期互換ラッパー（deasync）
  let result = { lastInsertRowid: 0 };
  const deasync = require('deasync');
  let done = false;

  pool.query(pgSql, params).then(res => {
    if (res.rows && res.rows.length > 0 && res.rows[0].id !== undefined) {
      result.lastInsertRowid = res.rows[0].id;
    }
    done = true;
  }).catch(err => {
    console.error('[DB ERROR] dbRun:', err.message, '\nSQL:', pgSql);
    done = true;
  });

  deasync.loopWhile(() => !done);
  return result;
}

// ヘルパー: SELECT 1行取得
function dbGet(sql, params = []) {
  let pgSql = sql;
  let idx = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++idx}`);
  pgSql = pgSql.replace(/datetime\(['"]now['"]\)/gi, 'NOW()');

  let result = null;
  const deasync = require('deasync');
  let done = false;

  pool.query(pgSql, params).then(res => {
    result = res.rows.length > 0 ? res.rows[0] : null;
    done = true;
  }).catch(err => {
    console.error('[DB ERROR] dbGet:', err.message, '\nSQL:', pgSql);
    done = true;
  });

  deasync.loopWhile(() => !done);
  return result;
}

// ヘルパー: SELECT 全行取得
function dbAll(sql, params = []) {
  let pgSql = sql;
  let idx = 0;
  pgSql = pgSql.replace(/\?/g, () => `$${++idx}`);
  pgSql = pgSql.replace(/datetime\(['"]now['"]\)/gi, 'NOW()');

  let result = [];
  const deasync = require('deasync');
  let done = false;

  pool.query(pgSql, params).then(res => {
    result = res.rows;
    done = true;
  }).catch(err => {
    console.error('[DB ERROR] dbAll:', err.message, '\nSQL:', pgSql);
    done = true;
  });

  deasync.loopWhile(() => !done);
  return result;
}

module.exports = { getDb, saveDb, dbRun, dbGet, dbAll, pool };
