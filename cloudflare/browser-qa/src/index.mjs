import { launch } from "@cloudflare/playwright";
import { qaCredential } from "./auth.mjs";
import { renderEvidence, saveEvidence } from "./evidence.mjs";
import { isCommitSha, PROOF_ID, ROUTES, validOrigin, VIEWPORTS } from "./policy.mjs";
import { checkViewport, safeError } from "./viewport.mjs";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/proof/")) {
      const id = url.pathname.slice("/proof/".length);
      if (PROOF_ID.test(id) && !url.search) {
        const proof = await renderEvidence(env.QA_EVIDENCE, id);
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
    if (!validOrigin(plan?.origin) || !isCommitSha(plan?.commitSha)) {
      return json({ error: "Expected an immutable RV3 deployment URL and build SHA" }, 400);
    }
    if (!env.QA_BROWSER || !env.QA_RUN_LIMIT || !env.QA_EVIDENCE) return json({ error: "QA binding missing" }, 503);
    if (!(await env.QA_RUN_LIMIT.limit({ key: "rv3-browser-qa" })).success) return json({ error: "Rate limit" }, 429);

    let browser;
    try {
      const response = await fetch(plan.origin + "/rv3-preview-manifest.json", {
        redirect: "error", signal: AbortSignal.timeout(8000),
      });
      const manifest = response.ok ? await response.json() : null;
      if (manifest?.kind !== "cloudflare-preview-only" || manifest.commitSha !== plan.commitSha ||
          !response.headers.get("x-robots-tag")?.includes("noindex")) {
        return json({ status: "FAIL", error: "Preview manifest does not match the build SHA" }, 409);
      }
      browser = await launch(env.QA_BROWSER, { guardrails: { allowedDomains: [new URL(plan.origin).hostname] } });
      const results = [];
      for (const route of ROUTES) {
        for (const viewport of VIEWPORTS) results.push(await checkViewport(browser, plan.origin, route, viewport));
      }
      const report = {
        status: results.every(item => item.status === "PASS") ? "PASS" : "FAIL",
        timestamp: new Date().toISOString(),
        testedUrl: plan.origin,
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
