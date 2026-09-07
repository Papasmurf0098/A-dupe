import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { normalizeCatalog, normalizeText, enrichEntry, filterCatalog, sortCatalog, getRelated, deriveFacets } from '../js/catalog.js';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const payload = JSON.parse(read('data/drinks.json'));
const food = JSON.parse(read('data/food.json'));
const entries = normalizeCatalog(payload);
const base = { query: '', family: 'All', category: 'All', confidence: 'All', scope: 'all', favorites: new Set(), recent: [], dish: '', flavor: '', menu: '' };
const find = (id) => entries.find((entry) => entry.id === id);

test('catalog copies match and duplicate keeps a legacy route', () => {
  assert.equal(read('data/drinks.json'), read('drinks.json'));
  assert.equal(payload.entries.length, 353);
  assert.equal(entries.length, 352);
  assert.equal(new Set(payload.entries.map((entry) => entry.id)).size, 353);
  const duplicate = payload.entries.find((entry) => entry.duplicateOf);
  assert.ok(find(duplicate.duplicateOf).legacyIds.includes(duplicate.id));
  assert.ok(!find(duplicate.id));
});

test('every record has scoped evidence, a review date and a strength qualification', () => {
  for (const entry of payload.entries) {
    assert.equal(entry.research.reviewedAt, '2026-09-06', entry.id);
    assert.ok(entry.research.tastingBasis, entry.id);
    assert.ok(entry.research.sources.length, entry.id);
    assert.ok(entry.strength.confirmation, entry.id);
    assert.ok(['listed', 'not-found'].includes(entry.menu.status), entry.id);
    for (const source of entry.research.sources) {
      assert.equal(new URL(source.url).protocol, 'https:', entry.id);
      for (const field of ['title', 'supports', 'type', 'accessed']) assert.ok(source[field], `${entry.id}: ${field}`);
    }
  }
});

test('pairings resolve to real menu records and uncertain identities stay unpaired', () => {
  const dishes = new Map(food.dishes.map((dish) => [dish.id, dish]));
  assert.equal(dishes.size, 36);
  let count = 0;
  for (const entry of entries) {
    assert.ok(entry.pairingReview.basis.includes('not restaurant endorsements'), entry.id);
    const pairs = entry.pairings.restaurant;
    if (!pairs.length) assert.ok(entry.pairingReview.note, entry.id);
    for (const pair of pairs) {
      assert.equal(pair.name, dishes.get(pair.dishId)?.name, entry.id);
      assert.ok(pair.reason.length > 20, entry.id);
      assert.equal(pair.sourceUrl, food.sourceUrl, entry.id);
      count++;
    }
  }
  assert.equal(count, 682);
  assert.equal(entries.filter((entry) => !entry._hasPairings).length, 11);
});

test('flavor inference does not turn pineapple into pine or disclaimer text into smoke', () => {
  const tropical = enrichEntry({ tasting: { aroma: ['pineapple'], flavor: ['butterscotch'], finish: 'No smoke claim is made.' } });
  assert.ok(tropical._flavors.includes('Fruit'));
  assert.ok(!tropical._flavors.includes('Herbal'));
  assert.ok(!tropical._flavors.includes('Creamy'));
  assert.ok(!tropical._flavors.includes('Smoke'));
  assert.ok(!find('voodoo-child')._flavors.includes('Smoke'));
});

test('ingredient-led drinks and unspecified wine vintages do not invent numeric ABV', () => {
  for (const entry of entries.filter((item) => ['Cocktail', 'Wine'].includes(item.family))) {
    assert.equal(entry.strength.abv, undefined, entry.id);
    assert.equal(entry.strength.proof, undefined, entry.id);
  }
  assert.equal(find('heaven-hill-heritage-collection-20-year-bourbon').subtype, 'Kentucky straight corn whiskey');
  assert.equal(find('buffalo-trace-rye-expression').strength.confirmation, 'label-required');
});

test('accent and punctuation search, dish filters and combined flavor filters work', () => {
  assert.equal(normalizeText('Crème & Blanton’s'), 'creme and blantons');
  assert.ok(filterCatalog(entries, { ...base, query: 'creme de menthe' }).some((entry) => entry.id === 'grasshopper'));
  for (const dish of food.dishes) {
    const matches = filterCatalog(entries, { ...base, dish: dish.id });
    assert.ok(matches.length, dish.id);
    assert.ok(matches.every((entry) => entry.pairings.restaurant.some((pair) => pair.dishId === dish.id)));
  }
  const citrus = filterCatalog(entries, { ...base, family: 'Cocktail', flavor: 'Citrus', menu: 'listed' });
  assert.ok(citrus.length > 0);
  assert.ok(citrus.every((entry) => entry.family === 'Cocktail' && entry._flavors.includes('Citrus') && entry.menu.status === 'listed'));
});

test('saved/recent scopes and sorting preserve the input catalog', () => {
  const id = entries[0].id;
  assert.equal(filterCatalog(entries, { ...base, scope: 'favorites', favorites: new Set([id]) })[0].id, id);
  assert.equal(filterCatalog(entries, { ...base, scope: 'recent', recent: [id] }).length, 1);
  const before = entries.map((entry) => entry.id);
  const sorted = sortCatalog(entries, 'name');
  assert.notEqual(sorted, entries);
  assert.deepEqual(entries.map((entry) => entry.id), before);
  assert.equal(deriveFacets(entries).familyCounts.All, 352);
  const related = getRelated(entries, entries[0]);
  assert.ok(related.length > 0 && related.length <= 6);
  assert.ok(related.every((entry) => entry.id !== id));
});

test('static app assets, accessible modal hooks and ingredient rendering are present', () => {
  for (const path of ['assets/whiskey-rocks.jpg', 'assets/citrus-cocktail.jpg', 'assets/wine-service.jpg', 'ASSET_CREDITS.md']) assert.ok(existsSync(new URL(path, root)), path);
  const app = read('js/app.js');
  assert.ok(app.includes("noteGroup('Menu ingredients', entry.ingredients)"));
  assert.ok(app.includes('role="dialog" aria-modal="true"'));
  assert.ok(app.includes('elements.profileLayer.inert = false'));
  assert.ok(app.includes("event.key === 'Tab'"));
  assert.ok(!app.includes('<blockquote>'));
  assert.ok(!/ChatGPT|Nightcap/.test(read('index.html') + app));
  assert.ok(read('styles.css').includes('prefers-reduced-motion'));
});
