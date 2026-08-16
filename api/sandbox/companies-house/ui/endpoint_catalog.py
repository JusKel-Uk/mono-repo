"""Companies House Public Data API — read endpoint catalog for local UI."""

from __future__ import annotations

from typing import Any

# scope: company (needs company_number on detail page), search (home), global (needs ids)
ENDPOINTS: dict[str, dict[str, Any]] = {
    # —— Company ——
    "company-profile": {
        "label": "Company profile",
        "group": "company",
        "scope": "company",
        "path": "/company/{company_number}",
        "description": "Includes registered office address, SIC codes, and status.",
    },
    "registers": {
        "label": "Registers",
        "group": "company",
        "scope": "company",
        "path": "/company/{company_number}/registers",
        "optional_404": True,
    },
    "exemptions": {
        "label": "Exemptions",
        "group": "company",
        "scope": "company",
        "path": "/company/{company_number}/exemptions",
        "optional_404": True,
    },
    "uk-establishments": {
        "label": "UK establishments",
        "group": "company",
        "scope": "company",
        "path": "/company/{company_number}/uk-establishments",
    },
    "insolvency": {
        "label": "Insolvency",
        "group": "company",
        "scope": "company",
        "path": "/company/{company_number}/insolvency",
        "optional_404": True,
    },
    # —— Officers ——
    "officers": {
        "label": "Officers list",
        "group": "officers",
        "scope": "company",
        "path": "/company/{company_number}/officers",
        "query": {"items_per_page": "50"},
        "drill": {"child": "officer-appointment", "param": "appointment_id", "from": "links.self"},
    },
    "officer-appointment": {
        "label": "Officer appointment (detail)",
        "group": "officers",
        "scope": "company",
        "path": "/company/{company_number}/appointments/{appointment_id}",
        "pathParams": ["appointment_id"],
    },
    "officer-appointments-global": {
        "label": "Officer appointments (all companies)",
        "group": "officers",
        "scope": "global",
        "path": "/officers/{officer_id}/appointments",
        "pathParams": ["officer_id"],
        "drill": {"child": "officer-appointments-global", "param": "officer_id", "from": "links.officer.appointments"},
    },
    # —— PSC ——
    "psc-list": {
        "label": "Persons with significant control",
        "group": "psc",
        "scope": "company",
        "path": "/company/{company_number}/persons-with-significant-control",
        "drill": {"child": "psc-individual", "param": "notification_id", "from": "links.self", "pscType": "individual"},
    },
    "psc-statements-list": {
        "label": "PSC statements",
        "group": "psc",
        "scope": "company",
        "path": "/company/{company_number}/persons-with-significant-control-statements",
        "optional_404": True,
        "drill": {"child": "psc-statement", "param": "statement_id", "from": "links.self"},
    },
    "psc-individual": {
        "label": "PSC — individual",
        "group": "psc",
        "scope": "company",
        "path": "/company/{company_number}/persons-with-significant-control/individual/{notification_id}",
        "pathParams": ["notification_id"],
    },
    "psc-corporate": {
        "label": "PSC — corporate entity",
        "group": "psc",
        "scope": "company",
        "path": "/company/{company_number}/persons-with-significant-control/corporate-entity/{notification_id}",
        "pathParams": ["notification_id"],
    },
    "psc-legal-person": {
        "label": "PSC — legal person",
        "group": "psc",
        "scope": "company",
        "path": "/company/{company_number}/persons-with-significant-control/legal-person/{notification_id}",
        "pathParams": ["notification_id"],
    },
    "psc-statement": {
        "label": "PSC statement (detail)",
        "group": "psc",
        "scope": "company",
        "path": "/company/{company_number}/persons-with-significant-control-statements/{statement_id}",
        "pathParams": ["statement_id"],
    },
    # —— Filings & charges ——
    "filing-history": {
        "label": "Filing history",
        "group": "filings",
        "scope": "company",
        "path": "/company/{company_number}/filing-history",
        "query": {"items_per_page": "25"},
        "drill": {"child": "filing-history-item", "param": "transaction_id", "from": "transaction_id"},
    },
    "filing-history-item": {
        "label": "Filing (detail)",
        "group": "filings",
        "scope": "company",
        "path": "/company/{company_number}/filing-history/{transaction_id}",
        "pathParams": ["transaction_id"],
    },
    "charges": {
        "label": "Charges",
        "group": "filings",
        "scope": "company",
        "path": "/company/{company_number}/charges",
        "query": {"items_per_page": "25"},
        "drill": {"child": "charge-item", "param": "charge_id", "from": "links.self"},
    },
    "charge-item": {
        "label": "Charge (detail)",
        "group": "filings",
        "scope": "company",
        "path": "/company/{company_number}/charges/{charge_id}",
        "pathParams": ["charge_id"],
    },
    # —— Search ——
    "search-companies": {
        "label": "Search companies",
        "group": "search",
        "scope": "search",
        "path": "/search/companies",
        "queryParams": ["q"],
        "query": {"items_per_page": "20"},
    },
    "search-all": {
        "label": "Search all",
        "group": "search",
        "scope": "search",
        "path": "/search/all",
        "queryParams": ["q"],
        "query": {"items_per_page": "20"},
    },
    "search-officers": {
        "label": "Search officers",
        "group": "search",
        "scope": "search",
        "path": "/search/officers",
        "queryParams": ["q"],
        "query": {"items_per_page": "20"},
        "drill": {"child": "officer-appointments-global", "param": "officer_id", "from": "links.self"},
    },
    "search-disqualified-officers": {
        "label": "Search disqualified officers",
        "group": "search",
        "scope": "search",
        "path": "/search/disqualified-officers",
        "queryParams": ["q"],
        "query": {"items_per_page": "20"},
    },
    "alphabetical-search": {
        "label": "Alphabetical company search",
        "group": "search",
        "scope": "search",
        "path": "/alphabetical-search/companies",
        "queryParams": ["starts_with"],
        "query": {"items_per_page": "20"},
    },
    "advanced-search-companies": {
        "label": "Advanced company search",
        "group": "search",
        "scope": "search",
        "path": "/advanced-search/companies",
        "queryParams": [
            "company_name_includes",
            "company_status",
            "sic_codes",
            "incorporated_from",
            "incorporated_to",
        ],
        "query": {"size": "20"},
    },
    # —— Disqualifications ——
    "disqualified-natural": {
        "label": "Disqualified officer (natural)",
        "group": "disqualification",
        "scope": "global",
        "path": "/disqualified-officers/natural/{officer_id}",
        "pathParams": ["officer_id"],
    },
    "disqualified-corporate": {
        "label": "Disqualified officer (corporate)",
        "group": "disqualification",
        "scope": "global",
        "path": "/disqualified-officers/corporate/{officer_id}",
        "pathParams": ["officer_id"],
    },
}

GROUPS: list[dict[str, str]] = [
    {"id": "company", "label": "Company"},
    {"id": "officers", "label": "Officers"},
    {"id": "psc", "label": "PSC"},
    {"id": "filings", "label": "Filings & charges"},
    {"id": "search", "label": "Search"},
    {"id": "disqualification", "label": "Disqualifications"},
]
