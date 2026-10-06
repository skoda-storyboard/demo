/**
 * Waits for the icon images under a block (decorateIcons renders lazy <img>s), so the block
 * shows complete instead of its icons popping in a moment later (SKODA-308: header + footer).
 * Starts them loading now and resolves once they are decoded, at the latest after `wait` ms;
 * a failed icon doesn't hold the block back.
 * @param {Element} root The decorated block content
 * @param {number} [wait=250] ms: the longest it waits
 * @returns {Promise<void>}
 */
export default function iconsReady(root, wait = 250) {
  const imgs = [...root.querySelectorAll('.icon img')];
  imgs.forEach((img) => { img.loading = 'eager'; });
  const timeout = new Promise((resolve) => { setTimeout(resolve, wait); });
  return Promise.race([
    Promise.all(imgs.map((img) => img.decode?.().catch(() => {}))),
    timeout,
  ]).then(() => {});
}
