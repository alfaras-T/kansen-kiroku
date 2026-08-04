import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { useTheme } from "@/hooks/use-theme";

/**
 * 設定を開く歯車。記録・履歴の各画面の右上に置く。
 *
 * 設定をタブに並べていたが、記録・履歴が「日々使うもの」なのに対し、設定は
 * 一度決めたら滅多に触らない。使用頻度の違うものを同じ列に同じ重さで並べる
 * のは不自然だった。画面の隅に退かせる。
 */
export function SettingsButton() {
  const router = useRouter();
  const colors = useTheme();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="設定を開く"
      style={styles.btn}
    >
      <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
});
