/* Companies House Explorer */

let meta = null;
let metaReady = null;
let lastJson = "";
let currentCompany = null;
let suggestTimer = null;
let openCompanySeq = 0;

const $ = (sel) => document.querySelector(sel);

const viewHome = $("#view-home");
const viewCompany = $("#view-company");
const envBadge = $("#env-badge");
const homeSearch = $("#home-search");
const suggestions = $("#suggestions");
const companyHero = $("#company-hero");
const endpointGroups = $("#endpoint-groups");
const statusPill = $("#status-pill");
const statusDetail = $("#status-detail");
const requestUrl = $("#request-url");
const responseBody = $("#response-body");
const activeEndpointLabel = $("#active-endpoint-label");
const copyBtn = $("#copy-btn");
const homeResultsSection = $("#home-results-section");
const homeResponse = $("#home-response");
const homeStatus = $("#home-status");
const searchUpstreamHint = $("#search-upstream-hint");

const FIELD_LABELS = {
  company_name: "Company name",
  company_number: "Company number",
  company_status: "Status",
  date_of_creation: "Incorporated",
  sic_codes: "SIC codes",
  registered_office_address: "Registered address",
  officer_role: "Role",
  appointed_on: "Appointed",
  notified_on: "Notified",
  active_count: "Active PSCs",
  total_count: "Total records",
  description: "Description",
  type: "Type",
  title: "Name",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function humanLabel(key) {
  return FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAddress(addr) {
  if (!addr || typeof addr !== "object") return "—";
  return [
    addr.premises,
    addr.address_line_1,
    addr.address_line_2,
    addr.locality,
    addr.region,
    addr.postal_code,
    addr.country,
  ]
    .filter(Boolean)
    .join(", ") || "—";
}

function formatPersonName(item) {
  if (item?.name) return item.name;
  const ne = item?.name_elements;
  if (ne) return [ne.forename, ne.surname].filter(Boolean).join(" ");
  return "—";
}

function lastPathSegment(path) {
  if (!path) return null;
  const parts = path.replace(/^\//, "").split("/");
  return parts[parts.length - 1] || null;
}

function documentIdFromLink(link) {
  if (!link) return null;
  const match = String(link).match(/\/document\/([^/?#]+)/);
  return match ? match[1] : null;
}

function documentContentUrl(documentId, accept = "application/pdf") {
  return `/api/documents/${encodeURIComponent(documentId)}/content?accept=${encodeURIComponent(accept)}`;
}

function addDocumentActions(documentId, container) {
  const actions = document.createElement("div");
  actions.className = "summary-list-item__actions";

  const metaBtn = document.createElement("button");
  metaBtn.type = "button";
  metaBtn.className = "drill-btn";
  metaBtn.textContent = "Metadata →";
  metaBtn.addEventListener("click", () =>
    runEndpoint("document-metadata", { document_id: documentId })
  );

  const pdfLink = document.createElement("a");
  pdfLink.className = "drill-btn drill-btn--link";
  pdfLink.href = documentContentUrl(documentId);
  pdfLink.target = "_blank";
  pdfLink.rel = "noopener noreferrer";
  pdfLink.textContent = "Open PDF ↗";

  actions.appendChild(metaBtn);
  actions.appendChild(pdfLink);
  container.appendChild(actions);
}

function buildDocumentIndexList(items, container) {
  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "summary-list-item";
    const title = item.description || item.type || "Filing document";
    const metaLine = [item.date, item.type, item.document_id].filter(Boolean).join(" · ");
    el.innerHTML = `
      <div class="summary-list-item__title">${escapeHtml(title)}</div>
      <div class="summary-list-item__meta">${escapeHtml(metaLine)}</div>
    `;
    if (item.document_id) addDocumentActions(item.document_id, el);
    container.appendChild(el);
  });
}

function setStatus(kind, label, detail = "") {
  statusPill.className = `status-pill status-pill--${kind}`;
  statusPill.textContent = label;
  statusDetail.textContent = detail;
}

function endpointById(id) {
  return meta.endpoints.find((e) => e.id === id);
}

async function apiRequest(endpointId, params) {
  if (!endpointId || !String(endpointId).trim()) {
    return {
      httpOk: false,
      status: 400,
      body: { ok: false, error: "No endpoint selected — this is a UI bug; refresh and try again." },
    };
  }

  const res = await fetch("/api/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpointId: String(endpointId).trim(), params: params || {} }),
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = { ok: false, error: `Invalid response from server (${res.status})` };
  }
  return { httpOk: res.ok, status: res.status, body };
}

function showView(name) {
  viewHome.classList.toggle("hidden", name !== "home");
  viewCompany.classList.toggle("hidden", name !== "company");
}

function navigateHome() {
  location.hash = "";
  showView("home");
}

function navigateCompany(companyNumber) {
  const hash = `#/company/${encodeURIComponent(companyNumber)}`;
  if (location.hash === hash) {
    openCompany(companyNumber);
  } else {
    location.hash = hash;
  }
}

async function ensureMeta() {
  if (meta) return meta;
  if (!metaReady) {
    metaReady = loadMeta();
  }
  await metaReady;
  return meta;
}

async function loadMeta() {
  const res = await fetch("/api/meta");
  if (!res.ok) {
    throw new Error(`Failed to load API metadata (${res.status})`);
  }
  meta = await res.json();
  envBadge.textContent = `${meta.environment.toUpperCase()} · ${meta.baseUrl}`;
  if (meta.environment === "sandbox") envBadge.classList.add("badge--sandbox");

  if (searchUpstreamHint && meta.searchBaseUrl) {
    const searchEnv = meta.searchEnvironment || "live";
    searchUpstreamHint.textContent = `Autocomplete search → ${searchEnv.toUpperCase()}: ${meta.searchBaseUrl}/search/companies?q=…`;
    if (meta.documentApiBaseUrl) {
      searchUpstreamHint.textContent += ` · Documents → ${meta.documentApiBaseUrl}`;
    }
  }
}

function renderCompanyHero(profile) {
  companyHero.innerHTML = `
    <div class="company-hero__title">${escapeHtml(profile.company_name || "Company")}</div>
    <div class="company-hero__meta">
      <span>#${escapeHtml(profile.company_number || "")}</span>
      <span>${escapeHtml(profile.company_status || "")}</span>
      <span>Incorporated ${escapeHtml(profile.date_of_creation || "—")}</span>
    </div>
    <div class="company-hero__address">${escapeHtml(formatAddress(profile.registered_office_address))}</div>
    ${profile.sic_codes?.length ? `<div class="company-hero__sic">SIC: ${escapeHtml(profile.sic_codes.join(", "))}</div>` : ""}
  `;
}

function buildEndpointSidebar() {
  endpointGroups.innerHTML = "";
  if (!meta?.groups || !meta?.endpoints) {
    endpointGroups.innerHTML = `<p class="hint">Loading endpoints…</p>`;
    return;
  }
  meta.groups.forEach((group) => {
    const eps = meta.endpoints.filter((e) => e.group === group.id && e.scope === "company");
    if (!eps.length) return;

    const block = document.createElement("div");
    block.className = "endpoint-group";
    block.innerHTML = `<div class="endpoint-group__label">${escapeHtml(group.label)}</div>`;

    eps.forEach((ep) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "endpoint-btn";
      btn.textContent = ep.label;
      if (ep.optional404) {
        btn.title = "May return no data for this company (Companies House 404 = nothing on file)";
        btn.classList.add("endpoint-btn--optional");
      } else if (ep.description) {
        btn.title = ep.description;
      }
      btn.addEventListener("click", () => runCompanyEndpoint(ep.id));
      block.appendChild(btn);
    });
    endpointGroups.appendChild(block);
  });
}

function row(label, value) {
  const el = document.createElement("div");
  el.className = "summary-row";
  el.innerHTML = `<span class="summary-label">${escapeHtml(label)}</span><span class="summary-value">${escapeHtml(value)}</span>`;
  return el;
}

function buildSummaryCard(title, subtitle) {
  const card = document.createElement("div");
  card.className = "summary-card";
  const h = document.createElement("h3");
  h.className = "summary-card__title";
  h.textContent = title;
  card.appendChild(h);
  if (subtitle) {
    const p = document.createElement("p");
    p.className = "summary-card__subtitle";
    p.textContent = subtitle;
    card.appendChild(p);
  }
  const body = document.createElement("div");
  body.className = "summary-card__body";
  card.appendChild(body);
  return { card, body };
}

function addDrillButton(label, endpointId, params, container) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "drill-btn";
  btn.textContent = label;
  btn.addEventListener("click", () => runEndpoint(endpointId, params));
  container.appendChild(btn);
}

function resolveDrill(item, drill, companyNumber) {
  if (!drill) return null;

  let value = null;
  let endpointId = drill.child;

  if (drill.from === "transaction_id" && item.transaction_id) {
    value = item.transaction_id;
  } else if (drill.from?.startsWith("links.")) {
    const linkKey = drill.from.replace("links.", "");
    const link = item.links?.[linkKey] || item.links?.self;
    value = lastPathSegment(link);
  }

  if (!value) return null;

  if (endpointId === "psc-individual" && item.links?.self) {
    const self = item.links.self;
    if (self.includes("/corporate-entity/")) endpointId = "psc-corporate";
    else if (self.includes("/legal-person/")) endpointId = "psc-legal-person";
  }

  const params = { company_number: companyNumber };
  params[drill.param] = value;
  return { endpointId, params };
}

function buildListItems(data, endpointId, container) {
  const ep = endpointById(endpointId);
  const items = data.items || [];
  const drill = ep?.drill;

  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "summary-list-item";

    let title = item.title || item.name || item.description || formatPersonName(item) || "Record";
    let metaLine = "";
    if (item.company_number) metaLine = `#${item.company_number}`;
    if (item.company_status) metaLine += (metaLine ? " · " : "") + item.company_status;
    if (item.officer_role) metaLine = `${item.officer_role} · Appointed ${item.appointed_on || "—"}`;
    if (item.date) metaLine = `${item.date} · ${item.type || ""}`;
    if (item.notified_on) metaLine = `Notified ${item.notified_on}`;

    el.innerHTML = `
      <div class="summary-list-item__title">${escapeHtml(title)}</div>
      ${metaLine ? `<div class="summary-list-item__meta">${escapeHtml(metaLine)}</div>` : ""}
    `;

    if (drill && currentCompany) {
      const resolved = resolveDrill(item, drill, currentCompany);
      if (resolved) {
        const actions = document.createElement("div");
        actions.className = "summary-list-item__actions";
        addDrillButton("View details →", resolved.endpointId, resolved.params, actions);
        el.appendChild(actions);
      }
    }

    if (endpointId === "search-officers" && item.links?.self) {
      const officerId = lastPathSegment(item.links.self);
      const actions = document.createElement("div");
      actions.className = "summary-list-item__actions";
      addDrillButton(
        "All appointments →",
        "officer-appointments-global",
        { officer_id: officerId },
        actions
      );
      el.appendChild(actions);
    }

    if (item.company_number && /search|alphabetical|advanced/.test(endpointId)) {
      el.classList.add("summary-list-item--clickable");
      el.addEventListener("click", (e) => {
        if (e.target.closest(".drill-btn")) return;
        navigateCompany(item.company_number);
      });
    }

    const docId = documentIdFromLink(item.links?.document_metadata);
    if (
      docId &&
      (endpointId === "filing-history" || endpointId === "filing-history-item")
    ) {
      addDocumentActions(docId, el);
    }

    container.appendChild(el);
  });
}

