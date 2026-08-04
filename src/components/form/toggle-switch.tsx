import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

/**
 * オン・オフの切り替え。
 *
 * React Native 標準の Switch は使っていない。プラットフォームごとに
 * 色の扱いが違い、trackColor を指定してもiOSの既定色(緑)が出てしまう
 * 場面があるため。緑はこのアプリのどの配色とも無関係な色で、球団を
 * 切り替えても常に緑が残るのは具合が悪い。
 *
 * 判別の手掛かりは **濃淡とつまみの左右位置** だけにしている。
 * 色は白の不透明度だけで作るので、地の色が何であっても同じ濃淡差になり、
 * 球団カラーの明度に左右されない。色覚にも依存しない。
 */

const TRACK_W = 46;
const TRACK_H = 28;
const THUMB = 22;
const PAD = (TRACK_H - THUMB) / 2;

const TRACK_ON = 'rgba(255,255,255,0.45)';
const TRACK_OFF = 'rgba(255,255,255,0.13)';

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
              outputRange: [TRACK_OFF, TRACK_ON],
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
          <View style={styles.thumbInner} />
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
    backgroundColor: '#FFFFFF',
    // つまみを地から浮かせる。オフのとき、暗い帯の上でも輪郭が残る
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
