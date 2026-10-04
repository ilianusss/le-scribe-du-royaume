# Le Scribe du Royaume — UI/UX & Art Direction Spec

> Companion to `fantasy-realms-reference.md` (the rules and scoring engine). This document defines **what the app does screen by screen** (Part A) and **how it looks and feels** (Part B). The two are in one file on purpose: each screen spec in Part A points to the design tokens in Part B, and the core visual idea (a stained-glass window) is also the app's progress indicator and result display.
>
> Scope for v1: choose a mode, enter a hand, get a score, start again. Nothing else.

---

# Part A — Flow, screens and behaviour

## A1. Principles

1. **Typing is the fastest input.** Players know their card names. One text field, instant suggestions, Enter to pick.
2. **Ask only what the score needs.** Extra questions (bonus card, cursed items, discard, player count) appear only when a card in the hand requires them.
3. **Ask only the choices a player declares at the table.** The player says which card each joker (Doppelgänger, Mirage, Métamorphe) copies (§A7b) what the Livre des mutations changes (§A7c), which card the Île clears (§A7d) and which card the Ange protects (§A7e). The app never optimises a choice (reference doc §4.2); the result shows each choice.
4. **One screen, one job.** Linear flow, a back arrow on every step, no menus.
5. **Mobile first, one hand, at the game table.** Works offline. Works on a phone held in one hand with the keyboard open.

## A2. Mode mapping

The home buttons and the extension modules (screen 1a) map to the engine modes of the reference doc (§1.1):

| Choice | Engine mode | Hand size | Extra families (☠ text active) | Cursed items |
|---|---|---|---|---|
| **Jeu de base** | `BASE` | 7 | No | No |
| **Extension → Objets maudits** | `CURSED` | 7 | No | Yes |
| **Extension → Familles supplémentaires** | `FAMILIES` | 8 | Yes | No |
| **Extension → Les deux** | `FULL` (Trésor maudit complet) | 8 | Yes | Yes |

Promo cards (Bouffon, Phénix) are included in every mode.

Card pool per mode:
- Without the extra families (`BASE`, `CURSED`): the 53 base cards + Bouffon + Phénix. The Beffroi is the **Terrain** version.
- With the extra families (`FAMILIES`, `FULL`): the above + Jardin + Bâtiments + Extérieurs + Morts-vivants; the Beffroi is the **Bâtiment** version (the Terrain one is removed). Both are named "Beffroi", so only one ever appears in suggestions.

## A3. Flow

```
                ┌──────────────┐
                │  1. Accueil  │  Jeu de base │ Extension
                └──────┬───────┘
          Extension?   │
          ┌────yes─────┤
          ▼            │ no
 ┌──────────────────┐  │
 │ 1a. Le Trésor    │  │  Familles supplémentaires │ Objets maudits │ Les deux
 │     maudit       │  │
 └────────┬─────────┘  │
          └─────┬──────┘
                ▼
                ┌──────────────┐
                │ 1b. Que veux-│  Une main │ Une partie (+ 2..6 joueurs)
                │  tu compter ?│
                └──────┬───────┘
                       ▼   (une partie: steps 2 → 6 once per player, then 7)
                ┌──────────────┐
                │  2. Ta main  │  7 or 8 cards
                └──────┬───────┘
     Objets maudits?   │
          ┌────yes─────┤
          ▼            │ no
 ┌──────────────────┐  │
 │ 3. Objets maudits│  │  0..n face-down items
 └────────┬─────────┘  │
          └─────┬──────┘
                ▼
     Bonus card source in hand?  (Nécromancien; extra families: Leprechaun, Génie; cursed items: Portail)
          ┌───yes───┐
          ▼         │ no
 ┌──────────────────┐│
 │ 4. Carte bonus   ││  0 or 1 card
 └────────┬─────────┘│
          └────┬─────┘
               ▼
     Joker in the final hand?  (Doppelgänger, Mirage, Métamorphe)
          ┌───yes───┐
          ▼         │ no
 ┌──────────────────┐│
 │ 4b. Jokers       ││  one copy (or none) per joker
 └────────┬─────────┘│
          └────┬─────┘
               ▼
     Livre des mutations in the final hand?
          ┌───yes───┐
          ▼         │ no
 ┌──────────────────┐│
 │ 4c. Livre des    ││  one card → one family (or none)
 │     mutations    ││
 └────────┬─────────┘│
          └────┬─────┘
               ▼
     Île in the final hand, with another Vague or Flamme?
          ┌───yes───┐
          ▼         │ no
 ┌──────────────────┐│
 │ 4d. Île          ││  one card cleared (or none)
 └────────┬─────────┘│
          └────┬─────┘
               ▼
     Ange in the final hand?
          ┌───yes───┐
          ▼         │ no
 ┌──────────────────┐│
 │ 4e. Ange         ││  one card protected (or none)
 └────────┬─────────┘│
          └────┬─────┘
               ▼
     Context needed? (Génie/Longue-vue → players; Undead → discard)
          ┌───yes───┐
          ▼         │ no
 ┌──────────────────┐│
 │ 5. Fin de partie ││  player count and/or discard counts
 └────────┬─────────┘│
          └────┬─────┘
               ▼
        ┌──────────────┐
        │ 6. Résultat  │  Une main: Nouvelle main │ Modifier la main │ Changer de mode
        └──────┬───────┘  Une partie: Joueur suivant / Voir le classement │ Modifier la main │ Abandonner la partie
               ▼ (une partie, after the last player)
        ┌──────────────┐
        │ 7. Classement│  Nouvelle partie │ Changer de mode
        └──────────────┘
```

