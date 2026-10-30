import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkClaims, extractClaims, scopeOf } from './claims.js';
import { runChecks } from './checks.js';
import { readSheet } from './tech-data.js';

const sheet = readSheet(JSON.parse(fs.readFileSync(new URL('./tech-data.seed.json', import.meta.url), 'utf8')));
const peaq = sheet.models.filter((m) => m.code === 'peaq');
const check = (text, models = peaq) => checkClaims([{ text }], sheet, models);
const one = (text, models) => {
  const results = check(text, models);
  assert.equal(results.length, 1, `one claim in: ${text} (got ${results.map((r) => r.claim.text).join(', ')})`);
  return results[0];
};
const byText = (results) => Object.fromEntries(results.map((r) => [r.claim.text, r]));

// the target Canvas article (/en/skoda-world/peaq-family-weekend-getaway-on-one-charge), as written
const ARTICLE = [
  'With a range of up to 936 km on a single charge, a weekend escape to the countryside has never been so effortless – or so spacious.',
  'Their destination: a remote riverside cottage in South Bohemia, 280 kilometres away.',
  'The Peaq is Škoda\'s largest and most capable all-electric SUV yet, built on the MEB+ platform and available in up to seven-seat configuration.',
  'With a 91 kWh (net 86 kWh) battery and a combined WLTP range of up to 608 kilometres, it was purpose-built for exactly this kind of trip.',
  'The lounge-like interior offers three rows of seats, with ample legroom across all of them.',
  'The 765-litre boot – expandable to 1,690 litres with the rear seats folded – swallowed the family\'s weekend bags, a folding pram and a crate of board games without complaint.',
  'The 32-inch vertical infotainment display, positioned like a picture frame in the centre of the dashboard, gave the driver effortless access to navigation.',
  'By the time the family arrived at the cottage, the battery was at 54 percent – more than enough to head out for day trips.',
  'For those planning longer adventures, the Peaq supports DC rapid charging at up to 200 kW, allowing a 10–80 percent top-up in around 28 minutes.',
  'At home, the optional 22 kW AC on-board charger means overnight charging from a wallbox is all most families will ever need.',
  'A retractable tow bar supports up to 2,500 kg, so the caravan, horsebox or boat trailer comes too.',
  'The Peaq is available in six trim levels, from the entry-level Selection through to the range-topping Lounge.',
  'Škoda Peaq: Power consumption combined: 14.8 – 18.6 kWh/100 km, CO₂ emissions combined: 0 g/km.',
];

test('the target article: every technical claim is classified, none passes silently', () => {
  const results = byText(ARTICLE.flatMap((text) => check(text)));
  const expected = {
    '936 km': ['issue', 'range'],
    'MEB+ platform': ['review', 'platform'],
    'seven-seat': ['ok', 'seats'],
    '91 kWh': ['ok', 'batteryGross'],
    '86 kWh': ['ok', 'batteryNet'],
    '608 kilometres': ['issue', 'range'],
    'three rows of seats': ['ok', 'seatRows'],
    '765-litre': ['issue', 'boot'],
    '1,690 litres': ['issue', 'bootFolded'],
    '32-inch': ['issue', 'display'],
    '200 kW': ['issue', 'dcChargingPower'],
    '28 minutes': ['ok', 'dcCharging'],
    '22 kW': ['issue', 'acChargingPower'],
    '2,500 kg': ['issue', 'towing'],
    'six trim levels': ['review', 'trims'],
    '14.8 – 18.6 kWh/100 km': ['issue', 'consumption'],
    '0 g/km': ['ok', 'co2'],
  };
  assert.deepEqual(Object.keys(results).sort(), Object.keys(expected).sort(), 'no distance, percentage or SoC window read as a claim');
  Object.entries(expected).forEach(([text, [status, field]]) => {
    assert.equal(results[text].status, status, `${text}: ${results[text].message}`);
    assert.equal(results[text].claim.field, field, text);
  });
  assert.match(results['936 km'].message, /official Peaq 60: 459 km; Peaq 90: 647 km; Peaq 90x: 613 km.*936 km is the Peaq 90 record drive \(2\. 9\. 2026\), a measured result/);
  assert.match(results['765-litre'].message, /Peaq: 935 l; Peaq 7-seater: 890 l/);
  assert.match(results['32-inch'].message, /13\.6 inch/);
  assert.match(results['six trim levels'].message, /no reference data for the Peaq/);
});

