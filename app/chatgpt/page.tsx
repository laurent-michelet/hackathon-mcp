"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const BUNDLE_ID = "com.dev.shopopop";

function DeeplinkRedirect() {
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

export default function ChatGPTDeeplinkPage() {
  return (
    <Suspense>
      <DeeplinkRedirect />
    </Suspense>
  );
}