Steps 3, 4, 4b, 4c, 4d, 4e and 5 are **conditional**. The step counter in the header only counts the steps that apply to the current hand (recompute it when the hand changes).

### State model

```ts
type Mode = 'BASE' | 'CURSED' | 'FAMILIES' | 'FULL';

interface ScoringSession {
  mode: Mode | null;
  hand: CardId[];               // ordered by entry
  cursedItems: CursedItemId[];  // face-down items (Objets maudits module)
  bonusCard: CardId | null;     // Nécromancien / Leprechaun / Génie / Portail
  bonusSkipped: boolean;        // player explicitly chose "Aucune"
  jokerChoices: Partial<Record<JokerId, CardId | 'NONE'>>; // one answer per joker in the final hand
  bookChoice: { target: CardId; family: Family } | 'NONE' | null; // Livre des mutations
  islandChoice: CardId | 'NONE' | null; // Île
  angelChoice: CardId | 'NONE' | null;  // Ange
  playerCount: number | null;   // 2..6, only if needed
  discardCounts: Partial<Record<Family, number>> & { licorne?: boolean }; // only if needed
  game: GameContext | null;     // une partie only
}

interface GameContext {          // what the current player inherits from the previous ones
  playerCount: number;           // known for the whole game: never asked again
  unavailableCards: CardId[];    // final hands of previous players (every card is unique)
  unavailableCursed: CursedItemId[];
  discard: DiscardCounts;        // last discard counts entered (the discard area is shared)
}

interface Game { mode: Mode; playerCount: number; names: string[]; finished: ScoringSession[] } // current player = finished.length + 1; '' = no name
```

The result is computed from the session (it is not stored).

Implement the flow as a small state machine (`MODE → HAND → CURSED? → BONUS? → JOKERS? → BOOK? → ISLAND? → ANGEL? → CONTEXT? → RESULT`). A step's guard decides whether it is shown; going **back** from a step returns to the previous *shown* step. Editing the hand invalidates later answers only if they no longer apply (e.g. removing the Nécromancien clears `bonusCard`; removing a joker, or the card a Doppelgänger copies, clears that joker's answer; removing the Livre or its target card clears `bookChoice`; the Île or Ange answer is cleared when its card or its target leaves the hand, or when the Île's target is no longer a Vague or a Flamme).

**Une partie**: players are « Joueur 1 » … « Joueur N », or the names entered on screen 1b (optional). Each player goes through steps 2 → 6 with a fresh session built from the `GameContext`. Going back from a player's hand (after a confirmation if cards were entered) returns to the previous player's result with their answers kept.

No persistence is required. Optional nicety: remember the last mode in `localStorage` (wrap in try/catch).

---

## A4. Screen 1 — Accueil

**Job**: choose the mode.

```
┌─────────────────────────────┐
│                             │
│     Le Scribe du Royaume    │  ← title (display font)
│   Compte les points de ta   │
│         main en 1 min       │
│                             │
│  ┌──────────┐ ┌──────────┐  │
│  │  ╭────╮  │ │  ╭────╮  │  │  ← two tall arched "windows"
│  │  │    │  │ │  │ ☠  │  │  │
│  │  │    │  │ │  │    │  │  │
│  │ Jeu de   │ │ Extension│  │
│  │  base    │ │          │  │
│  │ 7 cartes │ │Le Trésor │  │
│  │          │ │ maudit,  │  │
│  │          │ │ 8 cartes │  │
│  └──────────┘ └──────────┘  │
└─────────────────────────────┘
```

Behaviour:
- Tapping a window sets `mode`, resets the session, goes to screen 2.
- Both buttons are equal in size. On narrow screens (< 360 px) they stack vertically.
- Keyboard: Tab between them, Enter/Space to select.

---

## A4b. Screen 1b — Que veux-tu compter ?

**Job**: one hand at a time, or a whole game.

- Header « Que veux-tu compter ? » with a back arrow to Accueil.
- Two arched windows, same component as Accueil: « Une main » / « Calcule une main à la fois » (hand icon) and « Une partie » / « Compte la main de chaque joueur et désigne le gagnant » (players icon).
- « Une main » goes straight to screen 2.
- « Une partie » highlights its window and shows « Nombre de joueurs » (segmented control 2–6, no default). Once a count is picked:
  - a switch « Saisir les noms des joueurs » (off by default);
  - when on, one text field per player (placeholder « Joueur {n} », capitalised words, 20 characters max, « suivant » on the keyboard moves to the next field); an empty field keeps « Joueur {n} »;
  - the primary button « Commencer la partie ».

