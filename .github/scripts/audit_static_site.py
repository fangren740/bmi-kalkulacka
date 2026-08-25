#!/usr/bin/env python3
"""RychléVýpočty.cz deterministic static audit.

V1 checks repository integrity, SEO/indexability, JSON-LD Dataset and
SoftwareApplication rules, local links/assets and optional JavaScript syntax via Node.js.

The script never modifies the audited project.
"""
from __future__ import annotations

import argparse
import datetime as dt
import fnmatch
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import unquote, urljoin, urlparse

VERSION = "1.1.1"
SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2, "P3": 3, "INFO": 4}
BLOCKING_DEFAULT = {"P0", "P1"}
SKIP_SCHEMES = {"mailto", "tel", "data", "javascript", "blob", "about"}
ASSET_ATTRS = {"href", "src", "poster"}


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
class PageInfo:
    path: Path
    rel: str
    title: str
    h1_count: int
    robots: str
    canonical: str
    viewport: str
    lang: str
    ids: list[str]
    refs: list[tuple[str, str, str]]  # tag, attr, value
    srcsets: list[str]
    og_images: list[str]
    twitter_images: list[str]
    jsonld: list[str]
    inline_js: list[str]

    @property
    def noindex(self) -> bool:
        return "noindex" in self.robots.lower()

    @property
    def indexable(self) -> bool:
        return not self.noindex


class RVHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.h1_count = 0
        self.robots = ""
        self.canonical = ""
        self.viewport = ""
        self.lang = ""
        self.ids: list[str] = []
        self.refs: list[tuple[str, str, str]] = []
        self.srcsets: list[str] = []
        self.og_images: list[str] = []
        self.twitter_images: list[str] = []
        self.jsonld: list[str] = []
        self.inline_js: list[str] = []
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
        if tag == "html":
            self.lang = a.get("lang", "").strip()
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1_count += 1
        if "id" in a and a["id"].strip():
            self.ids.append(a["id"].strip())
        if tag == "meta":
            name = a.get("name", "").lower().strip()
            prop = a.get("property", "").lower().strip()
            content = a.get("content", "").strip()
            if name == "robots":
                self.robots = content
            elif name == "viewport":
                self.viewport = content
            elif prop == "og:image":
                self.og_images.append(content)
            elif name == "twitter:image":
                self.twitter_images.append(content)
        if tag == "link":
            rel_tokens = {x.lower() for x in a.get("rel", "").split()}
            if "canonical" in rel_tokens:
                self.canonical = a.get("href", "").strip()
        for attr in ASSET_ATTRS:
            value = a.get(attr, "").strip()
            if value:
                self.refs.append((tag, attr, value))
        if "srcset" in a and a["srcset"].strip():
            self.srcsets.append(a["srcset"].strip())
        if tag == "script":
            self._script_type = a.get("type", "").lower().strip()
            self._script_has_src = bool(a.get("src", "").strip())
            self._script_parts = [] if not self._script_has_src else None

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._script_parts is not None:
            body = "".join(self._script_parts).strip()
            if body:
                if self._script_type == "application/ld+json":
                    self.jsonld.append(body)
                elif self._script_type in {"", "text/javascript", "application/javascript", "module"}:
                    self.inline_js.append(body)
            self._script_parts = None
            self._script_type = ""
            self._script_has_src = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)
        if self._script_parts is not None:
            self._script_parts.append(data)


def parse_schema_date(value: Any) -> dt.date | None:
    """Parse an ISO/W3C-style date or datetime into a calendar date."""
    if not isinstance(value, str):
        return None
    raw = value.strip()
    if not raw:
        return None
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
            return dt.date.fromisoformat(raw)
        return dt.datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def explicit_page_date_modified(page: PageInfo) -> dt.date | None:
    """Return dateModified explicitly attached to the current canonical page entity.

    Only top-level JSON-LD entities and @graph members are considered. Nested
    datasets/items must not advance a parent page's sitemap timestamp.
    """
    canonical = page.canonical.split("#", 1)[0].rstrip("/")
    if not canonical:
        return None
    found: list[dt.date] = []
    for block in page.jsonld:
        try:
            data = json.loads(block)
        except Exception:
            continue
        roots = data if isinstance(data, list) else [data]
        nodes: list[dict[str, Any]] = []
        for root_obj in roots:
            if not isinstance(root_obj, dict):
                continue
            nodes.append(root_obj)
            graph = root_obj.get("@graph")
            if isinstance(graph, list):
                nodes.extend(x for x in graph if isinstance(x, dict))
        for node in nodes:
            raw_modified = node.get("dateModified")
            modified = parse_schema_date(raw_modified)
            if modified is None:
                continue
            raw_url = node.get("url")
            raw_id = node.get("@id")
            entity_url = raw_url if isinstance(raw_url, str) else raw_id if isinstance(raw_id, str) else ""
            if entity_url.split("#", 1)[0].rstrip("/") != canonical:
                continue
            found.append(modified)
    return max(found) if found else None


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


