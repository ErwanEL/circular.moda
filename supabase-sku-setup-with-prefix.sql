-- ============================================
-- Configuration SKU avec préfixe "SB-" pour Supabase Products
-- ============================================
-- Ce script crée une colonne SKU et configure l'auto-génération avec préfixe
-- Les SKUs seront: SB-250, SB-251, SB-252, etc.

-- Étape 1: Ajouter la colonne SKU si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'SKU'
  ) THEN
    ALTER TABLE products ADD COLUMN "SKU" TEXT UNIQUE;
    RAISE NOTICE 'Colonne SKU créée';
  ELSE
    RAISE NOTICE 'Colonne SKU existe déjà';
  END IF;
END $$;

-- Étape 2: Créer la séquence qui commence à 250
CREATE SEQUENCE IF NOT EXISTS product_sku_seq START 250;

-- Étape 3: Fonction trigger pour auto-générer le SKU avec préfixe "SB-"
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Si SKU n'est pas fourni, générer depuis la séquence avec préfixe
  IF NEW."SKU" IS NULL OR NEW."SKU" = '' THEN
    NEW."SKU" := 'SB-' || nextval('product_sku_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 4: Créer le trigger (supprimer d'abord s'il existe)
DROP TRIGGER IF EXISTS set_product_sku ON products;

CREATE TRIGGER set_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();

-- Étape 5 (Optionnel): Remplir les SKUs pour les produits existants
-- Si vous avez déjà des produits sans SKU, exécutez ceci :
-- UPDATE products 
-- SET "SKU" = 'SB-' || nextval('product_sku_seq')::TEXT 
-- WHERE "SKU" IS NULL OR "SKU" = '';

-- ============================================
-- Vérification
-- ============================================
-- Testez avec :
-- INSERT INTO products (name, price, category)
-- VALUES ('Test Product', 10000, 'test');
-- 
-- SELECT "SKU", name FROM products WHERE name = 'Test Product';
-- 
-- DELETE FROM products WHERE name = 'Test Product';

