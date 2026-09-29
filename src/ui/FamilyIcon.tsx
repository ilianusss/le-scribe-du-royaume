import {
  Castle,
  Cloud,
  Crown,
  Drama,
  Feather,
  Flame,
  Gem,
  KeyRound,
  Mountain,
  PawPrint,
  Shield,
  Skull,
  Sword,
  WandSparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react-native';

import type { PaneFamily } from './theme';

const ICONS: Record<PaneFamily, LucideIcon> = {
  TERRAIN: Mountain,
  VAGUE: Waves,
  CLIMAT: Cloud,
  FLAMME: Flame,
  ARMEE: Shield,
  SORCIER: WandSparkles,
  SEIGNEUR: Crown,
  CREATURE: PawPrint,
  ARME: Sword,
  ARTEFACT: Gem,
  JOKER: Drama,
  BATIMENT: Castle,
  EXTERIEUR: Feather,
  MORT_VIVANT: Skull,
  OBJET_MAUDIT: KeyRound,
};

export function FamilyIcon({ family, color, size = 16 }: { family: PaneFamily; color: string; size?: number }) {
  const Icon = ICONS[family];
  return <Icon color={color} size={size} strokeWidth={1.75} />;
}
