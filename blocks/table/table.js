/**
 * Table (SKODA-843): an authored table in a page's body, rendered as a real <table>. Each
 * block row is a table row, each cell a cell; `Table (header)` makes the first row the head
 * (its cells `th scope="col"`). Rows may have fewer cells than the widest one (authors omit
 * cells): the row keeps the cells it has.
 * @param {Element} block the `.table` block
 */
export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.children.length);
  if (!rows.length) {
    block.textContent = '';
    return;
  }
  const header = block.classList.contains('header') && rows.length > 1;
  const table = document.createElement('table');
  const body = document.createElement('tbody');
  rows.forEach((row, i) => {
    const head = header && i === 0;
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement(head ? 'th' : 'td');
      if (head) td.scope = 'col';
      td.append(...cell.childNodes);
      tr.append(td);
    });
    if (head) {
      const thead = document.createElement('thead');
      thead.append(tr);
      table.append(thead);
    } else {
      body.append(tr);
    }
  });
  table.append(body);
  block.replaceChildren(table);
}
