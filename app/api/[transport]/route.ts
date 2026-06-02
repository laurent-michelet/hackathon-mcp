import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { mockDeliveries, type Delivery } from "../../../lib/deliveries";
import { deliveryCarouselHtml } from "../../../lib/widget-html";

export const runtime = "nodejs";
export const maxDuration = 60;

const WIDGET_URI = "ui://widget/shopopop-deliveries.html";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const DriveSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

const ClientSchema = z.object({
  id: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
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
    // Returns raw deliveries — no widget template attached.
    // The model reads this data before deciding which render tool to call.
    server.tool(
      "list_available_deliveries",
      "Récupère les livraisons Shopopop disponibles. Appelle ensuite render_deliveries_widget pour afficher le résultat.",
      {
        limit: z.number().int().min(1).max(10).optional()
          .describe("Nombre max de livraisons (défaut : toutes)"),
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
          _meta: {
            "openai/widgetAccessible": false,
            "openai/toolInvocation/invoking": "Recherche des livraisons disponibles…",
            "openai/toolInvocation/invoked": "Livraisons trouvées.",
          },
        };
      },
    );

    // ── Tool 2 (render): render_deliveries_widget — list view ─────────────────
    server.tool(
      "render_deliveries_widget",
      "Affiche la liste des livraisons dans un widget interactif. Appelle d'abord list_available_deliveries.",
      {
        deliveries: z.array(DeliverySchema).describe("Livraisons retournées par list_available_deliveries"),
        context: z.string().optional().describe("Contexte affiché en haut de la carte (ex: 'Nantes → Rezé · matin')"),
      },
      async ({ deliveries, context }) => ({
        content: [{ type: "text", text: `${deliveries.length} livraison(s) affichée(s).` }],
        structuredContent: { view: "list", deliveries, context },
        _meta: {
          ui: { resourceUri: WIDGET_URI },
          "openai/outputTemplate": WIDGET_URI,
          "openai/toolInvocation/invoking": "Chargement du widget…",
          "openai/toolInvocation/invoked": "Livraisons affichées.",
        },
      }),
    );

    // ── Tool 3 (render): render_featured_delivery — vue mise en avant ─────────
    server.tool(
      "render_featured_delivery",
      "Affiche une livraison mise en avant (résultat principal + nombre d'autres disponibles). Appelle d'abord list_available_deliveries.",
      {
        delivery: DeliverySchema.describe("La livraison à mettre en avant"),
        others_count: z.number().int().min(0).optional().describe("Nombre d'autres livraisons compatibles"),
        context: z.string().optional().describe("Contexte affiché (ex: '3 livraisons sur votre trajet')"),
      },
      async ({ delivery, others_count, context }) => ({
        content: [{ type: "text", text: `Livraison ${delivery.reference} affichée en mise en avant.` }],
        structuredContent: { view: "featured", delivery, others_count, context },
        _meta: {
          ui: { resourceUri: WIDGET_URI },
          "openai/outputTemplate": WIDGET_URI,
          "openai/toolInvocation/invoking": "Chargement du widget…",
          "openai/toolInvocation/invoked": "Livraison affichée.",
        },
      }),
    );

    // ── Tool 4 (render): render_delivery_detail — vue détail ─────────────────
    server.tool(
      "render_delivery_detail",
      "Affiche le détail complet d'une livraison (route, horaires, contribution). Appelle d'abord list_available_deliveries.",
      {
        delivery: DeliverySchema.describe("La livraison à détailler"),
        user_departure: z.string().optional().describe("Lieu de départ de l'utilisateur (ex: 'Votre départ · Nantes Sud')"),
        user_arrival: z.string().optional().describe("Lieu d'arrivée de l'utilisateur (ex: 'Votre arrivée · Rezé')"),
      },
      async ({ delivery, user_departure, user_arrival }) => ({
        content: [{ type: "text", text: `Détail de la livraison ${delivery.reference} affiché.` }],
        structuredContent: { view: "detail", delivery, user_departure, user_arrival },
        _meta: {
          ui: { resourceUri: WIDGET_URI },
          "openai/outputTemplate": WIDGET_URI,
          "openai/toolInvocation/invoking": "Chargement du widget…",
          "openai/toolInvocation/invoked": "Détail affiché.",
        },
      }),
    );
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
