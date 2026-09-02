# Instagram Product Publishing

Date de mise en place : 2026-09-02.

Cette documentation explique comment `circular.moda` publie des produits Supabase
sur Instagram via l'Instagram Graph API, quelles etapes Meta ont ete faites, et
comment tester ou relancer la publication.

Ne jamais commiter de token Meta, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` ou
secret d'app Meta dans cette documentation.

## Objectif

Le besoin initial etait de synchroniser les articles du site avec Instagram :

- prendre les produits stockes dans Supabase ;
- publier leur image principale sur le compte Instagram professionnel ;
- ajouter une description claire avec prix, taille, disponibilite et lien produit ;
- eviter les doublons ;
- garder une trace des publications et des erreurs ;
- permettre aux utilisateurs Instagram d'acceder au site.

Contrainte importante : les liens dans les captions Instagram ne sont pas
cliquables. La solution retenue est donc :

- mettre le lien produit en texte, sur une ligne dediee, pour qu'il soit facile a
  copier ;
- mettre un lien cliquable stable en bio vers `https://circular.moda/instagram`.

## Comptes et IDs Meta

Compte Instagram :

- username : `circular_punto_moda`
- type : compte professionnel
- Instagram Graph API user ID : `17841430654232393`

Application Meta :

- nom : `Circular Moda Publisher`
- configuration : use case `Manage messaging & content on Instagram`
- flow utilise : `API setup with Facebook login`

Page Facebook selectionnee pendant l'autorisation :

- nom : `Circular.moda`
- Page ID vu dans le flow d'autorisation : `758073127384543`
- URL fournie pendant la configuration : `https://www.facebook.com/profile.php?id=61578654000699`

## Etapes Meta effectuees

1. Connexion au compte Meta/Facebook personnel.
2. Verification du compte developpeur Meta par numero de telephone.
3. Creation d'une app Meta Developer :
   - app name : `Circular Moda Publisher`
   - cas d'usage : publication de contenu Instagram pour un compte professionnel
4. L'interface Meta ne proposait pas `Add Product` sur l'app conservee.
5. Configuration via `Use cases` :
   - `Manage messaging & content on Instagram`
   - `Customize`
   - `API setup with Facebook login`
6. Ouverture de `Go to permissions and features`.
7. Ajout des permissions requises :
   - `pages_show_list`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
   - `public_profile`
8. Ouverture de Graph API Explorer.
9. Selection de l'app `Circular Moda Publisher`.
10. Generation d'un User Access Token avec les permissions ci-dessus.
11. Dans le popup d'autorisation :
   - selection du compte Instagram professionnel `circular_punto_moda`
   - selection de la page Facebook `Circular.moda`
   - validation des permissions de lecture profil/posts et de creation de posts
12. Verification de l'IG user :

```text
GET /17841430654232393?fields=id,username,name,profile_picture_url
```

13. Verification de la page et du compte Instagram lie :

```text
GET /me/accounts?fields=name,id,access_token,instagram_business_account
```

Resultat attendu :

- page : `Circular.moda`
- page ID : `758073127384543`
- Instagram Business Account ID : `17841430654232393`

14. Verification du quota de publication :

```text
GET /17841430654232393/content_publishing_limit
```

Le test a retourne `quota_usage: 0` avant les publications reelles.

## Variables d'environnement

