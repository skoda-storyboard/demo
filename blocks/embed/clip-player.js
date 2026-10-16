/*
 * The source's Vimeo player chrome on a native clip (`Embed (vimeo)`): the source's Vimeo
 * account is domain-locked, so its clips play their MP4 master here (SKODA-805c), and this
 * draws the player's controls on it. Measured on the first-glimpse press kit (812×457):
 * a 56×32 play button and a bar holding the progress track, its time pill and the volume,
 * settings (speed), picture-in-picture and fullscreen buttons, each with its name as a tooltip.
 * Over the volume button, a 32×96 vertical slider shows on hover and on keyboard focus (the
 * next Tab stop after Mute; arrow keys 5%, as the source's). With a mouse the controls show
 * only while the pointer is over the clip (PO, 2026-10-16), and while it plays they also fade 2s
 * after the pointer last moved (the source Vimeo player's). Keyboard focus in the bar, the open
 * speed menu and the pointer resting on the bar keep them; a mouse click doesn't. Without hover
 * (touch) they stay while paused and fade 2s after the last tap while playing.
 * Styles: embed.css (`.embed.vimeo`).
 */

const LABELS = {
  play: 'Play',
  pause: 'Pause',
  mute: 'Mute',
  unmute: 'Unmute',
  settings: 'Settings',
  speed: 'Speed',
  normal: 'Normal',
  pip: 'Picture-in-Picture',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit full screen',
  progress: 'Progress Bar',
  volume: 'Volume (use up/down arrow keys to change)',
  volumeLevel: (pct) => `${pct}% volume`,
  timeOf: (now, total) => `${now} of ${total}`,
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
// the progress bar's keys: arrows step 5s, Page Up / Down a tenth, Home / End the ends
const SEEK_STEP_S = 5;
// the volume slider's keys: arrows step 5% (the source's), Page Up / Down 10%, Home / End the ends
const VOLUME_STEP = 5;
const VOLUME_PAGE = 10;
// while playing, the controls hide this long after the pointer's last move over the clip (the
// source Vimeo player's, measured 2026-10-16)
export const IDLE_MS = 2000;

const SVG = 'http://www.w3.org/2000/svg';
// 24×24 glyphs drawn for this player (play, pause, speaker, speaker off, gear, PiP, fullscreen)
const ICONS = {
  play: ['M7 4.5v15a1 1 0 0 0 1.5.86l12.6-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z'],
  pause: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'],
  volume: ['M3 9v6h4l5 4V5L7 9H3Z', 'M15 8.5a4.5 4.5 0 0 1 0 7v-2.2a2.5 2.5 0 0 0 0-2.6V8.5Z',
    'M15 4.2a8.5 8.5 0 0 1 0 15.6v-2.1a6.5 6.5 0 0 0 0-11.4V4.2Z'],
  muted: ['M3 9v6h4l5 4V5L7 9H3Z', 'm15.3 9.1 1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3-2.3-2.3Z'],
  settings: ['M10.3 2h3.4l.5 2.6 1.6.9 2.5-.9 1.7 2.9-2 1.7v1.6l2 1.7-1.7 2.9-2.5-.9-1.6.9-.5 2.6h-3.4l-.5-2.6-1.6-.9-2.5.9-1.7-2.9 2-1.7V9.2l-2-1.7 1.7-2.9 2.5.9 1.6-.9.5-2.6ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z'],
  pip: ['M3 5h18v7h-2V7H5v10h6v2H3V5Z', 'M13 14h9v7h-9z'],
  fullscreen: ['M4 4h6v2H6v4H4V4Z', 'M14 4h6v6h-2V6h-4V4Z', 'M4 14h2v4h4v2H4v-6Z', 'M18 14h2v6h-6v-2h4v-4Z'],
};

function icon(name) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  ICONS[name].forEach((d) => {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    if (name === 'settings') path.setAttribute('fill-rule', 'evenodd');
    svg.append(path);
  });
  return svg;
}

