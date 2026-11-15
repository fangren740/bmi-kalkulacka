import { spawn, execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isCommitSha, isPass, PROOF_ID, QA_ORIGIN, isVisualPath, reviewRoutes, validOrigin, VIEWPORTS } from "./src/policy.mjs";

export function deployedOrigin(output) {
  const lines = String(output).replace(/\x1b\[[0-9;]*m/g, "").split(/\r?\n/);
  const urls = lines.map(line => line.trim().match(/^Unique Deployment URL: (\S+)$/)?.[1]).filter(Boolean);
  return urls.length === 1 && validOrigin(urls[0]) ? urls[0] : null;
}

export function allowedBuild(env) {
  return env.WORKERS_CI === "1" && /^rv3\/(?!cloudflare-preview$)[a-z0-9][a-z0-9-]*$/.test(env.WORKERS_CI_BRANCH || "") &&
    isCommitSha(env.WORKERS_CI_COMMIT_SHA) && /^[a-f0-9]{64}$/.test(env.QA_AUTO_TOKEN || "");
}

export function summarize(report, plan) {
  const routes = reviewRoutes(plan.visualPath);
  const rows = Array.isArray(report?.results) ? report.results : [];
  return report?.status === "PASS" && report.testedUrl === plan.origin && report.commitSha === plan.commitSha &&
    typeof report.evidenceId === "string" && PROOF_ID.test(report.evidenceId) &&
    rows.length === routes.length * VIEWPORTS.length &&
    routes.every(route => VIEWPORTS.every(viewport => {
      const matches = rows.filter(row => row?.route === route.id && row.viewport === viewport.label);
      const row = matches[0];
      return matches.length === 1 && row.path === route.path && row.width === viewport.width &&
        row.height === viewport.height && row.status === "PASS" && isPass(row, route) &&
        (!route.fullPage || (row.fullPage === true && row.captureHeight >= viewport.height));
    }));
}


// A Browser Run capacity limit is NOT a test PASS. It may only defer browser QA
// after a verified git SHA and successful Wrangler preview upload. This lets
// owners inspect a design preview without masking actual application test FAILs.
export function quotaDeferred(status, report) {
  if (!report || report.status === "PASS" || typeof report.error !== "string") return false;
  const reason = report.error.trim();
  return (status === 429 && reason === "Rate limit") ||
    (status === 502 && /\b429\b/.test(reason) && /\b(browser|quota|limit)\b/i.test(reason));
}

async function uploadPreview(env) {
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", env }).trim();
  if (commit !== env.WORKERS_CI_COMMIT_SHA) throw Error("Build SHA differs from checkout");
  return await new Promise((resolveOutput, reject) => {
    const child = spawn(resolve("node_modules/.bin/wrangler"), ["preview"], {
      stdio: ["ignore", "pipe", "inherit"], env,
    });
    let output = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      process.stdout.write(chunk);
      output = (output + chunk).slice(-120000);
    });
    child.once("error", reject);
    child.once("close", code => code === 0 ? resolveOutput(output) : reject(Error("Wrangler preview failed")));
  });
}

export async function loadVisualPath() {
  const raw = await readFile(new URL("visual-review.json", import.meta.url), "utf8").catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (raw === null) return undefined;
  const config = JSON.parse(raw);
  if (!isVisualPath(config?.path) || Object.keys(config).length !== 1) {
    throw Error("visual-review.json must specify one RV3 HTML path");
  }
  return config.path;
}

export async function runPreviewQa({
  env = process.env, upload = uploadPreview, http = fetch, log = console.log, error = console.error,
  readVisual = loadVisualPath,
} = {}) {
  if (!allowedBuild(env)) {
    error("RV3 QA blocked: expected an eligible Workers Builds preview and encrypted QA_AUTO_TOKEN");
    return 2;
  }
  const { QA_AUTO_TOKEN, ...uploadEnv } = env;
  try {
    const visualPath = await readVisual();
    if (visualPath !== undefined && !isVisualPath(visualPath)) throw Error("Invalid visual review route");
    const origin = deployedOrigin(await upload(uploadEnv));
    if (!origin) throw Error("No unique RV3 deployment URL in Wrangler output");
    const plan = { origin, commitSha: env.WORKERS_CI_COMMIT_SHA, visualPath };
    log("RV3 QA preview " + origin + " · " + plan.commitSha);
    const response = await http(QA_ORIGIN + "/run", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(150000),
      headers: { authorization: "Bearer " + QA_AUTO_TOKEN, "content-type": "application/json" },
      body: JSON.stringify(plan),
    });
    const report = await response.json();
    for (const route of reviewRoutes(visualPath)) {
      for (const viewport of VIEWPORTS) {
        const row = (report.results ?? []).find(item => item.route === route.id && item.viewport === viewport.label);
        const failed = Object.entries(row?.checks ?? {}).filter(([, passed]) => passed === false).map(([name]) => name);
        log("RV3 QA " + route.id + " " + viewport.label + " " + (row?.status ?? "UNVERIFIED") +
          (failed.length ? " [" + failed.join(", ") + "]" : ""));
      }
    }
    if (typeof report.evidenceId === "string" && PROOF_ID.test(report.evidenceId)) {
      log("RV3 QA evidence (7 days): " + QA_ORIGIN + "/proof/" + report.evidenceId);
    }
    const passed = response.ok && summarize(report, plan);
    const deferredQuota = quotaDeferred(response.status, report);
    const baselinePass = (report.results ?? []).filter(row => row.route !== "visual" && row.status === "PASS").length;
    log("RV3 QA baseline = " + baselinePass + "/8");
    if (visualPath) log("RV3 visual review: " + visualPath + " · design approval pending");
    log("RV3 QA overall = " + (deferredQuota ? "DEFERRED_QUOTA — NOT VERIFIED" : passed ? "PASS" : "FAIL") + " · " + plan.commitSha);
    if (!response.ok) {
      const reason = typeof report.error === "string" ? report.error.replace(/[\r\n]/g, " ").slice(0, 220) : "";
      error("RV3 QA API HTTP " + response.status + (reason ? " · " + reason : ""));
    }
    if (deferredQuota) {
      // Exit 0 means *preview upload succeeded*, NEVER that QA passed.
      // Browser evidence remains mandatory before design approval/merge.
      error("RV3 QA DEFERRED_QUOTA — browser checks NOT VERIFIED; immutable preview " + origin +
        " is available for manual review. Rerun the 8+2 suite after quota reset.");
      return 0;
    }
    return passed ? 0 : 1;
  } catch {
    error("RV3 QA NOT VERIFIED: preview upload, immutable URL, or Browser Run response failed");
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runPreviewQa();
}
