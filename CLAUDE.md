# CLAUDE.md — Le Scribe du Royaume
 
Score calculator for the card game **Fantasy Realms – Édition Deluxe (French edition)**. The player picks a mode, types the cards of their final hand, answers a few conditional questions, and gets their score. The app resolves every card effect itself.
 
## Sources of truth
 
| Topic | File | Authority |
|---|---|---|
| Rules, cards, scoring engine, acceptance tests | `docs/fantasy-realms-reference.md` | Final say on anything that affects a score |
| Screens, flow, behaviour, microcopy, visual design | `docs/fantasy-realms-ui-spec.md` | Final say on anything the user sees |
 
- Read the relevant sections before working on a feature; do not load both docs fully when you only need one part.
- The UI spec was written web-first. Apply it through the React Native translation table below.
- If the code and a doc disagree, the doc wins. If a doc is ambiguous or self-contradictory, ask me.
- All player-facing text is French, exactly as in the docs (card names with accents, microcopy table in UI spec §A11).
## Stack
 
- Expo SDK 57 (React Native 0.86, React 19.2), TypeScript 6 strict, Expo Router. Target: **iOS only** (no Android). Web is kept as a **test target only**: keep `npx expo start --web` working, it is how the flow is checked without a Mac simulator.
- Styling: `StyleSheet` + the theme tokens in `src/ui/theme.ts`. No UI kit.
- Graphics: `react-native-svg` (panes, arches, crack, lattice). Icons: `lucide-react-native`.
- Motion: `react-native-reanimated`, with `useReducedMotion`.
- Fonts: bundled via `@expo-google-fonts/grenze`, `@expo-google-fonts/grenze-gotisch`, `@expo-google-fonts/alegreya-sans` (no runtime download).
- Haptics: `expo-haptics` (no-op on web).
- Tests: Jest with the `jest-expo` preset.
- Lint: ESLint 9 flat config (`eslint.config.js`, `eslint-config-expo`).
- Before adding or configuring any library, check its current docs with **context7**. Install Expo-managed packages with `npx expo install`.
 
Installed packages (add nothing else without asking):
 
| Purpose | Packages |
|---|---|
| Core | `expo`, `react`, `react-native`, `react-dom` + `react-native-web` (web test target) |
| Navigation | `expo-router`, `expo-linking`, `expo-constants`, `react-native-screens`, `react-native-safe-area-context` |
| App shell | `expo-status-bar`, `expo-system-ui`, `expo-splash-screen`, `expo-font` |
| Graphics / icons | `react-native-svg`, `lucide-react-native` |
| Motion | `react-native-reanimated`, `react-native-worklets` |
| Fonts | `@expo-google-fonts/grenze`, `@expo-google-fonts/grenze-gotisch`, `@expo-google-fonts/alegreya-sans` |
| Haptics | `expo-haptics` |
| Dev | `typescript`, `@types/react`, `jest`, `jest-expo`, `@types/jest`, `eslint`, `eslint-config-expo` |
## Project layout
 
```
src/app/             Expo Router screens only: _layout, index (Accueil), modules, setup, hand, cursed, bonus, jokers, book, island, angel, end, result, ranking (every file here is a route: no tests or helpers)
src/data/            cards.ts, cursedItems.ts — typed data transcribed from the reference doc §5 and §8
src/engine/          pure TypeScript scoring engine + rulings.ts (no React / RN imports)
src/engine/__tests__ acceptance tests (reference doc §10) and data sanity tests
src/search/          name normalisation and suggestion ranking (pure, tested)
src/flow/            session reducer, step guards and game (several players, ranking) (pure, tested)
src/ui/              theme.ts and shared components (Pane, Vitrail, CardSearch, SuggestionRow, Stepper…)
assets/images/       app/ (icon, splash, favicon), cards/<famille>/, objets-maudits/ — expected file names in assets/images/images.txt
docs/                the two specs
```
 
Imports use the `@/*` alias for `src/*` (e.g. `@/engine/score`).
 
## Commands
 
- Dev: `npx expo start` (web: `npx expo start --web`)
- Tests: `npx jest` (single file: `npx jest path/to/file`)
- Type-check: `npx tsc --noEmit`
- Lint: `npx expo lint`
## Engine rules (non-negotiable)
 
