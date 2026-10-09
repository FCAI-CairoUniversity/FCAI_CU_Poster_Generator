/**
 * survey.js — Graduation Survey Logic · FCAI CU Senior 2027
 * ──────────────────────────────────────────────────────────
 * Handles: item config, dynamic rendering, conditional sub-options,
 * live price calculator, form validation, and Apps Script submission.
 *
 * FIX: Hoodie and Quarter Zip are one card in the UI, but they are sent
 * to the backend as two separate products (name + size column).
 */

"use strict";

// ══════════════════════════════════════════════════════════════════
//  ⚙️  CONFIG  —  Edit prices and options here
// ══════════════════════════════════════════════════════════════════

/** Replace with your deployed Google Apps Script Web App URL. */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzY1q7fEZqN5i541wAgP66NPoRfnzp1-zcAKC5HeTVKBHxySR_TR_IFt49Y73Ml-hit/exec";

/**
 * Departments shown in the "Department" dropdown.
 * Edit this list any time — the dropdown rebuilds itself from it.
 */
const DEPARTMENTS = [
  "Computer Science",
  "Information Systems",
  "Information Technology",
  "Artificial Intelligence",
  "Decision Support and operations research",
];

/**
 * Graduation items catalogue.
 * ─ price: shown on the card and used in the calculator (EGP)
 * ─ suboptions: expand below the card when item is selected
 *   ∙ type "pills"        → flat list of buttons (e.g. sizes)
 *   ∙ type "image-preview" → display-only image (no user choice)
 *   ∙ required: true      → user must choose before saving
 */
const ITEMS = [
  {
    id         : "hoodie",
    name       : "Senior Hoodie / Quarter Zip",
    description: "The official Senior '27 hoodie and quarter zip, available in sizes S to 2XL and featuring our exclusive senior design.",
    price      : 670,
    icon       : "shirt",
    suboptions : [
      {
        id      : "hoodie_style",
        label   : "Choose Style",
        required: true,
        type    : "pills",
        options : [
          { value: "hoodie",  label: "Hoodie 🧥" },
          { value: "quarter", label: "Quarter Zip 🤐" },
        ],
      },
      {
        id      : "hoodie_size",
        label   : "Choose Size",
        required: true,
        type    : "pills",
        options : [
          { value: "S",   label: "S"   },
          { value: "M",   label: "M"   },
          { value: "L",   label: "L"   },
          { value: "XL",  label: "XL"  },
          { value: "2XL", label: "2XL" },
        ],
      },
      {
        id     : "hoodie_size_chart",
        label  : "Size Chart — Hoodie & Quarter Zip",
        type   : "image-preview",
        image  : "https://lh3.googleusercontent.com/d/1r3zOO8JSXobMVTH2gManKsAGSp1EIbtb",
        caption: "Size Guide — Hoodie & Quarter Zip",
      },
    ],
  },
  {
    id         : "notebook",
    name       : "Senior Notebook",
    description: "A Senior '27 graduation notebook featuring our exclusive design — perfect as a gift or a memorable keepsake.",
    price      : 150,
    icon       : "book",
    suboptions : [
      {
        id     : "notebook_front_preview",
        label  : "Front Design",
        type   : "image-preview",
        image  : "https://lh3.googleusercontent.com/d/1OC6RRFUdHDKZ4VvLgO7L85j6e3Qe3iZ2",
        caption: "Front Cover — Senior '27 Notebook",
      },
      {
        id     : "notebook_back_preview",
        label  : "Back Design",
        type   : "image-preview",
        image  : "https://lh3.googleusercontent.com/d/1UNznlkaFuepkZZCMxodajtnQnAT4CUqT",
        caption: "Back Cover — Senior '27 Notebook",
      },
    ],
  },
  {
    id         : "cap",
    name       : "Senior Cap",
    description: "An embroidered cap featuring the Senior '27 logo — the perfect accessory for graduation day.",
    price      : 150,
    icon       : "cap",
    suboptions : [
      {
        id     : "cap_preview",
        label  : "Cap Design",
        type   : "image-preview",
        image  : "https://lh3.googleusercontent.com/d/1J3qlGGPT4dxQh_Xg2OeJ4omWfwHRva1g",
        caption: "Official Senior '27 Cap",
      },
    ],
  },
  {
    id         : "laptop_bag",
    name       : "Laptop Bag",
    description: "A laptop bag featuring the Senior '27 design, suitable for laptops with screens up to 15.6 inches.",
    price      : 350,
    icon       : "bag",
    suboptions : [
      {
        id     : "bag_preview",
        label  : "Bag Design",
        type   : "image-preview",
        image  : "https://lh3.googleusercontent.com/d/1k8mhns-ZmERWhgKRmJ1S2VH29V8CZWTb",
        caption: "Official Senior '27 Laptop Bag",
      },
    ],
  },
];


