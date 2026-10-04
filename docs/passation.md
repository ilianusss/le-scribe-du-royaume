# Passation - Le Scribe du Royaume

Handoff notes for the next agent. Read `CLAUDE.md` first (rules, stack, layout, workflow), then this file. The two specs in `docs/` remain the sources of truth; this file only says where the work stands and what is not obvious from the code.

Last updated: 2026-10-04.

## 1. State in one paragraph

All four build phases of the original brief are done (setup, data + engine, search + flow, screens, vitrail + motion), plus several product changes requested afterwards (player-made choices for every choice card, a multi-player game mode with ranking and required player names, extension modules, a hand recap instead of a per-player score in a game). Checks at the last change: `npx jest` 159 tests pass, `npx tsc --noEmit` clean, `npx expo lint` clean. Every flow was walked on web (headless Chrome, iPhone-size viewport) with no console errors. Nothing has been run on an iPhone yet (no Xcode on the dev machine).

## 2. How to work here

- Workflow from `CLAUDE.md`: investigate, share a short plan and wait for the go-ahead on non-trivial changes, implement in small steps, run tests + type-check + lint, verify on web, report honestly.
- The user writes in French lately; answer in French. Player-facing text is French and must match UI spec §A11.
- Git: never `git add` / commit / push unless explicitly asked. When asked, commit messages are `feat|fix|chore: <short explanation>` and never include a co-author line. Do not use `git rm --cached` or anything that touches the index without permission (it happened once by mistake).
- No emojis; only regular dashes (`-`) in anything you write.
- rtk is installed and its hook is active: shell commands are rewritten. Some rtk filters swallow output or reject flags (e.g. `find -delete`, `ls -la`); use `rtk proxy <cmd>` to get the raw command.
- Prefer exit codes over grepping output when checking (`npx tsc --noEmit >/dev/null 2>&1; echo $?`).

### Web verification recipe (no browser tool is built in)

1. Start the dev server **without** `CI=1` (with `CI=1` Metro does not watch files and serves stale code): `npx expo start --web --port 8099` in the background, then poll `http://localhost:8099` until 200. Starting the server also regenerates the typed routes in `.expo/types` (new route files give TS errors until then).
2. In the session scratchpad (never in the project): `npm init -y && npm i playwright-core`, then drive the installed Google Chrome with `chromium.launch({ channel: 'chrome' })` at 390 x 844.
3. Gotchas: Expo Router keeps previous screens mounted (hidden), so target visible elements only (`input[placeholder^="Tape le nom d"]:visible`, `text=points >> visible=true`). The result total counts up for about 1.2 s: wait ~1.8 s before reading it. `fill()` does not show the real focus style; use `click()` + `type()` to check focus.
4. Stop the server (`pkill -f "expo start --web --port 8099"`) and delete scratch files before finishing.

## 3. Architecture (where things are)

