-- ============================================
-- Créer la table users
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  -- Ajoutez d'autres champs selon vos besoins
  email TEXT,
  address TEXT
);

-- Créer un index sur le téléphone pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Créer un index sur le nom pour les recherches
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- ============================================
-- Vérification
-- ============================================
-- Vérifiez que la table a été créée :
-- SELECT * FROM users LIMIT 1;

