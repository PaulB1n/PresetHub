const LANG = localStorage.getItem("lang") || "en";
const CONTENT_ROOT = '';
const MANIFEST_URL = `${CONTENT_ROOT}content/${LANG}/manifest.json`;

const state = {
  manifest: null,
  navigation: [],
  sources: {},
  site: {},
  defaults: {},
  guides: {},
  presets: {},
  searchIndex: [],
  selectedSearchIndex: 0,
  filteredSearch: []
};

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const article = $('#article');
const nav = $('#docsNavigation');
const toc = $('#pageToc');
const modal = $('#searchModal');
const searchInput = $('#searchInput');
const results = $('#searchResults');
const sidebar = $('#docsSidebar');
const scrim = $('#sidebarScrim');
const navButton = $('#navButton');



function esc(value = '') {
  return String(value).replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
}

async function fetchMap(paths) {
  const entries = await Promise.all(
    Object.entries(paths).map(async ([slug, url]) => [slug, await fetchJson(url)])
  );
  return Object.fromEntries(entries);
}

async function loadContent() {
  state.manifest = await fetchJson(MANIFEST_URL);
  const [navigation, sources, site, defaults, guides, presets] = await Promise.all([
    fetchJson(state.manifest.navigation),
    fetchJson(state.manifest.sources),
    fetchJson(state.manifest.site),
    fetchJson(state.manifest.defaults),
    fetchMap(state.manifest.guides),
    fetchMap(state.manifest.presets)
  ]);

  Object.assign(state, { navigation, sources, site, defaults, guides, presets });
  state.searchIndex = navigation.flatMap(group =>
    group.items.map(item => ({
      slug: item.slug,
      title: item.label,
      group: group.title,
      type: item.type
    }))
  );
}

function mergePreset(slug) {
  return { ...state.defaults, ...(state.presets[slug] || {}) };
}

function currentSlug() {
  const hash = location.hash.slice(1).split(':')[0];
  return hash || 'best-settings';
}

function callout(type, title, text) {
  const marker = type === 'warning' ? '⚠' : type === 'danger' ? '!' : '◆';
  return `<div class="callout ${esc(type)}"><span>${marker}</span><div><b>${esc(title)}</b>${esc(text)}</div></div>`;
}

