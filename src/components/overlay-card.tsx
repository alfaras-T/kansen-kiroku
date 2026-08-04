import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { CardText } from '@/components/card-text';

import { resolveTelopTeamColor } from '@/constants/teamThemes';
import { useFavoriteTeamOptional } from '@/contexts/favorite-team';
import {
  DEFAULT_PHOTO_OFFSET,
  DEFAULT_PHOTO_SCALE,
  DEFAULT_TELOP_SCALE,
  MAX_PHOTO_SCALE,
  MIN_PHOTO_SCALE,
  OVERLAY_STYLES,
  OutputRatio,
  OverlayPosition,
  OverlayStyleKey,
  OverlayTelopSizes,
  PhotoOffset,
  resolveOverlayAspect,
} from '@/constants/overlayStyles';
import { useLatestRef } from '@/hooks/use-latest-ref';

export interface OverlayCardProps {
  photoUri: string | null;
  /**
   * マイチームの判定を外から差し替える。オンボーディングのように、
   * まだ保存されていない「選択中のチーム」で見本を出したい場面で使う。
   * 未指定なら保存済みの設定に従う。
   */
  previewMyTeam?: string;
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
  /**
   * ISO形式(YYYY-MM-DD)の日付。プリセットによって表記を変えるために使う。
   * 未指定なら dateLabel をそのまま出す。
   */
  dateIso?: string;
  stadium: string;
  memo: string;
  winHighlight: boolean;
  /** 球団カラーを使うか。false ならプリセットの既定色のまま */
  useTeamColor?: boolean;
  /** 写真の表示位置オフセット（-1〜1、0が中央）。ドラッグで変更される。 */
  photoOffset?: PhotoOffset;
  /** ドラッグ操作で位置が変わるたびに呼ばれる */
  onPhotoOffsetChange?: (offset: PhotoOffset) => void;
  /** 写真の拡大率（1.0が最小=フレームにフィットした状態）。スライダーで変更される。 */
  photoScale?: number;
  /** 拡大率が変わるたびに呼ばれる（ダブルタップでのリセット時など） */
  onPhotoScaleChange?: (scale: number) => void;
  /** テロップ(日付・スコア・球場等のテキストブロック)の拡大率。1.0が等倍(=挿入時の元のサイズ)。 */
  telopScale?: number;
  /** 外側から幅/高さ等を指定して当てはめたい場合のスタイル上書き（例: 画面に収める全画面レイアウト） */
  style?: ViewStyle;
  /**
   * テロップのフォントサイズや余白は固定pt値で指定されているため、
   * 画面プレビューよりずっと大きい/小さいサイズでこのカードを描画する場合
   * (例: 書き出し専用の高解像度View)、この値にカード幅の比率
   * (例: 書き出し幅 ÷ プレビュー幅)を渡すことで、見た目の比率をプレビューと揃える。
   * 未指定時は1(=固定pt値のまま)。
   */
  scaleFactor?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ドラッグ操作の感度倍率。1だと指の移動量にそのまま比例、大きいほど
// 少しの指の移動で大きく位置が動く。
const PAN_SENSITIVITY = 2.5;
// ピンチ操作の感度倍率。1だと指の距離変化にそのまま比例、大きいほど
// 少しの指の動きで大きくズームする。
const PINCH_SENSITIVITY = 3.5;
// ダブルタップと判定する最大間隔(ms)・最大移動量(px)
const DOUBLE_TAP_MAX_INTERVAL_MS = 300;
const TAP_MAX_MOVEMENT_PX = 10;

function touchDistance(touches: { pageX: number; pageY: number }[]): number {
  const [a, b] = touches;
  const dx = b.pageX - a.pageX;
  const dy = b.pageY - a.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

export const OverlayCard = forwardRef<View, OverlayCardProps>(function OverlayCard(props, ref) {
  const {
    photoUri,
    previewMyTeam,
    photoAspectRatio,
    ratio,
    position,
    styleKey,
    visitorCode,
    homeCode,
    visitorScore,
    homeScore,
    winHighlight,
    useTeamColor = true,
    memo,
    stadium,
    dateLabel,
    dateIso,
    photoOffset = DEFAULT_PHOTO_OFFSET,
    onPhotoOffsetChange,
    photoScale = DEFAULT_PHOTO_SCALE,
    onPhotoScaleChange,
    telopScale = DEFAULT_TELOP_SCALE,
    style: styleOverride,
    scaleFactor = 1,
  } = props;

  // テロップの角からの余白(20)は固定pt値なので、scaleFactorに合わせて拡縮し、
  // カードサイズが変わってもプレビューと同じ見た目の比率になるようにする。
  const cornerInset = 20 * scaleFactor;

  // テロップの拡大は transform: scale ではなく、実寸(フォントサイズ・行間・
  // 字間・余白)を掛け算して行う。
  //
  // transform は「一度描画した結果を引き伸ばす」処理なので、書き出し用カード
  // (プレビューの約8〜9倍の大きさ)では文字が小さいまま描かれてから拡大され、
  // 輪郭がぼやける。写真は元から高解像度なので鮮明なままで、結果として
  // 「テロップだけ解像度が低い」状態になっていた。
  // 実寸を変えればその大きさで文字が描き直されるため、輪郭が保たれる。
  const telopFactor = telopScale * scaleFactor;
  const sc = (v: number) => v * telopFactor;
  // プリセットごとのテロップの階層。既定はスコアが最大だが、'スタンプ'のように
  // 日付を主役に据える構成も選べるようにしている。
  const telopSizes: OverlayTelopSizes = OVERLAY_STYLES[styleKey].sizes ?? {};
  /** 要素ごとの倍率を掛けた上で、書き出し用の拡大率を掛ける */
  const scOf = (key: keyof OverlayTelopSizes, v: number) =>
    sc(v * (telopSizes[key] ?? 1));

  const telopStyles = {
    scoreRow: { marginTop: scOf('score', 3) },
    code: {
      fontSize: scOf('code', 21),
      lineHeight: scOf('code', 24),
      letterSpacing: scOf('code', 1.5),
      maxWidth: scOf('code', 120),
    },
    score: {
      fontSize: scOf('score', 34),
      lineHeight: scOf('score', 36),
      letterSpacing: scOf('score', 1),
      marginHorizontal: scOf('score', 7),
    },
    scoreDash: { fontSize: scOf('score', 22), lineHeight: scOf('score', 36) },
    dateLine: {
      fontSize: scOf('date', 10.5),
      lineHeight: scOf('date', 14),
      letterSpacing: scOf('date', 3.5),
    },
    divider: {
      width: sc(30),
      height: sc(StyleSheet.hairlineWidth * 2),
      marginTop: sc(3),
      marginBottom: sc(4),
    },
    stadiumLine: {
      fontSize: scOf('stadium', 10),
      lineHeight: scOf('stadium', 13.5),
      letterSpacing: scOf('stadium', 2),
    },
    inlineText: {
      fontSize: scOf('date', 10),
      lineHeight: scOf('date', 14),
      letterSpacing: scOf('date', 1.6),
    },
    memo: {
      fontSize: scOf('memo', 10.5),
      lineHeight: scOf('memo', 14),
      letterSpacing: scOf('memo', 1),
      marginTop: scOf('memo', 3),
    },
  };

  const palette = OVERLAY_STYLES[styleKey];

  // 日付と区切り線だけを自チームカラーにする。
  //
  // 色を付けるのはマイチームが出場している試合のみ。他球団同士の試合を
  // 観に行くことは珍しくなく、そこで自分の色を着ていると場違いに見える。
  // 出場時だけ色づくようにすると、色が「自分のチームの試合だった」という
  // 情報を持つようになり、ただの装飾ではなくなる。
  //
  // 判定は favoriteTeam(配色用)ではなく myTeam(成績集計用)で行う。
  // 「自分の試合か」の定義は勝率集計と揃っている必要があるため。
  //
  // プレビューと書き出しで色が食い違うと事故になるため、呼び出し側から
  // propsで渡すのではなく、この中で解決して全ての描画箇所を一致させる。
  //
  // ミニマルは「色を一切足さず、どんな写真も邪魔しない」ことが主旨の
  // プリセットなので対象外。球団色を使いたくない人はこれを選べばよく、
  // 設定項目を増やさずに済む。
  const favoriteTeamCtx = useFavoriteTeamOptional();
  const myTeam = previewMyTeam ?? favoriteTeamCtx?.myTeam ?? '';
  // 自由入力のチーム名は球団コードと一致しないため、自然と対象外になる
  // (アマチュアの試合などを記録した場合)。
  const myTeamIsPlaying =
    !!myTeam && (visitorCode === myTeam || homeCode === myTeam);
  const telopTeamColor =
    !useTeamColor || styleKey === 'minimal' || !myTeamIsPlaying
      ? null
      : resolveTelopTeamColor(myTeam);
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
  const scaleRef = useLatestRef(photoScale);
  const maxShiftRef = useLatestRef({ x: maxShiftX, y: maxShiftY });
  const dragStartOffset = useRef<PhotoOffset>(photoOffset);
  const pinchStartDistance = useRef(0);
  const pinchStartScale = useRef(photoScale);
  const lastTouchCount = useRef(0);
  const lastTapTime = useRef(0);

  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (panResponderRef.current === null) {
    const handleTouches = (evt: GestureResponderEvent, gesture: PanResponderGestureState) => {
      const touches = evt.nativeEvent.touches;

      if (touches.length >= 2) {
        const dist = touchDistance(touches);
        if (lastTouchCount.current < 2) {
          pinchStartDistance.current = dist;
          pinchStartScale.current = scaleRef.current;
        } else if (pinchStartDistance.current > 0) {
          const onScaleChange = onScaleChangeRef.current;
          if (onScaleChange) {
            const rawRatio = dist / pinchStartDistance.current;
            // 指の距離変化からのズレを感度倍率で増幅し、少しの動きでも大きくズームさせる
            const amplifiedRatio = 1 + (rawRatio - 1) * PINCH_SENSITIVITY;
            onScaleChange(clamp(pinchStartScale.current * amplifiedRatio, MIN_PHOTO_SCALE, MAX_PHOTO_SCALE));
          }
        }
      } else {
        if (lastTouchCount.current >= 2) {
          // 2本指→1本指に切り替わった直後は基準位置を取り直す
          dragStartOffset.current = offsetRef.current;
        }
        const onOffsetChange = onOffsetChangeRef.current;
        if (onOffsetChange) {
          const { x: mx, y: my } = maxShiftRef.current;
          // 指の移動量を感度倍率で増幅してから反映する
          const ampDx = gesture.dx * PAN_SENSITIVITY;
          const ampDy = gesture.dy * PAN_SENSITIVITY;
          const nextX = mx > 0 ? clamp(dragStartOffset.current.x + ampDx / mx, -1, 1) : 0;
          const nextY = my > 0 ? clamp(dragStartOffset.current.y + ampDy / my, -1, 1) : 0;
          onOffsetChange({ x: nextX, y: nextY });
        }
      }
      lastTouchCount.current = touches.length;
    };

    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => !!photoUriRef.current,
      onMoveShouldSetPanResponder: (evt, gesture) =>
        !!photoUriRef.current &&
        (evt.nativeEvent.touches.length >= 2 || Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
      onPanResponderGrant: (evt) => {
        dragStartOffset.current = offsetRef.current;
        lastTouchCount.current = 0;
        if (evt.nativeEvent.touches.length >= 2) {
          pinchStartDistance.current = touchDistance(evt.nativeEvent.touches);
          pinchStartScale.current = scaleRef.current;
        }
      },
      onPanResponderMove: handleTouches,
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

  // 勝敗ハイライト: OFFのときは両スコアとも本文色。
  // ONのときは勝者側だけ差し色にし、敗者側を沈ませる（同点なら変化なし）。
  let vColor = palette.body;
  let hColor = palette.body;
  if (winHighlight) {
    const v = Number(visitorScore);
    const h = Number(homeScore);
    if (v > h) {
      vColor = palette.accent;
      hColor = palette.dim;
    } else if (h > v) {
      hColor = palette.accent;
      vColor = palette.dim;
    }
  }

  // 影も実寸に合わせる。固定値のままだと、拡大された文字に対して
  // 影だけが相対的に細くなり、輪郭の締まりが失われる。
  const textShadow = {
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: sc(1) },
    textShadowRadius: sc(6),
  };

  const dateColor = telopTeamColor ?? palette.accent;

  /**
   * フィルムカメラの焼き込み表記。「26 6 14」のように、西暦を2桁にして
   * 月日をゼロ埋めせずに並べる。当時のコンパクトカメラの表示に倣ったもの。
   *
   * 頭のアポストロフィは付けない。7セグメント書体(DSEG7)は数字と一部の
   * 記号しか持たず、アポストロフィが収録されていないため。実機の焼き込みも
   * 記号を持たない表示器が多く、数字だけの方がむしろ忠実になる。
   */
  const dateText =
    palette.dateStamp && dateIso
      ? (() => {
          const [y, m, d] = dateIso.split('-');
          if (!y || !m || !d) return dateLabel;
          return `${y.slice(2)} ${Number(m)} ${Number(d)}`;
        })()
      : dateLabel;

  /**
   * 日付の影。フィルムでは落ち影ではなく、文字と同じ色を四方に滲ませて
   * 「発光して焼き込まれている」ように見せる。
   * 球団カラーが入っている場合もその色で光るので、印象が破綻しない。
   */
  // 7セグメント書体は数字と記号しか持たないため、フィルムの日付表記
  // (「26 8 3」)にだけ使う。日本語や曜日には当てられない。
  const dateFont = palette.dateStamp ? { fontFamily: 'DSEG7Classic' } : null;

  const dateShadow = palette.dateGlow
    ? {
        textShadowColor: dateColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: sc(5),
      }
    : textShadow;

  // 縁取り(セカンドカラーで文字を囲む方式)は廃止した。細い文字では縁が
  // 効かず、にじんで見えるだけだったため。可読性は resolveTelopTeamColor が
  // 「色相を保ったまま明度を上げる」ことで確保している。

  // 写真とテキストの間に敷くスクリム(グラデーション)。テロップのある側の端から
  // 透明に抜けていく。テキストの視認性を上げつつ写真の雰囲気を壊さない、
  // ポスターや映画の字幕帯と同じ手法。
  //
  // 以前は高さ46%の別Viewとして敷いていたが、この方式だと写真の途中(46%地点)に
  // グラデーションViewの「境界」が生まれる。Web版のcaptureRef(html2canvas)は
  // この種の半透明要素の境界を合成する際に1px幅の濃い横線(継ぎ目)を描いてしまう
  // (46%の位置をずらしても継ぎ目もそのまま一緒に移動することで確認済み。
  // 端数pxの丸め問題ではなく、要素の境界自体がhtml2canvas側の合成バグを誘発していた)。
  // そのため、Viewの高さ自体はカード全面(写真の上端〜下端)に広げ、
  // locationsで色の変化だけを46%地点で完了させることで、写真の途中に
  // 要素の境界が来ないようにする。これならViewの境界は常にカードの外周
  // (=写真自体の境界)と一致し、そこは元々問題なく描画できている。
  const SCRIM_STOP_RATIO = 0.46;
  const scrimColors = isBottom
    ? (['transparent', 'transparent', palette.scrim] as const)
    : ([palette.scrim, 'transparent', 'transparent'] as const);
  const scrimLocations = isBottom
    ? ([0, 1 - SCRIM_STOP_RATIO, 1] as const)
    : ([0, SCRIM_STOP_RATIO, 1] as const);

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
                width: effectiveWidth || '100%',
                height: effectiveHeight || '100%',
                left:
                  containerSize.width > 0
                    ? (containerSize.width - effectiveWidth) / 2 + photoOffset.x * maxShiftX
                    : 0,
                top:
                  containerSize.height > 0
                    ? (containerSize.height - effectiveHeight) / 2 + photoOffset.y * maxShiftY
                    : 0,
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

      {photoUri && (
        <LinearGradient
          pointerEvents="none"
          colors={scrimColors}
          locations={scrimLocations}
          style={StyleSheet.absoluteFill}
        />
      )}


      <View
        pointerEvents="none"
        style={[
          styles.overlayBlock,
          isBottom ? { bottom: cornerInset } : { top: cornerInset },
          isRight ? { right: cornerInset } : { left: cornerInset },
          // 角(bottom/right など)を基準に絶対配置しているため、実寸が
          // 大きくなってもテロップの基準位置はその角に固定されたままになる。
          // transformOrigin による支点指定はもう不要。
        ]}>
        {palette.inline ? (
          /*
            フィルムの一列構成。日付・スコア・球場を同じ大きさ・同じ色で
            横一列に並べる。実際のフィルムカメラの焼き込みは、要素ごとに
            大小や色の差を付けず、ただ一列に文字が並ぶだけだった。
            勝敗ハイライトも効かせない。色の差が付いた時点で
            「デザインされたテロップ」に見えてしまうため。
          */
          <View style={[styles.inlineRow, { gap: sc(9) }]}>
            <CardText
              style={[
                styles.inlineText,
                telopStyles.inlineText,
                dateFont,
                dateShadow,
                { color: dateColor },
              ]}
              numberOfLines={1}>
              {dateText}
            </CardText>
            <CardText
              style={[
                styles.inlineText,
                telopStyles.inlineText,
                dateShadow,
                { color: dateColor },
              ]}
              numberOfLines={1}>
              {visitorCode} {visitorScore}-{homeScore} {homeCode}
            </CardText>
            {!!stadium && (
              <CardText
                style={[
                  styles.inlineText,
                  telopStyles.inlineText,
                  dateShadow,
                  { color: dateColor, flexShrink: 1 },
                ]}
                numberOfLines={1}>
                {stadium}
              </CardText>
            )}
          </View>
        ) : (
          <>
            <CardText
              style={[
                styles.dateLine,
                telopStyles.dateLine,
                dateFont,
                dateShadow,
                { color: dateColor },
              ]}
              numberOfLines={1}>
              {dateText}
            </CardText>

            <View style={[styles.scoreRow, telopStyles.scoreRow]}>
              <CardText
                style={[styles.code, telopStyles.code, textShadow, { color: palette.body }]}
                numberOfLines={1}>
                {visitorCode}
              </CardText>
              <CardText style={[styles.score, telopStyles.score, textShadow, { color: vColor }]}>
                {visitorScore}
              </CardText>
              <CardText style={[styles.scoreDash, telopStyles.scoreDash, textShadow, { color: palette.dim }]}>
                –
              </CardText>
              <CardText style={[styles.score, telopStyles.score, textShadow, { color: hColor }]}>
                {homeScore}
              </CardText>
              <CardText
                style={[styles.code, telopStyles.code, textShadow, { color: palette.body }]}
                numberOfLines={1}>
                {homeCode}
              </CardText>
            </View>

            <View
              style={[
                styles.divider,
                telopStyles.divider,
                { backgroundColor: telopTeamColor ?? palette.divider },
              ]}
            />

            <CardText
              style={[styles.stadiumLine, telopStyles.stadiumLine, textShadow, { color: palette.caption }]}
              numberOfLines={1}>
              {stadium}
            </CardText>
          </>
        )}

        {!!memo && (
          <CardText
            style={[styles.memo, telopStyles.memo, textShadow, { color: palette.caption }]}
            numberOfLines={1}>
            {memo}
          </CardText>
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
  inlineRow: { flexDirection: "row", alignItems: "baseline" },
  inlineText: { fontWeight: "600" },
  overlayBlock: {
    position: 'absolute',
    maxWidth: '88%',
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 3,
  },
  code: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 21,
    lineHeight: 24,
    letterSpacing: 1.5,
    flexShrink: 1,
    maxWidth: 120,
  },
  score: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: 1,
    marginHorizontal: 7,
  },
  scoreDash: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    lineHeight: 36,
  },
  dateLine: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 3.5,
  },
  divider: {
    width: 30,
    // 縁取りの分だけ厚みを持たせる(内側の線 + 上下の縁)
    height: StyleSheet.hairlineWidth * 2,
    marginTop: 3,
    marginBottom: 4,
  },
  stadiumLine: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 2.5,
  },
  memo: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 3,
    opacity: 0.85,
  },
});