def is_excluded(rel: str, config: dict[str, Any]) -> bool:
    rel_posix = rel.replace(os.sep, "/")
    scan = config.get("scan", {})
    parts = Path(rel_posix).parts
    exclude_dirs = set(scan.get("exclude_dirs", []))
    if any(p in exclude_dirs for p in parts[:-1]):
        return True
    for pattern in scan.get("exclude_files", []):
        if fnmatch.fnmatch(rel_posix, pattern):
            return True
    return False


def parse_html_page(path: Path, root: Path) -> tuple[PageInfo | None, str | None]:
    rel = path.relative_to(root).as_posix()
    try:
        text = path.read_text("utf-8")
    except UnicodeDecodeError:
        text = path.read_text("utf-8", errors="replace")
    except Exception as exc:
        return None, str(exc)
    parser = RVHTMLParser()
    try:
        parser.feed(text)
        parser.close()
    except Exception as exc:
        return None, str(exc)
    title = html.unescape(" ".join("".join(parser.title_parts).split()))
    return PageInfo(
        path=path,
        rel=rel,
        title=title,
        h1_count=parser.h1_count,
        robots=parser.robots,
        canonical=parser.canonical,
        viewport=parser.viewport,
        lang=parser.lang,
        ids=parser.ids,
        refs=parser.refs,
        srcsets=parser.srcsets,
        og_images=parser.og_images,
        twitter_images=parser.twitter_images,
        jsonld=parser.jsonld,
        inline_js=parser.inline_js,
    ), None


def local_target(raw: str, source_rel: str, root: Path, site_origin: str) -> Path | None:
    raw = html.unescape(raw.strip().strip('"\''))
    if not raw or raw.startswith("#"):
        return None
    parsed = urlparse(raw)
    if parsed.scheme.lower() in SKIP_SCHEMES:
        return None
    origin = urlparse(site_origin)
    if parsed.scheme in {"http", "https"}:
        if parsed.netloc.lower() != origin.netloc.lower():
            return None
        target_path = unquote(parsed.path)
    elif parsed.scheme:
        return None
    elif raw.startswith("//"):
        if parsed.netloc.lower() != origin.netloc.lower():
            return None
        target_path = unquote(parsed.path)
    else:
        target_path = unquote(parsed.path)

    if not target_path:
        return None
    if target_path == "/":
        rel = "index.html"
    elif target_path.startswith("/"):
        rel = target_path.lstrip("/")
        if target_path.endswith("/"):
            rel = f"{rel.rstrip('/')}/index.html"
    else:
        rel = (Path(source_rel).parent / target_path).as_posix()
        if target_path.endswith("/"):
            rel = f"{rel.rstrip('/')}/index.html"
    rel = os.path.normpath(rel).replace("\\", "/")
    if rel in {"", "."}:
        rel = "index.html"
    candidate = (root / rel).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return Path("/__outside_repo__")
    return candidate


def sitemap_path_to_file(url: str, root: Path, site_origin: str) -> Path | None:
    p = urlparse(url)
    origin = urlparse(site_origin)
    if p.scheme not in {"http", "https"} or p.netloc.lower() != origin.netloc.lower():
        return None
    path = unquote(p.path)
    if path in {"", "/"}:
        rel = "index.html"
    elif path.endswith("/"):
        rel = path.lstrip("/") + "index.html"
    else:
        rel = path.lstrip("/")
    return root / rel


def schema_types(value: dict[str, Any]) -> list[str]:
    typ = value.get("@type")
    if isinstance(typ, str):
        return [typ]
    if isinstance(typ, list):
        return [x for x in typ if isinstance(x, str)]
    return []


