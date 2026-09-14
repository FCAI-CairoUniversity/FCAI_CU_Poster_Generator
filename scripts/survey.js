/**
 * survey.js — Graduation Survey Logic · FCAI CU Senior 2027
 * ──────────────────────────────────────────────────────────
 * Handles: item config, dynamic rendering, conditional sub-options,
 * live price calculator, form validation, and Apps Script submission.
 */

"use strict";

// ══════════════════════════════════════════════════════════════════
//  ⚙️  CONFIG  —  Edit prices and options here
// ══════════════════════════════════════════════════════════════════

/** Replace with your deployed Google Apps Script Web App URL. */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9Yhjr7U5gWEKgQhuAWTezLDMlyXuVh40oFgZu81r2q6zpRn8S_ajxYglbHQk3okys/exec";

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
 *   ∙ type "design-cards" → colored swatch cards (e.g. frame styles)
 *   ∙ required: true      → user must choose before saving
 */
const ITEMS = [
  {
    id       : "hoodie",
    name     : "Senior Hoodie",
    description: "Premium graduation hoodie with the batch design — stay cozy on graduation day.",
    price    : 600,
    icon     : "shirt",
    disabled : true,            // ← coming soon / not available yet
    suboptions: [],
  },
  {
    id: "sunglasses",
    name: "Senior Sunglasses",
    description: 'Sunglasses printed with "Senior" and the graduation year — perfect for group shots.',
    price: 80,
    icon: "glasses",
    suboptions: [
      {
        id       : "sunglasses_design",
        label    : "Choose Your Design",
        required : true,
        type     : "image-choices",
        options  : [
          {
            value : "white",
            label : "White",
            image : "https://lh3.googleusercontent.com/d/1nHbx7lqbgOthRRSt5uZUWZ9E92VfEE7m",
          },
          {
            value : "black",
            label : "Black",
            image : "https://lh3.googleusercontent.com/d/1K3E5-dBGdArKc-VvXqPwOPA-7Mooo7r2",
          },
        ],
      },
    ],
  },
  {
    id: "sticks",
    name: "Photo Sticks",
    description: "Decorative wooden prop sticks for graduation photoshoots and group photos.",
    price: 25,
    icon: "star",
    suboptions: [
      {
        id      : "sticks_preview",
        label   : "Sticks Design",
        type    : "image-preview",
        image   : "https://lh3.googleusercontent.com/d/1mM8xaLdD37BIlThJteBeu7FunBvOV8g9",
        caption : "Senior '27 Sticks — official design",
      },
      {
        id       : "sticks_photo",
        label    : "Your Reference Photo",
        hint     : "Upload your reference photo for the stick design",
        required : true,
        type     : "file",
        accept   : "image/*",
        maxSizeMB: 4,
      },
    ],
  },
  {
    id: "keychain",
    name: "Acrylic Keychain",
    description: "Personalised acrylic keychain badge with the graduation batch logo.",
    price: 80,
    icon: "star",
    suboptions: [
        {
            id      : "keychain_preview",
            label   : "Keychain Design",
            type    : "image-preview",
            image   : "https://lh3.googleusercontent.com/d/1M_FYBrtjkG_NvV0nmT_-NbYMQhyIBOFX",
            caption : "Senior '27 Acrylic Keychain — official design",
      },
      {
        id       : "keychain_photo",
        label    : "Your Reference Photo",
        hint     : "Upload your reference photo for the keychain",
        required : true,
        type     : "file",
        accept   : "image/*",
        maxSizeMB: 4,
      },
    ],
  },
  {
    id: "pin",
    name: "Acrylic Pin",
    description: "Personalised acrylic pin badge with the graduation batch logo.",
    price: 80,
    icon: "star",
    suboptions: [
      {
        id      : "pin_preview",
        label   : "pin Design",
        type    : "image-preview",
        image   : "https://lh3.googleusercontent.com/d/1_JBGnwnYajlQY36fq2eTOnXwX0tK-ajz",
        caption : "Senior '27 Acrylic Pin — official design",
      },
      {
        id       : "pin_photo",
        label    : "Your Reference Photo",
        hint     : "Upload your reference photo for the pin",
        required : true,
        type     : "file",
        accept   : "image/*",
        maxSizeMB: 4,
      },
    ],
  },
  {
    id: "frame",
    name: "Certificate Frame",
    description: "Commemorative diploma frame featuring the graduate's name, faculty, and graduation year.",
    price: 140,
    icon: "frame",
    suboptions: [
      {
        id      : "frame_preview",
        label   : "Frame Design",
        type    : "image-preview",
        image   : "https://lh3.googleusercontent.com/d/1Ihicxifrg5yiwq9ztG_BTnYpjahwGV3P",
        caption : "Senior '27 Certificate Frame — official design",
      },
      {
        id       : "frame_photo",
        label    : "Your Reference Photo",
        hint     : "Upload your reference photo for the frame",
        required : true,
        type     : "file",
        accept   : "image/*",
        maxSizeMB: 4,
      },
    ],
  },
  {
    id: "notebook",
    name: "Senior Notebook",
    description: "A personalised graduation notebook with your name and the senior batch design.",
    price: 170,
    icon: "book",
    suboptions: [
      {
        id       : "notebook_photo",
        label    : "Your Reference Photo",
        hint     : "Upload your reference photo for the notebook cover",
        required : true,
        type     : "file",
        accept   : "image/*",
        maxSizeMB: 4,
      },
    ],
  },
  {
    id: "newspaper",
    name: "Senior Newspaper",
    description: "A commemorative graduation newspaper featuring the senior batch.",
    price: 70,
    icon: "newspaper",
    suboptions: [
      {
        id      : "newspaper_preview",
        label   : "Newspaper Design",
        type    : "image-preview",
        image   : "https://lh3.googleusercontent.com/d/1FSlGL7bgYLgvxzMnr3vFN3evX57WwYWG",
        caption : "Senior '27 Newspaper — official design",
      },
      {
        id       : "newspaper_photo",
        label    : "Your Reference Photo",
        hint     : "Upload your reference photo for the newspaper",
        required : true,
        type     : "file",
        accept   : "image/*",
        maxSizeMB: 4,
      },
    ],
  },
];


