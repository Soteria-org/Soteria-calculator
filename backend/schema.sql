-- Soteria Calculator — records backend schema.
--
-- This database is deliberately dumb storage. It never recomputes a price —
-- `quotes.result_json` is a frozen snapshot of whatever
-- lib/calculator-engine.ts (the ONLY place price gets computed) produced at
-- save time. If the pricing config changes later, past quotes must not
-- silently reprice themselves; that's what freezing the snapshot buys us.
--
-- Import into MySQL (e.g. via phpMyAdmin under XAMPP):
--   CREATE DATABASE soteria_calculator;
--   USE soteria_calculator;
--   (then run this file)

CREATE TABLE IF NOT EXISTS clients (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  project_type VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One project can carry several quotes over time (revisions). Only the
-- data needed to redraw the calculator's breakdown is stored — input_json
-- is a ProjectInput, result_json is the matching EstimateResult, both
-- exactly as lib/types.ts defines them.
CREATE TABLE IF NOT EXISTS quotes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  status ENUM('draft','sent','accepted','expired') NOT NULL DEFAULT 'draft',
  input_json JSON NOT NULL,
  result_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  accepted_at DATETIME NULL,
  CONSTRAINT fk_quotes_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- amount_ugx is copied from the quote's already-computed scenario
-- (deposit/balance/full) or entered directly for 'custom' — never
-- recalculated here.
CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  quote_id INT UNSIGNED NULL,
  invoice_number VARCHAR(32) NOT NULL UNIQUE,
  type ENUM('deposit','balance','full','maintenance','custom') NOT NULL,
  description VARCHAR(500) NULL,
  amount_ugx BIGINT UNSIGNED NOT NULL,
  status ENUM('unpaid','partial','paid','void') NOT NULL DEFAULT 'unpaid',
  due_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoices_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_invoices_quote FOREIGN KEY (quote_id) REFERENCES quotes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- `covers` is free text describing what THIS payment specifically applies
-- to — important once an invoice is settled in more than one partial
-- payment (e.g. "half of the deposit, remainder due on signing").
CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT UNSIGNED NOT NULL,
  amount_ugx BIGINT UNSIGNED NOT NULL,
  method VARCHAR(64) NOT NULL,
  covers VARCHAR(500) NULL,
  paid_at DATE NOT NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One receipt per payment — issued the moment a payment is recorded.
CREATE TABLE IF NOT EXISTS receipts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id INT UNSIGNED NOT NULL UNIQUE,
  receipt_number VARCHAR(32) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_receipts_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
