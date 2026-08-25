#!/usr/bin/env python3
"""Fetch Companies House endpoints and map fields to juskel MVP spec."""

from __future__ import annotations

import base64
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent

LIVE_BASE_URL = "https://api.company-information.service.gov.uk"
SANDBOX_BASE_URL = "https://api-sandbox.company-information.service.gov.uk"


def load_secrets() -> dict[str, str]:
    secrets_path = ROOT / "secrets.env"
    if not secrets_path.is_file():
        print(
            "Missing secrets.env — copy secrets.env.example and set COMPANIES_HOUSE_API_KEY"
        )
        sys.exit(1)

    env: dict[str, str] = {}
    for line in secrets_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def ch_get(base_url: str, api_key: str, path: str, query: dict[str, str] | None = None) -> Any:
    url = base_url.rstrip("/") + path
    if query:
        url += "?" + urllib.parse.urlencode(query)

    token = base64.b64encode(f"{api_key}:".encode()).decode()
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Authorization": f"Basic {token}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        exc.body = exc.read().decode(errors="replace")
        raise


def probe_auth(base_url: str, api_key: str) -> tuple[bool, int | None]:
    """Return (auth_ok, http_status). Uses search — works on live and sandbox."""
    try:
        ch_get(
            base_url,
            api_key,
            "/search/companies",
            {"q": "BBC", "items_per_page": "1"},
        )
        return True, 200
    except urllib.error.HTTPError as exc:
        return False, exc.code


def resolve_base_url(api_key: str, preferred: str | None) -> str:
    """Pick live or sandbox URL — tries preferred first, then the other environment."""
    candidates: list[str] = []
    if preferred:
        candidates.append(preferred.rstrip("/"))
    for url in [LIVE_BASE_URL, SANDBOX_BASE_URL]:
        if url not in candidates:
            candidates.append(url)

    statuses: dict[str, int] = {}
    for base in candidates:
        label = "sandbox" if "sandbox" in base else "live"
        ok, status = probe_auth(base, api_key)
        if ok:
            print(f"Auth OK against {label} API ({base})")
            return base
        statuses[label] = status or 0
        print(f"HTTP {status} on {label} API ({base})")

    print_auth_help(statuses)
    sys.exit(1)


def fetch_search(
    base_url: str,
    api_key: str,
    primary_term: str,
) -> tuple[dict[str, Any], str]:
    """Search companies; retry common terms if the environment returns empty results."""
    terms: list[str] = []
    for term in [primary_term, "BBC", "TESCO", "LIMITED"]:
        if term not in terms:
            terms.append(term)

    for term in terms:
        data = ch_get(
            base_url,
            api_key,
            "/search/companies",
            {"q": term, "items_per_page": "5"},
        )
        if data.get("items"):
            if term != primary_term:
                print(f"Search '{primary_term}' had no hits — using results for '{term}'.")
            return data, term

    return ch_get(
        base_url,
        api_key,
        "/search/companies",
        {"q": primary_term, "items_per_page": "5"},
    ), primary_term


def print_auth_help(statuses: dict[str, int] | None = None) -> None:
    print("\nCompanies House auth failed.")
    if statuses:
        for label, code in statuses.items():
            print(f"  {label}: HTTP {code}")
            if code == 401:
                print("    → Wrong key for this environment, or invalid/revoked API key.")
            elif code == 403:
                print("    → Key may be valid but blocked (IP allowlist, or key not permitted here).")
    print(
        "\nCheck:\n"
        "  1. Developer portal → your app → copy the API key (UUID), not client ID\n"
        "  2. Live keys need:\n"
        f"       COMPANIES_HOUSE_BASE_URL={LIVE_BASE_URL}\n"
        "  3. Sandbox keys need:\n"
        f"       COMPANIES_HOUSE_BASE_URL={SANDBOX_BASE_URL}\n"
        "     (Live and sandbox keys are NOT interchangeable — 401 on sandbox is normal with a live key.)\n"
        "  4. IP restrictions: run curl https://api.ipify.org and add that IP in the developer portal.\n"
        "     Mobile/home ISP IPs change often (e.g. 102.89.82.x → 102.89.84.x).\n"
        "  5. Regenerate the key if unsure\n"
    )


def save_response(name: str, data: Any) -> Path:
    out_dir = ROOT / "responses"
    out_dir.mkdir(exist_ok=True)
    path = out_dir / f"{name}.live.json"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return path


def format_address(addr: dict[str, Any] | None) -> str | None:
    if not addr:
        return None
    parts = [
        addr.get("premises"),
        addr.get("address_line_1"),
        addr.get("address_line_2"),
        addr.get("locality"),
        addr.get("region"),
        addr.get("postal_code"),
        addr.get("country"),
    ]
    return ", ".join(p for p in parts if p)


