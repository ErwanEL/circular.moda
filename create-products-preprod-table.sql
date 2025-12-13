-- ============================================
-- Créer la table products_preprod
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

CREATE TABLE IF NOT EXISTS products_preprod (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  public_id UUID UNIQUE NOT NULL,
  images TEXT[] DEFAULT '{}',
  -- Champs optionnels (ajoutez selon vos besoins)
  price NUMERIC,
  category TEXT,
  size TEXT,
  color TEXT,
  description TEXT,
  stock INTEGER DEFAULT 1
);

-- Créer un index sur public_id pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_products_preprod_public_id ON products_preprod(public_id);

-- Créer un index sur created_at pour le tri
CREATE INDEX IF NOT EXISTS idx_products_preprod_created_at ON products_preprod(created_at DESC);

-- ============================================
-- Vérification
-- ============================================
-- Vérifiez que la table a été créée :
-- SELECT * FROM products_preprod LIMIT 1;

