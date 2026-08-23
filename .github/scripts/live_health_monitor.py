#!/usr/bin/env python3
"""RychléVýpočty.cz live production health monitor.

Checks the deployed site (not only repository files):
- live sitemap/robots availability and sitemap parity with repository
- HTTP status / redirects for sitemap URLs
- live indexability + canonical consistency
- live JSON-LD parse + Dataset description contract
- same-origin critical assets referenced by live pages

The script is read-only and returns a non-zero exit code for active P0/P1 findings.
Uses only the Python standard library.
"""
from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

VERSION = "1.0.0"
SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3, "INFO": 4}
USER_AGENT = "RychleVypocty-LiveHealth/1.0 (+https://rychlevypocty.cz/)"
HTML_MAX_BYTES = 4_000_000
ASSET_MAX_BYTES = 256_000


@dataclass
class Finding:
    check: str
    severity: str
    path: str
    message: str
    detail: str = ""
    exempted: bool = False
    exception_reason: str = ""


@dataclass
class FetchResult:
    url: str
    status: int | None
    headers: dict[str, str]
    body: bytes
    error: str = ""
    location: str = ""
    elapsed_ms: int = 0


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        return None


OPENER = build_opener(NoRedirect())


class LiveHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.h1_count = 0
        self.robots = ""
        self.canonical = ""
        self.jsonld: list[str] = []
        self.asset_refs: list[str] = []
        self.og_images: list[str] = []
        self.twitter_images: list[str] = []
        self._in_title = False
        self._script_type = ""
        self._script_has_src = False
        self._script_parts: list[str] | None = None

    @staticmethod
    def _attrs(attrs: list[tuple[str, str | None]]) -> dict[str, str]:
        return {str(k).lower(): (v or "") for k, v in attrs}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        a = self._attrs(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self.h1_count += 1

        if tag == "meta":
            name = a.get("name", "").lower().strip()
            prop = a.get("property", "").lower().strip()
            content = a.get("content", "").strip()
            if name == "robots":
                self.robots = content
            elif prop == "og:image" and content:
                self.og_images.append(content)
            elif name == "twitter:image" and content:
                self.twitter_images.append(content)

        if tag == "link":
            rel_tokens = {x.lower() for x in a.get("rel", "").split()}
            href = a.get("href", "").strip()
            if "canonical" in rel_tokens:
                self.canonical = href
            if href and rel_tokens.intersection({"stylesheet", "icon", "apple-touch-icon", "preload"}):
                self.asset_refs.append(href)

        if tag == "script":
            src = a.get("src", "").strip()
            if src:
                self.asset_refs.append(src)
            self._script_type = a.get("type", "").lower().strip()
            self._script_has_src = bool(src)
            self._script_parts = [] if not src else None

        if tag in {"img", "source", "video", "audio"}:
            for attr in ("src", "poster"):
                value = a.get(attr, "").strip()
                if value:
                    self.asset_refs.append(value)
            srcset = a.get("srcset", "").strip()
            if srcset:
                for item in srcset.split(","):
                    token = item.strip().split()[0] if item.strip() else ""
                    if token:
                        self.asset_refs.append(token)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._script_parts is not None:
            body = "".join(self._script_parts).strip()
            if body and self._script_type == "application/ld+json":
                self.jsonld.append(body)
            self._script_parts = None
            self._script_type = ""
            self._script_has_src = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._script_parts is not None:
            self._script_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Nelze načíst JSON {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError(f"Konfigurace {path} musí být JSON object.")
    return data


def normalize_origin(origin: str) -> str:
    return origin.rstrip("/")


def normalized_url(url: str) -> str:
    p = urlparse(url)
    path = re.sub(r"/{2,}", "/", p.path or "/")
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")
    return urlunparse((p.scheme.lower(), p.netloc.lower(), path, "", "", ""))


def url_to_path(url: str, site_origin: str) -> str:
    p = urlparse(url)
    origin = urlparse(site_origin)
    if p.netloc.lower() != origin.netloc.lower():
        return url
    path = p.path or "/"
    if path == "/":
        return "index.html"
    if path.endswith("/"):
        return path.lstrip("/") + "index.html"
    return path.lstrip("/")


def same_origin(url: str, site_origin: str) -> bool:
    p = urlparse(url)
    origin = urlparse(site_origin)
    return p.scheme.lower() == origin.scheme.lower() and p.netloc.lower() == origin.netloc.lower()


def iter_dataset_objects(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        typ = value.get("@type")
        types: list[str] = []
        if isinstance(typ, str):
            types = [typ]
        elif isinstance(typ, list):
            types = [x for x in typ if isinstance(x, str)]
        if any(t.lower() == "dataset" for t in types):
            yield value
        for child in value.values():
            yield from iter_dataset_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_dataset_objects(child)


def _fetch_once(url: str, timeout: float, max_bytes: int, method: str = "GET") -> FetchResult:
    started = time.perf_counter()
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*", "Cache-Control": "no-cache", "Pragma": "no-cache"}, method=method)
    try:
        with OPENER.open(req, timeout=timeout) as resp:
            body = b""
            if method != "HEAD":
                body = resp.read(max_bytes + 1)
                if len(body) > max_bytes:
                    body = body[:max_bytes]
            elapsed = int((time.perf_counter() - started) * 1000)
            return FetchResult(
                url=url,
                status=int(resp.getcode()),
                headers={k.lower(): v for k, v in resp.headers.items()},
                body=body,
                elapsed_ms=elapsed,
            )
    except HTTPError as exc:
        elapsed = int((time.perf_counter() - started) * 1000)
        body = b""
        try:
            if method != "HEAD" and exc.fp:
                body = exc.read(max_bytes)
        except Exception:
            pass
        return FetchResult(
            url=url,
            status=int(exc.code),
            headers={k.lower(): v for k, v in exc.headers.items()} if exc.headers else {},
            body=body,
            error=str(exc),
            location=(exc.headers.get("Location", "") if exc.headers else ""),
            elapsed_ms=elapsed,
        )
    except (URLError, TimeoutError, OSError) as exc:
        elapsed = int((time.perf_counter() - started) * 1000)
        return FetchResult(url=url, status=None, headers={}, body=b"", error=str(exc), elapsed_ms=elapsed)


def fetch_with_retry(
    url: str,
    timeout: float,
    retries: int,
    retry_delay: float,
    max_bytes: int,
    method: str = "GET",
) -> FetchResult:
    result: FetchResult | None = None
    for attempt in range(retries + 1):
        result = _fetch_once(url, timeout=timeout, max_bytes=max_bytes, method=method)
        transient = result.status is None or result.status in {408, 425, 429, 500, 502, 503, 504}
        if not transient:
            return result
        if attempt < retries:
            time.sleep(retry_delay * (attempt + 1))
    assert result is not None
    return result


def decode_text(result: FetchResult) -> str:
    content_type = result.headers.get("content-type", "")
    charset = "utf-8"
    match = re.search(r"charset=([^;\s]+)", content_type, re.I)
    if match:
        charset = match.group(1).strip("\"'")
    try:
        return result.body.decode(charset, errors="replace")
    except LookupError:
        return result.body.decode("utf-8", errors="replace")


def parse_sitemap(xml_text: str) -> list[str]:
    root = ET.fromstring(xml_text)
    urls: list[str] = []
    for elem in root.iter():
        if elem.tag.endswith("loc") and elem.text:
            value = elem.text.strip()
            if value:
                urls.append(value)
    return urls


def parse_html(text: str) -> LiveHTMLParser:
    parser = LiveHTMLParser()
    parser.feed(text)
    parser.close()
    return parser


def load_repo_sitemap(path: Path) -> list[str]:
    if not path.exists():
        return []
    return parse_sitemap(path.read_text("utf-8", errors="replace"))


def validate_exceptions(config: dict[str, Any], findings: list[Finding]) -> list[dict[str, Any]]:
    valid: list[dict[str, Any]] = []
    today = dt.date.today()
    for i, item in enumerate(config.get("exceptions", []), start=1):
        if not isinstance(item, dict):
            findings.append(Finding("CONFIG_INVALID_EXCEPTION", "P1", "audits/audit-config.json", f"Výjimka #{i} není objekt."))
            continue
        check = str(item.get("check", "")).strip()
        path = str(item.get("path", "")).strip()
        reason = str(item.get("reason", "")).strip()
        expires = str(item.get("expires", "")).strip()
        if not check or not path or len(reason) < 10:
            findings.append(Finding("CONFIG_INVALID_EXCEPTION", "P1", "audits/audit-config.json", f"Výjimka #{i} musí mít check, path a konkrétní reason (min. 10 znaků)."))
            continue
        if expires:
            try:
                exp = dt.date.fromisoformat(expires)
            except ValueError:
                findings.append(Finding("CONFIG_INVALID_EXCEPTION", "P1", "audits/audit-config.json", f"Výjimka #{i} má neplatné expires: {expires}."))
                continue
            if exp < today:
                findings.append(Finding("CONFIG_EXPIRED_EXCEPTION", "P1", path, f"Výjimka pro {check} expirovala {expires}.", reason))
                continue
        valid.append(item)
    return valid


def apply_exceptions(findings: list[Finding], exceptions: list[dict[str, Any]]) -> None:
    for finding in findings:
        if finding.check.startswith("CONFIG_"):
            continue
        for exc in exceptions:
            if exc.get("check") == finding.check and fnmatch.fnmatch(finding.path, str(exc.get("path", ""))):
                finding.exempted = True
                finding.exception_reason = str(exc.get("reason", ""))
                break


def add(findings: list[Finding], check: str, severity: str, path: str, message: str, detail: str = "") -> None:
    findings.append(Finding(check, severity, path, message, detail))


def scan_page(
    url: str,
    site_origin: str,
    timeout: float,
    retries: int,
    retry_delay: float,
    dataset_min: int,
    dataset_max: int,
) -> tuple[list[Finding], dict[str, Any], set[str]]:
    findings: list[Finding] = []
    stats: dict[str, Any] = {"jsonld_blocks": 0, "dataset_objects": 0}
    assets: set[str] = set()
    path = url_to_path(url, site_origin)

    result = fetch_with_retry(url, timeout, retries, retry_delay, HTML_MAX_BYTES)
    stats["elapsed_ms"] = result.elapsed_ms
    stats["status"] = result.status

    if result.status is None:
        add(findings, "LIVE_PAGE_UNREACHABLE", "P1", path, "Produkční URL není dostupná po opakovaných pokusech.", result.error)
        return findings, stats, assets
    if 300 <= result.status < 400:
        add(findings, "LIVE_PAGE_REDIRECT", "P1", path, f"URL ze sitemap vrací redirect HTTP {result.status}.", result.location)
        return findings, stats, assets
    if result.status != 200:
        severity = "P0" if path == "index.html" and result.status >= 500 else "P1"
        add(findings, "LIVE_PAGE_STATUS", severity, path, f"Produkční URL vrací HTTP {result.status}.", result.error)
        return findings, stats, assets

    content_type = result.headers.get("content-type", "").lower()
    if "text/html" not in content_type:
        add(findings, "LIVE_PAGE_CONTENT_TYPE", "P1", path, f"URL ze sitemap nevrací HTML Content-Type: {content_type or 'missing'}.")
        return findings, stats, assets

    text = decode_text(result)
    try:
        parser = parse_html(text)
    except Exception as exc:
        add(findings, "LIVE_HTML_PARSE", "P1", path, "Produkční HTML nelze spolehlivě parsovat.", str(exc))
        return findings, stats, assets

    if not parser.title:
        add(findings, "LIVE_MISSING_TITLE", "P1", path, "Produkční indexovatelná stránka nemá neprázdný <title>.")
    if parser.h1_count == 0:
        add(findings, "LIVE_MISSING_H1", "P2", path, "Produkční stránka nemá H1.")
    if "noindex" in parser.robots.lower():
        add(findings, "LIVE_SITEMAP_NOINDEX", "P1", path, "URL je v sitemapě, ale produkční meta robots obsahuje noindex.", parser.robots)
    if not parser.canonical:
        add(findings, "LIVE_MISSING_CANONICAL", "P1", path, "Produkční URL nemá canonical.")
    else:
        canonical_abs = urljoin(url, parser.canonical)
        if normalized_url(canonical_abs) != normalized_url(url):
            add(findings, "LIVE_CANONICAL_MISMATCH", "P1", path, "Produkční canonical neodpovídá URL ze sitemap.", canonical_abs)

    for idx, raw in enumerate(parser.jsonld, start=1):
        stats["jsonld_blocks"] += 1
        try:
            obj = json.loads(raw)
        except Exception as exc:
            add(findings, "LIVE_JSONLD_PARSE", "P1", path, f"JSON-LD blok #{idx} není validní JSON.", str(exc))
            continue
        for dataset in iter_dataset_objects(obj):
            stats["dataset_objects"] += 1
            name = str(dataset.get("name", "")).strip()
            desc = str(dataset.get("description", "")).strip()
            if not name:
                add(findings, "LIVE_SCHEMA_DATASET_NAME", "P1", path, "Dataset nemá name.")
            if not desc:
                add(findings, "LIVE_SCHEMA_DATASET_DESCRIPTION", "P1", path, "Dataset nemá description.")
            elif len(desc) < dataset_min:
                add(findings, "LIVE_SCHEMA_DATASET_DESCRIPTION", "P1", path, f"Dataset description je kratší než {dataset_min} znaků.", f"length={len(desc)}")
            elif len(desc) > dataset_max:
                add(findings, "LIVE_SCHEMA_DATASET_DESCRIPTION", "P1", path, f"Dataset description je delší než {dataset_max} znaků.", f"length={len(desc)}")

    for raw in parser.asset_refs + parser.og_images + parser.twitter_images:
        raw = raw.strip()
        if not raw or raw.startswith(("data:", "blob:", "javascript:", "mailto:", "tel:", "#")):
            continue
        absolute = urljoin(url, raw)
        if same_origin(absolute, site_origin):
            assets.add(absolute)
        elif absolute.lower().startswith("http://"):
            add(findings, "LIVE_MIXED_CONTENT", "P1", path, "Produkční HTTPS stránka odkazuje na HTTP asset.", absolute)

    return findings, stats, assets


def scan_asset(url: str, site_origin: str, timeout: float, retries: int, retry_delay: float) -> list[Finding]:
    findings: list[Finding] = []
    path = url_to_path(url, site_origin)
    result = fetch_with_retry(url, timeout, retries, retry_delay, ASSET_MAX_BYTES, method="HEAD")
    if result.status in {405, 501}:
        result = fetch_with_retry(url, timeout, retries, retry_delay, ASSET_MAX_BYTES, method="GET")
    if result.status is None:
        add(findings, "LIVE_ASSET_UNREACHABLE", "P1", path, "Asset načítaný produkční stránkou není dostupný.", result.error)
    elif 300 <= result.status < 400:
        add(findings, "LIVE_ASSET_REDIRECT", "P2", path, f"Asset vrací redirect HTTP {result.status}.", result.location)
    elif result.status != 200:
        add(findings, "LIVE_ASSET_STATUS", "P1", path, f"Asset načítaný produkční stránkou vrací HTTP {result.status}.")
    return findings


def run_live_audit(root: Path, config: dict[str, Any]) -> tuple[list[Finding], dict[str, Any]]:
    findings: list[Finding] = []
    stats: dict[str, Any] = {
        "live_sitemap_urls": 0,
        "repo_sitemap_urls": 0,
        "pages_checked": 0,
        "assets_checked": 0,
        "jsonld_blocks": 0,
        "dataset_objects": 0,
        "max_page_ms": 0,
    }

    site_origin = normalize_origin(str(config.get("site_origin", "https://rychlevypocty.cz")))
    live_cfg = config.get("live", {}) if isinstance(config.get("live", {}), dict) else {}
    timeout = float(live_cfg.get("timeout_seconds", 12))
    retries = int(live_cfg.get("retries", 2))
    retry_delay = float(live_cfg.get("retry_delay_seconds", 2))
    workers = max(1, min(int(live_cfg.get("workers", 12)), 32))
    min_urls = int(live_cfg.get("minimum_sitemap_urls", 100))
    check_assets = bool(live_cfg.get("check_assets", True))
    check_repo_parity = bool(live_cfg.get("check_repo_sitemap_parity", True))
    dataset_cfg = config.get("dataset", {}) if isinstance(config.get("dataset", {}), dict) else {}
    dataset_min = int(dataset_cfg.get("description_min", 50))
    dataset_max = int(dataset_cfg.get("description_max", 5000))

    live_sitemap_url = str(live_cfg.get("sitemap_url", f"{site_origin}/{config.get('sitemap', 'sitemap.xml')}")).strip()
    live_robots_url = str(live_cfg.get("robots_url", f"{site_origin}/{config.get('robots', 'robots.txt')}")).strip()

    # Robots
    robots = fetch_with_retry(live_robots_url, timeout, retries, retry_delay, 512_000)
    if robots.status is None:
        add(findings, "LIVE_ROBOTS_UNREACHABLE", "P1", "robots.txt", "Produkční robots.txt není dostupný.", robots.error)
    elif robots.status != 200:
        add(findings, "LIVE_ROBOTS_STATUS", "P1", "robots.txt", f"Produkční robots.txt vrací HTTP {robots.status}.")
    else:
        robots_text = decode_text(robots)
        if "sitemap:" not in robots_text.lower():
            add(findings, "LIVE_ROBOTS_SITEMAP_MISSING", "P2", "robots.txt", "Produkční robots.txt neobsahuje Sitemap directive.")

    # Sitemap
    sitemap = fetch_with_retry(live_sitemap_url, timeout, retries, retry_delay, 4_000_000)
    if sitemap.status is None:
        add(findings, "LIVE_SITEMAP_UNREACHABLE", "P0", "sitemap.xml", "Produkční sitemap.xml není dostupná.", sitemap.error)
        return findings, stats
    if sitemap.status != 200:
        add(findings, "LIVE_SITEMAP_STATUS", "P0", "sitemap.xml", f"Produkční sitemap.xml vrací HTTP {sitemap.status}.")
        return findings, stats
    try:
        live_urls = parse_sitemap(decode_text(sitemap))
    except Exception as exc:
        add(findings, "LIVE_SITEMAP_PARSE", "P0", "sitemap.xml", "Produkční sitemap.xml není validní XML sitemap.", str(exc))
        return findings, stats

    live_urls = list(dict.fromkeys(live_urls))
    stats["live_sitemap_urls"] = len(live_urls)
    if len(live_urls) < min_urls:
        add(findings, "LIVE_SITEMAP_TOO_SMALL", "P0", "sitemap.xml", f"Produkční sitemap obsahuje jen {len(live_urls)} URL; minimum je {min_urls}.")
    foreign = [u for u in live_urls if not same_origin(u, site_origin)]
    for url in foreign:
        add(findings, "LIVE_SITEMAP_FOREIGN_ORIGIN", "P1", "sitemap.xml", "Sitemap obsahuje URL mimo očekávaný origin.", url)
    scan_urls = [u for u in live_urls if same_origin(u, site_origin)]

    # Exact parity to repo sitemap (high-value post-deploy check)
    repo_sitemap_path = root / str(config.get("sitemap", "sitemap.xml"))
    try:
        repo_urls = list(dict.fromkeys(load_repo_sitemap(repo_sitemap_path)))
    except Exception as exc:
        repo_urls = []
        add(findings, "LIVE_REPO_SITEMAP_PARSE", "P1", str(repo_sitemap_path), "Repo sitemap nelze použít pro live parity check.", str(exc))
    stats["repo_sitemap_urls"] = len(repo_urls)
    if check_repo_parity and repo_urls:
        live_set = {normalized_url(u) for u in live_urls}
        repo_set = {normalized_url(u) for u in repo_urls}
        missing_live = sorted(repo_set - live_set)
        extra_live = sorted(live_set - repo_set)
        for url in missing_live[:50]:
            add(findings, "LIVE_SITEMAP_REPO_MISMATCH", "P1", "sitemap.xml", "URL z repo sitemap chybí v produkční sitemap.", url)
        for url in extra_live[:50]:
            add(findings, "LIVE_SITEMAP_REPO_MISMATCH", "P2", "sitemap.xml", "Produkční sitemap obsahuje URL, která není v repo sitemap.", url)
        if len(missing_live) > 50 or len(extra_live) > 50:
            add(findings, "LIVE_SITEMAP_REPO_MISMATCH", "P1", "sitemap.xml", "Rozdíl repo/live sitemap je větší než 50 položek.", f"missing={len(missing_live)} extra={len(extra_live)}")

    # Pages concurrently
    all_assets: set[str] = set()
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(scan_page, url, site_origin, timeout, retries, retry_delay, dataset_min, dataset_max): url
            for url in scan_urls
        }
        for future in as_completed(futures):
            url = futures[future]
            try:
                page_findings, page_stats, assets = future.result()
            except Exception as exc:
                add(findings, "LIVE_PAGE_WORKER_ERROR", "P1", url_to_path(url, site_origin), "Interní chyba live page workeru.", str(exc))
                continue
            findings.extend(page_findings)
            all_assets.update(assets)
            stats["pages_checked"] += 1
            stats["jsonld_blocks"] += int(page_stats.get("jsonld_blocks", 0))
            stats["dataset_objects"] += int(page_stats.get("dataset_objects", 0))
            stats["max_page_ms"] = max(stats["max_page_ms"], int(page_stats.get("elapsed_ms", 0)))

    # Same-origin critical assets
    if check_assets and all_assets:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(scan_asset, url, site_origin, timeout, retries, retry_delay): url for url in sorted(all_assets)}
            for future in as_completed(futures):
                url = futures[future]
                try:
                    findings.extend(future.result())
                except Exception as exc:
                    add(findings, "LIVE_ASSET_WORKER_ERROR", "P1", url_to_path(url, site_origin), "Interní chyba live asset workeru.", str(exc))
                stats["assets_checked"] += 1

    return findings, stats


def summarize(findings: list[Finding], stats: dict[str, Any], blocking: set[str]) -> dict[str, Any]:
    active = [f for f in findings if not f.exempted]
    exempted = [f for f in findings if f.exempted]
    counts = Counter(f.severity for f in active)
    blocked = any(f.severity in blocking for f in active)
    return {
        "version": VERSION,
        "status": "FAIL" if blocked else "PASS",
        "counts": {s: counts.get(s, 0) for s in ["P0", "P1", "P2", "P3", "INFO"]},
        "exempted_count": len(exempted),
        "stats": stats,
        "generated_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
    }


def print_report(summary: dict[str, Any], findings: list[Finding]) -> None:
    print(f"RV LIVE HEALTH v{summary['version']}")
    print("=" * 78)
    st = summary["stats"]
    print(
        "SCAN: "
        f"liveSitemap={st.get('live_sitemap_urls', 0)} "
        f"repoSitemap={st.get('repo_sitemap_urls', 0)} "
        f"pages={st.get('pages_checked', 0)} "
        f"assets={st.get('assets_checked', 0)} "
        f"JSON-LD={st.get('jsonld_blocks', 0)} "
        f"Dataset={st.get('dataset_objects', 0)} "
        f"maxPage={st.get('max_page_ms', 0)}ms"
    )
    c = summary["counts"]
    print(f"FINDINGS: P0={c['P0']} P1={c['P1']} P2={c['P2']} P3={c['P3']} INFO={c['INFO']} | exempted={summary['exempted_count']}")
    print(f"LIVE GATE: {summary['status']}")
    active = sorted((f for f in findings if not f.exempted), key=lambda x: (SEVERITY_ORDER.get(x.severity, 9), x.path, x.check))
    if active:
        print("\nACTIVE FINDINGS")
        print("-" * 78)
        for f in active:
            suffix = f" :: {f.detail}" if f.detail else ""
            print(f"[{f.severity}] {f.check} :: {f.path} :: {f.message}{suffix}")
    exempted = [f for f in findings if f.exempted]
    if exempted:
        print("\nEXEMPTED FINDINGS")
        print("-" * 78)
        for f in exempted:
            print(f"[{f.severity}] {f.check} :: {f.path} :: {f.message} :: reason={f.exception_reason}")


def main() -> int:
    ap = argparse.ArgumentParser(description="RychléVýpočty.cz live production health monitor")
    ap.add_argument("--root", default=".", help="Repository root (default: .)")
    ap.add_argument("--config", default="audits/audit-config.json", help="Audit config path")
    ap.add_argument("--json-out", default="", help="Optional JSON report path")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    config_path = (root / args.config).resolve() if not Path(args.config).is_absolute() else Path(args.config)
    try:
        config = load_json(config_path)
    except Exception as exc:
        print(f"CONFIG ERROR: {exc}", file=sys.stderr)
        return 2

    findings, stats = run_live_audit(root, config)
    exceptions = validate_exceptions(config, findings)
    apply_exceptions(findings, exceptions)
    release_cfg = config.get("release", {}) if isinstance(config.get("release", {}), dict) else {}
    blocking = set(release_cfg.get("blocking_severities", ["P0", "P1"]))
    summary = summarize(findings, stats, blocking)
    print_report(summary, findings)

    if args.json_out:
        out = Path(args.json_out)
        if not out.is_absolute():
            out = root / out
        out.write_text(json.dumps({"summary": summary, "findings": [asdict(f) for f in findings]}, ensure_ascii=False, indent=2), "utf-8")
        print(f"\nJSON report: {out}")

    return 1 if summary["status"] == "FAIL" else 0


if __name__ == "__main__":
    raise SystemExit(main())