test('hyphenated and thousands-separated units parse: 765-litre, 32-inch, 210-kW, 91-kWh, 1,690 litres, 2 tonnes', () => {
  const units = (s) => extractClaims(s).map((c) => [c.numbers.join('–'), c.unit]);
  assert.deepEqual(units('a 91-kWh battery (86 kWh net) and a 210-kW electric motor'), [['91', 'kWh'], ['86', 'kWh'], ['210', 'kW']]);
  assert.deepEqual(units('The 765-litre boot grows to 1,690 litres'), [['765', 'l'], ['1690', 'l']]);
  assert.deepEqual(units('a towing capacity of up to 2 tonnes'), [['2000', 'kg']]);
  assert.equal(one('The 13.6-inch infotainment display').status, 'ok');
});

test('charging power is not motor power: DC "up to 220 kW" fails although the motor has 220 kW', () => {
  assert.equal(one('The Peaq charges at up to 220 kW at a DC rapid charger.').status, 'issue');
  assert.equal(one('The all-wheel-drive version delivers a power output of 220 kW.').status, 'ok');
  assert.equal(one('Its 22 kW on-board charger is optional.').claim.field, 'acChargingPower');
  const unknown = one('The battery charges with 150 kW.');
  assert.equal(unknown.claim.field, 'chargingPower', 'charging, but neither DC nor AC: compared with both');
  assert.equal(unknown.status, 'issue');
});

test('936 km: the actual record passes, the same number advertised as range fails', () => {
  const record = one('The series-production Škoda Peaq covered 936 kilometres without recharging.');
  assert.equal(record.status, 'ok');
  assert.equal(record.reason, 'record');
  const advertised = one('The Peaq has a range of up to 936 km on a single charge.');
  assert.equal(advertised.status, 'issue');
  assert.equal(advertised.claim.measured, false);
});

test('"trip" or "record" elsewhere in the sentence never turns a capability claim into a measurement', () => {
  ['Perfect for any road trip, the Peaq offers a range of up to 936 km.',
    'After its record drive, the Peaq can now promise a range of 936 km on a single charge.',
    'Built for the journey: a WLTP range of 936 km.',
  ].forEach((text) => {
    const r = one(text);
    assert.equal(r.claim.measured, false, text);
    assert.equal(r.status, 'issue', text);
  });
});

test('a measured result that is not in the records needs review; a difference is not a claim', () => {
  const r = one('On their drive to the coast, the Peaq covered 950 km without recharging.');
  assert.equal(r.status, 'review');
  assert.equal(r.reason, 'measured');
  const diff = check('The seven-seater Peaq\'s record range of 936 km exceeded this figure by 289 km, or almost 45%.');
  assert.deepEqual(diff.map((x) => [x.claim.text, x.status]), [['seven-seater', 'ok'], ['936 km', 'ok']]);
});

test('variants are not mixed: the Peaq 60 is not allowed the Peaq 90\'s 647 km', () => {
  assert.equal(one('The Peaq 60 has a WLTP range of up to 647 km.').status, 'issue');
  assert.equal(one('The Peaq 60 has a WLTP range of up to 459 km.').status, 'ok');
  assert.equal(one('The 90 variant has a WLTP range of up to 647 km.').status, 'ok');
  assert.equal(scopeOf('The all-wheel-drive version, designated 90x, delivers 220 kW.', sheet, peaq).version, '90x');
});

test('models are not mixed: a named model is checked against its own rows; two models need review', () => {
  // on a Peaq page, the Epiq's figure is checked against the Epiq, never "passes" as a Peaq figure
  assert.equal(one('The Peaq has a WLTP range of up to 441 km.').status, 'issue');
  assert.equal(one('The Epiq has a WLTP range of up to 441 km.').status, 'ok');
  assert.equal(one('The Peaq and the Epiq offer a WLTP range of up to 441 km.').reason, 'ambiguous');
  assert.equal(one('A WLTP range of up to 441 km.', []).reason, 'no-model');
});

