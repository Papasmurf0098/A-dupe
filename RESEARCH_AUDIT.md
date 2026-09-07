# Drink and pairing audit — September 6, 2026

## Scope and limitations

The [Palm Beach Gardens location page](https://voodoobayou.com/palmbeachgardens/) linked its menu control to the [retrieved restaurant menu](https://voodoobayou.com/menu/). That location-linked page is the venue source used for this revision.

The separate [PBG menu endpoint](https://voodoobayou.com/voodoo-bayou-pbg-menu/), linked from the site's menu index, could not be retrieved. Large linked menu PDFs were not all retrievable either. Consequently, this audit **does not certify that the entire current PBG menu is unchanged**, that every live offering is included, or that a listed bottle is in stock. It reconciles the existing catalog against the accessible, location-linked page.

The comparison is with the previous repository catalog, not a dated, independently archived restaurant menu. A newly added catalog record is not proof of a recent restaurant menu change. Six entries were not found on the retrieved page and remain as clearly marked references, not confirmed discontinuations.

## Evidence rules

1. Venue text establishes a listing or ingredient list; it does not establish exact bottle release, recipe measures, dilution, vintage, or firsthand tasting.
2. Linked producer/product pages establish reference product facts. Named merchant and published tasting references supplement sensory descriptions where necessary. The catalog includes 313 distinct source URLs; source count is not a quality score.
3. Each record identifies source type, date, and support scope. A venue link plus a product link is not two independent confirmations of a flavor. Source quality and specificity vary between records.
4. Flavor, body, and finish are qualitative reference descriptions. They are not measured flavor intensities or a tasting of the venue pour. House cocktail descriptions are explicitly ingredient-based expectations.
5. Numeric bottle strength is labeled as a reference bottling. Batch-dependent or unresolved expressions require a label check. Wines without a confirmed venue vintage and house cocktails without measures do not receive invented numeric ABVs. Spirit ABV is never substituted for finished cocktail ABV.
6. Unresolved identities receive low confidence and conditional wording. No record is elevated to high confidence merely because it is listed on a menu.
7. Prior research, tasting, strength, and pairing values remain under `sourceRecord` for provenance. Superseded claims are not active facts and should not be republished from that archive.

## Coverage

| Measure | Result |
| --- | ---: |
| Previously stored records | 338 |
| Newly added records | 15 |
| Records reviewed and stored | 353 |
| Distinct profiles shown | 352 |
| Visible profiles with pairing suggestions | 341 |
| Suggestions shown | 682 |
| Named food-menu dishes represented | 36 |
| Profiles with pairings withheld | 11 |
| Records not found on the retrieved menu | 6 |

The raw data contains 684 pairings because it preserves the duplicate record. The interface suppresses that duplicate and maps its old deep link/favorite to the canonical Milam & Greene rye profile.

### Additions to the catalog

Eric Louis Pinot Noir; The Big Lebowski; Grasshopper; Hooo Lawd; Shakey's Cajun Bloody Mary; Breakfast Old Fashioned; Bellini; Aperol Spritz; Mimosa; Boujie Mimosa; Endless Bloody Mary; Happy Hour Margarita; Old Fashioned; Red Bull Watermelon; High West American Prairie Bourbon.

Names such as Endless Bloody Mary represent the menu listing, not a known serving measure or standardized strength. Brunch/happy-hour variants are not silently treated as identical to a fully specified house recipe.

### Retained but not found on the retrieved menu

Membership Flight, Private Barrel Flight, Pappy Flight, Plymouth Gin, Plymouth Sloe Gin, and Blanton's Private Barrel Old Fashioned. A general monthly flight offering does not establish the contents of the three named historical flights.

## Material corrections

| Record / group | Revision |
| --- | --- |
| Heaven Hill Heritage Collection 20 Year | Corrected bourbon to the producer's 2023 corn-whiskey release; legacy ID retained. |
| Kavalan expressions | Removed bourbon classification; treated as Taiwanese single malt. |
| Buffalo Trace “Rye” | Distinguished rye-recipe bourbon from straight rye; exact identity unresolved. |
| Suntory “Toki Harmony” | Did not collapse Toki and Hibiki Japanese Harmony into one identified bottle. |
| Macallan 12 and unspecified private/limited selections | Kept release-dependent flavor and strength claims conditional; withheld pairings where the identity is too broad. |
| Milam & Greene rye duplicate | One visible profile, with aliases and legacy-ID mapping. |
| Wine vintages and blends | Removed unsupported fixed ABV and over-specific vintage/blend assumptions; appellation/product mismatches are caveated. |
| Thomas Schmitt Riesling | Did not assume the unspecified listing is a Kabinett bottling. |
| Bud Light, Golden Monkey, Stella Artois, Corona Light | Separated producer reference ABV from conflicting menu values; venue packaging remains uninspected. |
| Voodoo Child | Ingredient-led citrus, fruit, cinnamon, whiskey, and egg-white structure; charcoal is not treated as evidence of smoky flavor. |
| Ghost Tequila | Kept the expression conditional rather than asserting a spicy formulation for an unspecified listing. |

Record-level source links and limitations are available in the app under **Accuracy & sources** and in each record's `research` object. For example, the corn-whiskey correction is supported by [Heaven Hill's release announcement](https://blog.heavenhilldistillery.com/detail.php?post_name=heaven-hill-heritage-collections-latest-release).

## Food pairing method

The 36 dishes in `data/food.json` are selected from the retrieved [Voodoo Bayou menu](https://voodoobayou.com/menu/), including dinner, desserts, and selected brunch dishes. This is a pairing roster, not a claim to reproduce every food item. Dish components and service labels are stored alongside the source URL.

Pairings are **editorial suggestions, not restaurant endorsements or tested tasting results**. Reasons connect the reference drink's fruit, acidity, spice, roast, texture, or barrel character to named dish components. They do not imply that alcohol neutralizes chile heat or that a drink is suitable for a dietary restriction. Recipes and availability can change; the restaurant should confirm ingredients and allergens.

Pairings are withheld for Buffalo Trace wheated bourbon, Four Roses Private Selection, Bardstown Cabernet-finished bourbon, Westland Garryana, Macallan 12, Suntory “Toki Harmony,” Buffalo Trace “Rye,” Very Olde St. Nick rye, and the three unresolved flights. Other conditional product references carry a conditional-pairing notice.

## Validation and remaining checks

Automated validation checks both catalog copies, unique IDs and duplicate targets, every record's evidence fields, all dish references, ABV qualification, search/filter behavior, local-storage recovery, and simulated offline routing/cache isolation. JavaScript syntax and whitespace checks are also run.

No browser-rendered visual review, touch-device test, screen-reader session, or installed service-worker upgrade test was performed. No direct restaurant confirmation, bottle-label inspection, or firsthand tasting was performed. This branch is a reviewable research and implementation revision, not a certification of restaurant inventory or a live deployment.
