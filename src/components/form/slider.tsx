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
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => updateFromLocationX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateFromLocationX(evt.nativeEvent.locationX),
    });
  }
  const panResponder = panResponderRef.current;

  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: trackColor }]}
      // eslint-disable-next-line react-hooks/refs -- panHandlers is a stable object of event callbacks
      {...panResponder.panHandlers}>
      <View style={[styles.fill, { backgroundColor: fillColor, width: `${clamped * 100}%` }]} />
      <View
        pointerEvents="none"
        style={[styles.knob, { backgroundColor: knobColor, left: `${clamped * 100}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    marginTop: -6,
  },
});
