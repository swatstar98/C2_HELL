-- Esquema D1 de C2 HELL. Idempotente: se puede volver a ejecutar sin perder datos.
-- WITHOUT ROWID: una sola escritura por fila (la cuota gratuita cuenta filas escritas, índices incluidos).
CREATE TABLE IF NOT EXISTS counters (day TEXT NOT NULL, k TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, k)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS dau (day TEXT NOT NULL, id TEXT NOT NULL, PRIMARY KEY (day, id)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS scores (board TEXT NOT NULL, id TEXT NOT NULL, score INTEGER NOT NULL, nick TEXT NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (board, id)) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS scores_top ON scores (board, score DESC);
CREATE TABLE IF NOT EXISTS saves (code TEXT PRIMARY KEY, data TEXT NOT NULL, t INTEGER NOT NULL) WITHOUT ROWID;
