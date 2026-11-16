import { Buffer } from "node:buffer";

const TTL_SECONDS = 7 * 24 * 60 * 60;
const HEADERS = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
};

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

function imagePath(id, item) {
  return `/proof/${id}/${item.route}/${item.viewport}.jpg`;
}

function hasImage(item) {
  return item?.screenshotBase64?.startsWith("/9j/") === true;
}

export async function renderScreenshot(store, id, route, file) {
  if (!/^(?:home|catalog|finance|osvc|visual)$/.test(route) || !/^(?:mobile|desktop)\.jpg$/.test(file)) return null;
  const report = await store?.get(id, "json");
  const item = report?.results.find(row => row.route === route && row.viewport + ".jpg" === file);
  if (!hasImage(item)) return null;
  return new Response(Buffer.from(item.screenshotBase64, "base64"), {
    headers: { ...HEADERS, "content-type": "image/jpeg", "content-security-policy": "default-src 'none'" },
  });
}

function imageLink(id, item) {
  if (!hasImage(item)) return "<p>Snímek nebyl zachycen.</p>";
  const path = imagePath(id, item);
  return `<a href="${path}">Otevřít JPEG</a> · <a href="${path}" download>Stáhnout</a>
<p><a href="${path}"><img alt="${escapeHtml(item.path)} · ${escapeHtml(item.viewport)}"
loading="lazy" width="${Number(item.width)}" src="${path}"></a></p>`;
}

export async function renderEvidence(store, id) {
  const report = await store?.get(id, "json");
  if (!report) return null;

  const visual = report.visualPath ? `<section><h2>Vizuální porovnání</h2><p>Schválení designu čeká na majitele.</p>
${["mobile", "desktop"].map(viewport => `<h3>${viewport === "mobile" ? "Mobil" : "Desktop"}</h3>
<div class="pair">${["visual", "catalog"].map(route => {
    const item = report.results.find(row => row.route === route && row.viewport === viewport);
    if (!item) return "";
    const p = item.profile;
    return `<article><strong>${route === "visual" ? "Redesign" : "Referenční katalog"}</strong>
<p>${escapeHtml(item.path)} · ${Number(item.width)} × ${Number(item.height)} viewport ${item.captureHeight ? `· ${Number(item.captureHeight)} px celá stránka` : ""}</p>
${p ? `<p>H1 ${escapeHtml(p.font)} · ${escapeHtml(p.size)} · ${escapeHtml(p.color)}.
 Akcent ${escapeHtml(p.accent ?? "–")}. Obrázky v obsahu ${Number(p.mainIllustrations)}.</p>` : ""}
${imageLink(id, item)}</article>`;
  }).join("")}</div>`).join("")}</section>` : "";

  const items = report.results.map(item => {
    const checks = Object.entries(item.checks)
      .map(([name, passed]) => `<li>${escapeHtml(name)} · ${passed === true ? "PASS" : "FAIL"}</li>`)
      .join("");
    const errors = item.errors.map(error => `<li>${escapeHtml(error)}</li>`).join("");
    const screenshot = item.fullPage
      ? hasImage(item) ? `<a href="${imagePath(id, item)}">Otevřít celostránkový JPEG</a>` : ""
      : imageLink(id, item);
    return `<details><summary>${escapeHtml(item.path)} · ${escapeHtml(item.viewport)} · ${Number(item.width)} × ${Number(item.height)} · ${escapeHtml(item.status)}</summary>
<ul>${checks}</ul>${item.error ? `<p>${escapeHtml(item.error)}</p>` : ""}${errors ? `<ul>${errors}</ul>` : ""}${screenshot}</details>`;
  }).join("");

  return new Response(`<!doctype html><html lang="cs"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Browser Run · ${escapeHtml(report.status)}</title>
<style>body{font:16px system-ui;margin:24px;color:#102c3e}img{max-width:100%;height:auto;border:1px solid #dcebdc}p{overflow-wrap:anywhere}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article{min-width:0}details{padding:8px 0}summary{cursor:pointer}</style>
<h1>Browser Run · ${escapeHtml(report.status)}</h1>
<p>Commit <code>${escapeHtml(report.commitSha)}</code></p><p>${escapeHtml(report.testedUrl)}</p>
<p>${escapeHtml(report.timestamp)}</p>${visual}<h2>Technické kontroly</h2>${items}</html>`, {
    headers: {
      ...HEADERS,
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    },
  });
}
