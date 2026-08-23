This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Documentation locale

La documentation interne vit dans `docs-site/` sous forme d'app Nextra separee.
Elle reste locale pour l'instant et sert de reference commune pour les humains
et les agents IA qui travaillent sur le projet.

Installer les dependances :

```bash
npm install
npm install --prefix docs-site
```

Ouvrir la documentation locale :

```bash
npm run docs:dev
```

Ouvrir ensuite [http://localhost:3002](http://localhost:3002).

Verifier que la documentation compile sans lancer de serveur :

```bash
npm run docs:build
```

Avant un refactoring ou une modification de feature importante, lire les pages
correspondantes dans `docs-site/content/`, notamment `features.mdx`. Chaque
feature doit expliquer le comportement simplement, puis detailler les services,
tables, routes, fichiers de code, variables d'environnement et tests utiles.
Cette structure doit permettre a un developpeur humain ou a un agent IA de
retrouver rapidement le contexte et de modifier le code sans repartir de zero.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
