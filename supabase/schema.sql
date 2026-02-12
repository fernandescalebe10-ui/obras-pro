    -- Supabase schema for Obras-pro
-- Run this in Supabase SQL Editor to create tables and seed data.

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Note: In production, use Supabase Auth instead
  cityId INTEGER,
  created_at timestamptz DEFAULT now()
);

-- Installers table
CREATE TABLE IF NOT EXISTS installers (
  id TEXT PRIMARY KEY,
  cityId INTEGER,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  pixKey TEXT,
  photoUrl TEXT,
  created_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  cityId INTEGER,
  name TEXT NOT NULL,
  defaultPrice numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  cityId INTEGER,
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
  qtd_servicos jsonb,
  photoUrl TEXT,
  pdfUrl TEXT,
  created_at timestamptz DEFAULT now()
);

-- Optional: seed example data
INSERT INTO users (name, email, password, cityId)
VALUES
  ('Admin', 'admin@granpisos.com', 'admin123', 1),
  ('Usuario Teste', 'teste@granpisos.com', 'teste123', 1)
ON CONFLICT (email) DO NOTHING;

INSERT INTO installers (id, cityId, name, specialty, phone, active, pixKey, photoUrl)
VALUES
  ('inst-1', 1, 'Roberto Lima', 'Eletricista', '+55 11 90000-0001', true, 'roberto@email.com', ''),
  ('inst-2', 1, 'Ana Souza', 'Hidráulica', '+55 11 90000-0002', true, '+5511990000002', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, cityId, name, defaultPrice)
VALUES
  ('svc-1', 1, 'Instalação de painéis', 1500.00),
  ('svc-2', 1, 'Reparo hidráulico', 250.00),
  ('svc-3', 1, 'Pintura', 500.00)
ON CONFLICT (id) DO NOTHING;

-- Example job (items stored as jsonb)
INSERT INTO jobs (id, cityId, orderNumber, clientName, address, date, description, value, status, paymentStatus, installerId, notes, qtd_servicos)
VALUES (
  'job-1',
  1,
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
  '[{"item":"Instalação de painéis","qtd":1,"pricePerUnit":1500,"total":1500}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
