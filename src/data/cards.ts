export type Mode = 'BASE' | 'EXTENSION';

export type Family =
  | 'TERRAIN'
  | 'VAGUE'
  | 'CLIMAT'
  | 'FLAMME'
  | 'ARMEE'
  | 'SORCIER'
  | 'SEIGNEUR'
  | 'CREATURE'
  | 'ARME'
  | 'ARTEFACT'
  | 'JOKER'
  | 'BATIMENT'
  | 'EXTERIEUR'
  | 'MORT_VIVANT';

export const BASE_FAMILIES: readonly Family[] = [
  'TERRAIN',
  'VAGUE',
  'CLIMAT',
  'FLAMME',
  'ARMEE',
  'SORCIER',
  'SEIGNEUR',
  'CREATURE',
  'ARME',
  'ARTEFACT',
  'JOKER',
];

export const EXTENSION_FAMILIES: readonly Family[] = ['BATIMENT', 'EXTERIEUR', 'MORT_VIVANT'];

export const FAMILY_NAMES: Record<Family, string> = {
  TERRAIN: 'Terrain',
  VAGUE: 'Vague',
  CLIMAT: 'Climat',
  FLAMME: 'Flamme',
  ARMEE: 'Armée',
  SORCIER: 'Sorcier',
  SEIGNEUR: 'Seigneur',
  CREATURE: 'Créature',
  ARME: 'Arme',
  ARTEFACT: 'Artefact',
  JOKER: 'Joker',
  BATIMENT: 'Bâtiment',
  EXTERIEUR: 'Extérieur',
  MORT_VIVANT: 'Mort-vivant',
};

export type CardModule = 'BASE' | 'PROMO' | 'EXT';

export type ChoiceKind = 'DOPPELGANGER' | 'MIRAGE' | 'SHAPESHIFTER' | 'BOOK' | 'ISLAND' | 'ANGEL';

export interface CardDef {
  id: string;
  name: string;
  families: readonly Family[];
  strength: number;
  module: CardModule;
  hasBonus: boolean;
  hasPenalty: boolean;
  text: string;
  choice?: ChoiceKind;
  onlyInBaseMode?: boolean;
}

