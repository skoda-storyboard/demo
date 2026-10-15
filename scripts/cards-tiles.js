const TILE_SIZES = {
  sq: { span: 6, mode: 'series' },
  wide: { span: 6, mode: 'series' },
  'sq-small': { span: 3, mode: 'series' },
  quarter: { span: 3, mode: 'series' },
  third: { span: 4, mode: 'series' },
  'third-sq': { span: 4, mode: 'series' },
  'two-thirds': { span: 8, mode: 'series' },
  banner: { span: 12, mode: 'series' },
  'banner-tall': { span: 12, mode: 'series' },
  feature: { span: 8, mode: 'press' },
  // A 2:1 tile over half the row (older kits: 2 wide, or 1 wide + 2 quarters; 604px at 1280).
  'press-half': { span: 10, mode: 'press' },
  'press-square': { span: 4, mode: 'press' },
  'press-quarter': { span: 5, mode: 'press' },
  // Mosaic-only sizes (Classic Days 2026), on the 30-column track below: a 2:1-less-gutter
  // tile over a third of the row, and image-only banner tiles over 3/5, 2/5 or half of it.
  'press-third': { mode: 'press', mosaic: true },
  'press-banner-wide': { mode: 'press', mosaic: true, banner: true },
  'press-banner-narrow': { mode: 'press', mosaic: true, banner: true },
  'press-banner-half': { mode: 'press', mosaic: true, banner: true },
};

// A press mosaic with thirds or banners runs on 30 columns: fifths, thirds, halves, 3/5 and
// 2/5 all fit (the 20-column track can't split in three; 60 columns would have more gaps than
// the row is wide). Quarters don't fit 30, so they never share a mosaic.
const MOSAIC_SPANS = {
  feature: 12,
  'press-half': 15,
  'press-square': 6,
  'press-third': 10,
  'press-banner-wide': 18,
  'press-banner-narrow': 12,
  'press-banner-half': 15,
};

/** Is this size token an image-only banner tile ([size, linked picture])? */
export const isBannerToken = (token) => !!TILE_SIZES[token]?.banner;

export class TileLayoutError extends Error {}

export function layoutTileRows(rawTokens, { pressPage = false } = {}) {
  let mode;
  let filled = 0;
  let rowStart = true;
  const mosaic = rawTokens.some((raw) => TILE_SIZES[raw.trim().split(/\s+/)[0]]?.mosaic);
  const pressColumns = mosaic ? 30 : 20;
  const columns = (m) => (m === 'press' ? pressColumns : 12);
  const tiles = rawTokens.map((raw, index) => {
    const [name, flag, extra] = raw.trim().split(/\s+/);
    const token = name || 'sq-small';
    const size = TILE_SIZES[token] && mosaic && TILE_SIZES[token].mode === 'press'
      ? { ...TILE_SIZES[token], span: MOSAIC_SPANS[token] } : TILE_SIZES[token];
    if (!size || (flag && flag !== 'end') || extra) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: invalid size token "${raw}"`);
    }
    if (!size.span) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: "${token}" cannot share a mosaic with thirds or banners`);
    }
    if (pressPage && size.mode !== 'press') {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: re-import press-kit tiles with shape-3 size tokens`);
    }
    if (mode && size.mode !== mode) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: cannot mix series and press-kit sizes`);
    }
    mode = size.mode;
    if (filled + size.span > columns(mode)) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: tile overfills its source row`);
    }
    const tile = { token, rowStart };
    filled += size.span;
    rowStart = false;
    if (flag === 'end' || filled === columns(mode)) {
      filled = 0;
      rowStart = true;
    }
    return tile;
  });
  if (!tiles.length) throw new TileLayoutError('Cards tiles: at least one authored tile is required');
  if (filled) throw new TileLayoutError('Cards tiles: last row is incomplete; mark its final tile "end"');
  return { tiles, mode, columns: columns(mode) };
}
