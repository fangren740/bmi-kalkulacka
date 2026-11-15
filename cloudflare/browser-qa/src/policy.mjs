export const COMMIT_SHA = /^[a-f0-9]{40}$/;
export const PROOF_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const QA_ORIGIN = "https://rv3-browser-qa.maattinek.workers.dev";
const DEPLOY_URL = /^https:\/\/[a-f0-9]{8}-rychlevypocty-v3-preview\.maattinek\.workers\.dev$/;

export const VIEWPORTS = [
  { label: "mobile", width: 390, height: 844 },
  { label: "desktop", width: 1440, height: 900 },
];

export const ROUTES = [
  { id: "home", path: "/index.html", checks: ["search", "intent", "navigation"],
    destinations: ["/cista-mzda-kalkulacka.html"] },
  { id: "catalog", path: "/rv3/poc/katalog-v2.html",
    checks: ["catalogLinks", "category", "search", "navigation"],
    destinations: ["/hypotecni-kalkulacka.html"] },
  { id: "finance", path: "/rv3/wave1/finance-a-hypoteky.html",
    checks: ["paymentAndLtv", "navigation"], destinations: [] },
  { id: "osvc", path: "/rv3/wave1/osvc-a-freelancing.html",
    checks: ["navigation"], destinations: [] },
];

export const BASE_CHECKS = [
  "http200", "previewUrl", "visibleMain", "visibleH1", "viewportSize", "horizontalOverflow",
  "previewMetaNoindex", "previewHeaderNoindex", "consoleAndPageErrors", "screenshot",
];

export function isCommitSha(value) {
  return typeof value === "string" && COMMIT_SHA.test(value);
}

export function validOrigin(value) {
  return typeof value === "string" && DEPLOY_URL.test(value);
}

export function isAllowedBrowserRequest(url, origin, navigation, route) {
  const target = new URL(url);
  if (target.origin !== origin) return false;
  if (!navigation) return true;
  return !target.search && [route.path, ...route.destinations].includes(target.pathname);
}

export function isPass(result, route) {
  return [...BASE_CHECKS, ...route.checks].every(key => result.checks?.[key] === true);
}
