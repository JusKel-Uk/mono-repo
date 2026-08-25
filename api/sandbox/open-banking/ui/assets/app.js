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
  statusPillEl.textContent = state === "loading" ? "Loading…" : state === "ok" ? "OK" : state === "error" ? "Error" : "Ready";
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
  if (isArray) {
    value.forEach((item, i) => inner.appendChild(buildJsonTree(item, String(i), depth + 1)));
  } else {
    Object.entries(value).forEach(([k, v]) => inner.appendChild(buildJsonTree(v, k, depth + 1)));
  }
  details.appendChild(inner);
  return details;
}

function buildFriendlySummary(payload, endpointId) {
  const wrap = document.createElement("div");
  wrap.className = "summary-wrap";
  const data = payload.data ?? payload;

  if (endpointId.startsWith("setup") && data.access_token) {
    const { card, body } = buildSummaryCard("Connected", data.institution_id || "sandbox");
    body.appendChild(row("Item ID", data.item_id || "—"));
    body.appendChild(row("Access token", "Saved to secrets.env (not shown)"));
    body.appendChild(row("Status", data.message || "Ready to fetch bank data"));
    wrap.appendChild(card);
    return wrap;
  }

  if (data.error_code) {
    const { card, body } = buildSummaryCard("Plaid error", data.error_code);
    body.appendChild(row("Message", data.error_message || "—"));
    if (data.error_code === "ITEM_LOGIN_REQUIRED") {
      body.appendChild(row("Hint", "Try Connect sandbox (simple) or UK OAuth via Link"));
    }
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "accounts" && data.accounts) {
    const { card, body } = buildSummaryCard("Accounts", `${data.accounts.length} account(s)`);
    data.accounts.forEach((acc) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `
        <div class="summary-list-item__title">${escapeHtml(acc.name || acc.official_name || "Account")}</div>
        <div class="summary-list-item__meta">${escapeHtml(acc.type || "")} · ${escapeHtml(acc.subtype || "")} · ${escapeHtml(acc.mask ? `···${acc.mask}` : "")}</div>
        <div class="summary-list-item__meta">${escapeHtml(acc.account_id || "")}</div>
      `;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "balances" && data.accounts) {
    const { card, body } = buildSummaryCard("Balances", `${data.accounts.length} account(s)`);
    data.accounts.forEach((acc) => {
      const bal = acc.balances || {};
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `
        <div class="summary-list-item__title">${escapeHtml(acc.name || "Account")}</div>
        <div class="summary-list-item__meta">Current: ${escapeHtml(money(bal.current, bal.iso_currency_code))}</div>
        <div class="summary-list-item__meta">Available: ${escapeHtml(money(bal.available, bal.iso_currency_code))}</div>
      `;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "transactions" && data.transactions) {
    const total = data.total_transactions ?? data.transactions.length;
    const { card, body } = buildSummaryCard("Transactions", `${total} in range`);
    data.transactions.slice(0, 25).forEach((tx) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      const amt = tx.amount != null ? money(tx.amount, tx.iso_currency_code) : "—";
      item.innerHTML = `
        <div class="summary-list-item__title">${escapeHtml(tx.name || tx.merchant_name || "Transaction")}</div>
        <div class="summary-list-item__meta">${escapeHtml(tx.date || "")} · ${escapeHtml(amt)} · ${escapeHtml(tx.pending ? "pending" : "posted")}</div>
      `;
      body.appendChild(item);
    });
    if (data.transactions.length > 25) {
      body.appendChild(row("Note", "Showing first 25 — full list in JSON below"));
    }
    wrap.appendChild(card);
    return wrap;
  }

  if (endpointId === "institutions" && data.institutions) {
    const { card, body } = buildSummaryCard("Institutions", `${data.institutions.length} shown`);
    data.institutions.forEach((inst) => {
      const item = document.createElement("div");
      item.className = "summary-list-item";
      item.innerHTML = `
        <div class="summary-list-item__title">${escapeHtml(inst.name || "Institution")}</div>
        <div class="summary-list-item__meta">${escapeHtml(inst.institution_id || "")}</div>
      `;
      body.appendChild(item);
    });
    wrap.appendChild(card);
    return wrap;
  }

  const { card, body } = buildSummaryCard(endpointById(endpointId)?.label || "Response");
  body.appendChild(row("Keys", Object.keys(data).join(", ") || "—"));
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
  const rawData = payload.data ?? payload;
  treeWrap.appendChild(buildJsonTree(rawData));
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
  responseBodyEl.innerHTML = "<p class='loading-text'>Calling Plaid sandbox…</p>";
  copyBtn.disabled = true;

  try {
    const res = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpointId }),
    });
    const payload = await res.json();
    if (payload.hasAccessToken) {
      meta.hasAccessToken = true;
      tokenBannerEl.classList.add("hidden");
    }
    if (payload.ok) {
      setStatus("ok", res.status === 200 ? "Success" : "");
      renderResponse(payload, endpointId);
    } else {
      setStatus("error", payload.error || payload.data?.plaid?.error_message || "Request failed");
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
        btn.dataset.endpointId = ep.id;
        if (ep.needsToken && !meta.hasAccessToken) {
          btn.classList.add("endpoint-btn--muted");
        }
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
  envBadgeEl.textContent = `Plaid · ${meta.baseUrl}`;
  if (!meta.hasAccessToken) {
    tokenBannerEl.classList.remove("hidden");
  }
  buildSidebar();
}

init();
