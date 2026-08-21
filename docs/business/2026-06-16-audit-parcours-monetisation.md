# Audit parcours utilisateur et monetisation

Date : 2026-06-16

## Contexte

Objectif de la session : analyser le projet comme un utilisateur, parcourir les
principaux ecrans, puis identifier ce qui peut etre ameliore et quelle offre de
monetisation pourrait fonctionner.

Projet audite : circular.moda, marketplace locale de vetements de seconde main
pour Buenos Aires, avec publication vendeur, catalogue public, fiches produits,
vitrines vendeurs, newsletter et integration WhatsApp.

## Parcours testes

- Accueil public.
- Page "Como funciona".
- Catalogue produits.
- Recherche et filtres catalogue sur desktop et mobile.
- Fiche produit.
- Vitrine vendeur publique.
- Blog.
- Signup / login par magic link.
- Acces protege a la publication produit.
- Formulaire de publication vendeur, par lecture du code et verification UI.

## Diagnostic general

La proposition de valeur est claire : vendre ses vetements localement, sans
commission, avec WhatsApp comme canal naturel.

Le site donne une bonne premiere impression sur mobile : image claire, promesse
simple, bouton "Vender ya", badges "Sin comisiones" et "Solo CABA".

La tension principale vient du decalage entre la promesse et le parcours reel :
le contenu public dit "Manda tus fotos por WhatsApp" et "se publica al instante",
mais le parcours actuel passe par creation de compte, validation email, profil,
puis formulaire de publication. Cette friction est acceptable si elle est
annoncee clairement, mais elle casse la promesse "WhatsApp-first".

## Constats UX importants

### Points forts

- Le positionnement vendeur est fort et comprehensible.
- Le catalogue se charge correctement depuis Supabase.
- Les fiches produits menent bien vers un CTA WhatsApp.
- Les vitrines vendeurs existent deja et peuvent devenir un support de
  monetisation.
- Le formulaire de publication est plutot bien pense : photos en premier,
  progression visible, aide contextuelle et champs utiles.
- La newsletter catalogue est deja presente et peut servir a retenir les
  acheteurs.

### Frictions

- Le parcours vendeur promet WhatsApp mais demande un compte email avant de voir
  la publication.
- Un acces direct a `/me/product/add` redirige vers `/login` sans conserver le
  retour vers la publication.
- Le bouton WhatsApp flottant recouvre des actions importantes sur mobile,
  notamment le panneau de filtres et le CTA produit.
- Sur fiche produit, certains messages WhatsApp contiennent des valeurs faibles
  comme `talla: null` ou `color: Desconocido`.
- Le bouton "Hacer una oferta al vendedor" pointe vers le numero de la
  plateforme, ce qui peut etre confus si l'utilisateur pense contacter
  directement la vendeuse.
- Sur mobile, le catalogue montre beaucoup de recherche/filtres avant le premier
  produit ; l'effet "je chine tout de suite" pourrait etre plus direct.
- Des textes publics manquent d'accents ou de finition : "Catalogo",
  "articulos", "Marron", "bano", etc.

## Constats techniques lies a la conversion

- Les tests unitaires passent : 9 tests OK.
- Le build production passe avec acces reseau autorise.
- Le build sans reseau echoue car `next/font` doit recuperer Geist depuis Google
  Fonts.
- `npm run lint` echoue avec 35 erreurs et 26 warnings.
- Le composant de partage social genere des erreurs d'hydratation React :
  bouton imbrique dans bouton et URL de partage differente entre serveur et
  client.
- Next signale aussi des warnings de configuration : `metadataBase` absent,
  racine Turbopack inferee a cause de lockfiles multiples, convention
  `middleware` depreciee.

## Monetisation recommandee

### Offre prioritaire : Booster vendeur

Hypothese : les vendeuses ne veulent pas payer une commission, mais peuvent
payer pour vendre plus vite.

Offre possible :

