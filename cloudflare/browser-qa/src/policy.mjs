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

// One explicitly selected static HTML page per PR, on the verified RV3 host only.
export function isVisualPath(path) {
  return typeof path === "string" && path.length <= 100 &&
    /^\/(?:rv3\/(?:studio|poc|wave[1-9][0-9]*)\/)?[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(path);
}

export function reviewRoutes(path) {
  if (path === undefined) return ROUTES;
  const baseline = ROUTES.map(route => route.id === "catalog" ? { ...route, fullPage: true } : route);
  return [...baseline, {
    id: "visual", path, fullPage: true,
    checks: ["accessibleStructure", "anchors", "keyboardNavigation", "internalLinks"],
    destinations: [],
  }];
}