function buildFriendlySummary(data, endpointId) {
  const wrap = document.createElement("div");
  wrap.className = "summary-wrap";

  if (endpointId === "company-profile") {
    const { card, body } = buildSummaryCard(data.company_name || "Company profile");
    body.appendChild(row("Company number", data.company_number || "—"));
    body.appendChild(row("Status", data.company_status || "—"));
    body.appendChild(row("Incorporated", data.date_of_creation || "—"));
    body.appendChild(row("Registered address", formatAddress(data.registered_office_address)));
    body.appendChild(row("SIC codes", (data.sic_codes || []).join(", ") || "—"));
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "filing-documents-index") {
    const { card, body } = buildSummaryCard(
      "All filing documents",
      `${data.documents_found ?? 0} downloadable · ${data.total_filings ?? 0} filings scanned`
    );
    if (!data.items?.length) {
      body.appendChild(row("Documents", "No downloadable documents in filing history."));
    } else {
      buildDocumentIndexList(data.items, body);
    }
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "document-metadata") {
    const docId =
      data.document_id ||
      documentIdFromLink(data.links?.document) ||
      documentIdFromLink(data.links?.self);
    const { card, body } = buildSummaryCard("Document metadata", docId || "Document");
    if (data.company_number) body.appendChild(row("Company", data.company_number));
    if (data.barcode) body.appendChild(row("Barcode", data.barcode));
    if (data.significant_date) body.appendChild(row("Significant date", data.significant_date));
    if (data.category) body.appendChild(row("Category", data.category));

    const resources = data.resources || {};
    const types = Object.keys(resources);
    if (types.length && docId) {
      const formatRow = document.createElement("div");
      formatRow.className = "summary-row summary-row--formats";
      formatRow.innerHTML = `<span class="summary-label">Open as</span><span class="summary-value"></span>`;
      const value = formatRow.querySelector(".summary-value");
      types.forEach((ctype, idx) => {
        const link = document.createElement("a");
        link.className = "format-link";
        link.href = documentContentUrl(docId, ctype);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = ctype.replace("application/", "");
        value.appendChild(link);
        if (idx < types.length - 1) value.appendChild(document.createTextNode(" · "));
      });
      body.appendChild(formatRow);
    } else if (docId) {
      const dlRow = document.createElement("div");
      dlRow.className = "summary-row";
      dlRow.innerHTML = `<span class="summary-label">Download</span><span class="summary-value"></span>`;
      const dlVal = dlRow.querySelector(".summary-value");
      const link = document.createElement("a");
      link.className = "format-link";
      link.href = documentContentUrl(docId);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open PDF ↗";
      dlVal.appendChild(link);
      body.appendChild(dlRow);
    }

    wrap.appendChild(card);
    return wrap;
  }

  if (data?.items) {
    const ep = endpointById(endpointId);
    const { card, body } = buildSummaryCard(
      ep?.label || "Results",
      `${data.total_results ?? data.items.length} result(s)`
    );
    if (!data.items.length) body.appendChild(row("Results", "Nothing returned for this query."));
    else buildListItems(data, endpointId, body);
    wrap.appendChild(card);
    return wrap;
  }

  const { card, body } = buildSummaryCard(endpointById(endpointId)?.label || "Details");
  Object.entries(data).slice(0, 12).forEach(([k, v]) => {
    if (typeof v === "object" && v !== null) return;
    body.appendChild(row(humanLabel(k), String(v)));
  });
  wrap.appendChild(card);
  return wrap;
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
  summary.className = "tree-summary";
  summary.textContent = `${humanLabel(key)} (${isArray ? `${count} items` : `${count} fields`})`;

  const children = document.createElement("div");
  children.className = "tree-children";
  if (isArray) {
    value.forEach((item, i) => children.appendChild(buildJsonTree(item, `Item ${i + 1}`, depth + 1)));
  } else {
    Object.entries(value).forEach(([k, v]) => children.appendChild(buildJsonTree(v, k, depth + 1)));
  }

  details.appendChild(summary);
  details.appendChild(children);
  return details;
}

