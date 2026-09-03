let meta = null;
let lastJson = null;

const endpointGroupsEl = document.getElementById("endpoint-groups");
const responseBodyEl = document.getElementById("response-body");
const requestUrlEl = document.getElementById("request-url");
const statusPillEl = document.getElementById("status-pill");
const statusDetailEl = document.getElementById("status-detail");
const activeLabelEl = document.getElementById("active-endpoint-label");
const copyBtn = document.getElementById("copy-btn");
const tokenBannerEl = document.getElementById("token-banner");
const envBadgeEl = document.getElementById("env-badge");
const authCodeEl = document.getElementById("auth-code");
const realmIdEl = document.getElementById("realm-id");
const callbackHintEl = document.getElementById("redirect-hint");
const exchangeBtn = document.getElementById("exchange-btn");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function humanLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function setStatus(state, detail = "") {
  statusPillEl.className = `status-pill status-pill--${state}`;
  statusPillEl.textContent =
    state === "loading" ? "Loading…" : state === "ok" ? "OK" : state === "error" ? "Error" : "Ready";
  statusDetailEl.textContent = detail;
}

function endpointById(id) {
  return meta?.endpoints?.find((e) => e.id === id);
}

function buildSummaryCard(title, subtitle = "") {
  const card = document.createElement("div");
  card.className = "summary-card";
  const head = document.createElement("div");
  head.className = "summary-card__head";
  head.innerHTML = `<h3>${escapeHtml(title)}</h3>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}`;
  card.appendChild(head);
  const body = document.createElement("div");
  body.className = "summary-card__body";
  card.appendChild(body);
  return { card, body };
}

function row(label, value, extraClass = "") {
  if (value == null || value === "") return null;
  const el = document.createElement("div");
  el.className = `summary-row${extraClass ? ` ${extraClass}` : ""}`;
  el.innerHTML = `<span class="summary-label">${escapeHtml(label)}</span><span class="summary-value">${escapeHtml(value)}</span>`;
  return el;
}

function appendRow(body, label, value, extraClass = "") {
  const el = row(label, value, extraClass);
  if (el) body.appendChild(el);
}

function formatQbAddress(addr) {
  if (!addr || typeof addr !== "object") return "";
  return [addr.Line1, addr.Line2, addr.Line3, addr.City, addr.CountrySubDivisionCode, addr.PostalCode, addr.Country]
    .filter(Boolean)
    .join(", ");
}

