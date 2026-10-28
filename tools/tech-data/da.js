/*
 * DA plumbing for the technical-data plugins (SKODA-852): the editor handshake, the page source
 * and the sheet. Inside DA the plugins read and write the document source with the author's
 * token; opened on their own (no DA frame) they read the published page and the sheet from this
 * origin and never write.
 */
import { TECH_DATA_SHEET, normalizePath, readSheet } from './tech-data.js';

const SDK_URL = 'https://da.live/nx/utils/sdk.js';
const DA_SOURCE = 'https://admin.da.live/source';
// the DA frame answers the handshake within a second; standalone it never does
const CONNECT_TIMEOUT_MS = 1500;

/**
 * Resolve the DA SDK ({ context, token, actions }), or null when not inside DA.
 * Same handshake as the Tag picker (poc/tag-multiselect/tag-picker.js).
 */
export async function connect() {
  if (window.parent === window) return null;
  try {
    // eslint-disable-next-line import/no-unresolved
    const mod = await import(SDK_URL);
    const timeout = new Promise((resolve) => {
      setTimeout(() => resolve(null), CONNECT_TIMEOUT_MS);
    });
    return await Promise.race([mod.default, timeout]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('tech-data: DA SDK unavailable (running standalone?)', e);
    return null;
  }
}

const orgOf = (context) => context?.org || context?.owner || '';
const siteOf = (context) => context?.site || context?.repo || '';

/** The document path from the DA context ("/en/x"), without the org/site prefix or extension. */
export function documentPath(context) {
  const org = orgOf(context);
  const site = siteOf(context);
  let path = String(context?.path || '');
  const prefix = `/${org}/${site}/`;
  if (org && site && path.startsWith(prefix)) path = path.slice(prefix.length - 1);
  return normalizePath(path.startsWith('/') ? path : `/${path}`);
}

const authHeaders = (sdk) => (sdk?.token ? { Authorization: `Bearer ${sdk.token}` } : {});
const sourceUrl = (sdk, path) => `${DA_SOURCE}/${orgOf(sdk.context)}/${siteOf(sdk.context)}${path}`;

async function fetchOk(url, options) {
  const resp = await fetch(url, options);
  if (!resp.ok) throw new Error(`${new URL(url).pathname}: HTTP ${resp.status}`);
  return resp;
}

/** The page HTML: the DA source inside DA, the published .plain.html standalone. */
export async function readPage(sdk, path) {
  if (sdk) return (await fetchOk(sourceUrl(sdk, `${path}.html`), { headers: authHeaders(sdk) })).text();
  return (await fetchOk(`${path}.plain.html`)).text();
}

/** Save the page source in DA (the editor picks the change up from the source). */
export async function writePage(sdk, path, html) {
  if (!sdk) throw new Error('Not connected to DA: nothing was saved');
  const form = new FormData();
  form.append('data', new Blob([html], { type: 'text/html' }));
  await fetchOk(sourceUrl(sdk, `${path}.html`), { method: 'PUT', headers: authHeaders(sdk), body: form });
}

/**
 * The sheet: its DA source when connected (no publish needed), else the copy served from this
 * origin. Standalone, `?sheet=/path.json` (same origin only) points at another copy.
 * @returns {Promise<{values: Map, models: object[], skipped: number, from: string}>}
 */
export async function loadSheet(sdk, search = '') {
  if (sdk) {
    try {
      const resp = await fetchOk(sourceUrl(sdk, TECH_DATA_SHEET), { headers: authHeaders(sdk) });
      return { ...readSheet(await resp.json()), from: `DA ${TECH_DATA_SHEET}` };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('tech-data: DA sheet unavailable, using the published one', e);
    }
  }
  const override = new URLSearchParams(search).get('sheet');
  const path = override && /^\/[\w./-]+\.json$/.test(override) ? override : TECH_DATA_SHEET;
  const resp = await fetchOk(path);
  return { ...readSheet(await resp.json()), from: path };
}
