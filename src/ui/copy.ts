import type { CardId } from '@/data/cards';

export const copy = {
  appTitle: 'Le Scribe du Royaume',
  homeSubtitle: 'Compte les points de ta main',
  homeBase: 'Jeu de base',
  homeBaseSub: '7 cartes',
  homeExt: 'Extension',
  homeExtSub: 'Le Trésor maudit, 8 cartes',
  handTitle: 'Ta main',
  handPlaceholder: "Tape le nom d'une carte",
  handNoMatch: (q: string) => `Aucune carte ne correspond à « ${q} »`,
  handRemove: (nom: string) => `Retirer ${nom}`,
  handAbandon: 'Abandonner cette main ?',
  handMissing: (n: number) => `Il manque ${n} carte${n > 1 ? 's' : ''} pour compléter ta main.`,
  handFirstCard: 'Ta première carte',
  yes: 'Oui',
  no: 'Non',
  back: 'Retour',
  cursedTitle: 'Objets maudits',
  cursedHelp: "Ajoute les objets retournés face cachée. L'objet encore face visible ne compte pas.",
  cursedPlaceholder: "Tape le nom d'un objet",
  cursedNoMatch: (q: string) => `Aucun objet ne correspond à « ${q} »`,
  cursedNone: 'Aucun objet',
  cursedTotal: (n: string) => `Total des objets : ${n}`,
  bonusTitle: 'Carte bonus',
  bonusNecro: 'Tu as le Nécromancien : quelle carte as-tu récupérée dans la défausse ?',
  bonusDraw: (source: string) => `Tu as ${source} : quelle carte as-tu piochée ?`,
  bonusSeveral: (sources: string) => `Carte supplémentaire (${sources})`,
  bonusSkip: 'Pas de carte bonus',
  bonusChange: 'Changer',
  endTitle: 'Fin de partie',
  endPlayers: 'Nombre de joueurs',
  endDiscard: 'Défausse en fin de partie',
  endDiscardHelp: 'Compte les cartes de la zone de défausse (y compris celles sous la Chambre forte).',
  endLicorne: 'La Licorne est dans la défausse',
  ctaContinue: 'Continuer',
  ctaScore: 'Compter les points',
  resultTitle: 'Résultat',
  resultPoints: 'points',
  resultMasked: 'Masquée',
  resultCleared: 'Malus effacé',
  resultCursed: 'Objets maudits',
  resultTiebreak: (n: number) => `Départage : force de base totale ${n}`,
  resultNew: 'Nouvelle main',
  rankRuins: 'Un royaume en ruines',
  rankFief: 'Un modeste fief',
  rankProsperous: 'Un royaume prospère',
  rankEmpire: 'Un empire redouté',
  rankLegend: 'Une légende des royaumes',
  resultEdit: 'Modifier la main',
  resultMode: 'Changer de mode',
};

export const SOURCE_WITH_ARTICLE: Record<'FR28' | 'CH09' | 'CH06' | 'CH46', string> = {
  FR28: 'le Nécromancien',
  CH09: 'le Leprechaun',
  CH06: 'le Génie',
  CH46: 'le Portail',
};

export const MASKER_WITH_ARTICLE: Partial<Record<CardId, string>> = {
  FR08: "l'Inondation",
  FR11: "l'Orage",
  FR12: 'le Blizzard',
  FR16: 'le Feu de forêt',
  FR37: 'le Basilic',
  FR53: 'le Doppelgänger',
  CH03: 'la Crypte',
  CH10: 'le Démon',
};

export const CLEARER_WITH_ARTICLE: Partial<Record<CardId, string>> = {
  FR01: 'la Montagne',
  FR02: 'la Caverne',
  FR09: "l'Île",
  FR27: 'le Dresseur',
  FR50: 'la Rune de Protection',
};

export function signed(n: number): string {
  if (n === 0) return '—';
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`;
}

export function number(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`;
}
