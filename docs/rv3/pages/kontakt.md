# RV3 Page Studio — Kontakt

**Production path:** \`/kontakt.html\` (unchanged)  
**Isolated preview:** \`/rv3/studio/kontakt.html\`  
**Stage:** DESIGN_REVIEW_PENDING / Browser QA NOT VERIFIED · 15 November 2026  
**Design north star:** \`docs/rv3/PAGE_STUDIO_QUALITY_STANDARD.md\` and Catalog V3.

## Verified source contract

Root \`kontakt.html\` was inspected directly at its current repository version:
- title: \`Kontakt | RychléVýpočty.cz\`
- canonical: \`https://rychlevypocty.cz/kontakt.html\`
- meta description: \`Kontakt na Martina Šilingera a možnosti nahlášení chyby, návrhu nástroje nebo neaktuálního zdroje.\`
- owner: **Martin Šilinger**; official e-mail: **rychlevypocty@seznam.cz**.
- four existing reasons for contact: **Chyba ve výpočtu, Neaktuální zdroj, Návrh nástroje, Obecný dotaz**.
- original source JSON-LD WebPage and BreadcrumbList are preserved (source \`dateModified\` remains as-is).
- original site states no contact form and no user account. This V3 design adds **only a client-side draft composer that opens the visitor's own email client**, not a server submission API. **Before any public release**, the existing privacy/legal source line “web nemá ... kontaktní formulář” must be reviewed for precise wording because even this client-side composer is technically an HTML form. Do **not** silently change public privacy claims here.

## Purpose

**Visitor's job:** “Mám problém nebo nápad; jak mám provozovateli poslat zprávu tak, aby ji šlo rychle pochopit?”

This page is **contact-first**, not a duplicate of the editorial policies or About page:
1. Own mint/cream hero illustration \`contact-postbox.svg\` (letter, inbox, checked note).
2. Big official email card with click-to-email and a copy-to-clipboard feature.
3. **Four selected intents** with appropriate local-only advice about what to include.
4. One compact mailto draft helper. When visitor chooses to submit, opens their mail client with prefilled subject/body; visitor must send manually. No backend, fetch, analytics, storage or auto-send.
5. Without JS: native HTML action mailto, method POST, text/plain; separate direct mailto links always present.
6. Privacy/correctness notes and next-step links to Methodology, Editorial Standards, About and Privacy.
7. Distinct page-specific responsive CSS with mobile-first 390 px layout; reuses SVG micro-icon set and catalog fonts/colors.

## Source-safe implementation

- \`rv3/engine/studio-contact.mjs\`: source title/description/canonical, owner, direct email and four categories are **fail-closed** before rendering, original schema reused.
- \`rv3/engine/contact.template.html\`: own authored layout; no import of legacy \`<main>\`.
- \`rv3/sitewide/contact.css\`: own page-specific layout, 390 px and reduced motion, high focus visibility.
- \`rv3/assets/contact-postbox.svg\`: original local SVG, no external dependencies.
- \`rv3/sitewide/contact-compose.js\`: immutable category hints, validated email draft, user-triggered clipboard action with explicit failure state.
- \`cloudflare/tests/studio-contact.test.mjs\`: 10 scenarios, including source drift, accessibility and HTML no-JS fallback, mailto URL escaping, no automatic transmission, selected hints and clipboard errors.
- \`scripts/build-v3-engine-poc.mjs\`: adds *only* \`rv3/studio/kontakt.html\`.
- \`cloudflare/browser-qa/visual-review.json\`: targets only the Contact preview for new 8+2 Browser Run.

## Open gates

- [ ] Current revision Node test suite PASS and Cloudflare deployed immutable preview for exact SHA
- [ ] Actual Browser Run 8 baseline + 2 Contact review runs, 390x844 and 1440x900
- [ ] Screen captures and visual comparison with Catalog V3 and About / Methodology / Editorial.
- [ ] In-browser click test: all four category hints, mailto URL encoding, copy success/failure, focus and keyboard; **do not send a real email during QA**.
- [ ] No horizontal overflow, browser console errors, missing symbols, broken internal links; HTTP/HTML noindex.
- [ ] Legal/editorial wording alignment about what constitutes a “contact form” before publication.
- [ ] Owner aesthetic/content approval; never merge to \`main\` or production without explicit permission.

## Status note

The existing Free-tier Cloudflare Browser Run may hit 429 daily usage. If so the preview deployment can be PASS while visual QA remains explicitly \`DEFERRED_QUOTA — NOT VERIFIED\`. **Do not call that a browser PASS**.
