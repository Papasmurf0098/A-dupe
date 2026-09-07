// Idempotent editorial revision from the refreshed location-linked menu.
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const drinks = read('data/drinks.json');
const food = read('data/food.json');
const date = '2026-09-07';
const url = 'https://voodoobayou.com/menu/';
const basis = 'Ingredient-based expectation from the venue menu, not a firsthand tasting. Recipe measures and dilution are not published.';
const source = { url, title: 'Voodoo Bayou refreshed location-linked menu', supports: 'Listing and ingredients; sensory descriptions are editorial inferences', type: 'venue', accessed: date };
const additions = [
  ['garden-district-ceviche', 'Garden District Ceviche', 'Fresh catch with citrus tomato water, small heirloom tomatoes, corn, red onion, jalapeños and crisp shallots', 'Lunch / Dinner'],
  ['corn-ribs', 'Corn Ribs', 'Chipotle cheddar sauce, smoked pork belly, crispy garlic, Mexican crema and green onion', 'Lunch / Dinner'],
  ['cajun-crab-hushpuppies', 'Cajun Crab Hushpuppies', 'Lump crab in a Cajun-seasoned beer batter with remoulade', 'Lunch / Dinner'],
  ['salmon-tartare', 'Salmon Tartare au Citron', 'Salmon, shallots, capers, relish and parsley with white-wine vinaigrette, lemon crème fraîche and kettle chips', 'Lunch / Dinner'],
  ['roasted-peach-salad', 'Roasted Peach Salad', 'Roasted peach, arugula, whipped ricotta, cornbread crumble, pink peppercorn, candied pecans and lemon-thyme vinaigrette', 'Lunch / Dinner'],
  ['frenchmen-fried-oysters', 'Frenchmen Fried Oysters', 'Fried oysters with compressed honeydew, white balsamic vinegar and green goddess', 'Dinner'],
  ['voodoo-krewe-snapper', 'Voodoo Krewe Snapper', 'Snapper with Creole sauce, braised green beans and crawfish-cornbread stuffing', 'Lunch / Dinner'],
  ['holy-sunday', 'Holy Sunday', 'Warm chocolate-chip cookie with butter-pecan, cookies-and-cream and coffee ice creams, brownie pieces, beignets, wafers and graham crumbs', 'Dessert'],
];
for (const [id, name, components, service] of additions) {
  if (!food.dishes.some((dish) => dish.id === id)) food.dishes.push({ id, name, components, service, sourceUrl: url, checkedAt: date, status: 'listed', addedAt: date });
}
const dishById = new Map(food.dishes.map((dish) => [dish.id, dish]));
function pair(dishId, reason) {
  const dish = dishById.get(dishId);
  if (!dish) throw new Error(`Unknown dish ${dishId}`);
  return { dishId, name: dish.name, reason, sourceUrl: url };
}
function archive(record) {
  record.menuHistory ||= [];
  if (!record.menuHistory.some((item) => item.replacedAt === date)) record.menuHistory.push({ replacedAt: date, name: record.name, menu: structuredClone(record.menu || {}), ingredients: structuredClone(record.ingredients || []), components: record.components, service: record.service });
}
for (const dish of food.dishes) {
  dish.status ||= 'listed';
  dish.checkedAt = date;
}
for (const [oldId, replacement] of [['mac', 'corn-ribs'], ['grits', 'voodoo-krewe-snapper'], ['fried-oysters', 'frenchmen-fried-oysters']]) {
  const dish = dishById.get(oldId);
  archive(dish);
  dish.status = 'not-found';
  dish.replacedBy = replacement;
  dish.note = 'Not found on the refreshed menu. Kept for old dish links; the replacement has its own recipe.';
}
const corn = dishById.get('cornbread');
archive(corn); corn.components = 'Cornbread with honey butter';
corn.note = 'The refreshed menu no longer specifies molasses.';
const watermelon = dishById.get('watermelon');
archive(watermelon); watermelon.service = 'Brunch';
watermelon.components = 'Listed as a brunch side; current ingredients are not specified.';
watermelon.note = 'Do not assume the previous full salad’s feta, fennel or vinaigrette recipe.';
dishById.get('corn-ribs').aliases = ['SCorn Ribs'];
dishById.get('frenchmen-fried-oysters').aliases = ['Frenchman Fried Oysters'];

