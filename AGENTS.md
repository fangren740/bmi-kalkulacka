# AGENTS.md — RychléVýpočty.cz

Agent orientation only. **This is a decision-first Czech calculator website, not a template factory.** The live production branch is `main`; V3 development stays isolated until the owner explicitly approves a specific release.

## Before editing
1. Read the live GitHub state (target branch, latest open PRs, and issue #59). Do **not** assume old status documents are current.
2. For V3 work, read `docs/rv3/PAGE_BY_PAGE_MASTERPLAN_2026-11-12.md` and `docs/rv3/PAGE_TRACKER_2026-11-12.json` **from the current V3 development branch**, where they exist (not necessarily `main`). These supersede the older `SITEWIDE_EXECUTION_PLAN_2026-11-12.md`.
3. Inspect the *specific* HTML, JS, CSS, existing benchmarks and user flow before changing a page. Preserve improvements from existing pilots.
4. Agree on the relevant source of truth: live code + current masterplan + page-specific brief, not historical prompts. If those conflict, report the conflict; do not improvise a new process.

## Product / UX rules
- All routes matter: homepage, catalog, situational hubs, guides, legal/trust and every calculator. **Each URL requires its own intent, structure, copy, interaction design and evidence**. Shared tokens/components are allowed; mass-producing pages with identical UX is not.
- Mobile-first and desktop must both be usable (baseline 390px and 1440px). Show real forms and results early, label inputs and error states clearly; keyboard, focus and touch interactions matter.
- Quality over quantity, human-readable Czech, verifiable methods and current authoritative sources. No invented testimonials, expert approvals, fake contact methods or SEO filler. No mechanical word-count optimization.
- Keep the original `logo-rv-v32.svg` byte-for-byte unchanged unless a separate explicit approval says otherwise.

## Technical invariants
- Preserve existing public `.html` URLs, canonical, title/H1 intent, structured data, internal links, robots and content depth. A preview must be `noindex` and distinct from production.
- Preserve functioning calculator formulas, rounding, date/year legislation, input ranges, dependency order, DOM IDs/hooks, consent/CMP, analytics and ads. Changes to numerics need explicit golden cases and evidence.
- The V3 effort is an incremental static/build-time adaptation: do not replace it with an unapproved SPA/framework or rewrite all root HTML.
- Do not modify DNS, production hosting, indexation, `main`, or merge PRs without specific owner approval. One reviewable outcome per page; batching PRs does **not** equal one collective page approval.

## Evidence / delivery
- Implement a scoped brief → actual change → relevant regression checks → real preview when available → focused visual/functional review → a single concise owner decision.
- Verify actual commands/scripts from this branch rather than assuming an npm project layout. Run only relevant tests supported by the available environment.
- A build success does **not** prove browser behavior. A screenshot is not proof that calculator math works. Report **PASS / FAIL / NOT VERIFIED** separately with the exact commit SHA, branch, test command, preview URL and evidence.
- No fabricated screenshots, green statuses, GSC indexing claims, or Cloudflare deployment claims. If a browser or GSC is inaccessible, say so and provide the real blocker.
- Do not add GitHub Actions runs for this work; minimize compute and user effort. Never require the owner to install Node, browsers or dev tooling on their work PC.
- Never commit secrets, access tokens, user files or sensitive analytics payloads. Changes must be reversibly scoped and explained in a draft PR.

## Review handoff
One concise report: changed page(s), why UX is better, exact preview link if verified, mobile/desktop evidence if actually captured, checks completed/not run, risks, rollback, and the **one** decision requested from the owner. Avoid repeated audit-only rounds.
