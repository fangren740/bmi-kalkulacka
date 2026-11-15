import test from "node:test";
import assert from "node:assert/strict";
import { allowedBuild, deployedOrigin, loadVisualPath, quotaDeferred, runPreviewQa, summarize } from "../preview-hook.mjs";
import { BASE_CHECKS, isAllowedBrowserRequest, isVisualPath, reviewRoutes, ROUTES, VIEWPORTS } from "../src/policy.mjs";

const origin = "https://a01234bc-rychlevypocty-v3-preview.maattinek.workers.dev";
const token = "e".repeat(64);
const plan = { origin, commitSha: "a".repeat(40) };
const env = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "rv3/browser-run-qa",
  WORKERS_CI_COMMIT_SHA: plan.commitSha, QA_AUTO_TOKEN: token };
const results = ROUTES.flatMap(route => VIEWPORTS.map(({ label, width, height }) => ({
  route: route.id, viewport: label, path: route.path, width, height, status: "PASS",
  checks: Object.fromEntries([...BASE_CHECKS, ...route.checks].map(name => [name, true])),
})));
const report = { status: "PASS", evidenceId: "12345678-1234-4321-8123-112233445566",
  testedUrl: origin, commitSha: plan.commitSha, results };

test("only one exact Unique Deployment URL, no alias or other site", () => {
  const line = "Unique Deployment URL: " + origin;
  assert.equal(deployedOrigin("Preview URL: https://branch.example.com\n\x1b[36m" + line + "\x1b[0m\n"), origin);
  for (const value of [line + "\n" + line, line + "/anything", line + ".example.org",
    "Preview URL: " + origin, "Unique Deployment URL: https://rychlevypocty.cz"]) {
    assert.equal(deployedOrigin(value), null, value);
  }
});
test("only eligible RV3 non-base previews", () => {
  assert.ok(allowedBuild(env));
  for (const branch of ["main", "rv3/cloudflare-preview", "chore/qa", "rv3/one/two"]) {
    assert.ok(!allowedBuild({ ...env, WORKERS_CI_BRANCH: branch }));
  }
  assert.ok(!allowedBuild({ ...env, QA_AUTO_TOKEN: "" }));
});
test("same origin and locked navigation targets", () => {
  assert.ok(isAllowedBrowserRequest(origin + ROUTES[0].path, origin, true, ROUTES[0]));
  assert.ok(!isAllowedBrowserRequest(origin + "/sitemap.xml", origin, true, ROUTES[0]));
  assert.ok(!isAllowedBrowserRequest("https://rychlevypocty.cz/", origin, false, ROUTES[0]));
});
test("requires all eight matching results, screenshots, SHA, and proof", () => {
  assert.ok(summarize(report, plan));
  assert.ok(!summarize({ ...report, commitSha: "b".repeat(40) }, plan));
  assert.ok(!summarize({ ...report, results: results.slice(1) }, plan));
  assert.ok(!summarize({ ...report, results: [{ ...results[0], checks: {} }, ...results.slice(1)] }, plan));
});
test("runs one upload and one authenticated Browser Run, and preserves failure", async () => {
  let uploads = 0;
  let runs = 0;
  const log = [];
  const options = { env, readVisual: async () => undefined, log: value => log.push(value), error: value => log.push(value),
    upload: async uploadEnv => {
      uploads++;
      assert.equal(uploadEnv.QA_AUTO_TOKEN, undefined);
      return "Unique Deployment URL: " + origin;
    },
    http: async (url, request) => {
      runs++;
      assert.match(url, /^https:\/\/rv3-browser-qa\./);
      assert.equal(request.headers.authorization, "Bearer " + token);
      assert.deepEqual(JSON.parse(request.body), plan);
      return Response.json(report);
    },
  };
  assert.equal(await runPreviewQa(options), 0);
  assert.equal(uploads, 1);
  assert.equal(runs, 1);
  assert.ok(!log.join("\n").includes(token));
  assert.equal(await runPreviewQa({ ...options, http: async () => Response.json({ status: "FAIL" }, { status: 409 }) }), 1);
});

test("wrong, missing and manual secrets cannot authorize automatic QA", async () => {
  const { qaCredential } = await import("../src/auth.mjs");
  assert.equal(qaCredential("Bearer " + token, env), "automatic");
  assert.equal(qaCredential("Bearer " + "d".repeat(64), env), null);
  assert.equal(qaCredential(null, env), null);
  assert.equal(qaCredential("Bearer " + token, { QA_TOKEN: token }), "manual");
});