function uniqueAddresses(company) {
  const labelled = [
    ["Registered address", formatQbAddress(company.CompanyAddr)],
    ["Legal address", formatQbAddress(company.LegalAddr)],
    ["Communication address", formatQbAddress(company.CustomerCommunicationAddr)],
  ].filter(([, value]) => value);
  const seen = new Set();
  return labelled.filter(([, value]) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function extractReportLines(node, out = []) {
  const list = node?.Row;
  if (!Array.isArray(list)) return out;
  for (const r of list) {
    if (Array.isArray(r.ColData) && r.ColData[0]?.value) {
      out.push({
        label: r.ColData[0].value,
        value: r.ColData[r.ColData.length - 1]?.value ?? "",
      });
    }
    if (r.Rows) extractReportLines(r.Rows, out);
    if (Array.isArray(r.Summary?.ColData) && r.Summary.ColData[0]?.value) {
      out.push({
        label: r.Summary.ColData[0].value,
        value: r.Summary.ColData[r.Summary.ColData.length - 1]?.value ?? "",
        summary: true,
      });
    }
  }
  return out;
}

function buildJsonTree(value, key = "Response", depth = 0) {
  if (value === null || typeof value !== "object") {
    const leaf = document.createElement("div");
    leaf.className = "tree-leaf";
    leaf.innerHTML = `<span class="tree-key">${escapeHtml(humanLabel(key))}</span><span class="tree-value">${escapeHtml(value)}</span>`;
    return leaf;
  }
  const details = document.createElement("details");
  details.className = "tree-details";
  if (depth === 0) details.classList.add("tree-details--root");
  const isArray = Array.isArray(value);
  const count = isArray ? value.length : Object.keys(value).length;
  const summary = document.createElement("summary");
  summary.textContent = `${humanLabel(key)} (${count})`;
  details.appendChild(summary);
  const inner = document.createElement("div");
  inner.className = "tree-children";
  if (isArray) value.forEach((item, i) => inner.appendChild(buildJsonTree(item, String(i), depth + 1)));
  else Object.entries(value).forEach(([k, v]) => inner.appendChild(buildJsonTree(v, k, depth + 1)));
  details.appendChild(inner);
  return details;
}

function reportTitle(report) {
  return report?.Header?.ReportName || report?.Header?.Time || "Report";
}

function buildFriendlySummary(payload, endpointId) {
  const wrap = document.createElement("div");
  wrap.className = "summary-wrap";
  const inner = payload.data ?? payload;

  if (endpointId === "auth-link" && inner.auth_link) {
    const { card, body } = buildSummaryCard("Connect Intuit sandbox");
    const linkRow = document.createElement("div");
    linkRow.className = "summary-row";
    linkRow.innerHTML = `<span class="summary-label">Open</span><span class="summary-value"><a class="format-link" href="${escapeHtml(inner.auth_link)}" target="_blank" rel="noopener">Connect sandbox company ↗</a></span>`;
    body.appendChild(linkRow);
    body.appendChild(row("Redirect URI", inner.redirect_uri || "—"));
    wrap.appendChild(card);
    return wrap;
  }

  if ((endpointId === "exchange" || endpointId === "refresh") && inner.access_token_saved) {
    const { card, body } = buildSummaryCard("Token saved", inner.message || "Ready");
    if (inner.realm_id) body.appendChild(row("Realm ID", inner.realm_id));
    wrap.appendChild(card);
    return wrap;
  }

  const company = inner.CompanyInfo;
  if (endpointId === "companyinfo" && company) {
    const subtitle = company.LegalName && company.LegalName !== company.CompanyName ? company.LegalName : "";
    const { card, body } = buildSummaryCard(company.CompanyName || "Company", subtitle);
    appendRow(body, "Legal name", company.LegalName);
    uniqueAddresses(company).forEach(([label, value]) => appendRow(body, label, value));
    appendRow(body, "Country", company.Country);
    appendRow(body, "Started", company.CompanyStartDate);
    appendRow(body, "Fiscal year starts", company.FiscalYearStartMonth);
    appendRow(body, "Email", company.Email?.Address || company.CompanyEmailAddr?.Address);
    appendRow(body, "Phone", company.PrimaryPhone?.FreeFormNumber);
    appendRow(body, "Website", company.WebAddr?.URI);
    appendRow(body, "Employer ID", company.EmployerId);
    appendRow(body, "Company ID", company.Id);
    wrap.appendChild(card);
    return wrap;
  }

  if ((endpointId === "profit-and-loss" || endpointId === "profit-and-loss-prior" || endpointId === "balance-sheet" || endpointId === "cash-flow" || endpointId === "aged-receivables" || endpointId === "aged-payables") && inner.Header) {
    const period =
      endpointId === "profit-and-loss" || endpointId === "profit-and-loss-prior" || endpointId === "cash-flow"
        ? `${inner.Header.StartPeriod || ""} → ${inner.Header.EndPeriod || ""}`
        : inner.Header.ReportDate || inner.Header.Time || "";
    const { card, body } = buildSummaryCard(reportTitle(inner), period.trim());
    appendRow(body, "Currency", inner.Header.Currency);
    const lines = extractReportLines(inner.Rows);
    lines.forEach((line) => {
      appendRow(body, line.label, line.value || "—", line.summary ? "summary-row--total" : "");
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "loan-accounts" && Array.isArray(inner.accounts)) {
    const { card, body } = buildSummaryCard("Loan / borrowing accounts", `${inner.loanAccountCount} matched`);
    inner.accounts.forEach((acc) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(acc.Name || "Account")}</div>
        <div class="summary-list-item__meta">${escapeHtml([acc.AccountType, acc.AccountSubType, acc.CurrentBalance].filter((x) => x != null && x !== "").join(" · "))}</div>`;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "accounting-assessment" && inner.fields) {
    const { card, body } = buildSummaryCard(
      "Accounting profile assessment",
      `${inner.company?.name || "Sandbox company"} · ${inner.currency || ""} · ${inner.periods?.current?.label || ""}`,
    );
    const summary = inner.summary || {};
    appendRow(body, "Fields mapped", String(summary.fieldCount || inner.fields.length));
    appendRow(body, "Status", Object.entries(summary.statusCounts || {}).map(([k, v]) => `${k}: ${v}`).join(", "));
    appendRow(body, "Feasibility", Object.entries(summary.feasibilityCounts || {}).map(([k, v]) => `${k}: ${v}`).join(", "));
    if (inner.rawFlags?.pnlNoReportData) {
      appendRow(body, "P&L warning", "NoReportData — widen QUICKBOOKS_REPORT_* dates in secrets.env", "summary-row--warn");
    }
    wrap.appendChild(card);

    const tableWrap = buildSummaryCard("PDF fields vs QuickBooks", "available · partial · empty · unavailable");
    const table = document.createElement("table");
    table.className = "assessment-table";
    table.innerHTML = `<thead><tr><th>Field</th><th>PDF</th><th>QB</th><th>Value</th><th>Status</th></tr></thead>`;
    const tbody = document.createElement("tbody");
    inner.fields.forEach((f) => {
      const tr = document.createElement("tr");
      tr.className = `assessment-row assessment-row--${f.status || "partial"}`;
      tr.innerHTML = `<td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.pdfTreatment)}</td><td>${escapeHtml(f.feasibility)}</td><td>${escapeHtml(f.displayValue || "—")}</td><td>${escapeHtml(f.status)}</td>`;
      tr.title = [f.qbSource, f.notes].filter(Boolean).join(" — ");
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrap.body.appendChild(table);
    wrap.appendChild(tableWrap.card);

    if (Array.isArray(inner.derivedRatios) && inner.derivedRatios.length) {
      const { card: ratioCard, body: ratioBody } = buildSummaryCard("Derived ratios (JusKel calculates)");
      inner.derivedRatios.forEach((r) => {
        appendRow(ratioBody, r.label, `${r.displayValue} (${r.formula})`);
      });
      wrap.appendChild(ratioCard);
    }
    return wrap;
  }

  const accounts = inner.QueryResponse?.Account;
  if (endpointId === "accounts" && Array.isArray(accounts)) {
    const { card, body } = buildSummaryCard("Accounts", `${accounts.length} shown`);
    accounts.forEach((acc) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      const currency = acc.CurrencyRef?.value || "";
      const balance = acc.CurrentBalance == null ? "" : String(acc.CurrentBalance);
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(acc.Name || "Account")}</div>
        <div class="summary-list-item__meta">${escapeHtml([acc.FullyQualifiedName, acc.AccountType, acc.AccountSubType, currency, balance].filter(Boolean).join(" · "))}</div>`;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  const { card, body } = buildSummaryCard(endpointById(endpointId)?.label || "Response");
  body.appendChild(row("Keys", Object.keys(inner).join(", ") || "—"));
  wrap.appendChild(card);
  return wrap;
}

function renderResponse(payload, endpointId) {
  lastJson = payload;
  copyBtn.disabled = false;
  const panel = document.createElement("div");
  panel.className = "response-stack";
  const summarySection = document.createElement("section");
  summarySection.className = "response-section";
  summarySection.appendChild(buildFriendlySummary(payload, endpointId));
  panel.appendChild(summarySection);
  const jsonSection = document.createElement("section");
  jsonSection.className = "response-section";
  const jsonHead = document.createElement("details");
  jsonHead.className = "json-collapse tech-section";
  jsonHead.innerHTML = "<summary class='tech-section__summary'>Raw JSON</summary>";
  const treeWrap = document.createElement("div");
  treeWrap.className = "tree-host";
  treeWrap.appendChild(buildJsonTree(payload.data ?? payload));
  jsonHead.appendChild(treeWrap);
  jsonSection.appendChild(jsonHead);
  panel.appendChild(jsonSection);
  responseBodyEl.innerHTML = "";
  responseBodyEl.classList.remove("empty-state");
  responseBodyEl.appendChild(panel);
}

async function runEndpoint(endpointId, extra = {}) {
  const ep = endpointById(endpointId);
  activeLabelEl.textContent = ep?.label || endpointId;
  setStatus("loading");
  requestUrlEl.textContent = `POST /api/request → ${endpointId}`;
  responseBodyEl.innerHTML = "<p class='loading-text'>Calling QuickBooks sandbox…</p>";
  copyBtn.disabled = true;
  try {
    const res = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpointId, ...extra }),
    });
    const payload = await res.json();
    if (payload.hasAccessToken) {
      meta.hasAccessToken = true;
      tokenBannerEl.classList.add("hidden");
      buildSidebar();
    }
    if (payload.ok) {
      setStatus("ok");
      renderResponse(payload, endpointId);
    } else {
      setStatus("error", payload.error || "Request failed");
      renderResponse(payload.data ? payload : { data: payload }, endpointId);
    }
  } catch (err) {
    setStatus("error", err.message);
    responseBodyEl.textContent = String(err);
  }
}

