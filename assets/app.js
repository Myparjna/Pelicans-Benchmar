/* 展厅逻辑：按厂商分组渲染卡片、分类筛选、搜索、打开 iframe 查看器并支持左右切换 */
(function () {
  const sites = window.SITES || [];

  const root = document.getElementById('galleryRoot');
  const searchInput = document.getElementById('searchInput');
  const filterBar = document.getElementById('filterBar');
  const totalCount = document.getElementById('totalCount');

  const viewer = document.getElementById('viewer');
  const viewerIframe = document.getElementById('viewerIframe');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerBadge = document.getElementById('viewerBadge');
  const viewerCategory = document.getElementById('viewerCategory');
  const viewerCount = document.getElementById('viewerCount');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnClose = document.getElementById('btnClose');
  const btnOpenNew = document.getElementById('btnOpenNew');

  const CHANNEL_CLASS = {
    '官网风格': 'ch-blue',
    '真·官网': 'ch-indigo',
    '标准': 'ch-gray',
    'API 直连': 'ch-orange',
    'Trae': 'ch-purple',
    'WorkBuddy': 'ch-teal',
    'Sol Codex': 'ch-green',
    '官网风格 · 专家模式': 'ch-rose'
  };

  function channelClass(ch) {
    return CHANNEL_CLASS[ch] || 'ch-gray';
  }

  let activeCategory = '全部';
  let searchTerm = '';
  let filteredSites = [...sites];
  let currentIndex = -1;

  function categories() {
    const list = [];
    for (const s of sites) {
      if (!list.includes(s.category)) list.push(s.category);
    }
    return ['全部', ...list];
  }

  function applyFilters() {
    const term = searchTerm.trim().toLowerCase();
    filteredSites = sites.filter(s => {
      const catOk = activeCategory === '全部' || s.category === activeCategory;
      const hay = (s.model + ' ' + s.category + ' ' + s.channel + ' ' + s.file).toLowerCase();
      const termOk = !term || hay.includes(term);
      return catOk && termOk;
    });
    renderGallery();
  }

  function renderChips() {
    filterBar.innerHTML = categories().map(c => {
      const count = c === '全部'
        ? sites.length
        : sites.filter(s => s.category === c).length;
      const active = c === activeCategory ? 'active' : '';
      return `<button class="filter-chip ${active}" data-category="${escapeHtml(c)}" type="button">${escapeHtml(c)} <span class="chip-count">${count}</span></button>`;
    }).join('');
  }

  function renderGallery() {
    totalCount.textContent = filteredSites.length;

    if (filteredSites.length === 0) {
      root.innerHTML = '<div class="empty-state">没有匹配的站点，请调整筛选条件。</div>';
      return;
    }

    const groups = new Map();
    for (const s of filteredSites) {
      if (!groups.has(s.category)) groups.set(s.category, []);
      groups.get(s.category).push(s);
    }

    const html = [];
    for (const [category, items] of groups) {
      html.push(`
        <section class="category-section">
          <div class="category-title">
            <span class="category-name">${escapeHtml(category)}</span>
            <span class="category-count">${items.length} 个</span>
          </div>
          <div class="site-grid">
            ${items.map(s => cardHTML(s)).join('')}
          </div>
        </section>
      `);
    }
    root.innerHTML = html.join('');
    bindCards();
  }

  function cardHTML(s) {
    return `
      <article class="site-card" tabindex="0" role="button" aria-label="打开 ${escapeHtml(s.model)}" data-slug="${escapeHtml(s.slug)}">
        <div class="thumb-wrap">
          <img src="${escapeHtml(s.thumb)}" alt="${escapeHtml(s.model)} 缩略图" loading="lazy">
          <div class="card-overlay"><i class="ti ti-eye"></i> 预览</div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="channel-badge ${channelClass(s.channel)}">${escapeHtml(s.channel)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(s.model)}</h3>
          <p class="card-file">${escapeHtml(s.file)}</p>
          <button class="open-btn" type="button"><i class="ti ti-eye"></i> 打开查看</button>
        </div>
      </article>
    `;
  }

  function bindCards() {
    document.querySelectorAll('.site-card').forEach(card => {
      const slug = card.dataset.slug;
      function activate(e) {
        if (e.target.closest('.open-btn')) e.stopPropagation();
        openViewer(slug);
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(e);
        }
      });
    });
  }

  function openViewer(slug) {
    const idx = filteredSites.findIndex(s => s.slug === slug);
    if (idx === -1) return;
    currentIndex = idx;
    loadCurrent();
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');
    setTimeout(() => btnClose.focus(), 0);
  }

  function closeViewer() {
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('viewer-open');
    viewerIframe.src = 'about:blank';
    currentIndex = -1;
  }

  function loadCurrent() {
    const s = filteredSites[currentIndex];
    viewerTitle.textContent = s.model;
    viewerCategory.textContent = s.category;
    viewerBadge.textContent = s.channel;
    viewerBadge.className = 'channel-badge ' + channelClass(s.channel);
    viewerCount.textContent = `${currentIndex + 1} / ${filteredSites.length}`;
    const target = s.src; // sites/<slug>.html 已是 ASCII 干净路径，无需编码
    btnOpenNew.href = target;
    viewerIframe.src = target;
  }

  function prev() {
    if (currentIndex > 0) {
      currentIndex--;
      loadCurrent();
    }
  }

  function next() {
    if (currentIndex < filteredSites.length - 1) {
      currentIndex++;
      loadCurrent();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  filterBar.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeCategory = chip.dataset.category;
    renderChips();
    applyFilters();
  });

  searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    applyFilters();
  });

  btnClose.addEventListener('click', closeViewer);
  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);

  viewer.querySelector('.viewer-backdrop').addEventListener('click', closeViewer);

  document.addEventListener('keydown', e => {
    if (viewer.getAttribute('aria-hidden') === 'true') return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });

  renderChips();
  applyFilters();
})();
