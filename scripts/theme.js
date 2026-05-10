/* Theme toggle.
   Light is the unconditional default. Dark applies only when the user
   clicks the toggle (sets [data-theme="dark"]). The system's
   prefers-color-scheme preference is intentionally not consulted —
   see memory/feedback_default_theme.md. */

const STORAGE_KEY = 'jarn-theme';
const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');

function readPref() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writePref(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Private browsing or storage quota — preference doesn't persist. */
  }
}

function applyTheme(theme, persist) {
  root.dataset.theme = theme;
  toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  if (persist) writePref(theme);
}

if (toggle) {
  toggle.hidden = false;

  const stored = readPref();
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored, false);
  }

  toggle.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  });
}