Variables necessaires en local et en production :

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://circular.moda

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_IG_USER_ID=17841430654232393
INSTAGRAM_GRAPH_API_VERSION=v26.0
INSTAGRAM_PUBLISHING_ENABLED=true
```

Notes :

- `INSTAGRAM_ACCESS_TOKEN` doit rester secret.
- `INSTAGRAM_IG_USER_ID` est le nom de variable retenu pour l'IG user ID.
- Le token genere dans Graph API Explorer peut expirer rapidement.
- L'erreur Meta `OAuthException 190` signifie generalement token invalide ou
  expire.
- Pour production, echanger le User Access Token court contre un User Access
  Token long-lived avec l'App ID et l'App Secret de la meme app, puis relire
  `/me/accounts` avec ce token long-lived et utiliser le Page Access Token de
  `Circular.moda` comme `INSTAGRAM_ACCESS_TOKEN`.
- `CRON_SECRET` a ete utilise pour proteger les routes internes. S'il a ete
  expose dans un screenshot ou un log partage, il faut le remplacer avant
  production.
- Si un App Secret ou un token Meta est partage dans un chat ou un screenshot,
  il faut le considerer comme expose et le regenerer.

## Base de donnees

Le schema est dans :

- `docs/sql/instagram-product-posts.sql`

Il cree la table :

- `public.instagram_product_posts`

Colonnes principales :

- `product_id`
- `product_slug`
- `product_name`
- `product_url`
- `image_url`
- `source_image_url`
- `caption`
- `status`
- `instagram_container_id`
- `instagram_media_id`
- `instagram_permalink`
- `error`
- `published_at`
- `created_at`
- `updated_at`

Statuts possibles :

- `pending`
- `container_created`
- `publishing`
- `published`
- `failed`
- `skipped`

La table sert a :

- eviter de reposter un produit deja publie ou en cours ;
- garder les IDs Meta renvoyes par l'API ;
- conserver le permalink Instagram ;
- diagnostiquer les echecs sans exposer le token.

Index anti-doublon :

- un index unique partiel empeche plusieurs lignes actives pour le meme
  `product_id` quand le statut est `pending`, `container_created`, `publishing`
  ou `published`.

## Architecture applicative

Fichiers principaux :

- `src/app/lib/instagram-api.ts`
  - client minimal pour Graph API ;
  - creation de media container ;
  - polling du statut de container ;
  - publication du container ;
  - lecture du media publie ;
  - lecture du quota de publication.
- `src/app/lib/instagram-product-planning.ts`
  - selection pure des produits eligibles ;
  - extraction de l'image principale ;
  - construction des URLs produit et image ;
  - formatage de la caption.
- `src/app/lib/instagram-products.ts`
  - orchestration Supabase + Instagram ;
  - dry-run ;
  - publication manuelle ;
  - journalisation des statuts.
- `src/app/api/cron/publish-instagram-products/route.ts`
  - route cron/admin pour dry-run ou batch publish.
- `src/app/api/admin/instagram/publish-product/route.ts`
  - route de publication manuelle d'un produit precis.
- `src/app/api/instagram/product-image/[id]/route.ts`
  - proxy public JPEG pour les images produit.
- `src/app/lib/instagram-bio-products.ts`
  - lecture des produits deja publies sur Instagram.
- `src/app/instagram/page.tsx`
  - page publique a mettre en bio Instagram.

## Selection des produits

La selection part des produits Supabase recents avec ces champs :

- `id`
- `sku`
- `name`
- `public_id`
- `price`
- `size`
- `category`
- `images`
- `created_at`
- `owner`
- `featured`

Regles d'exclusion :

- produit deja publie ou en cours dans `instagram_product_posts` ;
- id manquant ;
- nom manquant ;
- vendeur manquant ;
- contact vendeur manquant dans `users.phone` ;
- slug impossible a construire ;
- image principale publique manquante ;
- stock <= 0 si le champ `stock` est present dans la ligne.

Priorite :

- les produits `featured = true` remontent avant les autres dans le lot examine.

Limites de selection :

- limite par defaut : `3`
- limite max : `10`
- lookahead par defaut : `50`

## Format actuel de caption

Format applique aux prochains posts :

```text
Nom du produit

$ 30.000 · Talle 38 · categorie

Disponible en circular.moda.
Link directo en bio.

Detalle del producto:
https://circular.moda/products/slug-produit

#CircularModa #ModaCircular #RopaSegundaMano #BuenosAires
```

Decisions prises :

- texte en espagnol argentin ;
- lien produit sur sa propre ligne pour faciliter la copie ;
- suppression de la phrase `Si estas desde Instagram...` ;
- hashtags limites et stables ;
- caption limitee a 2200 caracteres.

## Page link in bio

Route publique :

- `GET /instagram`

URL de production visee :

- `https://circular.moda/instagram`

Role :

- afficher les derniers produits publies via Instagram ;
- rendre chaque image/titre cliquable vers la fiche produit ;
- afficher le lien vers le post Instagram ;
- servir de lien unique dans la bio.

La route lit uniquement les lignes `status = published` dans
`instagram_product_posts`.

La route a ete ajoutee au sitemap.

## Routes de test et publication

Toutes les routes internes de publication exigent :

```http
Authorization: Bearer ${CRON_SECRET}
```

### Dry-run batch

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/publish-instagram-products?limit=3&checkQuota=1"
```

Effet :

- ne publie rien ;
- retourne les produits selectionnes ;
- retourne les produits ignores ;
- peut retourner le quota Instagram.

### Publication batch reelle

Preconditions :

- `INSTAGRAM_PUBLISHING_ENABLED=true`
- `INSTAGRAM_ACCESS_TOKEN` valide
- `INSTAGRAM_IG_USER_ID` configure

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/publish-instagram-products?limit=3&publish=1&imageMode=source"
```