def iter_typed_objects(value: Any, type_name: str) -> Iterable[dict[str, Any]]:
    wanted = type_name.lower()
    if isinstance(value, dict):
        if any(t.lower() == wanted for t in schema_types(value)):
            yield value
        for child in value.values():
            yield from iter_typed_objects(child, type_name)
    elif isinstance(value, list):
        for child in value:
            yield from iter_typed_objects(child, type_name)


def iter_dataset_objects(value: Any) -> Iterable[dict[str, Any]]:
    yield from iter_typed_objects(value, "Dataset")


def parse_srcset(value: str) -> list[str]:
    urls = []
    for item in value.split(","):
        token = item.strip().split()[0] if item.strip() else ""
        if token:
            urls.append(token)
    return urls


def css_urls(text: str) -> list[str]:
    # Sufficient for static local asset references; data URLs are filtered later.
    return [m.group(2).strip() for m in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", text, re.I | re.S)]


def js_batch_syntax_check(node: str, entries: list[dict[str, str]]) -> tuple[dict[str, str], str]:
    """Parse classic JavaScript entries in one Node process using vm.Script."""
    helper = r"""
const fs = require('fs');
const vm = require('vm');
const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const errors = [];
for (const entry of manifest) {
  let code = entry.code;
  if (entry.file) code = fs.readFileSync(entry.file, 'utf8');
  try {
    new vm.Script(code, { filename: entry.label, displayErrors: true });
  } catch (err) {
    errors.push({ label: entry.label, error: String(err && err.stack ? err.stack : err) });
  }
}
process.stdout.write(JSON.stringify(errors));
"""
    manifest_path = helper_path = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as mf:
            json.dump(entries, mf, ensure_ascii=False)
            manifest_path = mf.name
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".js", delete=False) as hf:
            hf.write(helper)
            helper_path = hf.name
        proc = subprocess.run([node, helper_path, manifest_path], text=True, capture_output=True, timeout=60)
        if proc.returncode != 0:
            return {}, (proc.stderr or proc.stdout or "Node batch parser failed").strip()[:4000]
        raw = json.loads(proc.stdout or "[]")
        errors = {str(x.get("label", "unknown")): str(x.get("error", "syntax error"))[:2500] for x in raw}
        return errors, ""
    except Exception as exc:
        return {}, str(exc)
    finally:
        for tmp in (manifest_path, helper_path):
            if tmp:
                try:
                    os.unlink(tmp)
                except OSError:
                    pass

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


