/*
 * Contact Directory (SKODA-810a, docs/ui-specs/company-pages.md, sub-spec E): the Contacts
 * page's people, two to a row from 781px, one below (the source's SiteOrigin row).
 *
 * One row per person, one cell: the name and title (bold), the portrait, the e-mail line
 * (a `t:` phone after a break, as text: it becomes a `tel:` link) and the LinkedIn line with
 * its icon. The card is kept as authored (scripts/person-card.js); rows without content drop.
 */

import decoratePersonCard from '../../scripts/person-card.js';

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'contact-directory-list';
  [...block.children].forEach((row) => {
    const cells = [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));
    if (!cells.length) return;
    const item = document.createElement('li');
    cells.forEach((cell) => item.append(...cell.childNodes));
    decoratePersonCard(item, 'contact-directory');
    list.append(item);
  });
  block.replaceChildren(list);
}
