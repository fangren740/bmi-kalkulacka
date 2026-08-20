#!/usr/bin/env python3
"""RychléVýpočty.cz V-next structural accessibility regression lint.

Usage:
  python rv-vnext-a11y-lint.py page1.html page2.html
  python rv-vnext-a11y-lint.py --all-vnext

This is intentionally dependency-free and checks structural mistakes that have
already escaped into production, including missing form labels. It complements, but never replaces, browser
and post-deploy Lighthouse/PageSpeed accessibility QA.
"""
from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable


@dataclass
class Node:
    tag: str
    attrs: dict[str, str]
    parent: "Node | None" = None
    children: list["Node"] = field(default_factory=list)

    def descendants(self) -> Iterable["Node"]:
        for child in self.children:
            yield child
            yield from child.descendants()


VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


class TreeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("#document", {})
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag, {k: (v if v is not None else "") for k, v in attrs}, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if self.stack[-1].tag == tag:
            self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return


def walk(root: Node) -> Iterable[Node]:
    yield from root.descendants()


def cls(node: Node) -> str:
    return node.attrs.get("class", "")


def ident(node: Node) -> str:
    bits = [node.tag]
    if node.attrs.get("id"):
        bits.append(f"#{node.attrs['id']}")
    if cls(node):
        bits.append("." + ".".join(cls(node).split()[:3]))
    return "".join(bits)


def has_native_radio(node: Node) -> bool:
    for d in node.descendants():
        if d.tag == "input" and d.attrs.get("type", "").lower() == "radio":
            return True
    return False


