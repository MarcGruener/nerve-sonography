// One page view to Marc's own OpenPanel, plus a "404" event to both analytics on
// the missing-page page. The visitor is counted by a daily-salted hash of address
// and browser on the server; nothing is stored in the browser. The client id is
// public.
import { OpenPanel } from './vendor/openpanel-sdk-1.3.1.js';

const clientId = '838a70ce-bc3f-447a-8c62-1c177d73cc8a';

// Campaign tags survive; any other query or fragment is dropped.
function clean(raw) {
  try {
    const url = new URL(raw);
    const kept = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (key.startsWith('utm_') || key === 'ref' || key === 'source') kept.append(key, value);
    }
    url.search = kept.toString();
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

const notFound = document.documentElement.dataset.page === '404';
const page = clean(location.href);
const referrer = clean(document.referrer);
const properties = {
  __path: page,
  __title: document.title,
  ...(referrer ? { __referrer: referrer } : {}),
};

// Plausible's script is deferred ahead of this module, so it has run if it loaded.
if (notFound && window.plausible) window.plausible('404');

if (clientId && page) {
  const op = new OpenPanel({ clientId, apiUrl: 'https://openpanel.moonlighting.dev', sdk: 'web' });
  op.track('screen_view', properties).catch(() => {});
  if (notFound) op.track('404', properties).catch(() => {});
}