function buildSidebar() {
  endpointGroupsEl.innerHTML = "";
  meta.groups.forEach((group) => {
    const section = document.createElement("div");
    section.className = "endpoint-group";
    const title = document.createElement("h3");
    title.textContent = group.label;
    section.appendChild(title);
    meta.endpoints
      .filter((e) => e.group === group.id)
      .forEach((ep) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "endpoint-btn";
        btn.textContent = ep.label;
        if (ep.needsToken && !meta.hasAccessToken) btn.classList.add("endpoint-btn--muted");
        btn.addEventListener("click", () => runEndpoint(ep.id));
        section.appendChild(btn);
      });
    endpointGroupsEl.appendChild(section);
  });
}

copyBtn.addEventListener("click", () => {
  if (!lastJson) return;
  navigator.clipboard.writeText(JSON.stringify(lastJson, null, 2));
  copyBtn.textContent = "Copied!";
  setTimeout(() => (copyBtn.textContent = "Copy JSON"), 1200);
});

exchangeBtn.addEventListener("click", () => {
  const code = authCodeEl.value.trim();
  if (!code) {
    setStatus("error", "Paste auth code first");
    return;
  }
  runEndpoint("exchange", { code, realmId: realmIdEl.value.trim() });
});

async function init() {
  const res = await fetch("/api/meta");
  meta = await res.json();
  if (meta.error) {
    envBadgeEl.textContent = "secrets missing";
    responseBodyEl.textContent = meta.error;
    return;
  }
  envBadgeEl.textContent = `QuickBooks · sandbox`;
  if (meta.redirectUri && callbackHintEl) callbackHintEl.textContent = meta.redirectUri;
  if (!meta.hasAccessToken) tokenBannerEl.classList.remove("hidden");
  buildSidebar();
}

init();
