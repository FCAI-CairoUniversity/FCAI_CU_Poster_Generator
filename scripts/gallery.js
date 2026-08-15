/**
 * gallery.js – Senior 2027 Gallery
 *
 * View modes:
 *  "all"     → show every poster. OK ones: Done badge + button disabled.
 *               Non-OK: warning + button enabled.
 *  "pending" → show ONLY non-OK posters (pending username entry).
 *
 * Department chips sorted by count DESC.
 * After username saved → card removed from pending view, button disabled in all view.
 */

// ── Config ──────────────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9nrDQf3NFl6yWRScUnoIPfKANP_cEUEv0eUOLQbps2eTpYkeT65zIpOhyKK9iZNuc/exec";

// ── State ────────────────────────────────────────────────────
let rawPosters      = [];   // all posters from API (unfiltered)
let viewPosters     = [];   // filtered by current view mode (all / pending)
let filteredPosters = [];   // further filtered by search + dept
let currentPage     = 1;
let perPage         = 12;
let activeDept      = "All";
let activeView      = "all"; // "all" | "pending"
let activeStudentId = "";

// ── DOM refs ─────────────────────────────────────────────────
const grid          = document.getElementById("grid");
const emptyState    = document.getElementById("emptyState");
const errorState    = document.getElementById("errorState");
const pagination    = document.getElementById("pagination");
const searchInput   = document.getElementById("searchInput");
const clearSearch   = document.getElementById("clearSearch");
const resultBar     = document.getElementById("resultBar");
const resultInfo    = document.getElementById("resultInfo");
const totalCount    = document.getElementById("totalCount");
const deptWrap      = document.getElementById("deptWrap");
const deptChips     = document.getElementById("deptChips");
const perPageSelect = document.getElementById("perPageSelect");
const modalOverlay  = document.getElementById("modalOverlay");
const instaInput    = document.getElementById("instaInput");
const instaHint     = document.getElementById("instaHint");
const modalSubmit   = document.getElementById("modalSubmitBtn");
const pendingCount  = document.getElementById("pendingCount");

// ════════════════════════════════════════════════════════════
//  FETCH  (JSONP)
// ════════════════════════════════════════════════════════════
function loadPosters() {
  grid.innerHTML            = Array(6).fill('<div class="g-skeleton"></div>').join("");
  emptyState.style.display  = "none";
  errorState.style.display  = "none";
  pagination.style.display  = "none";
  deptWrap.style.display    = "none";
  totalCount.textContent    = "Loading…";

  const cbName = "gcb_" + Date.now();
  const url    = SCRIPT_URL + "?action=list&callback=" + cbName;
  const script = document.createElement("script");
  script.src   = url;

  const timeout = setTimeout(() => {
    cleanup();
    showError("Request timed out. Check your connection.");
  }, 15000);

  window[cbName] = function(data) {
    cleanup();
    if (data && data.success && Array.isArray(data.posters)) {
      rawPosters = data.posters;
      updatePendingCount();
      applyView();
    } else {
      showError((data && data.message) || "Failed to load posters.");
    }
  };

  function cleanup() {
    clearTimeout(timeout);
    if (script.parentNode) script.parentNode.removeChild(script);
    delete window[cbName];
  }

  script.onerror = () => { cleanup(); showError("Network error. Could not reach the server."); };
  document.head.appendChild(script);
}

function showError(msg) {
  grid.innerHTML = "";
  document.getElementById("errorMsg").textContent = msg;
  errorState.style.display = "flex";
  totalCount.textContent   = "Error";
}

function isPosterDone(poster) {
  if (!poster) return false;
  return Boolean(
    poster.okStatus === true ||
    (poster.instagram && String(poster.instagram).trim() !== "" && String(poster.instagram).trim() !== "-")
  );
}

// ── Update pending badge count ──────────────────────────────
function updatePendingCount() {
  const n = rawPosters.filter(p => !isPosterDone(p)).length;
  if (pendingCount) pendingCount.textContent = n;
}