### Preview manuel d'un produit

```bash
curl -X POST "http://localhost:3000/api/admin/instagram/publish-product" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"productId":1452,"imageMode":"source"}'
```

Effet :

- ne publie rien ;
- retourne la caption et l'image ;
- demande la confirmation `PUBLISH_TO_INSTAGRAM`.

### Publication manuelle reelle

```bash
curl -X POST "http://localhost:3000/api/admin/instagram/publish-product" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"productId":1452,"imageMode":"source","confirm":"PUBLISH_TO_INSTAGRAM"}'
```

## Images

Deux modes existent :

- `imageMode=proxy`
  - utilise `/api/instagram/product-image/[id]` ;
  - convertit en JPEG avec `sharp` ;
  - utile si l'image source n'est pas directement conforme aux contraintes Meta.
- `imageMode=source`
  - envoie directement l'URL Supabase publique ;
  - utilise si l'image source est deja accessible et retourne `image/jpeg`.

Pendant les tests reels, `imageMode=source` a ete utilise.

Avant publication, le code verifie que l'image est publiquement accessible et
que le `Content-Type` commence par `image/jpeg`.

## Flow Instagram Graph API

La publication suit le flow Meta standard :

1. `POST /{ig-user-id}/media`
   - cree un media container ;
   - parametres principaux : `image_url`, `caption`, `access_token`.
2. `GET /{container-id}?fields=status_code,status`
   - attend `FINISHED`.
3. `POST /{ig-user-id}/media_publish`
   - publie le container avec `creation_id`.
4. `GET /{media-id}?fields=id,permalink`
   - recupere le permalink du post.

Documentation utile :

- Meta/Postman Instagram API collection :
  `https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api`
- Meta Instagram Platform :
  `https://developers.facebook.com/docs/instagram-platform/`

## Tests reels effectues

Les posts suivants ont ete publies le 2026-09-02 pendant la validation, puis
supprimes manuellement d'Instagram a la fin de la Phase 1 de nettoyage. Le
journal Supabase ne contient plus de ligne `published` pour ces tests.

- Produit `1455`
  - nom : `Botines futbol/Rugby cesped 35/36 23 (Nike Jr. Mercurial Superfly 8 Academy MG) ORIGINAL`
  - post : `https://www.instagram.com/p/DcyOlTXDLao/`
  - media ID : `18087340106226444`
  - premier format de caption, avant aeration finale.
- Produit `1454`
  - nom : `Camisa Collusion`
  - post : `https://www.instagram.com/p/DcyP4I_lnOO/`
  - media ID : `17904298713487549`
  - format aere, mais avant suppression de la phrase finale.
- Produit `1453`
  - nom : `Chaqueta vaquera blanca de Zara`
  - post : `https://www.instagram.com/p/DcyRtRqlfwl/`
  - media ID : `18113219779802630`
  - lien sur ligne dediee, mais avant suppression de la phrase finale.
- Produit `1452`
  - nom : `Zapatos`
  - post : `https://www.instagram.com/p/DcySCktlHai/`
  - media ID : `18110332673036472`
  - format final sans la phrase `Si estas desde Instagram...`.

Ces publications ne doivent pas etre considerees comme du contenu de production.

Un premier essai sur le produit `1455` a echoue parce que le token Meta avait
expire. La ligne est restee en `failed` dans `instagram_product_posts`, puis un
second essai a publie correctement.

Erreur constatee :

```text
OAuthException 190
Error validating access token: Session has expired
```

## Phase 2 - publication des featured actuels

Strategie retenue :

- publier un produit featured par jour via cron apres deploiement ;
- ne pas automatiser le renouvellement des featured pour l'instant ;
- refaire manuellement un batch featured local toutes les deux semaines avec
  l'aide de l'analyse IA ;
- avant d'activer le cron quotidien, publier une premiere base de produits
  featured pour donner du contenu initial au compte Instagram.

Les produits featured suivants ont ete publies apres la Phase 1 :

- `1344` : `Zapatillas Adidas negras` -
  `https://www.instagram.com/p/DcyY_-PD2iH/`
- `1337` : `Sandalias blancas con plataforma y brillos` -
  `https://www.instagram.com/p/DcyZEYRGl1d/`
- `1334` : `Vestido saten We Are Velvet` -
  `https://www.instagram.com/p/DcyZHShDJnl/`
