const LANG = localStorage.getItem("lang") || "en";
const HOME_URL = `content/${LANG}/home.json`;

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

document.querySelectorAll(".lang-btn").forEach(btn => {
    if (btn.dataset.lang === LANG) {
        btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
        localStorage.setItem("lang", btn.dataset.lang);
        location.reload();
    });
});

const state = {
  home: null,
  searchItems: [],
  activeSections: []
};

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

function icon(id) {
  return `<svg class="icon"><use href="#${esc(id)}"/></svg>`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
}

function sectionHead(data) {
  return `
    <div class="section-head">
      <div>
        <h2>${esc(data.title)}</h2>
        <p>${esc(data.summary)}</p>
      </div>
      ${data.link ? `<a class="text-link" href="${esc(data.link.href)}">${esc(data.link.label)}</a>` : ''}
    </div>
  `;
}

function renderHero(data) {
  return `
    <section class="hero reveal">
      <div class="eyebrow"><i></i>${esc(data.eyebrow)}</div>
      <h1>${esc(data.title)}</h1>
      <p>${esc(data.summary)}</p>
      <a class="hero-search" href="${esc(data.cta.href)}">
        ${icon('i-search')}
        <span class="muted">${esc(data.cta.label)}</span><b>→</b>
      </a>
      <div class="trusted"><span class="avatars"><i></i><i></i><i></i></span>${esc(data.trusted)}</div>
    </section>
  `;
}

