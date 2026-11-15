const TTL_SECONDS = 7 * 24 * 60 * 60;

export async function saveEvidence(store, report, commitSha) {
  const id = crypto.randomUUID();
  await store.put(id, JSON.stringify({ ...report, commitSha }), { expirationTtl: TTL_SECONDS });
  return id;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export async function renderEvidence(store, id) {
  const report = await store?.get(id, "json");
  if (!report) return null;

  const items = report.results.map(item => {
    const checks = Object.entries(item.checks)
      .map(([name, passed]) => `<li>${escapeHtml(name)} · ${passed === true ? "PASS" : "FAIL"}</li>`)
      .join("");
    const errors = item.errors.map(error => `<li>${escapeHtml(error)}</li>`).join("");
    const screenshot = /^\/9j\/[A-Za-z0-9+/=]+$/.test(item.screenshotBase64 || "")
      ? `<img alt="${escapeHtml(item.path)} – ${escapeHtml(item.viewport)}" loading="lazy" width="${Number(item.width)}" src="data:image/jpeg;base64,${item.screenshotBase64}">`
      : "<p>Snímek nebyl zachycen.</p>";
    return `<section><h2>${escapeHtml(item.path)} · ${escapeHtml(item.viewport)} · ${Number(item.width)} × ${Number(item.height)} · ${escapeHtml(item.status)}</h2>
<ul>${checks}</ul>${item.error ? `<p>${escapeHtml(item.error)}</p>` : ""}${errors ? `<ul>${errors}</ul>` : ""}${screenshot}</section>`;
  }).join("");

  return new Response(`<!doctype html><html lang="cs"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Browser Run · ${escapeHtml(report.status)}</title>
<style>body{font:16px system-ui;margin:24px}img{max-width:100%;height:auto}p{overflow-wrap:anywhere}</style>
<h1>Browser Run · ${escapeHtml(report.status)}</h1>
<p>Commit: <code>${escapeHtml(report.commitSha)}</code></p><p>${escapeHtml(report.testedUrl)}</p>
<p>${escapeHtml(report.timestamp)}</p>${items}</html>`, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
      "content-security-policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}
