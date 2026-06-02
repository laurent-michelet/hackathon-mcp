export const metadata = {
  title: "Shopopop MCP demo",
  description: "Serveur MCP de démonstration pour ChatGPT — livraisons Shopopop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