const CARD_LIST = [
  // Terrain
  { id: 'FR01', name: 'Montagne', families: ['TERRAIN'], strength: 9, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +50 avec la Fumée et le Feu de forêt. EFFACE le malus de toutes les Vagues.' },
  { id: 'FR02', name: 'Caverne', families: ['TERRAIN'], strength: 6, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +25 avec l'Infanterie naine ou le Dragon. EFFACE les malus de tous les Climats." },
  { id: 'FR03', name: 'Beffroi', families: ['TERRAIN'], strength: 8, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +15 avec n'importe quel Sorcier.", onlyInBaseMode: true },
  { id: 'FR04', name: 'Forêt', families: ['TERRAIN'], strength: 7, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +12 pour chaque Créature et pour les Archers Elfes.' },
  { id: 'FR05', name: 'Élémental de Terre', families: ['TERRAIN'], strength: 4, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +15 pour chaque autre Terrain.' },
  { id: 'CH05', name: 'Jardin', families: ['TERRAIN'], strength: 11, module: 'EXT', hasBonus: true, hasPenalty: true, text: 'BONUS : +11 pour chaque Seigneur et chaque Créature. MALUS : MASQUÉ par tout Mort-vivant, le Nécromancien ou le Démon.' },
  // Vague
  { id: 'FR06', name: 'Source de vie', families: ['VAGUE'], strength: 1, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : Ajoutez la force de base de n'importe quel(le) Arme, Vague, Flamme, Terrain ou Climat de votre main. ☠ + Bâtiment." },
  { id: 'FR07', name: 'Marécage', families: ['VAGUE'], strength: 18, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : −3 pour chaque Armée et chaque Flamme.' },
  { id: 'FR08', name: 'Inondation', families: ['VAGUE'], strength: 32, module: 'BASE', hasBonus: false, hasPenalty: true, text: "MALUS : MASQUE toutes les Armées, tous les Terrains sauf la Montagne, et toutes les Flammes sauf l'Éclair. ☠ + tous les Bâtiments." },
  { id: 'FR09', name: 'Île', families: ['VAGUE'], strength: 14, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : EFFACE le malus de n'importe quelle Vague ou Flamme (une seule).", choice: 'ISLAND' },
  { id: 'FR10', name: "Élémental d'Eau", families: ['VAGUE'], strength: 4, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +15 pour chaque autre Vague.' },
  // Climat
  { id: 'FR11', name: 'Orage', families: ['CLIMAT'], strength: 8, module: 'BASE', hasBonus: true, hasPenalty: true, text: "BONUS : +10 pour chaque Vague. MALUS : MASQUE toutes les Flammes sauf l'Éclair." },
  { id: 'FR12', name: 'Blizzard', families: ['CLIMAT'], strength: 30, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : MASQUE toutes les Vagues. −5 pour chaque Armée, Seigneur, Créature et Flamme.' },
  { id: 'FR13', name: 'Fumée', families: ['CLIMAT'], strength: 27, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : Cette carte est MASQUÉE sauf avec au moins une Flamme.' },
  { id: 'FR14', name: 'Tornade', families: ['CLIMAT'], strength: 13, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +40 avec l'Orage et soit le Blizzard, soit l'Inondation." },
  { id: 'FR15', name: "Élémental d'Air", families: ['CLIMAT'], strength: 4, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +15 pour chaque autre Climat.' },
  // Flamme
  { id: 'FR16', name: 'Feu de forêt', families: ['FLAMME'], strength: 40, module: 'BASE', hasBonus: false, hasPenalty: true, text: "MALUS : MASQUE toutes les cartes sauf les Flammes, les Sorciers, les Climats, les Armes, les Artefacts, la Montagne, l'Inondation, l'Île, la Licorne et le Dragon." },
  { id: 'FR17', name: 'Chandelle', families: ['FLAMME'], strength: 2, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +100 avec le Livre des mutations, le Beffroi et n'importe quel Sorcier." },
  { id: 'FR18', name: 'Forge', families: ['FLAMME'], strength: 9, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +9 pour chaque Arme et chaque Artefact.' },
  { id: 'FR19', name: 'Éclair', families: ['FLAMME'], strength: 11, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +30 avec l'Orage." },
  { id: 'FR20', name: 'Élémental de Feu', families: ['FLAMME'], strength: 4, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +15 pour chaque autre Flamme.' },
  // Armée
  { id: 'FR21', name: 'Chevaliers', families: ['ARMEE'], strength: 20, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : −8 sauf avec au moins un Seigneur.' },
  { id: 'FR22', name: 'Archers Elfes', families: ['ARMEE'], strength: 10, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +5 si vous n'avez pas de Climat." },
  { id: 'FR23', name: 'Cavalerie légère', families: ['ARMEE'], strength: 17, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : −2 pour chaque Terrain.' },
  { id: 'FR24', name: 'Infanterie naine', families: ['ARMEE'], strength: 15, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : −2 pour chaque autre Armée.' },
  { id: 'FR25', name: 'Éclaireurs', families: ['ARMEE'], strength: 5, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 pour chaque Terrain (☠ et chaque Bâtiment). EFFACE le mot Armée de tous les malus.' },
  // Sorcier
  { id: 'FR26', name: 'Collectionneur', families: ['SORCIER'], strength: 7, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 si vous avez trois cartes de la même famille, +40 si quatre, +100 si cinq.' },
  { id: 'FR27', name: 'Dresseur', families: ['SORCIER'], strength: 9, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +9 pour chaque Créature. EFFACE les malus de toutes les Créatures.' },
  { id: 'FR28', name: 'Nécromancien', families: ['SORCIER'], strength: 3, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : À la fin de la partie, vous pouvez prendre une Armée, un Seigneur, un Sorcier ou une Créature (☠ ou un Mort-vivant) de la défausse et l'ajouter à votre main. ☠ Aucun Mort-vivant ne peut être MASQUÉ." },
  { id: 'FR29', name: 'Démoniste', families: ['SORCIER'], strength: 25, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : −10 pour chaque Seigneur et chaque autre Sorcier.' },
  { id: 'FR30', name: 'Enchanteresse', families: ['SORCIER'], strength: 5, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +5 pour chaque Terrain, Climat, Vague et Flamme.' },
  { id: 'FR54', name: 'Bouffon', families: ['SORCIER'], strength: 3, module: 'PROMO', hasBonus: true, hasPenalty: false, text: 'BONUS : +3 pour chaque autre carte avec une force de base impaire. OU +50 si toutes vos cartes ont une force de base impaire.' },
  // Seigneur
  { id: 'FR31', name: 'Roi', families: ['SEIGNEUR'], strength: 8, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +5 pour chaque Armée. OU avec la Reine, +20 pour chaque Armée.' },
  { id: 'FR32', name: 'Reine', families: ['SEIGNEUR'], strength: 6, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +5 pour chaque Armée. OU avec le Roi, +20 pour chaque Armée.' },
  { id: 'FR33', name: 'Princesse', families: ['SEIGNEUR'], strength: 2, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +8 pour chaque Armée, Sorcier et chaque autre Seigneur.' },
  { id: 'FR34', name: 'Chef de guerre', families: ['SEIGNEUR'], strength: 4, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : La somme des forces de base de toutes les Armées.' },
  { id: 'FR35', name: 'Impératrice', families: ['SEIGNEUR'], strength: 15, module: 'BASE', hasBonus: true, hasPenalty: true, text: 'BONUS : +10 pour chaque Armée. MALUS : −5 pour chaque autre Seigneur.' },
  // Créature
  { id: 'FR36', name: 'Licorne', families: ['CREATURE'], strength: 9, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +30 avec la Princesse. OU +15 avec l'Impératrice, la Reine ou l'Enchanteresse." },
  { id: 'FR37', name: 'Basilic', families: ['CREATURE'], strength: 35, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : MASQUE toutes les Armées, tous les Seigneurs et toutes les autres Créatures.' },
  { id: 'FR38', name: 'Destrier', families: ['CREATURE'], strength: 6, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +14 avec n'importe quel Seigneur ou Sorcier." },
  { id: 'FR39', name: 'Dragon', families: ['CREATURE'], strength: 30, module: 'BASE', hasBonus: false, hasPenalty: true, text: 'MALUS : −40 sauf avec au moins un Sorcier.' },
  { id: 'FR40', name: 'Hydre', families: ['CREATURE'], strength: 12, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +28 avec le Marécage.' },
  { id: 'FR55', name: 'Phénix', families: ['CREATURE', 'FLAMME', 'CLIMAT'], strength: 14, module: 'PROMO', hasBonus: true, hasPenalty: true, text: 'BONUS : Compte aussi comme une carte Flamme et Climat. Le Phénix est immunisé contre le Livre des mutations et ne peut ni MASQUER ni être MASQUÉ par aucune autre carte. MALUS : MASQUÉ avec n\'importe quelle Vague.' },
  // Arme
  { id: 'FR41', name: 'Navire de guerre', families: ['ARME'], strength: 23, module: 'BASE', hasBonus: true, hasPenalty: true, text: 'BONUS : EFFACE le mot Armée des malus de toutes les Vagues. MALUS : MASQUÉ sauf avec au moins une Vague.' },
  { id: 'FR42', name: 'Baguette magique', families: ['ARME'], strength: 1, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +25 avec n'importe quel Sorcier." },
  { id: 'FR43', name: 'Épée de Keth', families: ['ARME'], strength: 7, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +10 avec n'importe quel Seigneur. OU +40 avec un Seigneur et le Bouclier de Keth." },
  { id: 'FR44', name: 'Arc elfique', families: ['ARME'], strength: 3, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +30 avec les Archers Elfes, le Chef de guerre ou le Dresseur.' },
  { id: 'FR45', name: 'Dirigeable', families: ['ARME'], strength: 35, module: 'BASE', hasBonus: false, hasPenalty: true, text: "MALUS : MASQUÉ sauf avec au moins une Armée. MASQUÉ avec n'importe quel Climat." },
  // Artefact
  { id: 'FR46', name: 'Bouclier de Keth', families: ['ARTEFACT'], strength: 4, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : +15 avec n'importe quel Seigneur. OU +40 avec un Seigneur et l'Épée de Keth." },
  { id: 'FR47', name: 'Gemme de Loi', families: ['ARTEFACT'], strength: 5, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 pour une suite de 3 cartes, +30 pour 4, +60 pour 5, +100 pour 6, +150 pour 7 (en référence à la force de base des cartes).' },
  { id: 'FR48', name: 'Arbre-Monde', families: ['ARTEFACT'], strength: 2, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : +50 (☠ +70) si toutes les cartes non MASQUÉES appartiennent à des familles différentes.' },
  { id: 'FR49', name: 'Livre des mutations', families: ['ARTEFACT'], strength: 3, module: 'BASE', hasBonus: true, hasPenalty: false, text: "BONUS : Vous pouvez changer la famille d'une autre carte. Son nom ainsi que ses bonus et malus restent les mêmes.", choice: 'BOOK' },
  { id: 'FR50', name: 'Rune de Protection', families: ['ARTEFACT'], strength: 1, module: 'BASE', hasBonus: true, hasPenalty: false, text: 'BONUS : EFFACE le malus de toutes les cartes.' },
  // Joker
  { id: 'FR51', name: 'Métamorphe', families: ['JOKER'], strength: 0, module: 'BASE', hasBonus: true, hasPenalty: false, text: "Peut copier le nom et la famille de n'importe quel Artefact, Seigneur, Sorcier, Arme ou Créature (☠ ou Mort-vivant) du jeu. N'appliquez ni le bonus, ni le malus, ni la force de base de la carte copiée.", choice: 'SHAPESHIFTER' },
  { id: 'FR52', name: 'Mirage', families: ['JOKER'], strength: 0, module: 'BASE', hasBonus: true, hasPenalty: false, text: "Peut copier le nom et la famille de n'importe quel Terrain, Armée, Climat, Vague ou Flamme (☠ ou Bâtiment) du jeu. N'appliquez ni le bonus, ni le malus, ni la force de base de la carte copiée.", choice: 'MIRAGE' },
  { id: 'FR53', name: 'Doppelgänger', families: ['JOKER'], strength: 0, module: 'BASE', hasBonus: true, hasPenalty: false, text: "Peut copier le nom, la force de base, la famille et le malus MAIS PAS LE BONUS de n'importe quelle autre carte de votre main.", choice: 'DOPPELGANGER' },
  // Bâtiment
  { id: 'CH16', name: 'Beffroi', families: ['BATIMENT'], strength: 8, module: 'EXT', hasBonus: true, hasPenalty: false, text: "BONUS : +15 avec n'importe quel Sorcier ou Mort-vivant." },
  { id: 'CH01', name: 'Donjon', families: ['BATIMENT'], strength: 7, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 chacun pour le premier Mort-vivant, la première Créature et le premier Artefact. +5 pour chaque carte supplémentaire de ces familles et pour le Nécromancien, le Démoniste et le Démon.' },
  { id: 'CH02', name: 'Château', families: ['BATIMENT'], strength: 10, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 chacun pour le premier Seigneur, la première Armée, le premier Terrain et le premier autre Bâtiment. +5 pour chaque Bâtiment supplémentaire.' },
  { id: 'CH03', name: 'Crypte', families: ['BATIMENT'], strength: 21, module: 'EXT', hasBonus: true, hasPenalty: true, text: 'BONUS : La somme des forces de base de tous les Morts-vivants. MALUS : MASQUE tous les Seigneurs.' },
  { id: 'CH04', name: 'Chapelle', families: ['BATIMENT'], strength: 2, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +40 si vous avez exactement 2 cartes parmi les familles suivantes : Seigneur, Sorcier, Extérieur, Mort-vivant.' },
  // Extérieur
  { id: 'CH06', name: 'Génie', families: ['EXTERIEUR'], strength: -50, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 par autre joueur. À la fin de la partie, regardez les cartes de la pioche et prenez-en une dans votre main (après le Leprechaun).' },
  { id: 'CH07', name: 'Juge des âmes', families: ['EXTERIEUR'], strength: 11, module: 'EXT', hasBonus: true, hasPenalty: false, text: "BONUS : +10 pour chaque carte contenant un malus qui n'a pas été EFFACÉ." },
  { id: 'CH08', name: 'Ange', families: ['EXTERIEUR'], strength: 16, module: 'EXT', hasBonus: true, hasPenalty: false, text: "BONUS : Empêche une autre carte d'être MASQUÉE. Cette carte ne peut jamais être MASQUÉE.", choice: 'ANGEL' },
  { id: 'CH09', name: 'Leprechaun', families: ['EXTERIEUR'], strength: 20, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : À la fin de la partie, tirez la prochaine carte de la pioche et ajoutez-la à votre main (avant le Génie).' },
  { id: 'CH10', name: 'Démon', families: ['EXTERIEUR'], strength: 45, module: 'EXT', hasBonus: false, hasPenalty: true, text: "MALUS : Pour chaque carte qui n'est pas un Extérieur : si c'est la seule carte que vous avez de cette famille, elle est MASQUÉE. Ceci est résolu avant tout autre MASQUE." },
  // Mort-vivant
  { id: 'CH11', name: 'Reine des Ténèbres', families: ['MORT_VIVANT'], strength: 10, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +5 pour chaque Terrain, Vague, Flamme, Climat et pour la Licorne dans la zone de défausse.' },
  { id: 'CH12', name: 'Goule', families: ['MORT_VIVANT'], strength: 8, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +4 pour chaque Sorcier, Seigneur, Armée, Créature et Mort-vivant dans la zone de défausse.' },
  { id: 'CH13', name: 'Spectre', families: ['MORT_VIVANT'], strength: 12, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +6 pour chaque Sorcier, Artefact et Extérieur dans la zone de défausse.' },
  { id: 'CH14', name: 'Liche', families: ['MORT_VIVANT'], strength: 13, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +10 pour le Nécromancien et pour chaque autre Mort-vivant. Les Morts-vivants ne peuvent pas être MASQUÉS.' },
  { id: 'CH15', name: 'Chevalier de la Mort', families: ['MORT_VIVANT'], strength: 14, module: 'EXT', hasBonus: true, hasPenalty: false, text: 'BONUS : +7 pour chaque Arme et Armée dans la zone de défausse.' },
] as const satisfies readonly CardDef[];

export type CardId = (typeof CARD_LIST)[number]['id'];

export interface Card extends CardDef {
  id: CardId;
}

export const CARDS: readonly Card[] = CARD_LIST;

export const CARDS_BY_ID = Object.fromEntries(CARDS.map((card) => [card.id, card])) as Record<CardId, Card>;

export const HAND_SIZE: Record<Mode, number> = { BASE: 7, EXTENSION: 8 };

export function isInPool(card: Card, mode: Mode): boolean {
  if (mode === 'BASE') return card.module !== 'EXT';
  return !card.onlyInBaseMode;
}

export function cardPool(mode: Mode): readonly Card[] {
  return CARDS.filter((card) => isInPool(card, mode));
}

export function modeFamilies(mode: Mode): readonly Family[] {
  return mode === 'BASE' ? BASE_FAMILIES : [...BASE_FAMILIES, ...EXTENSION_FAMILIES];
}