- `src/data/cards.ts`: 71 cards with ID, name, `nameWithArticle` (le / la / l' / les, used in result reasons), families, strength, module, texts. `Mode` = `BASE | CURSED | FAMILIES | FULL`; always use `hasExtraFamilies(mode)` / `hasCursedItems(mode)`. `cardPool`, `modeFamilies`, `HAND_SIZE`.
- `src/data/cursedItems.ts`: 24 cursed items.
- `src/engine/` (pure TS):
  - `score.ts`: `scoreHand(hand, context, choices)` follows reference §4 step by step; returns total, per-card trace, cursed items, tie-break. `cursedValue`, `canJokerCopy`, `jokerFamilies`, `clearsPenalty` (the step-2 clearing rules of the Montagne, the Caverne, the Dresseur and the Rune de Protection, also used by the flow to narrow the Île's targets).
  - `cardLogic.ts`: per-card rules keyed by ID (`BONUS`, `MALUS`, `BLANKS`, `SELF_MASK` returning a `MaskReason`, `ARMY_WORD_MALUS`).
  - `types.ts`: `Choices` (doppelganger, mirage, shapeshifter, book, island, angel), `CardTrace` (`maskReason`, `clearedBy`, `armyWordClearedBy`, `familyChangedBy`, `chosen`), `ScoreResult`.
  - `rulings.ts`: the six rulings of `CLAUDE.md`.
  - There is **no optimiser** any more: every choice is made by the player and passed in `Choices`.
- `src/search/`: `normalise` (accents, apostrophes, hyphens) and `suggest` (prefix > word prefix > contains, max 6, match range for bold).
- `src/flow/`:
  - `session.ts`: one player's `ScoringSession` and `sessionReducer` (hand, cursed items, bonus card, joker / book / island / angel answers, player count, discard, optional `GameContext`). `prune` clears answers that no longer apply after any change. `scoreSession` builds the engine call. `sessionDiscard` merges the game's shared discard with the player's.
  - `steps.ts`: step order `MODE HAND CURSED BONUS JOKERS BOOK ISLAND ANGEL CONTEXT RECAP RESULT` (`RECAP` only in a game, `RESULT` only outside one), guards (`shownSteps`, `nextStep`, `previousStep`, `canContinue`), target lists (`bonusPool`, `jokerTargets`, `bookTargets`, `bookFamilies`, `islandTargets`, `angelTargets`), `familiesAfterChoices`, `hasPenaltyAfterChoices`, `asksPlayerCount`, `neededDiscardFamilies`.
  - `game.ts`: `AppState { session, game }`, `appReducer` (all session actions + `START_GAME`, `NEXT_PLAYER`, `PREVIOUS_PLAYER`, `NEW_GAME`, `END_GAME`), `gameContext` (player count, cards and cursed items already used, shared discard), `playerName`, `standings` (total desc, then lowest total base strength, equal again = shared rank).
- `src/ui/`: `theme.ts` tokens, `copy.ts` (all French strings), `SessionProvider.tsx` (context on `appReducer`, `STEP_ROUTES`, `goNext`, `goBack`), shared components: `Screen` (safe area, keyboard, lattice backdrop), `Header` (auto "Nom · n sur N" eyebrow in a game), `Button`, `CardSearch`, `SuggestionRow`, `Stepper`, `SegmentedControl`, `ConfirmDialog`, `Pane` (arch SVG, family glass, joker gradient, Phénix split, crack, fill and reveal animations, `copyOf` / `asFamily` overrides), `Vitrail`, `ArchWindow`, `TargetChoice` (shared screen for Île and Ange), `FamilyIcon`, `cardDisplay.ts` (`cardNameWithChoice` formats « Mirage → Orage » for the recap and the result), `pressable.ts` (web press state type).
- `src/app/` routes: `index` (Accueil), `modules` (Le Trésor maudit), `setup` (Une main / Une partie, player count, names), `hand`, `cursed`, `bonus`, `jokers`, `book`, `island`, `angel`, `end` (Fin de partie), `recap` (Récapitulatif, game only), `result` (une main, and read-only `?player=n` from the ranking), `ranking`.

### Navigation model

- Steps are pushed in order; back pops (`goBack`). Hand screen disables the iOS swipe-back (it confirms « Abandonner cette main ? » when cards were entered).
- Result: « Nouvelle main » / « Modifier la main » use `router.dismissTo('/hand')`.
- Game: the hand ends on `/recap`, never on `/result`. « Joueur suivant » dispatches `NEXT_PLAYER` then `dismissTo('/hand')`, so the stack stays short. Back from a later player's hand dispatches `PREVIOUS_PLAYER` and pushes `/recap` (the in-progress hand of that player is lost, hence the confirmation). Last player: `NEXT_PLAYER` then push `/ranking`; back from the ranking dispatches `PREVIOUS_PLAYER` then `router.back()`.

## 4. Product decisions taken with the user (not all obvious from the specs)

- Every choice card is chosen by the player, never optimised: Doppelgänger / Mirage / Métamorphe copy a named card of their eligible families or « Ne copie rien » (no "family only" copy); Livre des mutations picks a target (not the Phénix) and a new family (not Joker, not the current one) or « Ne change rien »; Île picks a Vague or Flamme (families after jokers and Livre) or « N'efface rien », the step is skipped if none; Ange picks another card or « Ne protège rien ». Order after the hand: Jokers, Livre, Île, Ange.
- Self-masking: a « MASQUE toutes les X » rule also targets its own card when it matches X (after a Livre change), unless the text says « autre(s) »; the self-edge counts as mutual masking. Reference §4.1 and tests 65 and 66 (§10.4).
- `phoenixInDiscardCountsAsFlameAndWeather` was removed: the discard screen asks family counts, a Phénix counts as a Créature.
- Result reasons and tags: « Masquée · par l'Inondation », « par son propre malus », « sans Flamme », « sans Vague », « sans Armée », « avec un Climat », « avec une Vague », « Malus effacé · par la Montagne », « Mot Armée effacé · par les Éclaireurs » (only on cards whose malus mentions Armée).
- Primary button label on every step: « Compter les points » when the next shown screen is the result, « Continuer » otherwise.
- Extension modules: after « Extension », the player picks Familles supplémentaires (8 cards), Objets maudits (7 cards) or Les deux (8 cards). The Accueil sub-line for Extension is now just « Le Trésor maudit ».
- Game mode: 2 to 6 players, **names are required** (one field per player as soon as the count is picked, « Commencer la partie » appears only once all are filled), each card and cursed item unique across players, player count never asked again, discard counts prefilled from the last entry, ranking with tie-break, read-only per-player result, « Nouvelle partie » keeps only mode, player count and names.
- In a game no score is shown before the ranking: each hand ends on the `/recap` screen (UI spec §A8b), which lists the final hand with the choices made and the cursed item names (no values, no total), and offers « Joueur suivant » / « Voir le classement », « Modifier la main » and « Abandonner la partie ». The breakdown of a hand is read afterwards from the ranking.
- Île: the screen only offers cards whose malus it can still erase (a Vague or a Flamme, after the jokers and the Livre, that has a malus not already cleared by the Montagne, the Caverne, the Dresseur or the Rune de Protection), and is skipped when there is none. Reference §4.2 and UI spec §A7d. The engine was not made stricter: `clearsPenalty` was extracted from step 2 so the flow and the engine share the same rule.
- The vitrail empty hint « Ta première carte » is commented out on purpose in `src/app/hand.tsx` (user's choice). Leave it.
- Card images folder `assets/images/` exists with `images.txt` (expected names), but images are not used anywhere (UI spec B5 forbids card scans); do not wire them unless asked.

## 5. Open items and known limitations

- Pending the user's check on physical cards (do not block): Arbre-Monde value, cursed item names / values, expansion card wording (reference §0.4).
- Microcopy written by the agent and accepted or delegated by the user: everything in §A11 marked with the setup, game, ranking, modules, jokers, book, island, angel and recap keys. The user approved most of it; island / angel / recap texts were not explicitly confirmed.
- Web-only cosmetic: the `Switch` on web shows react-native-web's default teal thumb when on (iOS uses `trackColor` / `thumbColor` correctly). Only « La Licorne est dans la défausse » still uses one.
- No persistence: quitting the app mid-game loses the game (v1 by design).
- Tapping a result row to expand an explanation is deferred (spec §A9).
- `npm audit` reports moderate issues in tooling dependencies; the user said not to run `npm audit fix` (it can break Expo SDK pins).
- `docs/trace.md` is the user's copy of an older report; parts of it are outdated (it still mentions the optimiser).
- Nothing has been tested on a device. See the checklist below.
- Engine inconsistency noticed but **not** fixed (out of scope): step 2 of `scoreHand` switches on `clearer.id`, while the bonus and malus of step 7 use `nameId`. A Doppelgänger that copies the Montagne, the Caverne, the Dresseur, the Rune de Protection, the Éclaireurs or the Navire de guerre therefore gets their bonus but not their clearing effect. Ask the user before touching it: it changes scores.

## 6. Manual checklist for an iPhone (Expo Go or a development build)

1. Fonts load (blackletter title) with no system-font flash at launch.
2. Ta main: type a card and press the keyboard's done key: the first suggestion is added and the keyboard stays open; tapping a suggestion also keeps the keyboard and the focus.
3. Each added card gives a light haptic and its pane fills from the bottom.
4. With the keyboard open, the field and at least 3 suggestions stay visible (also in landscape).
5. Tapping a filled pane highlights its row and scrolls to it.
6. Back arrow with cards entered asks « Abandonner cette main ? »; swipe-back is disabled on that screen.
7. Result: panes glow in one by one, the total counts up, a tap skips to the end; with Reduce Motion on, the final state shows directly.
8. VoiceOver announces the total; panes read « Famille : Nom, force N ».
9. Safe areas (notch, home indicator) never cover the header or the bottom button.
10. Jokers screen: tapping a Doppelgänger row does not open the keyboard and the pane changes colour; in the Mirage field, done picks the first suggestion and « Changer » brings the search back.
11. Livre screen: tap a card then a family chip; the row and the pane colour change at once.
12. Île and Ange screens: answers show at once; back from the result returns to the Ange screen with the answer kept.
13. Game mode: « Suivant » on the keyboard chains the name fields, the last one closes the keyboard, « Commencer la partie » only appears once every name is filled and stays visible above the keyboard.
14. Game mode with 3 players: the recap shows the hand and the choices with no score, « Joueur suivant », back to the previous player's recap, ranking, tap a player for the read-only result, « Nouvelle partie » keeps the names.
15. Extension modules: Objets maudits only gives 7-card hands and the cursed items screen; Familles supplémentaires only gives 8-card hands and no cursed items screen.

## 7. Commit history (main)

- `chore: docs and CLAUDE.md`, `chore: scaffold Expo SDK 57 app ...`
- `feat: card data, scoring engine and choice optimiser ...`
- `feat: card search ranking and scoring session flow ...`
- `feat: screens for mode, hand, cursed items, bonus card, end of game and result`
- `feat: stained-glass vitrail, card fill and result reveal animations, haptics`
- The commits after these (player choices, mask reasons, game mode, names, extension modules, docs) are listed by `git log`.
