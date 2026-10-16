/*
 * The source Vimeo player's controls on a native clip (`Embed (vimeo)`, clip-player.js).
 * jsdom has no media playback: the video's clock, length and play / pause are stubbed.
 * Run: node --test blocks/embed/clip-player.test.mjs
 */
/* global globalThis */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

let JSDOM;
try {
  ({ JSDOM } = createRequire(import.meta.url)('jsdom'));
} catch { /* importer validator may have no test dependencies */ }

const player = JSDOM ? await import('./clip-player.js') : null;

function setup({ duration = 368, pip = true } = {}) {
  const dom = new JSDOM('<main><div class="embed vimeo"><div class="embed-video"><video controls></video></div></div></main>', { url: 'https://example.com/' });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  const video = window.document.querySelector('video');
  const state = { paused: true, currentTime: 0, duration, muted: false, volume: 1, playbackRate: 1 };
  const fire = (type) => video.dispatchEvent(new window.Event(type));
  Object.defineProperties(video, {
    paused: { get: () => state.paused },
    ended: { get: () => false },
    duration: { get: () => state.duration },
    currentTime: { get: () => state.currentTime, set: (t) => { state.currentTime = t; fire('timeupdate'); } },
    muted: { get: () => state.muted, set: (m) => { state.muted = m; fire('volumechange'); } },
    volume: { get: () => state.volume, set: (v) => { state.volume = v; fire('volumechange'); } },
    playbackRate: { get: () => state.playbackRate, set: (r) => { state.playbackRate = r; } },
    played: { get: () => ({ length: state.currentTime > 0 ? 1 : 0 }) },
    buffered: { get: () => ({ length: 1, end: () => state.duration / 2 }) },
  });
  video.play = () => { state.paused = false; fire('play'); return Promise.resolve(); };
  video.pause = () => { state.paused = true; fire('pause'); };
  if (pip) video.requestPictureInPicture = () => Promise.resolve();
  window.document.pictureInPictureEnabled = pip;
  const wrapper = window.document.querySelector('.embed-video');
  wrapper.requestFullscreen = () => Promise.resolve();
  player.default(wrapper, video);
  const q = (s) => wrapper.querySelector(s);
  const key = (el, k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  return { window, wrapper, video, state, q, fire, key };
}

test('timecode: mm:ss, h:mm:ss past an hour, 00:00 for a missing or broken length', { skip: !JSDOM }, () => {
  assert.equal(player.timecode(368), '06:08');
  assert.equal(player.timecode(5.9), '00:05');
  assert.equal(player.timecode(3723), '1:02:03');
  // a string is no length (the media element always reports a number)
  [NaN, Infinity, -4, undefined, null, '12'].forEach((v) => assert.equal(player.timecode(v), '00:00', String(v)));
});

test('the source player chrome replaces the native controls, in the source order, each named', { skip: !JSDOM }, () => {
  const { video, q, wrapper } = setup();
  assert.equal(video.hasAttribute('controls'), false);
  assert.ok(wrapper.classList.contains('clip'));
  const names = [...wrapper.querySelectorAll('.clip-bar button:not(.clip-menu-option), .clip-seek')]
    .filter((b) => !b.hidden).map((b) => b.getAttribute('aria-label'));
  assert.deepEqual(names, ['Play', 'Progress Bar', 'Mute', 'Settings', 'Picture-in-Picture', 'Fullscreen']);
  assert.deepEqual([...wrapper.querySelectorAll('.clip-button')].map((b) => b.dataset.tip), ['Play', 'Mute', 'Settings', 'Picture-in-Picture', 'Fullscreen'], 'the tooltips');
  assert.equal(q('.clip-time').textContent, '06:08', 'before the first play the pill shows the length');
  assert.equal(q('.clip-time').getAttribute('aria-hidden'), 'true', 'the range carries the time');
  assert.equal(q('.clip-seek').getAttribute('aria-valuetext'), '00:00 of 06:08');
  assert.equal(q('.clip-loaded').style.inlineSize, '50%');
});

test('play / pause: the button and the video click toggle it, the label and glyph follow', { skip: !JSDOM }, () => {
  const { video, state, q, window } = setup();
  q('.clip-play').click();
  assert.equal(state.paused, false);
  assert.equal(q('.clip-play').getAttribute('aria-label'), 'Pause');
  assert.equal(q('.clip-play').dataset.tip, 'Pause');
  assert.equal(q('.clip-play svg').querySelectorAll('path').length, 2, 'the pause bars');
  video.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(state.paused, true);
  assert.equal(q('.clip-play').getAttribute('aria-label'), 'Play');
});

test('progress: the played bar, the pill over the playhead and the range follow the clock', { skip: !JSDOM }, () => {
  const { video, q } = setup();
  video.currentTime = 92;
  assert.equal(q('.clip-played').style.inlineSize, '25%');
  assert.equal(q('.clip-time').textContent, '01:32', 'the time played once it has started');
  assert.equal(q('.clip-progress').style.getPropertyValue('--clip-share'), '0.25');
  assert.equal(q('.clip-seek').value, '92');
  assert.equal(q('.clip-seek').getAttribute('aria-valuetext'), '01:32 of 06:08');
});

test('progress keys: arrows step 5s, Page keys a tenth, Home / End the ends, clamped', { skip: !JSDOM }, () => {
  const { state, q, key } = setup();
  const seek = q('.clip-seek');
  key(seek, 'ArrowRight');
  assert.equal(state.currentTime, 5);
  key(seek, 'PageUp');
  assert.equal(state.currentTime, 5 + 36.8);
  key(seek, 'End');
  assert.equal(state.currentTime, 368);
  key(seek, 'ArrowUp');
  assert.equal(state.currentTime, 368, 'never past the end');
  key(seek, 'Home');
  key(seek, 'ArrowLeft');
  assert.equal(state.currentTime, 0, 'never before the start');
});

test('progress keys wait for the length: no metadata yet, no seek', { skip: !JSDOM }, () => {
  const { state, q, key } = setup({ duration: NaN });
  key(q('.clip-seek'), 'ArrowRight');
  key(q('.clip-seek'), 'End');
  assert.equal(state.currentTime, 0);
  assert.equal(q('.clip-time').textContent, '00:00');
});

test('volume: mutes and unmutes; a zero volume counts as muted and comes back at full', { skip: !JSDOM }, () => {
  const { state, q, video } = setup();
  q('.clip-volume').click();
  assert.equal(state.muted, true);
  assert.equal(q('.clip-volume').getAttribute('aria-label'), 'Unmute');
  q('.clip-volume').click();
  assert.equal(state.muted, false);
  video.volume = 0;
  assert.equal(q('.clip-volume').getAttribute('aria-label'), 'Unmute');
  q('.clip-volume').click();
  assert.equal(state.volume, 1);
  assert.equal(q('.clip-volume').getAttribute('aria-label'), 'Mute');
});

test('settings: a speed menu, focus on the current speed, a pick sets it and returns to Settings; Esc and an outside click close it', { skip: !JSDOM }, () => {
  const {
    state, q, key, window,
  } = setup();
  const settings = q('.clip-settings');
  settings.click();
  assert.equal(q('.clip-menu').hidden, false);
  assert.equal(settings.getAttribute('aria-expanded'), 'true');
  assert.equal(window.document.activeElement.textContent, 'Normal');
  const option = [...q('.clip-menu').querySelectorAll('button')].find((b) => b.textContent === '1.5');
  option.click();
  assert.equal(state.playbackRate, 1.5);
  assert.equal(option.getAttribute('aria-pressed'), 'true');
  assert.equal(q('.clip-menu').hidden, true);
  assert.equal(window.document.activeElement, settings);
  settings.click();
  key(window.document.activeElement, 'Escape');
  assert.equal(q('.clip-menu').hidden, true);
  assert.equal(settings.getAttribute('aria-expanded'), 'false');
  settings.click();
  window.document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  assert.equal(q('.clip-menu').hidden, true, 'an outside click closes it');
});

test('only what the browser can do: no picture-in-picture button without the API', { skip: !JSDOM }, () => {
  const { q } = setup({ pip: false });
  assert.equal(q('.clip-pip').hidden, true);
  assert.equal(q('.clip-fullscreen').hidden, false);
});

test('a refused play (autoplay policy, a load error) leaves the Play button as it is', { skip: !JSDOM }, async () => {
  const { video, q } = setup();
  video.play = () => Promise.reject(new Error('NotAllowedError'));
  q('.clip-play').click();
  await new Promise((r) => { setTimeout(r, 0); });
  assert.equal(q('.clip-play').getAttribute('aria-label'), 'Play');
});

// --- #356 review (745f15f): the source's volume slider; Settings / PiP at every width ----------
test('volume slider: the source\'s vertical slider, the Tab stop after Mute, named and valued', { skip: !JSDOM }, () => {
  const { q, wrapper } = setup();
  const slider = q('.clip-volume-slider');
  assert.equal(slider.getAttribute('role'), 'slider');
  assert.equal(slider.tabIndex, 0);
  assert.equal(slider.getAttribute('aria-label'), 'Volume (use up/down arrow keys to change)');
  assert.equal(slider.getAttribute('aria-orientation'), 'vertical');
  assert.deepEqual(['aria-valuemin', 'aria-valuemax', 'aria-valuenow'].map((a) => slider.getAttribute(a)), ['0', '100', '100']);
  assert.equal(slider.getAttribute('aria-valuetext'), '100% volume');
  const focusable = [...wrapper.querySelectorAll('.clip-bar button:not(.clip-menu-option), .clip-seek, [role="slider"]')]
    .filter((el) => !el.hidden).map((el) => el.getAttribute('aria-label'));
  assert.deepEqual(focusable.slice(2, 4), ['Mute', 'Volume (use up/down arrow keys to change)'], 'right after Mute, as the source');
});

test('volume slider keys: arrows 5%, Page keys 10%, Home mutes, End is full; clamped; the fill follows', { skip: !JSDOM }, () => {
  const { q, state, key } = setup();
  const slider = q('.clip-volume-slider');
  const now = () => slider.getAttribute('aria-valuenow');
  key(slider, 'ArrowDown');
  assert.equal(now(), '95');
  assert.equal(slider.getAttribute('aria-valuetext'), '95% volume');
  assert.equal(slider.style.getPropertyValue('--clip-volume'), '0.95');
  key(slider, 'PageDown');
  assert.equal(now(), '85');
  ['ArrowUp', 'ArrowRight', 'PageUp', 'PageUp'].forEach((k) => key(slider, k));
  assert.equal(now(), '100', 'clamped at full');
  key(slider, 'Home');
  assert.equal(now(), '0');
  assert.equal(state.muted, true, 'zero is muted');
  assert.equal(q('.clip-volume').getAttribute('aria-label'), 'Unmute');
  key(slider, 'ArrowUp');
  assert.equal(state.muted, false);
  assert.equal(now(), '5');
  key(slider, 'End');
  assert.equal(state.volume, 1);
  key(slider, 'Tab');
  assert.equal(now(), '100', 'other keys leave it');
});

test('volume slider follows the Mute button: 0 while muted, the level again after', { skip: !JSDOM }, () => {
  const { q, key } = setup();
  const slider = q('.clip-volume-slider');
  key(slider, 'PageDown');
  q('.clip-volume').click();
  assert.equal(slider.getAttribute('aria-valuenow'), '0');
  q('.clip-volume').click();
  assert.equal(slider.getAttribute('aria-valuenow'), '90');
});

test('Settings and Picture-in-Picture stay at every width (no narrow-player rule hides them)', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = (await readFile(new URL('./embed.css', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const hiding = rules.filter(([, sel, body]) => /clip-(settings|pip)/.test(sel) && /display:\s*none/.test(body));
  assert.deepEqual(hiding.map(([, sel]) => sel.trim()), []);
});