// ════════════════════════════════════════════════════════════
//  VIEW TOGGLE  ("all" / "pending")
// ════════════════════════════════════════════════════════════
function setView(view) {
  activeView  = view;
  activeDept  = "All";
  currentPage = 1;
  searchInput.value         = "";
  clearSearch.style.display = "none";

  // Update toggle button states
  document.querySelectorAll(".g-toggle-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  applyView();
}

function applyView() {
  // Build viewPosters based on mode
  viewPosters = activeView === "pending"
    ? rawPosters.filter(p => !isPosterDone(p))
    : rawPosters.slice();

  // Update header count
  totalCount.textContent = viewPosters.length + (activeView === "pending" ? " Pending" : " Posters");

  buildDeptChips();
  applyFilter();
}

// ════════════════════════════════════════════════════════════
//  DEPARTMENT CHIPS  (sorted by count DESC)
// ════════════════════════════════════════════════════════════
function buildDeptChips() {
  const counts = {};
  viewPosters.forEach(p => { counts[p.department] = (counts[p.department] || 0) + 1; });

  // Sort departments by count DESC
  const depts = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  if (depts.length <= 1) { deptWrap.style.display = "none"; return; }
  deptWrap.style.display = "block";
  deptChips.innerHTML    = "";

  // "All" chip first
  deptChips.appendChild(makeChip("All", viewPosters.length));
  depts.forEach(d => deptChips.appendChild(makeChip(d, counts[d])));

  // Keep active dept selected if it still exists, else reset to All
  if (activeDept !== "All" && !counts[activeDept]) activeDept = "All";

  document.querySelectorAll(".g-dept-chip").forEach(c => {
    const label = c.dataset.dept;
    c.classList.toggle("active", label === activeDept);
  });
}

function makeChip(label, count) {
  const chip       = document.createElement("button");
  chip.className   = "g-dept-chip" + (label === activeDept ? " active" : "");
  chip.dataset.dept = label;
  chip.innerHTML   = label + `<span class="g-chip-count">(${count})</span>`;
  chip.onclick     = () => selectDept(label);
  return chip;
}

function selectDept(dept) {
  activeDept  = dept;
  currentPage = 1;
  document.querySelectorAll(".g-dept-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.dept === dept);
  });
  applyFilter();
}

// ════════════════════════════════════════════════════════════
//  SEARCH  (debounced 250ms)
// ════════════════════════════════════════════════════════════
let searchTimer;
searchInput.addEventListener("input", function() {
  clearSearch.style.display = this.value ? "block" : "none";
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; applyFilter(); }, 250);
});

clearSearch.addEventListener("click", function() {
  searchInput.value = "";
  clearSearch.style.display = "none";
  currentPage = 1;
  applyFilter();
  searchInput.focus();
});

// Per-page change
perPageSelect.addEventListener("change", function() {
  perPage = parseInt(this.value) || 0;
  currentPage = 1;
  applyFilter();
});

// ════════════════════════════════════════════════════════════
//  FILTER  (view + dept + search combined)
// ════════════════════════════════════════════════════════════
function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();

  filteredPosters = viewPosters.filter(p => {
    const matchDept   = activeDept === "All" || p.department === activeDept;
    const matchSearch = !q || p.name.toLowerCase().includes(q);
    return matchDept && matchSearch;
  });

  updateResultBar(q);
  renderPage();
}

function updateResultBar(q) {
  const active = q || activeDept !== "All";
  resultBar.style.display = active ? "flex" : "none";
  if (!active) { resultInfo.textContent = ""; return; }
  const n     = filteredPosters.length;
  const parts = [];
  if (activeDept !== "All") parts.push(`Dept: ${activeDept}`);
  if (q) parts.push(`"${q}"`);
  resultInfo.textContent = `${n} result${n !== 1 ? "s" : ""} for ${parts.join(" + ")}`;
}

function clearAllFilters() {
  searchInput.value         = "";
  clearSearch.style.display = "none";
  activeDept                = "All";
  document.querySelectorAll(".g-dept-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.dept === "All");
  });
  currentPage = 1;
  applyFilter();
}

// ════════════════════════════════════════════════════════════
//  RENDER
// ════════════════════════════════════════════════════════════
function renderPage() {
  grid.innerHTML           = "";
  emptyState.style.display = "none";

  if (filteredPosters.length === 0) {
    emptyState.style.display = "flex";
    pagination.style.display = "none";
    return;
  }

  let slice;
  if (perPage === 0) {
    slice = filteredPosters;
  } else {
    const totalPages = Math.ceil(filteredPosters.length / perPage);
    currentPage      = Math.max(1, Math.min(currentPage, totalPages));
    const start      = (currentPage - 1) * perPage;
    slice            = filteredPosters.slice(start, start + perPage);
  }

  slice.forEach(p => grid.appendChild(buildCard(p)));

  if (perPage === 0 || filteredPosters.length <= perPage) {
    pagination.style.display = "none";
  } else {
    renderPagination(Math.ceil(filteredPosters.length / perPage));
  }
}

