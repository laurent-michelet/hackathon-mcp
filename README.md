# hackathon-mcp

Serveur **MCP** minimaliste pour démontrer l'intégration **ChatGPT Apps** —
expose un tool qui retourne 3 livraisons Shopopop mockées, affichées sous forme
de **carrousel** via le widget Apps SDK.

- **Stack** : Next.js 15 (App Router, TypeScript) + `@vercel/mcp-adapter`
- **Endpoint MCP** : `POST /api/mcp` (et `GET` / `DELETE` pour le transport)
- **Pas d'auth** — usage démo uniquement

## Développement local

```bash
npm install
npm run dev
```

Le serveur tourne sur `http://localhost:3000`. L'endpoint MCP est `http://localhost:3000/api/mcp`.

### Tester avec l'inspector MCP

Dans un second terminal :

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/api/mcp
```

Tu dois voir :
- Le tool `list_available_deliveries`
- La ressource `ui://widget/delivery-carousel.html`

Appelle le tool : la réponse contient `structuredContent.deliveries` (3 entrées) et
`_meta["openai/outputTemplate"]` pointant vers le widget.

## Déploiement Vercel

```bash
npx vercel
```

Puis prod :

```bash
npx vercel --prod
```

Récupère l'URL et teste-la avec l'inspector :

```bash
npx @modelcontextprotocol/inspector https://<ton-projet>.vercel.app/api/mcp
```

## Connexion à ChatGPT

1. ChatGPT → **Settings** → **Connectors** → **Add MCP server**.
2. Colle l'URL `https://<ton-projet>.vercel.app/api/mcp`.
3. Pas d'authentification à configurer.
4. Démarre une conversation et demande : *« montre-moi les livraisons disponibles »*.
5. ChatGPT appelle le tool et rend le carrousel.

## Structure

```
app/api/[transport]/route.ts   → handler MCP (tool + ressource widget)
lib/deliveries.ts              → 3 livraisons mockées
lib/widget-html.ts             → HTML du carrousel (auto-contenu)
app/page.tsx                   → landing minimale
```

> `@modelcontextprotocol/sdk` est **épinglé en 1.18.0** : les versions ≥ 1.20 utilisent un transport
> qui n'est pas compatible avec `@vercel/mcp-adapter@0.11.x` (le corps de réponse sort encodé en
> tableau d'octets). À retirer dès que l'adapter publie un fix.
