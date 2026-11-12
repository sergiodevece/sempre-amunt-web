CREATE TABLE editorial_articles (
  slug TEXT PRIMARY KEY NOT NULL,
  source_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  published_date TEXT NOT NULL,
  published_at TEXT NOT NULL,
  payload TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX editorial_articles_date ON editorial_articles (published_date DESC, slug DESC);
--> statement-breakpoint
CREATE TABLE editorial_sports (
  section TEXT NOT NULL,
  edition_date TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (section, edition_date)
);
--> statement-breakpoint
CREATE TABLE editorial_runs (
  edition_date TEXT PRIMARY KEY NOT NULL,
  checked_at TEXT NOT NULL
);