**During a game**:
- The header shows « Joueur {n} sur {N} » above the screen title, or « {Nom} · {n} sur {N} » when the player has a name. Names replace « Joueur {n} » everywhere (ranking, read-only result).
- The player count is known: the Génie and the Longue-vue never ask it, and screen 5 is skipped when it has nothing else to ask.
- Cards and cursed items already in a previous player's final hand are not suggested (each card is unique).
- The discard counts on screen 5 start from the last counts entered in the game.

## A4a. Screen 1a — Le Trésor maudit (after « Extension »)

**Job**: pick the expansion modules played (reference doc §1.1).

- Header « Le Trésor maudit » with a back arrow to Accueil; question « Avec quoi joues-tu ? ».
- Three rows in one list (same style as suggestion rows: colour bar, icon, title in the heading font, sub-line, chevron):
  - « Familles supplémentaires » / « Bâtiments, Extérieurs et Morts-vivants · 8 cartes » (Bâtiment bar and icon) → `FAMILIES`;
  - « Objets maudits » / « 7 cartes » (poison bar, key icon) → `CURSED`;
  - « Les deux » / « Le Trésor maudit complet · 8 cartes » (`--lumiere` bar, skull icon) → `FULL`.
- Tapping a row sets the mode and goes to screen 1b.

## A5. Screen 2 — Ta main (the core screen)

**Job**: enter all cards of the hand, as fast as possible.

```
┌─────────────────────────────┐
│ ←   Ta main          3 / 7  │  header: back, title, counter
│                             │
│ ╭─╮╭─╮╭─╮╭─╮╭─╮╭─╮╭─╮       │  vitrail: one arched pane per slot
│ │▓││▓││▓││ ││ ││ ││ │       │  filled panes = family colour + icon
│ ╰─╯╰─╯╰─╯╰─╯╰─╯╰─╯╰─╯       │  empty panes = outline only
│                             │
│ ┌─────────────────────────┐ │
│ │ ino                     │ │  text input, autofocused
│ └─────────────────────────┘ │
│ ▌Inondation     Vague    32 │  suggestions (max 6)
│  Infanterie naine Armée  15 │  first one highlighted
│                             │
│ ─────────────────────────── │
│ (when input empty:)         │
│  Montagne        Terrain  9 │  chosen cards list, each
│  Fumée           Climat  27 │  with a remove button (×)
│  Feu de forêt    Flamme  40 │
│                             │
│ [      Compter les points  ]│  primary button, visible when
└─────────────────────────────┘  hand is complete
```

### Input and suggestions

- Placeholder: « Tape le nom d'une carte ».
- Attributes: `autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="done"`, `inputmode="search"`.
- **Normalisation** (both query and card names): lowercase → Unicode NFD → strip diacritics → replace `’`, `'`, `-` by a space → collapse spaces → trim. So `eclair`, `ÉCLAIR`, `elementa d eau`, `feu de foret` all work.
- **Matching and ranking** (on the normalised strings):
  1. full name starts with the query;
  2. any word of the name starts with the query (`foret` → *Feu de forêt*, *Forêt*);
  3. name contains the query;
  4. ties sorted alphabetically.
- Show at most **6** suggestions. Each row: card name (the matched part in bold), family name with its colour dot and icon, base strength right-aligned.
- **Exclude** cards already in the hand and cards not in the mode's pool.
- Empty query → no suggestions; show the chosen-cards list instead.
- No match → « Aucune carte ne correspond à “{query}” » in place of the list.
- Selecting a suggestion (tap, or Enter on the highlighted row): add the card, clear the input, **keep focus** (the mobile keyboard must stay open), light up the next pane (see B7).
- Keyboard: ↓/↑ move the highlight (wraps), Enter selects, Escape clears the query.
- Input is **disabled and hidden** when the hand is full; the primary button takes its place and gets focus.

### Chosen cards

- Visible when the query is empty. Order = entry order.
- Each row has a remove button (× icon, accessible label « Retirer {nom} »). Removing re-shows the input and focuses it.
- Tapping a filled pane in the vitrail also highlights its row and scrolls to it.

### Completion

- Hand size: 7 without the extra families (`BASE`, `CURSED`), 8 with them (`FAMILIES`, `FULL`). The counter shows `n / 7` or `n / 8`.
- The primary button appears when the count is reached. It moves to the next *shown* step (cursed items, bonus card, jokers, context) or directly to the result. Its label follows the rule in §A10.
- Back arrow → Accueil (asks for confirmation only if at least one card was entered: « Abandonner cette main ? » Oui / Non).

---

## A6. Screen 3 — Objets maudits (Objets maudits module only)

**Job**: list the cursed items turned face down.

Same layout and component as screen 2, with:
- Title « Objets maudits », helper text: « Ajoute les objets retournés face cachée. L'objet encore face visible ne compte pas. »
- Placeholder « Tape le nom d'un objet »; no match → « Aucun objet ne correspond à « {q} » ».
- Suggestions from the 24 cursed items; the right column shows the face-down value (e.g. `−20`, `+5`).
- No fixed count, no vitrail (show a simple running total instead: « Total des objets : −23 »).
- Two actions always visible: « Aucun objet » (secondary, only when the list is empty) and the primary button (when ≥ 1 item), labelled per §A10. Both advance.

