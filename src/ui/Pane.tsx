import { useEffect, useId, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

import { CARDS_BY_ID, FAMILY_NAMES, type CardId, type Family } from '@/data/cards';

import { FamilyIcon } from './FamilyIcon';
import { colors, familyColors, jokerGradient } from './theme';

export const PANE_RATIO = 2.2;

export function archPath(width: number, height: number, inset = 0): string {
  const w = width - inset * 2;
  const spring = w * 0.866 + inset;
  const r = w;
  return `M${inset},${height - inset} L${inset},${spring} A${r},${r} 0 0 1 ${width / 2},${inset} A${r},${r} 0 0 1 ${width - inset},${spring} L${width - inset},${height - inset} Z`;
}

function crackPath(width: number, height: number): string {
  const x = (f: number) => (width * f).toFixed(1);
  const y = (f: number) => (height * f).toFixed(1);
  return `M${x(0.3)},${y(0.12)} L${x(0.55)},${y(0.34)} L${x(0.38)},${y(0.5)} L${x(0.7)},${y(0.72)} L${x(0.52)},${y(0.95)} M${x(0.55)},${y(0.34)} L${x(0.82)},${y(0.4)} M${x(0.38)},${y(0.5)} L${x(0.12)},${y(0.6)}`;
}

export type PaneState = 'entry' | 'active' | 'masked';

interface Props {
  width: number;
  cardId?: CardId;
  copyOf?: CardId;
  asFamily?: Family;
  state?: PaneState;
  dashedColor?: string;
  revealDelay?: number;
  settled?: boolean;
  glowColor?: string;
  onPress?: () => void;
}

function Glass({ id, asFamily, width, height }: { id: CardId; asFamily?: Family; width: number; height: number }) {
  const card = CARDS_BY_ID[id];
  const family = asFamily ?? card.families[0];
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clip = `arch-${uid}`;
  const shade = `shade-${uid}`;
  const rainbow = `joker-${uid}`;
  const iconSize = Math.max(12, Math.min(28, width * 0.45));
  const joker = family === 'JOKER';
  const iconColor = joker ? colors.encre : familyColors[family].text;
  return (
    <>
      <Svg width={width} height={height}>
        <Defs>
          <ClipPath id={clip}>
            <Path d={archPath(width, height)} />
          </ClipPath>
          <LinearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.1} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          {joker && (
            <LinearGradient id={rainbow} x1="0" y1="0" x2="1" y2="1">
              {jokerGradient.map((color, index) => (
                <Stop key={color} offset={index / (jokerGradient.length - 1)} stopColor={color} />
              ))}
            </LinearGradient>
          )}
        </Defs>
        <G clipPath={`url(#${clip})`}>
          {id === 'FR55' && !asFamily ? (
            <>
              <Rect width={width} height={height} fill={familyColors.CREATURE.pane} />
              <Polygon points={`0,${height * 0.35} ${width},${height * 0.1} ${width},${height * 0.65} 0,${height * 0.9}`} fill={familyColors.FLAMME.pane} />
              <Polygon points={`0,${height * 0.9} ${width},${height * 0.65} ${width},${height} 0,${height}`} fill={familyColors.CLIMAT.pane} />
            </>
          ) : (
            <Rect width={width} height={height} fill={joker ? `url(#${rainbow})` : familyColors[family].pane} />
          )}
          <Rect width={width} height={height} fill={`url(#${shade})`} />
        </G>
        <Path d={archPath(width, height, 1)} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1} />
        <Path d={archPath(width, height)} fill="none" stroke={colors.plomb} strokeWidth={2} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {joker ? (
          <View style={styles.plate}>
            <FamilyIcon family={family} color={iconColor} size={iconSize} />
          </View>
        ) : (
          <FamilyIcon family={family} color={iconColor} size={iconSize} />
        )}
      </View>
    </>
  );
}

function glowStyle(color: string): ViewStyle {
  return Platform.OS === 'web'
    ? { filter: `drop-shadow(0 0 9px ${color}73)` }
    : { shadowColor: color, shadowOpacity: 0.45, shadowRadius: 9, shadowOffset: { width: 0, height: 0 } };
}