function appendTechnicalSection(container, payload) {
  const section = document.createElement("details");
  section.className = "tech-section";
  const summary = document.createElement("summary");
  summary.className = "tech-section__summary";
  summary.textContent = "Technical details (full JSON)";

  const toolbar = document.createElement("div");
  toolbar.className = "tech-toolbar";
  const expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.className = "btn-ghost btn-sm";
  expandBtn.textContent = "Expand all";
  const collapseBtn = document.createElement("button");
  collapseBtn.type = "button";
  collapseBtn.className = "btn-ghost btn-sm";
  collapseBtn.textContent = "Collapse all";
  toolbar.append(expandBtn, collapseBtn);

  const treeHost = document.createElement("div");
  treeHost.className = "tree-host";
  treeHost.appendChild(buildJsonTree(payload, "Response", 0));

  const inner = document.createElement("div");
  inner.className = "tech-section__inner";
  inner.append(toolbar, treeHost);
  section.append(summary, inner);
  container.appendChild(section);

  expandBtn.addEventListener("click", () => treeHost.querySelectorAll("details").forEach((d) => (d.open = true)));
  collapseBtn.addEventListener("click", () => treeHost.querySelectorAll("details").forEach((d) => (d.open = false)));
}

function parseError(body) {
  if (body.message) return body.message;
  if (body.status === 404 || body.upstreamStatus === 404) {
    return "No record on file for this company at Companies House.";
  }
  if (typeof body.error === "string" && body.error.trim()) {
    try {
      const parsed = JSON.parse(body.error);
      return parsed.message || parsed.error || body.error;
    } catch {
      return body.error;
    }
  }
  return "Something went wrong. Check your API key or try another query.";
}