---

## A7. Screen 4 — Carte bonus (conditional)

Shown if the hand contains a **bonus source**:

| Source | Mode | Where the extra card comes from | Eligible cards |
|---|---|---|---|
| Nécromancien | all | discard | Armée, Seigneur, Sorcier, Créature (+ Mort-vivant with the extra families) |
| Leprechaun | extra families | top of the draw pile | any |
| Génie | extra families | draw pile | any |
| Portail (cursed item) | cursed items | kept an extra card | any |

Rules (reference doc §1.2): the hand can gain **at most one** extra card (8 max without the extra families, 9 max with them). So this screen asks for **one** card, never more.

Behaviour:
- Title: « Carte bonus ». Subtitle names the source(s) in the hand, e.g. « Tu as le Nécromancien : quelle carte as-tu récupérée dans la défausse ? » or « Tu as le Leprechaun : quelle carte as-tu piochée ? ». If several sources: « Carte supplémentaire (Nécromancien, Génie) ».
- Same input component, single selection. Eligible pool: if the **only** source is the Nécromancien → Nécromancien families only; otherwise any card of the mode. Cards already in hand are excluded.
- After selecting: show the card, a « Changer » link, and the primary button labelled per §A10.
- « Pas de carte bonus » (secondary) skips — taking the card is optional.
- The vitrail on this screen shows the full hand plus one extra dashed pane.

---

## A7b. Screen 4b — Jokers (conditional)

Shown if the final hand (bonus card included) contains a Doppelgänger, a Mirage or a Métamorphe. The player declares what each joker copies, as at the table.

- Title « Jokers ». The vitrail shows the final hand; a joker's pane takes the colour and icon of the copied card once chosen.
- One block per joker in the hand, heading « Le Doppelgänger copie : », « Le Mirage copie : », « Le Métamorphe copie : ».
- **Doppelgänger**: the other cards of the final hand as tappable rows (name, family, strength).
- **Mirage / Métamorphe**: the same input component as screen 2, limited to named cards of the joker's eligible families in the mode's pool (reference doc §5.12):
  - Mirage: Terrain, Armée, Climat, Vague, Flamme (+ Bâtiment with the extra families).
  - Métamorphe: Artefact, Seigneur, Sorcier, Arme, Créature (+ Mort-vivant with the extra families).
  - No "family only" copy.
- Each block also offers a secondary chip « Ne copie rien » (the joker stays a Joker).
- After an answer: show the chosen card (or « Ne copie rien ») with a « Changer » link.
- The primary button (label per §A10) is shown once every joker has an answer.

## A7c. Screen 4c — Livre des mutations (conditional)

Shown if the final hand (bonus card included) contains the Livre des mutations. It comes after the Jokers screen because the Livre resolves after the copies (reference doc §6.1): a joker that copied a card can have its family changed.

- Title « Livre des mutations ». The vitrail shows the final hand; once answered, the target's pane takes the colour and icon of its new family.
- Question « Quelle carte change de famille ? »: the other cards of the final hand as tappable rows (name, family, strength), the Phénix excluded (immune), plus a secondary « Ne change rien ».
- After picking a card: « {Carte} devient : » and a grid of family chips (family colour bar, icon and name, two per row, 48 px tall): every family of the mode except Joker and the card's current family, plus a « Changer » link to pick another card.
- After picking a family: a row « {Carte} devient {Famille} » with a « Changer » link, and the primary button (label per §A10).

## A7d. Screen 4d — Île (conditional)

Shown if the final hand contains the Île and at least one other card is a Vague or a Flamme, judged on families after the jokers (§A7b) and the Livre (§A7c).