test('uncheckable claims need review, never pass: Sportline, no reference row, other units', () => {
  assert.equal(one('The Peaq Sportline has a WLTP range of up to 647 km.').reason, 'sportline');
  assert.equal(one('It rides on 19-inch wheels.').reason, 'no-reference');
  assert.equal(one('The Sonos system has an output of 755 W.').reason, 'no-reference');
  assert.equal(one('The Elroq has a 470 kWh battery.').status, 'review', 'Elroq has no battery rows yet');
});

test('not vehicle claims: distances, percentages, the 0–100 km/h phrase, URLs', () => {
  ['a remote riverside cottage, 280 kilometres away.',
    '750 kilometers behind us, 170 to go.',
    'the battery was at 54 percent, a 10–80 percent top-up',
    'https://example.com/episodes/19741036-936-km-without-recharging',
  ].forEach((text) => assert.deepEqual(extractClaims(text), [], text));
  const accel = extractClaims('Acceleration 0 – 100 km/h takes 6.7 s.');
  assert.deepEqual(accel.map((c) => c.field), ['acceleration']);
});

test('rounded and approximate claims: "more than 640 km" is a review, "around 28 minutes" passes', () => {
  assert.equal(one('The 90 variant has a maximum driving range of more than 640 km.').reason, 'rounded');
  assert.equal(one('A 10–80 % DC top-up takes around 28 minutes.').status, 'ok');
});

test('the record release and record story: true figures all pass; the only review is the wheels', () => {
  const sentences = [
    'Škoda Peaq sets a range record for seven-seater electric SUVs, covering 936 km on a single charge',
    'Škoda’s flagship travelled from Mladá Boleslav to the Netherlands without recharging, averaging just 9.2 kWh/100 km',
    'How far could the new electric seven-seater Škoda Peaq travel on a single charge of its 91 kWh battery?',
    'The Škoda Peaq 90 has a homologated WLTP range of up to 647 km, based on the full range of driving conditions prescribed by legislation.',
    'The drive was completed in a production Škoda Peaq 90 equipped with a 91 kWh traction battery (86 kWh net), an output of 210 kW, rear-wheel drive and 19-inch wheels fitted with standard low-rolling-resistance tyres.',
    'Reaching Amsterdam, approximately 850 kilometres away, would already have been considered a major success.',
    'They had covered 936 kilometres and recorded an energy consumption figure of just 9.2 kWh/100 km.',
  ];
  const results = sentences.flatMap((text) => check(text));
  assert.deepEqual(results.filter((r) => r.status === 'issue').map((r) => r.message), []);
  assert.deepEqual(results.filter((r) => r.status === 'review').map((r) => r.claim.text), ['19-inch']);
  // "They had covered 936 kilometres" has no range words in its clause: a distance, not a claim
  assert.equal(results.filter((r) => r.reason === 'record').length, 3);
});

test('model names with accents are found: "Enyaq Coupé" is the Coupé, not the Enyaq SUV', () => {
  const scope = scopeOf('The Enyaq Coupé offers a 195 kW version.', sheet, []);
  assert.deepEqual(scope.models.map((m) => m.code), ['enyaq-coupe']);
  assert.match(one('The Enyaq Coupé delivers a power output of 195 kW.', []).message, /Enyaq Coupé 60: 140 kW/);
});

test('a sentence about another variant (Coupé, RS) needs review, it isn\'t judged on this page\'s figures', () => {
  const enyaqRs = sheet.models.filter((m) => m.code === 'enyaq-rs');
  const coupe = check('The SUV variant offers 585 litres of luggage space, while the Coupé version offers 570 litres.', enyaqRs);
  assert.deepEqual(coupe.map((r) => r.reason), ['variant', 'variant']);
  const enyaq = sheet.models.filter((m) => m.code === 'enyaq');
  assert.equal(one('The RS delivers a power output of 250 kW.', enyaq).reason, 'variant');
  assert.equal(one('The Enyaq RS delivers a power output of 250 kW.', enyaq).status, 'ok', 'the RS named in full is the RS');
});

