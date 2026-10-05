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
  const exportBtn = document.getElementById('exportRatings');

  const viewer = document.getElementById('viewer');
  const viewerIframe = document.getElementById('viewerIframe');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerParams = document.getElementById('viewerParams');
  const viewerCutoff = document.getElementById('viewerCutoff');
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
    '火山方舟': 'ch-lime',
    'DSH': 'ch-sky',
    'ZAI': 'ch-violet'
  };

  function channelClass(ch) {
    return CHANNEL_CLASS[ch] || 'ch-gray';
  }

  /* ---------- 评分（localStorage 持久化） ---------- */
  const RATINGS_KEY = 'peilika_ratings_v1';
  // 预置默认评分：新访客直接看到这些分；用户本地手动改过/清除过的以本地为准
  // 2026-10-05 由用户在本地展厅手动评出的基准分（导出文件 peilika-ratings-2026-10-05.json）
  const DEFAULT_RATINGS = {
    'gpt-6': 10,
    'gpt-6-1-sol': 10,
    'gpt-6-sol': 4,
    'gpt-6-luna': 6,
    'gpt-5-6-codex': 7,
    'gpt-5-6-luna-codex': 4,
    'minimax-m3-1': 6,
    'mimo-v2-6': 4,
    'mimo-v2-6-pro': 7,
    'deepseek-v4-1-flash': 9,
    'grok-4-7': 4,
    'seed-2-1-pro-0915': 7,
    'step-5-preview': 7,
    'hy4-preview': 8,
    'spacebunny': 7,
    'kimi-k2-8': 6,
    'claude-sonnet-5-5': 10,
    'claude-opus-5-5-zcode': 10,
    'gemini-3-8': 7,
    'qwen-3-8-flash-api': 9,
    'glm-5-3-flash-zhipu': 5,
    'glm-5-3-flash-zai': 9,
    'glm-5-3-wb': 10,
    'qwen-3-8-27b': 4,
    'gemini-3-7': 6,
    'seed-2-1-pro-trae': 4,
    'deepseek-v4-pro-api-0813': 7,
    'grok-4-6': 1,
    'qwen-3-8-max': 10,
    'deepseek-v4-flash-api-0731': 6,
    'deepseek-v4-flash-0731-dsh-minimal': 6,
    'opus-5-relay': 8,
    'gemini-3-6-flash': 4,
    'kimi-k3-wb': 8,
    'glm-5-2-wb': 6,
    'qwen-3-7-plus': 4,
    'minimax-m3-wb': 2,
    'qianwen-3-6-flash': 2,
    'qwen-3-6-27b': 2,
    'deepseek-v4-pro-0813-dsh-minimal': 9,
    'gemini-3-1-pro': 4,
    'doubao-expert': 3,
    'deepseek-v4-pro-0424-wb': 7,
    'deepseek-v4-flash-0424-wb': 3,
    'hunyuan-hy3-wb': 6
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

  function exportRatings() {
    // 收集所有 32 个 slug 当前评分（含默认分基线 + 用户手动覆盖）
    const site = window.SITES || [];
    const ratingsOut = {};
    for (const s of site) {
      const v = ratings[s.slug];
      if (typeof v === 'number' && v > 0) ratingsOut[s.slug] = v;
    }
    const payload = {
      schema: 'peilika-ratings/v1',
      source: 'peilika.pages.dev',
      exportedAt: new Date().toISOString(),
      count: Object.keys(ratingsOut).length,
      totalSites: site.length,
      ratings: ratingsOut,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `peilika-ratings-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { count: Object.keys(ratingsOut).length, totalSites: site.length, bytes: json.length };
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
      const hay = (s.model + ' ' + s.category + ' ' + s.file).toLowerCase();
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

    // 小分类合并：把相邻的“不足一行”的分类拼成一个 band，共用同一张网格
    // 例如 小米·MiMo(2) + MiniMax(2) 合成一行 4 张，避免右侧大片留白
    const MIN_ROW = 4;
    const bands = [];
    let band = null;
    for (const [category, items] of groups) {
      if (items.length >= MIN_ROW) {
        if (band) { bands.push(band); band = null; }
        bands.push([{ category, items }]);
        continue;
      }
      if (!band) band = [];
      band.push({ category, items });
      const total = band.reduce((n, g) => n + g.items.length, 0);
      if (total >= MIN_ROW) { bands.push(band); band = null; }
    }
    if (band) bands.push(band);

    const html = [];
    for (const bandGroups of bands) {
      const merged = bandGroups.length > 1;
      if (!merged) {
        const g = bandGroups[0];
        html.push(`
          <section class="category-section">
            <div class="category-title">
              <span class="category-name">${escapeHtml(g.category)}</span>
              <span class="category-count">${g.items.length} 个</span>
            </div>
            <div class="site-grid">
              ${g.items.map(s => cardHTML(s)).join('')}
            </div>
          </section>
        `);
        continue;
      }
      // 合并 band：每组“标题+卡片”作为一个占位块，占位宽度 = 自己的卡片数，
      // 这样标题正好落在自己那几张卡的上方
      const cells = bandGroups.map(g => `
            <div class="band-group" style="grid-column: span ${Math.max(1, g.items.length)}">
              <div class="band-title">
                <span class="category-name">${escapeHtml(g.category)}</span>
                <span class="category-count">${g.items.length} 个</span>
              </div>
              <div class="band-cards">
                ${g.items.map(s => cardHTML(s, 0, true)).join('')}
              </div>
            </div>`).join('');
      html.push(`
        <section class="category-section merged-band">
          <div class="site-grid">
            ${cells}
          </div>
        </section>
      `);
    }
    root.innerHTML = html.join('');
    bindCards();
  }

  function cardHTML(s, rank, showCategory) {
    const rankBadge = rank ? `<span class="rank-badge">No.${rank}</span>` : '';
    const categoryBadge = showCategory ? `<span class="category-chip">${escapeHtml(s.category)}</span>` : '';
    const paramsBadge = s.params ? `<span class="params-badge" title="模型总参（激活参未列出）">${escapeHtml(s.params)}</span>` : '';
    const cutoffBadge = s.cutoff ? `<span class="cutoff-badge" title="知识截止日期">截止 ${escapeHtml(s.cutoff)}</span>` : '';
    return `
      <article class="site-card" tabindex="0" role="button" aria-label="打开 ${escapeHtml(s.model)}" data-slug="${escapeHtml(s.slug)}">
        <div class="thumb-wrap">
          ${rankBadge}
          <img class="thumb-static" src="${escapeHtml(s.thumb)}" alt="${escapeHtml(s.model)} 缩略图" loading="lazy">
          <img class="thumb-anim" data-anim="${escapeHtml(s.thumb.replace(/\.png$/, '.webp'))}" alt="" aria-hidden="true">
        </div>
        <div class="card-body">
          <div class="card-meta">
            ${categoryBadge}
            ${paramsBadge}
            ${cutoffBadge}
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
      // 首次悬停时才加载动图（避免 27 张动图全部预下载）
      card.addEventListener('mouseenter', () => {
        const anim = card.querySelector('.thumb-anim');
        if (anim && !anim.src) anim.src = anim.dataset.anim;
      });
      function activate(e) {
        if (e.target.closest('.star-rating')) return; // 评分区不触发打开
        openViewer(slug);
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', e => {
        if (e.target.closest('.star')) return; // 评分控件自行处理
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
      attachStars(wrap, wrap.dataset.slug, score => applyRating(wrap.dataset.slug, score));
    });
  }

  /* 统一评分入口：写入本地存储后同步刷新展厅卡片与查看器显示 */
  function applyRating(slug, score) {
    saveRating(slug, score);
    if (sortByRating) renderGallery();
    refreshCardRating(slug);
    const cur = filteredSites[currentIndex];
    if (cur && cur.slug === slug) updateViewerRating(siteBySlug[slug]);
  }

  function refreshCardRating(slug) {
    const card = root.querySelector(`.site-card[data-slug="${slug}"]`);
    if (!card) return;
    const old = card.querySelector('.star-rating');
    if (!old) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = ratingHTML(siteBySlug[slug]);
    const next = tmp.firstElementChild;
    old.replaceWith(next);
    attachStars(next, slug, score => applyRating(slug, score));
  }

  function bindViewerRating() {
    const wrap = viewerRating.querySelector('.star-rating');
    if (!wrap) return;
    attachStars(wrap, wrap.dataset.slug, score => applyRating(wrap.dataset.slug, score));
  }

  function updateViewerRating(s) {
    viewerRating.innerHTML = viewerRatingHTML(s);
    bindViewerRating();
  }

  function openViewer(slug) {
    const idx = filteredSites.findIndex(s => s.slug === slug);
    if (idx === -1) return;
    currentIndex = idx;
    loadCurrent();
    warmNeighbors();
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');
    setTimeout(() => btnClose.focus(), 0);
  }

  function closeViewer() {
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('viewer-open');
    fileFrames().forEach(f => resetDocFrame(f));
    viewerRating.innerHTML = '';
    currentIndex = -1;
  }

  /* ---------- 相邻页面预加载：三份 iframe 轮转，当前页 + 上一页 + 下一页同时保持已加载状态 ---------- */
  function fileFrames() {
    return [...document.querySelectorAll('.viewer-frame-doc')];
  }

  function warmNeighbors() {
    const frames = fileFrames();
    if (!frames.length) return;
    const wanted = [];
    for (let i = currentIndex - 1; i <= currentIndex + 1; i++) {
      if (i >= 0 && i < filteredSites.length) wanted.push(i);
    }

    const ownerOf = new Map(); // 已在加载某页面的帧：index -> frame
    frames.forEach(f => {
      const idx = Number(f.dataset.currentIndex);
      if (Number.isInteger(idx)) ownerOf.set(idx, f);
    });

    // 回收落在窗口外且非当前页的帧
    frames.forEach(f => {
      const idx = Number(f.dataset.currentIndex);
      if (Number.isInteger(idx) && idx !== currentIndex && !wanted.includes(idx)) resetDocFrame(f);
    });

    wanted.forEach(i => {
      let frame = ownerOf.get(i);
      if (!frame || frame.dataset.currentIndex !== String(i)) {
        // 取一个窗口外的空帧，没有则抢占离当前最远且非当前页的帧
        frame = frames.find(f => f.dataset.currentIndex === undefined)
          || frames.filter(f => f.dataset.currentIndex !== undefined && Number(f.dataset.currentIndex) !== currentIndex)
            .sort((a, b) => Math.abs(Number(b.dataset.currentIndex) - currentIndex) - Math.abs(Number(a.dataset.currentIndex) - currentIndex))[0]
          || frames[0];
      }
      const target = filteredSites[i].src;
      if (frame.dataset.src !== target) {
        frame.src = target;
        frame.dataset.src = target;
      }
      frame.dataset.currentIndex = String(i);
      frame.classList.toggle('is-current', i === currentIndex);
    });
  }

  function resetDocFrame(f) {
    f.src = 'about:blank';
    f.removeAttribute('data-src');
    f.removeAttribute('data-current-index');
    f.classList.remove('is-current');
  }

  function loadCurrent() {
    const s = filteredSites[currentIndex];
    viewerTitle.textContent = s.model;
    viewerCategory.textContent = s.category;
    if (viewerParams) {
      viewerParams.textContent = s.params || '';
      viewerParams.style.display = s.params ? '' : 'none';
    }
    if (viewerCutoff) {
      viewerCutoff.textContent = s.cutoff ? `截止 ${s.cutoff}` : '';
      viewerCutoff.style.display = s.cutoff ? '' : 'none';
    }
    viewerCount.textContent = `${currentIndex + 1} / ${filteredSites.length}`;
    warmNeighbors(); // 当前页若已被预加载则直接显示，否则在此加载并同时预热相邻页
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

  function currentDocFrame() {
    const frames = fileFrames();
    if (!frames.length) return viewerIframe;
    return frames.find(f => f.dataset.currentIndex === String(currentIndex)) || frames[0];
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

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const r = exportRatings();
      const orig = exportBtn.innerHTML;
      exportBtn.innerHTML = `<i class="ti ti-check"></i> 已导出 ${r.count} 条`;
      setTimeout(() => { exportBtn.innerHTML = orig; }, 1600);
    });
  }

  updateSortToggle();
  renderChips();
  applyFilters();

  /* ---------- 顶部提示词：点击复制（大厅 + 查看器两处） ---------- */
  const PROMPT_TEXT = '生成一个鹈鹕白天骑自行车的网页动画，单个html文件给我，要求能自适应网页宽度，兼容手机竖屏与电脑横屏显示。每过5秒进行晴天-阴天-雨天-晴天的天气自动切换。不使用任何skills。';

  function bindPromptCopy(box, iconId) {
    const icon = document.getElementById(iconId);
    function done() {
      box.classList.add('copied');
      icon.classList.remove('ti-copy');
      icon.classList.add('ti-check');
      setTimeout(() => {
        box.classList.remove('copied');
        icon.classList.remove('ti-check');
        icon.classList.add('ti-copy');
      }, 1600);
    }
    function legacyCopy() {
      const ta = document.createElement('textarea');
      ta.value = PROMPT_TEXT;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* 忽略 */ }
      document.body.removeChild(ta);
      if (ok) done();
    }
    function copy() {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(PROMPT_TEXT).then(done, legacyCopy);
      } else {
        legacyCopy();
      }
    }
    box.addEventListener('click', copy);
    box.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copy();
      }
    });
  }

  bindPromptCopy(document.getElementById('promptBox'), 'promptCopyIcon');
  bindPromptCopy(document.getElementById('viewerPrompt'), 'viewerPromptIcon');
})();
