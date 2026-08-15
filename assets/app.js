/* 展厅逻辑：按厂商分组渲染卡片、分类筛选、搜索、1-10 打分(localStorage)、一键按评分排序、iframe 查看器 */
(function () {
  const sites = window.SITES || [];
  const siteBySlug = {};
  sites.forEach(s => { siteBySlug[s.slug] = s; });

  const root = document.getElementById('galleryRoot');
  const searchInput = document.getElementById('searchInput');
  const filterBar = document.getElementById('filterBar');
  const sortToggle = document.getElementById('sortToggle');
  const totalCount = document.getElementById('totalCount');

  const viewer = document.getElementById('viewer');
  const viewerIframe = document.getElementById('viewerIframe');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerBadge = document.getElementById('viewerBadge');
  const viewerCategory = document.getElementById('viewerCategory');
  const viewerCount = document.getElementById('viewerCount');
  const viewerRating = document.getElementById('viewerRating');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnClose = document.getElementById('btnClose');

  const CHANNEL_CLASS = {
    '官网': 'ch-blue',
    '真·官网': 'ch-indigo',
    '标准': 'ch-gray',
    'API 直连': 'ch-orange',
    'Trae': 'ch-purple',
    'WorkBuddy': 'ch-teal',
    'Sol Codex': 'ch-green',
    '官网 · 专家模式': 'ch-rose',
    '中转API': 'ch-cyan',
    'Luna Codex': 'ch-amber',
    'Poe': 'ch-fuchsia',
    '火山方舟': 'ch-lime'
  };

  function channelClass(ch) {
    return CHANNEL_CLASS[ch] || 'ch-gray';
  }

  /* ---------- 评分（localStorage 持久化） ---------- */
  const RATINGS_KEY = 'peilika_ratings_v1';
  // 预置默认评分：新访客直接看到这些分；用户本地手动改过/清除过的以本地为准
  const DEFAULT_RATINGS = {
    'qwen-3-8-max': 10,            // 通义千问 Qwen 3.8 Max
    'gpt-5-6-codex': 9,            // GPT 5.6 (Codex)
    'deepseek-v4-pro-api-0813': 9, // DeepSeek API V4 Pro
    'kimi-k3-wb': 9,               // Kimi K3
    'opus-5-relay': 9              // Claude Opus 5 (中转API)
  };
  let ratings = loadRatings();

  function loadRatings() {
    try {
      const raw = localStorage.getItem(RATINGS_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      const base = (stored && typeof stored === 'object') ? stored : {};
      // 默认分作为基线，本地手动评分覆盖同名项；0 表示用户主动清除
      return Object.assign({}, DEFAULT_RATINGS, base);
    } catch (e) {
      return Object.assign({}, DEFAULT_RATINGS);
    }
  }

  function saveRating(slug, score) {
    if (score == null || score === 0) {
      ratings[slug] = 0; // 主动清除，记为 0 持久保存，避免被默认分覆盖回去
    } else {
      ratings[slug] = score;
    }
    try {
      localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
    } catch (e) { /* 存储不可用时静默降级 */ }
  }

  function getRating(slug) {
    const v = ratings[slug];
    return (typeof v === 'number' && v >= 1 && v <= 10) ? v : 0;
  }

  let activeCategory = '全部';
  let searchTerm = '';
  let sortByRating = false;
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

  function updateSortToggle() {
    sortToggle.classList.toggle('active', sortByRating);
    sortToggle.setAttribute('aria-pressed', String(sortByRating));
  }

  /* 星星评分：5 颗星 × 半星粒度 = 10 分制；底层镂空灰星，上层实心黄星按填充比例裁剪（0/50/100%） */
  function starHTML(cur, slug) {
    const stars = cur ? cur / 2 : 0;
    let html = '';
    for (let i = 0; i < 5; i++) {
      const fill = Math.max(0, Math.min(1, stars - i)) * 100;
      html += `<span class="star"><i class="ti ti-star"></i><i class="ti ti-star-filled fill" style="width:${fill.toFixed(1)}%"></i></span>`;
    }
    const scoreText = cur ? `${cur} 分` : '未评分';
    return `
      <div class="star-rating" data-slug="${escapeHtml(slug)}">
        <div class="stars" role="slider" tabindex="0" aria-label="评分（方向键微调）">${html}</div>
        <span class="star-score${cur ? ' rated' : ''}">${scoreText}</span>
      </div>`;
  }

  function ratingHTML(s) {
    return starHTML(getRating(s.slug), s.slug);
  }

  function viewerRatingHTML(s) {
    return starHTML(getRating(s.slug), s.slug);
  }

  function renderGallery() {
    totalCount.textContent = filteredSites.length;

    if (filteredSites.length === 0) {
      root.innerHTML = '<div class="empty-state">没有匹配的站点，请调整筛选条件。</div>';
      return;
    }

    // 一键按评分排序：跨分类排成榜单（高分在前，未评分在后）
    if (sortByRating) {
      const sorted = [...filteredSites].sort((a, b) => {
        const ra = getRating(a.slug), rb = getRating(b.slug);
        if (rb !== ra) return rb - ra;
        return 0; // 同分时保持原始顺序
      });
      const cards = sorted.map((s, i) => cardHTML(s, i + 1)).join('');
      root.innerHTML = `
        <section class="category-section sort-view">
          <div class="category-title">
            <span class="category-name">评分排行</span>
            <span class="category-count">${sorted.length} 个 · 高分优先</span>
          </div>
          <div class="site-grid">${cards}</div>
        </section>`;
      bindCards();
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

  function cardHTML(s, rank) {
    const rankBadge = rank ? `<span class="rank-badge">No.${rank}</span>` : '';
    return `
      <article class="site-card" tabindex="0" role="button" aria-label="打开 ${escapeHtml(s.model)}" data-slug="${escapeHtml(s.slug)}">
        <div class="thumb-wrap">
          ${rankBadge}
          <img src="${escapeHtml(s.thumb)}" alt="${escapeHtml(s.model)} 缩略图" loading="lazy">
          <div class="card-overlay"><i class="ti ti-eye"></i> 预览</div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span class="channel-badge ${channelClass(s.channel)}">${escapeHtml(s.channel)}</span>
          </div>
          <h3 class="card-title">${escapeHtml(s.model)}</h3>
          <p class="card-file">${escapeHtml(s.file)}</p>
          ${ratingHTML(s)}
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
        if (e.target.closest('.rating')) return; // 评分控件自行处理
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(e);
        }
      });
    });
    bindRatings(root);
  }

  /* 星星交互：悬停预览、点击（左半=半星）/方向键微调，保存后回调 onSave */
  function attachStars(wrap, slug, onSave) {
    const starsEl = wrap.querySelector('.stars');
    const scoreEl = wrap.querySelector('.star-score');

    function applyPreview(stars) {
      [...starsEl.children].forEach((st, i) => {
        const fill = Math.max(0, Math.min(1, stars - i)) * 100;
        st.querySelector('.fill').style.width = fill.toFixed(1) + '%';
      });
      const score = Math.round(stars * 2);
      scoreEl.textContent = score > 0 ? `${score} 分` : '未评分';
      scoreEl.classList.toggle('rated', score > 0);
    }
    function restore() {
      applyPreview(getRating(slug) / 2);
    }
    function calc(e) {
      const rect = starsEl.getBoundingClientRect();
      const raw = (e.clientX - rect.left) / rect.width * 5;
      return Math.max(0.5, Math.min(5, Math.round(raw * 2) / 2));
    }

    starsEl.addEventListener('pointermove', e => applyPreview(calc(e)));
    starsEl.addEventListener('pointerleave', restore);
    starsEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      onSave(Math.round(calc(e) * 2));
      restore();
    });
    starsEl.addEventListener('keydown', e => {
      const cur = getRating(slug) / 2 || 0;
      let next = null;
      if (e.key === 'ArrowRight') next = Math.min(5, cur + 0.5);
      else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 0.5);
      if (next != null) {
        e.preventDefault();
        onSave(Math.round(next * 2));
        restore();
      }
    });
  }

  function bindRatings(scope) {
    scope.querySelectorAll('.star-rating').forEach(wrap => {
      const slug = wrap.dataset.slug;
      attachStars(wrap, slug, score => {
        saveRating(slug, score);
        if (sortByRating) {
          renderGallery(); // 排序视图实时重排
        } else {
          updateCardRating(wrap, slug);
        }
      });
    });
  }

  function updateCardRating(wrap, slug) {
    const s = siteBySlug[slug];
    const tmp = document.createElement('div');
    tmp.innerHTML = ratingHTML(s);
    const newNode = tmp.firstElementChild;
    wrap.replaceWith(newNode);
    bindRatings(newNode); // 仅绑定新节点，避免重复绑定
  }

  function bindViewerRating() {
    const wrap = viewerRating.querySelector('.star-rating');
    if (!wrap) return;
    const slug = wrap.dataset.slug;
    attachStars(wrap, slug, score => {
      saveRating(slug, score);
      updateViewerRating(siteBySlug[slug]);
      syncCardRating(slug);
    });
  }

  function updateViewerRating(s) {
    viewerRating.innerHTML = viewerRatingHTML(s);
    bindViewerRating();
  }

  function syncCardRating(slug) {
    // 同步更新展厅卡片（或排序视图）中的评分状态
    if (sortByRating) {
      renderGallery();
    } else {
      const wrap = root.querySelector(`.site-card[data-slug="${slug}"] .rating`);
      if (wrap) updateCardRating(wrap, slug);
    }
    // 如果当前查看器里就是该站点，也刷新查看器内的评分显示
    const current = filteredSites[currentIndex];
    if (current && current.slug === slug) {
      updateViewerRating(siteBySlug[slug]);
    }
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
    viewerRating.innerHTML = '';
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
    viewerIframe.src = target;
    updateViewerRating(s);
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

  sortToggle.addEventListener('click', () => {
    sortByRating = !sortByRating;
    if (sortByRating) activeCategory = '全部'; // 排序即为全量榜单
    updateSortToggle();
    renderChips();
    applyFilters();
  });

  filterBar.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    activeCategory = chip.dataset.category;
    sortByRating = false; // 选分类即退出排序视图
    updateSortToggle();
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

  updateSortToggle();
  renderChips();
  applyFilters();
})();
