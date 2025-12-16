    -- Supabase schema for Obras-pro
-- Run this in Supabase SQL Editor to create tables and seed data.

-- Installers table
CREATE TABLE IF NOT EXISTS installers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  created_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  defaultPrice numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  orderNumber TEXT,
  clientName TEXT NOT NULL,
  address TEXT,
  date timestamptz,
  description TEXT,
  value numeric,
  status TEXT,
  paymentStatus TEXT,
  installerId TEXT REFERENCES installers(id) ON DELETE SET NULL,
  notes TEXT,
  items jsonb,
  photoUrl TEXT,
  created_at timestamptz DEFAULT now()
);

-- Optional: seed example data
INSERT INTO installers (id, name, specialty, phone)
VALUES
  ('inst-1', 'Roberto Lima', 'Eletricista', '+55 11 90000-0001'),
  ('inst-2', 'Ana Souza', 'Hidráulica', '+55 11 90000-0002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, name, defaultPrice)
VALUES
  ('svc-1', 'Instalação de painéis', 1500.00),
  ('svc-2', 'Reparo hidráulico', 250.00),
  ('svc-3', 'Pintura', 500.00)
ON CONFLICT (id) DO NOTHING;

-- Example job (items stored as jsonb)
INSERT INTO jobs (id, orderNumber, clientName, address, date, description, value, status, paymentStatus, installerId, notes, items, photoUrl)
VALUES (
  'job-1',
  'ORD-0001',
  'Construtora Tech',
  'Rua Exemplo, 123',
  now(),
  'Instalação de painéis',
  1500.00,
  'SCHEDULED',
  'PENDING',
  'inst-1',
  'Observações de teste',
  '[{"name":"Instalação de painéis","quantity":1,"pricePerUnit":1500.00,"total":1500.00}]'::jsonb,
  ''
)
ON CONFLICT (id) DO NOTHING;
