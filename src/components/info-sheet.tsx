import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

/**
 * 説明・ヘルプ用のボトムシート。SelectModal と同じ見た目に揃えている。
 * 表示状態は呼び出し側が制御する（visible / onClose）。
 */
export function InfoSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.sheet, { backgroundColor: colors.backgroundElement }]}
      >
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/** InfoSheet 内で使う番号付きの手順ステップ */
export function InfoStep({ index, children }: { index: number; children: ReactNode }) {
  const colors = useTheme();
  return (
    <View style={styles.step}>
      <View style={[styles.stepBadge, { backgroundColor: colors.accent }]}>
        <Text style={[styles.stepBadgeText, { color: colors.onAccent }]}>
          {index}
        </Text>
      </View>
      <Text style={[styles.stepText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

/** InfoSheet 内の補足テキスト */
export function InfoNote({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return (
    <Text style={[styles.note, { color: colors.textSecondary }]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 15, fontWeight: "600", flexShrink: 1, marginRight: 8 },
  body: { paddingHorizontal: 18 },
  bodyContent: { paddingVertical: 18, paddingBottom: 28 },
  step: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  stepBadgeText: { fontSize: 12, fontWeight: "700" },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21 },
  note: { fontSize: 13, lineHeight: 19, marginTop: 4 },
});