/**
 * "06:08", or "1:02:03" past an hour; a missing or broken duration reads "00:00".
 * @param {number} seconds
 * @returns {string}
 */
export function timecode(seconds) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function control(className, label, glyph) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `clip-button ${className}`;
  button.setAttribute('aria-label', label);
  button.dataset.tip = label;
  button.append(icon(glyph));
  return button;
}

function setControl(button, label, glyph) {
  button.setAttribute('aria-label', label);
  button.dataset.tip = label;
  button.replaceChildren(icon(glyph));
}

/**
 * Replace the native controls of a clip with the source player's.
 * @param {Element} wrapper the .embed-video box holding the video
 * @param {HTMLVideoElement} video
 */
export default function clipPlayer(wrapper, video) {
  video.removeAttribute('controls');
  wrapper.classList.add('clip');

  const bar = document.createElement('div');
  bar.className = 'clip-bar';

  const play = control('clip-play', LABELS.play, 'play');

  const panel = document.createElement('div');
  panel.className = 'clip-panel';

  // the track is drawn; a transparent range on top of it seeks and carries the a11y
  const progress = document.createElement('div');
  progress.className = 'clip-progress';
  const track = document.createElement('div');
  track.className = 'clip-track';
  const loaded = document.createElement('div');
  loaded.className = 'clip-loaded';
  const played = document.createElement('div');
  played.className = 'clip-played';
  track.append(loaded, played);
  const time = document.createElement('span');
  time.className = 'clip-time';
  time.setAttribute('aria-hidden', 'true');
  time.textContent = timecode(0);
  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'clip-seek';
  seek.min = '0';
  seek.max = '0';
  seek.step = 'any';
  seek.value = '0';
  seek.setAttribute('aria-label', LABELS.progress);
  progress.append(track, time, seek);

  const buttons = document.createElement('div');
  buttons.className = 'clip-buttons';
  const volume = control('clip-volume', LABELS.mute, 'volume');
  // the source's vertical volume slider over the button: a role=slider, as the source's (a
  // vertical native range is still uneven across browsers), drawn as a 4×72 track with its
  // fill and an 8px handle
  const volumeControl = document.createElement('div');
  volumeControl.className = 'clip-volume-control';
  const slider = document.createElement('div');
  slider.className = 'clip-volume-slider';
  slider.tabIndex = 0;
  slider.setAttribute('role', 'slider');
  slider.setAttribute('aria-label', LABELS.volume);
  slider.setAttribute('aria-orientation', 'vertical');
  slider.setAttribute('aria-valuemin', '0');
  slider.setAttribute('aria-valuemax', '100');
  const sliderBar = document.createElement('div');
  sliderBar.className = 'clip-volume-bar';
  const sliderFill = document.createElement('div');
  sliderFill.className = 'clip-volume-fill';
  const sliderHandle = document.createElement('div');
  sliderHandle.className = 'clip-volume-handle';
  sliderBar.append(sliderFill, sliderHandle);
  slider.append(sliderBar);
  volumeControl.append(volume, slider);
  const settings = control('clip-settings', LABELS.settings, 'settings');
  settings.setAttribute('aria-haspopup', 'true');
  settings.setAttribute('aria-expanded', 'false');
  const pip = control('clip-pip', LABELS.pip, 'pip');
  const full = control('clip-fullscreen', LABELS.fullscreen, 'fullscreen');
  // only what the browser can do
  pip.hidden = !(document.pictureInPictureEnabled && video.requestPictureInPicture);
  full.hidden = !(wrapper.requestFullscreen || video.webkitEnterFullscreen);
  buttons.append(volumeControl, settings, pip, full);

  // settings: the playback speed (the MP4 master has one quality)
  const menu = document.createElement('div');
  menu.className = 'clip-menu';
  menu.hidden = true;
  const menuTitle = document.createElement('p');
  menuTitle.className = 'clip-menu-title';
  menuTitle.textContent = LABELS.speed;
  menu.append(menuTitle);
  const speedButtons = SPEEDS.map((rate) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'clip-menu-option';
    option.textContent = rate === 1 ? LABELS.normal : String(rate);
    option.setAttribute('aria-pressed', String(rate === 1));
    option.addEventListener('click', () => {
      video.playbackRate = rate;
      speedButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === option)));
      // eslint-disable-next-line no-use-before-define
      closeMenu(true);
    });
    menu.append(option);
    return option;
  });

  panel.append(progress, buttons, menu);
  bar.append(play, panel);
  wrapper.append(bar);

  const duration = () => (Number.isFinite(video.duration) ? video.duration : 0);
  const render = () => {
    const total = duration();
    const now = Math.min(video.currentTime || 0, total || Infinity);
    const share = total ? now / total : 0;
    played.style.inlineSize = `${share * 100}%`;
    let buffered = 0;
    if (video.buffered?.length) buffered = video.buffered.end(video.buffered.length - 1);
    loaded.style.inlineSize = `${total ? Math.min(buffered / total, 1) * 100 : 0}%`;
    // before the first play the pill shows the length, then the time played, as the source
    time.textContent = timecode(video.played?.length || now ? now : total);
    progress.style.setProperty('--clip-share', String(share));
    seek.max = String(total);
    seek.value = String(now);
    seek.setAttribute('aria-valuetext', LABELS.timeOf(timecode(now), timecode(total)));
  };

  // the controls' hiding (`is-idle`): with a mouse whenever the pointer is off the clip, and
  // while playing 2s after its last move; without hover only that idle fade
  const canHover = window.matchMedia?.('(hover: hover)')?.matches ?? true;
  let idleTimer = 0;
  let idle = false;
  let inside = false;
  let overBar = false;
  // keyboard focus holds the controls; the focus a mouse click leaves on a button doesn't
  const keyboardFocus = () => {
    const el = document.activeElement;
    if (!el || !bar.contains(el)) return false;
    try { return el.matches(':focus-visible'); } catch { return true; }
  };
  const sync = () => {
    const playing = !(video.paused || video.ended);
    const held = overBar || !menu.hidden || keyboardFocus();
    wrapper.classList.toggle('is-idle', !held && ((canHover && !inside) || (playing && idle)));
  };
  const show = () => {
    idle = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { idle = true; sync(); }, IDLE_MS);
    sync();
  };

  const syncPlay = () => {
    const paused = video.paused || video.ended;
    setControl(play, paused ? LABELS.play : LABELS.pause, paused ? 'play' : 'pause');
    wrapper.classList.toggle('is-playing', !paused);
    // the pointer restarts the idle fade (a click on Play does); the play event, which may come
    // a while later once the clip has buffered, doesn't
    sync();
  };
  // the slider shows the level heard: 0 while muted
  const level = () => (video.muted ? 0 : Math.round((video.volume ?? 1) * 100));
  const setLevel = (pct) => {
    const to = Math.min(Math.max(Math.round(pct), 0), 100);
    video.volume = to / 100;
    video.muted = to === 0;
  };
  const syncVolume = () => {
    const off = video.muted || video.volume === 0;
    setControl(volume, off ? LABELS.unmute : LABELS.mute, off ? 'muted' : 'volume');
    const now = level();
    slider.setAttribute('aria-valuenow', String(now));
    slider.setAttribute('aria-valuetext', LABELS.volumeLevel(now));
    slider.style.setProperty('--clip-volume', String(now / 100));
  };

  const toggle = () => {
    if (video.paused || video.ended) {
      video.play()?.catch?.(() => {}); // a refused play leaves the Play button as it is
    } else video.pause();
  };

  function closeMenu(focusSettings = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    settings.setAttribute('aria-expanded', 'false');
    if (focusSettings) settings.focus();
    show();
  }

  play.addEventListener('click', toggle);
  video.addEventListener('click', toggle);
  volume.addEventListener('click', () => {
    video.muted = !(video.muted || video.volume === 0);
    if (!video.muted && video.volume === 0) video.volume = 1;
  });
  slider.addEventListener('keydown', (e) => {
    const steps = {
      ArrowUp: VOLUME_STEP,
      ArrowRight: VOLUME_STEP,
      ArrowDown: -VOLUME_STEP,
      ArrowLeft: -VOLUME_STEP,
      PageUp: VOLUME_PAGE,
      PageDown: -VOLUME_PAGE,
    };
    let to = null;
    if (e.key in steps) to = level() + steps[e.key];
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = 100;
    if (to === null) return;
    e.preventDefault();
    setLevel(to);
    syncVolume();
  });
  // pointer: the level at the pointer on the track (its foot is 0), pressed or dragged
  const levelAt = (clientY) => {
    const { top, bottom } = sliderBar.getBoundingClientRect();
    return bottom > top ? ((bottom - clientY) / (bottom - top)) * 100 : level();
  };
  slider.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    slider.focus({ preventScroll: true });
    slider.setPointerCapture?.(e.pointerId);
    setLevel(levelAt(e.clientY));
    syncVolume();
  });
  slider.addEventListener('pointermove', (e) => {
    if (!slider.hasPointerCapture?.(e.pointerId)) return;
    setLevel(levelAt(e.clientY));
    syncVolume();
  });
  settings.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
    if (open) speedButtons.find((b) => b.getAttribute('aria-pressed') === 'true')?.focus();
    sync();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    closeMenu(true);
  });
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !settings.contains(e.target)) closeMenu();
  });
  pip.addEventListener('click', () => {
    const exit = document.pictureInPictureElement === video;
    (exit ? document.exitPictureInPicture() : video.requestPictureInPicture())?.catch?.(() => {});
  });
  full.addEventListener('click', () => {
    if (document.fullscreenElement === wrapper) {
      document.exitFullscreen()?.catch?.(() => {});
    } else if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen()?.catch?.(() => {});
    } else video.webkitEnterFullscreen?.(); // iOS: only the video goes full screen
  });
  document.addEventListener('fullscreenchange', () => {
    const on = document.fullscreenElement === wrapper;
    setControl(full, on ? LABELS.exitFullscreen : LABELS.fullscreen, 'fullscreen');
  });
  seek.addEventListener('keydown', (e) => {
    const total = duration();
    const steps = {
      ArrowLeft: -SEEK_STEP_S,
      ArrowDown: -SEEK_STEP_S,
      ArrowRight: SEEK_STEP_S,
      ArrowUp: SEEK_STEP_S,
      PageDown: -total / 10,
      PageUp: total / 10,
    };
    let to = null;
    if (e.key in steps) to = (video.currentTime || 0) + steps[e.key];
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = total;
    if (to === null || !total) return;
    e.preventDefault();
    video.currentTime = Math.min(Math.max(to, 0), total);
    render();
  });
  seek.addEventListener('input', () => {
    const to = Number(seek.value);
    if (Number.isFinite(to)) video.currentTime = to;
    render();
  });

  ['timeupdate', 'durationchange', 'loadedmetadata', 'progress', 'seeked', 'ended'].forEach((type) => {
    video.addEventListener(type, render);
  });
  ['play', 'pause', 'ended'].forEach((type) => video.addEventListener(type, syncPlay));
  // a touch pointer is never "over" the clip: it only restarts the idle fade
  const enter = (e) => { if (e.pointerType !== 'touch') inside = true; show(); };
  wrapper.addEventListener('pointerenter', enter);
  wrapper.addEventListener('pointermove', enter);
  wrapper.addEventListener('pointerdown', () => show());
  wrapper.addEventListener('pointerleave', () => { inside = false; overBar = false; sync(); });
  bar.addEventListener('pointerenter', () => { overBar = true; sync(); });
  bar.addEventListener('pointerleave', () => { overBar = false; show(); });
  // focusout runs once the focus has left (moving to the next control fires focusin after it)
  wrapper.addEventListener('focusin', sync);
  wrapper.addEventListener('focusout', sync);
  video.addEventListener('volumechange', syncVolume);
  render();
  syncPlay();
  syncVolume();
  show();
}

export { LABELS as CLIP_LABELS };
