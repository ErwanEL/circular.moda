# 2026-09-03 - Automatisation WhatsApp des demandes produit

## Objectif

Automatiser le flux `Hacer una oferta al vendedor` pour reduire la mise en
relation manuelle :

- l'acheteur clique sur WhatsApp et envoie un message pre-rempli avec un code
  `INT-...` ;
- la demande est stockee dans `product_interest_requests` ;
- le webhook WhatsApp relie ensuite le message entrant a la demande grace au
  code ;
- si l'automatisation WhatsApp est activee, Circular.moda notifie la vendeuse
  via un template WhatsApp approuve ;
- si l'automatisation n'est pas activee ou echoue, le fallback manuel vers le
  WhatsApp Circular.moda reste disponible.

## Implementation actuelle

Fichiers ajoutes ou modifies :

- `src/app/ui/product-interest-button.tsx`
  - conserve le clic direct vers WhatsApp ;
  - appelle d'abord `/api/product-interest` pour creer une demande avec code ;
  - ouvre WhatsApp avec un message pre-rempli contenant le code `INT-...` ;
  - garde l'ancien fallback WhatsApp si le backend echoue.
- `src/app/api/product-interest/route.ts`
  - cree la demande d'interet avant l'ouverture WhatsApp ;
  - retrouve la vendeuse via `products.owner` puis `users.phone` ;
  - prepare le message WhatsApp entrant attendu cote Circular.moda ;
  - peut encore notifier directement la vendeuse si des infos acheteur sont
    fournies par un autre client interne ;
  - journalise l'envoi si la table de logs existe ;
  - reste compatible avec l'ancien schema en cas de migration non appliquee.
- `src/app/lib/whatsapp-api.ts`
  - client minimal WhatsApp Cloud API ;
  - envoi de template ;
  - lecture des variables d'environnement ;
  - verification token webhook et signature Meta.
- `src/app/api/webhooks/whatsapp/route.ts`
  - endpoint de verification webhook Meta ;
  - reception des messages entrants ;
  - detection du code `INT-...` dans le corps du message ;
  - recuperation du nom de profil WhatsApp et du `wa_id` de l'acheteur ;
  - mise a jour de `buyer_name`, `buyer_phone` et `buyer_consent_at` ;
  - notification automatique de la vendeuse si le flag est actif ;
  - reception des statuts de messages ;
  - mise a jour du dernier statut sur la demande.
- `docs/sql/whatsapp-product-interest-automation.sql`
  - migration idempotente pour les champs WhatsApp et les logs.

## Variables d'environnement

Variables a ajouter en production quand le setup Meta WhatsApp est pret :

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_GRAPH_API_VERSION=v26.0
WHATSAPP_PRODUCT_INTEREST_TEMPLATE=product_interest_seller
WHATSAPP_TEMPLATE_LANGUAGE=es_AR
WHATSAPP_AUTOMATION_ENABLED=false
```

Notes :

- garder `WHATSAPP_AUTOMATION_ENABLED=false` tant que le template n'est pas
  approuve et que les tests ne sont pas faits ;
- ne jamais commiter de token, app secret ou verify token ;
- `WHATSAPP_APP_SECRET` permet de verifier `x-hub-signature-256` sur le webhook.

## Migration Supabase

Executer :

```text
docs/sql/whatsapp-product-interest-automation.sql
```

La migration ajoute :

- `buyer_consent_at`
- `buyer_consent_source`
- `seller_whatsapp`
- `seller_notified_at`
- `seller_notification_message_id`
- `seller_notification_error`
- `last_whatsapp_status`
- table `whatsapp_message_logs`

RLS reste activee sans policy publique : les routes serveur utilisent la service
role key.

## Template WhatsApp MVP

Nom attendu par defaut :

```text
product_interest_seller
```

Langue par defaut :

```text
es_AR
```

Corps propose :

```text
Hola {{1}}, {{2}} esta interesada en tu prenda {{3}}.

SKU: {{4}}
Telefono de la compradora: {{5}}
Detalle: {{6}}
```

Parametres envoyes :

1. prenom vendeuse ;
2. prenom acheteur ;
3. nom produit ;
4. SKU ;
5. WhatsApp acheteur ;
6. URL produit.

## Webhook Meta

URL a configurer dans Meta :

```text
https://circular.moda/api/webhooks/whatsapp
```

Le verify token doit correspondre a `WHATSAPP_VERIFY_TOKEN`.

Le webhook stocke les statuts dans `whatsapp_message_logs` et met a jour
`last_whatsapp_status` sur la demande quand le `message_id` correspond a
`seller_notification_message_id`.

Pour les messages entrants, le webhook cherche un code de type :

```text
INT-ABC123
```

Si le code correspond a une ligne `product_interest_requests`, il recupere :

- le `wa_id` WhatsApp comme numero acheteur ;
- `contacts[].profile.name` comme nom acheteur quand disponible ;
- le corps du message comme preuve de contexte.

Le message pre-rempli contient aussi une phrase de consentement :

```text
Acepto que Circular.moda comparta mi nombre y WhatsApp con la vendedora para coordinar esta prenda.
```

## Activation progressive

1. Appliquer la migration SQL.
2. Creer/configurer WhatsApp Business Platform dans l'app Meta.
3. Creer le template `product_interest_seller`.
4. Ajouter les variables Vercel avec `WHATSAPP_AUTOMATION_ENABLED=false`.
5. Configurer et verifier le webhook Meta.
6. Tester une demande produit : clic site, envoi du message WhatsApp, reception
   webhook et enrichissement de la demande.
7. Passer `WHATSAPP_AUTOMATION_ENABLED=true`.
8. Tester avec un vendeur interne.
9. Surveiller l'admin de mise en relation et les logs Supabase.

## Option Coexistence WhatsApp Business App

Si le numero Circular.moda doit rester utilisable dans l'application mobile
WhatsApp Business tout en autorisant l'API, ne pas utiliser le flow standard
`Register your WhatsApp phone number`. Utiliser Embedded Signup avec le mode
WhatsApp Business App onboarding.

Variables temporaires a ajouter en production pour lancer le flow :

```env
META_APP_ID=
META_APP_SECRET=
META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID=
WHATSAPP_SETUP_KEY=
```

La page protegee est :

```text
https://circular.moda/admin/whatsapp-coexistence?setup_key=...
```

Elle lance le SDK Meta avec :

```text
featureType=whatsapp_business_app_onboarding
sessionInfoVersion=3
```

Le serveur echange immediatement le code Embedded Signup contre un business
token via `GET /oauth/access_token`, puis tente de souscrire l'app au WABA via
`POST /{WABA_ID}/subscribed_apps`. Il ne lance pas automatiquement
`/{PHONE_NUMBER_ID}/register`, afin d'eviter une migration Cloud API classique
non souhaitee.

## Definition of done MVP

- Une demande produit peut etre creee avant l'ouverture WhatsApp.
- Le message entrant WhatsApp avec code `INT-...` enrichit la demande avec le
  nom et le numero de l'acheteur.
- Le fallback manuel vers Circular.moda fonctionne toujours.
- La notification vendeur part uniquement avec le flag actif.
- L'ID message Meta est stocke.
- Les statuts webhook sont journalises.
- L'admin affiche l'etat de notification WhatsApp.
