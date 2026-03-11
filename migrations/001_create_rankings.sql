CREATE TABLE IF NOT EXISTS rankings (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  wave INTEGER NOT NULL,
  played_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rankings_sort
  ON rankings (score DESC, wave DESC, played_at DESC);