// ══════════════════════════════════════════════════════════════════
//  🖼  SVG ICON LIBRARY  (inline paths, no emoji, no CDN)
// ══════════════════════════════════════════════════════════════════

const ICON_PATHS = {
  shirt: `<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>`,

  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,

  cap: `<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17c0 2.21 4.48 4 10 4s10-1.79 10-4"/><path d="M2 12c0 2.21 4.48 4 10 4s10-1.79 10-4"/>`,

  bag: `<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>`,

  check: `<polyline points="20 6 9 17 4 12"/>`,

  warning: `<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,

  empty: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h3"/>`,

  save: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`,

  upload: `<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>`,

  x: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
};

/** Build an SVG element string from icon key. */
function svg(key, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    ${ICON_PATHS[key] || ""}
  </svg>`;
}


// ══════════════════════════════════════════════════════════════════
//  📦  APPLICATION STATE
// ══════════════════════════════════════════════════════════════════

const state = {
  /** Set of selected item IDs */
  selected: new Set(),

  /** Sub-option selections: { "hoodie_style": "hoodie", "hoodie_size": "M", ... } */
  suboptions: {},

  /** File uploads: { "payment_proof": { base64, mimeType, name }, ... } */
  fileData: {},

  /** Running total (EGP) */
  total: 0,
};


// ══════════════════════════════════════════════════════════════════
//  🎓  DEPARTMENT DROPDOWN
// ══════════════════════════════════════════════════════════════════

/**
 * Fills the #department <select> with options built from the
 * DEPARTMENTS list above.
 */
function populateDepartments() {
  const select = document.getElementById("department");
  if (!select) return;

  select.innerHTML =
    `<option value="" disabled selected>Select your department</option>` +
    DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join("");
}


// ══════════════════════════════════════════════════════════════════
//  🔨  RENDERING
// ══════════════════════════════════════════════════════════════════

/** Build and inject all item cards into #itemsContainer. */
function renderItems() {
  const container = document.getElementById("itemsContainer");
  if (!container) return;

  container.innerHTML = ITEMS.map(item => `
    <div class="item-card${item.disabled ? " disabled" : ""}" id="card-${item.id}">

      <!-- Toggle row -->
      <button type="button" class="item-toggle"
              ${item.disabled ? `onclick="return false;" aria-disabled="true"` : `onclick="SurveyApp.toggleItem('${item.id}')"`}
              aria-pressed="false" id="toggle-${item.id}"
              ${item.disabled ? `tabindex="-1"` : ""}>

        <!-- Checkbox indicator -->
        <span class="item-checkbox" id="chk-${item.id}">
          ${svg("check")}
        </span>

        <!-- Icon -->
        <span class="item-icon">${svg(item.icon)}</span>

        <!-- Text -->
        <span class="item-info">
          <span class="item-name">${item.name}</span>
          <span class="item-description">${item.description}</span>
        </span>

        <!-- Price -->
        <span class="item-price-tag">
          ${item.disabled
            ? `<span class="item-coming-soon-badge">Coming Soon</span>`
            : `<span class="item-price-amount" id="price-display-${item.id}">${item.price}</span>
               <span class="item-price-unit">EGP / person</span>`
          }
        </span>

      </button>

      <!-- Sub-options (revealed on selection) -->
      ${item.suboptions.length ? `
      <div class="item-suboptions" id="sub-${item.id}">
        ${item.suboptions.map(sub => `
          <div class="suboption-group">
            <span class="suboption-label">
              ${sub.label}
              <span class="suboption-badge ${sub.required ? "required" : "optional"}">
                ${sub.required ? "Required" : ""}
              </span>
            </span>
            ${renderSuboption(item.id, sub)}
          </div>
        `).join("")}
      </div>` : ""}

    </div>
  `).join("");
}

