# Documentation locale circular.moda

Cette application Nextra contient la documentation interne du projet. Elle est
gardee dans le meme depot que le code pour permettre a l'IA et aux humains de
lire le code, documenter une feature, puis commit/push dans le meme flux Git.

## Lancer en local

Depuis la racine du depot :

```bash
npm install
npm install --prefix docs-site
npm run docs:dev
```

La documentation est servie sur :

```text
http://localhost:3002
```

## Verifier avant de commit

```bash
npm run docs:build
git status
```

## Hebergement futur

Si on veut l'heberger plus tard, le plus simple sera de creer un projet Vercel
separe avec `docs-site` comme root directory. La doc contient deja une route
`robots` en noindex/noarchive, mais ce n'est pas une vraie securite. Avant tout
hebergement public, il faudra ajouter une protection d'acces.