function renderIntoPanel(panel, body, httpOk, endpointId) {
  panel.innerHTML = "";
  panel.classList.remove("empty-state");

  if (body.empty) {
    const infoCard = document.createElement("div");
    infoCard.className = "summary-info";
    infoCard.innerHTML = `<strong>Nothing on file</strong><p>${escapeHtml(body.message || "No data returned for this company.")}</p>`;
    if (body.hint) {
      const hint = document.createElement("p");
      hint.className = "summary-info__hint";
      hint.textContent = body.hint;
      infoCard.appendChild(hint);
    }
    panel.appendChild(infoCard);
    appendTechnicalSection(panel, body);
    return;
  }

  if (!httpOk || !body.ok) {
    const errCard = document.createElement("div");
    errCard.className = "summary-error";
    errCard.innerHTML = `<strong>Could not load data</strong><p>${escapeHtml(parseError(body))}</p>`;
    panel.appendChild(errCard);
    appendTechnicalSection(panel, body);
    return;
  }

  panel.appendChild(buildFriendlySummary(body.data, endpointId));
  appendTechnicalSection(panel, body.data);
}

function getResponseTarget(endpointId) {
  const ep = endpointById(endpointId);
  const onCompanyView = !viewCompany.classList.contains("hidden");
  const companyPanelScopes = ["company", "document"];
  if (!onCompanyView || !companyPanelScopes.includes(ep?.scope)) {
    homeResultsSection.classList.remove("hidden");
    return { panel: homeResponse, isHome: true };
  }
  return { panel: responseBody, isHome: false };
}

