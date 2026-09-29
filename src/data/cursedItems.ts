export type CursedTiming = 'NIMPORTE_QUAND' | 'REMPLACEZ_VOTRE_TOUR' | 'APRES_VOTRE_TOUR' | 'COMME_LA_CARTE_COPIEE';

export interface CursedItemDef {
  id: string;
  name: string;
  value: number;
  timing: CursedTiming;
  text: string;
  extraCard?: boolean;
}

const CURSED_ITEM_LIST = [
  { id: 'CH24', name: 'Longue-vue', value: -1, timing: 'NIMPORTE_QUAND', text: "Regardez la main d'un autre joueur. Vaut −10 à 2 joueurs." },
  { id: 'CH25', name: 'Sarcophage', value: 5, timing: 'REMPLACEZ_VOTRE_TOUR', text: 'Mettez la première carte de la pioche dans la défausse et terminez votre tour.' },
  { id: 'CH26', name: 'Bandeau', value: 5, timing: 'REMPLACEZ_VOTRE_TOUR', text: "Défaussez d'abord, puis piochez." },
  { id: 'CH27', name: 'Livre des prophéties', value: -1, timing: 'NIMPORTE_QUAND', text: 'Regardez les 7 dernières cartes de la pioche.' },
  { id: 'CH28', name: 'Boule de cristal', value: -1, timing: 'NIMPORTE_QUAND', text: 'Choisissez une famille ; les autres joueurs révèlent leurs cartes de cette famille.' },
  { id: 'CH29', name: 'Charette de Marchand', value: -2, timing: 'REMPLACEZ_VOTRE_TOUR', text: "Proposez un échange d'une carte aux autres joueurs." },
  { id: 'CH30', name: 'Sac à dos', value: -2, timing: 'NIMPORTE_QUAND', text: 'Piochez 3 Objets maudits pour vos 3 prochains remplacements.' },
  { id: 'CH31', name: 'Pelle', value: -2, timing: 'NIMPORTE_QUAND', text: 'Mettez une carte de la défausse sous la pioche.' },
  { id: 'CH32', name: 'Chambre forte', value: -4, timing: 'NIMPORTE_QUAND', text: 'Couvrez 2 cartes de la défausse : elles ne peuvent plus être prises mais comptent pour les Morts-vivants.' },
  { id: 'CH33', name: 'Lunettes de cristal', value: -2, timing: 'NIMPORTE_QUAND', text: 'Regardez la première carte de la pioche avant de choisir où piocher.' },
  { id: 'CH34', name: 'Gants de voleur', value: -3, timing: 'NIMPORTE_QUAND', text: "Volez et utilisez l'Objet maudit face visible d'un autre joueur." },
  { id: 'CH35', name: 'Plan de la décharge', value: -3, timing: 'NIMPORTE_QUAND', text: 'Rejouez un des 3 derniers Objets maudits défaussés.' },
  { id: 'CH36', name: 'Bottes ailées', value: -4, timing: 'NIMPORTE_QUAND', text: 'Mettez la première carte de la pioche dans la défausse.' },
  { id: 'CH37', name: 'Bâton de transmutation', value: -4, timing: 'REMPLACEZ_VOTRE_TOUR', text: 'Échangez 3 à 8 cartes de votre main avec le dessus de la pioche.' },
  { id: 'CH38', name: 'Râteau', value: -4, timing: 'REMPLACEZ_VOTRE_TOUR', text: 'Prenez 2 cartes de la défausse puis défaussez-en 2.' },
  { id: 'CH39', name: 'Coffre au trésor', value: -5, timing: 'NIMPORTE_QUAND', text: 'Vaut +25 en fin de partie si vous avez au moins 3 autres Objets maudits face cachée.' },
  { id: 'CH40', name: 'Hameçon', value: -6, timing: 'REMPLACEZ_VOTRE_TOUR', text: 'Piochez 2 cartes, puis défaussez-en 2.' },
  { id: 'CH41', name: 'Couteau nain', value: -6, timing: 'COMME_LA_CARTE_COPIEE', text: 'Copiez un Objet maudit déjà joué (sauf Sac à dos, Sarcophage, Bandeau, Coffre au trésor).' },
  { id: 'CH42', name: 'Sablier', value: -7, timing: 'APRES_VOTRE_TOUR', text: 'Jouez un tour supplémentaire.' },
  { id: 'CH43', name: 'Miroir doré', value: -8, timing: 'NIMPORTE_QUAND', text: 'Échangez 3 cartes de la défausse avec les 3 premières de la pioche.' },
  { id: 'CH44', name: 'Chaudron', value: -9, timing: 'REMPLACEZ_VOTRE_TOUR', text: 'Piochez 3 cartes, replacez-en 2 sur/sous la pioche, puis défaussez normalement.' },
  { id: 'CH45', name: 'Lanterne', value: -10, timing: 'REMPLACEZ_VOTRE_TOUR', text: "Cherchez une carte d'une famille choisie dans la pioche (max 10 cartes)." },
  { id: 'CH46', name: 'Portail', value: -20, timing: 'NIMPORTE_QUAND', text: 'Ne défaussez pas ce tour-ci (vous aurez une carte de plus en main).', extraCard: true },
  { id: 'CH47', name: 'Anneau de souhait', value: -30, timing: 'NIMPORTE_QUAND', text: 'Choisissez la carte du dessus de la pioche, puis remélangez.' },
] as const satisfies readonly CursedItemDef[];

export type CursedItemId = (typeof CURSED_ITEM_LIST)[number]['id'];

export interface CursedItem extends CursedItemDef {
  id: CursedItemId;
}

export const CURSED_ITEMS: readonly CursedItem[] = CURSED_ITEM_LIST;

export const CURSED_ITEMS_BY_ID = Object.fromEntries(CURSED_ITEMS.map((item) => [item.id, item])) as Record<
  CursedItemId,
  CursedItem
>;
