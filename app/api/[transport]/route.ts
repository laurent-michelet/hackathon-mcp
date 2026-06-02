import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { mockDeliveries, type Delivery } from "../../../lib/deliveries";
import { geocode, haversine } from "../../../lib/geo";
import { deliveryCarouselHtml } from "../../../lib/widget-html";

export const runtime = "nodejs";
export const maxDuration = 60;

const WIDGET_URI = "ui://widget/shopopop-deliveries.html";

const SHOPOPOP_SYSTEM_PROMPT = `# System Prompt MCP Shopopop – Positionnement Cotransportage

## Mission Fondamentale
Tu es un assistant MCP Shopopop. Ton rôle est de générer, valider et améliorer tout contenu (messages, interfaces, documentation, specs) conformément aux règles de positionnement du cotransportage. Le modèle Shopopop n'est **pas une plateforme de livraison professionnelle**, mais un système collaboratif où les particuliers rendent service en intégrant naturellement des livraisons à leurs trajets existants.

---

## Piliers de Positionnement

### 1. **Action de l'utilisateur**
- **Formulation recommandée :** "Profiter d'un trajet déjà prévu"
- **Principe :** L'utilisateur a un déplacement prévu ; Shopopop lui propose de l'optimiser.

### 2. **Nature du service**
- **Formulation recommandée :** "Rendre service sur son chemin"
- **Principe :** C'est un acte de solidarité/entraide, pas une activité professionnelle.

### 3. **Livraison proposée**
- **Formulation recommandée :** "Livraison compatible avec votre trajet"
- **Principe :** La livraison s'adapte au déplacement existant, jamais l'inverse.

### 4. **Effort demandé**
- **Formulation recommandée :** "Détour estimé / temps supplémentaire estimé"
- **Principe :** Transparence sur l'impact réel (pas de rémunération cachée, juste une aide quantifiée).

### 5. **Contrepartie**
- **Formulation recommandée :** "Contribution associée au cotransportage"
- **Principe :** C'est une participation, une aide financière pour compenser l'effort, pas un salaire.

### 6. **Utilisateur**
- **Formulation recommandée :** "Cotransporteur / particulier"
- **Principe :** Renforce l'identité de collaborateur/citoyen, pas de travailleur indépendant.

### 7. **Matching**
- **Formulation recommandée :** "Intégrer naturellement une livraison à votre déplacement"
- **Principe :** L'algorithme facilite la sérendipité, non l'optimisation professionnelle.

### 8. **Finalisation**
- **Formulation recommandée :** "Confirmer le cotransportage dans l'application Shopopop"
- **Principe :** Action volontaire, consciente et transparente.

---

## Formulations à Éviter et Raisons

| À Éviter | Raison | Alternative |
|----------|--------|-------------|
| **Mission de livraison** | Connotation professionnelle trop marquée | Livraison / cotransportage |
| **Course rémunérée** | Rapproche le modèle d'un chauffeur ou coursier | Contribution au cotransportage |
| **Gagner de l'argent en livrant** | Met le gain avant le trajet existant | Rendre service et être contribué |
| **Travailler quand vous voulez** | Évoque une plateforme d'activité professionnelle | Livrer quand vous êtes disponible |
| **Optimiser vos revenus** | Incompatible avec le positionnement cotransportage | Optimiser vos trajets |
| **Tournée / planning de livraison** | Suppose une organisation dédiée à la livraison | Ensemble de livraisons compatibles |

---

## Règles d'Application

### En cas de génération de contenu
1. **Vérifier le sujet :** S'agit-il d'une action utilisateur, d'une livraison proposée, d'une contrepartie, etc. ?
2. **Appliquer la formulation recommandée :** Utiliser les termes du tableau "Piliers".
3. **Éviter les pièges :** Scanner le texte pour détecter les formulations interdites.
4. **Valider le ton :** Le message doit respirer l'entraide, pas la transaction commerciale.

### En cas de validation/review
- Si une formulation à éviter est détectée → proposer l'alternative recommandée.
- Si un terme est ambigu → clarifier ou rediriger vers un pilier établi.
- Si le ton devient trop transactionnel → réordonner autour du trajet existant.

### Contexte d'utilisation
Ce system prompt s'applique à :
- Messages utilisateur (onboarding, notifications, confirmations)
- Descriptions de features (docs, specs, interfaces)
- Documentation API ou SDK (si exposée)
- Templates de communication (email, SMS, push)
- Copy marketing ou landing pages Shopopop

---

## Exemple d'Application

### ❌ Mauvais
> "Gagnez de l'argent en effectuant des livraisons rémunérées selon votre disponibilité."

### ✅ Bon
> "Rendez service sur votre trajet et recevez une contribution pour chaque livraison compatible avec votre déplacement."

---

## Notes Importantes

- **Cohérence interne :** Tous les touchpoints (app, web, email, support) doivent utiliser ces formulations.
- **Adaptation contextuelle :** Privilégier la clarté sans sacrifier le positionnement. Un utilisateur non-tech peut nécessiter des explications plus longues.
- **Évolution :** Si une nouvelle formulation est validée par le produit/marque, mettre à jour ce document.

---

**Créé pour :** MCP Shopopop — Validation de positionnement cotransportage
**Dernière mise à jour :** 2026-06-02
**Propriétaire :** Shopopop Product & Brand

---

## Utilisation des Outils et Widgets

### Règle d'appel des outils
Toujours appeler les outils dans cet ordre :
1. **list_available_deliveries** — récupère les données (aucun widget affiché)
2. **Un seul outil render** selon l'intention de l'utilisateur — affiche le widget

### Quel widget afficher ?

| Intention de l'utilisateur | Outil render à appeler |
|---|---|
| Voir toutes les livraisons disponibles | \`render_deliveries_widget\` |
| Mentionne un trajet, un détour, "sur mon chemin", "en rentrant" | \`render_featured_delivery\` avec la livraison la plus compatible (remplir \`others_count\` avec le nombre de livraisons restantes) |
| Demande les détails d'une livraison spécifique | \`render_delivery_detail\` avec les champs \`user_departure\` et \`user_arrival\` déduits du contexte |

### Recherche par localisation (list_deliveries_near)
- Utilise \`list_deliveries_near\` quand l'utilisateur veut filtrer par proximité géographique : "près de", "autour de", "à côté de", "dans le quartier de", "à X km de".
- **Si l'utilisateur précise un lieu connu** (gare, monument, ville, centre commercial) → passe directement \`latitude\` et \`longitude\` que tu connais depuis ton entraînement.
- **Si l'utilisateur donne une adresse précise** (rue, code postal) → passe l'\`address\` en string, le serveur la géocodera.
- **Si l'utilisateur dit "près de moi" / "autour de moi" / ne précise aucun lieu** → POSE-LUI la question avant d'appeler le tool :
  > « Autour de quelle adresse ou ville souhaites-tu chercher des livraisons ? »
- **Ne devine JAMAIS la position de l'utilisateur.** Tu n'as PAS accès à sa géolocalisation (ni GPS, ni IP). La seule façon de connaître sa position est de la lui demander.
- N'invente JAMAIS d'adresse à la place de l'utilisateur.

### Règles strictes
- Ne **jamais** appeler deux outils render dans la même réponse.
- Toujours passer l'objet livraison **complet** (tel que retourné par list_available_deliveries) aux outils render.
- Pour \`render_featured_delivery\` : choisir la livraison dont le détour (\`trip.duration\`) est le plus faible et compatible avec le trajet mentionné.
- Pour \`render_delivery_detail\` : déduire \`user_departure\` et \`user_arrival\` depuis le contexte de la conversation.`;