function renderScenarios(data) {
  return `
    <section class="section reveal" id="scenarios">
      ${sectionHead(data)}
      <div class="categories">
        ${data.items.map(item => `
          <a class="category" href="${esc(item.href)}">
            <span class="category-icon">${icon(item.icon)}</span>
            <span><b>${esc(item.title)}</b><small>${esc(item.count)}</small></span>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

function renderFeaturedPresets(data) {
  return `
    <section class="section reveal" id="presets">
      ${sectionHead(data)}
      <div class="preset-grid">
        ${data.items.map(item => `
          <article class="preset ${item.featured ? 'featured' : ''}">
            <div class="preset-top">
              <span class="badge ${esc(item.badgeTone || '')}">${item.badgeTone ? '<i class="dot"></i>' : ''}${esc(item.badge)}</span>
              <span class="stars">${esc(item.rating)} <span>${esc(item.score)}</span></span>
            </div>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.summary)}</p>
            <div class="specs">
              ${item.specs.map(([label, value]) => `<div class="spec"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}
            </div>
            <a class="open" href="docs.html#${esc(item.slug)}">
              Open preset
              <span class="round">${icon('i-arrow')}</span>
            </a>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderGuides(data) {
  return `
    <section class="section reveal" id="guides">
      ${sectionHead(data)}
      <div class="tabs" role="tablist" aria-label="Filter guides">
        ${data.filters.map((filter, index) => `<button class="tab ${index === 0 ? 'active' : ''}" type="button" role="tab" aria-selected="${index === 0}" data-filter="${esc(filter)}">${esc(filter[0].toUpperCase() + filter.slice(1))}</button>`).join('')}
      </div>
      <div class="guide-grid">
        ${data.items.map(item => `
          <a class="guide-card" data-type="${esc(item.type)}" href="${esc(item.href)}">
            <div class="guide-visual">${icon(item.icon)}</div>
            <div class="guide-body">
              <small>${esc(item.meta)}</small>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.summary)}</p>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

function renderSaveCard(data) {
  return `
    <div class="callout reveal">
      <div>
        <h3>${esc(data.title)}</h3>
        <p>${esc(data.summary)}</p>
      </div>
      <button class="btn" id="saveBtn">${esc(localStorage.getItem('osmo-starter') ? data.savedButton : data.button)}</button>
    </div>
  `;
}

function renderFooter(data) {
  return `<footer><span>${esc(data.copyright)}</span><span class="footer-links">${data.links.map(link => `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join('')}</span></footer>`;
}

function renderAside(data) {
  $('#asideToc').innerHTML = data.toc.map(([label, href], index) => `<a class="${index === 0 ? 'active' : ''}" href="${esc(href)}">${esc(label)}</a>`).join('');
  $('#quickPresets').innerHTML = data.quickPresets.map(item => `<a href="${esc(item.href)}">${esc(item.title)}<small>${esc(item.summary)}</small></a>`).join('');
  $('#relatedLinks').innerHTML = data.related.map(item => `<a href="${esc(item.href)}">${esc(item.title)}<span>${esc(item.summary)}</span></a>`).join('');
}

function renderSearchItems(home) {
  state.searchItems = [
    ...home.featuredPresets.items.map(item => ({ title: item.title, type: 'Preset', icon: 'i-bolt', href: `docs.html#${item.slug}` })),
    ...home.guides.items.map(item => ({ title: item.title, type: 'Guide', icon: item.icon, href: item.href })),
    ...home.scenarios.items.map(item => ({ title: item.title, type: 'Scenario', icon: item.icon, href: item.href }))
  ];
}

function filterResults(query = '') {
  const matches = state.searchItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  $('#results').innerHTML = matches.map(item => `
    <a class="result" href="${esc(item.href)}">
      ${icon(item.icon)}
      ${esc(item.title)}<small>${esc(item.type)}</small>
    </a>
  `).join('') || '<div class="result">No settings found.</div>';
}

function setPalette(open) {
  const palette = $('#palette');
  const input = $('#searchInput');
  palette.classList.toggle('open', open);
  if (open) setTimeout(() => input.focus(), 30);
  else input.value = '';
  filterResults('');
}

function setMenu(open) {
  const menuBtn = $('#menuBtn');
  const leftbar = $('#leftbar');
  const navBackdrop = $('#navBackdrop');
  leftbar.classList.toggle('open', open);
  navBackdrop.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.body.classList.toggle('nav-open', open);
  if (open) leftbar.scrollLeft = 0;
}

function bindInteractions() {
  const palette = $('#palette');
  const input = $('#searchInput');
  const menuBtn = $('#menuBtn');
  const navBackdrop = $('#navBackdrop');

  $$('.search-trigger').forEach(trigger => trigger.addEventListener('click', () => setPalette(true)));
  palette.addEventListener('click', event => {
    if (event.target === palette) setPalette(false);
  });
  input.addEventListener('input', event => filterResults(event.target.value));
  $('#results').addEventListener('click', () => setPalette(false));

  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setPalette(true);
    }
    if (event.key === 'Escape') {
      setPalette(false);
      setMenu(false);
    }
  });

  $('#themeBtn').addEventListener('click', () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('osmo-theme', root.dataset.theme);
  });
  const savedTheme = localStorage.getItem('osmo-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  menuBtn.addEventListener('click', () => setMenu(!$('#leftbar').classList.contains('open')));
  navBackdrop.addEventListener('click', () => setMenu(false));
  $$('.leftbar a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 800) setMenu(false);
  });

  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    $$('.guide-card').forEach(card => {
      card.style.display = tab.dataset.filter === 'all' || card.dataset.type === tab.dataset.filter ? 'block' : 'none';
    });
  }));

  $('#saveBtn').addEventListener('click', event => {
    localStorage.setItem('osmo-starter', 'saved');
    event.target.textContent = state.home.saveCard.savedButton;
    event.target.style.background = 'var(--success)';
  });
}

function observePage() {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  }), { threshold: 0.08 });
  $$('.reveal').forEach(element => revealObserver.observe(element));

  const sections = $$('main section[id]');
  const tocLinks = $$('.toc a');
  const tocObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      tocLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  }), { rootMargin: '-25% 0px -65%' });
  sections.forEach(section => tocObserver.observe(section));
}

function renderLoadError(error) {
  $('#homeContent').innerHTML = `
    <section class="hero reveal visible">
      <h1>Content could not be loaded</h1>
      <p>This site loads homepage copy, guides, and presets from JSON files. Serve the project with a local web server so the browser can fetch them.</p>
      <p>${esc(error.message)}</p>
    </section>
  `;
}

async function init() {
  try {
    state.home = await fetchJson(HOME_URL);
    document.title = state.home.meta.title;
    document.querySelector('meta[name="description"]').setAttribute('content', state.home.meta.description);
    $('#homeContent').innerHTML = [
      renderHero(state.home.hero),
      renderScenarios(state.home.scenarios),
      renderFeaturedPresets(state.home.featuredPresets),
      renderGuides(state.home.guides),
      renderSaveCard(state.home.saveCard),
      renderFooter(state.home.footer)
    ].join('');
    renderAside(state.home.aside);
    renderSearchItems(state.home);
    filterResults('');
    bindInteractions();
    observePage();
  } catch (error) {
    renderLoadError(error);
  }
}

init();