function table(rows = []) {
  return `<div class="table-wrap"><table>${rows.map((row, index) => (
    `<tr>${row.map(cell => index === 0 ? `<th>${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`
  )).join('')}</table></div>`;
}

function listCard(title, items = [], className = '') {
  return `<div class="list-card ${esc(className)}"><h3>${esc(title)}</h3><ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>`;
}

function section(id, title, body) {
  return `<section class="article-section" id="${esc(id)}"><h2>${esc(title)}</h2>${body}</section>`;
}

function sourceSection(keys = ['specs', 'faq', 'manual', 'reddit', 'creator']) {
  const method = state.site.docs.sourceMethod;
  const links = keys
    .map(key => state.sources[key])
    .filter(Boolean)
    .map(source => `<a class="source-link" href="${esc(source.url)}" target="_blank" rel="noreferrer"><b>${esc(source.name)}</b><span>${esc(source.note)}</span></a>`)
    .join('');

  return section('sources', 'Sources', `<div class="source-list">${links}</div>${callout('info', method.title, method.text)}`);
}

function header(title, summary, type = 'Guide') {
  const docs = state.site.docs;
  return `
    <header class="article-head">
      <div class="crumbs"><a href="#best-settings">${esc(docs.breadcrumbRoot)}</a> / ${esc(type)}</div>
      <div class="article-kicker"><i class="verified-dot"></i>${esc(docs.reviewed)}</div>
      <h1>${esc(title)}</h1>
      <p class="summary">${esc(summary)}</p>
      <div class="meta-row">${docs.meta.map(item => `<span class="${item.includes('verified') ? 'status-pill' : 'meta-pill'}">${esc(item)}</span>`).join('')}</div>
    </header>
  `;
}

function presetSettings(preset) {
  return [
    ['Setting', 'Recommendation'],
    ['Resolution', preset.resolution],
    ['Frame rate', preset.fps],
    ['Aspect ratio', preset.aspect],
    ['Color mode', preset.color],
    ['Bitrate', preset.bitrate],
    ['ISO', preset.iso],
    ['White balance', preset.wb],
    ['Shutter', preset.shutter],
    ['EV', preset.ev],
    ['Sharpness / texture', preset.sharpness],
    ['Noise reduction', preset.nr],
    ['Stabilization', preset.stabilization],
    ['Field of view', preset.fov],
    ['ND filter', preset.nd]
  ];
}

function relatedPresets(slug) {
  const keys = Object.keys(state.presets);
  const index = Math.max(0, keys.indexOf(slug));
  return [
    keys[(index + 1) % keys.length],
    keys[(index + 4) % keys.length],
    keys[(index + 9) % keys.length],
    keys[(index + 15) % keys.length]
  ].filter(Boolean);
}

function renderPreset(slug) {
  const preset = mergePreset(slug);
  const presetTitle = preset.title || slug.replaceAll('-', ' ');
  const summary = state.site.docs.presetSummary.replace('{title}', presetTitle.toLowerCase());
  const conditional = state.site.docs.conditionalPreset;

  return [
    header(`${presetTitle} preset`, summary, 'Shooting preset'),
    section('quick', 'Quick summary', `
      <div class="quick-grid">
        <div class="quick-card"><small>Resolution</small><strong>${esc(preset.resolution)}</strong></div>
        <div class="quick-card"><small>Frame rate</small><strong>${esc(preset.fps)}</strong></div>
        <div class="quick-card"><small>Color</small><strong>${esc(preset.color)}</strong></div>
        <div class="quick-card"><small>Stabilization</small><strong>${esc(preset.stabilization)}</strong></div>
      </div>
    `),
    section('settings', 'Best settings', `${table(presetSettings(preset))}${callout('info', conditional.title, conditional.text)}`),
    section('use-cases', 'Best use cases', `<ul class="checklist">${(preset.uses || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>`),
    section('tradeoffs', 'Advantages and disadvantages', `<div class="two-col">${listCard('Advantages', preset.pros)}${listCard('Disadvantages', preset.cons)}</div>`),
    section('mistakes', 'Common mistakes and pro tips', `<div class="two-col">${listCard('Common mistakes', preset.mistakes, 'mistakes')}${listCard('Pro tips', preset.tips)}</div>`),
    section('related', 'Related presets', `<div class="preset-list">${relatedPresets(slug).map(itemSlug => {
      const item = mergePreset(itemSlug);
      return `<a class="preset-link" href="#${esc(itemSlug)}"><span><b>${esc(item.title)}</b><small>${esc(item.resolution)} · ${esc(item.fps)}</small></span><b>→</b></a>`;
    }).join('')}</div>`),
    sourceSection()
  ].join('');
}

function renderPresetLibrary(guide) {
  const cards = Object.keys(state.presets).map(slug => {
    const preset = mergePreset(slug);
    return `<a class="preset-link" href="#${esc(slug)}"><span><b>${esc(preset.title)}</b><small>${esc(preset.resolution)} · ${esc(preset.fps)} · ${esc(preset.stabilization)}</small></span><b>→</b></a>`;
  }).join('');

  return `${header(guide.title, guide.summary)}${section('presets', 'All shooting presets', `<div class="preset-list">${cards}</div>`)}${sourceSection()}`;
}

function renderMethodPage(guide) {
  return [
    header(guide.title, guide.summary),
    section('policy', 'Evidence policy', `<div class="two-col">${listCard('Confirmed facts', [
      'DJI specifications',
      'DJI FAQ and manual',
      'Published mode limitations',
      'Firmware-dependent features'
    ])}${listCard('Conditional guidance', [
      'Creator field tests',
      'Repeated community patterns',
      'Shutter / ND preferences',
      'Scene-dependent ISO ceilings'
    ])}</div>`),
    sourceSection()
  ].join('');
}

function renderGuide(slug) {
  const guide = state.guides[slug] || state.guides['best-settings'];
  if (slug === 'presets') return renderPresetLibrary(guide);
  if (guide.method) return renderMethodPage(guide);

  let output = header(guide.title, guide.summary);

  if (guide.table) output += section('reference', 'Quick reference', table(guide.table));
  if (guide.check) output += section('checklist', 'Checklist', `<ul class="checklist">${guide.check.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`);
  if (guide.faq) output += section('answers', 'Answers', guide.faq.map(([question, answer]) => `<div class="list-card"><h3>${esc(question)}</h3><p>${esc(answer)}</p></div>`).join(''));
  if (guide.tips) output += section('tips', 'Practical notes', `<ul class="checklist">${guide.tips.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`);
  if (guide.warning) output += section('warning', 'Important limitation', callout('warning', 'Do not skip this', guide.warning));

  output += section('next', 'Related guides', `
    <div class="preset-list">
      <a class="preset-link" href="#best-settings"><span><b>Best settings</b><small>Core baseline</small></span><b>→</b></a>
      <a class="preset-link" href="#presets"><span><b>Preset library</b><small>25 field setups</small></span><b>→</b></a>
    </div>
  `);

  return output + sourceSection(['specs', 'faq', 'manual', ...(slug === 'shutter' || slug === 'best-settings' ? ['reddit', 'creator'] : [])]);
}

function renderNavigation() {
  nav.innerHTML = state.navigation.map(group => `
    <div class="nav-group">
      <span class="nav-group-title">${esc(group.title)}</span>
      ${group.items.map(item => `<a href="#${esc(item.slug)}" data-slug="${esc(item.slug)}">${esc(item.label)}</a>`).join('')}
    </div>
  `).join('');
}

function renderPage() {
  const slug = currentSlug();
  const isPreset = Object.hasOwn(state.presets, slug);
  article.innerHTML = isPreset ? renderPreset(slug) : renderGuide(slug);

  $$('[data-slug]').forEach(link => link.classList.toggle('active', link.dataset.slug === slug));
  toc.innerHTML = $$('.article-section', article).map(sectionElement => (
    `<a href="#${esc(slug)}:${esc(sectionElement.id)}">${esc($('h2', sectionElement).textContent)}</a>`
  )).join('');
  $$('a', toc).forEach(link => {
    link.onclick = event => {
      event.preventDefault();
      const target = $(`#${CSS.escape(link.hash.split(':')[1])}`);
      if (target) target.scrollIntoView();
    };
  });

  const title = $('h1', article)?.textContent || 'Osmo Action 6 Knowledge Base';
  document.title = `${title} ${state.site.docs.titleSuffix}`;
  window.scrollTo(0, 0);
  setNav(false);
}

