/* =============================================================
   gallery.js  –  Senior 2027 FCAI CU
   Add as: <script src="scripts/gallery.js"></script> after main.js
   ============================================================= */

// ⚠️ Replace with your deployed Apps Script Web App URL
const GALLERY_API_URL = "https://script.google.com/macros/s/AKfycbxGJgVz8q2ZAZQ4zvuZIAmjeZz8VlC5cficdvCUbKDm-0v9NZNDYYNFY0j9_a6a7ahw/exec";

const DEPT_ORDER = [
  "Computer Science",
  "Artificial Intelligence",
  "Information Systems",
  "Information Technology",
  "Decision Support"
];

let galleryData   = [];
let galleryLoaded = false;

/* ─── Tab Switcher ─── */
function switchTab(tab) {
  document.querySelectorAll('.top-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('tab-generator').style.display = (tab === 'generator') ? '' : 'none';
  document.getElementById('tab-gallery').style.display   = (tab === 'gallery')   ? '' : 'none';

  if (tab === 'gallery' && !galleryLoaded) loadGallery(false);
}

/* ─── Load via JSONP (bypasses CORS on Apps Script) ─── */
function loadGallery(forceRefresh) {
  const statusEl  = document.getElementById('galleryStatus');
  const contentEl = document.getElementById('galleryContent');

  statusEl.textContent = 'Loading posters…';
  statusEl.className   = 'gallery-status';
  if (forceRefresh) { contentEl.innerHTML = ''; galleryLoaded = false; }

  const cbName = '__galleryCb_' + Date.now();

  const timer = setTimeout(() => {
    cleanup(cbName, tag);
    statusEl.textContent = '⚠️ Request timed out. Check your Apps Script URL.';
    statusEl.classList.add('error');
  }, 15000);

  window[cbName] = function (data) {
    clearTimeout(timer);
    cleanup(cbName, tag);

    if (!data || !data.success) {
      statusEl.textContent = '⚠️ ' + (data && data.message ? data.message : 'Failed to load gallery.');
      statusEl.classList.add('error');
      return;
    }

    galleryData   = data.posters || [];
    galleryLoaded = true;

    if (galleryData.length === 0) {
      statusEl.textContent = 'No posters submitted yet — be the first! 🎓';
      return;
    }

    statusEl.classList.add('hidden');
    renderGallery();
  };

  const tag = document.createElement('script');
  tag.src = GALLERY_API_URL + '?action=list&callback=' + cbName;
  tag.onerror = function () {
    clearTimeout(timer);
    cleanup(cbName, tag);
    statusEl.textContent = '⚠️ Could not reach the server. Check the Apps Script URL / deployment.';
    statusEl.classList.add('error');
  };
  document.body.appendChild(tag);
}

function cleanup(cbName, tag) {
  delete window[cbName];
  if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
}

/* ─── Render Gallery ─── */
function renderGallery() {
  const contentEl   = document.getElementById('galleryContent');
  const searchTerm  = (document.getElementById('gallerySearch').value || '').trim().toLowerCase();
  const deptFilter  = document.getElementById('galleryDeptFilter').value;

  const filtered = galleryData.filter(p =>
    (!searchTerm || p.name.toLowerCase().includes(searchTerm)) &&
    (!deptFilter  || p.department === deptFilter)
  );

  if (filtered.length === 0) {
    contentEl.innerHTML = '<div class="gallery-empty">No posters match your search. 🔍</div>';
    return;
  }

  // Group by department
  const grouped = {};
  filtered.forEach(p => {
    const d = p.department || 'General';
    (grouped[d] = grouped[d] || []).push(p);
  });

  // Sort departments
  const depts = Object.keys(grouped).sort((a, b) => {
    const ia = DEPT_ORDER.indexOf(a), ib = DEPT_ORDER.indexOf(b);
    if (ia < 0 && ib < 0) return a.localeCompare(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  contentEl.innerHTML = depts.map(dept => `
    <section class="dept-section">
      <div class="dept-section-header">
        <h3>${esc(dept)}</h3>
        <span class="dept-count">${grouped[dept].length} poster${grouped[dept].length !== 1 ? 's' : ''}</span>
      </div>
      <div class="gallery-grid">
        ${grouped[dept].map(cardHtml).join('')}
      </div>
    </section>
  `).join('');
}

function cardHtml(p) {
  const n = esc(p.name), d = esc(p.department);
  const thumb = p.thumbUrl || '';
  const cb = `openLightbox('${escAttr(thumb)}','${escAttr(p.name)}','${escAttr(p.department)}')`;
  return `
    <div class="gallery-card" onclick="${cb}">
      <div class="thumb-wrap">
        <div class="img-skeleton"></div>
        <img src="${escAttr(thumb)}" alt="${n}" loading="lazy"
             onload="this.previousElementSibling.style.display='none'"
             onerror="this.previousElementSibling.style.display='none'">
      </div>
      <div class="card-info">
        <div class="card-name">${n}</div>
        <div class="card-dept">${d}</div>
      </div>
    </div>`;
}

/* ─── Lightbox ─── */
function openLightbox(imgUrl, name, dept) {
  let lb = document.getElementById('galleryLightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id        = 'galleryLightbox';
    lb.className = 'gallery-lightbox';
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    lb.innerHTML = `
      <button class="lb-close" onclick="closeLightbox()">&times;</button>
      <div class="lb-body">
        <img id="lbImg" src="" alt="">
        <div class="lb-caption">
          <div class="lb-name" id="lbName"></div>
          <div class="lb-dept" id="lbDept"></div>
        </div>
      </div>`;
    document.body.appendChild(lb);
  }
  document.getElementById('lbImg').src   = imgUrl;
  document.getElementById('lbName').textContent = name;
  document.getElementById('lbDept').textContent = dept;
  lb.classList.add('open');
}

function closeLightbox() {
  const lb = document.getElementById('galleryLightbox');
  if (lb) lb.classList.remove('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ─── Helpers ─── */
function esc(s) {
  return (s || '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
function escAttr(s) { return (s || '').replace(/'/g, "\\'"); }