import type { TextStyle } from 'react-native';

import type { Family } from '@/data/cards';

export const colors = {
  nuit: '#17142B',
  plomb: '#2C2842',
  plombClair: '#443E61',
  velin: '#EFE7D4',
  velinDoux: '#B3ABC6',
  lumiere: '#FFD98A',
  encre: '#1A1726',
  malus: '#F08A7E',
  masque: '#2A2638',
  poison: '#9FBF3A',
  ember: '#8C3B2E',
};

export type PaneFamily = Family | 'OBJET_MAUDIT';

export const familyColors: Record<PaneFamily, { pane: string; text: string }> = {
  TERRAIN: { pane: '#8A6437', text: colors.velin },
  VAGUE: { pane: '#2B6CB3', text: colors.velin },
  CLIMAT: { pane: '#7DBCCB', text: colors.encre },
  FLAMME: { pane: '#E0602A', text: colors.encre },
  ARMEE: { pane: '#9C2D3B', text: colors.velin },
  SORCIER: { pane: '#7646B5', text: colors.velin },
  SEIGNEUR: { pane: '#D8A83A', text: colors.encre },
  CREATURE: { pane: '#3C8B58', text: colors.velin },
  ARME: { pane: '#8E99A7', text: colors.encre },
  ARTEFACT: { pane: '#C04E88', text: colors.velin },
  JOKER: { pane: '#C04E88', text: colors.encre },
  BATIMENT: { pane: '#B09A78', text: colors.encre },
  EXTERIEUR: { pane: '#E6DDC6', text: colors.encre },
  MORT_VIVANT: { pane: '#4C6460', text: colors.velin },
  OBJET_MAUDIT: { pane: '#33283F', text: colors.velin },
};

export const jokerGradient = ['#2B6CB3', '#7646B5', '#C04E88', '#E0602A', '#7DBCCB'];

export const fonts = {
  title: 'GrenzeGotisch_600SemiBold',
  headingMedium: 'Grenze_500Medium',
  heading: 'Grenze_600SemiBold',
  headingBold: 'Grenze_700Bold',
  body: 'AlegreyaSans_400Regular',
  bodyMedium: 'AlegreyaSans_500Medium',
  bodyBold: 'AlegreyaSans_700Bold',
};

const tabular: TextStyle['fontVariant'] = ['tabular-nums', 'lining-nums'];

export const type = {
  score: { fontFamily: fonts.headingBold, fontSize: 88, lineHeight: 88, fontVariant: tabular },
  title: { fontFamily: fonts.title, fontSize: 40, lineHeight: 44 },
  h1: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34 },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25 },
  input: { fontFamily: fonts.bodyMedium, fontSize: 20, lineHeight: 26 },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  number: { fontFamily: fonts.headingMedium, fontSize: 17, lineHeight: 25, fontVariant: tabular },
} satisfies Record<string, TextStyle>;

export const spacing = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 };

export const radius = 10;
export const gutter = 20;
export const maxWidth = 480;
export const minTap = 48;
