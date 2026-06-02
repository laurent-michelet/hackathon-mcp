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

    // ── Tool 1: list_available_deliveries ─────────────────────────────────────
    // "openai/outputTemplate" est dans la définition → ChatGPT affiche le widget
    server.registerTool(
      "list_available_deliveries",
      {
        title: "Livraisons disponibles",
        description: "Liste les livraisons Shopopop disponibles et les affiche dans un widget interactif.",
        inputSchema: {
          limit: z.number().int().min(1).max(10).optional()
            .describe("Nombre max de livraisons (défaut : toutes)"),
        },
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/widgetAccessible": false,
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
          structuredContent: { view: "list", deliveries },
        };
      },
    );

    // ── Tool 2: render_featured_delivery ──────────────────────────────────────
    server.registerTool(
      "render_featured_delivery",
      {
        title: "Livraison mise en avant",
        description: "Affiche une livraison mise en avant avec les autres disponibles. Appelle d'abord list_available_deliveries.",
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

    // ── Tool 3: render_delivery_detail ────────────────────────────────────────
    server.registerTool(
      "render_delivery_detail",
      {
        title: "Détail d'une livraison",
        description: "Affiche le détail complet d'une livraison. Appelle d'abord list_available_deliveries.",
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
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