/** Render a single sub-option group. */
function renderSuboption(itemId, sub) {
  if (sub.type === "pills") {
    return `<div class="pills-row" id="row-${sub.id}">
      ${sub.options.map(opt => `
        <button type="button" class="size-pill"
                data-item="${itemId}" data-sub="${sub.id}" data-value="${opt.value}"
                onclick="SurveyApp.selectSub('${itemId}', '${sub.id}', '${opt.value}', this)">
          ${opt.label}
        </button>
      `).join("")}
    </div>`;
  }

  if (sub.type === "design-cards") {
    return `<div class="design-cards-row" id="row-${sub.id}">
      ${sub.options.map(opt => `
        <button type="button" class="design-card"
                data-item="${itemId}" data-sub="${sub.id}" data-value="${opt.value}"
                onclick="SurveyApp.selectSub('${itemId}', '${sub.id}', '${opt.value}', this)">
          <span class="design-swatch" style="--swatch-color:${opt.color}"></span>
          ${opt.label}
        </button>
      `).join("")}
    </div>`;
  }

  if (sub.type === "image-choices") {
    return `<div class="image-choices-row" id="row-${sub.id}">
      ${sub.options.map(opt => `
        <button type="button" class="image-choice-card"
                data-item="${itemId}" data-sub="${sub.id}" data-value="${opt.value}"
                onclick="SurveyApp.selectSub('${itemId}', '${sub.id}', '${opt.value}', this)">
          <div class="image-choice-img-wrap">
            <img src="${opt.image}" alt="${opt.label}" class="image-choice-img"
                 onload="SurveyApp.fitImgWrap(this)"
                 onerror="SurveyApp.imgLoadError(this)" />
            <span class="image-choice-check">${svg("check")}</span>
          </div>
          <span class="image-choice-label">${opt.label}</span>
        </button>
      `).join("")}
    </div>`;
  }

  if (sub.type === "image-preview") {
    return `<div class="image-preview-block">
      <img src="${sub.image}" alt="${sub.caption || sub.label}" class="image-preview-img"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <span class="image-preview-error" style="display:none">Image unavailable</span>
      ${sub.caption ? `<p class="image-preview-caption">${sub.caption}</p>` : ""}
    </div>`;
  }

  if (sub.type === "file") {
    return `
    <div class="file-upload-wrap" id="fwrap-${sub.id}">
      <label class="file-upload-zone" for="finput-${sub.id}" id="fzone-${sub.id}">
        <div class="file-upload-icon">
          ${svg("upload")}
        </div>
        <span class="file-upload-title">Click to upload or drag &amp; drop</span>
        <span class="file-upload-hint">${sub.hint || ""} &middot; Max ${sub.maxSizeMB || 4}MB &middot; JPG, PNG, WEBP</span>
        <input type="file" id="finput-${sub.id}" class="file-input-hidden"
               accept="${sub.accept || "image/*"}"
               data-sub="${sub.id}"
               data-max="${sub.maxSizeMB || 4}"
               onchange="SurveyApp.handleFileSelect(this)">
      </label>
      <div class="file-preview-wrap" id="fpreview-${sub.id}" style="display:none">
        <img class="file-preview-img" id="fimg-${sub.id}" src="" alt="Preview">
        <div class="file-preview-info">
          <span class="file-preview-name" id="fname-${sub.id}"></span>
          <button type="button" class="file-remove-btn"
                  onclick="SurveyApp.clearFile('${sub.id}')">
            ${svg("x")} Remove
          </button>
        </div>
      </div>
    </div>`;
  }

  return "";
}