- Title « Île ». Question « L'Île efface le malus de : ».
- The eligible cards as tappable rows (name, current family, strength), plus a secondary « N'efface rien ».
- After an answer: the chosen row (or « N'efface rien ») with a « Changer » link, and the primary button (label per §A10).

## A7e. Screen 4e — Ange (conditional)

Shown if the final hand contains the Ange.

- Title « Ange ». Question « L'Ange protège : ».
- The other cards of the final hand as tappable rows, plus a secondary « Ne protège rien ».
- After an answer: the chosen row (or « Ne protège rien ») with a « Changer » link, and the primary button (label per §A10).

## A8. Screen 5 — Fin de partie (conditional)

Shown only if needed, with only the needed blocks:

**Block « Nombre de joueurs »** — if the Génie is in the hand/bonus or the Longue-vue is among the cursed items.
- Segmented control `2 3 4 5 6`, no default; required.

**Block « Défausse en fin de partie »** — if the Reine des Ténèbres, Goule, Spectre or Chevalier de la Mort is in the hand. Undead cards only need **family counts** in the discard, so ask counts, not card names (much faster):

| Undead in hand | Families to count |
|---|---|
| Reine des Ténèbres | Terrain, Vague, Flamme, Climat + toggle « La Licorne est dans la défausse » |
| Goule | Sorcier, Seigneur, Armée, Créature, Mort-vivant |
| Spectre | Sorcier, Artefact, Extérieur |
| Chevalier de la Mort | Arme, Armée |

- Show the **union** of the needed families, each as a row: family icon + name + stepper (− count +), range 0–12, default 0.
- Helper: « Compte les cartes de la zone de défausse (y compris celles sous la Chambre forte). »
- Continue is always enabled (0 is a valid answer), label « Compter les points ».

---

## A9. Screen 6 — Résultat

```
┌─────────────────────────────┐
│ ←            Résultat       │
│                             │
│ ╭─╮╭─╮╭─╮╭─╮╭─╮╭─╮╭─╮       │  vitrail lights up pane by pane,
│ │█││█││░││█││█││█││█│       │  masked cards stay dark/cracked
│ ╰─╯╰─╯╰─╯╰─╯╰─╯╰─╯╰─╯       │
│                             │
│            260              │  total (display font, huge)
│           points            │
│                             │
│ Montagne        9  +50   59 │  breakdown: name, base,
│ Inondation     32    —   32 │  bonus/malus, subtotal
│ Fumée          27    —   27 │
│ Feu de forêt   40    —   40 │
│ Tornade        13  +40   53 │
│ Élémental d'Air 4  +45   49 │
│ Mirage → Orage  0    —    0 │  chosen option shown inline
│ Objets maudits           −23│  (Objets maudits module, if any)
│                             │
│ [       Nouvelle main      ]│  primary: same mode, back to screen 2
│ [    Modifier la main      ]│  secondary: back to screen 2, hand kept
│      Changer de mode        │  text button: back to Accueil
└─────────────────────────────┘
```

Breakdown rules:
- One row per card in hand (bonus card included), in entry order, then one row for cursed items.
- Columns: name, base strength, bonus/malus (signed, `—` if 0), subtotal. Use tabular figures.
- **Masked card**: row dimmed, subtotal `0`, tag « Masquée » and a short reason from the engine trace:
  - masked by another card (incl. the Démon, the undead masking the Jardin, a Doppelgänger): « par {nameWithArticle} » (e.g. « par l'Inondation »);
  - masked by its own « MASQUE » rule: « par son propre malus »;
  - Fumée without Flamme: « sans Flamme »; Navire de guerre without Vague: « sans Vague »;
  - Dirigeable: « sans Armée » or « avec un Climat »; Phénix with a Vague: « avec une Vague ».
- **Cleared malus**: tag « Malus effacé », reason « par {nameWithArticle} ».
- **Word Armée cleared** (Éclaireurs, Navire de guerre), on cards whose malus mentions Armée: tag « Mot Armée effacé », reason « par {nameWithArticle} ».
- `nameWithArticle` is a field of every card in the data (le / la by gender, l' before a vowel or mute h, les for plural names): l'Inondation, le Blizzard, les Éclaireurs.
- **Choices** shown in the name cell: « Mirage → Orage », « Doppelgänger → Basilic », « Livre des mutations : Beffroi devient Sorcier », « Île → Feu de forêt », « Ange → Reine ».
- Tapping a row to expand an explanation: deferred (not in v1).
- Below the list, small print: « Départage : force de base totale {n} » (reference doc §1).

Actions (une main):
- **Nouvelle main** → same mode, empty session, screen 2 with input focused. This is the main loop at the table, so it is the primary button.
- **Modifier la main** → screen 2 with everything kept (fix a typo, then recompute).
- **Changer de mode** → Accueil.

Actions (une partie):
- **Joueur suivant** (primary) → next player's screen 2; for the last player **Voir le classement** → screen 7.
- **Modifier la main** → screen 2 with everything kept.
- **Abandonner la partie** (text button) → confirmation « Abandonner cette partie ? » Oui / Non, then Accueil.

## A9b. Screen 7 — Classement (une partie)

- Header « Classement »; back returns to the last player's result.
- The winner's vitrail (final state, no animation), a crown, « Joueur {n} », the total in the score style, « points · remporte la partie ».
- Ranking: highest total first. Equal totals: the lowest total base strength wins (reference doc §1); still equal: same rank, and the heading reads « Égalité entre Joueur 1 et Joueur 3 ».
- One row per player: rank, « Joueur {n} », total, and « Départage : force de base totale {n} » when another player has the same total. The winner's row has a `--lumiere` bar. Tapping a row opens that player's result read-only (header « Joueur {n} », no actions).
- Actions: **Nouvelle partie** (primary: same mode, same number of players and same names; nothing else is kept: hands, cursed items, discard and choices start empty) and **Changer de mode** (text button, Accueil).

---

## A10. Cross-cutting behaviour

- **Header**: back arrow (except Accueil, accessibility label « Retour »), screen title, step counter or card counter. During a game, « Joueur {n} sur {N} » in `--lumiere` small text above the title.
- **Primary button label**: « Compter les points » when the next shown screen is the result, « Continuer » otherwise. This applies to every step.
- **Focus**: every screen puts focus on its main control on arrival (input, first stepper, or primary button).
- **Scroll**: on screen 2, keep the input visible above the mobile keyboard (`scrollIntoView({block: 'nearest'})` on focus; use `100dvh` layouts, never `100vh`).
- **Validation messages** use the interface's voice, are specific, and say how to fix: « Il manque 2 cartes pour compléter ta main. »
- **Performance**: suggestions update on every keystroke with no debounce (the list is ~95 items). Scoring must finish in < 500 ms on a mid-range phone.
- **Offline**: a PWA with all assets cached (fonts self-hosted, no CDN at runtime).
- **Accessibility**: suggestions use the ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, list `role="listbox"`). Panes have `aria-label` « {famille} : {nom}, force {n} ». Result total is announced (`aria-live="polite"`). Tap targets ≥ 48 px.

## A11. Microcopy (French, tutoiement, sentence case)

| Key | Text |
|---|---|
| app.title | Le Scribe du Royaume |
| home.subtitle | Compte les points de ta main |
| home.base | Jeu de base |
| home.base.sub | 7 cartes |
| home.ext | Extension |
| home.ext.sub | Le Trésor maudit |
| modules.title | Le Trésor maudit |
| modules.question | Avec quoi joues-tu ? |
| modules.families | Familles supplémentaires |
| modules.families.sub | Bâtiments, Extérieurs et Morts-vivants · 8 cartes |
| modules.cursed | Objets maudits |
| modules.cursed.sub | 7 cartes |
| modules.full | Les deux |
| modules.full.sub | Le Trésor maudit complet · 8 cartes |
| setup.title | Que veux-tu compter ? |
| setup.single | Une main |
| setup.single.sub | Calcule une main à la fois |
| setup.game | Une partie |
| setup.game.sub | Compte la main de chaque joueur et désigne le gagnant |
| setup.players | Nombre de joueurs |
| setup.names | Saisir les noms des joueurs |
| setup.start | Commencer la partie |
| game.player | Joueur {n} |
| game.playerOf | Joueur {n} sur {N} (with a name: {Nom} · {n} sur {N}) |
| game.next | Joueur suivant |
| game.ranking | Voir le classement |
| game.abandon | Abandonner la partie |
| game.abandon.confirm | Abandonner cette partie ? |
| ranking.title | Classement |
| ranking.wins | remporte la partie |
| ranking.tie | Égalité entre {joueurs} |
| ranking.new | Nouvelle partie |
| hand.title | Ta main |
| hand.placeholder | Tape le nom d'une carte |
| hand.noMatch | Aucune carte ne correspond à « {q} » |
| hand.remove | Retirer {nom} |
| hand.abandon | Abandonner cette main ? |
| cursed.title | Objets maudits |
| cursed.help | Ajoute les objets retournés face cachée. L'objet encore face visible ne compte pas. |
| cursed.placeholder | Tape le nom d'un objet |
| cursed.noMatch | Aucun objet ne correspond à « {q} » |
| cursed.none | Aucun objet |
| cursed.total | Total des objets : {n} |
| bonus.title | Carte bonus |
| bonus.necro | Tu as le Nécromancien : quelle carte as-tu récupérée dans la défausse ? |
| bonus.draw | Tu as {source} : quelle carte as-tu piochée ? |
| bonus.skip | Pas de carte bonus |
| jokers.title | Jokers |
| jokers.copies | {Le Doppelgänger / Le Mirage / Le Métamorphe} copie : |
| jokers.none | Ne copie rien |
| book.title | Livre des mutations |
| book.target | Quelle carte change de famille ? |
| book.family | {Carte} devient : |
| book.none | Ne change rien |
| island.title | Île |
| island.question | L'Île efface le malus de : |
| island.none | N'efface rien |
| angel.title | Ange |
| angel.question | L'Ange protège : |
| angel.none | Ne protège rien |
| end.title | Fin de partie |
| end.players | Nombre de joueurs |
| end.discard | Défausse en fin de partie |
| end.discard.help | Compte les cartes de la zone de défausse (y compris celles sous la Chambre forte). |
| end.licorne | La Licorne est dans la défausse |
| end.stepper.minus | Retirer une carte {famille} |
| end.stepper.plus | Ajouter une carte {famille} |
| end.stepper.value | {famille} : {n} |
| cta.continue | Continuer |
| cta.back | Retour |
| cta.score | Compter les points |
| result.title | Résultat |
| result.points | points |
| result.masked | Masquée |
| result.cleared | Malus effacé |
| result.armyWordCleared | Mot Armée effacé |
| result.maskedBy | par {nameWithArticle} |
| result.selfMasked | par son propre malus |
| result.noFlame | sans Flamme |
| result.noFlood | sans Vague |
| result.noArmy | sans Armée |
| result.withWeather | avec un Climat |
| result.withFlood | avec une Vague |
| result.cursed | Objets maudits |
| result.tiebreak | Départage : force de base totale {n} |
| result.new | Nouvelle main |
| result.edit | Modifier la main |
| result.mode | Changer de mode |

---

# Part B — Art direction & design system

## B1. Concept: « Le vitrail du royaume »

Fantasy Realms is about **combining** cards of different families into one realm, and at the end some cards shine and some are **masquées**. The app renders the hand as a **stained-glass window**: each card is a pane of coloured glass in its family colour, set in dark lead.

- While you type, each new card **lights a pane**: the window fills up as the hand grows. It is the progress bar.
- On the result, light passes through the window: active cards glow, **masked cards stay dark and cracked** — the game's key mechanic becomes visible at a glance.
- Everything else stays quiet: a deep night background, plain readable text, one warm light colour for focus and the score.

This is the single bold element. Do not add other decorative ideas on top.

## B2. Colour

### Core palette

| Token | Hex | Use |
|---|---|---|
| `--nuit` | `#17142B` | App background (deep indigo, never pure black) |
| `--plomb` | `#2C2842` | Surfaces, input background, lead lines between panes |
| `--plomb-clair` | `#443E61` | Borders, dividers, empty pane outline |
| `--velin` | `#EFE7D4` | Primary text |
| `--velin-doux` | `#B3ABC6` | Secondary text, families in suggestion rows |
| `--lumiere` | `#FFD98A` | Focus ring, highlighted suggestion bar, total score glow, primary button |
| `--encre` | `#1A1726` | Text on light panes and on the primary button |

### Family glass colours

Each family has a pane colour and a text colour chosen for ≥ 4.5:1 contrast. They are inspired by the physical cards' colour coding; the product owner may tune the hexes to match their cards, but keep them clearly distinct from each other.

| Family | Token | Pane | Text on pane |
|---|---|---|---|
| Terrain | `--f-terrain` | `#8A6437` (terre brûlée) | velin |
| Vague | `--f-vague` | `#2B6CB3` (cobalt) | velin |
| Climat | `--f-climat` | `#7DBCCB` (brume) | encre |
| Flamme | `--f-flamme` | `#E0602A` (vermillon) | encre |
| Armée | `--f-armee` | `#9C2D3B` (grenat) | velin |
| Sorcier | `--f-sorcier` | `#7646B5` (améthyste) | velin |
| Seigneur | `--f-seigneur` | `#D8A83A` (ambre) | encre |
| Créature | `--f-creature` | `#3C8B58` (émeraude) | velin |
| Arme | `--f-arme` | `#8E99A7` (acier) | encre |
| Artefact | `--f-artefact` | `#C04E88` (rubis rose) | velin |
| Joker | `--f-joker` | iridescent conic gradient of the 5 colours Vague → Sorcier → Artefact → Flamme → Climat | encre, on a `--velin` 80% plate |
| Bâtiment | `--f-batiment` | `#B09A78` (grès) | encre |
| Extérieur | `--f-exterieur` | `#E6DDC6` (nacre) | encre |
| Mort-vivant | `--f-mortvivant` | `#4C6460` (vert-de-gris) | velin |
| Objet maudit | `--f-maudit` | `#33283F` with a `#9FBF3A` (poison) 2 px edge | velin |

Phénix: pane split diagonally Créature / Flamme / Climat (it counts as all three).

State colours:
- **Masquée**: pane in `#2A2638`, 60% opacity family colour hairline border, SVG crack across it; row text in `--velin-doux`.
- **Bonus** values: `--velin`, prefixed `+`. **Malus** values: `#F08A7E`, prefixed `−` (true minus sign U+2212).

Light and dark: the app is intentionally dark (stained glass needs darkness behind it). Do not ship a light theme in v1.

## B3. Typography

| Role | Typeface | Notes |
|---|---|---|
| App title only | **Grenze Gotisch** (Google Fonts), 600 | Blackletter flavour, used once on Accueil. |
| Headings, total score, pane labels | **Grenze** (Google Fonts), 500–700 | Medieval-leaning serif, readable at small sizes, full French accents. |
| UI and body (inputs, lists, buttons, help) | **Alegreya Sans** (Google Fonts), 400 / 500 / 700 | Humanist sans with calligraphic roots, pairs naturally with the medieval tone, excellent legibility. |

Self-host the fonts (WOFF2) for offline use. Fallbacks: `Grenze, Georgia, serif` and `"Alegreya Sans", "Segoe UI", system-ui, sans-serif`.

Scale (mobile base 17 px, ratio ≈ 1.25):

| Token | Size / line-height | Use |
|---|---|---|
| `--t-score` | 88 px / 1 (Grenze 700) | Total on Résultat |
| `--t-title` | 40 px / 1.1 (Grenze Gotisch) | App title |
| `--t-h1` | 28 px / 1.2 (Grenze 600) | Screen titles |
| `--t-body` | 17 px / 1.45 (Alegreya Sans) | Default |
| `--t-input` | 20 px / 1.3 (Alegreya Sans 500) | Search field (≥ 16 px also prevents iOS zoom) |
| `--t-small` | 14 px / 1.4 | Family names, helpers, tie-break |

Rules: sentence case everywhere; no all-caps labels; numbers in lists use `font-variant-numeric: tabular-nums lining-nums`; no extra words next to controls unless they help.

## B4. Layout and shape

- Single column, max width 480 px, centred on larger screens; side padding 20 px.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Respect safe areas: `viewport-fit=cover`, padding with `env(safe-area-inset-*)`.
- **Shape language comes from the window, not from generic cards**:
  - Panes: tall rectangles with a **pointed (gothic) arch** top, drawn with `clip-path` or an SVG path. Ratio 1:2.2. Lead: 3 px `--plomb` gap between panes plus a 2 px darker inner border.
  - Home mode buttons: the same arch, large (≈ 160 × 240 px).
  - Input, suggestion list and breakdown list: plain rectangles, 10 px radius, `--plomb` background, no shadows. Only the window has glow.
  - Primary button: full width, 56 px tall, `--lumiere` fill, `--encre` text, 10 px radius. Secondary: 1.5 px `--plomb-clair` outline. Text button: underlined on focus/hover only.
- Vitrail sizing: panes fill the row width: `width = (containerWidth − gaps) / handSize`. With 9 panes on a 360 px screen that is ≈ 34 px wide: show only the family **icon** inside; the name appears in the list below.

## B5. Iconography and decor

- **Family icons** (outline style, 1.75 px stroke, e.g. Lucide or equivalent): Terrain `Mountain`, Vague `Waves`, Climat `Cloud`, Flamme `Flame`, Armée `Shield`, Sorcier `WandSparkles`, Seigneur `Crown`, Créature `PawPrint`, Arme `Sword`, Artefact `Gem`, Joker `Drama`, Bâtiment `Castle`, Extérieur `Feather`, Mort-vivant `Skull`, Objet maudit `KeyRound`. Always paired with the family name in text (colour is never the only signal).
- **Background texture**: a very subtle leaded-glass lattice (irregular diamond "losanges") as an SVG pattern at 4–5% opacity over `--nuit`, plus a soft radial glow of `--lumiere` at 6% behind the window area, like light coming through it. Nothing animated.
- **Ornament**: one small fleuron SVG under the app title on Accueil. Nowhere else.
- **Extension marker**: the ☠ skull glyph on the Extension home window (the Deluxe cards use this symbol for expansion content).
- Do not use the game's logo or scans of card illustrations: the look is original and stands on its own.

## B6. Components (visual spec)

**Suggestion row** (48 px min height): left: 4 px vertical bar in the family colour; card name (Alegreya Sans 500, matched part 700); below or right: family icon + family name in `--velin-doux`; far right: base strength in Grenze. Highlighted row: `--plomb-clair` background and the left bar becomes `--lumiere`.

**Chosen card row**: same as suggestion row + a 48 × 48 remove button (× icon).

**Pane** (vitrail):
- Empty: transparent, 1.5 px dashed `--plomb-clair` arch outline.
- Filled: family colour with a subtle vertical gradient (lighter at top, 10%), a 1 px inner highlight on the arch edge, family icon centred in the pane's text colour.
- Result active: add an outer glow `0 0 18px` of the family colour at 45%.
- Result masked: see B2 masked state; no glow.
- Bonus extra pane (screen 4): dashed `--lumiere` outline until filled.

**Stepper** (screen 5): − and + round buttons 44 px, count in Grenze 24 px, family icon and name on the left.

**Segmented control** (players): 5 equal segments, selected = `--lumiere` fill with `--encre` text.

## B7. Motion

Two moments only, both answering the player:

1. **Adding a card**: the next pane fills from bottom to top with its colour in 180 ms (`ease-out`), and the phone vibrates 10 ms if `navigator.vibrate` exists. Removing: the pane empties in 120 ms.
2. **Revealing the result** (the one orchestrated moment): panes light up left to right, 90 ms apart, each glowing in; masked panes do a brief dim flicker then settle dark with the crack. Meanwhile the total counts up from 0 to its value in 700 ms (ease-out), then the breakdown fades in (150 ms). Total ≈ 1.2 s. Tapping anywhere skips to the final state.

Everything else is instant. With `prefers-reduced-motion: reduce`: no fills, no count-up, no flicker — show final states directly.

## B8. Playful touches (cheap, optional, v1-safe)

- Score rank line under the total, in `--velin-doux`, based on the score:
  - < 0 « Un royaume en ruines »
  - 0–99 « Un modeste fief »
  - 100–199 « Un royaume prospère »
  - 200–299 « Un empire redouté »
  - ≥ 300 « Une légende des royaumes »
- If the total is negative, the window's glow turns a dull ember red for the reveal.
- Empty vitrail on screen 2 shows a faint helper inside the first pane area: « Ta première carte ».

## B9. Quality floor

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for icons and focus indicators.
- Visible focus everywhere: 2 px `--lumiere` outline, 2 px offset.
- Works from 320 px wide to desktop; landscape phone keeps the input and at least 3 suggestions visible above the keyboard.
- Test with the longest names (« Élémental de Terre », « Reine des Ténèbres », « Chevalier de la Mort », « Livre des mutations : Beffroi devient Sorcier ») at 320 px.

---

# Part C — Build order for the agent

1. Tokens (B2–B4) as CSS custom properties; fonts self-hosted.
2. Normalised search + suggestion ranking with unit tests (`eclair`, `ELEMENTAL D EAU`, `foret`, `doppel`, `beffroi` in each mode).
3. State machine and screens 1–2, then 6 with a mocked result, then conditional screens 3–5.
4. Wire the scoring engine from `fantasy-realms-reference.md`; check its acceptance tests through the UI for a few hands.
5. Vitrail component and the two motion moments; reduced-motion path.
6. PWA offline caching.
