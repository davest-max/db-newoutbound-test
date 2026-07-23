# db-newoutbound-test

Monorepo for user testing, containing two projects side by side:

- `lyra-ui/` — the `@nicecxone/lyra-ui` design system (components, tokens, Storybook).
- `agent-next-gen-v1/` — the demo app (Outbound/Agent Next-Gen prototype). Built with Vite + React + TypeScript + Tailwind. Imports lyra-ui via relative paths (`../lyra-ui/src/...`), so both folders must stay together.

## Local development

```bash
cd agent-next-gen-v1
npm install
npm run dev
```

## Build for production

```bash
cd agent-next-gen-v1
npm install
npm run build
```

## Deploy to GitHub Pages

The app already has a `deploy` script using `gh-pages`:

```bash
cd agent-next-gen-v1
npm install
npm run deploy
```

This builds the app and pushes `dist/` to a `gh-pages` branch. In the GitHub repo settings, set Pages source to the `gh-pages` branch (root). The site will be served at:

```
https://<your-github-username>.github.io/db-newoutbound-test/
```

`vite.config.ts`'s `base` is already set to `/db-newoutbound-test/` to match.
