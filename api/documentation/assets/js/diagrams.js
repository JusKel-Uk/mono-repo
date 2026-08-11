/**
 * JusKel reusable diagram components.
 * Usage: JKDiagram.renderFlow(el, nodes) | JKDiagram.renderLegend(el, items) | JKDiagram.initPage()
 */
(function (global) {
  "use strict";

  var ROLES = {
    client:    { fill: "#dbeafe", stroke: "#60a5fa", text: "#1e3a5f" },
    frontend:  { fill: "#e0e7ff", stroke: "#818cf8", text: "#312e81" },
    api:       { fill: "#e0f2fe", stroke: "#38bdf8", text: "#0c4a6e" },
    data:      { fill: "#ccfbf1", stroke: "#2dd4bf", text: "#134e4a" },
    decision:  { fill: "#f3e8ff", stroke: "#c084fc", text: "#581c87" },
    storage:   { fill: "#d1fae5", stroke: "#34d399", text: "#065f46" },
    ai:        { fill: "#cffafe", stroke: "#22d3ee", text: "#164e63" },
    external:  { fill: "#f1f5f9", stroke: "#94a3b8", text: "#475569" },
    platform:  { fill: "#ede9fe", stroke: "#a78bfa", text: "#4c1d95" },
    module:    { fill: "#fce7f3", stroke: "#f472b6", text: "#831843" },
    later:     { fill: "#f8fafc", stroke: "#cbd5e1", text: "#64748b" }
  };

  var CONNECTOR = "#7c9ab8";

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function roleClass(role) {
    return "shape--role-" + (role || "api");
  }

  function shapeHtml(node) {
    var type = node.type || "rect";
    var role = node.role || "api";
    var label = esc(node.label || "");
    var sub = node.sub ? "<small>" + esc(node.sub) + "</small>" : "";
    var cls = "shape shape--" + type + " " + roleClass(role);

    if (type === "diamond") {
      return (
        '<div class="shape--diamond-wrap">' +
        '<div class="' + cls + ' shape--diamond">' +
        '<span class="shape__inner">' + label + "</span></div></div>"
      );
    }

    return '<div class="' + cls + '">' + label + sub + "</div>";
  }

  function arrowHtml() {
    return '<div class="diagram-flow__arrow"></div>';
  }

  function renderFlow(container, nodes) {
    if (!container) return;
    var html = "";
    nodes.forEach(function (node, i) {
      if (i > 0) html += arrowHtml();
      html += shapeHtml(node);
    });
    container.innerHTML = html;
  }

  function renderLegend(container, items) {
    if (!container) return;
    var html = "";
    items.forEach(function (item) {
      var role = ROLES[item.role] || ROLES.api;
      var swatchClass = "diagram-legend__swatch";
      if (item.shape === "circle") swatchClass += " diagram-legend__swatch--circle";
      if (item.shape === "diamond") swatchClass += " diagram-legend__swatch--diamond";
      html +=
        '<div class="diagram-legend__item">' +
        '<span class="' + swatchClass + '" style="background:' + role.fill + ";border-color:" + role.stroke + '"></span>' +
        esc(item.label) +
        "</div>";
    });
    container.innerHTML = html;
  }

  function renderPersonaTree(container, root) {
    if (!container) return;
    var branches = root.children.map(function (child) {
      return (
        '<div class="diagram-tree__branch">' +
        shapeHtml(child) +
        "</div>"
      );
    }).join("");

    container.innerHTML =
      '<div class="diagram-tree">' +
      shapeHtml(root) +
      '<div class="diagram-tree__connector-v"></div>' +
      '<div class="diagram-tree__level">' + branches + "</div>" +
      "</div>";
  }

  function renderGroupGrid(container, groupLabel, nodes) {
    if (!container) return;
    var cells = nodes.map(function (n) {
      return '<div class="diagram-tree__branch">' + shapeHtml(n) + "</div>";
    }).join("");

    container.innerHTML =
      '<div class="diagram-group">' +
      '<span class="diagram-group__label">' + esc(groupLabel) + "</span>" +
      '<div class="diagram-tree__level">' + cells + "</div>" +
      "</div>";
  }

  function svgDefs(markerId) {
    return (
      "<defs>" +
      '<marker id="' + markerId + '" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">' +
      '<polygon points="0 0, 8 4, 0 8" fill="' + CONNECTOR + '"/>' +
      "</marker></defs>"
    );
  }

  function svgRect(x, y, w, h, node, rx) {
    var role = ROLES[node.role] || ROLES.api;
    rx = rx == null ? 6 : rx;
    var label = node.label || "";
    var sub = node.sub || "";
    var ty = sub ? y + h / 2 - 4 : y + h / 2 + 4;
    var subEl = sub
      ? '<text class="shape-sublabel" x="' + (x + w / 2) + '" y="' + (y + h / 2 + 14) + '" text-anchor="middle">' + esc(sub) + "</text>"
      : "";
    var dash = node.role === "later" ? ' stroke-dasharray="4 3"' : "";
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"' +
      ' fill="' + role.fill + '" stroke="' + role.stroke + '" stroke-width="2"' + dash + "/>" +
      '<text class="shape-label" x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" fill="' + role.text + '">' + esc(label) + "</text>" +
      subEl
    );
  }

  function svgEllipse(cx, cy, rx, ry, node) {
    var role = ROLES[node.role] || ROLES.client;
    var sub = node.sub
      ? '<text class="shape-sublabel" x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle">' + esc(node.sub) + "</text>"
      : "";
    return (
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '"' +
      ' fill="' + role.fill + '" stroke="' + role.stroke + '" stroke-width="2"/>' +
      '<text class="shape-label" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="' + role.text + '">' + esc(node.label) + "</text>" +
      sub
    );
  }

  function svgDiamond(cx, cy, size, node) {
    var role = ROLES[node.role] || ROLES.decision;
    var half = size / 2;
    return (
      '<polygon points="' + cx + "," + (cy - half) + " " + (cx - half) + "," + cy + " " + cx + "," + (cy + half) + " " + (cx + half) + "," + cy + '"' +
      ' fill="' + role.fill + '" stroke="' + role.stroke + '" stroke-width="2"/>' +
      '<text class="shape-sublabel" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="' + role.text + '">' + esc(node.label) + "</text>"
    );
  }

  function svgTriangle(cx, cy, node) {
    var role = ROLES[node.role] || ROLES.external;
    return (
      '<polygon points="' + cx + "," + (cy - 30) + " " + (cx - 40) + "," + (cy + 30) + " " + (cx + 40) + "," + (cy + 30) + '"' +
      ' fill="' + role.fill + '" stroke="' + role.stroke + '" stroke-width="2"/>' +
      '<text class="shape-label" x="' + cx + '" y="' + (cy + 8) + '" text-anchor="middle" fill="' + role.text + '">' + esc(node.label) + "</text>"
    );
  }

  function svgLine(x1, y1, x2, y2, markerId, dashed) {
    var cls = dashed ? "connector connector--dashed" : "connector";
    var marker = markerId ? ' marker-end="url(#' + markerId + ')"' : "";
    return '<line class="' + cls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + marker + "/>";
  }

  function svgLabel(x, y, text) {
    return '<text class="shape-sublabel" x="' + x + '" y="' + y + '">' + esc(text) + "</text>";
  }

  function renderPlatformArchitectureTree(svg) {
    if (!svg) return;
    var m = "jk-arrow-platform";
    var s = "";

    s += svgDefs(m);
    s += svgRect(310, 16, 200, 44, { label: "JusKel Platform MVP", role: "platform" });
    s += svgLine(410, 60, 410, 88, m);
    s += svgLine(120, 88, 700, 88, null);
    s += svgLine(120, 88, 120, 108, m);
    s += svgLine(280, 88, 280, 108, m);
    s += svgLine(410, 88, 410, 108, m);
    s += svgLine(540, 88, 540, 108, m);
    s += svgLine(700, 88, 700, 108, m);

    s += svgEllipse(120, 148, 52, 32, { label: "Next.js", role: "frontend" });
    s += svgRect(218, 120, 124, 56, { label: ".NET API", sub: "Modular monolith", role: "api" });
    s += svgRect(358, 120, 104, 56, { label: "SQL Server", role: "data" });
    s += svgRect(488, 120, 104, 56, { label: "Blob", sub: "Storage", role: "storage" });
    s += svgRect(648, 120, 104, 56, { label: "Azure", sub: "OpenAI", role: "ai" });

    s += svgLine(280, 176, 280, 204, m);
    s += '<rect x="168" y="204" width="224" height="28" rx="4" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="5 3"/>';
    s += svgLabel(280, 198, "Internal modules");

    s += svgLine(210, 232, 350, 232, null);
    s += svgLine(210, 232, 210, 252, null);
    s += svgLine(280, 232, 280, 252, null);
    s += svgLine(350, 232, 350, 252, null);

    s += svgRect(158, 252, 104, 40, { label: "Scoring", role: "module" });
    s += svgRect(228, 252, 104, 40, { label: "Funding", role: "module" });
    s += svgRect(298, 252, 104, 40, { label: "Users", role: "module" });

    s += svgLine(540, 176, 540, 300, m, true);
    s += svgTriangle(540, 330, { label: "External", role: "external" });
    s += svgLine(500, 360, 420, 360, null, true);
    s += svgLine(580, 360, 660, 360, null, true);
    s += svgRect(340, 340, 100, 40, { label: "Companies House", role: "external" });
    s += svgRect(610, 340, 100, 40, { label: "DocuSign", role: "external" });

    s += svgRect(36, 340, 72, 72, { label: "Open Banking", role: "later" });
    s += svgLabel(72, 376, "(later)");
    s += svgLine(120, 180, 72, 340, null, true);

    svg.innerHTML = s;
    svg.setAttribute("aria-label", "Platform architecture tree");
  }

  function renderMvpDataFlow(svg) {
    if (!svg) return;
    var m = "jk-arrow-flow";
    var s = svgDefs(m);

    s += svgRect(20, 70, 100, 48, { label: "SME Input", role: "client" });
    s += svgLine(120, 94, 155, 94, m);
    s += '<polygon points="200,94 170,64 170,124" fill="' + ROLES.frontend.fill + '" stroke="' + ROLES.frontend.stroke + '" stroke-width="2"/>';
    s += svgLabel(188, 98, "ESG");
    s += svgLine(200, 94, 235, 94, m);
    s += svgRect(235, 70, 120, 48, { label: "Rule-based", sub: "Scoring Engine", role: "module" });
    s += svgLine(355, 94, 390, 94, m);
    s += '<polygon points="430,54 400,94 460,94" fill="' + ROLES.decision.fill + '" stroke="' + ROLES.decision.stroke + '" stroke-width="2"/>';
    s += svgLabel(430, 82, "Match?");
    s += svgLine(460, 94, 495, 94, m);
    s += svgLabel(478, 86, "Yes");
    s += svgRect(495, 70, 120, 48, { label: "Funding Match", role: "api" });
    s += svgLine(615, 94, 650, 94, m);
    s += svgEllipse(710, 94, 56, 32, { label: "Dashboard", role: "frontend" });
    s += svgLine(430, 94, 430, 160, m);
    s += svgLabel(442, 130, "No");
    s += svgRect(370, 160, 120, 36, { label: "Improvement actions", role: "later" });

    svg.innerHTML = s;
    svg.setAttribute("aria-label", "MVP data flow");
  }

  function renderSigninComponentTree(svg) {
    if (!svg) return;
    var m = "jk-arrow-signin";
    var s = svgDefs(m);

    s += svgRect(220, 12, 200, 44, { label: "Sign-in Module", role: "module" });
    s += svgLine(320, 56, 320, 80, m);
    s += svgLine(120, 80, 520, 80, null);
    s += svgLine(120, 80, 120, 100, m);
    s += svgLine(320, 80, 320, 100, m);
    s += svgLine(520, 80, 520, 100, m);

    s += svgRect(60, 100, 120, 48, { label: "Controller", sub: "HTTP endpoints", role: "api" });
    s += svgRect(260, 100, 120, 48, { label: "Service", sub: "Auth logic", role: "api" });
    s += svgRect(460, 100, 120, 48, { label: "Repository", sub: "Data access", role: "data" });

    s += svgLine(320, 148, 320, 172, m);
    s += svgLine(180, 172, 460, 172, null);
    s += svgLine(180, 172, 180, 192, m);
    s += svgLine(320, 172, 320, 192, m);
    s += svgLine(460, 172, 460, 192, m);

    s += svgRect(120, 192, 120, 40, { label: "Password Hash", role: "module" });
    s += '<polygon points="320,192 290,232 350,232" fill="' + ROLES.decision.fill + '" stroke="' + ROLES.decision.stroke + '" stroke-width="2"/>';
    s += svgLabel(320, 220, "Valid?");
    s += svgRect(400, 192, 120, 40, { label: "JWT Issuer", role: "api" });

    s += svgLine(320, 232, 320, 260, m);
    s += svgLabel(332, 250, "Yes");
    s += svgEllipse(320, 296, 64, 32, { label: "Token Response", role: "frontend" });

    s += svgLine(290, 212, 200, 300, null, true);
    s += svgLine(200, 300, 200, 330, m, true);
    s += svgLabel(268, 268, "No");
    s += svgRect(140, 330, 120, 36, { label: "401 Unauthorized", role: "later" });

    s += svgLine(520, 148, 520, 330, m);
    s += svgRect(460, 330, 120, 44, { label: "SQL Server", sub: "users · sessions", role: "storage" });

    svg.innerHTML = s;
    svg.setAttribute("aria-label", "Sign-in component tree");
  }

  function renderIdentityOtpFlow(svg) {
    if (!svg) return;
    var m = "jk-arrow-identity-otp";
    var s = svgDefs(m);

    s += '<text class="shape-sublabel" x="20" y="24" font-weight="600">A. Registration &amp; OTP delivery</text>';
    s += svgEllipse(56, 58, 40, 22, { label: "User", role: "client" });
    s += svgLine(96, 58, 128, 58, m);
    s += svgRect(128, 38, 148, 40, { label: "POST /identity/users", role: "api" });
    s += svgLine(276, 58, 308, 58, m);
    s += svgRect(308, 38, 120, 40, { label: "Issue OTP hash", role: "module" });
    s += svgLine(428, 58, 460, 58, m);
    s += svgRect(460, 38, 130, 40, { label: "Resend email", sub: "hello@juskel.co.uk", role: "external" });
    s += svgLine(590, 58, 622, 58, m);
    s += svgRect(622, 38, 120, 40, { label: "emailVerified", sub: "false", role: "data" });

    s += '<text class="shape-sublabel" x="20" y="128" font-weight="600">B. Sign-in — unverified user (frontend nuance)</text>';
    s += svgEllipse(56, 162, 40, 22, { label: "User", role: "client" });
    s += svgLine(96, 162, 128, 162, m);
    s += svgRect(128, 142, 156, 40, { label: "POST /identity/sessions", role: "api" });
    s += svgLine(284, 162, 316, 162, m);
    s += svgDiamond(356, 162, 56, { label: "Password OK?" });
    s += svgLine(384, 162, 416, 162, m);
    s += svgLabel(392, 154, "Yes");
    s += svgDiamond(476, 162, 64, { label: "Verified?" });
    s += svgLine(508, 162, 540, 162, m);
    s += svgLabel(516, 154, "Yes");
    s += svgRect(540, 142, 110, 40, { label: "201 + JWT", role: "frontend" });

    s += svgLine(328, 162, 328, 200, null, true);
    s += svgLabel(336, 188, "No");
    s += svgRect(268, 200, 120, 36, { label: "400 Invalid", sub: "credentials", role: "later" });

    s += svgLine(476, 190, 476, 228, m);
    s += svgLabel(488, 214, "No");
    s += svgRect(406, 228, 140, 52, { label: "403 Forbidden", sub: "errorCode: EMAIL_NOT_VERIFIED", role: "decision" });
    s += svgLabel(476, 268, "email in body");

    s += '<text class="shape-sublabel" x="20" y="318" font-weight="600">C. Recovery paths (from 403 screen)</text>';
    s += svgRect(40, 338, 160, 44, { label: "OTP entry screen", sub: "pre-fill email from 403", role: "frontend" });
    s += svgLine(200, 360, 232, 360, m);
    s += svgDiamond(268, 360, 56, { label: "Action?" });

    s += svgLine(296, 360, 328, 360, m);
    s += svgLabel(304, 352, "Verify");
    s += svgRect(328, 340, 168, 40, { label: "POST /identity/verification", role: "api" });
    s += svgLine(496, 360, 528, 360, m);
    s += svgRect(528, 340, 120, 40, { label: "emailVerified", sub: "true", role: "data" });

    s += svgLine(268, 388, 268, 416, m);
    s += svgLabel(280, 404, "Resend");
    s += svgRect(188, 416, 188, 40, { label: "POST /verification/resend", sub: "202 Accepted", role: "api" });
    s += svgLine(376, 436, 408, 436, m);
    s += svgRect(408, 416, 130, 40, { label: "New OTP emailed", role: "external" });

    s += svgLine(588, 360, 648, 360, m);

    s += svgLine(648, 360, 680, 360, m);
    s += svgRect(680, 340, 156, 40, { label: "Retry sign-in", sub: "POST /sessions → 201", role: "frontend" });

    svg.innerHTML = s;
    svg.setAttribute("aria-label", "Identity OTP onboarding and sign-in flow");
  }

  function initPage() {
    document.querySelectorAll("[data-jk-flow]").forEach(function (el) {
      try {
        renderFlow(el, JSON.parse(el.getAttribute("data-jk-flow")));
      } catch (e) { /* ignore */ }
    });

    document.querySelectorAll("[data-jk-legend]").forEach(function (el) {
      try {
        renderLegend(el, JSON.parse(el.getAttribute("data-jk-legend")));
      } catch (e) { /* ignore */ }
    });

    document.querySelectorAll("[data-jk-persona-tree]").forEach(function (el) {
      try {
        renderPersonaTree(el, JSON.parse(el.getAttribute("data-jk-persona-tree")));
      } catch (e) { /* ignore */ }
    });

    document.querySelectorAll("[data-jk-svg='platform-architecture']").forEach(renderPlatformArchitectureTree);
    document.querySelectorAll("[data-jk-svg='mvp-data-flow']").forEach(renderMvpDataFlow);
    document.querySelectorAll("[data-jk-svg='signin-component-tree']").forEach(renderSigninComponentTree);
    document.querySelectorAll("[data-jk-svg='identity-otp-flow']").forEach(renderIdentityOtpFlow);

    document.querySelectorAll("[data-jk-group]").forEach(function (el) {
      try {
        var config = JSON.parse(el.getAttribute("data-jk-group"));
        renderGroupGrid(el, config.label, config.nodes);
      } catch (e) { /* ignore */ }
    });
  }

  global.JKDiagram = {
    ROLES: ROLES,
    renderFlow: renderFlow,
    renderLegend: renderLegend,
    renderPersonaTree: renderPersonaTree,
    renderGroupGrid: renderGroupGrid,
    renderPlatformArchitectureTree: renderPlatformArchitectureTree,
    renderMvpDataFlow: renderMvpDataFlow,
    renderSigninComponentTree: renderSigninComponentTree,
    renderIdentityOtpFlow: renderIdentityOtpFlow,
    initPage: initPage
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})(window);