- `src/engine` is pure TypeScript: no React, no React Native, no I/O. It takes a hand + context and returns a total and a per-card trace (base, bonus, malus, masked + by whom, malus cleared + by whom, chosen option).
- Follow the resolution order of reference doc §4 exactly. Identify cards by ID (`FR01`…, `CH01`…), never by name string.
- One card, one ID. Cards whose text changes with the extension (☠: Source de vie, Inondation, Éclaireurs, Nécromancien, Arbre-Monde, Métamorphe, Mirage) are one card with mode-dependent logic. The two Beffroi are two cards (FR03 base, CH16 extension).
- Jokers (Doppelgänger, Mirage, Métamorphe): the player chooses the copied card, or « Ne copie rien », on the Jokers screen (UI spec §A7b); the engine takes it as input. Livre des mutations: the player chooses the target card and its new family, or « Ne change rien », on the Livre screen (UI spec §A7c). Île: the player chooses the cleared card, or « N'efface rien » (UI spec §A7d). Ange: the player chooses the protected card, or « Ne protège rien » (UI spec §A7e). The engine never optimises a choice (reference §4.2).
- Every ⚠️ ruling from the reference doc lives in `src/engine/rulings.ts` with these defaults:
| Key | Default |
|---|---|
| `phoenixPenaltyClearedByBeastmaster` | `true` (RAW: Dresseur clears Phénix's malus) |
| `blankingCycleMasksAll` | `true` |
| `dirigibleArmyWordClearWaivesArmyCondition` | `true` |
| `wildfireBlanksUnusedJoker` | `true` (RAW) |
| `worldTreeBonus` | `{ base: 50, extension: 70 }` |
| `tieBreakUsesPrintedStrengthOfAllCards` | `true` |
 
- The acceptance tests of reference §10 are the definition of correctness. A failing test is fixed in the engine, never by editing the expected value. If you believe an expected value is wrong, stop and tell me why.
## App modes
 
| Choice | Engine mode | Hand | Card pool |
|---|---|---|---|
| Jeu de base | `BASE` + promos | 7 | 53 base cards + Bouffon + Phénix (Beffroi = FR03) |
| Extension → Objets maudits | `CURSED` + promos | 7 | same as base, cursed items enabled |
| Extension → Familles supplémentaires | `FAMILIES` + promos | 8 | + Jardin, Bâtiments, Extérieurs, Morts-vivants (Beffroi = CH16), ☠ text active |
| Extension → Les deux | `FULL` (Trésor maudit complet) + promos | 8 | extra families + cursed items |

Use `hasExtraFamilies(mode)` / `hasCursedItems(mode)` from `src/data/cards.ts`, never compare modes directly. After « Extension », screen « Le Trésor maudit » asks the modules (UI spec §A4a).

After the mode, the player picks « Une main » (one hand at a time) or « Une partie » (2–6 players, optional names otherwise « Joueur 1 … N », unique cards across players, then a ranking; « Nouvelle partie » keeps only the mode, the player count and the names): UI spec §A4b and §A9b.
 
## UI spec → React Native translation
 
| UI spec (web wording) | Implement in React Native / Expo |
|---|---|
| CSS custom properties / tokens | Constants in `src/ui/theme.ts` (colours, type scale, spacing) |
| `clip-path` pointed arch, lattice pattern, crack | `react-native-svg` paths |
| Joker iridescent conic gradient, Phénix split pane | SVG gradients / polygons inside the pane |
| Input attributes (`autocomplete=off`…) | `TextInput`: `autoCorrect={false}`, `autoCapitalize="none"`, `spellCheck={false}`, `autoComplete="off"`, `returnKeyType="done"`, keep focus after submit (`submitBehavior="submit"` or equivalent for the installed RN version) |
| Keep keyboard open when tapping a suggestion | Parent `ScrollView`/`FlatList` with `keyboardShouldPersistTaps="handled"`; refocus the input after selection |
| Input visible above keyboard, `100dvh` | `KeyboardAvoidingView` + `react-native-safe-area-context` |
| ↑ ↓ Enter Escape navigation | Web only (`onKeyPress`); on mobile, Enter/"done" picks the highlighted suggestion |
| ARIA combobox, `aria-label`, `aria-live` | `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, `AccessibilityInfo.announceForAccessibility` for the total |
| `navigator.vibrate(10)` | `Haptics.impactAsync(Light)` |
| `prefers-reduced-motion` | `useReducedMotion()` from Reanimated |
| `localStorage` | Not needed in v1 (no persistence) |
| PWA / offline cache | Native builds are offline by design (fonts and data bundled). No service worker in v1 |
| Hover / focus outline | Pressable `pressed` + focus styles on web (2 px `lumiere` outline) |
 
## Working rules
 
**Workflow**
1. **Investigate first.** Read the files in scope and the code you will interact with (callers, types, tests). Do not read the whole repo when not needed.
2. **Plan, then confirm.** For any non-trivial change, share a short plan (files touched, approach, risks) and wait for my go-ahead before writing code.
3. **Implement incrementally.** Small, verifiable steps. Run tests, type-check and lint after each meaningful step.
4. **Verify end-to-end.** Compiling or passing a unit test is not "done". Check the behaviour against the spec: run the app (web is fine for this, use a browser tool if one is available) and walk the flow. When a check needs a device, give me a short manual checklist instead of claiming it works.
5. **Report honestly.** What's done, what's skipped, what's uncertain, which assumptions you made.
**Rules**
- **Stay in scope.** Only modify what the task requires. Mention unrelated issues, don't fix them.
- **Keep it minimal.** Simplest solution that meets the spec. No speculative abstractions, no extra files, no options I didn't ask for.
- **Match the codebase.** Follow existing conventions, naming, patterns and libraries over personal preference.
- **Self-explanatory code.** No new comments. Preserve existing comments unless the code they describe is removed.
- **Ask when uncertain.** If requirements, types or behaviour are ambiguous, ask. "I don't know" and "I need to check X" are valid answers.
- **context7** for any library, framework or API you are not 100% sure about at its current version.
- **rtk.** Check with `rtk gain`. If the rtk hook is active, shell commands are rewritten automatically. If rtk is installed but the hook is not active, prefix supported commands with `rtk` (e.g. `rtk npx jest`). If rtk is not installed, tell me; do not install it yourself.
- **Clean up.** Remove temporary scratch files and scripts before finishing.
- **Git.** Never `git add`, commit, push or change branches unless I explicitly ask. If you are asked to commit, do not add yourseld as co-author.
- **Dashes & Emojis** never use emojis and if you need to put dashes, use regular ones - (or _ for code) 
## Known open items (do not block on them)
 
- Arbre-Monde value, cursed item French names/values and expansion card wording are pending my check on the physical cards (reference §0.4). Use the values in the docs; keep them easy to edit in `src/data` and `src/engine/rulings.ts`.