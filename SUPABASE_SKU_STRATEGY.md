# Stratégie SKU pour les Nouveaux Produits Supabase

## Situation Actuelle
- **Dernier SKU Airtable** : 249
- **Total produits JSON** : 190 produits
- **Plage SKU** : 20 - 249

## Options Recommandées

### ✅ Option 1 : Séquence PostgreSQL Auto-Increment (RECOMMANDÉE)

**Avantages :**
- Automatique, pas de gestion manuelle
- Garantit l'unicité
- Commence à 250 (après le dernier SKU Airtable)
- Pas de conflit possible

**Implémentation :**

1. **Créer une séquence PostgreSQL dans Supabase :**

```sql
-- Créer une séquence qui commence à 250
CREATE SEQUENCE product_sku_seq START 250;

-- Créer une fonction trigger pour auto-générer le SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Si SKU n'est pas fourni, générer depuis la séquence
  IF NEW."SKU" IS NULL OR NEW."SKU" = '' THEN
    NEW."SKU" := 'SB-' || nextval('product_sku_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
CREATE TRIGGER set_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();
```

2. **Alternative plus simple (SKU numérique uniquement) :**

```sql
-- Séquence simple qui commence à 250
CREATE SEQUENCE product_sku_seq START 250;

-- Trigger pour SKU numérique
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."SKU" IS NULL OR NEW."SKU" = '' THEN
    NEW."SKU" := nextval('product_sku_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();
```

**Utilisation :**
- Lors de l'insertion d'un nouveau produit, laissez `SKU` vide ou `NULL`
- Le trigger générera automatiquement le SKU suivant (250, 251, 252...)

---

### Option 2 : Préfixe "SB-" pour Distinction

**Avantages :**
- Distinction claire entre produits Airtable et Supabase
- Facile à identifier la source

**Implémentation :**

```sql
-- Séquence avec préfixe
CREATE SEQUENCE product_sku_seq START 250;

CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."SKU" IS NULL OR NEW."SKU" = '' THEN
    NEW."SKU" := 'SB-' || nextval('product_sku_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_sku
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_sku();
```

**Résultat :** SKUs comme `SB-250`, `SB-251`, etc.

---

### Option 3 : Gestion Manuelle (Simple mais moins robuste)

**Avantages :**
- Pas de configuration SQL nécessaire
- Contrôle total

**Inconvénients :**
- Risque de conflit si plusieurs utilisateurs créent des produits simultanément
- Nécessite de vérifier manuellement le dernier SKU

**Implémentation :**
- Commencer les nouveaux produits Supabase à SKU 250
- Vérifier le dernier SKU avant chaque insertion

---

## Recommandation Finale

**✅ Option 1 (Séquence PostgreSQL)** est la meilleure solution car :
1. **Automatique** : Pas de gestion manuelle
2. **Sûre** : Garantit l'unicité même avec plusieurs insertions simultanées
3. **Cohérente** : Continue la séquence naturelle (250, 251, 252...)
4. **Flexible** : Permet toujours de définir un SKU manuel si nécessaire

## Migration des Produits Existants

Si vous avez déjà des produits dans Supabase avec des SKUs :
1. Vérifiez le SKU le plus élevé dans Supabase
2. Ajustez la séquence : `SELECT setval('product_sku_seq', MAX("SKU"::INTEGER)) FROM products;`
3. Ou définissez la séquence manuellement : `SELECT setval('product_sku_seq', 250);`

## Vérification

Après configuration, testez avec :

```sql
-- Insérer un produit sans SKU
INSERT INTO products ("Product Name", "Price", category)
VALUES ('Test Product', 10000, 'test');

-- Vérifier que le SKU a été généré
SELECT "SKU" FROM products WHERE "Product Name" = 'Test Product';
```

