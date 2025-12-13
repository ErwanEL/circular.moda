# Configuration Supabase

## Variables d'Environnement Requises

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Comment Obtenir les Clés

### 1. URL du Projet (`NEXT_PUBLIC_SUPABASE_URL`)

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez l'**Project URL** (format: `https://xxxxx.supabase.co`)

### 2. Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)

1. Dans **Settings** → **API**
2. Trouvez la section **Project API keys**
3. Copiez la **`service_role`** key (⚠️ **NE JAMAIS** exposer cette clé côté client !)

**Note**: La `service_role` key bypass les Row Level Security (RLS). Utilisez-la uniquement pour les opérations serveur.

### Alternative: Anon Key (si vous utilisez RLS)

Si vous préférez utiliser l'anon key (qui respecte RLS) :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Structure de la Table Supabase

Assurez-vous que votre table `products` dans Supabase a cette structure :

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  "Product Name" TEXT,
  "SKU" TEXT UNIQUE,
  "Price" NUMERIC,
  category TEXT,
  stock INTEGER DEFAULT 1,
  color TEXT,
  "Size" TEXT,
  description TEXT,
  gender TEXT[],
  "Date" TIMESTAMPTZ,
  "User ID" TEXT[],
  "Images" JSONB DEFAULT '[]'::jsonb,
  slug TEXT,
  airtable_id TEXT
);
```

## Auto-Génération des SKUs (Recommandé)

Pour éviter les conflits avec les produits Airtable existants (dernier SKU: 249), configurez une séquence PostgreSQL qui génère automatiquement les SKUs à partir de 250 :

```sql
-- Créer une séquence qui commence à 250 (après le dernier SKU Airtable)
CREATE SEQUENCE product_sku_seq START 250;

-- Fonction trigger pour auto-générer le SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- Si SKU n'est pas fourni, générer depuis la séquence
  IF NEW."SKU" IS NULL OR NEW."SKU" = '' THEN
    NEW."SKU" := nextval('product_sku_seq')::TEXT;
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

**Résultat :** Les nouveaux produits auront automatiquement des SKUs 250, 251, 252, etc.

**Note :** Vous pouvez toujours définir un SKU manuellement lors de l'insertion, le trigger ne s'activera que si le SKU est vide ou NULL.

Voir `SUPABASE_SKU_STRATEGY.md` pour plus de détails et d'alternatives.

## Fonctionnement

Le système utilise une **approche hybride** :

1. **Anciens produits** : Lus depuis `data/products.json`
2. **Nouveaux produits** : Récupérés depuis Supabase
3. **Fusion automatique** : Les deux sources sont combinées
4. **Priorité Supabase** : Si un produit existe dans les deux sources, la version Supabase est utilisée

## Test

Après avoir configuré les variables :

1. Redémarrez le serveur de développement
2. Les produits Supabase devraient apparaître automatiquement
3. Vérifiez les logs de la console pour voir le nombre de produits chargés