def run_audit(root: Path, config: dict[str, Any], check_js: bool) -> tuple[list[Finding], dict[str, Any]]:
    findings: list[Finding] = []
    stats: dict[str, Any] = defaultdict(int)
    site_origin = normalize_origin(str(config.get("site_origin", "https://rychlevypocty.cz")))

    # Required control files
    sitemap_rel = str(config.get("sitemap", "sitemap.xml"))
    robots_rel = str(config.get("robots", "robots.txt"))
    sitemap_file = root / sitemap_rel
    robots_file = root / robots_rel
    if not sitemap_file.exists():
        add(findings, "REPO_MISSING_SITEMAP", "P1", sitemap_rel, "Chybí sitemap.xml definovaná v konfiguraci.")
    if not robots_file.exists():
        add(findings, "REPO_MISSING_ROBOTS", "P1", robots_rel, "Chybí robots.txt definovaný v konfiguraci.")

    # HTML parsing
    pages: dict[str, PageInfo] = {}
    html_files = sorted(p for p in root.rglob("*.html") if not is_excluded(p.relative_to(root).as_posix(), config))
    stats["html_files"] = len(html_files)
    for path in html_files:
        page, err = parse_html_page(path, root)
        rel = path.relative_to(root).as_posix()
        if err or page is None:
            add(findings, "REPO_HTML_PARSE", "P1", rel, "HTML nelze spolehlivě načíst/parsovat.", err or "")
            continue
        pages[rel] = page
        if page.indexable:
            stats["indexable_html"] += 1
            if not page.title:
                add(findings, "REPO_MISSING_TITLE", "P1", rel, "Indexovatelná stránka nemá neprázdný <title>.")
            if page.h1_count == 0:
                add(findings, "SEO_MISSING_H1", "P2", rel, "Indexovatelná stránka nemá H1.")
            elif page.h1_count > 1:
                add(findings, "SEO_MULTIPLE_H1", "P3", rel, f"Indexovatelná stránka má {page.h1_count} H1.")
            if not page.viewport:
                add(findings, "REPO_MISSING_VIEWPORT", "P2", rel, "Indexovatelná stránka nemá meta viewport.")
            if not page.lang:
                add(findings, "REPO_MISSING_LANG", "P3", rel, "HTML element nemá lang.")
            if not page.canonical:
                add(findings, "SEO_MISSING_CANONICAL", "P1", rel, "Indexovatelná stránka nemá canonical URL.")
            elif not page.canonical.startswith(site_origin + "/") and page.canonical != site_origin:
                add(findings, "SEO_CANONICAL_ORIGIN", "P1", rel, f"Canonical není na očekávaném originu {site_origin}.", page.canonical)
        dup_ids = [i for i, n in Counter(page.ids).items() if n > 1]
        if dup_ids:
            add(findings, "REPO_DUPLICATE_ID", "P2", rel, f"Duplicitní HTML id: {', '.join(dup_ids[:12])}" + (" …" if len(dup_ids) > 12 else ""))

    # Canonical duplicates among indexable pages
    canon_map: dict[str, list[str]] = defaultdict(list)
    for page in pages.values():
        if page.indexable and page.canonical:
            canon_map[page.canonical].append(page.rel)
    for canon, rels in canon_map.items():
        if len(rels) > 1:
            add(findings, "SEO_DUPLICATE_CANONICAL", "P1", rels[0], f"Více indexovatelných HTML sdílí canonical {canon}: {', '.join(rels)}")

    # Sitemap
    sitemap_urls: list[str] = []
    sitemap_lastmods: dict[str, str] = {}
    if sitemap_file.exists():
        try:
            tree = ET.parse(sitemap_file)
            ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            url_nodes = tree.getroot().findall("sm:url", ns)
            namespaced = True
            if not url_nodes:  # tolerate sitemap without namespace
                url_nodes = tree.getroot().findall("url")
                namespaced = False
            for url_node in url_nodes:
                loc_node = url_node.find("sm:loc", ns) if namespaced else url_node.find("loc")
                if loc_node is None or not (loc_node.text or "").strip():
                    continue
                loc = (loc_node.text or "").strip()
                sitemap_urls.append(loc)
                lastmod_node = url_node.find("sm:lastmod", ns) if namespaced else url_node.find("lastmod")
                if lastmod_node is not None and (lastmod_node.text or "").strip():
                    sitemap_lastmods[loc] = (lastmod_node.text or "").strip()
            stats["sitemap_urls"] = len(sitemap_urls)
        except Exception as exc:
            add(findings, "SEO_INVALID_SITEMAP", "P0", sitemap_rel, "Sitemap není validní XML.", str(exc))
    for url, count in Counter(sitemap_urls).items():
        if count > 1:
            add(findings, "SEO_DUPLICATE_SITEMAP_LOC", "P1", sitemap_rel, f"Duplicitní sitemap <loc>: {url}")
    sitemap_set = set(sitemap_urls)

    # Sitemap URL -> local page and noindex
    page_by_abs_path = {p.path.resolve(): p for p in pages.values()}
    for url in sitemap_urls:
        target = sitemap_path_to_file(url, root, site_origin)
        if target is None:
            add(findings, "SEO_SITEMAP_FOREIGN_ORIGIN", "P1", sitemap_rel, "Sitemap obsahuje URL mimo site origin.", url)
            continue
        if not target.exists():
            add(findings, "SEO_SITEMAP_TARGET_MISSING", "P1", sitemap_rel, "Sitemap URL nemá odpovídající lokální soubor.", url)
            continue
        page = page_by_abs_path.get(target.resolve())
        if page and page.noindex:
            add(findings, "SEO_NOINDEX_IN_SITEMAP", "P1", page.rel, "Noindex stránka je uvedená v sitemapě.", url)

        raw_lastmod = sitemap_lastmods.get(url, "")
        sitemap_date = parse_schema_date(raw_lastmod) if raw_lastmod else None
        if raw_lastmod and sitemap_date is None:
            add(findings, "SEO_SITEMAP_LASTMOD_FORMAT", "P2", sitemap_rel, "Sitemap obsahuje neplatný <lastmod>.", f"{url} -> {raw_lastmod}")
        elif sitemap_date and sitemap_date > dt.date.today():
            add(findings, "SEO_SITEMAP_LASTMOD_FUTURE", "P2", sitemap_rel, "Sitemap obsahuje <lastmod> v budoucnosti.", f"{url} -> {raw_lastmod}")

        if page and sitemap_date:
            page_modified = explicit_page_date_modified(page)
            if page_modified and sitemap_date < page_modified:
                add(
                    findings,
                    "SEO_SITEMAP_LASTMOD_BEHIND_PAGE",
                    "P2",
                    page.rel,
                    "Sitemap <lastmod> je starší než explicitní dateModified stejné stránky.",
                    f"sitemap={sitemap_date.isoformat()} page={page_modified.isoformat()}",
                )

    for page in pages.values():
        if page.indexable and page.canonical and page.canonical not in sitemap_set:
            add(findings, "SEO_INDEXABLE_NOT_IN_SITEMAP", "P1", page.rel, "Canonical indexovatelné stránky není v sitemapě.", page.canonical)

    # robots sitemap declaration
    if robots_file.exists():
        try:
            robots_text = robots_file.read_text("utf-8", errors="replace")
            expected = f"Sitemap: {site_origin}/{sitemap_rel.lstrip('/')}"
            if expected.lower() not in robots_text.lower():
                add(findings, "SEO_ROBOTS_SITEMAP", "P2", robots_rel, "robots.txt neobsahuje očekávanou Sitemap deklaraci.", expected)
        except Exception as exc:
            add(findings, "REPO_ROBOTS_READ", "P1", robots_rel, "robots.txt nelze načíst.", str(exc))

    # JSON-LD
    ds_min = int(config.get("dataset", {}).get("description_min", 50))
    ds_max = int(config.get("dataset", {}).get("description_max", 5000))
    for page in pages.values():
        for idx, block in enumerate(page.jsonld, start=1):
            stats["jsonld_blocks"] += 1
            try:
                obj = json.loads(block)
            except Exception as exc:
                add(findings, "SCHEMA_INVALID_JSONLD", "P1", page.rel, f"JSON-LD blok #{idx} není validní JSON.", str(exc))
                continue
            for ds in iter_dataset_objects(obj):
                stats["dataset_objects"] += 1
                name = ds.get("name")
                desc = ds.get("description")
                if not isinstance(name, str) or not name.strip():
                    add(findings, "SCHEMA_DATASET_NAME", "P1", page.rel, "Dataset nemá neprázdné name.")
                if not isinstance(desc, str) or not desc.strip():
                    add(findings, "SCHEMA_DATASET_DESCRIPTION", "P1", page.rel, "Dataset nemá description.")
                else:
                    length = len(desc.strip())
                    if length < ds_min or length > ds_max:
                        add(findings, "SCHEMA_DATASET_DESCRIPTION_LENGTH", "P1", page.rel, f"Dataset description má {length} znaků; povolený rozsah je {ds_min}–{ds_max}.")
                if "contentUrl" in ds:
                    add(
                        findings,
                        "SCHEMA_DATASET_CONTENTURL_PLACEMENT",
                        "P1",
                        page.rel,
                        "Dataset nesmí mít contentUrl přímo; download patří do distribution typu DataDownload.",
                    )
                distribution = ds.get("distribution")
                if distribution is not None:
                    distributions = distribution if isinstance(distribution, list) else [distribution]
                    for item in distributions:
                        if not isinstance(item, dict) or not any(t.lower() == "datadownload" for t in schema_types(item)):
                            add(findings, "SCHEMA_DATASET_DISTRIBUTION_TYPE", "P1", page.rel, "Dataset distribution musí být DataDownload.")
                            continue
                        content_url = item.get("contentUrl")
                        if not isinstance(content_url, str) or not content_url.strip():
                            add(findings, "SCHEMA_DATADOWNLOAD_CONTENTURL", "P1", page.rel, "DataDownload nemá neprázdné contentUrl.")

            for app in iter_typed_objects(obj, "SoftwareApplication"):
                stats["software_application_objects"] += 1
                name = app.get("name")
                if not isinstance(name, str) or not name.strip():
                    add(findings, "SCHEMA_SOFTWARE_APP_NAME", "P1", page.rel, "SoftwareApplication nemá neprázdné name.")
                offers = app.get("offers")
                offer_items = offers if isinstance(offers, list) else [offers] if offers is not None else []
                has_price = any(isinstance(offer, dict) and offer.get("price") not in (None, "") for offer in offer_items)
                if not has_price:
                    add(findings, "SCHEMA_SOFTWARE_APP_PRICE", "P1", page.rel, "SoftwareApplication nemá offers.price požadované Google Software App rich result.")
                if app.get("aggregateRating") is None and app.get("review") is None:
                    add(findings, "SCHEMA_SOFTWARE_APP_RATING_OR_REVIEW", "P1", page.rel, "SoftwareApplication nemá legitimní aggregateRating ani review požadované Google Software App rich result.")

    # Local refs and internal noindex hops
    noindex_abs = {p.path.resolve(): p for p in pages.values() if p.noindex}
    for page in pages.values():
        refs = list(page.refs)
        for srcset in page.srcsets:
            refs.extend(("srcset", "srcset", x) for x in parse_srcset(srcset))
        refs.extend(("meta", "og:image", x) for x in page.og_images)
        refs.extend(("meta", "twitter:image", x) for x in page.twitter_images)
        seen = set()
        for tag, attr, raw in refs:
            key = (tag, attr, raw)
            if key in seen:
                continue
            seen.add(key)
            if site_origin.startswith("https://") and raw.strip().lower().startswith("http://"):
                add(findings, "ASSET_MIXED_CONTENT", "P2", page.rel, f"HTTP reference na HTTPS webu: {raw}")
            target = local_target(raw, page.rel, root, site_origin)
            if target is None:
                continue
            if str(target) == "/__outside_repo__":
                add(findings, "ASSET_PATH_ESCAPE", "P1", page.rel, f"Reference míří mimo repo: {raw}")
                continue
            # Ignore same-page URL represented without an explicit file only when it resolves as directory.
            if not target.exists():
                severity = "P1" if (tag in {"script", "link"} and attr in {"src", "href"}) else "P2"
                if attr in {"og:image", "twitter:image"}:
                    severity = "P2"
                add(findings, "ASSET_LOCAL_MISSING", severity, page.rel, f"Lokální reference neexistuje: {raw}", target.relative_to(root).as_posix() if root.resolve() in target.parents else str(target))
                continue
            if page.indexable and attr == "href" and target.resolve() in noindex_abs:
                dest = noindex_abs[target.resolve()]
                add(findings, "SEO_LINK_TO_NOINDEX", "P2", page.rel, f"Indexovatelná stránka odkazuje na noindex HTML: {raw}", dest.rel)

    # CSS url(...) assets
    css_files = sorted(p for p in root.rglob("*.css") if not is_excluded(p.relative_to(root).as_posix(), config))
    stats["css_files"] = len(css_files)
    for css in css_files:
        rel = css.relative_to(root).as_posix()
        try:
            text = css.read_text("utf-8", errors="replace")
        except Exception as exc:
            add(findings, "REPO_CSS_READ", "P1", rel, "CSS nelze načíst.", str(exc))
            continue
        for raw in css_urls(text):
            if site_origin.startswith("https://") and raw.strip().lower().startswith("http://"):
                add(findings, "ASSET_MIXED_CONTENT", "P2", rel, f"HTTP reference na HTTPS webu: {raw}")
            target = local_target(raw, rel, root, site_origin)
            if target is None:
                continue
            if str(target) == "/__outside_repo__":
                add(findings, "ASSET_PATH_ESCAPE", "P1", rel, f"CSS reference míří mimo repo: {raw}")
            elif not target.exists():
                add(findings, "ASSET_LOCAL_MISSING", "P2", rel, f"CSS url(...) reference neexistuje: {raw}")

    # JavaScript syntax via one Node batch process
    js_files = sorted(p for p in root.rglob("*.js") if not is_excluded(p.relative_to(root).as_posix(), config))
    stats["js_files"] = len(js_files)
    if check_js:
        node = shutil.which("node")
        if not node:
            add(findings, "JS_NODE_UNAVAILABLE", "INFO", ".", "Node.js není dostupný; JS syntax gate nebyl spuštěn.")
            stats["js_syntax_status"] = "NOT RUN"
        else:
            entries: list[dict[str, str]] = []
            for js in js_files:
                rel = js.relative_to(root).as_posix()
                entries.append({"label": rel, "file": str(js.resolve())})
            inline_count = 0
            for page in pages.values():
                for i, code in enumerate(page.inline_js, start=1):
                    inline_count += 1
                    entries.append({"label": f"{page.rel}#inline-{i}", "code": code})
            stats["inline_js_blocks"] = inline_count
            errors, batch_error = js_batch_syntax_check(node, entries)
            if batch_error:
                add(findings, "JS_BATCH_CHECK_FAILED", "P1", ".", "JS syntax gate se nepodařilo spustit.", batch_error)
                stats["js_syntax_status"] = "FAIL"
            elif errors:
                stats["js_syntax_status"] = "FAIL"
                for label, detail in errors.items():
                    if "#inline-" in label:
                        path = label.split("#inline-", 1)[0]
                        add(findings, "JS_INLINE_SYNTAX", "P1", path, f"Inline JavaScript má syntax error ({label}).", detail)
                    else:
                        add(findings, "JS_SYNTAX", "P1", label, "JavaScript syntax check selhal.", detail)
            else:
                stats["js_syntax_status"] = "PASS"
    else:
        stats["js_syntax_status"] = "NOT RUN"

    return findings, dict(stats)


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
    }


