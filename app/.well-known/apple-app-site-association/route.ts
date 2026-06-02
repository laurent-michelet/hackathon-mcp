export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    applinks: {
      apps: [],
      details: [
        { appID: "V2L2U3K53Z.com.dev.shopopop", paths: ["/*"] },
      ],
    },
  });
}
