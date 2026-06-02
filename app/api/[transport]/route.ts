import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { mockDeliveries } from "../../../lib/deliveries";
import { deliveryCarouselHtml } from "../../../lib/widget-html";

export const runtime = "nodejs";
export const maxDuration = 60;

const WIDGET_URI = "ui://widget/delivery-carousel.html";

const deliverySchema = z.object({
  id: z.string(),
  pickup_address: z.string(),
  dropoff_address: z.string(),
  customer_name: z.string(),
  distance_km: z.number(),
  price_eur: z.number(),
  slot: z.string(),
  items_count: z.number().int(),
});

const handler = createMcpHandler(
  (server) => {
    server.registerResource(
      "delivery-carousel-widget",
      WIDGET_URI,
      {
        title: "Carrousel des livraisons",
        description: "Widget HTML affichant les livraisons disponibles sous forme de carrousel.",
        mimeType: "text/html+skybridge",
        _meta: {
          "openai/widgetDescription": "Carrousel des livraisons Shopopop disponibles.",
          "openai/widgetPrefersBorder": false,
        },
      },
      async () => ({
        contents: [
          {
            uri: WIDGET_URI,
            mimeType: "text/html+skybridge",
            text: deliveryCarouselHtml,
            _meta: {
              "openai/widgetDescription": "Carrousel des livraisons Shopopop disponibles.",
              "openai/widgetPrefersBorder": false,
            },
          },
        ],
      }),
    );

    server.registerTool(
      "list_available_deliveries",
      {
        title: "Liste des livraisons disponibles",
        description:
          "Liste les livraisons Shopopop ouvertes à proximité. Renvoie un carrousel des courses disponibles avec adresse de retrait, adresse de livraison, distance, prix, créneau horaire et client.",
        inputSchema: {
          limit: z
            .number()
            .int()
            .min(1)
            .max(10)
            .optional()
            .describe("Nombre max de livraisons à renvoyer (par défaut : toutes)."),
        },
        outputSchema: {
          deliveries: z.array(deliverySchema).describe("Liste des livraisons disponibles."),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/widgetAccessible": false,
          "openai/toolInvocation/invoking": "Recherche des livraisons disponibles…",
          "openai/toolInvocation/invoked": "Livraisons trouvées.",
        },
      },
      async ({ limit }) => {
        const deliveries =
          typeof limit === "number" ? mockDeliveries.slice(0, limit) : mockDeliveries;

        const summary = deliveries
          .map(
            (d) =>
              `• ${d.id} — ${d.pickup_address} → ${d.dropoff_address} (${d.distance_km} km, ${d.price_eur.toFixed(2)} €, ${d.slot})`,
          )
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `${deliveries.length} livraison(s) disponible(s) :\n${summary}`,
            },
          ],
          structuredContent: { deliveries },
        };
      },
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