const cocktails = [
  {
    id: 'bourbon-peach-tea', name: 'Bourbon Peach Tea', subtype: 'Bourbon and peach-tea cocktail',
    ingredients: ['Peach-infused Benchmark bourbon', 'peach tea syrup', 'orchard citrus'],
    aroma: ['peach', 'tea', 'citrus'], flavor: ['sweet peach', 'tea', 'citrus tartness', 'bourbon'],
    body: 'Syrup-rounded; the balance depends on the unpublished proportions and dilution.', finish: 'Peach and tea with citrus and bourbon warmth.',
    caveat: 'Orchard citrus is the menu wording; individual citrus fruits and tea type are not specified. This is distinct from the older DePeache Mode recipe.',
    pairs: [['roasted-peach-salad', 'Peach echoes the roasted fruit; tea and bourbon provide contrast to ricotta and candied pecans.'], ['cornbread', 'Peach sweetness and bourbon complement warm cornbread and honey butter.']],
  },
  {
    id: 'verdita', name: 'Verdita', subtype: 'Herbal gin cocktail',
    ingredients: ['Breckenridge Gin', 'pear', 'cilantro', 'mint', 'aloe liqueur', 'lime', 'Carpano Bianco', 'Cocchi Americano', 'vanilla'],
    aroma: ['mint', 'cilantro', 'pear', 'lime'], flavor: ['pear', 'fresh herbs', 'lime tartness', 'vanilla'],
    body: 'Fruit and liqueurs suggest a rounded texture balanced by lime.', finish: 'Herbs and citrus with a soft vanilla note.',
    caveat: 'The menu does not identify the aloe liqueur or ingredient quantities; no precise bitterness or sweetness level is assigned.',
    pairs: [['garden-district-ceviche', 'Lime and fresh herbs connect with the ceviche’s citrus tomato water, onion and jalapeños. The catch itself is unspecified.'], ['salmon-tartare', 'Herbal notes complement parsley and capers, while lime contrasts with rich salmon and lemon crème fraîche.']],
  },
  {
    id: 'gris-gris-rita', name: 'Gris-Gris Rita', subtype: 'Savory tequila cocktail',
    ingredients: ['Corazón Blanco', 'Munyon’s Paw-Paw', 'roasted bell pepper', 'hint of pineapple', 'lime', 'Tony Chachere’s'],
    aroma: ['roasted bell pepper', 'lime', 'pineapple'], flavor: ['savory bell pepper', 'lime tartness', 'light pineapple', 'tequila', 'seasoning'],
    body: 'Citrus-led with a little fruit sweetness; exact texture is not specified.', finish: 'Savory pepper and citrus with tequila warmth.',
    caveat: 'Bell pepper is not evidence of chile heat. The precise Tony Chachere’s product and recipe measures are not stated.',
    pairs: [['garden-district-ceviche', 'Savory pepper and lime echo the vegetable and citrus elements without assuming a particular fish species.'], ['corn-ribs', 'Lime offers a tart contrast to cheddar and crema; roasted pepper connects with the corn and smoky pork topping.']],
  },
  {
    id: 'jameoretto-sour', name: 'Jameo’retto Sour', subtype: 'Irish whiskey and amaretto sour',
    ingredients: ['Jameson', 'Luxardo Amaretto', 'Munyon’s Paw-Paw', 'citrus sherbet', 'lemon', 'thyme'],
    aroma: ['lemon', 'thyme', 'almond-like amaretto'], flavor: ['citrus tartness', 'almond-like sweetness', 'thyme', 'Irish whiskey'],
    body: 'Sweet-tart and syrup-rounded; no foaming ingredient is specified.', finish: 'Citrus and thyme with amaretto sweetness.',
    caveat: 'Citrus sherbet is the venue’s term; its composition is unspecified. Do not infer egg white or dairy from the sour name.',
    pairs: [['cajun-crab-hushpuppies', 'Lemon gives a tart contrast to the beer batter and remoulade; thyme adds an herbal link to the savory crab.'], ['roasted-peach-salad', 'Amaretto’s almond-like character complements pecans, while lemon and thyme connect directly with the vinaigrette.']],
  },
  {
    id: 'blanche-devereaux-vol-3', name: 'Blanche Devereaux Vol. 3', subtype: 'Seasonal reposado tequila cocktail',
    ingredients: ['Corazón Reposado', 'Luxardo Amaretto', 'grapefruit', 'lime', 'orgeat', 'cinnamon'],
    aroma: ['grapefruit', 'cinnamon', 'almond-like sweetness'], flavor: ['grapefruit bitterness', 'lime tartness', 'amaretto and orgeat sweetness', 'cinnamon', 'reposado tequila'],
    body: 'Orgeat and amaretto suggest a rounded texture against the citrus.', finish: 'Grapefruit, cinnamon and nut-like sweetness.',
    caveat: 'Listed as seasonal, Patrick’s Edition. Vol. 3 has a different ingredient list from Vol. 2; do not carry over the St-Germain claim.',
    pairs: [['voodoo-krewe-snapper', 'Citrus provides a bright contrast to the Creole sauce and cornbread stuffing; cinnamon adds aromatic warmth.'], ['roasted-peach-salad', 'Nut-like sweetness and cinnamon complement pecans and roasted peach, with citrus matching the vinaigrette.']],
  },
  {
    id: 'espresso-old-fashioned', name: 'Espresso Old Fashioned', subtype: 'Coffee-led cognac and rye cocktail',
    ingredients: ['Pierre Ferrand Cognac', 'Old Forester Rye', 'Licor 43', 'chicory', 'espresso', 'vanilla', 'orange'],
    aroma: ['espresso', 'chicory', 'orange', 'vanilla'], flavor: ['roasted coffee', 'chicory bitterness', 'vanilla sweetness', 'orange', 'rye and cognac'],
    body: 'Spirit-led and liqueur-rounded; espresso quantities and dilution are unknown.', finish: 'Coffee roast and chicory with vanilla and orange.',
    caveat: 'The menu also labels this Carajillo. It is the venue’s multi-spirit recipe, not an assumed classic two-ingredient build.',
    pairs: [['holy-sunday', 'Coffee and vanilla connect with the dessert’s coffee ice cream and cookie; roast offers contrast to its sweetness.'], ['date-cake', 'Coffee bitterness contrasts with toffee and dates; vanilla connects with the ice cream.']],
  },
];
for (const spec of cocktails) {
  if (drinks.entries.some((entry) => entry.id === spec.id)) continue;
  drinks.entries.push({
    id: spec.id, name: spec.name, family: 'Cocktail', category: 'Cocktail', subtype: spec.subtype,
    producer: 'Voodoo Bayou', origin: { country: 'USA', region: 'Florida', display: 'Florida, USA' },
    ingredients: spec.ingredients,
    aliases: spec.id === 'espresso-old-fashioned' ? ['Carajillo'] : spec.id === 'bourbon-peach-tea' ? ['Peach Tea Cocktail', 'Peach Bourbon Tea'] : [],
    strength: { confirmation: 'recipe-dependent', display: 'ABV not published', note: 'Base spirit ABV is not the finished drink ABV; measures and dilution are unknown.' },
    tasting: { aroma: spec.aroma, flavor: spec.flavor, body: spec.body, finish: spec.finish },
    tags: ['Cocktail', ...spec.flavor], signatureTraits: [],
    menu: { status: 'listed', sourceUrl: url, checkedAt: date, addedAt: date, availability: 'Menu listing; current service not confirmed' },
    research: { reviewedAt: date, confidence: 'Medium', profileLevel: 'Ingredient-based expectation', ambiguityStatus: basis, caveats: [basis, spec.caveat], sources: [source], sourceTypesConsulted: ['venue'], tastingBasis: basis, resolution: 'Added the refreshed menu recipe with bounded ingredient-led flavor expectations.', conflictsFound: spec.caveat },
    pairings: { restaurant: spec.pairs.map(([id, reason]) => pair(id, reason)) },
    pairingReview: { reviewedAt: date, basis: 'Editorial pairing suggestions, not restaurant endorsements. Dishes checked against the refreshed location-linked menu.', conditional: false },
    sourceRecord: { displayName: spec.name, addedFrom: url, addedAt: date },
  });
}

