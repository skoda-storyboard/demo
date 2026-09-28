let nextId = 0;

export default function decorate(block) {
  const items = [];
  [...block.children].forEach((row) => {
    const [summary, answer] = row.children;
    if (!summary || !answer || !summary.textContent.trim()
      || (!answer.textContent.trim() && !answer.querySelector('img, picture, iframe, a[href]'))) {
      // Keep incomplete authored rows readable rather than silently discarding them.
      items.push(row);
      return;
    }

    nextId += 1;
    const heading = document.createElement(
      summary.querySelector('h2, h3, h4, h5, h6')?.tagName.toLowerCase() || 'h3',
    );
    heading.className = 'accordion-heading';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `accordion-trigger-${nextId}`;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `accordion-panel-${nextId}`);
    const sourceHeading = summary.querySelector('h2, h3, h4, h5, h6');
    button.append(...(sourceHeading ? [...sourceHeading.childNodes] : [...summary.childNodes]));
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
    heading.append(button);

    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.id = `accordion-panel-${nextId}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', button.id);
    panel.hidden = true;
    panel.append(...answer.childNodes);
    button.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    });
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.append(heading, panel);
    items.push(item);
  });
  block.replaceChildren(...items);
}
