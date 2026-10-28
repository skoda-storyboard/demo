/*
 * Tech data picker (SKODA-852): a DA library plugin. Pick a model, click a value, and it lands
 * in the document as a link to its sheet row (the link text is the formatted value). The page's
 * own model is preselected. Standalone it lists the values without inserting.
 */
import { FIELD_LABELS, linkHtml, modelsForPath } from '../tech-data.js';
import { connect, documentPath, loadSheet } from '../da.js';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// the model's own figures first (what its page shows), then each version
const byVersion = (a, b) => a.version.localeCompare(b.version, 'en', { numeric: true });

function valueRow(row, sdk) {
  const tr = el('tr');
  const th = el('th', '', FIELD_LABELS[row.field] || row.field);
  th.scope = 'row';
  const source = el('td', 'tech-data-muted');
  if (row.source) {
    const a = el('a', '', [row.source.split('/').pop(), row.sourceDate].filter(Boolean).join(', '));
    a.href = row.source;
    a.target = '_blank';
    a.rel = 'noopener';
    source.append(a);
  }
  if (row.note) source.append(el('span', 'tech-data-note', row.note));
  const insert = el('td');
  const button = el('button', 'tech-data-button', row.display);
  button.type = 'button';
  button.disabled = !sdk;
  button.setAttribute('aria-label', `Insert ${row.label} ${FIELD_LABELS[row.field] || row.field}: ${row.display}`);
  button.addEventListener('click', async () => {
    await sdk.actions.sendHTML(linkHtml(row));
    sdk.actions.closeLibrary?.();
  });
  insert.append(button);
  tr.append(th, insert, source);
  return tr;
}

function renderValues(container, rows, sdk) {
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
    group.forEach((row) => body.append(valueRow(row, sdk)));
    table.append(body);
    container.append(table);
  });
}

(async function init() {
  const main = document.querySelector('main');
  try {
    const sdk = await connect();
    const sheet = await loadSheet(sdk, window.location.search);
    const path = sdk ? documentPath(sdk.context) : '';
    const preselected = modelsForPath(sheet.models, path)[0]?.code ?? sheet.models[0]?.code;
    if (!sheet.models.length) {
      main.replaceChildren(el('p', 'tech-data-error', `The sheet (${sheet.from}) has no models.`));
      return;
    }

    const label = el('label', '', 'Model ');
    const select = el('select');
    sheet.models.forEach((m) => {
      const option = el('option', '', m.name);
      option.value = m.code;
      option.selected = m.code === preselected;
      select.append(option);
    });
    label.append(select);
    const values = el('div');
    const rowsOf = (code) => [...sheet.values.values()].filter((v) => v.model === code);
    const show = () => renderValues(values, rowsOf(select.value), sdk);
    select.addEventListener('change', show);

    main.replaceChildren(
      el('h1', '', 'Tech data'),
      el('p', 'tech-data-muted', sdk
        ? 'Click a value to insert it as a linked value. Preflight then keeps it in line with the sheet.'
        : 'Open this from the DA library to insert values.'),
      label,
      values,
    );
    show();
  } catch (e) {
    main.replaceChildren(el('p', 'tech-data-error', `The sheet could not be loaded: ${e.message}`));
  }
}());
