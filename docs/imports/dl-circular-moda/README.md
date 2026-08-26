# Import DL Circular Moda

Ce dossier contient les fichiers bruts importes depuis une machine developpeur.

Source utilisee pour cet import :

```text
/Users/erwan/Downloads/DL_CIRCULAR_MODA/
```

Destination canonique dans le projet :

```text
docs/imports/dl-circular-moda/
```

## Contenu importe

- images PNG/WebP/GIF liees a circular.moda ;
- PDFs de validation marche et rapports marketing ;
- CSVs d'exports ou campagnes ;
- assets historiques deja presents ou proches de certains assets `public/`.

## Regles

- Garder ce dossier comme inbox versionnable pour les sources brutes.
- Ne pas exposer automatiquement ces fichiers dans `public/`.
- Copier vers `public/` seulement quand un asset doit etre servi par le site.
- Ne jamais supprimer les fichiers source dans `Downloads`.
- Ne pas utiliser `rsync --delete` sans demande explicite.

Commande d'import utilisee :

```bash
rsync -av '/Users/erwan/Downloads/DL_CIRCULAR_MODA/' 'docs/imports/dl-circular-moda/'
```