// ══════════════════════════════════════════════════════════════════
//  🖼  SVG ICON LIBRARY  (inline paths, no emoji, no CDN)
// ══════════════════════════════════════════════════════════════════

const ICON_PATHS = {
  shirt: `<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>`,

  glasses: `<circle cx="6" cy="13.5" r="3.5"/><circle cx="18" cy="13.5" r="3.5"/>
            <path d="M9.5 13.5h5M2 12c0-3 1.5-5 4-5m16 5c0-3-1.5-5-4-5"/>`,

  star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,

  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,

  frame: `<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/>`,

  newspaper: `<rect x="3" y="4" width="18" height="16" rx="1"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="11" x2="17" y2="11"/><line x1="7" y1="14" x2="13" y2="14"/>`,

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

  /** Sub-option selections: { "hoddie_size": "M", "notebook_cover": "classic", ... } */
  suboptions: {},

  /** File uploads: { "sticks_photo": { base64, mimeType, name }, ... } */
  fileData: {},

  /** Running total (EGP) */
  total: 0,
};


// ══════════════════════════════════════════════════════════════════
//  🎓  DEPARTMENT DROPDOWN
// ══════════════════════════════════════════════════════════════════

/**
 * Fills the #department <select> with options built from the
 * DEPARTMENTS list above. Expects the HTML to already contain:
 *   <select id="department" required></select>
 * placed near Full Name / Student ID / Phone in the form.
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
            : `<span class="item-price-amount">${item.price}</span>
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

/** Render a single sub-option group (pills or design cards). */
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

    // Collect sub-detail text (skip image-preview — no user choice needed)
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
    return sum + (item ? item.price : 0);
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
  if (!item || item.disabled) return;   // ← disabled items are not selectable

  const card    = document.getElementById(`card-${itemId}`);

  const subPanel = document.getElementById(`sub-${itemId}`);
  const toggle  = document.getElementById(`toggle-${itemId}`);

  if (state.selected.has(itemId)) {
    // Deselect
    state.selected.delete(itemId);
    card.classList.remove("selected");
    toggle.setAttribute("aria-pressed", "false");
    if (subPanel) subPanel.classList.remove("open");

    // Clear sub-option selections for this item
    if (item) item.suboptions.forEach(sub => {
      delete state.suboptions[sub.id];
      // Deactivate all buttons in this sub group
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
        // Check if a file has been uploaded for this sub
        if (!state.fileData[sub.id]) {
          missing.push({ itemName: item.name, label: `${item.name} — ${sub.label}` });
        }
      } else {
        // pills / design-cards / image-choices — check selection
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
    showToast(`Please choose a size/design/photo for: ${missing.map(m => m.itemName).join(", ")}`, "warn");
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
  label.innerHTML = '<span class="spinner"></span> Uploading & Saving...';

  // Build selected items list with sub-option details
  const itemsSummary = [...state.selected].map(id => {
    const item = ITEMS.find(i => i.id === id);
    const subs = item.suboptions
      .filter(s => s.type !== "image-preview" && s.type !== "file" && state.suboptions[s.id])
      .map(s => {
        const opt = s.options && s.options.find(o => o.value === state.suboptions[s.id]);
        return `${s.label}: ${opt ? opt.label : state.suboptions[s.id]}`;
      });
    return subs.length ? `${item.name} (${subs.join(", ")})` : item.name;
  }).join(" | ");

  const payload = {
    timestamp          : new Date().toLocaleString("en-EG", { timeZone: "Africa/Cairo" }),
    fullName           : document.getElementById("fullName").value.trim(),
    studentId          : document.getElementById("studentId").value.trim(),
    phone              : document.getElementById("phone").value.trim(),
    department         : document.getElementById("department").value.trim(),
    selectedItems      : [...state.selected].map(id => ITEMS.find(i => i.id === id)?.name).join(", "),
    itemsWithDetails   : itemsSummary,
    hoodieSize         : state.suboptions["hoodie_size"] || state.suboptions["hoddie_size"] || "—",
    sunglassesDesign   : state.suboptions["sunglasses_design"] || "—",
    sticksDesign       : state.suboptions["sticks_design"]     || "—",
    notebookCover      : state.suboptions["notebook_cover"]    || "—",
    totalAmount        : state.total,
    suggestions        : document.getElementById("suggestions").value.trim() || "—",
    // Image uploads (base64) — uploaded to Google Drive by the Apps Script
    paymentProof       : state.fileData["payment_proof"]   || null,
    sticksPhoto        : state.fileData["sticks_photo"]    || null,
    keychainPhoto      : state.fileData["keychain_photo"]     || null,
    pinPhoto           : state.fileData["pin_photo"]     || null,
    framePhoto         : state.fileData["frame_photo"]     || null,
    notebookPhoto      : state.fileData["notebook_photo"]  || null,
    newspaperPhoto     : state.fileData["newspaper_photo"] || null,
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
    // Show the real error — helps debug Apps Script issues
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

  // Reset all file upload zones
  document.querySelectorAll(".file-upload-zone").forEach(z => z.style.display = "");
  document.querySelectorAll(".file-preview-wrap").forEach(p => p.style.display = "none");

  // Department select needs its placeholder re-selected manually (reset() alone
  // won't re-trigger our custom placeholder option state in all browsers)
  populateDepartments();

  renderSummary();
}

/** Close the success overlay — restore inert so elements can't receive focus. */
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
 * Sets the wrap's aspect-ratio to match the real image dimensions
 * so the box fits the image perfectly instead of forcing a 1:1 square.
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
  // Keep the checkmark span but swap image for error message
  const check = wrap.querySelector(".image-choice-check");
  wrap.innerHTML = `<span class="img-error">⚠ Image unavailable</span>`;
  if (check) wrap.appendChild(check);
  wrap.style.aspectRatio = "4 / 3";   // reasonable fallback ratio
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