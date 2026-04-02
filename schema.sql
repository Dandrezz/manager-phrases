CREATE TABLE IF NOT EXISTS frases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  texto TEXT NOT NULL,
  etiquetas TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);
