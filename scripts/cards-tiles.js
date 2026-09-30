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
};

export class TileLayoutError extends Error {}

export function layoutTileRows(rawTokens, { pressPage = false } = {}) {
  let mode;
  let filled = 0;
  let rowStart = true;
  const tiles = rawTokens.map((raw, index) => {
    const [name, flag, extra] = raw.trim().split(/\s+/);
    const token = name || 'sq-small';
    const size = TILE_SIZES[token];
    if (!size || (flag && flag !== 'end') || extra) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: invalid size token "${raw}"`);
    }
    if (pressPage && size.mode !== 'press') {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: re-import press-kit tiles with shape-3 size tokens`);
    }
    if (mode && size.mode !== mode) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: cannot mix series and press-kit sizes`);
    }
    mode = size.mode;
    if (filled + size.span > (mode === 'press' ? 20 : 12)) {
      throw new TileLayoutError(`Cards tiles row ${index + 1}: tile overfills its source row`);
    }
    const tile = { token, rowStart };
    filled += size.span;
    rowStart = false;
    if (flag === 'end' || filled === (mode === 'press' ? 20 : 12)) {
      filled = 0;
      rowStart = true;
    }
    return tile;
  });
  if (!tiles.length) throw new TileLayoutError('Cards tiles: at least one authored tile is required');
  if (filled) throw new TileLayoutError('Cards tiles: last row is incomplete; mark its final tile "end"');
  return { tiles, mode };
}