def print_report(summary: dict[str, Any], findings: list[Finding]) -> None:
    print(f"RV STATIC AUDIT v{summary['version']}")
    print("=" * 72)
    st = summary["stats"]
    print(
        "SCAN: "
        f"HTML={st.get('html_files', 0)} "
        f"indexable={st.get('indexable_html', 0)} "
        f"CSS={st.get('css_files', 0)} "
        f"JS={st.get('js_files', 0)} "
        f"JSON-LD={st.get('jsonld_blocks', 0)} "
        f"Dataset={st.get('dataset_objects', 0)} "
        f"SoftwareApp={st.get('software_application_objects', 0)} "
        f"SitemapURL={st.get('sitemap_urls', 0)}"
    )
    print(f"JS SYNTAX: {st.get('js_syntax_status', 'NOT RUN')}")
    c = summary["counts"]
    print(f"FINDINGS: P0={c['P0']} P1={c['P1']} P2={c['P2']} P3={c['P3']} INFO={c['INFO']} | exempted={summary['exempted_count']}")
    print(f"STATIC GATE: {summary['status']}")
    active = sorted((f for f in findings if not f.exempted), key=lambda x: (SEVERITY_ORDER.get(x.severity, 9), x.path, x.check))
    if active:
        print("\nACTIVE FINDINGS")
        print("-" * 72)
        for f in active:
            print(f"[{f.severity}] {f.check} :: {f.path} :: {f.message}")
            if f.detail:
                print(f"    {f.detail}")
    exempted = [f for f in findings if f.exempted]
    if exempted:
        print("\nEXEMPTED FINDINGS")
        print("-" * 72)
        for f in exempted:
            print(f"[{f.severity}] {f.check} :: {f.path} :: {f.message}")
            print(f"    exception: {f.exception_reason}")


