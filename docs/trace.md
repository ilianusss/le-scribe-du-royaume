Decisions you should check
The reference doc contradicts itself. §4.1 says masking only targets other cards, but test #21 (expected 11) requires the Blizzard, turned into a Vague by the Livre, to mask itself. The reference implementation also lets a card mask itself unless its text says "autres" (as on the Basilic). I followed the test. Please update §4.1 or tell me which is right.
The optimiser isn't always exact. A hand with four or more choice cards (for example Mirage, Métamorphe, Doppelgänger and Livre) can have over a million combinations. Up to 20,000 combinations it tries them all; above that it improves the choices two at a time. On one test hand that gave 146 where the true best was 168. Every hand in §10 and any realistic hand stays under the limit.
One ruling has no effect. phoenixInDiscardCountsAsFlameAndWeather is in rulings.ts, but the discard screen only asks for counts per family, so the engine can't tell a Phénix was in the discard. The player decides by how they count it.
Text I had to write (not in §A11):
Cursed items screen: placeholder « Tape le nom d'un objet » and no-match message « Aucun objet ne correspond à … ».
Back button accessibility label « Retour », and « Moins de / Plus de {famille} » on the steppers.
Reasons on the result: « par l'Inondation » (masked) and « par la Montagne » (malus cleared).
Button labels. On every step, the main button says « Compter les points » when the next screen is the result, and « Continuer » otherwise. §A6 says « Continuer » on the cursed items screen, so there it differs when no step follows.
Skipped or deferred:
Tapping a result row does not expand an explanation (the spec marks it optional).
The card images folder isn't used anywhere, as discussed in Phase 0.
npm audit still reports 14 moderate issues in tooling packages; I left them alone.
The context window is fine, so I didn't write docs/passation.md.

Checklist for your iPhone
Run npx expo start and open it in Expo Go. If a native module is missing there, you'll need a development build.

Fonts: the title is blackletter (Grenze Gotisch) and there's no flash of the system font at launch.
On « Ta main », type a card and press « OK »/Enter: the first suggestion is added and the keyboard stays open.
Tap a suggestion: the card is added, the keyboard stays open and the field keeps focus.
Each added card gives a light vibration, and its pane fills from bottom to top.
With the keyboard open, the field and at least 3 suggestions stay visible (also in landscape).
Tap a filled pane: its row is highlighted and the list scrolls to it.
Back arrow with cards entered: « Abandonner cette main ? » appears, and « Non » keeps the hand. Swiping back is disabled on that screen.
On the result: panes glow in, the total counts up, and a tap skips to the end.
Turn on Settings › Accessibility › Motion › Reduce Motion: the result shows its final state with no animation.
With VoiceOver on: the total is announced when the result appears, and panes read « Famille : Nom, force N ».
The safe areas (notch, home indicator) don't cover the header or the bottom button.
« Nouvelle main », « Modifier la main » and « Changer de mode » go to the right screens, and swiping back from any later step works.

