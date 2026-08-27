#!/usr/bin/env python3
"""RychléVýpočty.cz V-next tracking integrity audit.

Validates that RV_VNEXT_PROGRESS.json matches the actual V-next HTML state.
This scanner is read-only and CI-safe.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from datetime import date
from pathlib import Path

MARKER_RE = re.compile(r"<!--\s*RV-VNEXT:\s*(.*?)-->", re.I | re.S)
PAIR_RE = re.compile(r"([A-Za-z][A-Za-z0-9_-]*)\s*=\s*([^|]+)")


@dataclass
class Finding:
    severity: str
    code: str
    path: str
    message: str


def parse_marker(text: str) -> dict[str, str] | None:
    m = MARKER_RE.search(text)
    if not m:
        return None
    out: dict[str, str] = {}
    for key, value in PAIR_RE.findall(m.group(1)):
        out[key.strip()] = value.strip()
    return out


def is_vnext_html(text: str) -> bool:
    low = text.lower()
    return (
        "rv-vnext-page" in low
        or "rv-vnext-identity.css" in low
        or "<!-- rv-vnext:" in low
    )


def load_progress(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise RuntimeError(f"missing {path.name}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"invalid JSON in {path.name}: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError(f"{path.name} root must be an object")
    return data


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--json-out", type=Path)
    args = ap.parse_args()
    root = args.root.resolve()
    findings: list[Finding] = []

    def add(sev: str, code: str, path: str, msg: str) -> None:
        findings.append(Finding(sev, code, path, msg))

    try:
        data = load_progress(root / "RV_VNEXT_PROGRESS.json")
    except RuntimeError as exc:
        print(f"P1 TRACKING_PROGRESS_JSON: {exc}")
        return 1

    completed = data.get("completedPages", [])
    in_progress = data.get("inProgressPages", [])
    current = data.get("currentCandidate")
    if not isinstance(completed, list):
        add("P1", "TRACKING_COMPLETED_TYPE", "RV_VNEXT_PROGRESS.json", "completedPages must be an array")
        completed = []
    if not isinstance(in_progress, list):
        add("P1", "TRACKING_INPROGRESS_TYPE", "RV_VNEXT_PROGRESS.json", "inProgressPages must be an array")
        in_progress = []

    buckets: list[tuple[str, dict]] = []
    for bucket_name, items in (("completedPages", completed), ("inProgressPages", in_progress)):
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                add("P1", "TRACKING_ITEM_TYPE", "RV_VNEXT_PROGRESS.json", f"{bucket_name}[{idx}] must be an object")
                continue
            buckets.append((bucket_name, item))
    if current is not None:
        if isinstance(current, dict):
            buckets.append(("currentCandidate", current))
        else:
            add("P1", "TRACKING_CURRENT_TYPE", "RV_VNEXT_PROGRESS.json", "currentCandidate must be object or null")

    # Duplicate file tracking across buckets is forbidden.
    file_locations: dict[str, list[str]] = {}
    for bucket, item in buckets:
        file = item.get("file")
        if isinstance(file, str) and file:
            file_locations.setdefault(file, []).append(bucket)
        else:
            add("P1", "TRACKING_FILE_REQUIRED", "RV_VNEXT_PROGRESS.json", f"{bucket} item missing file")
    for file, locs in file_locations.items():
        if len(locs) > 1:
            add("P1", "TRACKING_DUPLICATE_FILE", file, f"tracked in multiple buckets: {', '.join(locs)}")

    # Completed sequence must be explicit, unique and continuous in array order.
    seen_seq: set[int] = set()
    for expected, item in enumerate(completed, 1):
        seq = item.get("sequence") if isinstance(item, dict) else None
        if seq != expected:
            add("P1", "TRACKING_SEQUENCE_ORDER", "RV_VNEXT_PROGRESS.json", f"completedPages[{expected-1}] sequence={seq!r}, expected {expected}")
        if isinstance(seq, int):
            if seq in seen_seq:
                add("P1", "TRACKING_SEQUENCE_DUP", "RV_VNEXT_PROGRESS.json", f"duplicate sequence {seq}")
            seen_seq.add(seq)

    max_major: str | None = None
    required = ("file", "url", "status", "majorChangeDate", "archetype", "researchVerifiedAt", "qaStatus", "benchmarkDataset", "notes")
    for bucket, item in buckets:
        file = item.get("file") if isinstance(item.get("file"), str) else "RV_VNEXT_PROGRESS.json"
        if bucket == "completedPages":
            for key in required:
                val = item.get(key)
                if val is None or val == "":
                    add("P1", "TRACKING_REQUIRED_FIELD", file, f"missing required field {key}")
        major = item.get("majorChangeDate")
        if isinstance(major, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", major):
            try:
                date.fromisoformat(major)
                max_major = max(max_major or major, major)
            except ValueError:
                add("P1", "TRACKING_MAJOR_DATE", file, f"invalid majorChangeDate {major}")
        elif bucket == "completedPages":
            add("P1", "TRACKING_MAJOR_DATE", file, "majorChangeDate must be YYYY-MM-DD")

        path = root / file if isinstance(file, str) else None
        if path and not path.exists():
            add("P1", "TRACKING_FILE_MISSING", str(file), "tracked HTML file does not exist")
            continue
        if path and path.suffix.lower() == ".html":
            text = path.read_text(encoding="utf-8", errors="replace")
            marker = parse_marker(text)
            if not marker:
                add("P1", "TRACKING_MARKER_MISSING", str(file), "tracked V-next HTML is missing RV-VNEXT marker")
            else:
                if marker.get("status") != str(item.get("status")):
                    add("P1", "TRACKING_MARKER_STATUS", str(file), f"marker status={marker.get('status')!r} != tracker {item.get('status')!r}")
                if marker.get("major") != str(item.get("majorChangeDate")):
                    add("P1", "TRACKING_MARKER_MAJOR", str(file), f"marker major={marker.get('major')!r} != tracker {item.get('majorChangeDate')!r}")
                seq = item.get("sequence")
                if isinstance(seq, int) and marker.get("seq") != str(seq):
                    add("P1", "TRACKING_MARKER_SEQUENCE", str(file), f"marker seq={marker.get('seq')!r} != tracker {seq}")

    updated = data.get("updatedAt")
    if max_major and (not isinstance(updated, str) or updated < max_major):
        add("P1", "TRACKING_UPDATED_AT", "RV_VNEXT_PROGRESS.json", f"updatedAt={updated!r} is older than max majorChangeDate={max_major}")

    # Find V-next pages in code that are absent from tracker.
    tracked_files = set(file_locations)
    vnext_files: list[str] = []
    for path in sorted(root.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="replace")
        if is_vnext_html(text):
            vnext_files.append(path.name)
            if path.name not in tracked_files:
                add("P1", "TRACKING_UNTRACKED_VNEXT", path.name, "V-next signals found in HTML but page is absent from tracker")

    # A pre-build nextCandidate must never be silently counted as already tracked/built.
    next_candidate = data.get("nextCandidate")
    if isinstance(next_candidate, dict):
        nf = next_candidate.get("file")
        if isinstance(nf, str) and nf in tracked_files:
            add("P2", "TRACKING_NEXT_ALREADY_TRACKED", nf, "nextCandidate is already present in completed/in-progress/current tracking")

    counts = {s: sum(1 for f in findings if f.severity == s) for s in ("P0", "P1", "P2", "P3", "INFO")}
    report = {
        "scanner": "rv-vnext-progress-audit",
        "root": str(root),
        "completedPages": len(completed),
        "inProgressPages": len(in_progress),
        "currentCandidate": current.get("file") if isinstance(current, dict) else None,
        "detectedVnextHtml": len(vnext_files),
        "findings": [asdict(f) for f in findings],
        "counts": counts,
        "gate": "FAIL" if counts["P0"] or counts["P1"] else "PASS",
    }
    if args.json_out:
        args.json_out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("RV V-NEXT TRACKING AUDIT v1.0")
    print("=" * 72)
    print(f"TRACKER: completed={len(completed)} inProgress={len(in_progress)} current={report['currentCandidate'] or '-'}")
    print(f"CODE: detected V-next HTML={len(vnext_files)}")
    for f in findings:
        print(f"{f.severity} {f.code} {f.path}: {f.message}")
    print(f"FINDINGS: P0={counts['P0']} P1={counts['P1']} P2={counts['P2']} P3={counts['P3']} INFO={counts['INFO']}")
    print(f"TRACKING GATE: {report['gate']}")
    return 1 if report["gate"] == "FAIL" else 0


if __name__ == "__main__":
    raise SystemExit(main())
