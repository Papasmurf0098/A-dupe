import {
  FAMILY_ORDER,
  catalogStats,
  deriveFacets,
  filterCatalog,
  getCategories,
  getRelated,
  normalizeCatalog,
  sortCatalog,
} from './catalog.js';
import {
  loadFavorites,
  loadPreferences,
  loadRecent,
  pushRecent,
  saveFavorites,
  savePreferences,
} from './storage.js';

const app = document.querySelector('#app');
const PAGE_STEP = 42;

const state = {
  entries: [],
  query: '',
  family: 'All',
  category: 'All',
  confidence: 'All',
  pairingsOnly: false,
  caveatsOnly: false,
  scope: 'all',
  sort: 'name',
  density: 'comfortable',
  visible: PAGE_STEP,
  selectedId: null,
  favorites: loadFavorites(),
  recent: loadRecent(),
  scrollY: 0,
};

const preferences = loadPreferences();
state.sort = preferences.sort;
state.density = preferences.density;

let facets = null;
let elements = {};

boot();

async function boot() {
  try {
    const response = await fetch('./data/drinks.json');
    if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
    state.entries = normalizeCatalog(await response.json());
    facets = deriveFacets(state.entries);
    hydrateFromUrl();
    renderShell();
    bindEvents();
    renderAll();
    registerServiceWorker();
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <section class="fatal-state">
        <span class="fatal-state__mark">N</span>
        <h1>Library unavailable</h1>
        <p>${escapeHtml(error.message)}</p>
        <button class="button button--primary" onclick="location.reload()">Try again</button>
      </section>`;
  }
}

function renderShell() {
  const stats = catalogStats(state.entries);
  app.innerHTML = `
    <header class="masthead">
      <a class="brand" href="${escapeAttribute(window.location.pathname)}" data-action="reset" aria-label="Nightcap Library home">
        <span class="brand__monogram">N</span>
        <span class="brand__type"><strong>Nightcap</strong><small>Library</small></span>
      </a>

      <label class="command-search" aria-label="Search the drink library">
        <span class="command-search__icon">${icon('search')}</span>
        <input id="searchInput" type="search" placeholder="Bottle, style, producer, flavor…" autocomplete="off" />
        <kbd>/</kbd>
      </label>

      <nav class="masthead__actions" aria-label="Library actions">
        <button class="icon-button hide-mobile" data-action="random" title="Open a random profile" aria-label="Open a random profile">${icon('shuffle')}</button>
        <button class="saved-button" data-scope="favorites" aria-pressed="false">
          ${icon('bookmark')}
          <span>Saved</span>
          <b id="favoriteCount">0</b>
        </button>
      </nav>
    </header>

    <main class="workspace">
      <aside class="family-rack" aria-label="Drink families">
        <div class="family-rack__label">Library</div>
        <div id="familyTabs" class="family-rack__tabs"></div>
        <div class="family-rack__foot">
          <span>${stats.total}</span>
          <small>profiles</small>
        </div>
      </aside>

      <section class="library-stage">
        <header class="stage-header">
          <div>
            <p id="stageKicker" class="stage-kicker">Full collection</p>
            <h1 id="stageTitle">The Library</h1>
            <p id="stageSummary" class="stage-summary"></p>
          </div>
          <div class="stage-header__tools">
            <button class="text-button" data-action="random">${icon('spark')} Discover</button>
            <button id="filterToggle" class="text-button" data-action="toggle-filters" aria-expanded="false">${icon('sliders')} Refine</button>
          </div>
        </header>

        <div class="view-strip" role="navigation" aria-label="Library views">
          <button class="view-chip" data-scope="all">All</button>
          <button class="view-chip" data-scope="favorites">${icon('bookmark')} Saved <span id="savedChipCount">0</span></button>
          <button class="view-chip" data-scope="recent">${icon('clock')} Recent</button>
        </div>

        <section id="filterDrawer" class="filter-drawer" aria-hidden="true">
          <div class="filter-group filter-group--wide">
            <span class="filter-label">Category</span>
            <div id="categoryTabs" class="category-tabs"></div>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="confidenceSelect">Confidence</label>
            <select id="confidenceSelect" class="select-control">
              <option value="All">Any</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label" for="sortSelect">Sort</label>
            <select id="sortSelect" class="select-control">
              <option value="name">A–Z</option>
              <option value="name-desc">Z–A</option>
              <option value="family">Family</option>
              <option value="confidence">Confidence</option>
              <option value="original">Source order</option>
            </select>
          </div>
          <div class="filter-group filter-group--toggles">
            <label class="switch-row"><input id="pairingsOnly" type="checkbox" /> <span>Has pairings</span></label>
            <label class="switch-row"><input id="caveatsOnly" type="checkbox" /> <span>Has caveats</span></label>
          </div>
          <div class="filter-group filter-group--density">
            <span class="filter-label">Density</span>
            <div class="segmented-control">
              <button data-density="comfortable" title="Comfortable cards">Comfort</button>
              <button data-density="compact" title="Compact cards">Compact</button>
            </div>
          </div>
          <button class="clear-filter" data-action="clear-filters">Clear filters</button>
        </section>

        <div class="result-bar">
          <p id="resultCount"></p>
          <div id="activeFilters" class="active-filters"></div>
        </div>

        <section id="catalogDeck" class="catalog-deck" aria-label="Drink profiles"></section>
        <div id="loadMoreWrap" class="load-more-wrap"></div>
      </section>
    </main>

    <div id="profileLayer" class="profile-layer" aria-hidden="true">
      <button class="profile-scrim" data-action="close-profile" tabindex="-1" aria-label="Close profile"></button>
      <article id="profilePanel" class="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profileTitle"></article>
    </div>

    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  `;

  elements = {
    searchInput: document.querySelector('#searchInput'),
    familyTabs: document.querySelector('#familyTabs'),
    categoryTabs: document.querySelector('#categoryTabs'),
    confidenceSelect: document.querySelector('#confidenceSelect'),
    sortSelect: document.querySelector('#sortSelect'),
    pairingsOnly: document.querySelector('#pairingsOnly'),
    caveatsOnly: document.querySelector('#caveatsOnly'),
    filterDrawer: document.querySelector('#filterDrawer'),
    filterToggle: document.querySelector('#filterToggle'),
    catalogDeck: document.querySelector('#catalogDeck'),
    loadMoreWrap: document.querySelector('#loadMoreWrap'),
    resultCount: document.querySelector('#resultCount'),
    activeFilters: document.querySelector('#activeFilters'),
    favoriteCount: document.querySelector('#favoriteCount'),
    savedChipCount: document.querySelector('#savedChipCount'),
    stageKicker: document.querySelector('#stageKicker'),
    stageTitle: document.querySelector('#stageTitle'),
    stageSummary: document.querySelector('#stageSummary'),
    profileLayer: document.querySelector('#profileLayer'),
    profilePanel: document.querySelector('#profilePanel'),
    toast: document.querySelector('#toast'),
  };
}

function bindEvents() {
  let searchTimer;
  elements.searchInput.addEventListener('input', (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = event.target.value;
      state.visible = PAGE_STEP;
      syncUrl({ replace: true });
      renderLibrary();
    }, 90);
  });

  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('popstate', () => {
    hydrateFromUrl();
    renderAll({ fromHistory: true });
  });
}

function handleClick(event) {
  const actionTarget = event.target.closest('[data-action]');
  const familyTarget = event.target.closest('.family-tab[data-family]');
  const categoryTarget = event.target.closest('[data-category]');
  const scopeTarget = event.target.closest('[data-scope]');
  const drinkTarget = event.target.closest('[data-drink-id]');
  const favoriteTarget = event.target.closest('[data-favorite-id]');
  const densityTarget = event.target.closest('.segmented-control [data-density]');

  if (favoriteTarget) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(favoriteTarget.dataset.favoriteId);
    return;
  }

  if (drinkTarget) {
    openProfile(drinkTarget.dataset.drinkId);
    return;
  }

  if (familyTarget) {
    setFamily(familyTarget.dataset.family);
    return;
  }

  if (categoryTarget) {
    state.category = categoryTarget.dataset.category;
    state.visible = PAGE_STEP;
    syncUrl({ replace: true });
    renderLibrary();
    return;
  }

  if (scopeTarget) {
    setScope(scopeTarget.dataset.scope);
    return;
  }

  if (densityTarget) {
    state.density = densityTarget.dataset.density;
    savePreferences({ sort: state.sort, density: state.density });
    renderLibrary();
    return;
  }

  if (!actionTarget) return;
  const action = actionTarget.dataset.action;
  if (action === 'reset') {
    event.preventDefault();
    resetState();
  } else if (action === 'random') {
    openRandomProfile();
  } else if (action === 'toggle-filters') {
    const open = !elements.filterDrawer.classList.contains('is-open');
    elements.filterDrawer.classList.toggle('is-open', open);
    elements.filterDrawer.setAttribute('aria-hidden', String(!open));
    elements.filterToggle.setAttribute('aria-expanded', String(open));
  } else if (action === 'clear-filters') {
    clearFilters();
  } else if (action === 'load-more') {
    state.visible += PAGE_STEP;
    renderResults();
  } else if (action === 'close-profile') {
    closeProfile();
  } else if (action === 'share-profile') {
    shareCurrentProfile();
  }
}

function handleChange(event) {
  if (event.target === elements.confidenceSelect) {
    state.confidence = event.target.value;
  } else if (event.target === elements.sortSelect) {
    state.sort = event.target.value;
    savePreferences({ sort: state.sort, density: state.density });
  } else if (event.target === elements.pairingsOnly) {
    state.pairingsOnly = event.target.checked;
  } else if (event.target === elements.caveatsOnly) {
    state.caveatsOnly = event.target.checked;
  } else {
    return;
  }
  state.visible = PAGE_STEP;
  syncUrl({ replace: true });
  renderLibrary();
}

function handleKeydown(event) {
  const keyboardCard = event.target.closest?.('[data-drink-id]');
  if (keyboardCard && (event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
    event.preventDefault();
    openProfile(keyboardCard.dataset.drinkId);
    return;
  }
  if (event.key === '/' && !isTypingTarget(event.target)) {
    event.preventDefault();
    elements.searchInput.focus();
    elements.searchInput.select();
  }
  if (event.key === 'Escape' && state.selectedId) {
    closeProfile();
  }
  if ((event.key === 'r' || event.key === 'R') && !isTypingTarget(event.target) && !state.selectedId) {
    openRandomProfile();
  }
}

function renderAll({ fromHistory = false } = {}) {
  elements.searchInput.value = state.query;
  elements.confidenceSelect.value = state.confidence;
  elements.sortSelect.value = state.sort;
  elements.pairingsOnly.checked = state.pairingsOnly;
  elements.caveatsOnly.checked = state.caveatsOnly;
  renderFamilyTabs();
  renderLibrary();
  updateFavoriteUI();

  if (state.selectedId) {
    renderProfile(state.selectedId, { fromHistory });
  } else {
    hideProfile({ restoreScroll: false });
  }
}

function renderLibrary() {
  document.body.dataset.family = state.family;
  document.body.dataset.density = state.density;
  renderFamilyTabs();
  renderCategories();
  renderStageHeader();
  renderScopeTabs();
  renderActiveFilters();
  renderResults();
  renderDensityControl();
  updateFavoriteUI();
}

function renderFamilyTabs() {
  elements.familyTabs.innerHTML = FAMILY_ORDER.map((family) => {
    const count = facets.familyCounts[family] || 0;
    const active = state.family === family;
    return `
      <button class="family-tab ${active ? 'is-active' : ''}" data-family="${escapeAttribute(family)}" aria-pressed="${active}">
        <span class="family-tab__index">${family === 'All' ? '00' : String(FAMILY_ORDER.indexOf(family)).padStart(2, '0')}</span>
        <span class="family-tab__name">${escapeHtml(family)}</span>
        <span class="family-tab__count">${count}</span>
      </button>`;
  }).join('');
}

function renderCategories() {
  const categories = getCategories(state.entries, state.family);
  if (state.category !== 'All' && !categories.some((item) => item.name === state.category)) state.category = 'All';
  elements.categoryTabs.innerHTML = [
    `<button class="category-tab ${state.category === 'All' ? 'is-active' : ''}" data-category="All">All</button>`,
    ...categories.map(({ name, count }) => `
      <button class="category-tab ${state.category === name ? 'is-active' : ''}" data-category="${escapeAttribute(name)}">
        ${escapeHtml(name)} <span>${count}</span>
      </button>`),
  ].join('');
}

function renderStageHeader() {
  const filtered = getFiltered();
  const scopeLabels = { all: 'Full collection', favorites: 'Saved collection', recent: 'Recently viewed' };
  elements.stageKicker.textContent = scopeLabels[state.scope] || 'Collection';
  elements.stageTitle.textContent = state.family === 'All' ? 'The Library' : state.family;

  const descriptors = [];
  if (state.category !== 'All') descriptors.push(state.category);
  if (state.query) descriptors.push(`“${state.query}”`);
  elements.stageSummary.textContent = descriptors.length
    ? `${filtered.length} matching profile${filtered.length === 1 ? '' : 's'} · ${descriptors.join(' · ')}`
    : `${filtered.length} profile${filtered.length === 1 ? '' : 's'} · tasting notes, pairings, origin and source context`;
}

function renderScopeTabs() {
  document.querySelectorAll('[data-scope]').forEach((button) => {
    const active = button.dataset.scope === state.scope;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderActiveFilters() {
  const filters = [];
  if (state.query) filters.push(['Search', state.query]);
  if (state.category !== 'All') filters.push(['Category', state.category]);
  if (state.confidence !== 'All') filters.push(['Confidence', state.confidence]);
  if (state.pairingsOnly) filters.push(['Pairings', 'Required']);
  if (state.caveatsOnly) filters.push(['Caveats', 'Present']);

  elements.activeFilters.innerHTML = filters.map(([label, value]) => `
    <span class="active-filter"><small>${escapeHtml(label)}</small>${escapeHtml(value)}</span>
  `).join('');
}

function renderResults() {
  const results = getFiltered();
  const visible = results.slice(0, state.visible);
  elements.resultCount.textContent = `${results.length} ${results.length === 1 ? 'profile' : 'profiles'}`;

  if (!results.length) {
    elements.catalogDeck.innerHTML = emptyState();
    elements.loadMoreWrap.innerHTML = '';
    return;
  }

  elements.catalogDeck.innerHTML = visible.map((entry, index) => cardMarkup(entry, index)).join('');
  elements.loadMoreWrap.innerHTML = results.length > visible.length
    ? `<button class="load-more" data-action="load-more">Show ${Math.min(PAGE_STEP, results.length - visible.length)} more <span>${visible.length} / ${results.length}</span></button>`
    : `<div class="end-mark"><span>N</span><small>End of selection</small></div>`;
}

function cardMarkup(entry, index) {
  const strength = formatStrength(entry.strength);
  const tags = cardTags(entry).slice(0, 2);
  const saved = state.favorites.has(entry.id);
  const subtitle = [entry.subtype || entry.varietal, entry.producer].filter(Boolean).join(' · ');
  return `
    <article class="catalog-card" data-drink-id="${escapeAttribute(entry.id)}" tabindex="0" style="--card-order:${index % 12}">
      <div class="catalog-card__edge" aria-hidden="true"></div>
      <div class="catalog-card__topline">
        <span class="catalog-card__category">${escapeHtml(entry.category)}</span>
        <button class="card-save ${saved ? 'is-saved' : ''}" data-favorite-id="${escapeAttribute(entry.id)}" aria-label="${saved ? 'Remove from saved' : 'Save profile'}">${icon('bookmark')}</button>
      </div>
      <div class="catalog-card__body">
        <p class="catalog-card__family">${escapeHtml(entry.family)}</p>
        <h2>${escapeHtml(entry.name)}</h2>
        ${subtitle ? `<p class="catalog-card__meta">${escapeHtml(subtitle)}</p>` : ''}
        <p class="catalog-card__preview">${escapeHtml(entry._preview)}</p>
      </div>
      <footer class="catalog-card__footer">
        <div class="micro-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
        ${strength ? `<strong>${escapeHtml(strength)}</strong>` : ''}
      </footer>
    </article>`;
}

function renderDensityControl() {
  document.querySelectorAll('[data-density]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.density === state.density);
  });
}

function openProfile(id) {
  if (!state.entries.some((entry) => entry.id === id)) return;
  state.scrollY = window.scrollY;
  state.selectedId = id;
  state.recent = pushRecent(state.recent, id);
  syncUrl({ push: true });
  renderProfile(id);
}

function renderProfile(id, { fromHistory = false } = {}) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) {
    state.selectedId = null;
    syncUrl({ replace: true });
    hideProfile({ restoreScroll: false });
    return;
  }

  if (!fromHistory) state.recent = pushRecent(state.recent, id);
  const related = getRelated(state.entries, entry, 6);
  const saved = state.favorites.has(entry.id);
  const strength = formatStrength(entry.strength);
  const sourceFields = researchFields(entry);

  elements.profilePanel.innerHTML = `
    <header class="profile-toolbar">
      <button class="profile-back" data-action="close-profile">${icon('arrow-left')} Library</button>
      <div class="profile-toolbar__actions">
        <button class="icon-button ${saved ? 'is-saved' : ''}" data-favorite-id="${escapeAttribute(entry.id)}" title="${saved ? 'Remove from saved' : 'Save profile'}">${icon('bookmark')}</button>
        <button class="icon-button" data-action="share-profile" title="Share profile">${icon('share')}</button>
        <button class="icon-button" data-action="close-profile" title="Close profile">${icon('x')}</button>
      </div>
    </header>

    <div class="profile-scroll">
      <section class="profile-hero">
        <div class="profile-hero__index">${String(entry._index + 1).padStart(3, '0')}</div>
        <div class="profile-hero__copy">
          <p>${escapeHtml(entry.family)} <span>·</span> ${escapeHtml(entry.category)}</p>
          <h1 id="profileTitle">${escapeHtml(entry.name)}</h1>
          <div class="profile-badges">${profileBadges(entry).map((badge) => `<span>${escapeHtml(badge)}</span>`).join('')}</div>
        </div>
        <div class="profile-hero__strength">
          ${strength ? `<strong>${escapeHtml(strength)}</strong><small>Strength</small>` : '<strong>—</strong><small>Strength</small>'}
        </div>
      </section>

      <section class="profile-facts">
        ${factMarkup('Producer', entry.producer)}
        ${factMarkup('Origin', entry.origin?.display)}
        ${factMarkup(entry.varietal ? 'Varietal' : 'Style', entry.varietal || entry.subtype)}
        ${factMarkup('Proof', entry.strength?.proofDisplay || numberValue(entry.strength?.proof))}
      </section>

      <div class="profile-grid">
        <main class="profile-main">
          ${tastingMarkup(entry)}
          ${pairingsMarkup(entry)}
          ${signatureMarkup(entry)}
          ${relatedMarkup(related)}
        </main>

        <aside class="profile-aside">
          ${quickReadMarkup(entry)}
          <details class="research-panel">
            <summary><span>Accuracy & sources</span>${icon('chevron-down')}</summary>
            <div class="research-panel__body">
              <div class="research-status">${researchBadgeMarkup(entry)}</div>
              ${sourceFields.map(([label, value]) => `<div class="research-row"><small>${escapeHtml(label)}</small><p>${escapeHtml(value)}</p></div>`).join('')}
            </div>
          </details>
        </aside>
      </div>
    </div>
  `;

  elements.profileLayer.classList.add('is-open');
  elements.profileLayer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('profile-open');
  document.body.dataset.family = entry.family || state.family;
  requestAnimationFrame(() => elements.profilePanel.querySelector('.profile-back')?.focus({ preventScroll: true }));
  updateFavoriteUI();
}

function closeProfile() {
  if (!state.selectedId) return;
  state.selectedId = null;
  syncUrl({ push: true });
  hideProfile({ restoreScroll: true });
}

function hideProfile({ restoreScroll = true } = {}) {
  elements.profileLayer?.classList.remove('is-open');
  elements.profileLayer?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('profile-open');
  document.body.dataset.family = state.family;
  if (restoreScroll) requestAnimationFrame(() => window.scrollTo({ top: state.scrollY, behavior: 'auto' }));
}

function setFamily(family) {
  state.family = FAMILY_ORDER.includes(family) ? family : 'All';
  state.category = 'All';
  state.visible = PAGE_STEP;
  syncUrl({ replace: true });
  renderLibrary();
}

function setScope(scope) {
  state.scope = ['all', 'favorites', 'recent'].includes(scope) ? scope : 'all';
  state.visible = PAGE_STEP;
  syncUrl({ replace: true });
  renderLibrary();
}

function clearFilters() {
  state.query = '';
  state.category = 'All';
  state.confidence = 'All';
  state.pairingsOnly = false;
  state.caveatsOnly = false;
  state.visible = PAGE_STEP;
  elements.searchInput.value = '';
  syncUrl({ replace: true });
  renderAll();
}

function resetState() {
  Object.assign(state, {
    query: '', family: 'All', category: 'All', confidence: 'All',
    pairingsOnly: false, caveatsOnly: false, scope: 'all', visible: PAGE_STEP, selectedId: null,
  });
  syncUrl({ replace: true });
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast('Removed from saved');
  } else {
    state.favorites.add(id);
    showToast('Saved to your library');
  }
  saveFavorites(state.favorites);
  updateFavoriteUI();
  if (state.scope === 'favorites') renderLibrary();
  if (state.selectedId === id) renderProfile(id, { fromHistory: true });
  else renderResults();
}

function updateFavoriteUI() {
  if (!elements.favoriteCount) return;
  elements.favoriteCount.textContent = state.favorites.size;
  elements.savedChipCount.textContent = state.favorites.size;
}

function openRandomProfile() {
  const pool = getFiltered();
  const source = pool.length ? pool : state.entries;
  const entry = source[Math.floor(Math.random() * source.length)];
  if (entry) openProfile(entry.id);
}

function getFiltered() {
  const filtered = filterCatalog(state.entries, state);
  if (state.scope === 'recent') {
    const order = new Map(state.recent.map((id, index) => [id, index]));
    return filtered.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }
  return sortCatalog(filtered, state.sort);
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get('q') || '';
  state.family = FAMILY_ORDER.includes(params.get('family')) ? params.get('family') : 'All';
  state.category = params.get('category') || 'All';
  state.confidence = ['High', 'Medium', 'Low'].includes(params.get('confidence')) ? params.get('confidence') : 'All';
  state.scope = ['favorites', 'recent'].includes(params.get('scope')) ? params.get('scope') : 'all';
  state.pairingsOnly = params.get('pairings') === '1';
  state.caveatsOnly = params.get('caveats') === '1';
  state.sort = ['name', 'name-desc', 'family', 'confidence', 'original'].includes(params.get('sort')) ? params.get('sort') : state.sort;
  state.selectedId = params.get('drink');
  state.visible = PAGE_STEP;
}

function syncUrl({ push = false, replace = false } = {}) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.family !== 'All') params.set('family', state.family);
  if (state.category !== 'All') params.set('category', state.category);
  if (state.confidence !== 'All') params.set('confidence', state.confidence);
  if (state.scope !== 'all') params.set('scope', state.scope);
  if (state.pairingsOnly) params.set('pairings', '1');
  if (state.caveatsOnly) params.set('caveats', '1');
  if (state.sort !== 'name') params.set('sort', state.sort);
  if (state.selectedId) params.set('drink', state.selectedId);
  const url = `${window.location.pathname}${params.size ? `?${params}` : ''}`;
  if (push) history.pushState({}, '', url);
  else if (replace) history.replaceState({}, '', url);
  else history.replaceState({}, '', url);
}

async function shareCurrentProfile() {
  const entry = state.entries.find((item) => item.id === state.selectedId);
  if (!entry) return;
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: entry.name, text: `${entry.name} — Nightcap Library`, url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Profile link copied');
    }
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('Unable to share this profile');
  }
}

function tastingMarkup(entry) {
  const aroma = entry.tasting?.aroma || [];
  const flavor = entry.tasting?.flavor || [];
  if (!aroma.length && !flavor.length && !entry.tasting?.body && !entry.tasting?.finish) return '';
  return `
    <section class="content-section tasting-section">
      <div class="section-heading"><span>01</span><h2>Tasting profile</h2></div>
      ${aroma.length ? noteGroup('Aroma', aroma) : ''}
      ${flavor.length ? noteGroup('Palate', flavor) : ''}
      <div class="tasting-prose">
        ${entry.tasting?.body ? `<div><small>Body</small><p>${escapeHtml(entry.tasting.body)}</p></div>` : ''}
        ${entry.tasting?.finish ? `<div><small>Finish</small><p>${escapeHtml(entry.tasting.finish)}</p></div>` : ''}
      </div>
    </section>`;
}

function noteGroup(label, notes) {
  return `<div class="note-group"><small>${label}</small><div>${notes.map((note) => `<span>${escapeHtml(note)}</span>`).join('')}</div></div>`;
}

function pairingsMarkup(entry) {
  const groups = Object.entries(entry.pairings || {}).filter(([, values]) => values?.length);
  if (!groups.length) return '';
  return `
    <section class="content-section">
      <div class="section-heading"><span>02</span><h2>Pairings</h2></div>
      <div class="pairing-grid">${groups.map(([key, values]) => `
        <div class="pairing-group">
          <small>${escapeHtml(displayKey(key))}</small>
          <p>${values.map(escapeHtml).join(' · ')}</p>
        </div>`).join('')}</div>
    </section>`;
}

function signatureMarkup(entry) {
  if (!entry.signatureTraits?.length) return '';
  return `
    <section class="content-section signature-section">
      <div class="section-heading"><span>03</span><h2>Signature</h2></div>
      ${entry.signatureTraits.map((trait) => `<blockquote>${escapeHtml(trait)}</blockquote>`).join('')}
    </section>`;
}

function relatedMarkup(related) {
  if (!related.length) return '';
  return `
    <section class="content-section related-section">
      <div class="section-heading"><span>04</span><h2>Continue tasting</h2></div>
      <div class="related-rail">${related.map((entry) => `
        <button class="related-card" data-drink-id="${escapeAttribute(entry.id)}">
          <small>${escapeHtml(entry.category)}</small>
          <strong>${escapeHtml(entry.name)}</strong>
          <span>${escapeHtml(entry._preview)}</span>
        </button>`).join('')}</div>
    </section>`;
}

function quickReadMarkup(entry) {
  const tags = [...new Set([...(entry.whiskey?.displayTags || []), ...(entry.tags || []).map(humanize)])].slice(0, 8);
  return `
    <section class="quick-read">
      <p class="aside-label">At a glance</p>
      ${tags.length ? `<div class="quick-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
      ${entry.strength?.confirmation && entry.strength.confirmation !== 'exact' ? `<div class="caveat-note"><strong>Strength varies</strong><p>${escapeHtml(entry.strength.note || humanize(entry.strength.confirmation))}</p></div>` : ''}
    </section>`;
}

function researchBadgeMarkup(entry) {
  const confidence = entry.research?.confidence || 'Unrated';
  const ambiguity = entry.research?.ambiguityStatus || 'Not specified';
  return `
    <span class="research-badge research-badge--${confidence.toLowerCase()}">${escapeHtml(confidence)} confidence</span>
    <span class="research-badge">${escapeHtml(ambiguity === 'Clear' ? 'Clear interpretation' : ambiguity)}</span>`;
}

function researchFields(entry) {
  return [
    ['Profile level', entry.research?.profileLevel],
    ['Source types', cleanSources(entry.research?.sourceTypesConsulted)],
    ['Conflicts', entry.research?.conflictsFound],
    ['Resolution', entry.research?.resolution],
    ['Source record', entry.sourceRecord?.displayName],
    ['Normalized from', entry.sourceRecord?.normalizedFrom],
    ['Caveats', entry.research?.caveats?.map(humanize).join(', ')],
  ].filter(([, value]) => value);
}

function factMarkup(label, value) {
  if (!value) return '';
  return `<div class="profile-fact"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`;
}

function profileBadges(entry) {
  const badges = [];
  if (entry.subtype) badges.push(entry.subtype);
  if (entry.varietal) badges.push(entry.varietal);
  badges.push(...(entry.whiskey?.displayTags || []));
  if (entry.research?.ambiguityStatus && entry.research.ambiguityStatus !== 'Clear') badges.push(entry.research.ambiguityStatus);
  return [...new Set(badges)].slice(0, 5);
}

function cardTags(entry) {
  const tags = [...(entry.whiskey?.displayTags || [])];
  if (!tags.length && entry.research?.confidence) tags.push(`${entry.research.confidence} confidence`);
  if (entry._hasCaveat) tags.push('Caveat');
  return tags;
}

function emptyState() {
  const scopeCopy = state.scope === 'favorites'
    ? ['Nothing saved yet', 'Use the bookmark on any profile to build a personal tasting list.']
    : state.scope === 'recent'
      ? ['No recent profiles', 'Open a drink and it will appear here for quick return.']
      : ['No matching profiles', 'Try removing a filter or searching with a broader flavor, style, or producer.'];
  return `
    <div class="empty-state">
      <span>${icon(state.scope === 'favorites' ? 'bookmark' : 'search')}</span>
      <h2>${scopeCopy[0]}</h2>
      <p>${scopeCopy[1]}</p>
      ${state.scope === 'all' ? '<button class="button" data-action="clear-filters">Clear filters</button>' : ''}
    </div>`;
}

function formatStrength(strength) {
  if (!strength) return '';
  return strength.abvDisplay || strength.display || (strength.abv != null ? `${strength.abv}% ABV` : '');
}

function numberValue(value) {
  return value == null ? '' : String(value);
}

function cleanSources(values) {
  if (!values?.length) return '';
  return values.map((value) => String(value).replace(/^\s*:\s*/, '')).join(', ');
}

function displayKey(key) {
  const map = {
    proteins: 'Proteins',
    spices_flavor_companions: 'Flavor companions',
    cheeses: 'Cheeses',
    cuisines: 'Cuisines',
  };
  return map[key] || humanize(key);
}

function humanize(value = '') {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('is-visible'), 1800);
}

function isTypingTarget(target) {
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function icon(name) {
  const icons = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5h11v15L12 16l-5.5 3.5z"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3c4 0 6 10 10 10h3"/><path d="m17 14 3 3-3 3"/><path d="M4 17h3c1.8 0 3.2-2 4.5-4.1C13 10.3 14.5 7 17 7h3"/><path d="m17 4 3 3-3 3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>',
    'arrow-left': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    'chevron-down': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>',
  };
  return icons[name] || '';
}