/** Handle file input change — read as base64, show preview. */
function handleFileSelect(input) {
  const subId  = input.dataset.sub;
  const maxMB  = parseFloat(input.dataset.max) || 4;
  const file   = input.files && input.files[0];
  if (!file) return;

  if (file.size > maxMB * 1024 * 1024) {
    showToast(`File too large (${(file.size/1024/1024).toFixed(1)} MB). Max is ${maxMB} MB.`, "error");
    input.value = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("Only image files are accepted.", "error");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(ev) {
    const dataUrl  = ev.target.result;
    const base64   = dataUrl.split(",")[1];
    state.fileData[subId] = { base64, mimeType: file.type, name: file.name };

    // Show preview, hide zone
    const zone    = document.getElementById(`fzone-${subId}`);
    const preview = document.getElementById(`fpreview-${subId}`);
    const img     = document.getElementById(`fimg-${subId}`);
    const name    = document.getElementById(`fname-${subId}`);
    if (zone)    zone.style.display    = "none";
    if (preview) preview.style.display = "flex";
    if (img)     img.src               = dataUrl;
    if (name)    name.textContent      = file.name + ` (${(file.size/1024).toFixed(0)} KB)`;
    renderSummary();
  };
  reader.readAsDataURL(file);
}

/** Remove an uploaded file and reset the zone. */
function clearFile(subId) {
  delete state.fileData[subId];
  const zone    = document.getElementById(`fzone-${subId}`);
  const preview = document.getElementById(`fpreview-${subId}`);
  const input   = document.getElementById(`finput-${subId}`);
  if (zone)    zone.style.display    = "";
  if (preview) preview.style.display = "none";
  if (input)   input.value           = "";
  renderSummary();
}

/** Refresh the order summary panel. */
function renderSummary() {
  const wrap = document.getElementById("orderSummary");
  if (!wrap) return;

  if (state.selected.size === 0) {
    wrap.innerHTML = `
      <div class="summary-empty">
        ${svg("empty")}
        No items selected yet. Choose at least one item above to see your total.
      </div>`;
    return;
  }

  const lines = [...state.selected].map(id => {
    const item = ITEMS.find(i => i.id === id);
    if (!item) return "";

    // Collect sub-detail text (skip image-preview & file — no user choice)
    const details = item.suboptions
      .filter(sub => sub.type !== "image-preview" && sub.type !== "file" && state.suboptions[sub.id])
      .map(sub => {
        const opt = sub.options && sub.options.find(o => o.value === state.suboptions[sub.id]);
        return `${sub.label}: ${opt ? opt.label : state.suboptions[sub.id]}`;
      });

    return `
      <div class="summary-row">
        <div>
          <div class="summary-item-name">${item.name}</div>
          ${details.length ? `<div class="summary-sub-detail">${details.join(" &middot; ")}</div>` : ""}
        </div>
        <div class="summary-price">${item.price} EGP</div>
      </div>`;
  }).join("");

  // Validation warnings
  const warnings = getMissingRequiredSubs();
  const warnHTML = warnings.length ? `
    <div class="summary-warning">
      ${svg("warning")}
      <span>
        Please complete required options:
        <strong>${warnings.map(w => w.label).join(", ")}</strong>
      </span>
    </div>` : "";

  state.total = [...state.selected].reduce((sum, id) => {
    const item = ITEMS.find(i => i.id === id);
    if (!item) return sum;
    return sum + item.price;
  }, 0);

  wrap.innerHTML = `
    <div class="summary-lines">
      ${lines}
      <div class="summary-total-row">
        <span class="summary-total-label">Estimated Total</span>
        <span>
          <span class="summary-total-amount">${state.total}</span>
          <span class="summary-total-unit">EGP</span>
        </span>
      </div>
    </div>
    ${warnHTML}`;
}


// ══════════════════════════════════════════════════════════════════
//  🖱  INTERACTION HANDLERS
// ══════════════════════════════════════════════════════════════════

/** Toggle an item card on/off. */
function toggleItem(itemId) {
  const item    = ITEMS.find(i => i.id === itemId);
  if (!item || item.disabled) return;

  const card     = document.getElementById(`card-${itemId}`);
  const subPanel = document.getElementById(`sub-${itemId}`);
  const toggle   = document.getElementById(`toggle-${itemId}`);

  if (state.selected.has(itemId)) {
    // Deselect
    state.selected.delete(itemId);
    card.classList.remove("selected");
    toggle.setAttribute("aria-pressed", "false");
    if (subPanel) subPanel.classList.remove("open");

    // Clear sub-option selections for this item
    if (item) item.suboptions.forEach(sub => {
      delete state.suboptions[sub.id];
      document.querySelectorAll(`[data-item="${itemId}"][data-sub="${sub.id}"]`)
              .forEach(btn => btn.classList.remove("active"));
    });

  } else {
    // Select
    state.selected.add(itemId);
    card.classList.add("selected");
    toggle.setAttribute("aria-pressed", "true");
    if (subPanel) subPanel.classList.add("open");
  }

  renderSummary();
}

/** Select a sub-option (size pill or design card). */
function selectSub(itemId, subId, value, btn) {
  // Deactivate siblings
  document.querySelectorAll(`[data-item="${itemId}"][data-sub="${subId}"]`)
          .forEach(b => b.classList.remove("active"));

  // If same value clicked again — deselect (toggle off)
  if (state.suboptions[subId] === value) {
    delete state.suboptions[subId];
  } else {
    state.suboptions[subId] = value;
    btn.classList.add("active");
  }

  renderSummary();
}

/** Return list of required sub-options that are missing. */
function getMissingRequiredSubs() {
  const missing = [];
  for (const id of state.selected) {
    const item = ITEMS.find(i => i.id === id);
    if (!item) continue;
    for (const sub of item.suboptions) {
      if (!sub.required) continue;
      if (sub.type === "image-preview") continue; // display-only, no user choice
      if (sub.type === "file") {
        if (!state.fileData[sub.id]) {
          missing.push({ itemName: item.name, label: `${item.name} — ${sub.label}` });
        }
      } else {
        // pills / design-cards / image-choices
        if (!state.suboptions[sub.id]) {
          missing.push({ itemName: item.name, label: `${item.name} — ${sub.label}` });
        }
      }
    }
  }
  return missing;
}


// ══════════════════════════════════════════════════════════════════
//  ✅  VALIDATION
// ══════════════════════════════════════════════════════════════════

function validate() {
  const v = f => document.getElementById(f)?.value.trim();

  if (!v("fullName"))   { showToast("Full name is required.", "error"); return false; }
  if (!v("studentId"))  { showToast("Student ID is required.", "error"); return false; }
  if (!v("phone"))      { showToast("Phone number is required.", "error"); return false; }
  if (!v("department")) { showToast("Please select your department.", "error"); return false; }

  if (state.selected.size === 0) {
    showToast("Please select at least one graduation item.", "warn"); return false;
  }

  const missing = getMissingRequiredSubs();
  if (missing.length) {
    showToast(`Please choose a size/style for: ${missing.map(m => m.itemName).join(", ")}`, "warn");
    return false;
  }

  if (!state.fileData["payment_proof"]) {
    showToast("Please upload your payment transfer receipt screenshot.", "error");
    const zone = document.getElementById("sec-payment");
    if (zone) zone.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  return true;
}


// ══════════════════════════════════════════════════════════════════
//  📤  SUBMIT
// ══════════════════════════════════════════════════════════════════

async function handleSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  const btn   = document.getElementById("submitBtn");
  const label = document.getElementById("submitLabel");
  btn.disabled = true;
  label.innerHTML = '<span class="spinner"></span> Uploading &amp; Saving...';

  // Hoodie and Quarter Zip are ONE card in the UI but TWO separate products
  // on the backend, so the name and size are sent according to the chosen style.
  const hoodieSelected = state.selected.has("hoodie");
  const style          = state.suboptions["hoodie_style"];   // "hoodie" | "quarter"
  const hoodieSize     = state.suboptions["hoodie_size"];
  const isQuarter      = hoodieSelected && style === "quarter";
  const styleName      = isQuarter ? "Quarter Zip" : "Hoodie";

  /** Name sent to the backend for each selected item. */
  const nameOf = item => item.id === "hoodie" ? styleName : item.name;

  // Selected items list with details (Hoodie / Quarter Zip get their own name + size)
  const itemsSummary = [...state.selected].map(id => {
    const item = ITEMS.find(i => i.id === id);
    if (id === "hoodie") return `${styleName} (Size: ${hoodieSize})`;
    return item.name;
  }).join(" | ");

  const payload = {
    timestamp       : new Date().toLocaleString("en-EG", { timeZone: "Africa/Cairo" }),
    fullName        : document.getElementById("fullName").value.trim(),
    studentId       : document.getElementById("studentId").value.trim(),
    phone           : document.getElementById("phone").value.trim(),
    department      : document.getElementById("department").value.trim(),
    selectedItems   : [...state.selected].map(id => nameOf(ITEMS.find(i => i.id === id))).join(", "),
    itemsWithDetails: itemsSummary,
    hoodieSize      : hoodieSelected && !isQuarter ? hoodieSize : "—",
    quarterSize     : isQuarter ? hoodieSize : "—",
    totalAmount     : state.total,
    Notes           : document.getElementById("Notes").value.trim() || "—",
    // Payment receipt — uploaded to Google Drive by the Apps Script
    paymentProof    : state.fileData["payment_proof"] || null,
  };

  // Guard: make sure the URL has been set
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("YOUR_APPS_SCRIPT")) {
    showToast("Apps Script URL not set. Open survey.js and paste your Web App URL.", "error", 7000);
    btn.disabled = false;
    label.innerHTML = `${svg("save", "btn-icon")} Save My Response`;
    return;
  }

  try {
    const res  = await fetch(APPS_SCRIPT_URL, {
      method  : "POST",
      body    : JSON.stringify(payload),
      redirect: "follow",
    });

    // Parse as text first — Apps Script can return non-JSON on errors
    const raw  = await res.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch (_) {
      throw new Error("Apps Script returned unexpected response: " + raw.substring(0, 150));
    }

    if (json.status === "success") {
      document.getElementById("successName").textContent  = payload.fullName.split(" ")[0];
      document.getElementById("successTotal").textContent = `${state.total} EGP`;

      // Show overlay — remove inert so inner elements are reachable
      const overlay = document.getElementById("successOverlay");
      overlay.classList.add("show");
      overlay.removeAttribute("inert");

      // Move focus into the dialog for accessibility
      const dismiss = overlay.querySelector(".btn-dismiss");
      if (dismiss) setTimeout(() => dismiss.focus(), 50);

      resetForm();
    } else {
      throw new Error(json.message || "Server returned an error");
    }
  } catch (err) {
    console.error("[Survey]", err);
    showToast("Save failed: " + err.message, "error", 6000);
  } finally {
    btn.disabled = false;
    label.innerHTML = `${svg("save", "btn-icon")} Save My Response`;
  }
}

