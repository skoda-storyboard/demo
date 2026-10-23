/* eslint-disable */
/**
 * Locale helpers for the importers (SKODA-1001). A page imported from `/cs/…` is a Czech page:
 * the settings its parsers write (a listing's index and path scope, a rail's feed, a model
 * family's path) point at the Czech index, the Czech content and the media feed the Czech
 * site reads, not at the English ones. The paths are the runtime's own map
 * (scripts/locale-paths.js), so the importer and the site never disagree.
 */
import {
  LOCALE_PATHS, BUILT, contentPrefix,
} from '../../scripts/locale-paths.js';

/** The two-letter locale of a source URL or path (`https://…/cs/foto/` → `cs`), else `en`. */
export function sourceLocale(url) {
  let pathname = String(url || '');
  try { pathname = new URL(pathname, 'https://www.skoda-storyboard.com').pathname; } catch (e) { /* a path */ }
  const m = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
  const locale = m ? m[1].toLowerCase() : 'en';
  return Object.prototype.hasOwnProperty.call(LOCALE_PATHS, locale) ? locale : 'en';
}

/** The page index of a locale. */
export const indexUrl = (locale) => `/${locale}/query-index.json`;

/** The media feed a locale's pages read: its own once built, else the English one. */
export const mediaFeedUrl = (locale) => `/${BUILT.mediaFeed.includes(locale) ? locale : 'en'}/media-feed.json`;

/** A content type's `path` scope in a locale, with the trailing slash the listings use. */
export const contentPath = (template, locale) => `${contentPrefix(template, locale)}/`;

/** The locale's home path scope (`/cs/`), as the home rails' `path`. */
export const homePath = (locale) => `/${locale}/`;
