CREATE TABLE IF NOT EXISTS ranking_submission_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ranking_submission_log_fingerprint_created_at
  ON ranking_submission_log (fingerprint, created_at DESC);
