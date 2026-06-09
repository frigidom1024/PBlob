CREATE TABLE IF NOT EXISTS articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  content       TEXT NOT NULL DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '[]',
  category      TEXT NOT NULL DEFAULT '随笔',
  cover_image   TEXT,
  published     INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME DEFAULT (datetime('now')),
  updated_at    DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  excerpt       TEXT NOT NULL DEFAULT '',
  content       TEXT DEFAULT '',
  tags          TEXT NOT NULL DEFAULT '[]',
  cover_image   TEXT,
  url           TEXT,
  published     INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME DEFAULT (datetime('now')),
  updated_at    DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id     INTEGER UNIQUE NOT NULL,
  github_login  TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',
  created_at    DATETIME DEFAULT (datetime('now'))
);