test('a storage compartment is not the boot; "MEB+ electric platform" is a platform claim', () => {
  assert.equal(one('A 25-litre storage compartment under the seat.').claim.field, 'other');
  assert.equal(one('The Epiq is built on the new MEB+ electric platform.', []).claim.field, 'platform');
});

test('a single figure inside a model-level min–max with no per-version row needs review, not an Issue', () => {
  const elroq = sheet.models.filter((m) => m.code === 'elroq');
  const r = one('The Elroq 85 charges from 10 to 80% in 28 minutes.', elroq);
  assert.equal(r.status, 'review');
  assert.equal(r.reason, 'within');
  assert.equal(one('The Elroq 85 charges from 10 to 80% in 35 minutes.', elroq).status, 'issue');
  // with per-version rows (power: 140 / 210 / 220 / 250 kW), a figure inside the min–max is wrong
  const coupe = sheet.models.filter((m) => m.code === 'enyaq-coupe');
  assert.equal(one('The Enyaq Coupé delivers a power output of 150 kW.', coupe).status, 'issue');
});

test('the check reads the metadata Description as text, with its source named', () => {
  const html = '<main><div><p>Family time.</p></div><div class="metadata"><div><div><p>Description</p></div><div><p>With a range of up to 936 km on a single charge.</p></div></div><div><div><p>model</p></div><div><p>peaq</p></div></div></div></main>';
  const claims = runChecks({ html, path: '/drafts/x', sheet }).find((r) => r.id === 'claims');
  assert.equal(claims.status, 'fail');
  assert.match(claims.details[0], /in Description: "With a range of up to 936 km/);
});

// --- review round 3: units, configurations, digit counts, compartments ---

test('units must match: an EV consumption in l/100 km, or a record in another unit, never passes', () => {
  const r = one('The Peaq consumes 15.0 l/100 km.');
  assert.notEqual(r.status, 'ok', r.message);
  assert.equal(r.reason, 'unit');
  const record = one('On its record drive the Peaq 90 averaged 9.2 l/100 km.');
  assert.notEqual(record.reason, 'record', record.message);
  assert.notEqual(record.status, 'ok');
});

test('configurations are scoped: a seven-seater is not allowed the five-seater boot, and back', () => {
  // the seat count is itself a (correct) seats claim; the boot claim is the one under test
  const boot = (text) => check(text).find((r) => r.claim.field === 'boot');
  assert.equal(boot('The seven-seater Peaq has a 935-litre boot.').status, 'issue');
  assert.equal(boot('The five-seater Peaq has a 890-litre boot.').status, 'issue');
  assert.equal(boot('The five-seater Peaq has a 935-litre boot.').status, 'ok');
  assert.equal(boot('The 7-seat Peaq has a 890-litre boot.').status, 'ok');
  // a configuration-only figure with no configuration named: say which, don't accept it
  const unnamed = one('The Peaq has a 890-litre boot.');
  assert.equal(unnamed.status, 'review');
  assert.equal(unnamed.reason, 'configuration');
  // range and other unconfigured rows are unaffected by the seat count
  assert.equal(check('The seven-seater Peaq 90 has a WLTP range of up to 647 km.').find((r) => r.claim.field === 'range').status, 'ok');
});

test('digit counts read like words: "6 trim levels" needs review, "3 rows of seats" is checked', () => {
  assert.equal(one('The Peaq comes in 6 trim levels.').reason, 'no-reference');
  assert.equal(one('The Peaq has 3 rows of seats.').status, 'ok');
  assert.equal(one('The Peaq has 4 rows of seats.').status, 'issue');
});

test('a storage compartment is never read as the whole boot, even next to the word boot', () => {
  const r = one('The 25-litre storage compartment beneath the boot floor.', sheet.models.filter((m) => m.code === 'epiq'));
  assert.equal(r.claim.field, 'other');
  assert.equal(r.status, 'review');
  // the Elroq page: a "luggage compartment" is the boot, and its official 470 l passes
  const elroq = sheet.models.filter((m) => m.code === 'elroq');
  const luggage = one('The 470-litre luggage compartment incorporates several Simply Clever features.', elroq);
  assert.equal(luggage.claim.field, 'boot');
  assert.equal(luggage.status, 'ok');
});
