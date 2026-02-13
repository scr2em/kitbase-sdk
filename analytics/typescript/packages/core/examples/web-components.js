import { init } from '@kitbase/analytics';

const TOKEN = 'pk_kitbase_kKQtGUA89MQxzUVMQOg8vT2J7lDBIsgV';

// ── Register custom web components ──────────────────────────

// Shadow DOM button (wraps a native <button> in shadow)
class ShadowButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        button {
          background: #6e40c9; color: #fff; border: none;
          padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;
          font-size: 0.85rem; font-family: inherit;
        }
        button:hover { background: #8b5cf6; }
        :host([variant="outline"]) button {
          background: transparent; border: 1px solid #6e40c9; color: #6e40c9;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}
customElements.define('shadow-button', ShadowButton);

// Shadow DOM link (wraps a native <a> in shadow, reads href from host)
class ShadowLink extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const href = this.getAttribute('href') || '#';
    shadow.innerHTML = `
      <style>
        a { color: #58a6ff; text-decoration: underline; cursor: pointer; font-size: 0.85rem; }
      </style>
      <a href="${href}" target="_blank"><slot></slot></a>
    `;
  }
}
customElements.define('shadow-link', ShadowLink);

// ── Log helper ──────────────────────────────────────────────
let clickCount = 0;

function log(type, data) {
  clickCount++;
  document.getElementById('event-count').textContent = `(${clickCount} clicks)`;

  const entries = document.getElementById('log-entries');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';

  const icon = type === 'ok' ? 'log-ok' : type === 'fail' ? 'log-fail' : 'log-info';
  const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
  entry.innerHTML = `<span class="log-time">${time}</span> <span class="${icon}">[CLICK]</span> <span class="log-tag">${data.__tag || ''}</span> <span class="log-data">${dataStr}</span>`;
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

  if (msg === 'Track' && data?.payload?.event === 'click') {
    const tags = data.payload.tags;
    log('ok', {
      __tag: tags.__tag,
      __id: tags.__id,
      __class: tags.__class?.slice(0, 60),
      __text: tags.__text?.slice(0, 60),
      __href: tags.__href,
      __path: tags.__path,
    });
  }
};

// ── Init SDK ────────────────────────────────────────────────
const kitbase = init({
  token: TOKEN,
  debug: true,
  analytics: {
    autoTrackPageViews: false,
    autoTrackOutboundLinks: true,
    autoTrackClicks: true,
    autoTrackScrollDepth: false,
  },
});

// ── Log panel toggle ────────────────────────────────────────
document.getElementById('log-header').addEventListener('click', (e) => {
  e.stopPropagation();
  const panel = document.getElementById('log-panel');
  const hint = document.getElementById('toggle-hint');
  panel.classList.toggle('collapsed');
  hint.textContent = panel.classList.contains('collapsed') ? 'click to expand' : 'click to collapse';
});

// ── Ready ───────────────────────────────────────────────────
const entries = document.getElementById('log-entries');
const time = new Date().toLocaleTimeString();
entries.innerHTML = `
  <div class="log-entry"><span class="log-time">${time}</span> <span class="log-info">[INIT]</span> <span class="log-data">SDK initialized. Click any element above and check if it's tracked with the correct tag name and attributes.</span></div>
  <div class="log-entry"><span class="log-time">${time}</span> <span class="log-info">[EXPECTED]</span> <span class="log-data">Native: tag=button/a/input | Ionic: tag=ion-button/ion-item/ion-fab-button | Custom: tag=shadow-button/shadow-link/custom-button</span></div>
`;
