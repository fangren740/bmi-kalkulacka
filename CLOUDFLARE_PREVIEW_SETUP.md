# V3 preview infrastruktura (Cloudflare Worker Static Assets)
Status: **izolované nastavení, žádný zásah do veřejného webu**. Neprovádět merge do `main` bez souhlasu.

## Proč Workers, ne Pages
Cloudflare Pages normálně přesměrovává `/stranka.html` na `/stranka`, což je pro existující URL a canonical RychléVýpočty nepřijatelné. Workers Static Assets s `assets.html_handling: "none"` zachovají přesnou `.html` URL; `not_found_handling: "404-page"` vrací reálnou 404.

## Jednorázové připojení v Cloudflare (bez zásahu do DNS)
1. Otevři [Cloudflare dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
2. **Create application → Import a repository (GitHub)**, vyber `fangren740/bmi-kalkulacka` a typ **Worker** (ne Pages). Pokud je GitHub propojený pro RychléNástroje, dej přístup i tomuto repozitáři.
3. Zadej název **`rychlevypocty-v3-preview`**; konfigurace je v `wrangler.jsonc`. Před prvním **Deploy** zkontroluj, že tento projekt má vlastní pracovní/development adresu `*.workers.dev` a **NEMÁ připojenou žádnou custom domain ani route** pro `rychlevypocty.cz`.
4. V **Settings → Build → Branch control** nastav production branch nového *preview-only* Worker projektu na `rv3/cloudflare-preview` (NE `main`). **Enable Preview Builds = ON**. U položek Build command / Deploy command / Preview command nastav:
   - Build: `npm run build:preview`
   - Deploy: `npm run deploy:preview-base`
   - Preview: `npm run preview:cf`
   - Root directory: `/` (kořen repozitáře)
   - Node.js 22 nebo novější; `npm install` Cloudflare Build environment.
5. Povolit `workers.dev` jako **Preview host**, pokud není povolen. **Nepřidávat** hlavní doménu, neměnit DNS ani GitHub Pages. Aktivuj/pusť build `rv3/cloudflare-preview` a následně preview pro `rv3/pilot`.
6. V otevřeném draft PR [#56](https://github.com/fangren740/bmi-kalkulacka/pull/56) najdi automatický komentář Cloudflare s **Preview URL** a **Deployment URL** (konkrétní neměnná verze). Odkaz lze sdílet ke schválení. Pokud komentář chybí, zkontroluj Workers → Settings → Build → Branch control / Preview command / Preview host.

**Důležité:** Projekt Worker je záměrně *preview-only*. I jeho vlastní „production branch“ `rv3/cloudflare-preview` a workers.dev URL jsou noindex; nejde o produkční RychléVýpočty.cz.

## Ochrany
- `cloudflare/preview-worker.mjs`: `X-Robots-Tag: noindex, nofollow, noarchive` v KAŽDÉ odpovědi; `/robots.txt` vrací Disallow: /.
- `wrangler.jsonc`: `html_handling: "none"` a `not_found_handling: "404-page"`, `run_worker_first: true`, žádné custom routes.
- `scripts/build-cloudflare-preview.mjs`: kopíruje veřejné statické soubory beze změny, zachovává stávající URL, CSS/JS/obrázky/sitemap, vyloučí `CNAME`, tajné a interní soubory. Vytvoří pouze do `dist/` noindex `_headers`, blokovací `robots.txt` a skutečnou 404.
- `cloudflare/tests/preview-routing.test.mjs`: izolované mock testy, nikoli náhrada za reálný HTTP/browser test.
- `scripts/verify-cloudflare-preview.mjs`: skutečný HTTP smoke test s `redirect:'manual'`, porovnává HTTP status, `Location`, `X-Robots-Tag`, MIME i obsah kritických URL.

## Ověření po propojení
Cloudflare build musí uvést PASS v `npm run build:preview` a nabídnout konkrétní Preview URL / neměnný Deployment URL. Pro skutečný HTTP audit spusť **v cloud prostředí**:
```
node scripts/verify-cloudflare-preview.mjs https://<real-preview-host>
```
Nesmí se tvrdit, že URL/HTTP kontrola prošla, dokud není odpověď skutečně naměřena. Přechodové historické přesměrování a browser 390/1440 ověřit vůči provozované instanci samostatně.

## Budoucí migrace – samostatné schválení
Do produkce nepřenášet preview konfiguraci s `noindex`. Nejprve otestovat všechny sitemap URL, přesměrování, consent/analytics, 404, metadata a numerické regrese; připravit separátní produkční konfiguraci, rollback na GitHub Pages a ověřit zvolenou immutable verzi. Teprve poté schválit individuální převod DNS/custom domain. `main`, aktuální DNS a GitHub Pages nyní nedotčeny.

## První start po přepnutí Worker Previews
- Worker Previews aktivovány v dashboardu; na hlavní větvi Workeru `rv3/cloudflare-preview` se spouští pouze izolovaný preview projekt.
- Další commit má `[skip ci]`, aby nespustil stávající GitHub Actions. Cloudflare Git build se aktivuje samostatným Git webhookem.
- Stav skutečného buildu a HTTP odpovědí je potřeba ověřit z Cloudflare Deployments, nikoli odvodit z commitu.

## Spuštění pouze přes cloudové služby
Na pracovním PC není potřeba instalovat ani spouštět žádný program. Cloudflare Workers Builds přijímá změny přímo přes GitHub. `skip-checks: true` v commit traileru může přeskočit GitHub Actions, aniž by se měnil produkční web. Úspěch Cloudflare je však vždy nutné ověřit samostatně v GitHub status checku a Cloudflare Deployments.
