import { init } from '@kitbase/analytics';

const TOKEN = 'pk_kitbase_kKQtGUA89MQxzUVMQOg8vT2J7lDBIsgV';

// ── Log helper ──────────────────────────────────────────────
let eventCount = 0;

function log(type, label, data) {
  eventCount++;
  document.getElementById('event-count').textContent = `(${eventCount} events)`;

  const entries = document.getElementById('log-entries');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  entry.innerHTML = `<span class="log-time">${time}</span> <span class="log-${type}">[${label}]</span><span class="log-data">${dataStr}</span>`;
  entries.appendChild(entry);

  const panel = document.getElementById('log-panel');
  panel.scrollTop = panel.scrollHeight;
}

// ── Intercept SDK debug logs ────────────────────────────────
const originalLog = console.log;
console.log = function (...args) {
  originalLog.apply(console, args);
  if (args[0] !== '[Kitbase]') return;

  const msg = String(args[1] || '');
  const data = args[2];

  // Categorize by event type
  if (msg === 'Track' && data?.payload) {
    const p = data.payload;
    if (p.event === 'screen_view') {
      log('route', 'PAGE VIEW', { path: p.tags?.__path, title: p.tags?.__title, referrer: p.tags?.__referrer });
    } else if (p.event === 'click') {
      log('click', 'CLICK', { tag: p.tags?.__tag, id: p.tags?.__id, text: p.tags?.__text?.slice(0, 50), href: p.tags?.__href, path: p.tags?.__path });
    } else if (p.event === 'scroll_depth') {
      log('scroll', 'SCROLL DEPTH', { depth: p.tags?.__depth + '%', path: p.tags?.__path });
    } else if (p.event === 'outbound_link') {
      log('event', 'OUTBOUND LINK', { url: p.tags?.__url, text: p.tags?.__text });
    } else {
      log('event', 'EVENT', { event: p.event, channel: p.channel });
    }
  } else if (msg.includes('Auto page view')) {
    log('route', 'SETUP', msg);
  } else if (msg.includes('Click tracking')) {
    log('click', 'SETUP', msg);
  } else if (msg.includes('Scroll depth')) {
    log('scroll', 'SETUP', msg);
  } else if (msg.includes('Outbound link')) {
    log('event', 'SETUP', msg);
  }
};

// ── Init SDK with ALL auto-tracking ON ──────────────────────
const kitbase = init({
  token: TOKEN,
  debug: true,
  analytics: {
    autoTrackPageViews: true,
    autoTrackOutboundLinks: true,
    autoTrackClicks: true,
    autoTrackScrollDepth: true,
  },
});

// ── SPA Router ──────────────────────────────────────────────
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');

function navigate(path) {
  // Update active page
  pages.forEach(p => {
    p.classList.toggle('active', p.dataset.path === path);
  });

  // Update active nav link
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.route === path);
  });

  // Update document title
  const activePageEl = document.querySelector(`.page[data-path="${path}"]`);
  const pageTitle = activePageEl?.querySelector('h1')?.textContent || 'Test App';
  document.title = `${pageTitle} - Auto Tracking Test`;

  // Push state (this triggers SDK's auto page view tracking)
  history.pushState({}, '', path);

  // Scroll to top
  window.scrollTo(0, 0);
}

// Nav click handlers
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(link.dataset.route);
  });
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const path = window.location.pathname || '/';
  pages.forEach(p => p.classList.toggle('active', p.dataset.path === path));
  navLinks.forEach(link => link.classList.toggle('active', link.dataset.route === path));
});

// ── Log panel toggle ────────────────────────────────────────
document.getElementById('log-header').addEventListener('click', () => {
  const panel = document.getElementById('log-panel');
  const hint = document.getElementById('toggle-hint');
  panel.classList.toggle('collapsed');
  hint.textContent = panel.classList.contains('collapsed') ? 'click to expand' : 'click to collapse';
});

// ── Ready ───────────────────────────────────────────────────
log('event', 'INIT', 'SDK initialized with all auto-tracking enabled');
log('event', 'INFO', 'Try: click buttons, scroll down, navigate between pages');