- `1312` : `Vestido corto rojo con flores` -
  `https://www.instagram.com/p/DcyZJeBD9tz/`
- `1309` : `Vestido fiesta` -
  `https://www.instagram.com/p/DcyZL2ejFL1/`
- `1308` : `Vestido fiesta` -
  `https://www.instagram.com/p/DcyZOcEAL7D/`
- `1285` : `Campera Zara Viral over size 1 solo uso` -
  `https://www.instagram.com/p/DcyZSCxD-IU/`
- `1284` : `Campera corderito` -
  `https://www.instagram.com/p/DcyZUEbGoKf/`
- `1235` : `Vestido Zara` -
  `https://www.instagram.com/p/DcyZfMbmvWZ/`
- `1227` : `Chaleco de lana` -
  `https://www.instagram.com/p/DcyZhV7my2s/`
- `1225` : `Borcegos Giorgio Benneti` -
  `https://www.instagram.com/p/DcyZjr_DgeL/`
- `1211` : `Campera` -
  `https://www.instagram.com/p/DcyZl7gGJKc/`
- `1210` : `Vestido Animal print` -
  `https://www.instagram.com/p/DcyZoF_malG/`
- `1198` : `Sobre XL` -
  `https://www.instagram.com/p/DcyplPNGoHz/`
- `1184` : `Campera vintage de cuero` -
  `https://www.instagram.com/p/Dcypo7emkg1/`
- `1170` : `Chaqueta con diseno en relieve` -
  `https://www.instagram.com/p/DcyprX6GjH_/`

Produits featured restants au 2026-09-03 :

- `1289` : image source `image/png`
- `1288` : image source `image/png`
- `1279` : image source `image/webp`
- `1209` : image source `image/png`

Ces quatre produits ne doivent pas etre republiques en `imageMode=source` :
Meta accepte uniquement les images JPEG pour ce flow. Ils pourront etre publies
apres deploiement de la route proxy JPEG `/api/instagram/product-image/[id]` ou
apres conversion/upload d'une image JPEG publique dans Supabase.

Dernier controle Meta effectue apres renouvellement du token :

```text
GET /17841430654232393/content_publishing_limit
```

Resultat :

```text
quota_usage: 17 puis 18 pendant la verification
```

## Verification locale

Commandes lancees pendant la mise en place :

```bash
npm test -- src/app/lib/instagram-products.test.mjs
```

```bash
npx eslint src/app/lib/instagram-api.ts \
  src/app/lib/instagram-product-planning.ts \
  src/app/lib/instagram-products.ts \
  src/app/lib/instagram-products.test.mjs \
  src/app/lib/instagram-bio-products.ts \
  src/app/api/cron/publish-instagram-products/route.ts \
  src/app/api/admin/instagram/publish-product/route.ts \
  'src/app/api/instagram/product-image/[id]/route.ts' \
  src/app/instagram/page.tsx \
  src/app/sitemap.ts
```

```bash
npm run build
```

Etat des verifications :

- tests unitaires : OK
- lint cible : OK
- build Next.js : OK
- route locale `/instagram` : OK
- publication reelle Instagram : OK

Notes sur les warnings connus du build :

- `baseline-browser-mapping` ancien ;
- plusieurs lockfiles detectes ;
- convention `middleware` depreciee ;
- `metadataBase` manquant.

Ces warnings existaient autour du projet et ne bloquent pas la feature.

## Limites connues

- Les liens dans une caption Instagram ne sont pas cliquables.
- L'API de publication ne doit pas etre consideree comme un editeur de captions
  deja publiees. Pour corriger une caption deja en ligne, utiliser Instagram
  directement ou supprimer/reposter.
- Les tokens Graph API Explorer expirent. Pour production, utiliser le Page
  Access Token obtenu depuis un User Access Token long-lived.
- La route proxy image `/api/instagram/product-image/[id]` doit etre deployee
  avant d'utiliser `imageMode=proxy` en production.
- Les routes internes sont protegees par `CRON_SECRET`, mais il faudra garder ce
  secret strictement prive sur Vercel.

## Prochaines etapes

- deployer la branche contenant `/api/instagram/product-image/[id]` ;
- publier les quatre featured restants avec `imageMode=proxy` ;
- ajouter le cron Vercel quotidien avec `featuredOnly=1`, `limit=1` et
  `publish=1` ;
- garder le lien bio Instagram sur `https://circular.moda/instagram` ;
- regenerer tout secret Meta ou cron expose dans un screenshot/chat.
