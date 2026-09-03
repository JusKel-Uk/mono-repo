#!/usr/bin/env python3
"""Generate Open Banking consent limits reference PDF with clickable links."""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Open_Banking_Consent_And_Multi_Bank_Limits.pdf"


def build_pdf() -> None:
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_LEFT
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import cm
        from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    except ImportError as exc:
        print(
            "reportlab required: python3 -m venv .venv-pdf && source .venv-pdf/bin/activate && pip install reportlab",
            file=sys.stderr,
        )
        raise SystemExit(1) from exc

    OUT.parent.mkdir(parents=True, exist_ok=True)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontSize=18,
        spaceAfter=12,
        textColor=colors.HexColor("#1e3a5f"),
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontSize=13,
        spaceBefore=14,
        spaceAfter=8,
        textColor=colors.HexColor("#1e3a5f"),
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=10,
        spaceBefore=8,
        spaceAfter=5,
        textColor=colors.HexColor("#334155"),
    )
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=9, leading=13, alignment=TA_LEFT)
    small = ParagraphStyle("Small", parent=styles["Normal"], fontSize=8, leading=11, textColor=colors.HexColor("#475569"))
    link_style = ParagraphStyle(
        "Link",
        parent=body,
        textColor=colors.HexColor("#1d4ed8"),
        underline=True,
    )

    def link(url: str, label: str | None = None) -> str:
        text = label or url
        return f'<link href="{url}" color="#1d4ed8"><u>{text}</u></link>'

    def p(text: str, style=body) -> Paragraph:
        return Paragraph(text.replace("\n", "<br/>"), style)

    story: list = []

    story.append(p("juskel — Open Banking consent &amp; multi-bank limits", title_style))
    story.append(
        p(
            "Reference document: why UK Open Banking / TrueLayer cannot automatically link "
            "all banks and all accounts in one click. All URLs below are clickable in supported PDF viewers.",
            body,
        )
    )
    story.append(Spacer(1, 0.2 * cm))
    story.append(p(f"<b>Document date:</b> {date.today().isoformat()}", small))
    story.append(p("<b>Context:</b> juskel SME onboarding — TrueLayer (production), PSD2 / UK Open Banking rules", small))

    story.append(p("Executive summary", h1))
    story.append(
        p(
            "Access to business bank data requires <b>explicit customer consent</b>, "
            "<b>per bank (ASPSP)</b>, and often <b>per account</b> at the bank’s own screen. "
            "There is no standard API to auto-discover and connect every bank a business uses in one OAuth. "
            "Product policy (terms, multi-bank guided flow, attestation) can require completeness; "
            "regulation and bank UX cannot be bypassed via TrueLayer.",
            body,
        )
    )

    story.append(p("1. UK Open Banking — primary standards (clickable)", h1))

    docs_primary = [
        (
            "Account Information Consent (Customer Experience Guidelines)",
            "https://standards.openbanking.org.uk/customer-experience-guidelines/account-information-services/account-information-consent/latest/",
            "PSU selects their bank (ASPSP), authenticates at the bank, and selects account(s) to share. "
            "CEG #1: AISP must ask PSU to identify ASPSP before consent.",
        ),
        (
            "Account Information Services — specification overview",
            "https://standards.openbanking.org.uk/specification/account-information-services/",
            "AISPs may access account information only with the PSU’s explicit consent. "
            "Links to core journeys: consent, corporate access, permissions &amp; data clusters.",
        ),
        (
            "Permissions &amp; Data clusters for AIS journeys",
            "https://standards.openbanking.org.uk/customer-experience-guidelines/account-information-services/permissions-and-data-clusters-for-ais-journeys/latest/",
            "How data permissions are grouped for informed consent.",
        ),
        (
            "Open Banking Standards — home",
            "https://standards.openbanking.org.uk/",
            "Index of all UK Open Banking standards and customer experience guidelines.",
        ),
    ]

    for title, url, note in docs_primary:
        story.append(p(title, h2))
        story.append(p(link(url), link_style))
        story.append(Spacer(1, 0.1 * cm))
        story.append(p(note, small))
        story.append(Spacer(1, 0.15 * cm))

    story.append(p("Key quote (Account Information Consent journey)", h2))
    story.append(
        p(
            "<i>“PSU selects the ASPSP(s) where their payment account(s) is held. The PSU is then directed "
            "to the domain of its ASPSP for authentication and to select the account(s) they want to give access to.”</i>",
            small,
        )
    )

    story.append(PageBreak())
    story.append(p("2. TrueLayer — implementation documentation (clickable)", h1))

    docs_tl = [
        (
            "Connect an account",
            "https://docs.truelayer.com/docs/connect-an-account",
            "User selects provider (bank); at bank they select account(s) to connect; code exchanged for token.",
        ),
        (
            "Enable your users to connect their bank account (Data API v3)",
            "https://docs.truelayer.com/docs/enable-your-users-to-connect-their-bank-account",
            "One connection = one authorised bank link; Connection-Id per connection; recurring vs one_time access; 90-day reconfirmation.",
        ),
        (
            "Create a connection (Data API v3)",
            "https://docs.truelayer.com/docs/create-a-connection-v3",
            "provider_selection: user_selected vs preselected; scopes; hosted vs custom UI (AISP regulation applies).",
        ),
        (
            "TrueLayer documentation index",
            "https://docs.truelayer.com/llms.txt",
            "Full list of TrueLayer docs pages.",
        ),
        (
            "TrueLayer Console (sandbox / live apps)",
            "https://console.truelayer.com/",
            "Register app, redirect URIs, client_id / client_secret.",
        ),
    ]

    for title, url, note in docs_tl:
        story.append(p(title, h2))
        story.append(p(link(url), link_style))
        story.append(Spacer(1, 0.1 * cm))
        story.append(p(note, small))
        story.append(Spacer(1, 0.15 * cm))

    story.append(p("Key quote (TrueLayer — Connect an account)", h2))
    story.append(
        p(
            "<i>“Send the user to their mobile banking app or online banking where they'll select the account(s) "
            "they'd like to connect (they can choose more than one).”</i>",
            small,
        )
    )

    story.append(p("3. Regulatory background (PSD2 / FCA)", h1))

    docs_reg = [
        (
            "FCA Handbook — Regulatory Technical Standards (RTS)",
            "https://www.handbook.fca.org.uk/handbook/RTS/",
            "UK implementation context for payment services, SCA, and related RTS.",
        ),
        (
            "EU PSD2 Directive (EUR-Lex)",
            "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015L2366",
            "Original PSD2 framework; account information services require customer consent.",
        ),
        (
            "FCA — Open Banking",
            "https://www.fca.org.uk/firms/open-banking",
            "FCA overview of open banking in the UK.",
        ),
    ]

    for title, url, note in docs_reg:
        story.append(p(title, h2))
        story.append(p(link(url), link_style))
        story.append(Spacer(1, 0.1 * cm))
        story.append(p(note, small))
        story.append(Spacer(1, 0.15 * cm))

    story.append(PageBreak())
    story.append(p("4. Question → document map", h1))

    map_rows = [
        ["Question", "Best document"],
        [
            "Why must the user pick the bank?",
            p(
                link(
                    "https://standards.openbanking.org.uk/customer-experience-guidelines/account-information-services/account-information-consent/latest/",
                    "OB Account Information Consent (CEG #1)",
                ),
                small,
            ),
        ],
        [
            "Why can they pick which accounts?",
            p(
                link(
                    "https://standards.openbanking.org.uk/customer-experience-guidelines/account-information-services/account-information-consent/latest/",
                    "OB Account Information Consent",
                )
                + " + "
                + link("https://docs.truelayer.com/docs/connect-an-account", "TrueLayer Connect an account"),
                small,
            ),
        ],
        [
            "Why is explicit consent required?",
            p(
                link(
                    "https://standards.openbanking.org.uk/specification/account-information-services/",
                    "OB AIS specification",
                ),
                small,
            ),
        ],
        [
            "How does TrueLayer implement it?",
            p(
                link(
                    "https://docs.truelayer.com/docs/enable-your-users-to-connect-their-bank-account",
                    "TrueLayer Data API v3 user journey",
                ),
                small,
            ),
        ],
        [
            "juskel TrueLayer sandbox UI",
            p(link("http://127.0.0.1:8767", "http://127.0.0.1:8767") + " (local)", small),
        ],
        [
            "juskel sandbox README",
            p("api/sandbox/truelayer/README.md (repo)", small),
        ],
    ]

    t = Table(map_rows, colWidths=[5.5 * cm, 11.5 * cm], repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8eef6")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(t)

    story.append(Spacer(1, 0.4 * cm))
    story.append(p("5. What is NOT possible (by design)", h1))
    story.append(
        p(
            "• Auto-discover all banks a business uses<br/>"
            "• Single OAuth connecting every UK bank at once<br/>"
            "• Force access to all accounts without bank-side consent UI<br/>"
            "• Bypass account selection when the ASPSP offers it<br/><br/>"
            "<b>What juskel can do:</b> multi-bank guided connect flow; use all accounts returned by TrueLayer; "
            "terms requiring all business banks; attestation; coverage checks vs declared turnover.",
            body,
        )
    )

    story.append(p("6. juskel production code reference", h1))
    story.append(
        p(
            "<b>Path:</b> api/src/Infrastructure/juskel.Integrations/OpenBanking/TrueLayerOpenBankingProvider.cs<br/>"
            "Returns all accounts from GET /data/v1/accounts (no per-account picker in the API layer).",
            small,
        )
    )

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.8 * cm,
        rightMargin=1.8 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.8 * cm,
        title="Open Banking Consent and Multi-Bank Limits",
        author="juskel",
    )
    doc.build(story)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_pdf()
