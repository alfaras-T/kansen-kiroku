import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * オン・オフの切り替え。
 *
 * React Native 標準の Switch は使っていない。プラットフォームごとに
 * 色の扱いが違い、trackColor を指定してもiOSの既定色(緑)が出てしまう
 * 場面があるため。緑はこのアプリのどの配色とも無関係な色で、球団を
 * 切り替えても常に緑が残るのは具合が悪い。
 *
 * オンのときは球団カラー、オフのときは白の薄い帯にする。ただし色だけに
 * 判別を委ねない。つまみの左右位置が常に状態を示すので、色の明度が近い
 * 配色でも、色覚に依存する人でも読み取れる。
 *
 * つまみの色は onAccent と白を切り替える。onAccent は「アクセント色の上に
 * 載せる色」として定義されているので、ホークスの黄のような明るい球団でも
 * つまみが埋もれない。オフのときは帯が暗いので白に戻す。
 */

const TRACK_W = 46;
const TRACK_H = 28;
const THUMB = 22;
const PAD = (TRACK_H - THUMB) / 2;

const TRACK_OFF = 'rgba(255,255,255,0.13)';
const THUMB_OFF = '#FFFFFF';

export function ToggleSwitch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [TRACK_OFF, colors.accent],
            }),
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, TRACK_W - THUMB - PAD * 2],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.thumbInner,
              {
                backgroundColor: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [THUMB_OFF, colors.onAccent],
                }),
              },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: PAD,
    justifyContent: 'center',
  },
  thumb: { width: THUMB, height: THUMB },
  thumbInner: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    // つまみを地から浮かせる。オフのとき、暗い帯の上でも輪郭が残る
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
