"use client";

// Redirect page for ChatGPT widget deeplinks.
// Opened by openExternal() in SFSafariViewController, then jumps to the custom scheme.
// Flow: https://...vercel.app/chatgpt?delivery_internal_reference=NB3R
//    → window.location.href = com.dev.shopopop://search?delivery_internal_reference=NB3R
//    → iOS opens the app

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const BUNDLE_ID = "com.dev.shopopop"; // preprod — use "com.shopopop.com" for production

export default function ChatGPTDeeplinkPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("delivery_internal_reference");

  useEffect(() => {
    const deeplink = ref
      ? `${BUNDLE_ID}://search?delivery_internal_reference=${encodeURIComponent(ref)}`
      : `${BUNDLE_ID}://search`;

    window.location.href = deeplink;
  }, [ref]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
      color: "#2F2884",
      gap: "16px",
    }}>
      <div style={{ fontSize: "32px" }}>🛍️</div>
      <p style={{ fontSize: "16px", fontWeight: 600 }}>Ouverture de Shopopop…</p>
    </div>
  );
}