function setNav(open) {
  sidebar.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  navButton.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

function renderSearch(query = '') {
  state.filteredSearch = state.searchIndex
    .filter(item => `${item.title} ${item.group}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);
  state.selectedSearchIndex = 0;

  results.innerHTML = state.filteredSearch.map((item, index) => `
    <div class="search-result ${index === 0 ? 'selected' : ''}" data-index="${index}">
      <span>${esc(item.title)}</span>
      <small>${esc(item.group)}</small>
    </div>
  `).join('') || '<div class="search-result">No matching guide</div>';

  $$('[data-index]', results).forEach(element => {
    element.onclick = () => openSearchResult(Number(element.dataset.index));
  });
}

function setSearch(open) {
  modal.classList.toggle('open', open);
  if (open) {
    renderSearch('');
    setTimeout(() => searchInput.focus(), 20);
  } else {
    searchInput.value = '';
  }
}

function openSearchResult(index) {
  const result = state.filteredSearch[index];
  if (!result) return;
  location.hash = result.slug;
  setSearch(false);
}

function bindInteractions() {
  window.addEventListener('hashchange', renderPage);
  navButton.onclick = () => setNav(!sidebar.classList.contains('open'));
  scrim.onclick = () => setNav(false);

  $('#themeButton').onclick = () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('osmo-docs-theme', root.dataset.theme);
  };
  document.documentElement.dataset.theme = localStorage.getItem('osmo-docs-theme') || 'dark';

  $('#searchButton').onclick = () => setSearch(true);
  modal.onclick = event => {
    if (event.target === modal) setSearch(false);
  };
  searchInput.oninput = event => renderSearch(event.target.value);
  searchInput.onkeydown = event => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      state.selectedSearchIndex = Math.min(state.selectedSearchIndex + 1, state.filteredSearch.length - 1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      state.selectedSearchIndex = Math.max(state.selectedSearchIndex - 1, 0);
    }
    if (event.key === 'Enter') openSearchResult(state.selectedSearchIndex);
    $$('.search-result', results).forEach((element, index) => {
      element.classList.toggle('selected', index === state.selectedSearchIndex);
    });
  };
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setSearch(true);
    }
    if (event.key === 'Escape') {
      setSearch(false);
      setNav(false);
    }
  });
  document.querySelectorAll(".lang-btn").forEach(btn => {

    if (btn.dataset.lang === LANG) {
        btn.classList.add("active");
    }

    btn.addEventListener("click", () => {

        if (btn.dataset.lang === LANG) return;

        localStorage.setItem("lang", btn.dataset.lang);

        location.reload();

    });

});
}

function renderLoadError(error) {
  article.innerHTML = `
    <header class="article-head">
      <h1>Content could not be loaded</h1>
      <p class="summary">This site loads guides and presets from JSON files. Serve the project with a local web server so the browser can fetch them.</p>
    </header>
    ${section('details', 'Details', callout('warning', 'Fetch failed', error.message))}
  `;
}

async function init() {
  try {
    await loadContent();
    renderNavigation();
    bindInteractions();
    renderPage();
  } catch (error) {
    renderLoadError(error);
  }
}

init();
