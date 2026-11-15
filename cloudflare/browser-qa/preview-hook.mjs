import { spawn, execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isCommitSha, isPass, PROOF_ID, QA_ORIGIN, ROUTES, validOrigin, VIEWPORTS } from "./src/policy.mjs";

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
  const rows = Array.isArray(report?.results) ? report.results : [];
  return report?.status === "PASS" && report.testedUrl === plan.origin && report.commitSha === plan.commitSha &&
    typeof report.evidenceId === "string" && PROOF_ID.test(report.evidenceId) &&
    rows.length === ROUTES.length * VIEWPORTS.length &&
    ROUTES.every(route => VIEWPORTS.every(viewport => {
      const matches = rows.filter(row => row?.route === route.id && row.viewport === viewport.label);
      const row = matches[0];
      return matches.length === 1 && row.path === route.path && row.width === viewport.width &&
        row.height === viewport.height && row.status === "PASS" && isPass(row, route);
    }));
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

export async function runPreviewQa({
  env = process.env, upload = uploadPreview, http = fetch, log = console.log, error = console.error,
} = {}) {
  if (!allowedBuild(env)) {
    error("RV3 QA blocked: expected an eligible Workers Builds preview and encrypted QA_AUTO_TOKEN");
    return 2;
  }
  const { QA_AUTO_TOKEN, ...uploadEnv } = env;
  try {
    const origin = deployedOrigin(await upload(uploadEnv));
    if (!origin) throw Error("No unique RV3 deployment URL in Wrangler output");
    const plan = { origin, commitSha: env.WORKERS_CI_COMMIT_SHA };
    log("RV3 QA preview " + origin + " · " + plan.commitSha);
    const response = await http(QA_ORIGIN + "/run", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(150000),
      headers: { authorization: "Bearer " + QA_AUTO_TOKEN, "content-type": "application/json" },
      body: JSON.stringify(plan),
    });
    const report = await response.json();
    for (const route of ROUTES) {
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
    log("RV3 QA overall = " + (passed ? "PASS" : "FAIL") + " · " + plan.commitSha);
    if (!response.ok) error("RV3 QA API HTTP " + response.status);
    return passed ? 0 : 1;
  } catch {
    error("RV3 QA NOT VERIFIED: preview upload, immutable URL, or Browser Run response failed");
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runPreviewQa();
}
