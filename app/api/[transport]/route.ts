import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { mockDeliveries } from "../../../lib/deliveries";
import { deliveryCarouselHtml } from "../../../lib/widget-html";

export const runtime = "nodejs";
export const maxDuration = 60;

const WIDGET_URI = "ui://widget/delivery-carousel.html";

const handler = createMcpHandler(
  (server) => {
    // Widget resource (ChatGPT Apps SDK convention: text/html+skybridge)
    server.resource(
      "delivery-carousel-widget",
      WIDGET_URI,
      { mimeType: "text/html+skybridge" },
      async () => ({
        contents: [
          {
            uri: WIDGET_URI,
            mimeType: "text/html+skybridge",
            text: deliveryCarouselHtml,
          },
        ],
      }),
    );

    // Tool that returns the deliveries + points at the widget
    server.tool(
      "list_available_deliveries",
      "Liste les livraisons disponibles à proximité. Renvoie un carrousel des courses Shopopop ouvertes.",
      {
        limit: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Nombre max de livraisons (default: toutes)"),
      },
      async ({ limit }) => {
        const deliveries = typeof limit === "number"
          ? mockDeliveries.slice(0, limit)
          : mockDeliveries;

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
          _meta: {
            "openai/outputTemplate": WIDGET_URI,
            "openai/toolInvocation/invoking": "Recherche des livraisons disponibles…",
            "openai/toolInvocation/invoked": "Livraisons trouvées.",
          },
        };
      },
    );
  },
  {
    // The adapter derives capabilities from registered tools/resources automatically.
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
