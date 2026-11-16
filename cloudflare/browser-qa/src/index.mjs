import { launch } from "@cloudflare/playwright";
import { qaCredential } from "./auth.mjs";
import { renderEvidence, renderScreenshot, saveEvidence } from "./evidence.mjs";
import { isCommitSha, PROOF_ID, isVisualPath, reviewRoutes, validOrigin, VIEWPORTS } from "./policy.mjs";
import { checkViewport, safeError } from "./viewport.mjs";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}

async function verifyManifest(browser, plan) {
  const url = plan.origin + "/rv3-preview-manifest.json";
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    // Use the same Browser Run network as the page checks. Cross-Worker fetch can
    // resolve an immutable Preview differently within Cloudflare's Worker network.
    await context.route("**/*", route => route.request().url() === url
      ? route.continue() : route.abort());
    const page = await context.newPage();
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12000 });
    if (response?.status() !== 200 || page.url() !== url || response.request().redirectedFrom() ||
        !/\bnoindex\b/i.test(await response.headerValue("x-robots-tag") || "")) return false;
    const manifest = await response.json();
    return manifest?.kind === "cloudflare-preview-only" && manifest.commitSha === plan.commitSha;
  } finally {
    await context.close();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/proof/")) {
      const [, , id, route, file, extra] = url.pathname.split("/");
      if (PROOF_ID.test(id) && !url.search) {
        const proof = route === undefined ? await renderEvidence(env.QA_EVIDENCE, id)
          : extra === undefined ? await renderScreenshot(env.QA_EVIDENCE, id, route, file) : null;
        if (proof) return proof;
      }
    }
    if (request.method !== "POST" || url.pathname !== "/run") return json({ error: "Not found" }, 404);
    if (!env.QA_AUTO_TOKEN || qaCredential(request.headers.get("authorization"), env) !== "automatic") {
      return json({ error: "Unauthorized" }, 401);
    }
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "Expected application/json" }, 415);
    }
    let plan;
    try {
      const body = await request.text();
      if (body.length > 700) return json({ error: "Request too large" }, 413);
      plan = JSON.parse(body);
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }
    if (!validOrigin(plan?.origin) || !isCommitSha(plan?.commitSha) ||
        (plan.visualPath !== undefined && !isVisualPath(plan.visualPath))) {
      return json({ error: "Expected an immutable RV3 deployment URL and build SHA" }, 400);
    }
    if (!env.QA_BROWSER || !env.QA_RUN_LIMIT || !env.QA_EVIDENCE) return json({ error: "QA binding missing" }, 503);
    if (!(await env.QA_RUN_LIMIT.limit({ key: "rv3-browser-qa" })).success) return json({ error: "Rate limit" }, 429);

    let browser;
    try {
      browser = await launch(env.QA_BROWSER, { guardrails: { allowedDomains: [new URL(plan.origin).hostname] } });
      if (!await verifyManifest(browser, plan)) {
        return json({ status: "FAIL", error: "Browser could not verify preview identity and noindex" }, 409);
      }
      const results = [];
      for (const route of reviewRoutes(plan.visualPath)) {
        for (const viewport of VIEWPORTS) results.push(await checkViewport(browser, plan.origin, route, viewport));
      }
      const report = {
        status: results.every(item => item.status === "PASS") ? "PASS" : "FAIL",
        timestamp: new Date().toISOString(),
        testedUrl: plan.origin,
        visualPath: plan.visualPath,
        results,
      };
      const evidenceId = await saveEvidence(env.QA_EVIDENCE, report, plan.commitSha);
      return json({
        ...report,
        commitSha: plan.commitSha,
        evidenceId,
        results: results.map(({ screenshotBase64, ...result }) => result),
      });
    } catch (error) {
      return json({ status: "FAIL", error: safeError(error) }, 502);
    } finally {
      await browser?.close().catch(() => {});
    }
  },
};
