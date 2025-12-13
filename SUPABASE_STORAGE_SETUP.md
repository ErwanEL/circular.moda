# Configuration Supabase Storage pour l'Upload de Produits

## 📋 Prérequis

1. **Bucket "storage" créé** dans Supabase Storage
2. **Permissions configurées** pour permettre l'upload

## 🔧 Configuration dans Supabase Dashboard

### 1. Créer le Bucket (si pas déjà fait)

1. Allez dans **Storage** dans le menu Supabase
2. Cliquez sur **New bucket**
3. Nom : `storage`
4. **Public bucket** : ✅ Activé (pour que les images soient accessibles publiquement)
5. Cliquez sur **Create bucket**

### 2. Configurer les Permissions

#### Option A : Bucket Public (Recommandé pour les images)

1. Allez dans **Storage** → **Policies**
2. Sélectionnez le bucket `storage`
3. Créez une politique pour permettre l'upload :

```sql
-- Policy pour permettre l'upload (INSERT)
CREATE POLICY "Allow public uploads to storage"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'storage');

-- Policy pour permettre la lecture (SELECT)
CREATE POLICY "Allow public reads from storage"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'storage');
```

#### Option B : Utiliser Service Role Key (Déjà configuré)

Le code utilise `SUPABASE_SERVICE_ROLE_KEY` qui bypass les RLS, donc les permissions ci-dessus ne sont pas strictement nécessaires, mais recommandées pour la sécurité.

### 3. Structure des Dossiers

Les images seront uploadées dans :
```
storage/
  └── products_preprod/
      ├── {public_id}-1.jpg
      ├── {public_id}-2.jpg
      └── ...
```

## 📝 Structure de la Table `products_preprod`

Assurez-vous que la table `products_preprod` existe avec cette structure :

```sql
CREATE TABLE products_preprod (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  public_id UUID UNIQUE NOT NULL,
  images TEXT[] DEFAULT '{}',
  -- Ajoutez d'autres colonnes selon vos besoins
);
```

## 🚀 Utilisation

1. Accédez à `/admin/upload-product`
2. Entrez le nom du produit
3. Glissez-déposez ou sélectionnez des images
4. Cliquez sur "Uploader le produit"

## 🔍 Vérification

Après l'upload, vous pouvez vérifier :

1. **Dans Supabase Storage** : Les images devraient apparaître dans `storage/products_preprod/`
2. **Dans la table** : Le produit devrait apparaître dans `products_preprod` avec :
   - `name` : Le nom du produit
   - `public_id` : Un UUID unique
   - `images` : Un array d'URLs publiques des images

## 📝 Notes

- Les images sont nommées : `{public_id}-{index}.{extension}`
- Les URLs publiques sont au format : `https://{project}.supabase.co/storage/v1/object/public/storage/products_preprod/{filename}`
- Le `public_id` peut être utilisé pour générer le slug du produit plus tard