export function Pane({ width, cardId, copyOf, asFamily, state = 'entry', dashedColor, revealDelay = 0, settled, glowColor, onPress }: Props) {
  const height = width * PANE_RATIO;
  const reduced = useReducedMotion();
  const [lastCard, setLastCard] = useState(cardId);
  if (cardId && cardId !== lastCard) setLastCard(cardId);
  const shownId = cardId ?? lastCard;
  const fill = useSharedValue(cardId && state === 'entry' ? 1 : 0);
  const light = useSharedValue(0);
  const crack = useSharedValue(0);

  useEffect(() => {
    if (state !== 'entry') return;
    const target = cardId ? 1 : 0;
    fill.set(reduced ? target : withTiming(target, { duration: cardId ? 180 : 120, easing: Easing.out(Easing.quad) }));
  }, [cardId, state, reduced, fill]);

  useEffect(() => {
    if (state === 'entry') return;
    const finalLight = state === 'active' ? 1 : 0;
    if (reduced || settled) {
      cancelAnimation(light);
      cancelAnimation(crack);
      light.set(finalLight);
      crack.set(state === 'masked' ? 1 : 0);
      return;
    }
    light.set(
      state === 'active'
        ? withDelay(revealDelay, withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }))
        : withDelay(
            revealDelay,
            withSequence(
              withTiming(0.6, { duration: 60 }),
              withTiming(0.1, { duration: 60 }),
              withTiming(0.45, { duration: 60 }),
              withTiming(0, { duration: 120 }),
            ),
          ),
    );
    crack.set(state === 'masked' ? withDelay(revealDelay + 300, withTiming(1, { duration: 120 })) : 0);
  }, [state, revealDelay, settled, reduced, light, crack]);

  const fillStyle = useAnimatedStyle(() => ({ height: fill.get() * height }));
  const lightStyle = useAnimatedStyle(() => ({ opacity: light.get() }));
  const crackStyle = useAnimatedStyle(() => ({ opacity: crack.get() }));

  const card = shownId ? CARDS_BY_ID[shownId] : undefined;
  const label = card
    ? `${(asFamily ? [asFamily] : card.families).map((f) => FAMILY_NAMES[f]).join(', ')} : ${card.name}, force ${card.strength}`
    : undefined;
  const hairline = card ? `${familyColors[card.families[0]].pane}99` : colors.plombClair;

  const content = (
    <View style={{ width, height }}>
      {state === 'entry' ? (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Path
              d={archPath(width, height, 0.75)}
              fill="none"
              stroke={dashedColor ?? colors.plombClair}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          </Svg>
          {card && (
            <Animated.View style={[styles.fill, fillStyle]}>
              <View style={[styles.fillInner, { height }]}>
                <Glass id={copyOf ?? card.id} asFamily={asFamily} width={width} height={height} />
              </View>
            </Animated.View>
          )}
        </>
      ) : (
        card && (
          <>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
              <Path d={archPath(width, height, 0.5)} fill={colors.masque} stroke={hairline} strokeWidth={1} />
            </Svg>
            <Animated.View style={[StyleSheet.absoluteFill, lightStyle, state === 'active' && glowStyle(glowColor ?? familyColors[card.families[0]].pane)]}>
              <Glass id={copyOf ?? card.id} asFamily={asFamily} width={width} height={height} />
            </Animated.View>
            {state === 'masked' && (
              <Animated.View style={[StyleSheet.absoluteFill, crackStyle]}>
                <Svg width={width} height={height}>
                  <Path d={crackPath(width, height)} fill="none" stroke={colors.velinDoux} strokeWidth={1.25} strokeLinejoin="round" />
                </Svg>
              </Animated.View>
            )}
          </>
        )
      )}
    </View>
  );

  if (onPress && card) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {content}
      </Pressable>
    );
  }
  return (
    <View accessible={!!label} accessibilityLabel={label}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  plate: { backgroundColor: 'rgba(239, 231, 212, 0.8)', borderRadius: 999, padding: 3 },
  fill: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  fillInner: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
