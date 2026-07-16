import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  MIN_PHOTO_SCALE,
  OVERLAY_STYLES,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
  PhotoOffset,
  resolveOverlayAspect,
} from '@/constants/overlayStyles';
import { useLatestRef } from '@/hooks/use-latest-ref';

export interface OverlayCardProps {
  photoUri: string | null;
  /** 写真の元の横/縦比（幅÷高さ）。「元の写真のまま」表示時に使う。 */
  photoAspectRatio?: number | null;
  ratio: OutputRatio;
  position: OverlayPosition;
  styleKey: OverlayStyleKey;
  visitorCode: string;
  homeCode: string;
  visitorScore: string;
  homeScore: string;
  dateLabel: string;
  stadium: string;
  isDraw: boolean;
  isExtra: boolean;
  extraInning: string;
  memo: string;
  winHighlight: boolean;
  /** 写真の表示位置オフセット（-1〜1、0が中央）。ドラッグで変更される。 */
  photoOffset?: PhotoOffset;
  /** ドラッグ操作で位置が変わるたびに呼ばれる */
  onPhotoOffsetChange?: (offset: PhotoOffset) => void;
  /** 写真の拡大率（1.0が最小=フレームにフィットした状態）。スライダーで変更される。 */
  photoScale?: number;
  /** 拡大率が変わるたびに呼ばれる（ダブルタップでのリセット時など） */
  onPhotoScaleChange?: (scale: number) => void;
  /** 外側から幅/高さ等を指定して当てはめたい場合のスタイル上書き（例: 画面に収める全画面レイアウト） */
  style?: ViewStyle;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ドラッグ操作の感度倍率。1だと指の移動量にそのまま比例、大きいほど
// 少しの指の移動で大きく位置が動く。
const PAN_SENSITIVITY = 2.5;
// ダブルタップと判定する最大間隔(ms)・最大移動量(px)
const DOUBLE_TAP_MAX_INTERVAL_MS = 300;
const TAP_MAX_MOVEMENT_PX = 10;

function buildCaption(props: OverlayCardProps): string {
  let caption = `${props.dateLabel}  ${props.stadium}`.trim();
  if (props.isDraw) caption += ' ・引き分け';
  else if (props.isExtra) caption += ` ・延長${props.extraInning}回`;
  return caption;
}

export const OverlayCard = forwardRef<View, OverlayCardProps>(function OverlayCard(props, ref) {
  const {
    photoUri,
    photoAspectRatio,
    ratio,
    position,
    styleKey,
    visitorCode,
    homeCode,
    visitorScore,
    homeScore,
    isDraw,
    winHighlight,
    memo,
    photoOffset = DEFAULT_PHOTO_OFFSET,
    onPhotoOffsetChange,
    photoScale = DEFAULT_PHOTO_SCALE,
    onPhotoScaleChange,
    style: styleOverride,
  } = props;

  const palette = OVERLAY_STYLES[styleKey];
  // 「元の写真のまま」の場合は写真自体の縦横比を使う。
  // 写真が無い/縦横比が未取得の場合のみ1:1にフォールバックする。
  const frameAspect = resolveOverlayAspect(ratio, photoAspectRatio);
  const aspectStyle = { aspectRatio: frameAspect };

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 写真自体の縦横比とフレームの縦横比が異なる場合、フレームいっぱいに
  // 覆うには写真をどれだけ拡大する必要があるかを計算する（CSSのbackground-size: coverと同じ考え方）。
  // photoScale = 1(最小)のときにちょうどこの倍率になり、フレームに余白は出ない。
  const imgAspect = photoAspectRatio ?? frameAspect;
  let containW = containerSize.width;
  let containH = containerSize.width / imgAspect;
  if (containerSize.width > 0 && containerSize.height > 0 && containH < containerSize.height) {
    containH = containerSize.height;
    containW = containerSize.height * imgAspect;
  }
  const coverScaleBase =
    containW > 0 && containH > 0
      ? Math.max(containerSize.width / containW, containerSize.height / containH)
      : 1;
  const totalScale = coverScaleBase * photoScale;
  const effectiveWidth = containW * totalScale;
  const effectiveHeight = containH * totalScale;
  const maxShiftX = Math.max(0, (effectiveWidth - containerSize.width) / 2);
  const maxShiftY = Math.max(0, (effectiveHeight - containerSize.height) / 2);

  // PanResponderは初回のみ生成されるため、内部で参照する値はrefで常に最新化する
  const photoUriRef = useLatestRef(photoUri);
  const onOffsetChangeRef = useLatestRef(onPhotoOffsetChange);
  const onScaleChangeRef = useLatestRef(onPhotoScaleChange);
  const offsetRef = useLatestRef(photoOffset);
  const maxShiftRef = useLatestRef({ x: maxShiftX, y: maxShiftY });
  const dragStartOffset = useRef<PhotoOffset>(photoOffset);
  const lastTapTime = useRef(0);

  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (panResponderRef.current === null) {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => !!photoUriRef.current,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        !!photoUriRef.current && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
      onPanResponderGrant: () => {
        dragStartOffset.current = offsetRef.current;
      },
      onPanResponderMove: (_evt, gesture) => {
        const onOffsetChange = onOffsetChangeRef.current;
        if (!onOffsetChange) return;
        const { x: mx, y: my } = maxShiftRef.current;
        // 指の移動量を感度倍率で増幅してから反映する
        const ampDx = gesture.dx * PAN_SENSITIVITY;
        const ampDy = gesture.dy * PAN_SENSITIVITY;
        const nextX = mx > 0 ? clamp(dragStartOffset.current.x + ampDx / mx, -1, 1) : 0;
        const nextY = my > 0 ? clamp(dragStartOffset.current.y + ampDy / my, -1, 1) : 0;
        onOffsetChange({ x: nextX, y: nextY });
      },
      onPanResponderRelease: (_evt, gesture) => {
        // 指をほぼ動かさずに離した = タップ。300ms以内の2回目のタップならダブルタップとして
        // 「最小サイズ・中央位置」にリセットする。
        const wasTap =
          Math.abs(gesture.dx) < TAP_MAX_MOVEMENT_PX && Math.abs(gesture.dy) < TAP_MAX_MOVEMENT_PX;
        if (wasTap) {
          const now = Date.now();
          if (now - lastTapTime.current < DOUBLE_TAP_MAX_INTERVAL_MS) {
            onScaleChangeRef.current?.(MIN_PHOTO_SCALE);
            onOffsetChangeRef.current?.({ x: 0, y: 0 });
            lastTapTime.current = 0;
          } else {
            lastTapTime.current = now;
          }
        }
      },
    });
  }
  const panResponder = panResponderRef.current;

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
      style={[styles.card, styles.photoTouchArea, aspectStyle, { backgroundColor: palette.gradientFrom }, styleOverride]}>
      {photoUri ? (
        <View style={[StyleSheet.absoluteFill, styles.photoTouchArea]} {...panResponder.panHandlers}>
          <Image
            source={{ uri: photoUri }}
            style={[
              styles.photoImage,
              {
                width: containW || '100%',
                height: containH || '100%',
                left: containerSize.width > 0 ? (containerSize.width - containW) / 2 : 0,
                top: containerSize.height > 0 ? (containerSize.height - containH) / 2 : 0,
                transform: [
                  { translateX: photoOffset.x * maxShiftX },
                  { translateY: photoOffset.y * maxShiftY },
                  { scale: totalScale },
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
        pointerEvents="none"
        style={[
          styles.overlayBlock,
          isBottom ? { bottom: 18 } : { top: 18 },
          isRight ? { right: 18, alignItems: 'flex-end' } : { left: 18, alignItems: 'flex-start' },
        ]}>
        <View style={styles.scoreRow}>
          <Text style={[styles.code, textShadow, { color: palette.body }]} numberOfLines={1}>
            {visitorCode}
          </Text>
          <Text style={[styles.score, textShadow, { color: vColor }]}> {visitorScore}</Text>
          <Text style={[styles.score, textShadow, { color: palette.dim }]}> – </Text>
          <Text style={[styles.score, textShadow, { color: hColor }]}>{homeScore} </Text>
          <Text style={[styles.code, textShadow, { color: palette.body }]} numberOfLines={1}>
            {homeCode}
          </Text>
        </View>

        <Text style={[styles.caption, textShadow, { color: palette.caption }]} numberOfLines={1}>
          {caption}
        </Text>

        {!!memo && (
          <Text style={[styles.memo, textShadow, { color: palette.caption }]} numberOfLines={1}>
            {memo}
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
  photoTouchArea: {
    // Web: ブラウザ標準のスクロール/ピンチズームがこのエリアの操作を奪わないようにする。
    // touchActionはreact-native-webがCSSのtouch-actionに変換する（ネイティブでは無視される）。
    touchAction: 'none',
  } as ViewStyle,
  photoImage: {
    position: 'absolute',
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
    flexShrink: 1,
    maxWidth: 110,
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
