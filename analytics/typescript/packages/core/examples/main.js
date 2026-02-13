import { init } from '@kitbase/analytics';

const TOKEN = 'pk_kitbase_kKQtGUA89MQxzUVMQOg8vT2J7lDBIsgV';

// --- Log helper ---
function logMessage(msg, type = 'info') {
  const log = document.getElementById('log');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">${time}</span> <span class="log-${type}">${msg}</span>`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// --- Intercept SDK debug logs ---
const originalLog = console.log;
console.log = function (...args) {
  originalLog.apply(console, args);
  if (args[0] === '[Kitbase]') {
    logMessage(args.slice(1).map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' '), 'info');
  }
};

// --- Init SDK ---
function createSDK() {
  return init({
    token: TOKEN,
    debug: true,
    analytics: {
      autoTrackPageViews: false,
      autoTrackOutboundLinks: false,
      autoTrackClicks: false,
      autoTrackScrollDepth: false,
    },
  });
}

let kitbase = createSDK();

// --- Helpers ---
const $ = (id) => document.getElementById(id);
const setStatus = (text, ok) => {
  $('status').textContent = text;
  $('status').className = `status ${ok ? 'connected' : 'disconnected'}`;
};

// --- Track Custom Event ---
$('btn-track').addEventListener('click', async () => {
  const channel = $('channel').value;
  const event = $('eventName').value;
  const icon = $('icon').value;
  const userId = $('userId').value;
  const tagsStr = $('tags').value;
  const notify = $('notify').checked;

  let tags;
  try {
    tags = tagsStr ? JSON.parse(tagsStr) : undefined;
  } catch (e) {
    logMessage(`Invalid tags JSON: ${e.message}`, 'error');
    return;
  }

  try {
    const result = await kitbase.track({
      channel,
      event,
      ...(icon && { icon }),
      ...(userId && { user_id: userId }),
      ...(notify && { notify }),
      ...(tags && { tags }),
    });
    logMessage(`Event tracked: ${event} -> ${JSON.stringify(result)}`, 'success');
  } catch (err) {
    logMessage(`Track failed: ${err.message}`, 'error');
  }
});

// --- Quick Events ---
document.querySelectorAll('[data-quick]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const [channel, event, icon, notifyStr] = btn.dataset.quick.split('|');
    const notify = notifyStr === 'true';
    try {
      const result = await kitbase.track({ channel, event, icon, notify });
      logMessage(`Quick track: ${event} -> ${JSON.stringify(result)}`, 'success');
    } catch (err) {
      logMessage(`Quick track failed: ${err.message}`, 'error');
    }
  });
});

// --- Identify / Reset ---
$('btn-identify').addEventListener('click', async () => {
  const userId = $('identifyUserId').value;
  const email = $('identifyEmail').value;
  try {
    await kitbase.identify({ userId, traits: { email } });
    logMessage(`User identified: ${userId}`, 'success');
  } catch (err) {
    logMessage(`Identify failed: ${err.message}`, 'error');
  }
});

$('btn-reset').addEventListener('click', () => {
  kitbase.reset();
  logMessage('User reset', 'warn');
});

// --- Super Properties ---
$('btn-register').addEventListener('click', () => {
  try {
    const props = JSON.parse($('superProps').value);
    kitbase.register(props);
    logMessage(`Super properties registered: ${JSON.stringify(props)}`, 'success');
  } catch (e) {
    logMessage(`Invalid JSON: ${e.message}`, 'error');
  }
});

$('btn-register-once').addEventListener('click', () => {
  try {
    const props = JSON.parse($('superProps').value);
    kitbase.registerOnce(props);
    logMessage(`Super properties registered (once): ${JSON.stringify(props)}`, 'success');
  } catch (e) {
    logMessage(`Invalid JSON: ${e.message}`, 'error');
  }
});

$('btn-get-props').addEventListener('click', () => {
  const props = kitbase.getSuperProperties();
  logMessage(`Current super properties: ${JSON.stringify(props, null, 2)}`, 'info');
});

