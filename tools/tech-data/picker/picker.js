/*
 * Tech data picker (SKODA-852): a DA library plugin. Pick a model, click a value, and the value is
 * copied as a link to its sheet row (the link text is the formatted value); paste it where it
 * belongs in the sentence. The page's own model is preselected.
 *
 * Why copy, not insert: DA's library inserts `sendHTML` content as a closed block (da-live
 * `da-library.js`: `new Slice(parsed.content, 0, 0)`), so an inline value would split its
 * sentence into three paragraphs (review P2 #5), and `sendText` can't carry the link. A paste
 * goes through the editor's own inline parsing.
 */
import {
  FIELD_LABELS, linkHtml, modelsForPage, pageTags,
} from '../tech-data.js';
import {
  connect, documentPath, loadSheet, readPage,
} from '../da.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// the model's own figures first (what its page shows), then each version
const byVersion = (a, b) => a.version.localeCompare(b.version, 'en', { numeric: true });

/** Put the linked value on the clipboard as HTML (the link) and as plain text (the value). */
async function copyValue(row) {
  const html = linkHtml(row);
  await navigator.clipboard.write([new window.ClipboardItem({
    'text/html': new Blob([html], { type: 'text/html' }),
    'text/plain': new Blob([row.display], { type: 'text/plain' }),
  })]);
}

function valueRow(row, status) {
  const tr = el('tr');
  const fieldLabel = FIELD_LABELS[row.field] || row.field;
  const th = el('th', '', fieldLabel);
  th.scope = 'row';
  const source = el('td', 'tech-data-muted');
  if (row.source) {
    const a = el('a', '', [row.source.split('/').pop(), row.sourceDate].filter(Boolean).join(', '));
    a.href = row.source;
    a.target = '_blank';
    a.rel = 'noopener';
    source.append(a);
  }
  [row.confidence, row.note, row.limitations].filter(Boolean)
    .forEach((text) => source.append(el('span', 'tech-data-note', text)));
  const copy = el('td');
  const button = el('button', 'tech-data-button', row.display);
  button.type = 'button';
  button.setAttribute('aria-label', `Copy ${row.label} ${fieldLabel}: ${row.display}`);
  button.addEventListener('click', async () => {
    try {
      await copyValue(row);
      status.textContent = `Copied ${row.label} ${fieldLabel}: ${row.display}. Paste it into the text (Ctrl+V or ⌘V); it stays linked to the sheet.`;
    } catch (e) {
      status.textContent = `Copying was blocked (${e.message}). In Technical Data cells, use Tech data check → Update or Link instead.`;
    }
  });
  copy.append(button);
  tr.append(th, copy, source);
  return tr;
}

function renderValues(container, rows, status) {
  container.replaceChildren();
  const groups = new Map();
  [...rows].sort(byVersion).forEach((row) => {
    if (!groups.has(row.label)) groups.set(row.label, []);
    groups.get(row.label).push(row);
  });
  groups.forEach((group, label) => {
    const table = el('table', 'tech-data-values');
    table.append(el('caption', '', label));
    const body = el('tbody');
    group.forEach((row) => body.append(valueRow(row, status)));
    table.append(body);
    container.append(table);
  });
}

/** The open document's model (path or metadata tags), or null. */
async function pageModel(sdk, sheet) {
  if (!sdk) return null;
  const path = documentPath(sdk.context);
  try {
    const tags = pageTags(await readPage(sdk, path));
    return modelsForPage(sheet.models, { path, tags })[0]?.code ?? null;
  } catch {
    return modelsForPage(sheet.models, { path })[0]?.code ?? null;
  }
}

(async function init() {
  const main = document.querySelector('main');
  try {
    const sdk = await connect();
    const sheet = await loadSheet(sdk, window.location.search);
    if (!sheet.models.length) {
      main.replaceChildren(el('p', 'tech-data-error', `The sheet (${sheet.from}) has no models.`));
      return;
    }
    const preselected = (await pageModel(sdk, sheet)) ?? sheet.models[0].code;

    const label = el('label', '', 'Model ');
    const select = el('select');
    sheet.models.forEach((m) => {
      const option = el('option', '', m.name);
      option.value = m.code;
      option.selected = m.code === preselected;
      select.append(option);
    });
    label.append(select);
    const status = el('p', 'tech-data-status');
    status.setAttribute('role', 'status');
    const values = el('div');
    const rowsOf = (code) => [...sheet.values.values()].filter((v) => v.model === code);
    const show = () => renderValues(values, rowsOf(select.value), status);
    select.addEventListener('change', show);

    main.replaceChildren(
      el('h1', '', 'Tech data'),
      el('p', 'tech-data-muted', 'Click a value to copy it as a linked value, then paste it into your text. Tech data check keeps it in line with the sheet.'),
      label,
      status,
      values,
    );
    show();
  } catch (e) {
    main.replaceChildren(el('p', 'tech-data-error', `The sheet could not be loaded: ${e.message}`));
  }
}());