for (const id of ['pimp-chalice', 'voodoo-child', 'depeache-mode', 'blanche-devereaux-vol-2']) {
  const entry = drinks.entries.find((item) => item.id === id);
  archive(entry);
  entry.menu = { ...entry.menu, status: 'not-found', checkedAt: date, note: 'Not found on the refreshed menu; retained as a historical recipe, not a confirmed discontinuation.' };
}
for (const id of ['membership-flight', 'private-barrel-flight', 'pappy-flight']) {
  const entry = drinks.entries.find((item) => item.id === id);
  archive(entry);
  entry.menu = { ...entry.menu, status: 'listed', checkedAt: date, availability: 'Flight name listed; included pours remain unspecified.' };
  entry.research.reviewedAt = date;
  entry.research.sources = [source];
  entry.research.caveats = ['The refreshed menu lists this flight by name but does not identify the component pours. No tasting profile or numeric strength can be established.'];
  entry.research.ambiguityStatus = 'Flight composition not published';
  entry.research.conflictsFound = 'Previously not found; now explicitly listed. Contents remain unresolved.';
  entry.research.resolution = 'Updated listing status only; pairing remains withheld pending flight composition.';
}
const privateBarrel = drinks.entries.find((entry) => entry.id === 'blantons-private-barrel-old-fashioned');
archive(privateBarrel);
privateBarrel.aliases = [...new Set([...(privateBarrel.aliases || []), "Blanton's Private Barrel Old Fashioned"])];
privateBarrel.name = 'Voodoo Private Barrel Old Fashioned';
privateBarrel.ingredients = ['Voodoo private barrel: Blanton’s, Jefferson Ocean or Woodford Double Oak', 'Angostura bitters', 'sugar cube'];
privateBarrel.menu = { status: 'listed', sourceUrl: url, checkedAt: date, availability: 'Listed base choices; chosen bottle and pour size require confirmation.' };
privateBarrel.tasting = { aroma: ['bourbon', 'aromatic bitters'], flavor: ['bourbon', 'sugar sweetness', 'bitter spice'], body: 'Spirit-forward; expression and dilution vary with the chosen barrel.', finish: 'Bourbon and bitters; specific barrel flavors are not fixed.' };
privateBarrel.strength = { confirmation: 'recipe-dependent', display: 'ABV not published', note: 'Three alternative base bottles are listed, not a three-bourbon blend. Finished ABV is unknown.' };
privateBarrel.tags = ['Cocktail', 'bourbon', 'aromatic bitters'];
privateBarrel.signatureTraits = [];
privateBarrel.research = { reviewedAt: date, confidence: 'Low', profileLevel: 'Ingredient-based expectation', ambiguityStatus: 'Base bottle choice unresolved', caveats: [basis, 'Blanton’s, Jefferson Ocean and Woodford Double Oak are menu alternatives, not a confirmed blend.'], sources: [source], sourceTypesConsulted: ['venue'], tastingBasis: basis, resolution: 'Preserved the legacy ID while correcting the name and menu choices.', conflictsFound: 'The previous record assumed only Blanton’s.' };

