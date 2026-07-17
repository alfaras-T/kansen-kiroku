import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { useLatestRef } from '@/hooks/use-latest-ref';

export interface SliderProps {
  /** 0〜1に正規化された現在値 */
  value: number;
  onChange: (value: number) => void;
  trackColor: string;
  fillColor: string;
  knobColor: string;
}

/**
 * ネイティブ依存なしのシンプルなドラッグ式スライダー。
 * PanResponderで実装しているため、Web/iOS/Androidすべてで同じ挙動になる。
 *
 * 見た目のバー(track)自体はスリムだが、実際にタッチを検知する当たり判定(hitArea)は
 * 上下に大きく広げてある。見た目通りの細い線にしか反応しないと指で正確に狙う必要が
 * あり操作しづらくなるため、指が多少バーから外れていても掴めるようにしている。
 */
export function Slider({ value, onChange, trackColor, fillColor, knobColor }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  // PanResponderは初回生成時のクロージャを使い続けるため、最新値はrefで参照する
  const widthRef = useLatestRef(trackWidth);
  const onChangeRef = useLatestRef(onChange);

  function updateFromLocationX(x: number) {
    const w = widthRef.current;
    if (w <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    onChangeRef.current(ratio);
  }

  // PanResponderはフック以前からあるAPIのため、生成・参照時に厳密なreact-hooks/refsルールと
  // 衝突する。値は常にuseLatestRef経由の最新refを読むため、ここでの一度きりの生成は安全。
  const panResponderRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (panResponderRef.current === null) {
    // eslint-disable-next-line react-hooks/refs -- PanResponder.create is a stable, one-time factory
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      // ドラッグ中に他のジェスチャー(写真のパン操作など)へ横取りされないようにする
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => updateFromLocationX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateFromLocationX(evt.nativeEvent.locationX),
    });
  }
  const panResponder = panResponderRef.current;

  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={styles.hitArea}
      hitSlop={{ top: 12, bottom: 12 }}
      // eslint-disable-next-line react-hooks/refs -- panHandlers is a stable object of event callbacks
      {...panResponder.panHandlers}>
      <View pointerEvents="none" style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.fill, { backgroundColor: fillColor, width: `${clamped * 100}%` }]} />
        <View style={[styles.knob, { backgroundColor: knobColor, left: `${clamped * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 実際にタッチを検知する領域。見た目のtrackより上下に広く取ることで掴みやすくする
  hitArea: {
    justifyContent: 'center',
    paddingVertical: 14,
  },
  track: {
    height: 6,
    borderRadius: 3,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  knob: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    marginTop: -7,
  },
});
