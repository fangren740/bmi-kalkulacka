import { Buffer } from "node:buffer";
import { isAllowedBrowserRequest, isPass } from "./policy.mjs";

const noindex = value => /(?:^|[\s,])noindex(?:$|[\s,])/i.test(value || "");
const number = text => Number(text.replace(/[^0-9,.-]/g, "").replace(",", "."));

export function safeError(error) {
  return String(error instanceof Error ? error.message : error).slice(0, 250);
}

async function follow(page, link, origin, path) {
  const expected = origin + path;
  const responsePromise = page.waitForResponse(response =>
    response.url() === expected && response.request().isNavigationRequest(), { timeout: 6000 });
  const [response] = await Promise.all([responsePromise, link.click()]);
  // Some tools populate their default inputs in the query via history.replaceState.
  const atDestination = url => url.origin === origin && url.pathname === path;
  await page.waitForURL(atDestination, { waitUntil: "domcontentloaded", timeout: 6000 });
  return response.status() === 200 && !response.request().redirectedFrom() && atDestination(new URL(page.url()));
}

async function anchor(page, link, anchorId) {
  await link.click();
  return new URL(page.url()).hash === "#" + anchorId && await page.locator("#" + anchorId).isVisible();
}

async function interact(page, route, checks) {
  if (route.id === "home") {
    await page.locator('[data-intent="housing"]').click();
    checks.intent = await page.locator('[data-intent="housing"]').getAttribute("aria-pressed") === "true" &&
      await page.locator('[data-intent-panel="housing"]').isVisible();
    const input = page.locator("#tool-search");
    await input.fill("čistá mzda");
    const result = page.locator('#tool-results a[href="/cista-mzda-kalkulacka.html"]').first();
    await result.waitFor({ state: "visible" });
    checks.search = await input.getAttribute("aria-expanded") === "true";
    return origin => follow(page, result, origin, route.destinations[0]);
  }

  if (route.id === "catalog") {
    checks.catalogLinks = await page.locator("a[data-v3-tool]").evaluateAll(links => {
      const paths = links.map(link => link.getAttribute("href"));
      return paths.every(path => /^\/[a-z0-9-]+\.html$/.test(path)) && new Set(paths).size === 135;
    });
    const category = page.locator("details[data-v3-category]").first();
    await category.locator("summary").first().click();
    checks.category = await category.evaluate(element => element.open) &&
      await category.locator("a[data-v3-tool]").first().isVisible();
    const input = page.locator("#rv3d-search");
    await input.fill("hypotéka");
    await page.locator("#rv3d-search-submit").click();
    const result = page.locator('#rv3d-search-results a[href="/hypotecni-kalkulacka.html"]').first();
    await result.waitFor({ state: "visible" });
    checks.search = await input.getAttribute("aria-expanded") === "true";
    return origin => follow(page, result, origin, route.destinations[0]);
  }

  if (route.id === "finance") {
    const rate = page.locator("#rate");
    if (!await rate.isVisible()) await page.locator(".advanced-options summary").click();
    await page.locator("#price").fill("6000000");
    await page.locator("#equity").fill("1200000");
    await page.locator("#years").fill("25");
    await rate.fill("0");
    // Zero interest, principal 4,800,000 over 300 months, LTV 80%.
    checks.paymentAndLtv = number(await page.locator("#monthly").innerText()) === 16000 &&
      number(await page.locator("#ltv").innerText()) === 80;
    checks.navigation = await anchor(page, page.locator('main a[href="#finance-check"]').first(), "finance-check");
    return null;
  }

  checks.navigation = await anchor(page, page.locator('main a[href="#vyber"]').first(), "vyber");
  return null;
}

export async function checkViewport(browser, origin, route, viewport) {
  const { label, width, height } = viewport;
  const url = origin + route.path;
  const checks = {};
  const errors = [];
  let screenshotBase64 = null;
  let context;
  let page;
  let error;
  try {
    context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: "block" });
    await context.route("**/*", handler => {
      const req = handler.request();
      return isAllowedBrowserRequest(req.url(), origin, req.isNavigationRequest(), route)
        ? handler.continue() : handler.abort();
    });
    page = await context.newPage();
    page.setDefaultTimeout(5000);
    const finding = value => { if (errors.length < 5) errors.push(safeError(value)); };
    page.on("pageerror", finding);
    page.on("console", message => { if (message.type() === "error") finding(message.text()); });
    const response = await page.goto(url, { waitUntil: "load", timeout: 12000 });
    checks.http200 = response?.status() === 200;
    checks.previewUrl = page.url() === url && Boolean(response && !response.request().redirectedFrom());
    if (!checks.http200 || !checks.previewUrl) throw Error("Expected exact preview URL to return HTTP 200");
    await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 5000 });
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      robots: [...document.querySelectorAll('meta[name="robots" i]')].map(meta => meta.content),
    }));
    checks.visibleMain = await page.locator("main").first().isVisible();
    checks.visibleH1 = await page.locator("main h1").first().isVisible();
    checks.viewportSize = layout.width === width && layout.height === height;
    checks.horizontalOverflow = layout.overflow === 0;
    checks.previewMetaNoindex = layout.robots.length === 1 && noindex(layout.robots[0]);
    checks.previewHeaderNoindex = noindex(await response.headerValue("x-robots-tag"));
    const navigate = await interact(page, route, checks);
    screenshotBase64 = await takeScreenshot(page);
    // The loaded destination proves the link works. Console evidence covers the four tested pages.
    checks.consoleAndPageErrors = errors.length === 0;
    if (navigate) checks.navigation = await navigate(origin);
  } catch (reason) {
    error = safeError(reason);
    if (!screenshotBase64 && page?.url().startsWith(url)) {
      screenshotBase64 = await takeScreenshot(page).catch(() => null);
    }
  } finally {
    await context?.close().catch(() => {});
  }
  checks.screenshot = Boolean(screenshotBase64);
  checks.consoleAndPageErrors ??= errors.length === 0;
  const result = { route: route.id, path: route.path, viewport: label, width, height, checks, errors, error, screenshotBase64 };
  return { ...result, status: !error && isPass(result, route) ? "PASS" : "FAIL" };
}

async function takeScreenshot(page) {
  return Buffer.from(await page.screenshot({ type: "jpeg", quality: 65, timeout: 5000 })).toString("base64");
}
