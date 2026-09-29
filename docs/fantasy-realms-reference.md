# Fantasy Realms – Édition Deluxe (VF) — Scoring Reference for the Coding Agent

> **Purpose.** This document is the single source of truth for building a score calculator for the board game *Fantasy Realms – Édition Deluxe* (French edition by Don't Panic Games, 2024). The agent reading this knows nothing about the game. Everything needed to compute a final score is here: card list (French names), families, base strengths, effects, the exact resolution order, edge cases, test cases, and product requirements.
>
> **Scope.** The app does **not** simulate a game. The player enters the cards they hold at the end of the game (plus a few context inputs), and the app computes the score by resolving every effect automatically.

---

## 0. How to read this document

### 0.1 Language conventions

- Prose is in English. **All player-facing names (cards, families, keywords) are in French**, as printed on the French Deluxe cards. The UI must display the French names.
- An English name column is provided only for cross-referencing community resources. Never show it in the UI.
- Code identifiers: use the stable card IDs defined here (`FR01`…`FR55`, `CH01`…`CH16`, `CH24`…`CH47`). **Never match cards by name string in the scoring logic** — names contain accents, apostrophes and capitalisation variants.

### 0.2 Confidence markers

| Marker | Meaning |
|---|---|
| ✅ | Confirmed from the official French Deluxe rulebook (Don't Panic Games) or the official French base-game rulebook. |
| 🟡 | From a reliable community source (French translation of the open-source scorer, BGG). Logic is reliable; **exact French wording or a value should be checked against the physical card** by the product owner. |
| ⚠️ | Rules ambiguity. A default interpretation is given; make it easy to change. |

### 0.3 Sources

1. *Fantasy Realms Deluxe – Règles* (FR), Don't Panic Games — family list, card names, keywords, Q&A, expansion rules. ✅
2. *Fantasy Realms – Règles* (FR, 2021 base game), Don't Panic Games — card texts shown in examples, Q&A. ✅
3. Open-source scorer `fantasy-realms.github.io` (MIT licence, maintained, supports Deluxe Phénix and Trésor maudit) — card logic, cursed item values, test suite, community French translation. 🟡 This is the **reference implementation**: the agent may read it (`github.com/fantasy-realms/fantasy-realms.github.io`, files `js/deck.js`, `js/hand.js`, `js/tests.js`) to resolve doubts. Its card IDs match the IDs used here.

### 0.4 Items the product owner must verify on the physical cards (open list)

1. **Arbre-Monde**: the Deluxe card reportedly shows **+70** (BGG). Check whether +70 is marked with the ☠ symbol (= only with the extra families; +50 otherwise) or is the only value. Default implemented here: +50 base / +70 with extra families.
2. **Cursed items (Objets maudits)**: French names and face-down values (the value printed on each card). Only *Gants de voleur*, *Plan de la décharge* and *Portail* are confirmed by the rulebook. The Deluxe renamed at least one item (*Carriole de Marchand* → *Charette de Marchand*, spelling to confirm).
3. **Expansion card texts** (Bâtiments, Extérieurs, Morts-vivants, Jardin, ☠ parts of base cards): French wording 🟡.
4. *(Optional)* Deluxe card numbers (1–95) if the UI should show them. The rulebook says base cards are numbered 1–55 (53 base + Bouffon + Phénix); the rest is unknown.

---

## 1. Game overview (only what matters for scoring)

- Each card has: **Nom** (unique name), **Famille** (suit), **Force de base** (base strength, printed number), and a **BONUS** and/or **MALUS** text.
- At the end of the game, each player scores **only the cards in their own hand** (opponents' cards never affect you), with two exceptions: *Mirage* and *Métamorphe* may copy a card that is not in hand, and some expansion cards look at the **zone de défausse** (shared discard area).
- **Score = Σ (force de base + bonus + malus) over all non-masked cards in hand + face-down cursed items (if that module is used).**
- **Tie-break** ✅: the tied player with the **lowest total base strength** wins. ⚠️ Default: sum of the printed base strengths of all cards in hand (masked cards included, printed value).

### 1.1 Game modes (Deluxe) ✅

The Deluxe box contains the base game (53 cards), the *Le Trésor maudit* expansion (two independent modules) and 2 promo cards. Allowed combinations:

| Mode | Families in play | Cursed items | Starting hand | Game ends at |
|---|---|---|---|---|
| Base | 10 base families + Joker | No | 7 | 10 cards in discard |
| Base + Objets maudits | same | Yes | 7 | 10 |
| Base + Familles supplémentaires | + Bâtiment, Extérieur, Mort-vivant | No | **8** | **12** |
| Trésor maudit complet | + Bâtiment, Extérieur, Mort-vivant | Yes | **8** | **12** |

Promo cards *Bouffon* and *Phénix* can be added to any mode.

**When the extra families are used** ✅:
- Add all Bâtiment, Extérieur and Mort-vivant cards **and the Jardin** (a Terrain).
- Remove the **Beffroi (Terrain)** and use the **Beffroi (Bâtiment)** instead (two physical cards with the same name).
- Text marked with the ☠ skull on base cards becomes active (see section 5). Without the extra families, ☠ text is ignored.

### 1.2 Hand size ✅

| Mode | Normal hand | Extra cards possible | Hard maximum |
|---|---|---|---|
| Base | 7 | +1 via Nécromancien | 8 |
| Base + Objets maudits | 7 | +1 Nécromancien, +1 Portail | **8** (a player ending with 9 must discard down to 8) |
| With extra families (with or without Objets maudits) | 8 | +1 each: Nécromancien, Leprechaun, Génie, Portail | **9** |

The app should warn (not block) when the hand size is unusual, so that partial hands can still be scored.

---

## 2. Families (Familles)

Use these enum codes in code. ✅ for all names.

| Code | Nom (FR) | EN | Cards | Module |
|---|---|---|---|---|
| `TERRAIN` | Terrain | Land | Beffroi*, Caverne, Élémental de Terre, Forêt, Montagne, Jardin ☠ | Base (+Jardin ☠) |
| `VAGUE` | Vague | Flood | Source de vie, Marécage, Inondation, Île, Élémental d'Eau | Base |
| `CLIMAT` | Climat | Weather | Orage, Blizzard, Fumée, Tornade, Élémental d'Air | Base |
| `FLAMME` | Flamme | Flame | Feu de forêt, Chandelle, Forge, Éclair, Élémental de Feu | Base |
| `ARMEE` | Armée | Army | Chevaliers, Archers Elfes, Cavalerie légère, Infanterie naine, Éclaireurs | Base |
| `SORCIER` | Sorcier | Wizard | Collectionneur, Dresseur, Nécromancien, Démoniste, Enchanteresse, Bouffon (promo) | Base |
| `SEIGNEUR` | Seigneur | Leader | Roi, Reine, Princesse, Chef de guerre, Impératrice | Base |
| `CREATURE` | Créature | Beast | Licorne, Basilic, Destrier, Dragon, Hydre, Phénix (promo) | Base |
| `ARME` | Arme | Weapon | Navire de guerre, Baguette magique, Épée de Keth, Arc elfique, Dirigeable | Base |
| `ARTEFACT` | Artefact | Artifact | Bouclier de Keth, Gemme de Loi, Arbre-Monde, Livre des mutations, Rune de Protection | Base |
| `JOKER` | Joker | Wild | Métamorphe, Mirage, Doppelgänger | Base |
| `BATIMENT` | Bâtiment | Building | Donjon, Château, Crypte, Chapelle, Beffroi ☠ | Extra families |
| `EXTERIEUR` | Extérieur | Outsider | Génie, Juge des âmes, Ange, Leprechaun, Démon | Extra families |
| `MORT_VIVANT` | Mort-vivant | Undead | Reine des Ténèbres, Goule, Spectre, Liche, Chevalier de la Mort | Extra families |
| `OBJET_MAUDIT` | Objet maudit | Cursed Item | 24 cards, separate deck, never in hand | Cursed items |

\* Beffroi: Terrain in base mode, Bâtiment when the extra families are used (two different physical cards).

Card counts: 53 base + 2 promos + 15 new cards + 1 alternate Beffroi = **71 hand-type cards**, + **24 cursed items** = **95** ✅.

---

## 3. Keywords (glossary) ✅

| FR keyword (on cards) | EN | Exact meaning for the engine |
|---|---|---|
| **AVEC** | WITH | Bonus/penalty applies **once** if the condition is met, no matter how many matching cards. *Ex.: Baguette magique + 2 Sorciers → +25 once.* |
| **POUR CHAQUE** | FOR EACH | Applied once **per** matching active card in hand. |
| **MASQUER / MASQUE** | BLANK | A masked card has **no name, no family, no bonus, no malus, no base strength**. It scores 0 and is invisible to every other card's conditions and counts. |
| **MASQUÉ SAUF AVEC** | BLANKED UNLESS WITH | The card masks itself unless the hand contains an active card of the listed kind. |
| **EFFACE / EFFACER** | CLEAR | Removes a malus (or part of it, e.g. "le mot Armée") from other cards. A cleared card keeps its family, strength and bonus. **Clearing happens before any malus is applied** — so a card that clears and is later masked has still cleared (see Q&A in §6). |
| **Force de base** | Base strength | The printed number. |
| **Zone de défausse** | Discard area | Face-up shared discard. Used by some expansion cards. |
| **Pioche** | Draw pile | — |
| "autre" (ex. « chaque autre Terrain ») | "other" | Excludes the card itself. |

Important consequences:
- "EFFACE" and "Évite d'être masquée" effects are printed in the **BONUS** section. Therefore **Doppelgänger does not copy them** (it copies malus only).
- A malus that has been cleared **does not blank anything and gives no negative points**.

---

## 4. Scoring engine — resolution order

This is the most important section. Follow the steps in order. ✅ unless marked.

```
function scoreHand(handCards, choices, ctx):
  # ctx = { mode: {extraFamilies: bool, cursedItems: bool, promos: bool},
  #         playerCount: int, discardArea: Card[], faceDownCursedItems: CursedItem[] }

  0. Build a working copy of every card: name, families[], strength, bonus fn, malus fn,
     flags: masked=false, penaltyCleared=false, armyWordCleared=false.
     (Extra cards from Nécromancien / Leprechaun / Génie / Portail are simply part of the
      entered hand: their draws happen before everything else. ✅)

  1. Resolve copy / transform choices, in THIS order ✅:
       a. Doppelgänger
       b. Mirage
       c. Métamorphe
       d. Livre des mutations
     Then register the targets of Île and Ange (they are just parameters of later steps).

  2. CLEAR phase ✅ — for every card in hand (masked or not later: irrelevant, masking has
     not happened yet), apply its clearing effect:
       Montagne            → penaltyCleared on all VAGUE cards
       Caverne             → penaltyCleared on all CLIMAT cards (incl. Phénix)
       Dresseur            → penaltyCleared on all CREATURE cards
       Rune de Protection  → penaltyCleared on ALL cards
       Île                 → penaltyCleared on ONE chosen VAGUE or FLAMME card
       Éclaireurs          → armyWordCleared on ALL cards
       Navire de guerre    → armyWordCleared on all VAGUE cards
     (Only cards whose malus is not cleared will act in steps 4–7.)

  3. Compute "cannot be masked" protections:
       - Ange (itself) and the card chosen by Ange
       - Phénix cannot be masked BY ANOTHER CARD (it can still mask itself, step 6)
       - ☠ MORT_VIVANT cards if Liche or Nécromancien is in hand (extra families mode)

  4. DÉMON phase (if Démon in hand and its malus not cleared) — happens before any other
     masking ✅: every non-EXTERIEUR, non-protected card that is the ONLY card of its family
     in the hand is masked. (Count families on the post-step-1 hand, before any masking.)

  5. BLANKING phase — "MASQUE ..." maluses of active, non-cleared cards (§4.1 algorithm).

  6. SELF-CONDITIONAL phase — "MASQUÉ sauf avec / MASQUÉ avec / MASQUÉ par" maluses of the
     card itself (non-cleared), in this order, repeated until nothing changes:
       Phénix → Fumée → Navire de guerre → Jardin → Dirigeable

  7. SCORE phase — for every non-masked card:
       points = strength + bonus(activeHand, ctx) + (penaltyCleared ? 0 : malus(activeHand, ctx))
     where activeHand = non-masked cards only (with their current names/families/strengths).

  8. Add face-down cursed items (§8), if that module is enabled.

  return total, plus per-card breakdown (base / bonus / malus / masked / cleared / chosen option)
```

### 4.1 Blanking algorithm (step 5)

Official guidance ✅: *"appliquez tous les malus, en commençant par les cartes qui ne sont pas masquées par d'autres cartes."* Implementation (same as the reference implementation):

1. `blankers` = active (not masked in step 4), non-cleared cards whose malus says "MASQUE …" (Inondation, Orage, Blizzard, Feu de forêt, Basilic, Crypte, and any Doppelgänger that copied one of them).
2. For each blanker `b` and each other card `t`: edge `b → t` if `b`'s rule targets `t` and `t` is not protected (step 3).
3. `isMasked(t, stack)`:
   - no incoming edge → `false`;
   - for each blanker `b → t`:
     - if `t → b` also exists (mutual blanking) → `true`;
     - if `b` is already in `stack` (cycle) → `true` ⚠️ (community interpretation: cycles mask every card in the cycle);
     - if `not isMasked(b, stack + [b])` → `true` (an active blanker masks `t`);
   - otherwise → `false`.
4. Compute `isMasked(t, [t])` for every card first, **then** apply all results at once.

### 4.2 Choice cards — the app must optimise ⚠️ (product decision)

Several cards require a player choice. Players always pick the best option, so the app should **search all options and keep the maximum score**, show which options it chose, and let the user override.

| Card | Option space |
|---|---|
| Doppelgänger | any other card in hand, or none |
| Mirage | any (name, family) of an eligible card **in the whole game** (not only the hand), or a "generic" card of an eligible family (family only, no name), or none |
| Métamorphe | same as Mirage with its own eligible families |
| Livre des mutations | (any other card in hand except Phénix) × (any family except Joker), or none |
| Île | any VAGUE or FLAMME card in hand, or none |
| Ange | any other card in hand, or none |

Performance: a naive Cartesian product can reach ~10⁶ evaluations. Prune: for Mirage/Métamorphe, only consider names referenced by other cards in hand + one generic card per eligible family + "none"; for Livre des mutations, only families that some card in hand references (plus the target's own family); skip Île/Ange when there is nothing to clear/protect. Evaluate a single hand in well under a second on mobile.

Cards that add an extra card (Nécromancien, Leprechaun, Génie, cursed item Portail) require **no choice** from the engine: the user enters the final hand including the extra card. The app may validate that a card added by the Nécromancien belongs to an eligible family.

---

## 5. Card catalogue

### 5.1 Pseudo-code helpers used below

All helpers look **only at active (non-masked) cards in hand** after steps 1–6, unless stated otherwise.

- `count(F)`: number of active cards having family `F`. **Phénix counts in CREATURE, FLAMME and CLIMAT** (3 families at once).
- `countOther(F)`: same, excluding this card.
- `has(F)`: `count(F) ≥ 1`. `hasOther(F)` similarly.
- `hasName("X")`: an active card is named X (includes a joker that copied the name X).
- `armyClr`: this card's `armyWordCleared` flag (from Éclaireurs anywhere in hand, or Navire de guerre for VAGUE cards).
- `disc(F)`: number of cards of family `F` in the discard area (printed family).
- `EXT`: true when the extra families module is enabled (activates ☠ text).

Strength column: printed base strength. "Texte (FR)" is the card text; ☠ marks text active only with the extra families.

### 5.2 TERRAIN ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR01 | Montagne | Mountain | 9 | BONUS : +50 avec la Fumée et le Feu de forêt. EFFACE le malus de toutes les Vagues. | bonus = `hasName(Fumée) && hasName(Feu de forêt) ? 50 : 0`. CLEAR: all VAGUE. |
| FR02 | Caverne | Cavern | 6 | BONUS : +25 avec l'Infanterie naine ou le Dragon. EFFACE les malus de tous les Climats. | bonus = `hasName(Infanterie naine) \|\| hasName(Dragon) ? 25 : 0`. CLEAR: all CLIMAT (incl. Phénix). |
| FR03 | Beffroi | Bell Tower | 8 | BONUS : +15 avec n'importe quel Sorcier. | **Base mode only.** bonus = `has(SORCIER) ? 15 : 0`. |
| FR04 | Forêt | Forest | 7 | BONUS : +12 pour chaque Créature et pour les Archers Elfes. | bonus = `12*count(CREATURE) + (hasName(Archers Elfes) ? 12 : 0)`. |
| FR05 | Élémental de Terre | Earth Elemental | 4 | BONUS : +15 pour chaque autre Terrain. | bonus = `15*countOther(TERRAIN)`. |
| CH05 | Jardin ☠ | Garden | 11 | BONUS : +11 pour chaque Seigneur et chaque Créature. MALUS : MASQUÉ par tout Mort-vivant, le Nécromancien ou le Démon. 🟡 | **Extra families only.** bonus = `11*(count(SEIGNEUR)+count(CREATURE))`. Self-mask (step 6) if `has(MORT_VIVANT) \|\| hasName(Nécromancien) \|\| hasName(Démon)`. |

### 5.3 VAGUE ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR06 | Source de vie | Fountain of Life | 1 | BONUS : Ajoutez la force de base de n'importe quel(le) Arme, Vague, Flamme, Terrain ou Climat de votre main. ☠ + Bâtiment. | bonus = max strength among active cards of families {ARME, VAGUE, FLAMME, TERRAIN, CLIMAT} (☠ + BATIMENT); 0 if none. Phénix eligible. |
| FR07 | Marécage | Swamp | 18 | MALUS : −3 pour chaque Armée et chaque Flamme. | malus = `-3*(count(FLAMME) + (armyClr ? 0 : count(ARMEE)))`. |
| FR08 | Inondation | Great Flood | 32 | MALUS : MASQUE toutes les Armées, tous les Terrains sauf la Montagne, et toutes les Flammes sauf l'Éclair. ☠ + tous les Bâtiments. | BLANKS: ARMEE (unless `armyClr`), TERRAIN except name Montagne, FLAMME except name Éclair, ☠ BATIMENT. |
| FR09 | Île | Island | 14 | BONUS : EFFACE le malus de n'importe quelle Vague ou Flamme (une seule). | CLEAR: one chosen VAGUE or FLAMME card (choice). Works even if Île ends up masked. |
| FR10 | Élémental d'Eau | Water Elemental | 4 | BONUS : +15 pour chaque autre Vague. | bonus = `15*countOther(VAGUE)`. |

### 5.4 CLIMAT ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR11 | Orage | Rainstorm | 8 | BONUS : +10 pour chaque Vague. MALUS : MASQUE toutes les Flammes sauf l'Éclair. | bonus = `10*count(VAGUE)`. BLANKS: FLAMME except name Éclair. |
| FR12 | Blizzard | Blizzard | 30 | MALUS : MASQUE toutes les Vagues. −5 pour chaque Armée, Seigneur, Créature et Flamme. | BLANKS: VAGUE. malus = `-5*(count(SEIGNEUR)+count(CREATURE)+count(FLAMME)+(armyClr?0:count(ARMEE)))`. |
| FR13 | Fumée | Smoke | 27 | MALUS : Cette carte est MASQUÉE sauf avec au moins une Flamme. | Self-mask unless `has(FLAMME)`. |
| FR14 | Tornade | Whirlwind | 13 | BONUS : +40 avec l'Orage et soit le Blizzard, soit l'Inondation. | bonus = `hasName(Orage) && (hasName(Blizzard) \|\| hasName(Inondation)) ? 40 : 0`. |
| FR15 | Élémental d'Air | Air Elemental | 4 | BONUS : +15 pour chaque autre Climat. | bonus = `15*countOther(CLIMAT)`. |

### 5.5 FLAMME ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR16 | Feu de forêt | Wildfire | 40 | MALUS : MASQUE toutes les cartes sauf les Flammes, les Sorciers, les Climats, les Armes, les Artefacts, la Montagne, l'Inondation, l'Île, la Licorne et le Dragon. | BLANKS every other card **except** families FLAMME, SORCIER, CLIMAT, ARME, ARTEFACT and names Montagne, Inondation, Île, Licorne, Dragon. Blanks Bâtiments/Extérieurs/Morts-vivants too (subject to protections). ⚠️ An unused Joker (family JOKER) is blanked by RAW; the reference implementation spares it (score impact is nil, but it matters for Arbre-Monde / Démon counts). |
| FR17 | Chandelle | Candle | 2 | BONUS : +100 avec le Livre des mutations, le Beffroi et n'importe quel Sorcier. | bonus = `hasName(Livre des mutations) && hasName(Beffroi) && has(SORCIER) ? 100 : 0`. (Either Beffroi card works.) |
| FR18 | Forge | Forge | 9 | BONUS : +9 pour chaque Arme et chaque Artefact. | bonus = `9*(count(ARME)+count(ARTEFACT))`. |
| FR19 | Éclair | Lightning | 11 | BONUS : +30 avec l'Orage. | bonus = `hasName(Orage) ? 30 : 0`. |
| FR20 | Élémental de Feu | Fire Elemental | 4 | BONUS : +15 pour chaque autre Flamme. | bonus = `15*countOther(FLAMME)`. |

### 5.6 ARMÉE ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR21 | Chevaliers | Knights | 20 | MALUS : −8 sauf avec au moins un Seigneur. | malus = `has(SEIGNEUR) ? 0 : -8`. |
| FR22 | Archers Elfes | Elven Archers | 10 | BONUS : +5 si vous n'avez pas de Climat. | bonus = `has(CLIMAT) ? 0 : 5`. |
| FR23 | Cavalerie légère | Light Cavalry | 17 | MALUS : −2 pour chaque Terrain. | malus = `-2*count(TERRAIN)`. |
| FR24 | Infanterie naine | Dwarvish Infantry | 15 | MALUS : −2 pour chaque autre Armée. | malus = `armyClr ? 0 : -2*countOther(ARMEE)`. |
| FR25 | Éclaireurs | Rangers | 5 | BONUS : +10 pour chaque Terrain (☠ et chaque Bâtiment). EFFACE le mot Armée de tous les malus. | bonus = `10*(count(TERRAIN) + (EXT ? count(BATIMENT) : 0))`. CLEAR: word "Armée" in all maluses (sets `armyWordCleared` on every card). |

### 5.7 SORCIER ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR26 | Collectionneur | Collector | 7 | BONUS : +10 si vous avez trois cartes de la même famille, +40 si quatre, +100 si cinq. | For **each** family: `n` = number of **distinct names** among active cards of that family (Phénix counts in its 3 families; copies with an identical name count once). n=3 → +10, n=4 → +40, n≥5 → +100. Sum over all families. The Collectionneur counts itself. |
| FR27 | Dresseur | Beastmaster | 9 | BONUS : +9 pour chaque Créature. EFFACE les malus de toutes les Créatures. | bonus = `9*count(CREATURE)`. CLEAR: all CREATURE. |
| FR28 | Nécromancien | Necromancer | 3 | BONUS : À la fin de la partie, vous pouvez prendre une Armée, un Seigneur, un Sorcier ou une Créature (☠ ou un Mort-vivant) de la défausse et l'ajouter à votre main. ☠ Aucun Mort-vivant ne peut être MASQUÉ. | No points. Allows +1 card in hand (validation). ☠ protection: MORT_VIVANT cannot be masked. |
| FR29 | Démoniste | Warlock Lord | 25 | MALUS : −10 pour chaque Seigneur et chaque autre Sorcier. | malus = `-10*(count(SEIGNEUR)+countOther(SORCIER))`. |
| FR30 | Enchanteresse | Enchantress | 5 | BONUS : +5 pour chaque Terrain, Climat, Vague et Flamme. | bonus = `5*(count(TERRAIN)+count(CLIMAT)+count(VAGUE)+count(FLAMME))`. (Phénix counts twice: Climat + Flamme.) |
| FR54 | Bouffon (promo) | Jester | 3 | BONUS : +3 pour chaque autre carte avec une force de base impaire. OU +50 si toutes vos cartes ont une force de base impaire. 🟡 wording | `odd` = number of active cards with odd base strength (current strength: Doppelgänger copies strength; jokers stay 0 = even). If **every** card in hand is active and odd → +50. Else bonus = `3*(odd - 1)` (the Bouffon, strength 3, is itself odd). ⚠️ A masked card prevents the +50 (it has no strength). |

### 5.8 SEIGNEUR ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR31 | Roi | King | 8 | BONUS : +5 pour chaque Armée. OU avec la Reine, +20 pour chaque Armée. | bonus = `(hasName(Reine) ? 20 : 5)*count(ARMEE)`. |
| FR32 | Reine | Queen | 6 | BONUS : +5 pour chaque Armée. OU avec le Roi, +20 pour chaque Armée. | bonus = `(hasName(Roi) ? 20 : 5)*count(ARMEE)`. |
| FR33 | Princesse | Princess | 2 | BONUS : +8 pour chaque Armée, Sorcier et chaque autre Seigneur. | bonus = `8*(count(ARMEE)+count(SORCIER)+countOther(SEIGNEUR))`. |
| FR34 | Chef de guerre | Warlord | 4 | BONUS : La somme des forces de base de toutes les Armées. | bonus = Σ strength of active ARMEE cards. |
| FR35 | Impératrice | Empress | 15 | BONUS : +10 pour chaque Armée. MALUS : −5 pour chaque autre Seigneur. | bonus = `10*count(ARMEE)`; malus = `-5*countOther(SEIGNEUR)`. |

### 5.9 CRÉATURE ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR36 | Licorne | Unicorn | 9 | BONUS : +30 avec la Princesse. OU +15 avec l'Impératrice, la Reine ou l'Enchanteresse. | bonus = `hasName(Princesse) ? 30 : (hasName(Impératrice)\|\|hasName(Reine)\|\|hasName(Enchanteresse) ? 15 : 0)`. |
| FR37 | Basilic | Basilisk | 35 | MALUS : MASQUE toutes les Armées, tous les Seigneurs et toutes les autres Créatures. | BLANKS: ARMEE (unless `armyClr`), SEIGNEUR, other CREATURE (Phénix is immune). |
| FR38 | Destrier | Warhorse | 6 | BONUS : +14 avec n'importe quel Seigneur ou Sorcier. | bonus = `has(SEIGNEUR)\|\|has(SORCIER) ? 14 : 0`. |
| FR39 | Dragon | Dragon | 30 | MALUS : −40 sauf avec au moins un Sorcier. | malus = `has(SORCIER) ? 0 : -40`. |
| FR40 | Hydre | Hydra | 12 | BONUS : +28 avec le Marécage. | bonus = `hasName(Marécage) ? 28 : 0`. |
| FR55 | Phénix (promo, version Deluxe) | Phoenix | 14 | BONUS : Compte aussi comme une carte Flamme et Climat. Le Phénix est immunisé contre le Livre des mutations et ne peut ni MASQUER ni être MASQUÉ par aucune autre carte. MALUS : MASQUÉ avec n'importe quelle Vague. 🟡 wording | Families = {CREATURE, FLAMME, CLIMAT}. Cannot be targeted by Livre des mutations. Not affected by other cards' BLANKS (incl. Démon, Basilic, Inondation, Orage). Does not blank others (e.g. does not trigger Dirigeable's "masqué avec un Climat"). Self-mask (step 6) if `has(VAGUE)`. A joker copying the Phénix gets only family CREATURE. |

> The **original** Phénix promo (pre-Deluxe) had a different text ("if blanked, strength becomes 0 but it keeps its families"). The Deluxe box contains the new version above; ignore the old one.

### 5.10 ARME ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR41 | Navire de guerre | Warship | 23 | BONUS : EFFACE le mot Armée des malus de toutes les Vagues. MALUS : MASQUÉ sauf avec au moins une Vague. | CLEAR: word "Armée" in maluses of VAGUE cards. Self-mask unless `has(VAGUE)`. |
| FR42 | Baguette magique | Magic Wand | 1 | BONUS : +25 avec n'importe quel Sorcier. | bonus = `has(SORCIER) ? 25 : 0`. |
| FR43 | Épée de Keth | Sword of Keth | 7 | BONUS : +10 avec n'importe quel Seigneur. OU +40 avec un Seigneur et le Bouclier de Keth. | bonus = `has(SEIGNEUR) ? (hasName(Bouclier de Keth) ? 40 : 10) : 0`. |
| FR44 | Arc elfique | Elven Longbow | 3 | BONUS : +30 avec les Archers Elfes, le Chef de guerre ou le Dresseur. | bonus = `hasName(Archers Elfes)\|\|hasName(Chef de guerre)\|\|hasName(Dresseur) ? 30 : 0`. |
| FR45 | Dirigeable | War Dirigible | 35 | MALUS : MASQUÉ sauf avec au moins une Armée. MASQUÉ avec n'importe quel Climat. | Self-mask if `!has(ARMEE) && !armyClr` ⚠️ (community interpretation: clearing the word Armée removes the "sauf avec une Armée" condition) **or** if an active non-Phénix CLIMAT card is present. |

### 5.11 ARTEFACT ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR46 | Bouclier de Keth | Shield of Keth | 4 | BONUS : +15 avec n'importe quel Seigneur. OU +40 avec un Seigneur et l'Épée de Keth. | bonus = `has(SEIGNEUR) ? (hasName(Épée de Keth) ? 40 : 15) : 0`. |
| FR47 | Gemme de Loi | Gem of Order | 5 | BONUS : +10 pour une suite de 3 cartes, +30 pour 4, +60 pour 5, +100 pour 6, +150 pour 7 (en référence à la force de base des cartes). | Take the base strengths of active cards. Find runs of consecutive distinct values (e.g. 4-5-6). Each run of length L scores: 3→10, 4→30, 5→60, 6→100, ≥7→150. **Multiple runs score** (greedy: extract a run, remove its values once, repeat — duplicates can form a second identical run). Jokers have strength 0 and can be part of a run (0-1-2). ✅ No extra bonus beyond 7 in 8-card games. |
| FR48 | Arbre-Monde | World Tree | 2 | BONUS : +50 (☠ +70 🟡 see §0.4) si toutes les cartes non MASQUÉES appartiennent à des familles différentes. | bonus = `allFamiliesDistinct(activeCards) ? (EXT ? 70 : 50) : 0`. Phénix occupies 3 families (CREATURE, FLAMME, CLIMAT). |
| FR49 | Livre des mutations | Book of Changes | 3 | BONUS : Vous pouvez changer la famille d'une autre carte. Son nom ainsi que ses bonus et malus restent les mêmes. | Choice (step 1d): one other card (not Phénix) gets a new family. Name, strength, bonus and malus are unchanged; cards that reference it **by name** are unaffected. |
| FR50 | Rune de Protection | Protection Rune | 1 | BONUS : EFFACE le malus de toutes les cartes. | CLEAR: every card. |

### 5.12 JOKER ✅ names

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| FR51 | Métamorphe | Shapeshifter | 0 | Peut copier le nom et la famille de n'importe quel Artefact, Seigneur, Sorcier, Arme ou Créature (☠ ou Mort-vivant) du jeu. N'appliquez ni le bonus, ni le malus, ni la force de base de la carte copiée. | Choice: takes name + family of any eligible card in the game (hand or not), or a generic card of an eligible family, or stays unused (family JOKER). Strength stays 0; no bonus, no malus. |
| FR52 | Mirage | Mirage | 0 | Peut copier le nom et la famille de n'importe quel Terrain, Armée, Climat, Vague ou Flamme (☠ ou Bâtiment) du jeu. N'appliquez ni le bonus, ni le malus, ni la force de base de la carte copiée. | Same as Métamorphe with families TERRAIN, ARMEE, CLIMAT, VAGUE, FLAMME (☠ + BATIMENT). |
| FR53 | Doppelgänger | Doppelgänger | 0 | Peut copier le nom, la force de base, la famille et le malus MAIS PAS LE BONUS de n'importe quelle autre carte de votre main. | Choice: another card in hand. Takes its name, strength, family (families) and malus (including BLANKS / self-mask). Not its bonus (so not its EFFACE effects either). |

### 5.13 BÂTIMENT ☠ (extra families only) — names ✅, texts 🟡

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| CH16 | Beffroi (Bâtiment) | Bell Tower | 8 | BONUS : +15 avec n'importe quel Sorcier ou Mort-vivant. | Replaces FR03 in this mode. bonus = `has(SORCIER)\|\|has(MORT_VIVANT) ? 15 : 0`. |
| CH01 | Donjon | Dungeon | 7 | BONUS : +10 chacun pour le premier Mort-vivant, la première Créature et le premier Artefact. +5 pour chaque carte supplémentaire de ces familles et pour le Nécromancien, le Démoniste et le Démon. | For F in {MORT_VIVANT, CREATURE, ARTEFACT}: if `count(F) ≥ 1` → `+10 + 5*(count(F)-1)`. Plus `+5` for each of Nécromancien, Démoniste, Démon present (by name). |
| CH02 | Château | Castle | 10 | BONUS : +10 chacun pour le premier Seigneur, la première Armée, le premier Terrain et le premier autre Bâtiment. +5 pour chaque Bâtiment supplémentaire. | `+10` each if has(SEIGNEUR), has(ARMEE), has(TERRAIN). `n = countOther(BATIMENT)`: if n ≥ 1 → `+10 + 5*(n-1)`. |
| CH03 | Crypte | Crypt | 21 | BONUS : La somme des forces de base de tous les Morts-vivants. MALUS : MASQUE tous les Seigneurs. | bonus = Σ strength of active MORT_VIVANT cards. BLANKS: SEIGNEUR. |
| CH04 | Chapelle | Chapel | 2 | BONUS : +40 si vous avez exactement 2 cartes parmi les familles suivantes : Seigneur, Sorcier, Extérieur, Mort-vivant. | bonus = `count(SEIGNEUR)+count(SORCIER)+count(EXTERIEUR)+count(MORT_VIVANT) == 2 ? 40 : 0`. ✅ Q&A: it is the **combined** total that must equal exactly 2 (2 Seigneurs OK; 1 Extérieur + 1 Mort-vivant OK; 2 Sorciers + 1 Mort-vivant NOT OK). |

### 5.14 EXTÉRIEUR ☠ — names ✅, texts 🟡

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| CH06 | Génie | Genie | **−50** | BONUS : +10 par autre joueur. À la fin de la partie, regardez les cartes de la pioche et prenez-en une dans votre main (après le Leprechaun). | bonus = `10*(playerCount-1)`. Extra card (+1 hand size). **Needs the player count input.** |
| CH07 | Juge des âmes | Judge | 11 | BONUS : +10 pour chaque carte contenant un malus qui n'a pas été EFFACÉ. | bonus = `10 ×` number of active cards (other than cursed items) that have a MALUS section and `!penaltyCleared`. ✅ Q&A: a **partially** cleared malus (word "Armée" cleared by Éclaireurs / Navire de guerre) still counts. A malus that is present but not triggered (e.g. Chevaliers with a Seigneur) still counts. |
| CH08 | Ange | Angel | 16 | BONUS : Empêche une autre carte d'être MASQUÉE. Cette carte ne peut jamais être MASQUÉE. | Choice: one other card becomes unmaskable. Ange itself is unmaskable. |
| CH09 | Leprechaun | Leprechaun | 20 | BONUS : À la fin de la partie, tirez la prochaine carte de la pioche et ajoutez-la à votre main (avant le Génie). | No points. Extra card (+1 hand size). |
| CH10 | Démon | Demon | 45 | MALUS : Pour chaque carte qui n'est pas un Extérieur : si c'est la seule carte que vous avez de cette famille, elle est MASQUÉE. Ceci est résolu avant tout autre MASQUE. | Step 4. Uses the family counts of the whole hand after step 1 (before any masking). Protected cards (Ange + target, undead with Liche/Nécromancien, Phénix) are skipped. Clearable (e.g. Rune de Protection). An unused joker is alone in family JOKER → masked. |

### 5.15 MORT-VIVANT ☠ — names ✅, texts 🟡

These cards score from the **discard area**. The app must let the user enter the final discard area (after any Nécromancien pick). ✅ Cards covered by the cursed item *Chambre forte* still count.

| ID | Nom | EN | Force | Texte (FR) | Logic |
|---|---|---|---|---|---|
| CH11 | Reine des Ténèbres | Dark Queen | 10 | BONUS : +5 pour chaque Terrain, Vague, Flamme, Climat et pour la Licorne dans la zone de défausse. | bonus = `5*(disc(TERRAIN)+disc(VAGUE)+disc(FLAMME)+disc(CLIMAT)+(Licorne in discard ? 1 : 0))`. |
| CH12 | Goule | Ghoul | 8 | BONUS : +4 pour chaque Sorcier, Seigneur, Armée, Créature et Mort-vivant dans la zone de défausse. | bonus = `4*(disc(SORCIER)+disc(SEIGNEUR)+disc(ARMEE)+disc(CREATURE)+disc(MORT_VIVANT))`. |
| CH13 | Spectre | Specter | 12 | BONUS : +6 pour chaque Sorcier, Artefact et Extérieur dans la zone de défausse. | bonus = `6*(disc(SORCIER)+disc(ARTEFACT)+disc(EXTERIEUR))`. |
| CH14 | Liche | Lich | 13 | BONUS : +10 pour le Nécromancien et pour chaque autre Mort-vivant. Les Morts-vivants ne peuvent pas être MASQUÉS. | bonus = `(hasName(Nécromancien) ? 10 : 0) + 10*countOther(MORT_VIVANT)`. Protection: MORT_VIVANT unmaskable. |
| CH15 | Chevalier de la Mort | Death Knight | 14 | BONUS : +7 pour chaque Arme et Armée dans la zone de défausse. | bonus = `7*(disc(ARME)+disc(ARMEE))`. |

⚠️ Phénix in the discard area: default = counts only as CREATURE (printed family, reference implementation). RAW could argue it also counts as Flamme/Climat for the Reine des Ténèbres. Keep configurable.

---

## 6. Official Q&A and rulings (must be honoured) ✅

1. **Resolution order**: Doppelgänger → Mirage → Métamorphe → Livre des mutations → clearing (EFFACER) → apply maluses starting with cards not masked by other cards.
2. **Clearing before masking** — rulebook example: hand = Blizzard, Inondation, Feu de forêt, Caverne. The Caverne clears the Blizzard's malus. The Blizzard no longer masks the Inondation, so the Inondation masks the Feu de forêt **and** the Caverne. The Caverne is masked but **has already cleared** the Blizzard. Active: Blizzard + Inondation → **62**. Without the Caverne: the Blizzard masks the Inondation, the Feu de forêt stays active → **65**.
3. **Doppelgänger copying Basilic**: both mask each other → both masked (unless a card clears their malus).
4. **Livre des mutations** changes only the family, before any other bonus/malus; name, strength, bonus, malus unchanged; bonuses naming the card still apply.
5. **Éclaireurs vs Feu de forêt**: the Feu de forêt's text does not contain the word "Armée", so Éclaireurs do not protect Armies from it.
6. **Mirage / Métamorphe** may copy any card of the allowed families in the game, including cards not in hand; may copy only a family ("generic Arme"); strength stays 0 (useful for Gemme de Loi runs); may also choose not to copy.
7. **Rulebook example 1 = 260 pts**: Montagne, Inondation, Fumée, Tornade, Élémental d'Air, Feu de forêt, Mirage (copies Orage). The fake Orage has no malus so it does not mask the Feu de forêt; the Montagne clears the Inondation so the Feu de forêt is not masked; the Élémental d'Air gets +45 (Fumée, Tornade, fake Orage).
8. **Rulebook example 2 = 380 pts**: Beffroi, Chandelle, Reine, Épée de Keth, Bouclier de Keth, Gemme de Loi, Livre des mutations (turns any card except the Reine into a Sorcier, e.g. the Gemme de Loi).
9. **Gemme de Loi**: no extra bonus in 8-card hands (max +150).
10. **Juge des âmes**: partially cleared maluses still count.
11. **Chapelle**: exactly 2 cards across the 4 listed families combined.
12. **Extra-card draws** (Génie, Leprechaun, Nécromancien, Portail) happen before any masking, Doppelgänger, etc., and before Undead scoring. Leprechaun resolves before Génie. Max 9 cards in hand (8 in "Objets maudits without extra families").

---

## 7. Tricky interactions & community rulings

Beyond §6, the engine must get these right (derived from card texts + reference implementation tests):

1. Masked cards count for nothing: a masked Seigneur does not satisfy the Chevaliers, a masked Vague does not keep the Navire de guerre active, etc.
2. Every "MASQUÉ sauf avec / avec / par" text is a **malus**, hence clearable: Rune de Protection makes Fumée, Navire, Dirigeable, Jardin and Phénix never self-mask; Caverne protects Fumée (Climat); Montagne protects nothing here but stops the Inondation masking.
3. Clearing effects still apply when their source is masked (Caverne example; Île masked by Blizzard still clears the Feu de forêt; Navire masked by the Démon still clears the word Armée on Vagues).
4. The word "Armée" clearing (Éclaireurs, Navire for Vagues) affects: Inondation's and Basilic's masking of Armies, Marécage's and Blizzard's Army penalties, Infanterie naine's penalty, Dirigeable's condition (⚠️). It does **not** affect Chevaliers, Cavalerie légère or Feu de forêt.
5. Feu de forêt's exceptions by **name** (Montagne, Inondation, Île, Licorne, Dragon) also protect a joker that copied that name; exceptions by **family** protect a card turned into that family by the Livre des mutations.
6. Doppelgänger copying an elemental: it counts as another card of that family, e.g. Élémental d'Eau + Doppelgänger(→Élémental d'Eau) = 23 (the real one gets +15; the copy gets no bonus).
7. Doppelgänger copying Infanterie naine: both lose 2 → 26.
8. Collectionneur ignores duplicate names (Bouclier de Keth + Métamorphe→Bouclier + Doppelgänger→Bouclier = one name).
9. Phénix (Deluxe): counts for Enchanteresse twice, for Blizzard's penalty twice, makes Fumée active (it is a Flamme), blocks Arbre-Monde if another Climat/Flamme/Créature is present, is never masked by Démon, Basilic, Orage, Inondation's "MASQUE" (but masks itself with any Vague).
10. ⚠️ **Phénix + Dresseur + a Vague**: the Dresseur clears all Créature maluses, and the Phénix's "MASQUÉ avec une Vague" is a malus → by strict RAW the Phénix stays active (e.g. Inondation + Phénix + Dresseur = 64). The reference implementation's test expects the Phénix masked (= 41). Default: **RAW (64)**, configurable.
11. ⚠️ Masking cycles (A masks B masks C masks A): all cards in the cycle are masked (community interpretation).
12. Self-conditional order (§4 step 6) matters: e.g. Phénix + Fumée + Inondation (no other Flamme): the Phénix masks itself first, so the Fumée has no Flamme and masks itself too.
13. Démon counts families after jokers/Livre des mutations (a Livre can rescue a lonely card by giving it the family of another card).

---

## 8. Objets maudits (Cursed items) — only with the "Objets maudits" module

Cursed items are a **separate deck** (different card backs). They are never in the hand. During the game, a used item is turned **face down** in front of the player. **At the end, every face-down item adds its printed value** (mostly negative) to the score. The one face-up (unused) item does not count. ✅

The app only needs: which items are face-down, the player count (Longue-vue) and nothing else — item effects happen during play. Effect texts are included for tooltips.

Names 🟡 (except the 3 ✅), values 🟡 (verify on cards). Timing: *N'IMPORTE QUAND* (any time) / *REMPLACEZ VOTRE TOUR* (replaces your turn) / *APRÈS VOTRE TOUR* (after your turn) / *COMME LA CARTE COPIÉE*.

| ID | Nom (FR) | EN | Valeur face cachée | Timing | Effet (résumé FR) | Scoring note |
|---|---|---|---|---|---|---|
| CH24 | Longue-vue | Spyglass | −1 (−10 à 2 joueurs) | N'importe quand | Regardez la main d'un autre joueur. | `playerCount == 2 ? -10 : -1` |
| CH25 | Sarcophage | Sarcophagus | **+5** | Remplacez votre tour | Mettez la première carte de la pioche dans la défausse et terminez votre tour. | |
| CH26 | Bandeau | Blindfold | **+5** | Remplacez votre tour | Défaussez d'abord, puis piochez. | |
| CH27 | Livre des prophéties | Book of Prophecy | −1 | N'importe quand | Regardez les 7 dernières cartes de la pioche. | |
| CH28 | Boule de cristal | Crystal Ball | −1 | N'importe quand | Choisissez une famille ; les autres joueurs révèlent leurs cartes de cette famille. | |
| CH29 | Charette de Marchand (ex-Carriole) | Market Wagon | −2 | Remplacez votre tour | Proposez un échange d'une carte aux autres joueurs. | Name to verify |
| CH30 | Sac à dos | Backpack | −2 | N'importe quand | Piochez 3 Objets maudits pour vos 3 prochains remplacements. | |
| CH31 | Pelle | Shovel | −2 | N'importe quand | Mettez une carte de la défausse sous la pioche. | |
| CH32 | Chambre forte | Sealed Vault | −4 | N'importe quand | Couvrez 2 cartes de la défausse : elles ne peuvent plus être prises mais comptent pour les Morts-vivants. | Covered cards stay in the discard input |
| CH33 | Lunettes de cristal | Crystal Lens | −2 | N'importe quand | Regardez la première carte de la pioche avant de choisir où piocher. | |
| CH34 | Gants de voleur ✅ | Larcenous Gloves | −3 | N'importe quand | Volez et utilisez l'Objet maudit face visible d'un autre joueur. | |
| CH35 | Plan de la décharge ✅ | Junkyard Map | −3 | N'importe quand | Rejouez un des 3 derniers Objets maudits défaussés. | |
| CH36 | Bottes ailées | Winged Boots | −4 | N'importe quand | Mettez la première carte de la pioche dans la défausse. | |
| CH37 | Bâton de transmutation | Staff of Transmutation | −4 | Remplacez votre tour | Échangez 3 à 8 cartes de votre main avec le dessus de la pioche. | |
| CH38 | Râteau | Rake | −4 | Remplacez votre tour | Prenez 2 cartes de la défausse puis défaussez-en 2. | |
| CH39 | Coffre au trésor | Treasure Chest | −5 | N'importe quand | Vaut +25 en fin de partie si vous avez au moins 3 **autres** Objets maudits face cachée. | `-5 + (otherFaceDown >= 3 ? 25 : 0)` |
| CH40 | Hameçon | Fishhook | −6 | Remplacez votre tour | Piochez 2 cartes, puis défaussez-en 2. | |
| CH41 | Couteau nain (nom à vérifier) | Repair Kit | −6 | Comme la carte copiée | Copiez un Objet maudit déjà joué (sauf Sac à dos, Sarcophage, Bandeau, Coffre au trésor). | |
| CH42 | Sablier | Hourglass | −7 | Après votre tour | Jouez un tour supplémentaire. | |
| CH43 | Miroir doré | Gold Mirror | −8 | N'importe quand | Échangez 3 cartes de la défausse avec les 3 premières de la pioche. | |
| CH44 | Chaudron | Cauldron | −9 | Remplacez votre tour | Piochez 3 cartes, replacez-en 2 sur/sous la pioche, puis défaussez normalement. | |
| CH45 | Lanterne | Lantern | −10 | Remplacez votre tour | Cherchez une carte d'une famille choisie dans la pioche (max 10 cartes). | |
| CH46 | Portail ✅ | Portal | −20 | N'importe quand | Ne défaussez pas ce tour-ci (vous aurez une carte de plus en main). | +1 hand size |
| CH47 | Anneau de souhait | Wishing Ring | −30 | N'importe quand | Choisissez la carte du dessus de la pioche, puis remélangez. | |

---

## 9. Product requirements (PM notes)

### 9.1 Inputs

| Input | When needed | Notes |
|---|---|---|
| Mode toggles | always | Recommended: two toggles, **Familles supplémentaires** and **Objets maudits** (the Deluxe rules allow each independently), plus **Cartes promo** (on by default for Deluxe owners). A preset selector "Base / Trésor maudit complet" can hide the toggles for most users. |
| Hand (7–9 cards) | always | Card picker with accent-insensitive search ("elementa" → Élémental…), grouped by family with family colours. Only show cards of the active mode (e.g. the right Beffroi). |
| Choices for joker/Livre/Île/Ange | optional | Auto-optimised by default; user can override (house rule, or to reproduce what was declared at the table). |
| Discard area | only if a Mort-vivant is in hand | Multi-select of cards not in the hand. Hide the input otherwise. |
| Player count | if Génie or Longue-vue | Ask once per game session. |
| Face-down cursed items | if Objets maudits enabled | Multi-select of items. |

### 9.2 Outputs

- Total score, big and clear.
- Per-card breakdown mirroring the paper score sheet: *Base / Bonus-Malus / Sous-total*, with badges **MASQUÉE**, **malus effacé**, and the chosen option (e.g. "Mirage → Orage").
- Short explanation lines for the non-obvious ones ("Feu de forêt masqué par l'Inondation").
- Cursed items line ("Objets maudits / points supplémentaires").
- Tie-break value (sum of base strengths).

### 9.3 Things easily forgotten

- Same physical name, two cards: Beffroi (Terrain vs Bâtiment) — pick by mode.
- Cards whose text changes with the extra families (☠): Source de vie, Inondation, Éclaireurs, Nécromancien, Arbre-Monde, Métamorphe, Mirage. Model them as one card with mode-dependent logic (the reference implementation instead swaps card objects: its IDs CH17–CH23 are these variants).
- Negative base strength (Génie −50).
- The same card can't appear twice in a hand (all cards are unique), but jokers can create duplicate **names**.
- Validation should warn, not block (players sometimes want to test hands).
- A multi-player session (enter each player's hand, rank, handle ties) is a cheap, high-value extension.
- Offline-first: the app is used at the table.

### 9.4 Suggested data model

Keep card data declarative and the per-card logic in code, keyed by ID:

```json
{
  "id": "FR08",
  "name": "Inondation",
  "nameEn": "Great Flood",
  "families": ["VAGUE"],
  "strength": 32,
  "module": "BASE",
  "hasBonus": false,
  "hasPenalty": true,
  "textFr": "MALUS : MASQUE toutes les Armées, tous les Terrains sauf la Montagne, et toutes les Flammes sauf l'Éclair.",
  "textFrExt": "☠ + tous les Bâtiments.",
  "choice": null
}
```

- `module`: `BASE` | `PROMO` | `EXT_FAMILIES` | `CURSED_ITEM`.
- `choice`: `null` | `DOPPELGANGER` | `MIRAGE` | `SHAPESHIFTER` | `BOOK` | `ISLAND` | `ANGEL`.
- Special modes: `onlyInBaseMode: true` (FR03 Beffroi Terrain), `onlyInExtMode: true` (CH16 Beffroi Bâtiment and all CH01–CH15).
- Logic registry: `bonus(ctx)`, `penalty(ctx)`, `blanks(target, ctx)`, `selfBlanked(ctx)`, `clears(target) -> 'ALL' | 'ARMY_WORD' | null`, `protects(target)`.

---

## 10. Acceptance tests

All tests verified against the reference implementation (except the ⚠️ case in §7.10, excluded). Mode: **B** = base (promos allowed), **☠** = extra families enabled. Player count = 4 unless noted. Choices are forced as given (they are also the optimal ones unless stated).

### 10.1 Base game

| # | Hand | Choices | Expected | What it checks |
|---|---|---|---|---|
| 1 | Blizzard, Inondation, Archers Elfes | — | 35 | Blizzard masks Inondation |
| 2 | Fumée, Infanterie naine, Dirigeable | — | 50 | Fumée masked → Dirigeable active |
| 3 | Chandelle, Fumée, Infanterie naine, Dirigeable | — | 44 | Fumée active → Dirigeable masked |
| 4 | Chevaliers, Infanterie naine, Éclaireurs, Roi, Reine, Épée de Keth, Bouclier de Keth | — | 265 | Roi+Reine, word Armée cleared |
| 5 | Source de vie, Marécage, Inondation, Île, Élémental d'Eau, Orage, Collectionneur | — | 326 | Collectionneur 5 Vagues |
| 6 | Forge, Archers Elfes, Roi, Reine, Épée de Keth, Bouclier de Keth, Gemme de Loi | — | 351 | Gemme de Loi run |
| 7 | Montagne, Inondation, Fumée, Tornade, Élémental d'Air, Feu de forêt, Mirage | Mirage → Orage | 260 | Rulebook example 1 |
| 8 | Beffroi, Chandelle, Reine, Épée de Keth, Bouclier de Keth, Gemme de Loi, Livre des mutations | Livre: Gemme de Loi → Sorcier | 380 | Rulebook example 2 |
| 9 | Beffroi, Chandelle, Nécromancien, Destrier, Épée de Keth, Bouclier de Keth, Gemme de Loi, Livre des mutations | Livre: Beffroi → Seigneur | 397 | 8-card hand (known best base hand) |
| 10 | Caverne, Beffroi, Élémental de Terre, Chandelle, Collectionneur, Nécromancien, Gemme de Loi, Livre des mutations | Livre: Chandelle → Terrain | 388 | |
| 11 | Beffroi, Chandelle, Nécromancien, Reine, Épée de Keth, Bouclier de Keth, Gemme de Loi, Livre des mutations | Livre: Beffroi → Armée | 388 | |
| 12 | Nécromancien, Démoniste, Roi, Reine, Chef de guerre, Impératrice, Métamorphe, Doppelgänger | Métamorphe → Roi ; Doppelgänger → Démoniste | −74 | Negative total (forced, non-optimal choices) |
| 13 | Basilic, Doppelgänger | Doppelgänger → Basilic | 0 | Mutual masking |
| 14 | Infanterie naine, Doppelgänger | Doppelgänger → Infanterie naine | 26 | Doppelgänger copies malus |
| 15 | Île, Blizzard, Feu de forêt, Basilic | Île → Feu de forêt | 95 | Île clears even when masked |
| 16 | Élémental d'Eau, Doppelgänger | Doppelgänger → Élémental d'Eau | 23 | Copy counts as other Vague, no bonus |
| 17 | Collectionneur, Dresseur, Enchanteresse, Licorne, Destrier, Dragon, Hydre | — | 193 | Collectionneur multiple sets |
| 18 | Collectionneur, Bouclier de Keth, Gemme de Loi, Métamorphe, Doppelgänger | Métamorphe → Bouclier de Keth ; Doppelgänger → Bouclier de Keth | 20 | Duplicate names ignored |
| 19 | Archers Elfes, Roi, Licorne, Épée de Keth, Arc elfique, Bouclier de Keth, Gemme de Loi | — | 206 | Gemme: multiple runs |
| 20 | Bouclier de Keth, Gemme de Loi, Caverne, Élémental de Terre, Éclaireurs, Reine | — | 105 | Gemme: two identical runs |
| 21 | Feu de forêt, Livre des mutations, Orage, Blizzard | Livre: Blizzard → Vague | 11 | Blanking I |
| 22 | Blizzard, Inondation, Feu de forêt, Livre des mutations | Livre: Blizzard → Créature | 3 | Cycle → all masked |
| 23 | Livre des mutations, Navire de guerre, Basilic, Chevaliers | Livre: Basilic → Vague | 73 | |
| 24 | Livre des mutations, Navire de guerre, Infanterie naine, Archers Elfes | Livre: Infanterie naine → Vague | 56 | |
| 25 | Livre des mutations, Navire de guerre, Source de vie, Inondation, Archers Elfes | Livre: Inondation → Sorcier | 82 | |
| 26 | Inondation, Blizzard, Feu de forêt | — | 65 | Rulebook Q&A (no Caverne) |
| 27 | Caverne, Inondation, Blizzard, Feu de forêt | — | 62 | Rulebook Q&A (with Caverne) |
| 28 | Caverne, Inondation, Blizzard, Feu de forêt, Livre des mutations | Livre: Blizzard → Créature | 9 | Cycle + Caverne |
| 29 | Livre des mutations, Navire de guerre, Dirigeable, Cavalerie légère, Élémental d'Air | Livre: Dirigeable → Vague | 24 | |
| 30 | Livre des mutations, Navire de guerre, Dirigeable | Livre: Dirigeable → Vague | 61 | ⚠️ Army word cleared ⇒ Dirigeable needs no Army |
| 31 | Livre des mutations, Dirigeable, Éclaireurs | Livre: Éclaireurs → Terrain | 53 | same |
| 32 | Chevaliers, Dirigeable, Fumée | — | 47 | Order independence |
| 33 | Doppelgänger, Impératrice, Roi | Doppelgänger → Impératrice | 18 | Copied malus counts the other Seigneurs |
| 34 | Bouffon, Éclair, Épée de Keth, Forge, Gemme de Loi | — | 103 | Bouffon +50 (all odd) |
| 35 | Bouffon, Éclair, Épée de Keth, Caverne | — | 33 | Bouffon +3 per other odd |

### 10.2 Phénix (promo, Deluxe version)

| # | Hand | Choices | Expected | What it checks |
|---|---|---|---|---|
| 36 | Phénix, Basilic, Feu de forêt, Orage, Ange ☠, Livre des mutations | Ange → Feu de forêt ; Livre: Basilic → Sorcier | 116 | Phénix not masked by other cards |
| 37 | Phénix, Démon ☠ | — | 59 | Not masked by Démon |
| 38 | Phénix, Démon, Forge, Élémental d'Air ☠ | — | 87 | Phénix's extra families rescue lone cards |
| 39 | Phénix, Dirigeable, Archers Elfes | — | 59 | Phénix does not mask the Dirigeable |
| 40 | Phénix, Caverne, Source de vie, Élémental d'Air, Archers Elfes, Collectionneur, Orage | — | 114 | Counts as Climat |
| 41 | Phénix, Fumée, Élémental de Feu, Chandelle, Collectionneur | — | 94 | Counts as Flamme |
| 42 | Phénix, Élémental de Feu, Chandelle, Collectionneur, Éclair, Élémental d'Air, Tornade, Fumée | — | 252 | Both at once |
| 43 | Phénix, Enchanteresse | — | 29 | Double count |
| 44 | Phénix, Blizzard | — | 34 | Double penalty |
| 45 | Phénix, Arbre-Monde, Élémental d'Air | — | 35 | Blocks Arbre-Monde |
| 46 | Phénix, Élémental de Feu, Élémental d'Air, Métamorphe, Doppelgänger, Collectionneur, Dresseur | Métamorphe → Phénix ; Doppelgänger → Phénix | 109 | Copies are only Créature |

### 10.3 Extra families (☠) and cursed items

| # | Hand | Other inputs | Expected | What it checks |
|---|---|---|---|---|
| 47 | Démon, Navire de guerre, Élémental d'Eau, Marécage, Archers Elfes, Cavalerie légère | — | 114 | Navire masked by Démon but still clears the word Armée |
| 48 | Ange, Reine, Basilic | Ange → Reine | 57 | Ange protection |
| 49 | Donjon, Liche, Chevalier de la Mort, Basilic, Bouclier de Keth, Gemme de Loi, Démoniste | empty discard | 158 | Donjon counting |
| 50 | Château, Chapelle, Beffroi (Bâtiment), Roi, Chevaliers, Montagne | — | 107 | Château; Chapelle fails (1 card) |
| 51 | Crypte, Liche, Goule, Roi, Impératrice | empty discard | 73 | Crypte masks Seigneurs |
| 52 | Jardin, Roi, Licorne, Destrier, Goule | empty discard | 45 | Jardin masked by an Undead |
| 53 | Jardin, Roi, Licorne, Destrier | — | 81 | Jardin active |
| 54 | Juge des âmes, Chevaliers, Dragon, Marécage, Cavalerie légère | — | 82 | Juge counts un-triggered maluses |
| 55 | Juge des âmes, Chevaliers, Éclaireurs, Infanterie naine, Marécage | — | 91 | Partially cleared maluses count |
| 56 | Génie, Montagne, Caverne | 6 players | 15 | Génie −50 + 50 |
| 57 | Génie, Montagne, Caverne | 2 players | −25 | |
| 58 | Reine des Ténèbres, Goule, Spectre, Chevalier de la Mort, Nécromancien | discard = Montagne, Inondation, Licorne, Roi, Baguette magique, Chevaliers, Juge des âmes, Collectionneur | 104 | Discard-based scoring |
| 59 | Démon, Leprechaun, Roi, Reine, Chevaliers, Archers Elfes, Feu de forêt | — | 194 | Démon masks the lone Feu de forêt before it masks anything |
| 60 | Feu de forêt, Nécromancien, Liche, Spectre | empty discard | 88 | Undead unmaskable |
| 61 | Démon, Ange, Roi, Chevaliers, Archers Elfes | Ange → Roi | 114 | Ange vs Démon |
| 62 | Arbre-Monde, Montagne, Éclair, Chevaliers, Collectionneur | — | 111 (91 if Arbre-Monde is +50) | Arbre-Monde value, see §0.4 |
| 63 | Roi, Reine, Chevaliers + face-down: Coffre au trésor, Longue-vue, Sarcophage, Portail | 4 players | 78 | Coffre +25 with 3 others |
| 64 | Roi, Reine, Chevaliers + face-down: Coffre au trésor, Longue-vue, Sarcophage | 2 players | 64 | Coffre without bonus, Longue-vue −10 |

---

## 11. Suggested build plan for the agent

1. Encode the card data (§5, §8) as JSON; encode per-card logic in a registry keyed by ID.
2. Implement the engine exactly as §4 with a per-card trace (for the breakdown UI and for debugging).
3. Run all tests of §10 as automated unit tests before any UI work.
4. Add the choice optimiser (§4.2) with pruning; re-run tests with **auto** choices and assert the score is ≥ the forced-choice score (except test 12, which uses deliberately bad choices).
5. Build the UI (§9): mode presets, card picker, conditional inputs, breakdown.
6. Keep all ⚠️ rulings behind a small config object so the product owner can switch them.
