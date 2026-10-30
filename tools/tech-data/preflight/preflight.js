/*
 * Tech data check (SKODA-852). Three ways in, one set of checks (checks.js):
 * - DA prepare menu (site config `prepare` row, classic editor and Canvas): checks the saved
 *   document source and can update or link values in one click (saves the source, never publishes).
 * - Canvas side panel (site config `library` row): the host offers the live document
 *   (`capabilities.liveDocument`), so the panel re-checks as the author types, unsaved edits
 *   included. Read-only: fixes stay in the prepare-menu dialog.
 * - Standalone (`preflight.html?path=/en/skoda-model/peaq`): checks the published page, read-only.
 * Canvas's own Preflight panel is a closed Adobe service (Experience Governance) that site code
 * can't add checks to; this check runs next to it, not inside it.
 */
import { applyFromSheet, runChecks } from '../checks.js';
import {
  modelsForPage, normalizePath, pageTags, withSavedMetadata,
} from '../tech-data.js';
import {
  connect, documentPath, loadSheet, readPage, writePage,
} from '../da.js';

const LABELS = { pass: 'Pass', warn: 'Review', fail: 'Issue' };
// Canvas answers a live-document subscription at once; this only guards a host that never does
const LIVE_TIMEOUT_MS = 5000;
// how often the panel re-reads the saved source for metadata edits saved since (at most)
const METADATA_REFRESH_MS = 60000;
const timeOf = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Where the page metadata (model, tags, Title, Description) of a live check came from. */
function metadataNote(state) {
  if (!state.live) return '';
  if (state.metadataFrom === 'live') return 'metadata from the live document';
  if (state.metadataFrom === 'saved') return `metadata (model, tags, Title, Description) from the saved source, read ${timeOf(state.savedAt)}; unsaved metadata edits show after saving`;
  return `no page metadata: Canvas leaves it out of the live document and the saved source ${state.savedError ? `could not be read (${state.savedError})` : 'has none'}`;
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function renderCheck(result) {
  const section = el('section', `tech-data-check is-${result.status}`);
  const heading = el('h2');
  heading.append(el('span', 'tech-data-badge', LABELS[result.status]), el('span', '', result.title));
  section.append(heading, el('p', 'tech-data-summary', result.summary));
  if (result.details.length) {
    const list = el('ul');
    result.details.forEach((detail) => list.append(el('li', '', detail)));
    if (result.more) list.append(el('li', 'tech-data-muted', `… and ${result.more} more`));
    section.append(list);
  }
  return section;
}

function actionButton(label, onClick) {
  const button = el('button', 'tech-data-button', label);
  button.type = 'button';
  button.addEventListener('click', () => onClick(button));
  return button;
}

/**
 * Render the results and the fix buttons. `onApply(mode)` saves and re-checks; without a DA
 * connection the buttons are replaced by a note.
 */
function render(main, state, onApply) {
  const results = runChecks(state);
  const open = results.filter((r) => r.status !== 'pass').length;
  const models = modelsForPage(state.sheet.models, { path: state.path, tags: pageTags(state.html) })
    .map((m) => m.name).join(', ');
  main.replaceChildren(el('h1', '', 'Tech data check'));
  main.append(el('p', 'tech-data-muted', [
    state.path,
    models ? `model: ${models}` : 'no model in the sheet',
    `sheet: ${state.sheet.from}`,
    state.live ? 'live document' : 'saved source',
    metadataNote(state),
    open ? `${open} of ${results.length} checks need attention` : 'all checks pass',
  ].filter(Boolean).join(' · ')));
  main.append(state.status);
  results.forEach((r) => main.append(renderCheck(r)));

  const fixable = results.reduce((n, r) => n + (r.fixable || 0), 0);
  const linkable = results.reduce((n, r) => n + (r.linkable || 0), 0);
  if (!fixable && !linkable) return;
  const actions = el('div', 'tech-data-actions');
  if (state.live) {
    actions.append(el('p', 'tech-data-muted', 'To update or link these values, open the prepare menu and choose "Tech data check". It saves the source; nothing is published.'));
  } else if (!state.sdk) {
    actions.append(el('p', 'tech-data-muted', 'Open the page in DA and choose "Tech data check" from the prepare menu to update or link these values.'));
  } else {
    if (fixable) actions.append(actionButton(`Update ${fixable} from the sheet`, (b) => onApply('update', b)));
    if (linkable) actions.append(actionButton(`Link ${linkable} to the sheet`, (b) => onApply('link', b)));
  }
  main.append(actions);
}

function describeChanges(changes) {
  if (!changes.length) return 'Nothing to change.';
  const list = changes.slice(0, 5).map((c) => (c.from === c.to ? `${c.what}: linked` : `${c.what}: ${c.from} → ${c.to}`));
  const more = changes.length > 5 ? ` and ${changes.length - 5} more` : '';
  return `Saved ${changes.length} change${changes.length === 1 ? '' : 's'}: ${list.join('; ')}${more}.`;
}

(async function init() {
  const main = document.querySelector('main');
  const status = el('p', 'tech-data-status');
  status.setAttribute('role', 'status');
  try {
    const sdk = await connect();
    const query = new URLSearchParams(window.location.search);
    const path = sdk ? documentPath(sdk.context) : normalizePath(query.get('path') || '');
    if (!path || path === '/') {
      main.replaceChildren(el('p', '', 'Open a page in DA and choose "Tech data check" from the prepare menu, or add ?path=/en/… to check a published page.'));
      return;
    }
    const live = sdk?.capabilities?.liveDocument === 1
      && typeof sdk.actions?.subscribeLiveDocument === 'function';
    const [html, sheet] = await Promise.all([
      live ? '' : readPage(sdk, path),
      loadSheet(sdk, window.location.search),
    ]);
    const state = {
      sdk, path, html, sheet, status, live,
    };
    const onApply = async (mode, button) => {
      button.disabled = true;
      status.textContent = 'Saving…';
      try {
        // re-read first so a change made in the editor since the check isn't overwritten
        const current = await readPage(sdk, path);
        const { html: next, changes } = applyFromSheet({
          html: current, path, sheet, mode,
        });
        if (changes.length) await writePage(sdk, path, next);
        state.html = changes.length ? next : current;
        status.textContent = describeChanges(changes);
      } catch (e) {
        status.textContent = `Nothing was saved: ${e.message}`;
      }
      render(main, state, onApply);
    };
    if (live) {
      main.replaceChildren(el('p', 'tech-data-muted', 'Waiting for the document…'));
      let hasSnapshot = false;
      let snapshot = '';
      let saved = { html: '', at: null, error: '' };
      let reading = null;
      // the live snapshot has no page metadata (da-live prose2aem livePreview removes it): take
      // the saved source's metadata block; the body checked is always the live one
      const show = () => {
        const merged = withSavedMetadata(snapshot, saved.html);
        Object.assign(state, {
          html: merged.html,
          metadataFrom: merged.metadataFrom,
          savedAt: saved.at,
          savedError: saved.error,
        });
        render(main, state, onApply);
      };
      const readSaved = () => {
        reading ??= readPage(sdk, path)
          .then((source) => { saved = { html: source, at: new Date(), error: '' }; })
          .catch((e) => { saved = { ...saved, at: saved.at ?? new Date(), error: e.message }; })
          .finally(() => {
            reading = null;
            if (hasSnapshot) show();
          });
        return reading;
      };
      readSaved();
      const unsubscribe = sdk.actions.subscribeLiveDocument(({ html: next }) => {
        if (typeof next !== 'string' || !next) return;
        hasSnapshot = true;
        snapshot = next;
        if (saved.at && Date.now() - saved.at.getTime() > METADATA_REFRESH_MS) readSaved();
        show();
      });
      window.addEventListener('pagehide', () => unsubscribe(), { once: true });
      // a host that advertises the live document but never sends one: check the saved source
      setTimeout(async () => {
        if (hasSnapshot) return;
        try {
          state.html = await readPage(sdk, path);
          if (!hasSnapshot) render(main, { ...state, live: false, sdk: null }, onApply);
        } catch (e) {
          if (!hasSnapshot) main.replaceChildren(el('p', 'tech-data-error', `No live document and the source could not be read: ${e.message}`));
        }
      }, LIVE_TIMEOUT_MS);
      return;
    }
    render(main, state, onApply);
  } catch (e) {
    main.replaceChildren(el('h1', '', 'Tech data check'), el('p', 'tech-data-error', `The check could not run: ${e.message}`));
  }
}());
