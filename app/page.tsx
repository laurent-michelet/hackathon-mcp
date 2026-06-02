export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "60px auto", padding: "0 20px", lineHeight: 1.5 }}>
      <h1 style={{ color: "#00C389", margin: 0 }}>Shopopop MCP demo</h1>
      <p>Serveur MCP de démonstration pour ChatGPT.</p>
      <p>
        Endpoint MCP :{" "}
        <code style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4 }}>
          /api/mcp
        </code>
      </p>
      <p style={{ color: "#64748B", fontSize: 14 }}>
        Connecte cette URL comme connecteur MCP dans ChatGPT (Settings → Connectors).
      </p>
    </main>
  );
}
