import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useRef, useState } from 'react';
import { Image, PanResponder, StyleSheet, Text, View } from 'react-native';

import {
  DEFAULT_PHOTO_OFFSET,
  OUTPUT_RATIOS,
  OVERLAY_STYLES,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
  PHOTO_PAN_SCALE,
  PhotoOffset,
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
  /** 写真の表示位置オフセット（-1〜1、0が中央）。ドラッグで変更される。 */
  photoOffset?: PhotoOffset;
  /** ドラッグ操作で位置が変わるたびに呼ばれる */
  onPhotoOffsetChange?: (offset: PhotoOffset) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
    photoOffset = DEFAULT_PHOTO_OFFSET,
    onPhotoOffsetChange,
  } = props;

  const palette = OVERLAY_STYLES[styleKey];
  const ratioConfig = OUTPUT_RATIOS.find((r) => r.key === ratio) ?? OUTPUT_RATIOS[0];
  const aspectStyle = ratioConfig.aspect ? { aspectRatio: ratioConfig.aspect } : { aspectRatio: 1 };

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const maxShiftX = (containerSize.width * (PHOTO_PAN_SCALE - 1)) / 2;
  const maxShiftY = (containerSize.height * (PHOTO_PAN_SCALE - 1)) / 2;

  // PanResponderは初回のみ生成されるため、内部で参照する値はrefで常に最新化する
  const photoUriRef = useRef(photoUri);
  photoUriRef.current = photoUri;
  const onOffsetChangeRef = useRef(onPhotoOffsetChange);
  onOffsetChangeRef.current = onPhotoOffsetChange;
  const offsetRef = useRef(photoOffset);
  offsetRef.current = photoOffset;
  const maxShiftRef = useRef({ x: maxShiftX, y: maxShiftY });
  maxShiftRef.current = { x: maxShiftX, y: maxShiftY };
  const dragStartOffset = useRef<PhotoOffset>(photoOffset);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!photoUriRef.current && !!onOffsetChangeRef.current,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        !!photoUriRef.current &&
        !!onOffsetChangeRef.current &&
        (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
      onPanResponderGrant: () => {
        dragStartOffset.current = offsetRef.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        const onOffsetChange = onOffsetChangeRef.current;
        if (!onOffsetChange) return;
        const { x: mx, y: my } = maxShiftRef.current;
        const nextX =
          mx > 0 ? clamp(dragStartOffset.current.x + gesture.dx / mx, -1, 1) : dragStartOffset.current.x;
        const nextY =
          my > 0 ? clamp(dragStartOffset.current.y + gesture.dy / my, -1, 1) : dragStartOffset.current.y;
        onOffsetChange({ x: nextX, y: nextY });
      },
    })
  ).current;

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
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
      style={[styles.card, aspectStyle, { backgroundColor: palette.gradientFrom }]}>
      {photoUri ? (
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          <Image
            source={{ uri: photoUri }}
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [
                  { translateX: photoOffset.x * maxShiftX },
                  { translateY: photoOffset.y * maxShiftY },
                  { scale: PHOTO_PAN_SCALE },
                ],
              },
            ]}
            resizeMode="cover"
          />
        </View>
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