function renderResponse(body, httpOk, endpointId, target) {
  lastJson = JSON.stringify(body, null, 2);
  renderIntoPanel(target.panel, body, httpOk, endpointId);
  copyBtn.disabled = false;

  if (body.request?.url && !target.isHome) {
    requestUrl.textContent = `GET ${body.request.url}`;
  }

  if (target.isHome) {
    homeStatus.innerHTML = body.empty
      ? `<span class="status-pill status-pill--info">No data</span>`
      : httpOk && body.ok
      ? `<span class="status-pill status-pill--ok">${body.status || 200} OK</span>`
      : `<span class="status-pill status-pill--err">${body.status || "Error"}</span>`;
    return;
  }

  if (body.request?.url) requestUrl.textContent = `GET ${body.request.url}`;
  if (body.empty) {
    setStatus("info", "No data", body.message || "Nothing on file for this company");
  } else if (httpOk && body.ok) {
    setStatus("ok", `${body.status || 200} OK`, "Loaded successfully");
  } else {
    setStatus("err", `${body.status || "Error"}`, "See message below");
  }
}

async function runEndpoint(endpointId, extraParams = {}) {
  if (!endpointId) {
    console.error("runEndpoint called without endpointId");
    return;
  }
  const ep = endpointById(endpointId);
  const target = getResponseTarget(endpointId);

  if (!target.isHome) {
    activeEndpointLabel.textContent = ep?.label || "Response";
    setStatus("idle", "Loading…");
  } else {
    homeStatus.innerHTML = `<span class="status-pill status-pill--idle">Loading…</span>`;
  }

  const params = { ...extraParams };
  if (ep?.scope === "company" && currentCompany) {
    params.company_number = currentCompany;
  }

  try {
    const { httpOk, status, body } = await apiRequest(endpointId, params);
    body.status = status;
    renderResponse(body, httpOk, endpointId, target);
  } catch (err) {
    if (target.isHome) {
      homeStatus.innerHTML = `<span class="status-pill status-pill--err">Network error</span>`;
    } else {
      setStatus("err", "Network error", err.message);
    }
  }
}

async function runCompanyEndpoint(endpointId, extraParams = {}) {
  if (!currentCompany && endpointById(endpointId)?.scope === "company") return;
  await runEndpoint(endpointId, extraParams);
}

async function openCompany(companyNumber) {
  const seq = ++openCompanySeq;
  currentCompany = companyNumber;
  showView("company");
  companyHero.innerHTML = `<div class="company-hero__loading">Loading ${escapeHtml(companyNumber)}…</div>`;
  responseBody.innerHTML = "";
  responseBody.className = "response-panel empty-state";
  responseBody.textContent = "Loading company profile…";
  setStatus("idle", "Loading…", `Company ${companyNumber}`);

  try {
    await ensureMeta();
    if (seq !== openCompanySeq) return;

    buildEndpointSidebar();

    const { httpOk, status, body } = await apiRequest("company-profile", {
      company_number: companyNumber,
    });
    if (seq !== openCompanySeq) return;

    if (httpOk && body.ok) {
      currentCompany = body.data.company_number || companyNumber;
      renderCompanyHero(body.data);
      body.status = status;
      renderResponse(body, true, "company-profile", {
        panel: responseBody,
        isHome: false,
      });
    } else {
      body.status = status;
      companyHero.innerHTML = `<div class="summary-error"><strong>Could not load company</strong><p>${escapeHtml(parseError(body))}</p></div>`;
      renderIntoPanel(responseBody, body, false, "company-profile");
      setStatus("err", `${status} Error`, "See message below");
    }
  } catch (err) {
    if (seq !== openCompanySeq) return;
    companyHero.innerHTML = `<div class="summary-error"><strong>Error</strong><p>${escapeHtml(err.message)}</p></div>`;
    responseBody.textContent = err.message;
    setStatus("err", "Failed", err.message);
    console.error(err);
  }
}

