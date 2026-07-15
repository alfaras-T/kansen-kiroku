import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import {
  OUTPUT_RATIOS,
  OVERLAY_STYLES,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
} from '@/constants/overlayStyles';
import { TeamCode } from '@/constants/teams';

export interface OverlayCardProps {
  photoUri: string | null;
  ratio: OutputRatio;
  position: OverlayPosition;
  styleKey: OverlayStyleKey;
  visitorCode: TeamCode;
  homeCode: TeamCode;
  visitorScore: string;
  homeScore: string;
  dateLabel: string;
  stadium: string;
  isDraw: boolean;
  isExtra: boolean;
  extraInning: string;
  seatMemo: string;
  winHighlight: boolean;
}

function buildCaption(props: OverlayCardProps): string {
  let caption = `${props.dateLabel}  ${props.stadium}`.trim();
  if (props.isDraw) caption += ' ・引き分け';
  else if (props.isExtra) caption += ` ・延長${props.extraInning}回`;
  return caption;
}

export const OverlayCard = forwardRef<View, OverlayCardProps>(function OverlayCard(props, ref) {
  const {
    photoUri,
    ratio,
    position,
    styleKey,
    visitorCode,
    homeCode,
    visitorScore,
    homeScore,
    isDraw,
    winHighlight,
    seatMemo,
  } = props;

  const palette = OVERLAY_STYLES[styleKey];
  const ratioConfig = OUTPUT_RATIOS.find((r) => r.key === ratio) ?? OUTPUT_RATIOS[0];
  const aspectStyle = ratioConfig.aspect ? { aspectRatio: ratioConfig.aspect } : { aspectRatio: 1 };

  const isRight = position === 'br' || position === 'tr';
  const isBottom = position === 'br' || position === 'bl';

  let vColor = palette.accent;
  let hColor = palette.accent;
  if (winHighlight && !isDraw) {
    const v = Number(visitorScore);
    const h = Number(homeScore);
    if (v > h) hColor = palette.dim;
    else if (h > v) vColor = palette.dim;
  }

  const caption = buildCaption(props);
  const textShadow = {
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  } as const;

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, aspectStyle, { backgroundColor: palette.gradientFrom }]}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[palette.gradientFrom, palette.gradientTo]}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View
        style={[
          styles.overlayBlock,
          isBottom ? { bottom: 18 } : { top: 18 },
          isRight ? { right: 18, alignItems: 'flex-end' } : { left: 18, alignItems: 'flex-start' },
        ]}>
        <View style={styles.scoreRow}>
          <Text style={[styles.code, textShadow, { color: palette.body }]}>{visitorCode}</Text>
          <Text style={[styles.score, textShadow, { color: vColor }]}> {visitorScore}</Text>
          <Text style={[styles.score, textShadow, { color: palette.dim }]}> – </Text>
          <Text style={[styles.score, textShadow, { color: hColor }]}>{homeScore} </Text>
          <Text style={[styles.code, textShadow, { color: palette.body }]}>{homeCode}</Text>
        </View>

        <Text
          style={[styles.caption, textShadow, { color: palette.caption }]}
          numberOfLines={1}>
          {caption}
        </Text>

        {!!seatMemo && (
          <Text style={[styles.memo, textShadow, { color: palette.caption }]} numberOfLines={1}>
            {seatMemo}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
  },
  overlayBlock: {
    position: 'absolute',
    maxWidth: '86%',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  code: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 20,
  },
  score: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 32,
  },
  caption: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 12,
    marginTop: 6,
  },
  memo: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    marginTop: 3,
  },
});
