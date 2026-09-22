import decorateCards from '../../scripts/card-teaser.js';

// Base cards block — the fallback teaser (media-style) shape. Variants live in
// cards-media / cards-overlay / cards-toolbar and share scripts/card-teaser.js.
export default function decorate(block) {
  decorateCards(block);
}