def main() -> int:
    ap = argparse.ArgumentParser(description="RychléVýpočty.cz deterministic static audit")
    ap.add_argument("--root", default=".", help="Kořen projektu")
    ap.add_argument("--config", default="audits/audit-config.json", help="Config relativně k rootu nebo absolutní cesta")
    ap.add_argument("--check-js", action="store_true", help="Spustit node --check nad externím a inline JS")
    ap.add_argument("--json-out", help="Volitelný JSON report")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    config_path = Path(args.config)
    if not config_path.is_absolute():
        config_path = root / config_path

    bootstrap_findings: list[Finding] = []
    try:
        config = load_json(config_path)
    except Exception as exc:
        print(f"[P0] CONFIG_INVALID :: {config_path} :: {exc}", file=sys.stderr)
        return 2

    exceptions = validate_exceptions(config, bootstrap_findings)
    findings, stats = run_audit(root, config, args.check_js)
    findings = bootstrap_findings + findings
    apply_exceptions(findings, exceptions)
    blocking = set(config.get("release", {}).get("blocking_severities", list(BLOCKING_DEFAULT)))
    summary = summarize(findings, stats, blocking)
    print_report(summary, findings)

    if args.json_out:
        out = Path(args.json_out)
        if not out.is_absolute():
            out = root / out
        payload = {
            "summary": summary,
            "findings": [asdict(f) for f in findings],
        }
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", "utf-8")
        print(f"\nJSON report: {out}")

    return 1 if summary["status"] == "FAIL" else 0


if __name__ == "__main__":
    raise SystemExit(main())
