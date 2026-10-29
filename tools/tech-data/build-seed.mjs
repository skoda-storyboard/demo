#!/usr/bin/env node
/*
 * Builds tools/tech-data/tech-data.seed.json, the first content of the DA sheet
 * /data/tech-data.json
 * (SKODA-852). Every figure was read off an official source and checked by hand; nothing is
 * inferred. Each row records its source, date, confidence and limitations.
 *
 *   node tools/tech-data/build-seed.mjs [out.json]
 *
 * Confidence:
 * - "official TD PDF": the model's technical-data PDF, the per-version figure as printed.
 * - "derived from TD PDF": the min–max of the versions a model page covers (what its grid shows).
 * - "official story" / "official press release": an official Škoda Storyboard text, used only
 *   where the TD PDF has no such figure.
 *
 * Only the Peaq has the extended fields (battery, charging power, boot by configuration, towing,
 * seats, display, CO2) and records. The other models carry the Technical Data grid fields.
 */
/* eslint-disable no-console */
import fs from 'node:fs';

const DAM = 'https://publish-p220607-e2281243.adobeaemcloud.com/content/dam/storyboard/en/skoda-model';
const STORYBOARD = 'https://www.skoda-storyboard.com/en';
const UNITS = {
  power: 'kW',
  torque: 'Nm',
  topSpeed: 'km/h',
  acceleration: 's',
  boot: 'l',
  bootThirdRow: 'l',
  bootFolded: 'l',
  dcCharging: 'min',
  dcChargingPower: 'kW',
  acChargingPower: 'kW',
  batteryGross: 'kWh',
  batteryNet: 'kWh',
  range: 'km',
  consumption: 'kWh/100 km',
  co2: 'g/km',
  towing: 'kg',
  seats: 'seats',
  seatRows: 'rows',
  display: 'inch',
};
const TD = 'official TD PDF';
const DERIVED = 'derived from TD PDF';
const PEAQ_DISPLAY = {
  source: `${STORYBOARD}/emobility/meet-the-peaq-intuitive-and-comfortable-controls/`,
  sourceDate: '15. 10. 2026',
  confidence: 'official story',
  limitations: 'Not in the TD PDF. The story says "the 13.6-inch portrait-oriented screen".',
};
const PEAQ_RECORD = {
  source: `${STORYBOARD}/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs/`,
  sourceDate: '2. 9. 2026',
  confidence: 'official press release',
};

