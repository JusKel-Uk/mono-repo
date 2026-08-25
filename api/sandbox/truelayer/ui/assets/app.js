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

function money(amount, currency) {
  if (amount == null) return "—";
  const n = Number(amount);
  const code = currency || "GBP";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: code }).format(n);
  } catch {
    return `${n} ${code}`;
  }
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

function row(label, value) {
  const el = document.createElement("div");
  el.className = "summary-row";
  el.innerHTML = `<span class="summary-label">${escapeHtml(label)}</span><span class="summary-value">${escapeHtml(value)}</span>`;
  return el;
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

function buildFriendlySummary(payload, endpointId) {
  const wrap = document.createElement("div");
  wrap.className = "summary-wrap";
  const inner = payload.data ?? payload;

  if (endpointId === "auth-link" && inner.auth_link) {
    const { card, body } = buildSummaryCard("Auth link", inner.mock_bank_login || "Mock Bank");
    const linkRow = document.createElement("div");
    linkRow.className = "summary-row";
    linkRow.innerHTML = `<span class="summary-label">Open</span><span class="summary-value"><a class="format-link" href="${escapeHtml(inner.auth_link)}" target="_blank" rel="noopener">Connect Mock Bank ↗</a></span>`;
    body.appendChild(linkRow);
    body.appendChild(row("Redirect URI", inner.redirect_uri || "—"));
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "exchange" && inner.access_token_saved) {
    const { card, body } = buildSummaryCard("Token saved", inner.message || "Ready");
    wrap.appendChild(card);
    return wrap;
  }

  const accounts = inner.results || inner.accounts;
  if (endpointId === "accounts" && accounts) {
    const { card, body } = buildSummaryCard("Accounts", `${accounts.length} account(s)`);
    accounts.forEach((acc) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(acc.display_name || acc.account_type || "Account")}</div>
        <div class="summary-list-item__meta">${escapeHtml(acc.currency || "")} · ${escapeHtml(acc.account_id || "")}</div>`;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "balances" && inner.results) {
    const bal = Array.isArray(inner.results) ? inner.results[0] : inner.results;
    const { card, body } = buildSummaryCard("Balance");
    body.appendChild(row("Current", money(bal.current, bal.currency)));
    body.appendChild(row("Available", money(bal.available, bal.currency)));
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "transactions" && inner.results) {
    const { card, body } = buildSummaryCard("Transactions", `${inner.results.length} shown`);
    inner.results.slice(0, 25).forEach((tx) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(tx.description || tx.merchant_name || "Transaction")}</div>
        <div class="summary-list-item__meta">${escapeHtml(tx.timestamp?.slice(0, 10) || "")} · ${escapeHtml(money(tx.amount, tx.currency))}</div>`;
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
  jsonHead.className = "json-collapse";
  jsonHead.innerHTML = "<summary>Raw JSON</summary>";
  const treeWrap = document.createElement("div");
  treeWrap.className = "json-tree";
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
  responseBodyEl.innerHTML = "<p class='loading-text'>Calling TrueLayer sandbox…</p>";
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
  runEndpoint("exchange", { code });
});

async function init() {
  const res = await fetch("/api/meta");
  meta = await res.json();
  if (meta.error) {
    envBadgeEl.textContent = "secrets missing";
    responseBodyEl.textContent = meta.error;
    return;
  }
  envBadgeEl.textContent = `TrueLayer · ${meta.apiBase}`;
  if (meta.redirectUri && callbackHintEl) callbackHintEl.textContent = meta.redirectUri;
  if (!meta.hasAccessToken) tokenBannerEl.classList.remove("hidden");
  buildSidebar();
}

init();