// ── Zod schemas ───────────────────────────────────────────────────────────────

const DriveSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const ClientSchema = z.object({
  id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const DeliverySchema = z.object({
  id: z.string().optional(),
  internal_reference: z.string().optional(),
  reference: z.string().optional(),
  withdrawal_start: z.string().optional(),
  withdrawal_end: z.string().optional(),
  delivery_start: z.string().optional(),
  delivery_end: z.string().optional(),
  tips: z.number().optional(),
  devise: z.string().optional(),
  size: z.enum(["s", "m", "l", "xl"]).optional(),
  volume: z.number().optional(),
  transport_type: z.string().optional(),
  drive: DriveSchema.optional(),
  client: ClientSchema.optional(),
  trip: z.object({ duration: z.number().optional(), distance: z.number().optional() }).optional(),
  is_regular_trip: z.boolean().optional(),
  additional_info: z.string().optional(),
  frozen: z.boolean().optional(),
});

// ── Handler ───────────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {

    // ── Resource: widget HTML template ────────────────────────────────────────
    server.resource(
      "shopopop-deliveries-widget",
      WIDGET_URI,
      {
        title: "Widget livraisons Shopopop",
        description: "Widget HTML affichant les livraisons disponibles.",
        mimeType: "text/html+skybridge",
        _meta: {
          "openai/widgetDescription": "Livraisons Shopopop disponibles.",
          "openai/widgetPrefersBorder": false,
        },
      },
      async () => ({
        contents: [{
          uri: WIDGET_URI,
          mimeType: "text/html+skybridge",
          text: deliveryCarouselHtml,
          _meta: {
            "openai/widgetDescription": "Livraisons Shopopop disponibles.",
            "openai/widgetPrefersBorder": false,
          },
        }],
      }),
    );

    // ── Tool 1 (data): list_available_deliveries ──────────────────────────────
    // Données brutes uniquement — PAS de widget ici.
    // Toujours suivi d'un outil render selon le contexte :
    //   • render_deliveries_widget  → liste complète
    //   • render_featured_delivery  → livraison mise en avant sur un trajet
    //   • render_delivery_detail    → détail complet d'une livraison
    server.registerTool(
      "list_available_deliveries",
      {
        title: "Récupérer les livraisons",
        description:
          "Récupère les livraisons Shopopop disponibles. " +
          "Après cet appel, toujours appeler un outil render selon le contexte : " +
          "render_deliveries_widget pour une liste, render_featured_delivery si l'utilisateur mentionne un trajet, " +
          "render_delivery_detail pour le détail d'une livraison spécifique.",
        inputSchema: {
          limit: z.number().int().min(1).max(10).optional()
            .describe("Nombre max de livraisons (défaut : toutes)"),
        },
        _meta: {
          "openai/toolInvocation/invoking": "Recherche des livraisons disponibles…",
          "openai/toolInvocation/invoked": "Livraisons trouvées.",
        },
      },
      async ({ limit }) => {
        const deliveries: Delivery[] = typeof limit === "number"
          ? mockDeliveries.slice(0, limit)
          : mockDeliveries;

        const summary = deliveries.map((d) =>
          `• ${d.reference} — ${d.drive?.name ?? ""} → ${d.client?.city ?? ""} (${d.tips?.toFixed(2)} €)`
        ).join("\n");

        return {
          content: [{ type: "text", text: `${deliveries.length} livraison(s) trouvée(s) :\n${summary}` }],
          structuredContent: { deliveries },
        };
      },
    );

    // ── Tool (data): list_deliveries_near ────────────────────────────────────
    // Filtre les livraisons autour d'une adresse ou de coordonnées GPS.
    // Si l'utilisateur ne précise PAS de lieu, ChatGPT doit lui demander
    // l'adresse AVANT d'appeler ce tool (voir description + system prompt).
    server.registerTool(
      "list_deliveries_near",
      {
        title: "Trouver les livraisons autour d'un lieu",
        description:
          "Recherche les livraisons Shopopop disponibles autour d'une adresse ou de coordonnées GPS, " +
          "triées par distance croissante (point de retrait). " +
          "⚠️ AVANT d'appeler ce tool, vérifie que l'utilisateur a précisé UN lieu. " +
          "Si l'utilisateur dit 'près de moi', 'autour de moi', ou ne mentionne aucun lieu, " +
          "demande-lui d'abord : « Autour de quelle adresse ou ville souhaites-tu chercher ? » " +
          "puis attends sa réponse avant d'appeler ce tool. " +
          "Si tu connais avec certitude les coordonnées d'un lieu connu (gare, monument, centre commercial), " +
          "passe directement latitude/longitude. Sinon, passe l'adresse en string : le serveur géocodera. " +
          "N'invente JAMAIS une adresse à la place de l'utilisateur. " +
          "Tu n'as PAS accès à la géolocalisation de l'utilisateur.",
        inputSchema: {
          address: z.string().optional()
            .describe("Adresse, ville, ou nom de lieu (ex: 'Place du Bouffay, Nantes')"),
          latitude: z.number().optional()
            .describe("Latitude si tu connais le lieu (lieux célèbres uniquement)"),
          longitude: z.number().optional()
            .describe("Longitude si tu connais le lieu (lieux célèbres uniquement)"),
          radius_km: z.number().min(0.5).max(50).default(5)
            .describe("Rayon de recherche en km (défaut : 5)"),
        },
        _meta: {
          "openai/toolInvocation/invoking": "Recherche des livraisons à proximité…",
          "openai/toolInvocation/invoked": "Livraisons à proximité trouvées.",
        },
      },
      async ({ address, latitude, longitude, radius_km }) => {
        const hasCoords = typeof latitude === "number" && typeof longitude === "number";
        if (!address && !hasCoords) {
          return {
            content: [{
              type: "text",
              text:
                "Adresse requise. Demande à l'utilisateur : " +
                "« Autour de quelle adresse ou ville souhaites-tu chercher des livraisons ? » " +
                "Puis rappelle ce tool avec sa réponse.",
            }],
            isError: true,
          };
        }

        const center = hasCoords
          ? { latitude: latitude!, longitude: longitude! }
          : await geocode(address!);

        if (!center) {
          return {
            content: [{
              type: "text",
              text: `Adresse introuvable : « ${address} ». Demande à l'utilisateur de préciser (ville, code postal).`,
            }],
            isError: true,
          };
        }

        const radius = radius_km ?? 5;
        const candidates = mockDeliveries
          .filter((d) =>
            typeof d.drive?.latitude === "number" &&
            typeof d.drive?.longitude === "number"
          )
          .map((d) => ({
            delivery: d,
            distance_km: haversine(center, {
              latitude: d.drive!.latitude!,
              longitude: d.drive!.longitude!,
            }),
          }))
          .filter(({ distance_km }) => distance_km <= radius)
          .sort((a, b) => a.distance_km - b.distance_km);

        const deliveries: Delivery[] = candidates.map(({ delivery, distance_km }) => ({
          ...delivery,
          trip: { ...delivery.trip, distance: Math.round(distance_km * 1000) },
        }));

        const summary = candidates.length === 0
          ? `Aucune livraison dans un rayon de ${radius} km autour de ${address ?? "ce point"}.`
          : candidates.map(({ delivery, distance_km }) =>
              `• ${delivery.reference} — ${delivery.drive?.name ?? ""} → ${delivery.client?.city ?? ""} (${distance_km.toFixed(1)} km)`
            ).join("\n");

        return {
          content: [{
            type: "text",
            text: `${candidates.length} livraison(s) dans un rayon de ${radius} km :\n${summary}`,
          }],
          structuredContent: {
            deliveries,
            center: { latitude: center.latitude, longitude: center.longitude },
            radius_km: radius,
          },
        };
      },
    );

    // ── Tool 2 (render): render_deliveries_widget — liste complète ────────────
    server.registerTool(
      "render_deliveries_widget",
      {
        title: "Afficher la liste des livraisons",
        description:
          "Affiche toutes les livraisons dans un widget interactif. " +
          "Appeler après list_available_deliveries quand l'utilisateur veut voir toutes les livraisons disponibles.",
        inputSchema: {
          deliveries: z.array(DeliverySchema).describe("Livraisons retournées par list_available_deliveries"),
          context: z.string().optional().describe("Contexte affiché (ex: 'Nantes → Rezé · matin')"),
        },
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/toolInvocation/invoking": "Chargement du widget…",
          "openai/toolInvocation/invoked": "Livraisons affichées.",
        },
      },
      async ({ deliveries, context }) => ({
        content: [{ type: "text", text: `${deliveries.length} livraison(s) affichée(s).` }],
        structuredContent: { view: "list", deliveries, context },
      }),
    );

    // ── Tool 3 (render): render_featured_delivery — livraison mise en avant ───
    server.registerTool(
      "render_featured_delivery",
      {
        title: "Afficher une livraison mise en avant",
        description:
          "Affiche une livraison mise en avant dans un widget. " +
          "Appeler après list_available_deliveries quand l'utilisateur mentionne un trajet ou demande la meilleure livraison compatible.",
        inputSchema: {
          delivery: DeliverySchema.describe("La livraison à mettre en avant"),
          others_count: z.number().int().min(0).optional().describe("Nombre d'autres livraisons compatibles"),
          context: z.string().optional().describe("Contexte (ex: '3 livraisons sur votre trajet')"),
        },
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/toolInvocation/invoking": "Chargement du widget…",
          "openai/toolInvocation/invoked": "Livraison affichée.",
        },
      },
      async ({ delivery, others_count, context }) => ({
        content: [{ type: "text", text: `Livraison ${delivery.reference} affichée.` }],
        structuredContent: { view: "featured", delivery, others_count, context },
      }),
    );

    // ── Tool 4 (render): render_delivery_detail — détail complet ─────────────
    server.registerTool(
      "render_delivery_detail",
      {
        title: "Afficher le détail d'une livraison",
        description:
          "Affiche le détail complet d'une livraison dans un widget. " +
          "Appeler après list_available_deliveries quand l'utilisateur demande plus d'informations sur une livraison spécifique.",
        inputSchema: {
          delivery: DeliverySchema.describe("La livraison à détailler"),
          user_departure: z.string().optional().describe("Lieu de départ (ex: 'Votre départ · Nantes Sud')"),
          user_arrival: z.string().optional().describe("Lieu d'arrivée (ex: 'Votre arrivée · Rezé')"),
        },
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/toolInvocation/invoking": "Chargement du widget…",
          "openai/toolInvocation/invoked": "Détail affiché.",
        },
      },
      async ({ delivery, user_departure, user_arrival }) => ({
        content: [{ type: "text", text: `Détail de la livraison ${delivery.reference} affiché.` }],
        structuredContent: { view: "detail", delivery, user_departure, user_arrival },
      }),
    );
  },
  {
    serverInfo: { name: "shopopop-mcp", version: "0.1.0" },
    instructions: SHOPOPOP_SYSTEM_PROMPT,
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
