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
  {},
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