function bindSuggestions(items, message) {
  suggestions.innerHTML = "";
  if (!items.length) {
    suggestions.classList.remove("hidden");
    const li = document.createElement("li");
    li.className = "suggestion-item suggestion-item--empty";
    li.textContent = message || "No companies found — try more letters or a different name.";
    suggestions.appendChild(li);
    return;
  }
  suggestions.classList.remove("hidden");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "suggestion-item";
    li.role = "option";
    li.innerHTML = `
      <span class="suggestion-item__title">${escapeHtml(item.title || "—")}</span>
      <span class="suggestion-item__meta">#${escapeHtml(item.company_number || "")} · ${escapeHtml(item.company_status || "")}</span>
    `;
    li.addEventListener("click", () => {
      suggestions.classList.add("hidden");
      homeSearch.value = item.title || "";
      navigateCompany(item.company_number);
    });
    suggestions.appendChild(li);
  });
}

async function fetchSuggestions(q) {
  if (q.length < 2) {
    suggestions.classList.add("hidden");
    return;
  }
  try {
    const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (data.upstreamUrl && searchUpstreamHint) {
      searchUpstreamHint.textContent = `Last query → GET ${data.upstreamUrl}`;
    }
    if (!res.ok) {
      bindSuggestions([], data.error || "Search failed — check API key in secrets.env");
      return;
    }
    bindSuggestions(data.items || [], data.message);
  } catch {
    bindSuggestions([], "Could not reach local server — is ./run-ui.sh running?");
  }
}

async function runHomeSearch(endpointId, params) {
  homeResultsSection.classList.remove("hidden");
  await runEndpoint(endpointId, params);
}

function paramsForHomeEndpoint(endpointId) {
  switch (endpointId) {
    case "search-companies":
      return { q: homeSearch.value.trim() };
    case "search-all":
      return { q: $("#tool-search-all").value.trim() };
    case "search-officers":
      return { q: $("#tool-search-officers").value.trim() };
    case "alphabetical-search":
      return { starts_with: $("#tool-alpha").value.trim().toUpperCase() };
    case "advanced-search-companies":
      return { company_name_includes: $("#tool-advanced-name").value.trim() };
    default:
      return {};
  }
}

function bindHomeTools() {
  document.querySelectorAll(".run-search-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-ch-endpoint");
      if (!id) return;
      runHomeSearch(id, paramsForHomeEndpoint(id));
    });
  });
}

function handleRoute() {
  const match = location.hash.match(/^#\/company\/(.+)$/);
  if (match) openCompany(decodeURIComponent(match[1]));
  else {
    showView("home");
    currentCompany = null;
  }
}

homeSearch.addEventListener("input", () => {
  clearTimeout(suggestTimer);
  const q = homeSearch.value.trim();
  suggestTimer = setTimeout(() => fetchSuggestions(q), 280);
});

homeSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && homeSearch.value.trim()) {
    suggestions.classList.add("hidden");
    runHomeSearch("search-companies", { q: homeSearch.value.trim() });
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) suggestions.classList.add("hidden");
});

$("#back-btn").addEventListener("click", navigateHome);
copyBtn.addEventListener("click", async () => {
  if (!lastJson) return;
  await navigator.clipboard.writeText(lastJson);
  setStatus("ok", "Copied", "JSON copied");
});

window.addEventListener("hashchange", handleRoute);

loadMeta()
  .then(() => {
    bindHomeTools();
    handleRoute();
  })
  .catch((err) => {
    envBadge.textContent = "Setup failed";
    console.error(err);
  });

// Preload metadata so suggestion clicks work immediately
ensureMeta().catch((err) => console.error("Meta preload failed:", err));
