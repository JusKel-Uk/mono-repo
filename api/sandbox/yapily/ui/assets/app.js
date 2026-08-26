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
const callbackHintEl = document.getElementById("callback-hint");

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

  if (endpointId === "connect" && inner.authorisationUrl) {
    const { card, body } = buildSummaryCard("Connect", inner.sandbox_login || "mits / mits");
    const linkRow = document.createElement("div");
    linkRow.className = "summary-row";
    linkRow.innerHTML = `<span class="summary-label">Open</span><span class="summary-value"><a class="format-link" href="${escapeHtml(inner.authorisationUrl)}" target="_blank" rel="noopener">Authorise at bank ↗</a></span>`;
    body.appendChild(linkRow);
    body.appendChild(row("Callback", inner.callback || "—"));
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "institutions" && inner.data) {
    const list = inner.data;
    const { card, body } = buildSummaryCard("Institutions", `${list.length} listed`);
    list.slice(0, 15).forEach((inst) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(inst.name || "Institution")}</div>
        <div class="summary-list-item__meta">${escapeHtml(inst.id || "")}</div>`;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "accounts" && Array.isArray(inner.data)) {
    const { card, body } = buildSummaryCard("Accounts", `${inner.data.length} account(s)`);
    inner.data.forEach((acc) => {
      const bal = acc.balance || acc.accountBalances?.[0]?.balanceAmount || {};
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(acc.accountNames?.[0]?.name || acc.type || "Account")}</div>
        <div class="summary-list-item__meta">${escapeHtml(money(bal.amount ?? bal.current, bal.currency || acc.currency))}</div>`;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "transactions" && Array.isArray(inner.data)) {
    const { card, body } = buildSummaryCard("Transactions", `${inner.data.length} shown`);
    inner.data.slice(0, 25).forEach((tx) => {
      const amt = tx.amount ?? tx.transactionAmount?.amount;
      const cur = tx.currency ?? tx.transactionAmount?.currency;
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `<div class="summary-list-item__title">${escapeHtml(tx.description || tx.merchant?.name || "Transaction")}</div>
        <div class="summary-list-item__meta">${escapeHtml(tx.date || tx.bookingDateTime?.slice(0, 10) || "")} · ${escapeHtml(money(amt, cur))}</div>`;
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

async function runEndpoint(endpointId) {
  const ep = endpointById(endpointId);
  activeLabelEl.textContent = ep?.label || endpointId;
  setStatus("loading");
  requestUrlEl.textContent = `POST /api/request → ${endpointId}`;
  responseBodyEl.innerHTML = "<p class='loading-text'>Calling Yapily API…</p>";
  copyBtn.disabled = true;
  try {
    const res = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpointId }),
    });
    const payload = await res.json();
    if (payload.hasConsentToken) {
      meta.hasConsentToken = true;
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
        if (ep.needsToken && !meta.hasConsentToken) btn.classList.add("endpoint-btn--muted");
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

async function init() {
  const res = await fetch("/api/meta");
  meta = await res.json();
  if (meta.error) {
    envBadgeEl.textContent = "secrets missing";
    responseBodyEl.textContent = meta.error;
    return;
  }
  envBadgeEl.textContent = `Yapily · ${meta.institutionId}`;
  if (meta.callbackUrl) callbackHintEl.textContent = meta.callbackUrl;
  if (!meta.hasConsentToken) tokenBannerEl.classList.remove("hidden");
  buildSidebar();
}

init();