const MODELS = [
  {
    code: 'peaq',
    tags: 'peaq',
    excludeTags: '',
    name: 'Peaq',
    pages: ['/en/skoda-model/peaq',
      '/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs',
      '/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging'],
    pdf: `${DAM}/peaq/TD-Peaq-en_8fa4f649.pdf`,
    pdfDate: '21. 9. 2026',
    limitations: 'The TD PDF does not apply to Sportline cars.',
    page: {
      power: '150 – 220',
      dcCharging: '27 – 28',
      topSpeed: '160 – 180',
      acceleration: { value: '6.7 – 8.4', note: '5-seater; 7-seater 6.8 – 8.5 s' },
      boot: { value: '935', configuration: '5-seater', note: 'Up to the rear shelf; 7-seater 890 l' },
      range: '459 – 647',
      consumption: '14.7 – 15.8',
      batteryGross: '63 – 91',
      batteryNet: '59 – 86',
      dcChargingPower: { value: '160 – 199', limitations: 'The PDF gives 160 kW (63 kWh battery) and 199 kW (91 kWh battery).' },
      acChargingPower: { value: '11', limitations: 'AC 0–100 %: 11 kW, 6 h 30 min (60) or 9 h (90, 90x).' },
      bootFolded: { value: '2150', configuration: '5-seater', note: 'Rear seatback folded; 7-seater 2075 l' },
      towing: {
        value: '1800 – 2000',
        limitations: 'Braked, 12 % gradient. The PDF prints 1800 and 2000 kg for the three versions without saying which version has which.',
      },
      seats: { value: '5 – 7', note: '5 seater, 7 seater optional' },
      seatRows: { value: '2 – 3', note: 'Third row with the 7-seater' },
      display: { value: '13.6', ...PEAQ_DISPLAY },
      co2: '0',
    },
    versions: {
      60: {
        power: '150',
        range: '459',
        consumption: '14.7',
        acceleration: { value: '8.4', note: '5-seater; 7-seater 8.5 s' },
        batteryGross: '63',
        batteryNet: '59',
        dcChargingPower: { value: '160', limitations: 'The PDF prints one column per battery size; 63 kWh is the 60, 91 kWh the 90 and 90x (the record release confirms the Peaq 90 has 91 kWh).' },
        dcCharging: { value: '27', limitations: 'The PDF prints one column per battery size; 63 kWh is the 60, 91 kWh the 90 and 90x (the record release confirms the Peaq 90 has 91 kWh).' },
      },
      90: {
        power: '210',
        range: '647',
        consumption: '15.0',
        acceleration: '7.1',
        batteryGross: '91',
        batteryNet: '86',
        dcChargingPower: { value: '199', limitations: 'The PDF prints one column per battery size; 63 kWh is the 60, 91 kWh the 90 and 90x (the record release confirms the Peaq 90 has 91 kWh).' },
        dcCharging: { value: '28', limitations: 'The PDF prints one column per battery size; 63 kWh is the 60, 91 kWh the 90 and 90x (the record release confirms the Peaq 90 has 91 kWh).' },
      },
      '90x': {
        power: '220',
        range: '613',
        consumption: '15.8',
        acceleration: { value: '6.7', note: '5-seater; 7-seater 6.8 s' },
        batteryGross: '91',
        batteryNet: '86',
        dcChargingPower: { value: '199', limitations: 'The PDF prints one column per battery size; 63 kWh is the 60, 91 kWh the 90 and 90x (the record release confirms the Peaq 90 has 91 kWh).' },
        dcCharging: { value: '28', limitations: 'The PDF prints one column per battery size; 63 kWh is the 60, 91 kWh the 90 and 90x (the record release confirms the Peaq 90 has 91 kWh).' },
      },
    },
    configurations: {
      '7seat': {
        label: '7-seater',
        fields: {
          boot: { value: '890', note: 'Up to the rear shelf, third row folded' },
          bootThirdRow: { value: '299', note: 'Behind the third row, up to the headrests' },
          bootFolded: { value: '2075', note: 'Second and third row folded' },
        },
      },
    },
    records: [
      {
        version: '90',
        configuration: '7-seater',
        field: 'range',
        value: '936',
        conditions: 'Record drive, Mladá Boleslav to Zandvoort, 25–26 Aug 2026, no recharging, supervised by TÜV SÜD; production Peaq 90, 19-inch wheels. Not a WLTP figure (WLTP up to 647 km).',
        ...PEAQ_RECORD,
      },
      {
        version: '90',
        configuration: '7-seater',
        field: 'consumption',
        value: '9.2',
        conditions: 'Average on the same record drive. Not a WLTP figure (WLTP 15.0 kWh/100 km).',
        ...PEAQ_RECORD,
      },
    ],
  },
  {
    code: 'elroq',
    tags: 'elroq',
    excludeTags: 'rs, sportline',
    name: 'Elroq',
    pages: ['/en/skoda-model/elroq'],
    pdf: `${DAM}/elroq/TD-Elroq-en_new_7a3c9a44.pdf`,
    pdfDate: '23. 4. 2026',
    note: 'Elroq 60, 85 and 85x (the RS has its own page)',
    limitations: 'The TD PDF does not apply to Sportline cars.',
    page: {
      power: '140 – 220',
      dcCharging: '26 – 29',
      topSpeed: '160 – 180',
      acceleration: '6.2 – 8.5',
      boot: '470',
      range: '408 – 577',
      consumption: '15.1 – 17.2',
    },
    versions: {
      60: {
        power: '140', range: '408 – 453', consumption: '15.1 – 16.8', acceleration: '8.5',
      },
      85: {
        power: '210', range: '524 – 577', consumption: '15.3 – 17.1', acceleration: '6.6',
      },
      '85x': {
        power: '220', range: '524 – 577', consumption: '15.5 – 17.2', acceleration: '6.2',
      },
    },
  },
  {
    code: 'elroq-rs',
    tags: 'elroq, rs',
    excludeTags: '',
    name: 'Elroq RS',
    pages: ['/en/skoda-model/elroq/elroq-rs'],
    pdf: `${DAM}/elroq/TD-Elroq-en_new_7a3c9a44.pdf`,
    pdfDate: '23. 4. 2026',
    page: {
      // no dcCharging or topSpeed: the PDF prints them in fewer columns than versions, without
      // saying which belongs to the RS, so a value here would be a guess
      power: '250', acceleration: '5.4', boot: '470', range: '516 – 554', consumption: '16.2 – 17.5',
    },
  },
  {
    code: 'enyaq',
    tags: 'enyaq',
    excludeTags: 'rs, sportline, coupe-en',
    name: 'Enyaq',
    pages: ['/en/skoda-model/enyaq-iv-2'],
    pdf: 'https://cdn.skoda-storyboard.com/2025/06/TD-Enyaq-en_new_db50ac09.pdf',
    pdfDate: '23. 4. 2026',
    note: 'Enyaq 60, 85 and 85x (the RS has its own page)',
    limitations: 'The TD PDF does not apply to Sportline cars. The PDF prints the Enyaq 85 consumption as "15.1-6.3", so no 85 consumption row.',
    page: {
      power: '140 – 220',
      dcCharging: '26 – 29',
      topSpeed: '160 – 180',
      acceleration: '6.3 – 8.6',
      boot: '585',
      range: '428 – 584',
    },
    versions: {
      60: { power: '140', range: '428 – 456', acceleration: '8.6' },
      85: { power: '210', range: '547 – 584', acceleration: '6.6' },
      '85x': { power: '220', range: '547 – 584', acceleration: '6.3' },
    },
  },
  {
    code: 'enyaq-rs',
    tags: 'enyaq, rs',
    excludeTags: '',
    name: 'Enyaq RS',
    pages: ['/en/skoda-model/enyaq-iv-2/enyaq-rs'],
    pdf: 'https://cdn.skoda-storyboard.com/2025/06/TD-Enyaq-en_new_db50ac09.pdf',
    pdfDate: '23. 4. 2026',
    page: {
      // no dcCharging or topSpeed (see Elroq RS)
      power: '250', acceleration: '5.4', boot: '585', range: '513 – 565', consumption: '15.9 – 17.6',
    },
  },
  {
    code: 'enyaq-coupe',
    tags: 'enyaq, coupe-en',
    excludeTags: 'rs, sportline',
    name: 'Enyaq Coupé',
    pages: ['/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv'],
    pdf: `${DAM}/enyaq-iv-2/enyaq-coupe-iv/TD-Enyaq-Coupe-en_new_44e9640d.pdf`,
    pdfDate: '23. 4. 2026',
    note: 'Enyaq Coupé 60, 85 and 85x: the page\'s power row stops at 220 kW, so the RS is not included',
    limitations: 'The TD PDF does not apply to Sportline cars.',
    page: {
      power: '140 – 220',
      dcCharging: '26 – 29',
      topSpeed: '160 – 180',
      acceleration: '6.3 – 8.6',
      boot: '570',
      range: '439 – 593',
      consumption: '14.7 – 16.0',
    },
    versions: {
      60: {
        power: '140', range: '439 – 463', consumption: '14.7 – 15.6', acceleration: '8.6',
      },
      85: {
        power: '210', range: '561 – 593', consumption: '14.8 – 15.8', acceleration: '6.6',
      },
      '85x': {
        power: '220', range: '561 – 593', consumption: '15.0 – 16.0', acceleration: '6.3',
      },
      RS: {
        power: '250', range: '528 – 572', consumption: '15.6 – 17.1', acceleration: '5.4',
      },
    },
  },
  {
    code: 'epiq',
    tags: 'epiq',
    excludeTags: '',
    name: 'Epiq',
    pages: ['/en/skoda-model/epiq'],
    pdf: `${DAM}/epiq/TD-Epiq-en_9ab9372d.pdf`,
    pdfDate: '14. 9. 2026',
    note: 'Epiq 35 and 40 values are preliminary in the PDF',
    limitations: 'Epiq 35 and 40 values are marked preliminary in the PDF.',
    page: {
      power: '85 – 155',
      dcCharging: '23 – 33',
      topSpeed: '160',
      acceleration: '7.1 – 11.0',
      boot: '475',
      range: '310 – 441',
      consumption: '13.0 – 13.7',
    },
    versions: {
      35: {
        power: '85', range: '310', consumption: '13.0', acceleration: '11.0',
      },
      40: {
        power: '99', range: '310', consumption: '13.0', acceleration: '9.8',
      },
      55: {
        power: '155', range: '441', consumption: '13.7', acceleration: '7.1',
      },
    },
  },
];