- mise en avant dans le catalogue pendant 7 jours ;
- presence en page d'accueil dans "Novedades" ou section "Destacadas" ;
- badge "Destacada" sur la carte produit ;
- partage prepare pour WhatsApp / Instagram ;
- remontee dans la newsletter catalogue.

Pourquoi c'est coherent :

- ne contredit pas "sin comisiones" ;
- monetise une douleur directe : vendre plus vite ;
- s'appuie sur des surfaces deja existantes : catalogue, home, newsletter,
  vitrine vendeur.

Premier test simple :

- creer une offre unique "Destacar mi prenda 7 dias" ;
- prix faible et lisible ;
- CTA apres publication et depuis le dashboard vendeur ;
- paiement manuel au debut si besoin, avant d'integrer Stripe/Mercado Pago.

### Offre secondaire : Publication concierge par WhatsApp

Hypothese : la vraie promesse du site est "je t'envoie mes photos, tu t'occupes
du reste".

Offre possible :

- l'utilisateur envoie les photos par WhatsApp ;
- l'equipe cree le titre, description, categorie, prix conseille ;
- publication rapide dans le catalogue ;
- option premium pour traitement prioritaire.

Pourquoi c'est coherent :

- aligne parfaitement le marketing actuel ;
- reduit la friction du compte/formulaire ;
- peut etre opere manuellement au debut.

### Offre future : Vitrine premium vendeur

Hypothese : les vendeuses actives veulent un lien plus credible a partager.

Fonctionnalites possibles :

- bio courte ;
- quartier ou zone de retrait optionnelle ;
- lien personnalise ;
- badge vendeuse verifiee ;
- stats de vues/clics WhatsApp ;
- tri manuel des produits ;
- produits mis en avant dans la vitrine.

## Monetisation existante a surveiller

Des produits affilies Temu sont deja integres dans le catalogue via des cartes
"Patrocinado". C'est une piste utile, mais probablement secondaire.

Risque :

- si les cartes sponsorisees apparaissent trop tot ou trop souvent, elles
  peuvent degrader la confiance dans le catalogue communautaire.

Recommendation :

- garder l'affiliation discrete ;
- privilegier les produits utiles aux vendeuses : rangement, soin des vetements,
  anti-peluches, cintres, emballage.

## Priorites proposees

### Court terme

- Corriger les erreurs d'hydratation du partage social.
- Masquer ou deplacer le bouton WhatsApp flottant sur les ecrans avec CTA
  principal ou panneau modal.
- Nettoyer les messages WhatsApp produits pour eviter `null` et valeurs
  inconnues.
- Conserver `next` lors des redirections vers login/signup.
- Harmoniser la promesse : soit vrai WhatsApp-first, soit parcours compte
  annonce clairement.

### Moyen terme

- Ajouter une offre "Destacar mi prenda".
- Ajouter une surface dans le dashboard vendeur pour booster une publication.
- Ajouter une premiere page ou section "Planes" tres simple.
- Mesurer les clics WhatsApp, vues fiche produit, clics vitrine, clics booster.

### Plus tard

- Vitrine premium.
- Paiement automatise.
- Stats vendeur.
- Automatisation du flux WhatsApp concierge.
- Segmentation newsletter acheteurs/vendeurs.

## Questions ouvertes

- Le contact acheteur doit-il aller directement au vendeur ou passer par la
  plateforme ?
- La promesse centrale doit-elle rester "WhatsApp-first" ou devenir "publica
  rapido desde tu cuenta" ?
- Quel prix psychologique tester pour un boost de 7 jours ?
- Le modele doit-il rester sans commission pour toujours ?
- Quelle zone geographique exacte afficher : CABA seulement, CABA + GBA, ou
  Buenos Aires plus large ?

## Decision provisoire

Ne pas lancer une commission sur vente en premiere intention. Tester d'abord une
monetisation vendeur non intrusive : mise en avant payante et service de
publication concierge.
