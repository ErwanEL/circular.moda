-- ============================================
-- Solution pour le problème de FK sur gender TEXT[]
-- ============================================
-- PostgreSQL ne peut pas avoir une FK directe sur un tableau TEXT[]
-- Cette solution crée une fonction de validation + un trigger

-- Étape 1: Créer une fonction de validation
-- Cette fonction vérifie que chaque élément du tableau gender existe dans la table genders
CREATE OR REPLACE FUNCTION validate_gender_array(gender_array TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Si le tableau est NULL ou vide, c'est valide
  IF gender_array IS NULL OR array_length(gender_array, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier que chaque élément du tableau existe dans la table genders
  RETURN NOT EXISTS (
    SELECT 1
    FROM unnest(gender_array) AS g
    WHERE NOT EXISTS (
      SELECT 1 FROM genders WHERE gender = g
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Étape 2: Créer un trigger pour valider avant insertion/mise à jour
CREATE OR REPLACE FUNCTION check_gender_fk()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.gender IS NOT NULL AND array_length(NEW.gender, 1) > 0 THEN
    IF NOT validate_gender_array(NEW.gender) THEN
      RAISE EXCEPTION 'Un ou plusieurs genres dans le tableau n''existent pas dans la table genders. Genres valides: %, Genres fournis: %', 
        (SELECT string_agg(gender, ', ') FROM genders),
        array_to_string(NEW.gender, ', ');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Étape 3: Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS validate_gender_trigger ON products;

-- Étape 4: Créer le trigger
CREATE TRIGGER validate_gender_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_gender_fk();

-- Étape 5: Supprimer la contrainte FK problématique
-- (PostgreSQL ne peut pas vérifier une FK sur chaque élément d'un tableau)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_gender_fkey;

-- ============================================
-- Vérification
-- ============================================
-- Testez avec :
-- INSERT INTO products (name, public_id, images, gender)
-- VALUES ('Test', gen_random_uuid(), ARRAY['url1'], ARRAY['unisex']);
-- 
-- Cela devrait fonctionner maintenant !
-- 
-- Pour tester une erreur :
-- INSERT INTO products (name, public_id, images, gender)
-- VALUES ('Test', gen_random_uuid(), ARRAY['url1'], ARRAY['invalid_gender']);
-- 
-- Cela devrait lever une erreur avec le message de validation