const slug = (s) => String(s).toLowerCase();
const specOf = (spec) => (typeof spec === 'string' ? { value: spec } : spec);
const join = (...parts) => parts.filter(Boolean).join(' ');

const rows = [];
const records = [];
MODELS.forEach((m) => {
  const push = (key, { label, version = '', configuration = '' }, field, spec, confidence) => {
    const s = specOf(spec);
    rows.push({
      key,
      model: m.code,
      version,
      configuration: s.configuration ?? configuration,
      field,
      value: s.value,
      unit: UNITS[field],
      label,
      source: s.source ?? m.pdf,
      sourceDate: s.sourceDate ?? m.pdfDate,
      confidence: s.confidence ?? confidence,
      limitations: join(s.limitations, m.limitations),
      note: join(version || configuration ? '' : m.note, s.note),
    });
  };
  Object.entries(m.page).forEach(([field, spec]) => push(`${m.code}.${field}`, { label: m.name }, field, spec, DERIVED));
  Object.entries(m.versions || {}).forEach(([version, fields]) => {
    Object.entries(fields).forEach(([field, spec]) => push(
      `${m.code}-${slug(version)}.${field}`,
      { label: `${m.name} ${version}`, version },
      field,
      spec,
      TD,
    ));
  });
  Object.entries(m.configurations || {}).forEach(([code, { label, fields }]) => {
    Object.entries(fields).forEach(([field, spec]) => push(
      `${m.code}-${code}.${field}`,
      { label: `${m.name} ${label}`, configuration: label },
      field,
      spec,
      TD,
    ));
  });
  (m.records || []).forEach((r) => records.push({
    model: m.code,
    version: r.version,
    configuration: r.configuration,
    field: r.field,
    value: r.value,
    unit: UNITS[r.field],
    label: `${m.name} ${r.version} record drive`,
    conditions: r.conditions,
    source: r.source,
    sourceDate: r.sourceDate,
    confidence: r.confidence,
  }));
});

const models = MODELS.map((m) => ({
  code: m.code,
  name: m.name,
  pages: m.pages.join(', '),
  tags: m.tags,
  excludeTags: m.excludeTags,
  pdf: m.pdf,
  pdfDate: m.pdfDate,
}));
const sheet = (data) => ({
  total: data.length, offset: 0, limit: data.length, data,
});
const json = {
  values: sheet(rows),
  models: sheet(models),
  records: sheet(records),
  ':version': 3,
  ':names': ['values', 'models', 'records'],
  ':type': 'multi-sheet',
};
const out = process.argv[2] || new URL('./tech-data.seed.json', import.meta.url).pathname;
fs.writeFileSync(out, `${JSON.stringify(json, null, 2)}\n`);
console.log('values', rows.length, 'models', models.length, 'records', records.length);
