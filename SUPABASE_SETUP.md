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