$('btn-clear-props').addEventListener('click', () => {
  kitbase.clearSuperProperties();
  logMessage('Super properties cleared', 'warn');
});

// --- Time Events ---
$('btn-start-timer').addEventListener('click', () => {
  const name = $('timedEventName').value;
  kitbase.timeEvent(name);
  logMessage(`Timer started for: ${name}`, 'info');
});

$('btn-stop-timer').addEventListener('click', async () => {
  const name = $('timedEventName').value;
  try {
    const result = await kitbase.track({ channel: 'engagement', event: name });
    logMessage(`Timed event tracked: ${name} -> ${JSON.stringify(result)}`, 'success');
  } catch (err) {
    logMessage(`Timed event failed: ${err.message}`, 'error');
  }
});

$('btn-cancel-timer').addEventListener('click', () => {
  const name = $('timedEventName').value;
  kitbase.cancelTimeEvent(name);
  logMessage(`Timer cancelled: ${name}`, 'warn');
});

$('btn-list-timers').addEventListener('click', () => {
  const timers = kitbase.getTimedEvents();
  logMessage(`Active timers: ${timers.length ? timers.join(', ') : '(none)'}`, 'info');
});

// --- Analytics ---
$('btn-pageview').addEventListener('click', async () => {
  try {
    const result = await kitbase.trackPageView({ path: '/test-app', title: 'Test App' });
    logMessage(`Page view tracked -> ${JSON.stringify(result)}`, 'success');
  } catch (err) {
    logMessage(`Page view failed: ${err.message}`, 'error');
  }
});

$('btn-revenue').addEventListener('click', async () => {
  try {
    const result = await kitbase.trackRevenue({ amount: 1999, currency: 'USD', tags: { plan: 'premium' } });
    logMessage(`Revenue tracked ($19.99) -> ${JSON.stringify(result)}`, 'success');
  } catch (err) {
    logMessage(`Revenue tracking failed: ${err.message}`, 'error');
  }
});

$('btn-outbound').addEventListener('click', async () => {
  try {
    const result = await kitbase.trackOutboundLink({ url: 'https://github.com', text: 'GitHub' });
    logMessage(`Outbound link tracked -> ${JSON.stringify(result)}`, 'success');
  } catch (err) {
    logMessage(`Outbound link failed: ${err.message}`, 'error');
  }
});

// --- Privacy ---
$('btn-optout').addEventListener('click', () => {
  kitbase.optOut();
  logMessage('Opted OUT of tracking', 'warn');
  setStatus('opted out', false);
});

$('btn-optin').addEventListener('click', () => {
  kitbase.optIn();
  logMessage('Opted IN to tracking', 'success');
  setStatus('tracking', true);
});

$('btn-consent').addEventListener('click', () => {
  logMessage(`Opted out: ${kitbase.isOptedOut()}, Has consent: ${kitbase.hasConsent()}`, 'info');
});

// --- Debug Controls ---
$('btn-debug').addEventListener('click', () => {
  const current = kitbase.isDebugMode();
  kitbase.setDebugMode(!current);
  logMessage(`Debug mode: ${!current}`, 'info');
});

$('btn-bot').addEventListener('click', () => {
  logMessage(`Is bot: ${kitbase.isBot()}, Result: ${JSON.stringify(kitbase.getBotDetectionResult())}`, 'info');
});

$('btn-shutdown').addEventListener('click', () => {
  kitbase.shutdown();
  logMessage('SDK shut down', 'warn');
  setStatus('shutdown', false);
});

$('btn-reinit').addEventListener('click', () => {
  kitbase = createSDK();
  logMessage('SDK re-initialized', 'success');
  setStatus('initialized', true);
});

$('btn-clear-log').addEventListener('click', () => {
  $('log').innerHTML = '';
});

// --- Ready ---
logMessage('SDK initialized with token: pk_kitbase_kKQ...gV', 'success');
logMessage('Ready to test! Click any button above.', 'info');