/** Reset the form and state after a successful save. */
function resetForm() {
  document.getElementById("surveyForm").reset();
  state.selected.clear();
  state.suboptions = {};
  state.fileData   = {};
  state.total      = 0;

  document.querySelectorAll(".item-card.selected").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".item-suboptions.open").forEach(p => p.classList.remove("open"));
  document.querySelectorAll(".size-pill.active, .design-card.active").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".image-choice-card.active").forEach(b => b.classList.remove("active"));

  // Reset all file upload zones
  document.querySelectorAll(".file-upload-zone").forEach(z => z.style.display = "");
  document.querySelectorAll(".file-preview-wrap").forEach(p => p.style.display = "none");

  populateDepartments();
  renderSummary();
}

/** Close the success overlay. */
function closeSuccess() {
  const overlay = document.getElementById("successOverlay");
  overlay.classList.remove("show");
  overlay.setAttribute("inert", "");
}


// ══════════════════════════════════════════════════════════════════
//  🔔  TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════

const TOAST_ICONS = {
  success : "check",
  error   : "warning",
  warn    : "warning",
  info    : "empty",
};

function showToast(message, type = "info", duration = 3800) {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `${svg(TOAST_ICONS[type] || "empty")} <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toast-out 0.28s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}


// ══════════════════════════════════════════════════════════════════
//  🚀  INIT
// ══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  populateDepartments();
  renderItems();
  renderSummary();

  document.getElementById("surveyForm")
    .addEventListener("submit", handleSubmit);
});


// ══════════════════════════════════════════════════════════════════
//  🖼  IMAGE SIZE HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * Called onload for image-choice images.
 * Sets the wrap's aspect-ratio to match the real image dimensions.
 */
function fitImgWrap(imgEl) {
  const wrap = imgEl.parentElement;
  if (!wrap) return;
  const w = imgEl.naturalWidth;
  const h = imgEl.naturalHeight;
  if (w && h) {
    wrap.style.aspectRatio = `${w} / ${h}`;
    wrap.classList.add("ratio-loaded");
  }
}

/**
 * Called onerror for image-choice images.
 * Replaces the broken image area with a friendly placeholder.
 */
function imgLoadError(imgEl) {
  const wrap = imgEl.parentElement;
  if (!wrap) return;
  const check = wrap.querySelector(".image-choice-check");
  wrap.innerHTML = `<span class="img-error">⚠ Image unavailable</span>`;
  if (check) wrap.appendChild(check);
  wrap.style.aspectRatio = "4 / 3";
  wrap.classList.add("ratio-loaded");
}

/** Copy Vodafone Cash number to clipboard and show toast */
function copyVFNumber(btn) {
  const number = "01055496208";
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(number).then(() => {
      showToast("تم نسخ الرقم بنجاح: " + number, "success");
      if (btn) {
        const origText = btn.querySelector("span")?.textContent || "Copy";
        if (btn.querySelector("span")) btn.querySelector("span").textContent = "Copied!";
        setTimeout(() => {
          if (btn.querySelector("span")) btn.querySelector("span").textContent = origText;
        }, 2000);
      }
    }).catch(() => {
      prompt("انسخ رقم التحويل:", number);
    });
  } else {
    prompt("انسخ رقم التحويل:", number);
  }
}

/** Toggle InstaPay step-by-step visual guide panel */
function toggleInstaPayGuide() {
  const panel = document.getElementById("instapayGuidePanel");
  const btn = document.getElementById("ipGuideToggleBtn");
  if (!panel || !btn) return;
  const isExpanded = btn.getAttribute("aria-expanded") === "true";
  btn.setAttribute("aria-expanded", !isExpanded ? "true" : "false");
  panel.classList.toggle("open", !isExpanded);
}

/** Open image in full-size lightbox */
function openLightbox(src, caption) {
  const overlay = document.getElementById("imgLightboxOverlay");
  const img = document.getElementById("imgLightboxSrc");
  const cap = document.getElementById("imgLightboxCaption");
  if (!overlay || !img) return;
  img.src = src;
  if (cap) cap.textContent = caption || "";
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

/** Close image lightbox */
function closeLightbox(e) {
  if (e && e.target && e.target.id !== "imgLightboxOverlay" && !e.target.closest(".img-lightbox-close")) {
    return;
  }
  const overlay = document.getElementById("imgLightboxOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Close lightbox on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const overlay = document.getElementById("imgLightboxOverlay");
    if (overlay && overlay.classList.contains("open")) {
      closeLightbox();
    }
  }
});

// Expose public API for inline onclick handlers in rendered HTML
const SurveyApp = {
  toggleItem,
  selectSub,
  closeSuccess,
  handleFileSelect,
  clearFile,
  fitImgWrap,
  imgLoadError,
  copyVFNumber,
  toggleInstaPayGuide,
  openLightbox,
  closeLightbox
};