def print_spec_report(
    company: dict[str, Any],
    officers: dict[str, Any],
    psc: dict[str, Any],
    filings: dict[str, Any],
) -> None:
    directors = [
        o for o in officers.get("items", [])
        if str(o.get("officer_role", "")).lower().startswith("director")
    ]

    print("\n=== juskel spec coverage (from live API) ===\n")
    rows = [
        ("Company Name", company.get("company_name")),
        ("Company Number", company.get("company_number")),
        ("Registered Address", format_address(company.get("registered_office_address"))),
        ("SIC Codes", ", ".join(company.get("sic_codes") or []) or None),
        ("Incorporated Date", company.get("date_of_creation")),
        ("Company Status (filing status baseline)", company.get("company_status")),
        ("Director count", len(directors)),
        ("PSC count", psc.get("active_count")),
        ("Recent filings count", filings.get("total_count")),
    ]
    for label, value in rows:
        status = "OK" if value is not None and value != "" else "MISSING"
        print(f"  [{status:7}] {label}: {value}")

    if directors:
        print("\n  Sample directors:")
        for d in directors[:3]:
            print(f"    - {d.get('name')} ({d.get('officer_role')}, appointed {d.get('appointed_on')})")

    psc_items = psc.get("items") or []
    if psc_items:
        print("\n  Sample PSCs:")
        for p in psc_items[:3]:
            name = p.get("name")
            if not name and p.get("name_elements"):
                ne = p["name_elements"]
                name = f"{ne.get('forename', '')} {ne.get('surname', '')}".strip()
            print(f"    - {name} (notified {p.get('notified_on')})")

    filing_items = filings.get("items") or []
    if filing_items:
        print("\n  Latest filings:")
        for f in filing_items[:3]:
            print(f"    - {f.get('date')}: {f.get('description')} ({f.get('type')})")


def main() -> None:
    env = load_secrets()
    api_key = env.get("COMPANIES_HOUSE_API_KEY", "")
    if not api_key or api_key == "your-api-key-here":
        print("Set COMPANIES_HOUSE_API_KEY in secrets.env (not the placeholder)")
        sys.exit(1)

    base_url = resolve_base_url(
        api_key,
        env.get("COMPANIES_HOUSE_BASE_URL"),
    )
    company_number = (
        sys.argv[1]
        if len(sys.argv) > 1 and sys.argv[1].strip()
        else env.get("COMPANIES_HOUSE_TEST_COMPANY_NUMBER", "00000006")
    )
    search_term = env.get("COMPANIES_HOUSE_TEST_SEARCH", "BBC")

    print(f"Companies House explore — company {company_number}")
    print(f"Base URL: {base_url}\n")

    try:
        search, search_term = fetch_search(base_url, api_key, search_term)

        try:
            company = ch_get(base_url, api_key, f"/company/{company_number}")
        except urllib.error.HTTPError as exc:
            if exc.code != 404:
                raise
            hits = search.get("items") or []
            if not hits:
                body = getattr(exc, "body", None) or ""
                print(f"HTTP 404: company {company_number} not found and search had no hits.")
                if "sandbox" in base_url:
                    print(
                        "Sandbox tip: create a test company via the test data generator API,\n"
                        "or set COMPANIES_HOUSE_BASE_URL to the live URL with a live API key."
                    )
                if body:
                    print(body)
                sys.exit(1)
            fallback = hits[0].get("company_number")
            print(
                f"Company {company_number} not found on this environment — "
                f"using {fallback} ({hits[0].get('title')}) from search."
            )
            company_number = fallback
            company = ch_get(base_url, api_key, f"/company/{company_number}")

        officers = ch_get(base_url, api_key, f"/company/{company_number}/officers")
        psc = ch_get(
            base_url,
            api_key,
            f"/company/{company_number}/persons-with-significant-control",
        )
        filings = ch_get(
            base_url,
            api_key,
            f"/company/{company_number}/filing-history",
            {"items_per_page": "5"},
        )
    except urllib.error.HTTPError as exc:
        body = getattr(exc, "body", None) or exc.read().decode(errors="replace")
        print(f"HTTP {exc.code}: {body}")
        if exc.code == 401:
            print_auth_help()
        sys.exit(1)

    paths = [
        save_response("company-profile", company),
        save_response("officers", officers),
        save_response("psc", psc),
        save_response("filing-history", filings),
        save_response("search-companies", search),
    ]

    print("Saved responses:")
    for p in paths:
        print(f"  {p}")

    print_spec_report(company, officers, psc, filings)

    search_hits = search.get("items") or []
    if search_hits:
        print(f"\n=== Search '{search_term}' (name match for onboarding) ===\n")
        for hit in search_hits[:5]:
            print(f"  {hit.get('company_number')} — {hit.get('title')} [{hit.get('company_status')}]")


if __name__ == "__main__":
    main()