// ════════════════════════════════════════════════════════════
//  BUILD CARD
// ════════════════════════════════════════════════════════════
function buildCard(poster) {
  const card      = document.createElement("div");
  card.className  = "g-card";
  card.dataset.id = poster.id;

  /* ── Image wrap ── */
  const imgWrap     = document.createElement("div");
  imgWrap.className = "g-card-img-wrap";

  const isVisible = poster.showInGallery !== false && Boolean(poster.thumbUrl);

  if (isVisible) {
    const img     = document.createElement("img");
    img.className = "g-card-img";
    img.alt       = poster.name;
    img.loading   = "lazy";
    img.src       = poster.thumbUrl;
    img.onerror   = () => {
      imgWrap.innerHTML = `
        <div class="g-card-img-placeholder">
          <div class="g-dummy-icon-wrap">
            <span class="g-dummy-avatar">🎓</span>
          </div>
        </div>`;
    };
    imgWrap.appendChild(img);
  } else {
    // Dummy image placeholder (Photo Hidden)
    imgWrap.innerHTML = `
      <div class="g-card-img-placeholder">
        <div class="g-dummy-icon-wrap">
          <span class="g-dummy-avatar">👤</span>
        </div>
        <span class="g-dummy-label">Photo Hidden</span>
      </div>`;
  }

  const done = isPosterDone(poster);

  // Done badge (always shown for OK posters)
  if (done) {
    const badge       = document.createElement("div");
    badge.className   = "g-done-badge";
    badge.textContent = "Done";
    imgWrap.appendChild(badge);
  }

  /* ── Card body ── */
  const body        = document.createElement("div");
  body.className    = "g-card-body";

  const nameEl      = document.createElement("div");
  nameEl.className  = "g-card-name";
  nameEl.textContent= poster.name;
  nameEl.title      = poster.name;

  const deptEl      = document.createElement("div");
  deptEl.className  = "g-card-dept";
  deptEl.textContent= poster.department;

  body.append(nameEl, deptEl);

  /* ── Non-OK: show warning + enabled button ── */
  if (!done) {
    const warn     = document.createElement("div");
    warn.className = "g-card-warning";
    warn.innerHTML =
      `<span class="g-card-warning-icon">⚠️</span>` +
      `<span>Once added you <strong>can't change</strong> your username. It's <strong>admin-only</strong> — never public.</span>`;

    const btn       = document.createElement("button");
    btn.className   = "g-add-btn";
    btn.innerHTML   =
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Add Your Username`;
    btn.onclick     = () => openModal(poster.id, poster.name);
    body.append(warn, btn);
  }

  card.append(imgWrap, body);
  return card;
}

// ════════════════════════════════════════════════════════════
//  PAGINATION
// ════════════════════════════════════════════════════════════
function renderPagination(totalPages) {
  const pageNums = document.getElementById("pageNums");
  pageNums.innerHTML = "";
  if (totalPages <= 1) { pagination.style.display = "none"; return; }
  pagination.style.display = "flex";

  document.getElementById("prevBtn").disabled = currentPage === 1;
  document.getElementById("nextBtn").disabled = currentPage === totalPages;

  buildPageRange(currentPage, totalPages).forEach(p => {
    if (p === "…") {
      const dot       = document.createElement("span");
      dot.style.cssText = "color:#3a5a80;font-size:12px;align-self:center;padding:0 4px";
      dot.textContent = "…";
      pageNums.appendChild(dot);
    } else {
      const btn       = document.createElement("button");
      btn.className   = "g-page-num" + (p === currentPage ? " active" : "");
      btn.textContent = p;
      btn.onclick     = () => goToPage(p);
      pageNums.appendChild(btn);
    }
  });
}

function buildPageRange(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const r = [1];
  if (cur > 3) r.push("…");
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) r.push(p);
  if (cur < total - 2) r.push("…");
  r.push(total);
  return r;
}

function goToPage(p) {
  currentPage = p;
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function changePage(delta) {
  if (perPage === 0) return;
  const total = Math.ceil(filteredPosters.length / perPage);
  const next  = currentPage + delta;
  if (next >= 1 && next <= total) goToPage(next);
}

// ════════════════════════════════════════════════════════════
//  MODAL
// ════════════════════════════════════════════════════════════
function openModal(studentId) {
  activeStudentId        = studentId;
  instaInput.value       = "";
  instaHint.textContent  = "";
  instaHint.className    = "g-modal-hint";
  modalSubmit.disabled   = true;
  modalSubmit.textContent= "Save Username";
  modalOverlay.classList.add("open");
  setTimeout(() => instaInput.focus(), 320);
}

function closeModal() {
  modalOverlay.classList.remove("open");
  activeStudentId = "";
}
function closeModalOnOverlay(e) {
  if (e.target === modalOverlay) closeModal();
}
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

function onInstaInput() {
  const val   = instaInput.value.trim().replace(/^@+/, "");
  const valid = /^[a-zA-Z0-9._]{1,30}$/.test(val);
  if (!val) {
    instaHint.textContent = "";
    instaHint.className   = "g-modal-hint";
    modalSubmit.disabled  = true;
    return;
  }
  if (!valid) {
    instaHint.textContent = "Only letters, numbers, . and _ are allowed.";
    instaHint.className   = "g-modal-hint error";
    modalSubmit.disabled  = true;
    return;
  }
  instaHint.textContent   = "Will be saved as: @" + val;
  instaHint.className     = "g-modal-hint ok";
  modalSubmit.disabled    = false;
}

// ════════════════════════════════════════════════════════════
//  SUBMIT  (JSONP)
// ════════════════════════════════════════════════════════════
function submitUsername() {
  const raw = instaInput.value.trim().replace(/^@+/, "");
  if (!raw || !activeStudentId) return;

  modalSubmit.disabled    = true;
  modalSubmit.textContent = "Saving…";

  const cbName = "igcb_" + Date.now();
  const url    = SCRIPT_URL
    + "?action=updateInstagram"
    + "&id="        + encodeURIComponent(activeStudentId)
    + "&instagram=" + encodeURIComponent(raw)
    + "&callback="  + cbName;

  const script = document.createElement("script");
  script.src   = url;

  const timeout = setTimeout(() => {
    cleanup(); onSubmitError("Request timed out. Please try again.");
  }, 12000);

  window[cbName] = function(data) {
    cleanup();
    data && data.success ? onSubmitSuccess() : onSubmitError((data && data.message) || "Failed. Try again.");
  };

  function cleanup() {
    clearTimeout(timeout);
    if (script.parentNode) script.parentNode.removeChild(script);
    delete window[cbName];
  }

  script.onerror = () => { cleanup(); onSubmitError("Network error."); };
  document.head.appendChild(script);
}

function onSubmitSuccess() {
  // Mark poster as OK in rawPosters (real-time, no re-fetch needed)
  const poster = rawPosters.find(p => String(p.id) === String(activeStudentId));
  if (poster) poster.okStatus = true;

  // Update pending count badge
  updatePendingCount();

  closeModal();
  showToast("Username saved! ✓ Only admins can see it.", "success");
  modalSubmit.textContent = "Save Username";
  modalSubmit.disabled    = false;

  // Re-apply current view + filters (card will animate out in pending, or update in all)
  if (activeView === "pending") {
    // Remove from pending view — animate card out first
    const card = grid.querySelector('[data-id="' + activeStudentId + '"]');
    if (card) {
      card.classList.add("removing");
      setTimeout(() => {
        // Re-apply after animation
        applyView();
      }, 320);
    } else {
      applyView();
    }
  } else {
    // In "all" view: just re-render so the card switches to Done state
    applyView();
  }
}

function onSubmitError(msg) {
  modalSubmit.textContent = "Save Username";
  modalSubmit.disabled    = false;
  showToast(msg, "error");
}

// ════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast     = document.createElement("div");
  toast.className = "toast" + (type === "error" ? " error" : "");
  toast.innerHTML =
    `<div class="toast-icon">${type === "error" ? "✕" : "✓"}</div>` +
    `<div class="toast-content">${message}</div>` +
    `<div class="toast-progress"></div>`;
  container.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add("show")));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 360);
  }, 4000);
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
loadPosters();
