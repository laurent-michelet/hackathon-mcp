export const deliveryCarouselHtml = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root {
    --shopopop-green: #00C389;
    --shopopop-dark: #0F172A;
    --shopopop-muted: #64748B;
    --shopopop-bg: #F8FAFC;
    --shopopop-border: #E2E8F0;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: transparent; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--shopopop-dark); }
  .wrap { padding: 12px 4px 16px; }
  .header { display: flex; align-items: baseline; justify-content: space-between; padding: 0 12px 10px; }
  .header h2 { margin: 0; font-size: 16px; font-weight: 600; }
  .header .count { font-size: 13px; color: var(--shopopop-muted); }
  .carousel {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 4px 12px 12px;
    -webkit-overflow-scrolling: touch;
  }
  .carousel::-webkit-scrollbar { height: 6px; }
  .carousel::-webkit-scrollbar-thumb { background: var(--shopopop-border); border-radius: 3px; }
  .card {
    flex: 0 0 280px;
    scroll-snap-align: start;
    background: #fff;
    border: 1px solid var(--shopopop-border);
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
    display: flex; flex-direction: column; gap: 10px;
  }
  .top { display: flex; align-items: center; justify-content: space-between; }
  .id { font-size: 11px; color: var(--shopopop-muted); letter-spacing: 0.04em; }
  .price { font-size: 18px; font-weight: 700; color: var(--shopopop-green); }
  .route { display: flex; flex-direction: column; gap: 6px; }
  .point { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; line-height: 1.35; }
  .dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex: 0 0 8px; }
  .dot.pickup { background: var(--shopopop-green); }
  .dot.dropoff { background: var(--shopopop-dark); }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    font-size: 11px;
    padding: 3px 8px;
    background: var(--shopopop-bg);
    border: 1px solid var(--shopopop-border);
    border-radius: 999px;
    color: var(--shopopop-dark);
  }
  .footer { font-size: 12px; color: var(--shopopop-muted); }
  .empty { padding: 24px; text-align: center; color: var(--shopopop-muted); }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h2>Livraisons disponibles</h2>
    <span class="count" id="count"></span>
  </div>
  <div class="carousel" id="carousel"></div>
</div>
<script>
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtPrice(n) {
    try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n); }
    catch (_) { return n + " €"; }
  }
  function render(deliveries) {
    var root = document.getElementById("carousel");
    var count = document.getElementById("count");
    if (!deliveries || !deliveries.length) {
      root.innerHTML = '<div class="empty">Aucune livraison disponible.</div>';
      count.textContent = "";
      return;
    }
    count.textContent = deliveries.length + " disponible" + (deliveries.length > 1 ? "s" : "");
    root.innerHTML = deliveries.map(function (d) {
      return '<article class="card">' +
        '<div class="top">' +
          '<span class="id">' + escapeHtml(d.id) + '</span>' +
          '<span class="price">' + escapeHtml(fmtPrice(d.price_eur)) + '</span>' +
        '</div>' +
        '<div class="route">' +
          '<div class="point"><span class="dot pickup"></span><span>' + escapeHtml(d.pickup_address) + '</span></div>' +
          '<div class="point"><span class="dot dropoff"></span><span>' + escapeHtml(d.dropoff_address) + '</span></div>' +
        '</div>' +
        '<div class="meta">' +
          '<span class="chip">' + escapeHtml(d.distance_km + " km") + '</span>' +
          '<span class="chip">' + escapeHtml(d.items_count + " articles") + '</span>' +
          '<span class="chip">' + escapeHtml(d.slot) + '</span>' +
        '</div>' +
        '<div class="footer">Client : ' + escapeHtml(d.customer_name) + '</div>' +
      '</article>';
    }).join("");
  }
  function getDeliveries() {
    try {
      var out = window.openai && window.openai.toolOutput;
      if (out && Array.isArray(out.deliveries)) return out.deliveries;
    } catch (_) {}
    return [];
  }
  render(getDeliveries());
  // Re-render if ChatGPT updates the tool output
  window.addEventListener("openai:set_globals", function () { render(getDeliveries()); });
</script>
</body>
</html>`;