test("opt-in accepts a single relative RV3 document and preserves the eight baseline cases", async () => {
  const configured = await loadVisualPath();
  assert.ok(configured === undefined || isVisualPath(configured));
  const path = "/rv3/studio/example.html";
  for (const invalid of ["//example.org/a.html", "/rv3/studio/../x.html", "/x.html?redirect=1",
    "/x.html#about", "/rv3/%2fxx.html", "/proof/x.html", 9, null]) {
    assert.equal(isVisualPath(invalid), false);
  }
  assert.equal(reviewRoutes().length * VIEWPORTS.length, 8);
  const selected = { ...plan, visualPath: path };
  assert.equal(summarize(report, selected), false);
  const reviewResults = reviewRoutes(path).flatMap(route => VIEWPORTS.map(({label, width, height}) => ({
    route: route.id, viewport: label, path: route.path, width, height, status: "PASS",
    fullPage: route.fullPage === true, captureHeight: 2000,
    checks: Object.fromEntries([...BASE_CHECKS, ...route.checks].map(name => [name, true])),
  })));
  assert.ok(summarize({ ...report, results: reviewResults }, selected));
  assert.equal(summarize({ ...report, results: reviewResults.map(row =>
    row.route === "catalog" ? { ...row, fullPage: false } : row) }, selected), false);
});

test("missing and malformed proof targets do not query storage", async () => {
  const { renderScreenshot } = await import("../src/evidence.mjs");
  const noRead = { get() { throw Error("Unexpected KV read"); } };
  assert.equal(await renderScreenshot(noRead, report.evidenceId, "other", "mobile.jpg"), null);
  assert.equal(await renderScreenshot(noRead, report.evidenceId, "visual", "bad.png"), null);
});

test("only a specific QA Browser Run quota is eligible for deferred preview",()=>{
 assert.equal(quotaDeferred(429,{error:"Rate limit"}),true);
 assert.equal(quotaDeferred(502,{status:"FAIL",error:"Browser launch failed: 429 quota exceeded"}),true);
 assert.equal(quotaDeferred(502,{status:"FAIL",error:"Cloudflare browser 429 daily limit"}),true);
 for(const [status,error] of [
  [409,"Browser could not verify preview identity and noindex"],
  [401,"Unauthorized"],[503,"QA binding missing"],
  [502,"Unrelated page error"],[502,"Browser crashed"],[429,"Unauthorized"],
  [200,"429 browser quota"],[500,"429 browser quota"],
 ]){
  assert.equal(quotaDeferred(status,{status:"FAIL",error}),false,
    "Unexpected deferral: "+status+" "+error);
 }
 assert.equal(quotaDeferred(502,{status:"PASS",error:"Browser launch failed: 429 quota exceeded"}),false);
 assert.equal(quotaDeferred(502,{}),false);
});

test("quota temporarily defers only browser QA, never upload or real QA failures",async()=>{
 const output=[];
 const upload=async()=> "Unique Deployment URL: "+origin;
 const options={env,readVisual:async()=>undefined,upload,
  log:value=>output.push(value),error:value=>output.push(value)};
 assert.equal(await runPreviewQa({...options,http:async()=>Response.json({error:"Rate limit"},{status:429})}),0);
 assert.ok(output.some(line=>line.includes("DEFERRED_QUOTA — NOT VERIFIED")));
 assert.ok(output.some(line=>line.includes("browser checks NOT VERIFIED")));
 assert.ok(!output.some(line=>line.includes("overall = PASS")));
 output.length=0;
 assert.equal(await runPreviewQa({...options,http:async()=>Response.json({
   status:"FAIL",error:"Browser launch failed: 429 quota exceeded"
 },{status:502})}),0);
 assert.ok(output.some(line=>line.includes("DEFERRED_QUOTA")));
 output.length=0;
 assert.equal(await runPreviewQa({...options,http:async()=>Response.json({
   status:"FAIL",error:"Browser could not verify preview identity and noindex"
 },{status:409})}),1);
 assert.ok(output.some(line=>line.includes("overall = FAIL")));
 output.length=0;
 assert.equal(await runPreviewQa({...options,http:async()=>Response.json({
   status:"FAIL",error:"Browser crashed"
 },{status:502})}),1);
 assert.ok(output.some(line=>line.includes("overall = FAIL")));
});