for (const entry of drinks.entries) {
  if (!entry.pairings.restaurant.length) continue;
  for (let i = 0; i < entry.pairings.restaurant.length; i++) {
    const old = entry.pairings.restaurant[i];
    let next;
    if (old.dishId === 'mac') next = pair('corn-ribs', 'The drink’s flavor offers contrast to rich chipotle cheddar and crema, while the smoked pork topping adds savory depth.');
    if (old.dishId === 'grits') next = pair('voodoo-krewe-snapper', 'Fresh fruit and citrus notes offer contrast to Creole sauce, while the cornbread stuffing supports the drink’s rounder texture.');
    if (old.dishId === 'fried-oysters') next = pair('frenchmen-fried-oysters', 'Freshness and carbonation or acidity contrast with the fried coating; honeydew and green goddess add fruit and herbal notes.');
    if (old.dishId === 'watermelon' && entry.family !== 'Water') {
      const herbal = /gin|tequila/i.test(entry.category + ' ' + entry.subtype) || entry.id === 'wither-hills';
      next = herbal
        ? pair('garden-district-ceviche', 'The reference spirit or wine’s botanical, vegetal or citrus notes complement citrus tomato water and fresh vegetables. Keep the drink’s intensity in balance with the delicate catch.')
        : pair('roasted-peach-salad', 'Fruit notes complement roasted peach; lemon-thyme vinaigrette adds brightness against the drink and creamy ricotta.');
    }
    if (next) {
      entry.sourceRecord ||= {};
      entry.sourceRecord.pairingsBeforeMenuRefresh ||= structuredClone(entry.pairings.restaurant);
      entry.pairings.restaurant[i] = next;
    }
    if (old.dishId === 'cornbread' && /molasses/i.test(old.reason)) {
      old.reason = old.reason.replace(/honey butter and molasses/gi, 'honey butter').replace(/molasses/gi, 'honey butter');
    }
  }
  entry.pairingReview.reviewedAt = date;
}
// Keep the name-only brunch side discoverable without inventing its old recipe.
for (const id of ['aqua-panna', 'san-pellegrino']) {
  const entry = drinks.entries.find((item) => item.id === id);
  if (!entry.pairings.restaurant.some((item) => item.dishId === 'watermelon')) entry.pairings.restaurant.push(pair('watermelon', 'Water leaves the brunch side’s fruit flavors central. Its current dressing and other ingredients are not specified.'));
}
food.reviewedAt = date;
food.scope = 'Refreshed menu linked from Palm Beach Gardens; current items are separated from historical recipes. The separate PBG endpoint remains unavailable.';
drinks.audit.menuFollowUp = { checkedAt: date, sourceUrl: url, addedCocktails: cocktails.map((item) => item.id), addedDishes: additions.map((item) => item[0]), note: 'A refreshed retrieval returned newer menu content after an earlier retrieval still returned the older page. Exact change dates and inventory are not established.' };
function write(path, value) { writeFileSync(new URL(path, root), JSON.stringify(value, null, 2) + '\n'); }
write('data/food.json', food);
write('data/drinks.json', drinks);
write('drinks.json', drinks);
console.log(JSON.stringify({ records: drinks.entries.length, dishes: food.dishes.length, activeDishes: food.dishes.filter((dish) => dish.status === 'listed').length, visiblePairings: drinks.entries.filter((entry) => !entry.duplicateOf).reduce((sum, entry) => sum + entry.pairings.restaurant.length, 0) }));