def lint_file(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8", errors="replace")
    parser = TreeParser()
    parser.feed(text)
    nodes = list(walk(parser.root))
    errors: list[str] = []

    # Duplicate IDs.
    ids: dict[str, list[Node]] = {}
    for n in nodes:
        if n.attrs.get("id"):
            ids.setdefault(n.attrs["id"], []).append(n)
    for value, group in ids.items():
        if len(group) > 1:
            errors.append(f"duplicate id={value!r} ({len(group)}×)")

    by_id = {n.attrs["id"]: n for n in nodes if n.attrs.get("id")}

    # Every user-editable form control needs a programmatic name. Visual sibling text or placeholder alone is not enough.
    for n in nodes:
        if n.tag not in {"input", "select", "textarea"}:
            continue
        input_type = n.attrs.get("type", "").lower() if n.tag == "input" else ""
        if input_type in {"hidden", "button", "submit", "reset", "image"}:
            continue
        if not has_programmatic_label(n, nodes, by_id):
            errors.append(f"{ident(n)} form control has no programmatic label")

    # Known bad pattern: generic element with aria-label but no semantic role.
    for n in nodes:
        if n.tag in {"div", "span"} and "aria-label" in n.attrs and not n.attrs.get("role"):
            errors.append(f"{ident(n)} has aria-label without a supported semantic role")

    # aria-selected is not valid as a generic toggle state on plain buttons.
    for n in nodes:
        if "aria-selected" in n.attrs and n.attrs.get("role") not in {"tab", "option", "row", "gridcell", "treeitem"}:
            errors.append(f"{ident(n)} uses aria-selected with role={n.attrs.get('role')!r}")

    # Full tab contract.
    for tablist in [n for n in nodes if n.attrs.get("role") == "tablist"]:
        direct_tabs = [c for c in tablist.children if c.attrs.get("role") == "tab"]
        interactive_direct = [c for c in tablist.children if c.tag in {"button", "a"}]
        if interactive_direct and len(direct_tabs) != len(interactive_direct):
            errors.append(f"{ident(tablist)} must directly own role=tab for every tab control")
        if not direct_tabs:
            errors.append(f"{ident(tablist)} has no direct role=tab children")
        for tab in direct_tabs:
            for required in ("id", "aria-controls", "aria-selected", "tabindex"):
                if not tab.attrs.get(required):
                    errors.append(f"{ident(tab)} missing {required}")
            panel_id = tab.attrs.get("aria-controls")
            panel = by_id.get(panel_id or "")
            if panel_id and not panel:
                errors.append(f"{ident(tab)} aria-controls={panel_id!r} does not exist")
            elif panel:
                if panel.attrs.get("role") != "tabpanel":
                    errors.append(f"{ident(panel)} controlled by {ident(tab)} is not role=tabpanel")
                if panel.attrs.get("aria-labelledby") != tab.attrs.get("id"):
                    errors.append(f"{ident(panel)} aria-labelledby does not point back to {tab.attrs.get('id')!r}")

    # Custom radiogroup must contain either native radio inputs or role=radio descendants.
    for group in [n for n in nodes if n.attrs.get("role") == "radiogroup"]:
        radios = [d for d in group.descendants() if d.attrs.get("role") == "radio"]
        if not radios and not has_native_radio(group):
            errors.append(f"{ident(group)} radiogroup has no native radio or role=radio descendants")
        for radio in radios:
            if "aria-checked" not in radio.attrs:
                errors.append(f"{ident(radio)} role=radio missing aria-checked")
            if radio.tag in {"button", "a"} and "tabindex" not in radio.attrs:
                errors.append(f"{ident(radio)} custom radio missing roving tabindex")

    # Social icon accessibility contract: official icon-only social links need a programmatic name.
    for n in nodes:
        if n.tag != "a":
            continue
        href = n.attrs.get("href", "")
        if "facebook.com/rychlevypocty" in href or "instagram.com/rychlevypocty" in href:
            if not n.attrs.get("aria-label", "").strip():
                errors.append(f"{ident(n)} official social icon link missing aria-label")

    # Broken in-page anchor references.
    for n in nodes:
        href = n.attrs.get("href", "")
        if href.startswith("#") and len(href) > 1 and href[1:] not in by_id:
            errors.append(f"{ident(n)} points to missing anchor {href!r}")

    return errors


def has_programmatic_label(node: Node, nodes: list[Node], by_id: dict[str, Node]) -> bool:
    if node.attrs.get("aria-label", "").strip():
        return True
    labelledby = [x for x in node.attrs.get("aria-labelledby", "").split() if x]
    if labelledby and all(x in by_id for x in labelledby):
        return True
    current = node.parent
    while current is not None:
        if current.tag == "label":
            return True
        current = current.parent
    node_id = node.attrs.get("id")
    if node_id:
        for candidate in nodes:
            if candidate.tag == "label" and candidate.attrs.get("for") == node_id:
                return True
    return False


def default_vnext_files(base: Path) -> list[Path]:
    progress = base / "RV_VNEXT_PROGRESS.json"
    names: list[str] = []
    if progress.exists():
        try:
            import json
            data = json.loads(progress.read_text(encoding="utf-8"))
            for key in ("completedPages", "inProgressPages"):
                for item in data.get(key, []):
                    name = item.get("file") if isinstance(item, dict) else None
                    if isinstance(name, str) and name.endswith(".html"):
                        names.append(name)
            candidate = data.get("nextCandidate", {})
            name = candidate.get("file") if isinstance(candidate, dict) else None
            if isinstance(name, str) and name.endswith(".html"):
                names.append(name)
        except Exception:
            names = []
    if not names:
        names = [
            "hypotecni-kalkulacka.html",
            "kalkulacka-ceny-strechy.html",
            "kalkulacka-ceny-zakladove-desky.html",
            "kalkulacka-ceny-hrube-stavby-domu.html",
            "kalkulacka-cihel-a-tvarnic.html",
            "kalkulacka-betonu.html",
            "kalkulacka-priplatku-za-smeny.html",
            "kalkulacka-sterku.html",
            "kalkulacka-dlazby-a-obkladu.html",
            "kalkulacka-barvy-na-malovani.html",
            "kalkulacka-podlahy.html",
            "kalkulacka-izolace.html",
        ]
    seen: set[str] = set()
    result: list[Path] = []
    for name in names:
        if name not in seen and (base / name).exists():
            seen.add(name)
            result.append(base / name)
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*", type=Path)
    ap.add_argument("--all-vnext", action="store_true", help="scan completedPages + current candidate from RV_VNEXT_PROGRESS.json")
    args = ap.parse_args()

    base = Path.cwd()
    files = default_vnext_files(base) if args.all_vnext else args.files
    if not files:
        ap.error("provide HTML files or --all-vnext")

    failed = False
    for path in files:
        if not path.exists():
            print(f"FAIL {path}: file not found")
            failed = True
            continue
        errors = lint_file(path)
        if errors:
            failed = True
            print(f"FAIL {path} — {len(errors)} issue(s)")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"PASS {path}")

    if failed:
        print("\nStructural accessibility lint: FAIL")
        return 1
    print("\nStructural accessibility lint: PASS")
    print("Reminder: still run keyboard/browser QA and post-deploy Lighthouse/PageSpeed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
